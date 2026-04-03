"use client";

import { create } from "zustand";
import {
  createInvitation as createInvitationInDb,
  getInvitationByToken,
  getInvitationsByList,
  deleteInvitation as deleteInvitationInDb,
  acceptInvitation as acceptInvitationInDb,
} from "@/lib/firestore";
import type { Invitation, MemberRole } from "@/types";

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
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    };

    const id = await createInvitationInDb(invitationData);

    return {
      id,
      ...invitationData,
      createdAt: new Date().toISOString(),
    } as Invitation;
  },

  deleteInvitation: async (id) => {
    await deleteInvitationInDb(id);
  },

  acceptInvitation: async (invitation, userId) => {
    await acceptInvitationInDb(invitation, userId);
  },
}));
