// ============================================
// TASKLYN — Firebase Firestore Service Layer
// All CRUD operations + real-time listeners
// ============================================

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  writeBatch,
  DocumentReference,
  DocumentData,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import type { User, TaskList, Task, Invitation, ListMember, MemberRole } from "@/types";

// ============================================
// Helpers
// ============================================

const toDate = (timestamp: Timestamp | null | undefined): string => {
  if (!timestamp) return new Date().toISOString();
  return timestamp.toDate().toISOString();
};

const withTimestamps = <T extends Record<string, unknown>>(data: T): T & { updatedAt: ReturnType<typeof serverTimestamp> } => ({
  ...data,
  updatedAt: serverTimestamp(),
});

// ============================================
// USERS
// ============================================

export const usersCollection = collection(db, "users");

export const createUser = async (user: User): Promise<void> => {
  const userRef = doc(db, "users", user.id);
  await setDoc(userRef, {
    ...user,
    createdAt: serverTimestamp(),
  });
};

export const getUser = async (userId: string): Promise<User | null> => {
  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    ...data,
    id: snap.id,
    createdAt: toDate(data.createdAt),
  } as User;
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<void> => {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, withTimestamps(updates));
};

export const subscribeToUser = (userId: string, callback: (user: User | null) => void): Unsubscribe => {
  const userRef = doc(db, "users", userId);
  return onSnapshot(userRef, (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    const data = snap.data();
    callback({
      ...data,
      id: snap.id,
      createdAt: toDate(data.createdAt),
    } as User);
  });
};

// ============================================
// LISTS
// ============================================

export const listsCollection = collection(db, "lists");

export const createList = async (list: Omit<TaskList, "id" | "createdAt">): Promise<string> => {
  const listRef = doc(listsCollection);
  await setDoc(listRef, {
    ...list,
    createdAt: serverTimestamp(),
  });
  return listRef.id;
};

export const getList = async (listId: string): Promise<TaskList | null> => {
  const listRef = doc(db, "lists", listId);
  const snap = await getDoc(listRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    ...data,
    id: snap.id,
    createdAt: toDate(data.createdAt),
    members: data.members || [],
    customNames: data.customNames || {},
  } as TaskList;
};

export const updateList = async (listId: string, updates: Partial<TaskList>): Promise<void> => {
  const listRef = doc(db, "lists", listId);
  const { id, createdAt, ...rest } = updates;
  await updateDoc(listRef, withTimestamps(rest));
};

export const deleteList = async (listId: string): Promise<void> => {
  // Delete all tasks in the list first
  const tasksQuery = query(collection(db, "tasks"), where("listId", "==", listId));
  const tasksSnap = await getDocs(tasksQuery);
  const batch = writeBatch(db);
  tasksSnap.docs.forEach((doc) => batch.delete(doc.ref));
  
  // Delete all invitations for this list
  const invitesQuery = query(collection(db, "invitations"), where("listId", "==", listId));
  const invitesSnap = await getDocs(invitesQuery);
  invitesSnap.docs.forEach((doc) => batch.delete(doc.ref));
  
  // Delete the list
  batch.delete(doc(db, "lists", listId));
  
  await batch.commit();
};

export const addListMember = async (listId: string, userId: string, role: MemberRole): Promise<void> => {
  const listRef = doc(db, "lists", listId);
  const listSnap = await getDoc(listRef);
  if (!listSnap.exists()) throw new Error("List not found");
  
  const data = listSnap.data();
  const members: ListMember[] = data.members || [];
  
  if (members.some((m) => m.userId === userId)) return; // Already member
  
  members.push({
    userId,
    role,
    joinedAt: new Date().toISOString(),
  });
  
  await updateDoc(listRef, withTimestamps({
    members,
    type: "shared",
  }));
};

export const removeListMember = async (listId: string, userId: string): Promise<void> => {
  const listRef = doc(db, "lists", listId);
  const listSnap = await getDoc(listRef);
  if (!listSnap.exists()) throw new Error("List not found");
  
  const data = listSnap.data();
  const members: ListMember[] = (data.members || []).filter((m: ListMember) => m.userId !== userId);
  
  await updateDoc(listRef, withTimestamps({ members }));
};

export const updateMemberRole = async (listId: string, userId: string, role: MemberRole): Promise<void> => {
  const listRef = doc(db, "lists", listId);
  const listSnap = await getDoc(listRef);
  if (!listSnap.exists()) throw new Error("List not found");
  
  const data = listSnap.data();
  const members: ListMember[] = (data.members || []).map((m: ListMember) =>
    m.userId === userId ? { ...m, role } : m
  );
  
  await updateDoc(listRef, withTimestamps({ members }));
};

