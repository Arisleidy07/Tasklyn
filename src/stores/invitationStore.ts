'use client';

import { create } from 'zustand';
import { Invitation, MemberRole } from '@/types';
import { generateId, generateToken } from '@/lib/utils';

interface InvitationState {
  invitations: Invitation[];
  getInvitation: (token: string) => Invitation | undefined;
  getInvitationsByList: (listId: string) => Invitation[];
  createInvitation: (listId: string, invitedBy: string, defaultRole?: MemberRole) => Invitation;
  deleteInvitation: (id: string) => void;
  deleteInvitationsByList: (listId: string) => void;
}

export const useInvitationStore = create<InvitationState>((set, get) => ({
  invitations: [],

  getInvitation: (token) =>
    get().invitations.find((inv) => inv.token === token),

  getInvitationsByList: (listId) =>
    get().invitations.filter((inv) => inv.listId === listId),

  createInvitation: (listId, invitedBy, defaultRole = 'viewer') => {
    const invitation: Invitation = {
      id: generateId(),
      token: generateToken(),
      listId,
      invitedBy,
      defaultRole,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    };
    set((state) => ({ invitations: [...state.invitations, invitation] }));
    return invitation;
  },

  deleteInvitation: (id) => {
    set((state) => ({
      invitations: state.invitations.filter((inv) => inv.id !== id),
    }));
  },

  deleteInvitationsByList: (listId) => {
    set((state) => ({
      invitations: state.invitations.filter((inv) => inv.listId !== listId),
    }));
  },
}));
