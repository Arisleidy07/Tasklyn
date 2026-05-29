"use client";

import { create } from "zustand";
import {
  subscribeToUserLists,
  createList as createListInDb,
  updateList as updateListInDb,
  deleteList as deleteListInDb,
  addListMember,
  removeListMember,
  updateMemberRole,
  setCustomName,
} from "@/lib/firestore";
import type { TaskList, ListMember, MemberRole, ListType } from "@/types";
import { Unsubscribe } from "firebase/firestore";

interface ListState {
  lists: TaskList[];
  activeListId: string | null;
  isLoading: boolean;
  unsubscribe: Unsubscribe | null;
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
  ) => Promise<TaskList>;
  updateList: (
    id: string,
    updates: Partial<Pick<TaskList, "name" | "description">>,
  ) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  addMember: (
    listId: string,
    userId: string,
    role: MemberRole,
  ) => Promise<void>;
  removeMember: (listId: string, userId: string) => Promise<void>;
  updateMemberRole: (
    listId: string,
    userId: string,
    role: MemberRole,
  ) => Promise<void>;
  setCustomName: (
    listId: string,
    userId: string,
    customName: string,
  ) => Promise<void>;
  getDisplayName: (listId: string, userId: string, fallback: string) => string;
  isMember: (listId: string, userId: string) => boolean;
  subscribeToLists: (userId: string) => void;
  unsubscribeFromLists: () => void;
}

export const useListStore = create<ListState>((set, get) => ({
  lists: [],
  activeListId: null,
  isLoading: false,
  unsubscribe: null,

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

  createList: async (name, owner, type, description) => {
    const newListData = {
      name,
      owner,
      type,
      description: description || "",
      members: [
        {
          userId: owner,
          role: "owner" as MemberRole,
          joinedAt: new Date().toISOString(),
        },
      ] as ListMember[],
      customNames: {},
    };

    const id = await createListInDb(newListData);

    // Return optimistic list
    const newList: TaskList = {
      id,
      ...newListData,
      createdAt: new Date().toISOString(),
    };

    return newList;
  },

  updateList: async (id, updates) => {
    await updateListInDb(id, updates);
  },

  deleteList: async (id) => {
    await deleteListInDb(id);
    set((state) => ({
      lists: state.lists.filter((l) => l.id !== id),
      activeListId: state.activeListId === id ? null : state.activeListId,
    }));
  },

  addMember: async (listId, userId, role) => {
    await addListMember(listId, userId, role);
  },

  removeMember: async (listId, userId) => {
    await removeListMember(listId, userId);
  },

  updateMemberRole: async (listId, userId, role) => {
    await updateMemberRole(listId, userId, role);
  },

  setCustomName: async (listId, userId, customName) => {
    await setCustomName(listId, userId, customName);
  },

  getDisplayName: (listId, userId, fallback) => {
    const list = get().lists.find((l) => l.id === listId);
    return list?.customNames?.[userId] || fallback;
  },

  isMember: (listId, userId) => {
    const list = get().lists.find((l) => l.id === listId);
    return list?.members.some((m) => m.userId === userId) ?? false;
  },

  subscribeToLists: (userId) => {
    // Unsubscribe from existing listener
    get().unsubscribe?.();

    set({ isLoading: true });

    const unsubscribe = subscribeToUserLists(userId, (lists) => {
      set({ lists, isLoading: false });
    });

    set({ unsubscribe });
  },

  unsubscribeFromLists: () => {
    get().unsubscribe?.();
    set({ unsubscribe: null, lists: [] });
  },
}));