export const setCustomName = async (listId: string, userId: string, customName: string): Promise<void> => {
  const listRef = doc(db, "lists", listId);
  const listSnap = await getDoc(listRef);
  if (!listSnap.exists()) throw new Error("List not found");
  
  const data = listSnap.data();
  const customNames = { ...(data.customNames || {}) };
  
  if (customName.trim()) {
    customNames[userId] = customName.trim();
  } else {
    delete customNames[userId];
  }
  
  await updateDoc(listRef, withTimestamps({ customNames }));
};

// Subscribe to all lists for a user (real-time)
export const subscribeToUserLists = (userId: string, callback: (lists: TaskList[]) => void): Unsubscribe => {
  const q = query(
    listsCollection,
    where("members", "array-contains", { userId })
  );
  
  // Firestore can't query by array-contains on objects directly
  // So we query all and filter client-side (for now, until we add a membersById field)
  return onSnapshot(listsCollection, (snap) => {
    const lists = snap.docs
      .map((doc) => {
        const data = doc.data();
        const members: ListMember[] = data.members || [];
        if (!members.some((m) => m.userId === userId)) return null;
        return {
          ...data,
          id: doc.id,
          createdAt: toDate(data.createdAt),
          members,
          customNames: data.customNames || {},
        } as TaskList;
      })
      .filter(Boolean) as TaskList[];
    callback(lists);
  });
};

// ============================================
// TASKS
// ============================================

export const tasksCollection = collection(db, "tasks");

export const createTask = async (task: Omit<Task, "id" | "createdAt">): Promise<string> => {
  const taskRef = doc(tasksCollection);
  await setDoc(taskRef, {
    ...task,
    createdAt: serverTimestamp(),
    history: task.history || [],
  });
  return taskRef.id;
};

export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<void> => {
  const taskRef = doc(db, "tasks", taskId);
  const { id, createdAt, ...rest } = updates;
  await updateDoc(taskRef, withTimestamps(rest));
};

export const deleteTask = async (taskId: string): Promise<void> => {
  await deleteDoc(doc(db, "tasks", taskId));
};

export const deleteTasksByList = async (listId: string): Promise<void> => {
  const q = query(tasksCollection, where("listId", "==", listId));
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
};

// Subscribe to tasks for a list (real-time)
export const subscribeToListTasks = (listId: string, callback: (tasks: Task[]) => void): Unsubscribe => {
  const q = query(
    tasksCollection,
    where("listId", "==", listId),
    orderBy("createdAt", "desc")
  );
  
  return onSnapshot(q, (snap) => {
    const tasks = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: toDate(data.createdAt),
        completedAt: data.completedAt ? toDate(data.completedAt) : null,
        history: (data.history || []).map((h: DocumentData) => ({
          ...h,
          performedAt: typeof h.performedAt === "string" ? h.performedAt : toDate(h.performedAt),
        })),
      } as Task;
    });
    callback(tasks);
  });
};

// ============================================
// INVITATIONS
// ============================================

export const invitationsCollection = collection(db, "invitations");

export const createInvitation = async (invitation: Omit<Invitation, "id" | "createdAt">): Promise<string> => {
  const inviteRef = doc(invitationsCollection);
  await setDoc(inviteRef, {
    ...invitation,
    createdAt: serverTimestamp(),
  });
  return inviteRef.id;
};

export const getInvitationByToken = async (token: string): Promise<Invitation | null> => {
  const q = query(invitationsCollection, where("token", "==", token));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const doc = snap.docs[0];
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    createdAt: toDate(data.createdAt),
    expiresAt: toDate(data.expiresAt),
  } as Invitation;
};

export const getInvitationsByList = async (listId: string): Promise<Invitation[]> => {
  const q = query(invitationsCollection, where("listId", "==", listId));
  const snap = await getDocs(q);
  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: toDate(data.createdAt),
      expiresAt: toDate(data.expiresAt),
    } as Invitation;
  });
};

export const deleteInvitation = async (invitationId: string): Promise<void> => {
  await deleteDoc(doc(db, "invitations", invitationId));
};

export const deleteInvitationsByList = async (listId: string): Promise<void> => {
  const q = query(invitationsCollection, where("listId", "==", listId));
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
};

// ============================================
// BATCH OPERATIONS
// ============================================

export const acceptInvitation = async (invitation: Invitation, userId: string): Promise<void> => {
  const batch = writeBatch(db);
  
  // Add member to list
  const listRef = doc(db, "lists", invitation.listId);
  const listSnap = await getDoc(listRef);
  if (!listSnap.exists()) throw new Error("List not found");
  
  const listData = listSnap.data();
  const members: ListMember[] = listData.members || [];
  
  if (!members.some((m) => m.userId === userId)) {
    members.push({
      userId,
      role: invitation.defaultRole,
      joinedAt: new Date().toISOString(),
    });
    batch.update(listRef, { members, type: "shared", updatedAt: serverTimestamp() });
  }
  
  // Delete invitation
  batch.delete(doc(db, "invitations", invitation.id));
  
  await batch.commit();
};
