"use client";

import { create } from "zustand";
import {
  createInvitation as createInvitationInDb,
  getInvitationByToken,
  getInvitationsByList,
  deleteInvitation as deleteInvitationInDb,
  declineInvitation as declineInvitationInDb,
  acceptInvitation as acceptInvitationInDb,
  getUserByEmail,
  createNotification,
  getList,
  logTeamActivity,
} from "@/lib/firestore";
import {
  notifyInvitationAccepted,
  notifyInvitationRejected,
} from "@/lib/notify";
import {
  showInAppNotification,
  playNotificationSound,
} from "@/lib/notifications";
import { useListStore } from "./listStore";
import { useTeamStore } from "./teamStore";
import type { Invitation, MemberRole } from "@/types";

interface SendEmailInviteParams {
  listId: string;
  listName: string;
  invitedBy: string;
  inviterName: string;
  email: string;
  role: MemberRole;
}

interface InvitationState {
  invitations: Invitation[];
  isLoading: boolean;
  getInvitation: (token: string) => Promise<Invitation | null>;
  getInvitationsByList: (listId: string) => Promise<Invitation[]>;
  createInvitation: (
    listId: string,
    invitedBy: string,
    defaultRole?: MemberRole,
  ) => Promise<Invitation>;
  sendEmailInvitation: (
    params: SendEmailInviteParams,
  ) => Promise<{ notified: boolean }>;
  deleteInvitation: (id: string) => Promise<void>;
  acceptInvitation: (
    invitation: Invitation,
    userId: string,
    accepterName?: string,
  ) => Promise<void>;
  rejectInvitation: (
    invitation: Invitation,
    userId: string,
    rejecterName?: string,
  ) => Promise<void>;
}

