"use client";

import { create } from "zustand";
import {
  createInvitation as createInvitationInDb,
  getInvitationByToken,
  getInvitationsByList,
  deleteInvitation as deleteInvitationInDb,
  acceptInvitation as acceptInvitationInDb,
  getUserByEmail,
  createNotification,
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
    const invitationData = {
      listId,
      invitedBy,
      defaultRole,
      token:
        Math.random().toString(36).slice(2) +
        Math.random().toString(36).slice(2),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const id = await createInvitationInDb(invitationData);

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
    const token =
      Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

    const invitationData = {
      listId,
      invitedBy,
      invitedEmail: email,
      defaultRole: role,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

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
    console.log("[invitationStore] acceptInvitation starting", {
      invitationId: invitation.id,
      userId,
      accepterName,
    });

    // Step 1: Accept the invitation in Firestore (adds user to list members)
    await acceptInvitationInDb(invitation, userId);
    console.log("[invitationStore] acceptInvitationInDb completed");

    // Step 2: Force refresh lists to include the newly joined list
    // This ensures the list appears immediately in "Shared Lists" without waiting
    console.log("[invitationStore] Refreshing lists...");
    try {
      const listStore = useListStore.getState();
      await listStore.refreshLists(userId);
      console.log("[invitationStore] Lists refreshed successfully");
    } catch (error) {
      console.error("[invitationStore] Failed to refresh lists:", error);
      // Don't throw - the subscription should eventually catch up
    }

    // Step 3: Notify the inviter that invitation was accepted
    if (accepterName) {
      await notifyInvitationAccepted(
        invitation.invitedBy,
        invitation.listId,
        accepterName,
        invitation.listId,
      );
      console.log("[invitationStore] notifyInvitationAccepted sent to owner");
    }

    console.log("[invitationStore] acceptInvitation completed successfully");
  },

  rejectInvitation: async (invitation, _userId, rejecterName) => {
    await deleteInvitationInDb(invitation.id);
    if (rejecterName) {
      await notifyInvitationRejected(
        invitation.invitedBy,
        invitation.listId,
        rejecterName,
        invitation.listId,
      );
    }
  },
}));
