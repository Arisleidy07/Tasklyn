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
  acceptInvitation: (invitation: Invitation, userId: string) => Promise<void>;
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
        data: {
          listId,
          listName,
          inviterName,
          role,
          token,
          invitedBy,
        },
      });
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

  acceptInvitation: async (invitation, userId) => {
    await acceptInvitationInDb(invitation, userId);
  },
}));