export const useInvitationStore = create<InvitationState>((set, get) => ({
  invitations: [],
  isLoading: false,

  getInvitation: async (token) => {
    return await getInvitationByToken(token);
  },

  getInvitationsByList: async (listId) => {
    return await getInvitationsByList(listId);
  },

  createInvitation: async (listId, invitedBy, defaultRole = "viewer") => {
    console.log("[invitationStore] Creating invitation for list:", listId);

    // Get the list to check if it has a teamId
    const list = await getList(listId);
    const teamId = list?.teamId;

    console.log("[invitationStore] List teamId:", teamId || "none");

    if (!list) throw new Error("List not found");

    const invitationData: Omit<Invitation, "id" | "createdAt"> = {
      type: "list",
      targetId: listId,
      targetName: list.name,
      listId,
      invitedBy,
      defaultRole,
      status: "pending",
      token: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    // Only include teamId if it exists (Firestore doesn't accept undefined)
    if (teamId) {
      invitationData.teamId = teamId;
    }

    const id = await createInvitationInDb(invitationData);

    console.log("[invitationStore] Invitation created with ID:", id);

    return {
      id,
      ...invitationData,
      createdAt: new Date().toISOString(),
    } as Invitation;
  },

  sendEmailInvitation: async ({
    listId,
    listName,
    invitedBy,
    inviterName,
    email,
    role,
  }) => {
    console.log("[invitationStore] Sending email invitation to:", email);

    // Get the list to check if it has a teamId
    const list = await getList(listId);
    const teamId = list?.teamId;

    console.log(
      "[invitationStore] List teamId for email invite:",
      teamId || "none",
    );

    const token = crypto.randomUUID();

    const invitationData: Omit<Invitation, "id" | "createdAt"> = {
      type: "list",
      targetId: listId,
      targetName: listName,
      inviterName,
      listId,
      invitedBy,
      invitedEmail: email.toLowerCase(),
      defaultRole: role,
      status: "pending",
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    // Only include teamId if it exists (Firestore doesn't accept undefined)
    if (teamId) {
      invitationData.teamId = teamId;
    }

    await createInvitationInDb(invitationData);

    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      await createNotification({
        userId: existingUser.id,
        type: "invitation",
        title: `${inviterName} te invitó a "${listName}"`,
        body: `Serás añadido como ${role === "editor" ? "Editor" : "Viewer"}.`,
        read: false,
        status: "pending",
        data: {
          listId,
          listName,
          inviterName,
          role,
          token,
          invitedBy,
        },
      });
      playNotificationSound();
      showInAppNotification(
        `${inviterName} te invitó a "${listName}"`,
        "Toca para ver la invitación",
      );
      return { notified: true };
    }

    await fetch("/api/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        listName,
        inviterName,
        role,
        token,
      }),
    });

    return { notified: false };
  },

  deleteInvitation: async (id) => {
    await deleteInvitationInDb(id);
  },

  acceptInvitation: async (invitation, userId, accepterName) => {
    console.log("[invitationStore] ===== STARTING ACCEPT INVITATION =====");
    console.log("[invitationStore] Invitation ID:", invitation.id);
    console.log("[invitationStore] List ID:", invitation.listId);
    console.log("[invitationStore] Team ID:", invitation.teamId || "none");
    console.log("[invitationStore] User ID:", userId);
    console.log("[invitationStore] Accepter Name:", accepterName);

    // Step 1: Accept the invitation in Firestore (adds user to list + team members)
    console.log("[invitationStore] Step 1: Calling acceptInvitationInDb...");
    await acceptInvitationInDb(invitation, userId);
    console.log(
      "[invitationStore] Step 1: acceptInvitationInDb completed successfully",
    );

    // Step 2: Force refresh lists to include the newly joined list
    // This ensures the list appears immediately in "Shared Lists" without waiting
    console.log("[invitationStore] Step 2: Refreshing lists...");
    try {
      const listStore = useListStore.getState();
      await listStore.refreshLists(userId);
      console.log("[invitationStore] Step 2: Lists refreshed successfully");
    } catch (error) {
      console.error(
        "[invitationStore] Step 2: Failed to refresh lists:",
        error,
      );
      // Don't throw - the subscription should eventually catch up
    }

    // Step 3: If invitation has teamId, refresh teams as well
    if (invitation.teamId) {
      console.log(
        "[invitationStore] Step 3: Refreshing teams (invitation has team)...",
      );
      try {
        const teamStore = useTeamStore.getState();
        await teamStore.refreshTeams(userId);
        console.log("[invitationStore] Step 3: Teams refreshed successfully");
      } catch (error) {
        console.error(
          "[invitationStore] Step 3: Failed to refresh teams:",
          error,
        );
        // Don't throw - the subscription should eventually catch up
      }
    } else {
      console.log(
        "[invitationStore] Step 3: Skipping team refresh (no teamId)",
      );
    }

    if (accepterName && invitation.teamId) {
      await logTeamActivity(invitation.teamId, {
        teamId: invitation.teamId,
        userId,
        userName: accepterName,
        action: "member_joined",
        entityType: "member",
        entityId: userId,
        entityName: accepterName,
        detail: `${accepterName} se unió a “${invitation.targetName ?? "una lista compartida"}”`,
      });
    }

    // Step 4: Notify the inviter that invitation was accepted
    if (accepterName) {
      console.log(
        "[invitationStore] Step 4: Sending notification to inviter...",
      );
      try {
        const listId = invitation.listId ?? invitation.targetId;
        await notifyInvitationAccepted(
          invitation.invitedBy,
          invitation.targetName ?? "la lista compartida",
          accepterName,
          listId,
        );
        console.log("[invitationStore] Step 4: Notification sent to owner");
      } catch (error) {
        console.error("[invitationStore] Notification failed:", error);
      }
    } else {
      console.log(
        "[invitationStore] Step 4: Skipping notification (no accepterName)",
      );
    }

    console.log(
      "[invitationStore] ===== ACCEPT INVITATION COMPLETED SUCCESSFULLY =====",
    );
  },

  rejectInvitation: async (invitation, userId, rejecterName) => {
    await declineInvitationInDb(invitation, userId);
    if (rejecterName) {
      try {
        const listId = invitation.listId ?? invitation.targetId;
        await notifyInvitationRejected(
          invitation.invitedBy,
          invitation.targetName ?? "la lista compartida",
          rejecterName,
          listId,
        );
      } catch (error) {
        console.error(
          "[invitationStore] Rejection notification failed:",
          error,
        );
      }
    }
  },
}));
