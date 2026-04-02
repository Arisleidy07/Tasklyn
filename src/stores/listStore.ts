"use client";

import { create } from "zustand";
import { TaskList, ListMember, ListType, MemberRole } from "@/types";
import { generateId } from "@/lib/utils";

interface ListState {
  lists: TaskList[];
  activeListId: string | null;
  setActiveList: (id: string | null) => void;
  getList: (id: string) => TaskList | undefined;
  getUserLists: (userId: string) => TaskList[];
  getPersonalLists: (userId: string) => TaskList[];
  getSharedLists: (userId: string) => TaskList[];
  createList: (
    name: string,
    owner: string,
    type: ListType,
    description?: string,
  ) => TaskList;
  updateList: (
    id: string,
    updates: Partial<Pick<TaskList, "name" | "description">>,
  ) => void;
  deleteList: (id: string) => void;
  addMember: (listId: string, userId: string, role: MemberRole) => void;
  removeMember: (listId: string, userId: string) => void;
  updateMemberRole: (listId: string, userId: string, role: MemberRole) => void;
  setCustomName: (listId: string, userId: string, customName: string) => void;
  getDisplayName: (listId: string, userId: string, fallback: string) => string;
  isMember: (listId: string, userId: string) => boolean;
}

export const useListStore = create<ListState>((set, get) => ({
  lists: [],
  activeListId: null,

  setActiveList: (id) => set({ activeListId: id }),

  getList: (id) => get().lists.find((l) => l.id === id),

  getUserLists: (userId) =>
    get().lists.filter((l) => l.members.some((m) => m.userId === userId)),

  getPersonalLists: (userId) =>
    get().lists.filter(
      (l) =>
        l.type === "personal" && l.members.some((m) => m.userId === userId),
    ),

  getSharedLists: (userId) =>
    get().lists.filter(
      (l) => l.type === "shared" && l.members.some((m) => m.userId === userId),
    ),

  createList: (name, owner, type, description) => {
    const newList: TaskList = {
      id: generateId(),
      name,
      owner,
      type,
      description,
      members: [
        { userId: owner, role: "owner", joinedAt: new Date().toISOString() },
      ],
      customNames: {},
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ lists: [...state.lists, newList] }));
    return newList;
  },

  updateList: (id, updates) => {
    set((state) => ({
      lists: state.lists.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    }));
  },

  deleteList: (id) => {
    set((state) => ({
      lists: state.lists.filter((l) => l.id !== id),
      activeListId: state.activeListId === id ? null : state.activeListId,
    }));
  },

  addMember: (listId, userId, role) => {
    set((state) => ({
      lists: state.lists.map((l) => {
        if (l.id !== listId) return l;
        if (l.members.some((m) => m.userId === userId)) return l;
        const newMember: ListMember = {
          userId,
          role,
          joinedAt: new Date().toISOString(),
        };
        return {
          ...l,
          members: [...l.members, newMember],
          type: "shared" as const,
        };
      }),
    }));
  },

  removeMember: (listId, userId) => {
    set((state) => ({
      lists: state.lists.map((l) => {
        if (l.id !== listId) return l;
        return { ...l, members: l.members.filter((m) => m.userId !== userId) };
      }),
    }));
  },

  updateMemberRole: (listId, userId, role) => {
    set((state) => ({
      lists: state.lists.map((l) => {
        if (l.id !== listId) return l;
        return {
          ...l,
          members: l.members.map((m) =>
            m.userId === userId ? { ...m, role } : m,
          ),
        };
      }),
    }));
  },

  setCustomName: (listId, userId, customName) => {
    set((state) => ({
      lists: state.lists.map((l) => {
        if (l.id !== listId) return l;
        const updated = { ...l.customNames };
        if (customName.trim()) {
          updated[userId] = customName.trim();
        } else {
          delete updated[userId];
        }
        return { ...l, customNames: updated };
      }),
    }));
  },

  getDisplayName: (listId, userId, fallback) => {
    const list = get().lists.find((l) => l.id === listId);
    return list?.customNames[userId] || fallback;
  },

  isMember: (listId, userId) => {
    const list = get().lists.find((l) => l.id === listId);
    return list?.members.some((m) => m.userId === userId) ?? false;
  },
}));
