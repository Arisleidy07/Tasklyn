// ============================================
// TASKLYN — Firebase Firestore Service Layer
// All CRUD operations + real-time listeners
// ============================================

export interface BackgroundImage {
  id: string;
  url: string;
  category: string;
  uploadedBy: string;
  uploaderName?: string;
  displayName?: string;
  createdAt: string;
  order?: number;
}

import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getDocsFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
  Timestamp,
  writeBatch,
  runTransaction,
  Transaction,
  deleteField,
  DocumentReference,
  DocumentData,
  Unsubscribe,
  arrayUnion,
  increment,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  User,
  TaskList,
  Task,
  Invitation,
  ListMember,
  MemberRole,
  Notification,
  Team,
  TeamMember,
  TeamRole,
  Goal,
  Achievement,
  TaskComment,
  TaskHistoryEntry,
  Client,
  TeamScore,
  Background,
} from "@/types";

// ---- SubcollectionTeamMember (stored at teams/{teamId}/members/{userId}) ----
export interface SubcollectionTeamMember {
  userId: string;
  name: string;
  email: string;
  photoURL?: string;
  role: TeamRole;
  joinedAt: string;
  invitedBy?: string;
  xp: number;
  streak: number;
}

// ============================================
// Helpers
// ============================================

const toDate = (timestamp: unknown): string => {
  if (!timestamp) return new Date().toISOString();
  if (typeof timestamp === "string") return timestamp;
  if (timestamp instanceof Date) return timestamp.toISOString();
  if (typeof (timestamp as Timestamp).toDate === "function")
    return (timestamp as Timestamp).toDate().toISOString();
  const raw = timestamp as { seconds?: number; nanoseconds?: number };
  if (typeof raw.seconds === "number")
    return new Date(raw.seconds * 1000).toISOString();
  return new Date().toISOString();
};

/**
 * Remove keys with `undefined` values from an object.
 * Firestore throws if `undefined` is passed to setDoc/updateDoc.
 */
const stripUndefined = <T extends Record<string, unknown>>(
  obj: T,
): Partial<T> => {
  const result: Partial<T> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      result[key] = obj[key] as T[Extract<keyof T, string>];
    }
  }
  return result;
};

const dedupeMembers = (members: ListMember[] = []): ListMember[] =>
  Array.from(
    new Map(
      members
        .filter((member) => Boolean(member?.userId))
        .map((member) => [member.userId, member]),
    ).values(),
  );

const withTimestamps = <T extends Record<string, unknown>>(
  data: T,
): T & { updatedAt: ReturnType<typeof serverTimestamp> } => ({
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

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const q = query(usersCollection, where("email", "==", email));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  const data = docSnap.data();
  return {
    ...data,
    id: docSnap.id,
    createdAt: toDate(data.createdAt),
  } as User;
};

export const updateUser = async (
  userId: string,
  updates: Partial<User>,
): Promise<void> => {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, withTimestamps(updates));
};

export const subscribeToUser = (
  userId: string,
  callback: (user: User | null) => void,
): Unsubscribe => {
  console.log("👤 Setting up user subscription:", userId);
  const userRef = doc(db, "users", userId);
  return onSnapshot(
    userRef,
    (snap) => {
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
    },
    (error) => {
      console.error("❌ Error in user subscription:", error);
      callback(null);
    },
  );
};

// ============================================
// LISTS
// ============================================

export const listsCollection = collection(db, "lists");

export const createList = async (
  list: Omit<TaskList, "id" | "createdAt">,
): Promise<string> => {
  const listRef = doc(listsCollection);
  const memberIds = list.members.map((m) => m.userId);
  // Assign order = current timestamp millis so new lists go at the end
  const order = list.order ?? Date.now();
  await setDoc(listRef, {
    ...list,
    order,
    memberIds,
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
    members: dedupeMembers(data.members),
    customNames: data.customNames || {},
  } as TaskList;
};

export const updateList = async (
  listId: string,
  updates: Partial<TaskList>,
): Promise<void> => {
  const listRef = doc(db, "lists", listId);
  const { id, createdAt, ...rest } = updates;
  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rest)) {
    cleaned[k] = v === undefined || v === "" ? deleteField() : v;
  }
  await updateDoc(listRef, withTimestamps(cleaned));
};

export const deleteList = async (listId: string): Promise<void> => {
  // Delete all tasks in the list first
  const tasksQuery = query(
    collection(db, "tasks"),
    where("listId", "==", listId),
  );
  const tasksSnap = await getDocs(tasksQuery);
  const batch = writeBatch(db);
  tasksSnap.docs.forEach((doc) => batch.delete(doc.ref));

  // Delete all invitations for this list
  const invitesQuery = query(
    collection(db, "invitations"),
    where("listId", "==", listId),
  );
  const invitesSnap = await getDocs(invitesQuery);
  invitesSnap.docs.forEach((doc) => batch.delete(doc.ref));

  // Delete the list
  batch.delete(doc(db, "lists", listId));

  await batch.commit();
};

export const addListMember = async (
  listId: string,
  userId: string,
  role: MemberRole,
): Promise<void> => {
  const listRef = doc(db, "lists", listId);
  const listSnap = await getDoc(listRef);
  if (!listSnap.exists()) throw new Error("List not found");

  const data = listSnap.data();
  const originalMembers: ListMember[] = data.members || [];
  const members = dedupeMembers(originalMembers);

  if (members.some((m) => m.userId === userId)) {
    if (members.length !== originalMembers.length) {
      await updateDoc(
        listRef,
        withTimestamps({
          members,
          memberIds: members.map((member) => member.userId),
        }),
      );
    }
    return;
  }

  members.push({
    userId,
    role,
    joinedAt: new Date().toISOString(),
  });

  const memberIds = members.map((m) => m.userId);

  await updateDoc(
    listRef,
    withTimestamps({
      members,
      memberIds,
      type: "shared",
    }),
  );
};

export const removeListMember = async (
  listId: string,
  userId: string,
): Promise<void> => {
  const listRef = doc(db, "lists", listId);
  const listSnap = await getDoc(listRef);
  if (!listSnap.exists()) throw new Error("List not found");

  const data = listSnap.data();
  const members: ListMember[] = (data.members || []).filter(
    (m: ListMember) => m.userId !== userId,
  );

  const memberIds = members.map((m) => m.userId);

  await updateDoc(listRef, withTimestamps({ members, memberIds }));
};

export const updateMemberRole = async (
  listId: string,
  userId: string,
  role: MemberRole,
): Promise<void> => {
  const listRef = doc(db, "lists", listId);
  const listSnap = await getDoc(listRef);
  if (!listSnap.exists()) throw new Error("List not found");

  const data = listSnap.data();
  const members: ListMember[] = (data.members || []).map((m: ListMember) =>
    m.userId === userId ? { ...m, role } : m,
  );

  await updateDoc(listRef, withTimestamps({ members }));
};

export const setCustomName = async (
  listId: string,
  userId: string,
  customName: string,
): Promise<void> => {
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

// Batch-update order for multiple lists (reordering)
export const reorderLists = async (
  orderedIds: { id: string; order: number }[],
): Promise<void> => {
  const batch = writeBatch(db);
  for (const { id, order } of orderedIds) {
    batch.update(doc(db, "lists", id), { order });
  }
  await batch.commit();
};

// Fetch all lists for a user (one-time fetch from server, for manual refresh)
export const getUserLists = async (userId: string): Promise<TaskList[]> => {
  console.log(`[getUserLists] Fetching lists for user ${userId} from server`);
  const q = query(
    listsCollection,
    where("memberIds", "array-contains", userId),
  );

  const snap = await getDocsFromServer(q);
  console.log(`[getUserLists] Found ${snap.docs.length} lists from server`);

  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: toDate(data.createdAt),
      members: dedupeMembers(data.members),
      customNames: data.customNames || {},
    } as TaskList;
  });
};

// Subscribe to all lists for a user (real-time)
export const subscribeToUserLists = (
  userId: string,
  callback: (lists: TaskList[]) => void,
): Unsubscribe => {
  console.log("👂 Setting up subscription for user lists:", userId);
  const q = query(
    listsCollection,
    where("memberIds", "array-contains", userId),
  );

  return onSnapshot(
    q,
    (snap) => {
      console.log("📦 User lists snapshot received:", {
        docCount: snap.docs.length,
        userId,
        metadata: snap.metadata,
        hasPendingWrites: snap.metadata.hasPendingWrites,
        fromCache: snap.metadata.fromCache,
      });

      const lists = snap.docs.map((doc) => {
        const data = doc.data();
        const rawMembers: ListMember[] = data.members || [];
        const members = dedupeMembers(rawMembers);
        if (data.owner === userId && members.length !== rawMembers.length) {
          void updateDoc(doc.ref, {
            members,
            memberIds: members.map((member) => member.userId),
            updatedAt: serverTimestamp(),
          }).catch((error) => {
            console.error("Failed to repair duplicate list members:", error);
          });
        }
        const list = {
          ...data,
          id: doc.id,
          createdAt: toDate(data.createdAt),
          members,
          customNames: data.customNames || {},
        } as TaskList;

        console.log("📋 List in subscription:", {
          id: list.id,
          name: list.name,
          type: list.type,
          memberCount: list.members.length,
          memberIds: data.memberIds,
          isUserMember: data.memberIds?.includes(userId),
          userInMembers: list.members.some((m) => m.userId === userId),
        });

        return list;
      });

      const sharedLists = lists.filter(
        (l) =>
          l.type === "shared" && l.members.some((m) => m.userId === userId),
      );
      console.log(
        "🤝 Shared lists for this user:",
        sharedLists.map((l) => ({ id: l.id, name: l.name })),
      );
      console.log(
        "🚀 Calling callback with lists:",
        lists.map((l) => ({ id: l.id, name: l.name, type: l.type })),
      );
      callback(lists);
    },
    (error) => {
      console.error("❌ Error in lists subscription:", error);
      // Return empty lists on error to prevent app crash
      callback([]);
    },
  );
};

// ============================================
// TASKS
// ============================================

export const tasksCollection = collection(db, "tasks");

export const createTask = async (
  task: Omit<Task, "id" | "createdAt" | "history"> & {
    history?: TaskHistoryEntry[];
  },
): Promise<string> => {
  const taskRef = doc(tasksCollection);
  const cleanTask = stripUndefined(task);
  await setDoc(taskRef, {
    ...cleanTask,
    createdAt: serverTimestamp(),
  });
  return taskRef.id;
};

export const updateTask = async (
  taskId: string,
  updates: Partial<Task>,
): Promise<void> => {
  const taskRef = doc(db, "tasks", taskId);
  const { id, createdAt, ...rest } = updates;
  const cleanUpdates = stripUndefined(rest) as Record<string, unknown>;
  if ("priority" in updates && updates.priority === undefined) {
    cleanUpdates.priority = deleteField();
  }
  await updateDoc(taskRef, withTimestamps(cleanUpdates));
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
export const subscribeToListTasks = (
  listId: string,
  callback: (tasks: Task[]) => void,
): Unsubscribe => {
  console.log("📋 Setting up tasks subscription for list:", listId);
  const q = query(tasksCollection, where("listId", "==", listId));

  return onSnapshot(
    q,
    (snap) => {
      console.log("📦 Tasks snapshot received:", snap.docs.length);
      const tasks = snap.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: toDate(data.createdAt),
          completedAt: data.completedAt ? toDate(data.completedAt) : null,
          history: (data.history || []).map((h: DocumentData) => ({
            ...h,
            performedAt:
              typeof h.performedAt === "string"
                ? h.performedAt
                : toDate(h.performedAt),
          })),
        } as Task;
      });
      tasks.sort((a, b) => {
        const ao = a.order ?? Number.MAX_SAFE_INTEGER;
        const bo = b.order ?? Number.MAX_SAFE_INTEGER;
        if (ao !== bo) return ao - bo;
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
      callback(tasks);
    },
    (error) => {
      console.error("❌ Error in tasks subscription:", error);
      callback([]);
    },
  );
};

// ============================================
// INVITATIONS
// ============================================

export const invitationsCollection = collection(db, "invitations");

export const createInvitation = async (
  invitation: Omit<Invitation, "id" | "createdAt">,
): Promise<string> => {
  const inviteRef = doc(invitationsCollection);
  await setDoc(inviteRef, {
    ...invitation,
    createdAt: serverTimestamp(),
  });
  return inviteRef.id;
};

export const getInvitationByToken = async (
  token: string,
): Promise<Invitation | null> => {
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

export const getInvitationsByList = async (
  listId: string,
): Promise<Invitation[]> => {
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

export const declineInvitation = async (
  invitation: Invitation,
  userId: string,
): Promise<void> => {
  await runTransaction(db, async (transaction) => {
    const invitationRef = doc(db, "invitations", invitation.id);
    const snapshot = await transaction.get(invitationRef);
    if (!snapshot.exists()) throw new Error("Invitation not found");
    if (snapshot.data().status !== "pending") {
      throw new Error("Invitation already processed");
    }
    transaction.update(invitationRef, {
      status: "declined",
      declinedAt: serverTimestamp(),
      declinedBy: userId,
    });
  });
};

/**
 * Create a team invitation with a UUID token.
 * Stored in /invitations with type:"team".
 */
export const createTeamInvitation = async (params: {
  teamId: string;
  invitedBy: string;
  invitedEmail?: string;
  defaultRole: "admin" | "member";
  token: string;
  expiresInDays?: number;
}): Promise<string> => {
  const inviteRef = doc(invitationsCollection);
  const expiresAt = new Date(
    Date.now() + (params.expiresInDays ?? 7) * 24 * 60 * 60 * 1000,
  ).toISOString();
  await setDoc(inviteRef, {
    token: params.token,
    type: "team",
    targetId: params.teamId,
    teamId: params.teamId,
    invitedBy: params.invitedBy,
    invitedEmail: params.invitedEmail || null,
    defaultRole: params.defaultRole,
    status: "pending",
    expiresAt,
    createdAt: serverTimestamp(),
  });
  return inviteRef.id;
};

/**
 * Look up a team invitation by token.
 * Returns null if not found or already accepted/expired.
 */
export const getTeamInvitationByToken = async (
  token: string,
): Promise<Invitation | null> => {
  const q = query(
    invitationsCollection,
    where("token", "==", token),
    where("type", "==", "team"),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const invDoc = snap.docs[0];
  const data = invDoc.data();
  return {
    ...data,
    id: invDoc.id,
    createdAt: toDate(data.createdAt),
    expiresAt: toDate(data.expiresAt),
  } as Invitation;
};

/**
 * Mark a team invitation as accepted and add the user to the team.
 */
export const acceptTeamInvitation = async (
  invitation: Invitation,
  userId: string,
): Promise<void> => {
  const teamId = invitation.teamId ?? invitation.targetId;
  if (!teamId) throw new Error("Invitation has no teamId");

  const invitationRef = doc(db, "invitations", invitation.id);
  const [invitationSnapshot, userSnapshot] = await Promise.all([
    getDoc(invitationRef),
    getDoc(doc(db, "users", userId)),
  ]);
  if (!invitationSnapshot.exists()) throw new Error("Invitation not found");

  const current = invitationSnapshot.data() as Invitation;
  if (current.status !== "pending") {
    if (current.status === "accepted" && current.acceptedBy === userId) return;
    throw new Error("Invitation already processed");
  }
  if (new Date(toDate(current.expiresAt)).getTime() <= Date.now()) {
    throw new Error("Invitation expired");
  }

  const userData = userSnapshot.data() ?? {};
  const joinedAt = new Date().toISOString();
  const role = (current.defaultRole as "admin" | "member") || "member";
  const batch = writeBatch(db);
  batch.update(doc(db, "teams", teamId), {
    members: arrayUnion({
      userId,
      role,
      joinedAt,
      invitedBy: current.invitedBy,
    }),
    memberIds: arrayUnion(userId),
    "stats.totalMembers": increment(1),
    lastProcessedInvitationId: invitation.id,
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(db, "teams", teamId, "members", userId), {
    userId,
    name: userData.name || "",
    email: userData.email || "",
    photoURL: userData.photoURL || "",
    role,
    joinedAt,
    invitedBy: current.invitedBy,
    invitationId: invitation.id,
    xp: 0,
    streak: 0,
  });
  batch.update(invitationRef, {
    status: "accepted",
    acceptedAt: serverTimestamp(),
    acceptedBy: userId,
  });
  await batch.commit();

  await logTeamActivity(teamId, {
    teamId,
    userId,
    userName: userData.name || "Usuario",
    userPhotoURL: userData.photoURL || "",
    action: "member_joined",
    entityType: "member",
    entityId: userId,
    entityName: userData.name || "Usuario",
    detail: `${userData.name || "Un usuario"} se unió al equipo`,
  });
};

export const deleteInvitationsByList = async (
  listId: string,
): Promise<void> => {
  const q = query(invitationsCollection, where("listId", "==", listId));
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
};

// ============================================
// TEAMS
// ============================================

export const teamsCollection = collection(db, "teams");

export const createTeam = async (
  teamData: Omit<
    Team,
    "id" | "createdAt" | "updatedAt" | "members" | "stats" | "settings"
  > & { ownerId: string },
): Promise<string> => {
  const teamRef = doc(teamsCollection);
  const now = new Date().toISOString();

  // Ensure owner is in members list
  const ownerMember: TeamMember = {
    userId: teamData.ownerId,
    role: "owner",
    joinedAt: now,
  };

  const members = [ownerMember];
  const memberIds = [teamData.ownerId];

  // Initialize team with complete configuration
  const newTeam = {
    ...teamData,
    owner: teamData.ownerId,
    members,
    memberIds,
    settings: {
      allowInvites: true,
      allowMemberCreateLists: true,
    },
    stats: {
      totalTasks: 0,
      completedTasks: 0,
      totalMembers: 1,
      totalLists: 0,
    },
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(teamRef, {
    ...newTeam,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Also write owner to subcollection members/{userId}
  const ownerProfile = await getDoc(doc(db, "users", teamData.ownerId));
  const ownerData = ownerProfile.exists() ? ownerProfile.data() : {};
  const memberSubRef = doc(
    db,
    "teams",
    teamRef.id,
    "members",
    teamData.ownerId,
  );
  await setDoc(memberSubRef, {
    userId: teamData.ownerId,
    name: ownerData.name || "",
    email: ownerData.email || "",
    photoURL: ownerData.photoURL || "",
    role: "owner" as TeamRole,
    joinedAt: now,
    xp: 0,
    streak: 0,
  });

  console.log("✅ Team created with full configuration:", teamRef.id);
  return teamRef.id;
};

// ============================================
// TEAM ACTIVITY
// ============================================

export type { TeamActivityEntry } from "@/types";
import type { TeamActivityEntry, TeamActivityAction } from "@/types";

/**
 * Log an entry to teams/{teamId}/activity.
 * Single entry point — replaces addTeamActivity.
 */
export const logTeamActivity = async (
  teamId: string,
  entry: Omit<TeamActivityEntry, "id" | "timestamp">,
): Promise<void> => {
  try {
    const ref = doc(collection(db, "teams", teamId, "activity"));
    await setDoc(ref, {
      ...stripUndefined(entry),
      teamId,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error("[logTeamActivity] Failed:", err);
    // Non-fatal — never block the main operation
  }
};

/** @deprecated Use logTeamActivity instead */
export const addTeamActivity = logTeamActivity;

export const subscribeToTeamActivity = (
  teamId: string,
  callback: (entries: TeamActivityEntry[]) => void,
  limitCount = 40,
): Unsubscribe => {
  const q = query(
    collection(db, "teams", teamId, "activity"),
    orderBy("timestamp", "desc"),
    firestoreLimit(limitCount),
  );
  return onSnapshot(
    q,
    (snap) => {
      const entries = snap.docs.map((d) => ({
        ...d.data(),
        id: d.id,
        timestamp: toDate(d.data().timestamp ?? d.data().createdAt),
      })) as TeamActivityEntry[];
      callback(entries);
    },
    (err) => {
      console.error("[subscribeToTeamActivity] Error:", err);
      callback([]);
    },
  );
};

export const getTeam = async (teamId: string): Promise<Team | null> => {
  const teamRef = doc(db, "teams", teamId);
  const snap = await getDoc(teamRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    ...data,
    id: snap.id,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    members: data.members || [],
  } as Team;
};

export const updateTeam = async (
  teamId: string,
  updates: Partial<Team>,
): Promise<void> => {
  const teamRef = doc(db, "teams", teamId);
  const { id, createdAt, updatedAt, ...rest } = updates;
  await updateDoc(teamRef, {
    ...rest,
    updatedAt: serverTimestamp(),
  });
};

export const deleteTeam = async (teamId: string): Promise<void> => {
  console.log(`[deleteTeam] Starting deletion for team: ${teamId}`);

  const MAX_BATCH_SIZE = 450; // Stay under the 500 limit for safety

  // Helper to commit a batch and create a new one
  let currentBatch = writeBatch(db);
  let operationCount = 0;

  const commitIfNeeded = async () => {
    if (operationCount >= MAX_BATCH_SIZE) {
      console.log(
        `[deleteTeam] Committing batch with ${operationCount} operations`,
      );
      await currentBatch.commit();
      currentBatch = writeBatch(db);
      operationCount = 0;
    }
  };

  try {
    // 1. Delete all lists for this team and their tasks
    const listsQuery = query(listsCollection, where("teamId", "==", teamId));
    const listsSnap = await getDocs(listsQuery);
    console.log(`[deleteTeam] Found ${listsSnap.docs.length} lists to delete`);

    for (const listDoc of listsSnap.docs) {
      // Delete tasks for this list
      const tasksQuery = query(
        tasksCollection,
        where("listId", "==", listDoc.id),
      );
      const tasksSnap = await getDocs(tasksQuery);

      for (const taskDoc of tasksSnap.docs) {
        currentBatch.delete(taskDoc.ref);
        operationCount++;
        await commitIfNeeded();
      }

      // Delete comments for tasks in this list
      const commentsQuery = query(
        collection(db, "comments"),
        where("listId", "==", listDoc.id),
      );
      const commentsSnap = await getDocs(commentsQuery);
      for (const commentDoc of commentsSnap.docs) {
        currentBatch.delete(commentDoc.ref);
        operationCount++;
        await commitIfNeeded();
      }

      // Delete invitations for this list
      const invitesQuery = query(
        invitationsCollection,
        where("listId", "==", listDoc.id),
      );
      const invitesSnap = await getDocs(invitesQuery);
      for (const inviteDoc of invitesSnap.docs) {
        currentBatch.delete(inviteDoc.ref);
        operationCount++;
        await commitIfNeeded();
      }

      // Delete the list itself
      currentBatch.delete(listDoc.ref);
      operationCount++;
      await commitIfNeeded();
    }

    // 2. Delete team invitations (by teamId)
    const teamInvitesQuery = query(
      invitationsCollection,
      where("teamId", "==", teamId),
    );
    const teamInvitesSnap = await getDocs(teamInvitesQuery);
    for (const inviteDoc of teamInvitesSnap.docs) {
      currentBatch.delete(inviteDoc.ref);
      operationCount++;
      await commitIfNeeded();
    }

    // 3. Delete all activity entries for this team
    const activityQuery = query(collection(db, "teams", teamId, "activity"));
    const activitySnap = await getDocs(activityQuery);
    console.log(
      `[deleteTeam] Found ${activitySnap.docs.length} activity entries to delete`,
    );
    for (const activityDoc of activitySnap.docs) {
      currentBatch.delete(activityDoc.ref);
      operationCount++;
      await commitIfNeeded();
    }

    // 4. Delete all members subcollection docs
    const membersSubQuery = collection(db, "teams", teamId, "members");
    const membersSubSnap = await getDocs(membersSubQuery);
    console.log(
      `[deleteTeam] Found ${membersSubSnap.docs.length} member docs to delete`,
    );
    for (const memberDoc of membersSubSnap.docs) {
      currentBatch.delete(memberDoc.ref);
      operationCount++;
      await commitIfNeeded();
    }

    // 5. Delete all scores subcollection docs
    const scoresSubQuery = collection(db, "teams", teamId, "scores");
    const scoresSubSnap = await getDocs(scoresSubQuery);
    for (const scoreDoc of scoresSubSnap.docs) {
      currentBatch.delete(scoreDoc.ref);
      operationCount++;
      await commitIfNeeded();
    }

    // 6. Delete all goals for this team
    const goalsQuery = query(goalsCollection, where("teamId", "==", teamId));
    const goalsSnap = await getDocs(goalsQuery);
    console.log(`[deleteTeam] Found ${goalsSnap.docs.length} goals to delete`);
    for (const goalDoc of goalsSnap.docs) {
      currentBatch.delete(goalDoc.ref);
      operationCount++;
      await commitIfNeeded();
    }

    // 7. Delete all achievements for this team
    const achievementsQuery = query(
      achievementsCollection,
      where("teamId", "==", teamId),
    );
    const achievementsSnap = await getDocs(achievementsQuery);
    console.log(
      `[deleteTeam] Found ${achievementsSnap.docs.length} achievements to delete`,
    );
    for (const achievementDoc of achievementsSnap.docs) {
      currentBatch.delete(achievementDoc.ref);
      operationCount++;
      await commitIfNeeded();
    }

    // 6. Delete notifications related to this team
    const notificationsQuery = query(
      notificationsCollection,
      where("teamId", "==", teamId),
    );
    const notificationsSnap = await getDocs(notificationsQuery);
    for (const notifDoc of notificationsSnap.docs) {
      currentBatch.delete(notifDoc.ref);
      operationCount++;
      await commitIfNeeded();
    }

    // 7. Finally, delete the team document itself
    const teamRef = doc(db, "teams", teamId);
    currentBatch.delete(teamRef);
    operationCount++;

    // Commit final batch
    if (operationCount > 0) {
      console.log(
        `[deleteTeam] Committing final batch with ${operationCount} operations`,
      );
      await currentBatch.commit();
    }

    console.log(`✅ Team deleted successfully: ${teamId}`);
  } catch (error) {
    console.error(`❌ [deleteTeam] Error deleting team ${teamId}:`, error);
    throw new Error(
      `Failed to delete team: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

export const addTeamMember = async (
  teamId: string,
  userId: string,
  role: TeamRole,
  invitedBy?: string,
): Promise<void> => {
  const teamRef = doc(db, "teams", teamId);
  const teamSnap = await getDoc(teamRef);
  if (!teamSnap.exists()) throw new Error("Team not found");

  const data = teamSnap.data();
  const members: TeamMember[] = data.members || [];
  const now = new Date().toISOString();

  if (members.some((m: TeamMember) => m.userId === userId)) return; // Already member

  const newMember: TeamMember = {
    userId,
    role,
    joinedAt: now,
    invitedBy,
  };

  members.push(newMember);
  const memberIds = members.map((m: TeamMember) => m.userId);

  // Fetch user profile to enrich subcollection doc
  const userProfile = await getDoc(doc(db, "users", userId));
  const userData = userProfile.exists() ? userProfile.data() : {};

  const batch = writeBatch(db);

  // 1. Update legacy arrays on team doc (keep for backward compat)
  batch.update(teamRef, {
    members,
    memberIds,
    "stats.totalMembers": members.length,
    updatedAt: serverTimestamp(),
  });

  // 2. Write to subcollection
  const memberSubRef = doc(db, "teams", teamId, "members", userId);
  batch.set(memberSubRef, {
    userId,
    name: userData.name || "",
    email: userData.email || "",
    photoURL: userData.photoURL || "",
    role,
    joinedAt: now,
    invitedBy: invitedBy || null,
    xp: 0,
    streak: 0,
  });

  await batch.commit();
};

export const removeTeamMember = async (
  teamId: string,
  userId: string,
): Promise<void> => {
  const teamRef = doc(db, "teams", teamId);
  const teamSnap = await getDoc(teamRef);
  if (!teamSnap.exists()) throw new Error("Team not found");

  const data = teamSnap.data();

  // Safety: never remove the owner
  if (data.owner === userId) throw new Error("Cannot remove the team owner");

  const members: TeamMember[] = (data.members || []).filter(
    (m: TeamMember) => m.userId !== userId,
  );
  const memberIds = members.map((m: TeamMember) => m.userId);

  const batch = writeBatch(db);

  // 1. Update legacy arrays
  batch.update(teamRef, {
    members,
    memberIds,
    "stats.totalMembers": members.length,
    updatedAt: serverTimestamp(),
  });

  // 2. Delete from subcollection
  const memberSubRef = doc(db, "teams", teamId, "members", userId);
  batch.delete(memberSubRef);

  await batch.commit();
};

export const updateTeamMemberRole = async (
  teamId: string,
  userId: string,
  role: TeamRole,
): Promise<void> => {
  const teamRef = doc(db, "teams", teamId);
  const teamSnap = await getDoc(teamRef);
  if (!teamSnap.exists()) throw new Error("Team not found");

  const data = teamSnap.data();

  // Safety: owner role cannot be transferred via this function
  if (data.owner === userId && role !== "owner")
    throw new Error("Cannot change owner role");

  // Update legacy members array (backward compat)
  const members: TeamMember[] = (data.members || []).map((m: TeamMember) =>
    m.userId === userId ? { ...m, role } : m,
  );

  const batch = writeBatch(db);

  // 1. Update legacy array
  batch.update(teamRef, {
    members,
    updatedAt: serverTimestamp(),
  });

  // 2. Update ONLY subcollection — never iterates arrays
  const memberSubRef = doc(db, "teams", teamId, "members", userId);
  batch.update(memberSubRef, { role });

  await batch.commit();
};

// ---- Subcollection helpers ----

export const subscribeToTeamMembers = (
  teamId: string,
  callback: (members: SubcollectionTeamMember[]) => void,
): Unsubscribe => {
  const q = collection(db, "teams", teamId, "members");
  return onSnapshot(
    q,
    (snap) => {
      const members = snap.docs.map((d) => ({
        ...d.data(),
        userId: d.id,
        joinedAt: toDate(d.data().joinedAt),
      })) as SubcollectionTeamMember[];
      callback(members);
    },
    (error) => {
      console.error("❌ Error in team members subscription:", error);
      callback([]);
    },
  );
};

export const getTeamMembersFromSubcollection = async (
  teamId: string,
): Promise<SubcollectionTeamMember[]> => {
  const snap = await getDocs(collection(db, "teams", teamId, "members"));
  return snap.docs.map((d) => ({
    ...d.data(),
    userId: d.id,
    joinedAt: toDate(d.data().joinedAt),
  })) as SubcollectionTeamMember[];
};

/**
 * One-time migration: copies existing members[] from the team doc
 * into the subcollection teams/{teamId}/members/{userId}.
 * Safe to call multiple times — uses setDoc with merge:true.
 */
export const migrateTeamMembersToSubcollection = async (
  teamId: string,
): Promise<void> => {
  const teamRef = doc(db, "teams", teamId);
  const teamSnap = await getDoc(teamRef);
  if (!teamSnap.exists()) throw new Error("Team not found");

  const data = teamSnap.data();
  const members: TeamMember[] = data.members || [];

  if (members.length === 0) {
    console.log(`[migrate] Team ${teamId} has no members to migrate`);
    return;
  }

  // Fetch all user profiles in parallel
  const profiles = await Promise.all(
    members.map((m) => getDoc(doc(db, "users", m.userId))),
  );

  const batch = writeBatch(db);

  members.forEach((m, i) => {
    const profileData = profiles[i].exists() ? profiles[i].data() : {};
    const memberSubRef = doc(db, "teams", teamId, "members", m.userId);
    batch.set(
      memberSubRef,
      {
        userId: m.userId,
        name: profileData?.name || "",
        email: profileData?.email || "",
        photoURL: profileData?.photoURL || "",
        role: m.role,
        joinedAt: m.joinedAt || new Date().toISOString(),
        invitedBy: m.invitedBy || null,
        xp: 0,
        streak: 0,
      },
      { merge: true }, // safe: won't overwrite existing xp/streak
    );
  });

  await batch.commit();
  console.log(`✅ Migrated ${members.length} members for team ${teamId}`);
};

export const subscribeToUserTeams = (
  userId: string,
  callback: (teams: Team[]) => void,
): Unsubscribe => {
  console.log("👥 Setting up teams subscription for user:", userId);
  const q = query(
    teamsCollection,
    where("memberIds", "array-contains", userId),
  );

  return onSnapshot(
    q,
    (snap) => {
      console.log("📦 Teams snapshot received:", snap.docs.length);
      const seen = new Set<string>();
      const teams = snap.docs
        .map((teamDoc) => {
          const data = teamDoc.data();
          return {
            ...data,
            id: teamDoc.id,
            createdAt: toDate(data.createdAt),
            updatedAt: toDate(data.updatedAt),
            members: data.members || [],
          } as Team;
        })
        // Filter out legacy auto-created personal teams
        .filter((t) => !(t as Team & { isPersonal?: boolean }).isPersonal)
        .filter((t) => {
          if (seen.has(t.id)) return false;
          seen.add(t.id);
          return true;
        });
      console.log("📦 Teams after filtering personal:", teams.length);
      callback(teams);
    },
    (error) => {
      console.error("❌ Error in teams subscription:", error);
      callback([]);
    },
  );
};

export const getUserTeams = async (userId: string): Promise<Team[]> => {
  const q = query(
    teamsCollection,
    where("memberIds", "array-contains", userId),
  );
  const snap = await getDocsFromServer(q);
  const seen = new Set<string>();
  return snap.docs
    .filter((teamDoc) => !teamDoc.data().isPersonal)
    .map((teamDoc) => {
      const data = teamDoc.data();
      return {
        ...data,
        id: teamDoc.id,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
        members: data.members || [],
      } as Team;
    })
    .filter((t) => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
};

// ============================================
// GOALS
// ============================================

export const goalsCollection = collection(db, "goals");

export const createGoal = async (
  goal: Omit<Goal, "id" | "createdAt">,
): Promise<string> => {
  const goalRef = doc(goalsCollection);
  await setDoc(goalRef, {
    ...goal,
    createdAt: serverTimestamp(),
  });
  return goalRef.id;
};

export const updateGoal = async (
  goalId: string,
  updates: Partial<Goal>,
): Promise<void> => {
  const goalRef = doc(db, "goals", goalId);
  const { id, createdAt, ...rest } = updates;
  await updateDoc(goalRef, rest);
};

export const subscribeToTeamGoals = (
  teamId: string,
  callback: (goals: Goal[]) => void,
): Unsubscribe => {
  console.log("🎯 Setting up goals subscription for team:", teamId);
  const q = query(goalsCollection, where("teamId", "==", teamId));

  return onSnapshot(
    q,
    (snap) => {
      console.log("📦 Goals snapshot received:", snap.docs.length);
      const goals = snap.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: toDate(data.createdAt),
        } as Goal;
      });
      callback(goals);
    },
    (error) => {
      console.error("❌ Error in goals subscription:", error);
      callback([]);
    },
  );
};

// ============================================
// ACHIEVEMENTS
// ============================================

export const achievementsCollection = collection(db, "achievements");

export const createAchievement = async (
  achievement: Omit<Achievement, "id" | "createdAt">,
): Promise<string> => {
  const achievementRef = doc(achievementsCollection);
  await setDoc(achievementRef, {
    ...achievement,
    createdAt: serverTimestamp(),
  });
  return achievementRef.id;
};

export const subscribeToUserAchievements = (
  userId: string,
  callback: (achievements: Achievement[]) => void,
): Unsubscribe => {
  console.log("🏆 Setting up achievements subscription for user:", userId);
  const q = query(achievementsCollection, where("userId", "==", userId));

  return onSnapshot(
    q,
    (snap) => {
      console.log("📦 Achievements snapshot received:", snap.docs.length);
      const achievements = snap.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: toDate(data.createdAt),
        } as Achievement;
      });
      achievements.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      callback(achievements);
    },
    (error) => {
      console.error("❌ Error in achievements subscription:", error);
      callback([]);
    },
  );
};

export const subscribeToTeamAchievements = (
  teamId: string,
  callback: (achievements: Achievement[]) => void,
): Unsubscribe => {
  console.log("🏆 Setting up team achievements subscription:", teamId);
  const q = query(achievementsCollection, where("teamId", "==", teamId));

  return onSnapshot(
    q,
    (snap) => {
      console.log("📦 Team achievements snapshot received:", snap.docs.length);
      const achievements = snap.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: toDate(data.createdAt),
        } as Achievement;
      });
      achievements.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      callback(achievements);
    },
    (error) => {
      console.error("❌ Error in team achievements subscription:", error);
      callback([]);
    },
  );
};

// ============================================
// BATCH OPERATIONS
// ============================================

/**
 * Accept an invitation using a Firestore transaction for atomicity.
 * This function:
 * 1. Verifies the list exists and user is not already a member
 * 2. Adds the user as a list member with the correct role
 * 3. If the list has a teamId, adds the user to the team
 * 4. Updates the list type to "shared"
 * 5. Deletes the invitation document
 * 6. All operations are atomic - either all succeed or all fail
 */
export const acceptInvitation = async (
  invitation: Invitation,
  userId: string,
): Promise<void> => {
  const listId = invitation.listId ?? invitation.targetId;
  if (!listId) throw new Error("Invitation has no listId");

  const invitationRef = doc(db, "invitations", invitation.id);
  const listRef = doc(db, "lists", listId);
  const [snapshot, listSnapshot] = await Promise.all([
    getDoc(invitationRef),
    getDoc(listRef),
  ]);
  if (!snapshot.exists()) throw new Error("Invitation not found");
  if (!listSnapshot.exists()) throw new Error("List not found");
  const listData = listSnapshot.data();
  if (
    listData.memberIds?.includes(userId) ||
    listData.members?.some((member: ListMember) => member.userId === userId)
  ) {
    throw new Error("already-member");
  }

  const current = snapshot.data() as Invitation;
  if (current.status !== "pending") {
    if (current.status === "accepted" && current.acceptedBy === userId) return;
    throw new Error("Invitation already processed");
  }
  if (new Date(toDate(current.expiresAt)).getTime() <= Date.now()) {
    throw new Error("Invitation expired");
  }
  if (current.invitedEmail) {
    const userSnapshot = await getDoc(doc(db, "users", userId));
    const email = userSnapshot.data()?.email?.toLowerCase();
    if (!email || email !== current.invitedEmail.toLowerCase()) {
      throw new Error("Invitation belongs to another account");
    }
  }

  const joinedAt = new Date().toISOString();
  const members = dedupeMembers(listData.members);
  members.push({
    userId,
    role: (current.defaultRole as MemberRole) || "viewer",
    joinedAt,
  });
  const batch = writeBatch(db);
  batch.update(doc(db, "lists", listId), {
    members,
    memberIds: members.map((member) => member.userId),
    type: "shared",
    lastProcessedInvitationId: invitation.id,
    updatedAt: serverTimestamp(),
  });

  if (current.teamId) {
    batch.update(doc(db, "teams", current.teamId), {
      members: arrayUnion({
        userId,
        role: "member",
        joinedAt,
        invitedBy: current.invitedBy,
      } satisfies TeamMember),
      memberIds: arrayUnion(userId),
      "stats.totalMembers": increment(1),
      lastProcessedInvitationId: invitation.id,
      updatedAt: serverTimestamp(),
    });
  }

  batch.update(invitationRef, {
    status: "accepted",
    acceptedAt: serverTimestamp(),
    acceptedBy: userId,
  });
  await batch.commit();
};

// ============================================
// NOTIFICATIONS
// ============================================

export const notificationsCollection = collection(db, "notifications");

export const createNotification = async (
  notification: Omit<Notification, "id" | "createdAt">,
): Promise<string> => {
  const ref = doc(notificationsCollection);
  await setDoc(ref, {
    ...notification,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const markNotificationRead = async (
  notificationId: string,
): Promise<void> => {
  await updateDoc(doc(db, "notifications", notificationId), { read: true });
};

export const markAllNotificationsRead = async (
  userId: string,
): Promise<void> => {
  const q = query(
    notificationsCollection,
    where("userId", "==", userId),
    where("read", "==", false),
  );
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
  await batch.commit();
};

export const deleteNotification = async (
  notificationId: string,
): Promise<void> => {
  await deleteDoc(doc(db, "notifications", notificationId));
};

// ============================================
// COMMENTS
// ============================================

export const addComment = async (
  comment: Omit<TaskComment, "id" | "createdAt">,
): Promise<string> => {
  const ref = doc(collection(db, "comments"));
  await setDoc(ref, {
    ...stripUndefined(comment),
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateComment = async (
  commentId: string,
  content: string,
  editedBy?: string,
): Promise<void> => {
  await updateDoc(doc(db, "comments", commentId), {
    content,
    editedAt: serverTimestamp(),
    ...(editedBy && { editedBy }),
  });
};

export const deleteComment = async (commentId: string): Promise<void> => {
  await deleteDoc(doc(db, "comments", commentId));
};

export const subscribeToTaskComments = (
  taskId: string,
  callback: (comments: TaskComment[]) => void,
): Unsubscribe => {
  console.log("💬 Setting up comments subscription for task:", taskId);
  const q = query(collection(db, "comments"), where("taskId", "==", taskId));
  return onSnapshot(
    q,
    (snap) => {
      console.log("📦 Comments snapshot received:", snap.docs.length);
      const comments = snap.docs.map((d) => ({
        ...d.data(),
        id: d.id,
        createdAt: toDate(d.data().createdAt),
        editedAt: d.data().editedAt ? toDate(d.data().editedAt) : undefined,
      })) as TaskComment[];
      comments.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      callback(comments);
    },
    (error) => {
      console.error("❌ Error in comments subscription:", error);
      callback([]);
    },
  );
};

// ============================================
// CLIENTS
// ============================================

export const createClient = async (
  client: Omit<Client, "id" | "createdAt" | "updatedAt">,
): Promise<string> => {
  const ref = doc(collection(db, "clients"));
  await setDoc(ref, {
    ...stripUndefined(client),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateClient = async (
  clientId: string,
  updates: Partial<Omit<Client, "id" | "createdAt">>,
): Promise<void> => {
  await updateDoc(doc(db, "clients", clientId), {
    ...stripUndefined(updates),
    updatedAt: serverTimestamp(),
  });
};

export const deleteClient = async (clientId: string): Promise<void> => {
  await deleteDoc(doc(db, "clients", clientId));
};

export const subscribeToUserClients = (
  userId: string,
  callback: (clients: Client[]) => void,
): Unsubscribe => {
  console.log("👤 Setting up clients subscription for user:", userId);
  const q = query(collection(db, "clients"), where("ownerId", "==", userId));
  return onSnapshot(
    q,
    (snap) => {
      console.log("📦 Clients snapshot received:", snap.docs.length);
      const clients = snap.docs.map((d) => ({
        ...d.data(),
        id: d.id,
        createdAt: toDate(d.data().createdAt),
        updatedAt: toDate(d.data().updatedAt),
      })) as Client[];
      clients.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      callback(clients);
    },
    (error) => {
      console.error("❌ Error in clients subscription:", error);
      callback([]);
    },
  );
};

export const subscribeToNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void,
): Unsubscribe => {
  console.log("🔔 Setting up notifications subscription for user:", userId);
  const q = query(notificationsCollection, where("userId", "==", userId));
  return onSnapshot(
    q,
    (snap) => {
      console.log("📦 Notifications snapshot received:", snap.docs.length);
      const notifications = snap.docs.map((d) => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          createdAt: toDate(data.createdAt),
        } as Notification;
      });
      notifications.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      callback(notifications);
    },
    (error) => {
      console.error("❌ Error in notifications subscription:", error);
      callback([]);
    },
  );
};

// ============================================
// BACKGROUND IMAGES LIBRARY
// ============================================

export const backgroundImagesCollection = collection(db, "backgroundImages");

/** Subscribe to all background images, sorted by category then date */
export const subscribeToBackgrounds = (
  callback: (images: BackgroundImage[]) => void,
): Unsubscribe => {
  return onSnapshot(
    query(backgroundImagesCollection, orderBy("createdAt", "desc")),
    (snap) => {
      const images = snap.docs.map((d) => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          createdAt:
            typeof data.createdAt === "string"
              ? data.createdAt
              : toDate(data.createdAt),
        } as BackgroundImage;
      });
      callback(images);
    },
    () => callback([]),
  );
};

/** Add a background image entry to Firestore */
export const addBackgroundImage = async (
  image: Omit<BackgroundImage, "id" | "createdAt">,
): Promise<BackgroundImage> => {
  const ref = doc(backgroundImagesCollection);
  const now = new Date().toISOString();
  const data: Omit<BackgroundImage, "id"> = { ...image, createdAt: now };
  await setDoc(ref, data);
  return { ...data, id: ref.id };
};

/** Update a background image entry in Firestore */
export const updateBackgroundImage = async (
  id: string,
  updates: Partial<Omit<BackgroundImage, "id" | "createdAt">>,
): Promise<void> => {
  const ref = doc(backgroundImagesCollection, id);
  await updateDoc(ref, { ...updates, updatedAt: new Date().toISOString() });
};

/** Delete a background image entry from Firestore */
export const deleteBackgroundImageDoc = async (id: string): Promise<void> => {
  await deleteDoc(doc(backgroundImagesCollection, id));
};

// ============================================
// BACKGROUND IMAGE CATEGORIES
// ============================================

export const bgCategoriesCollection = collection(db, "bgCategories");

/** Subscribe to all background image categories, sorted by order */
export const subscribeToBgCategories = (
  callback: (categories: import("@/types").BgCategoryConfig[]) => void,
): Unsubscribe => {
  return onSnapshot(
    query(bgCategoriesCollection, orderBy("order", "asc")),
    (snap) => {
      const categories = snap.docs.map((d) => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          createdAt:
            typeof data.createdAt === "string"
              ? data.createdAt
              : toDate(data.createdAt),
          updatedAt: data.updatedAt
            ? typeof data.updatedAt === "string"
              ? data.updatedAt
              : toDate(data.updatedAt)
            : undefined,
        } as import("@/types").BgCategoryConfig;
      });
      callback(categories);
    },
    () => callback([]),
  );
};

/** Add a new background image category */
export const addBgCategory = async (
  category: Omit<
    import("@/types").BgCategoryConfig,
    "id" | "createdAt" | "updatedAt"
  >,
): Promise<import("@/types").BgCategoryConfig> => {
  const ref = doc(bgCategoriesCollection);
  const now = new Date().toISOString();
  const data = { ...category, createdAt: now, updatedAt: now };
  await setDoc(ref, data);
  return { ...data, id: ref.id };
};

/** Update a background image category */
export const updateBgCategory = async (
  id: string,
  updates: Partial<
    Omit<import("@/types").BgCategoryConfig, "id" | "createdAt">
  >,
): Promise<void> => {
  const ref = doc(bgCategoriesCollection, id);
  await updateDoc(ref, { ...updates, updatedAt: new Date().toISOString() });
};

/** Delete a background image category */
export const deleteBgCategory = async (id: string): Promise<void> => {
  await deleteDoc(doc(bgCategoriesCollection, id));
};

/** Reorder categories by updating their order field */
export const reorderBgCategories = async (
  orderedIds: string[],
): Promise<void> => {
  const batch = writeBatch(db);
  orderedIds.forEach((id, index) => {
    const ref = doc(bgCategoriesCollection, id);
    batch.update(ref, { order: index, updatedAt: new Date().toISOString() });
  });
  await batch.commit();
};

/** Reorder background images within a category by updating their order field */
export const reorderBackgroundImages = async (
  orderedImages: { id: string; order: number }[],
): Promise<void> => {
  const batch = writeBatch(db);
  orderedImages.forEach((img) => {
    const ref = doc(backgroundImagesCollection, img.id);
    batch.update(ref, { order: img.order });
  });
  await batch.commit();
};

/** Rename category field on all images that belong to oldName → newName */
export const renameCategoryOnImages = async (
  oldName: string,
  newName: string,
): Promise<void> => {
  const q = query(backgroundImagesCollection, where("category", "==", oldName));
  const snap = await getDocsFromServer(q);
  if (snap.empty) return;
  const now = new Date().toISOString();
  // Firestore batch limit is 500 ops
  const chunks: (typeof snap.docs)[] = [];
  for (let i = 0; i < snap.docs.length; i += 499) {
    chunks.push(snap.docs.slice(i, i + 499));
  }
  for (const chunk of chunks) {
    const b = writeBatch(db);
    chunk.forEach((d) => {
      b.update(d.ref, { category: newName, updatedAt: now });
    });
    await b.commit();
  }
};

/** Move all images of a given category to another category */
export const moveImagesToCategoryBatch = async (
  fromCategory: string,
  toCategory: string,
): Promise<void> => {
  await renameCategoryOnImages(fromCategory, toCategory);
};

/** Delete all images in a category */
export const deleteImagesByCategory = async (
  categoryName: string,
): Promise<void> => {
  const q = query(
    backgroundImagesCollection,
    where("category", "==", categoryName),
  );
  const snap = await getDocsFromServer(q);
  if (snap.empty) return;
  const chunks: (typeof snap.docs)[] = [];
  for (let i = 0; i < snap.docs.length; i += 499) {
    chunks.push(snap.docs.slice(i, i + 499));
  }
  for (const chunk of chunks) {
    const b = writeBatch(db);
    chunk.forEach((d) => b.delete(d.ref));
    await b.commit();
  }
};

// ============================================
// ÍTEM 8 — TEAM SCORES subcollection
// teams/{teamId}/scores/{userId}
// ============================================

export const upsertTeamScore = async (
  teamId: string,
  userId: string,
  delta: Partial<
    Pick<
      TeamScore,
      | "xpTotal"
      | "xpWeek"
      | "xpMonth"
      | "tasksCompleted"
      | "tasksCreated"
      | "commentsAdded"
      | "streak"
      | "level"
      | "rankPosition"
    >
  >,
): Promise<void> => {
  const ref = doc(db, "teams", teamId, "scores", userId);
  await setDoc(
    ref,
    {
      userId,
      ...delta,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
};

export const subscribeToTeamScores = (
  teamId: string,
  callback: (scores: TeamScore[]) => void,
): Unsubscribe => {
  const q = query(
    collection(db, "teams", teamId, "scores"),
    orderBy("xpTotal", "desc"),
  );
  return onSnapshot(
    q,
    (snap) => {
      const scores = snap.docs.map((d) => ({
        ...d.data(),
        userId: d.id,
        updatedAt: toDate(d.data().updatedAt),
      })) as TeamScore[];
      callback(scores);
    },
    () => callback([]),
  );
};

export const getTeamScores = async (teamId: string): Promise<TeamScore[]> => {
  const snap = await getDocs(
    query(
      collection(db, "teams", teamId, "scores"),
      orderBy("xpTotal", "desc"),
    ),
  );
  return snap.docs.map((d) => ({
    ...d.data(),
    userId: d.id,
    updatedAt: toDate(d.data().updatedAt),
  })) as TeamScore[];
};

// ============================================
// ÍTEM 9 — /backgrounds collection
// ============================================

export const sharedBackgroundsCollection = collection(db, "backgrounds");

export const subscribeToSharedBackgrounds = (
  callback: (backgrounds: Background[]) => void,
): Unsubscribe => {
  return onSnapshot(
    query(sharedBackgroundsCollection, orderBy("createdAt", "desc")),
    (snap) => {
      const bgs = snap.docs.map((d) => ({
        ...d.data(),
        id: d.id,
        createdAt: toDate(d.data().createdAt),
      })) as Background[];
      callback(bgs);
    },
    () => callback([]),
  );
};

export const createSharedBackground = async (
  bg: Omit<Background, "id" | "createdAt">,
): Promise<string> => {
  const ref = doc(sharedBackgroundsCollection);
  await setDoc(ref, { ...bg, createdAt: serverTimestamp() });
  return ref.id;
};

export const deleteSharedBackground = async (bgId: string): Promise<void> => {
  await deleteDoc(doc(sharedBackgroundsCollection, bgId));
};

// ============================================
// ÍTEM 10 — tasks/{taskId}/history & comments
// ============================================

// ---- Task History subcollection ----

export const addTaskHistoryEntry = async (
  taskId: string,
  entry: Omit<TaskHistoryEntry, "id">,
): Promise<void> => {
  const ref = doc(collection(db, "tasks", taskId, "history"));
  await setDoc(ref, {
    ...stripUndefined(entry),
    createdAt: serverTimestamp(),
  });
};

export const subscribeToTaskHistory = (
  taskId: string,
  callback: (entries: TaskHistoryEntry[]) => void,
): Unsubscribe => {
  const q = query(
    collection(db, "tasks", taskId, "history"),
    orderBy("createdAt", "desc"),
    firestoreLimit(50),
  );
  return onSnapshot(
    q,
    (snap) => {
      const entries = snap.docs.map((d) => ({
        ...d.data(),
        id: d.id,
        createdAt: toDate(d.data().createdAt),
      })) as unknown as TaskHistoryEntry[];
      callback(entries);
    },
    () => callback([]),
  );
};

// ---- Task Comments subcollection (additive alongside /comments) ----

export const addTaskCommentSubcollection = async (
  taskId: string,
  comment: Omit<TaskComment, "id" | "createdAt" | "updatedAt">,
): Promise<string> => {
  const ref = doc(collection(db, "tasks", taskId, "comments"));
  const now = serverTimestamp();
  await setDoc(ref, {
    ...comment,
    taskId,
    createdAt: now,
    updatedAt: now,
    isEdited: false,
  });
  return ref.id;
};

export const updateTaskCommentSubcollection = async (
  taskId: string,
  commentId: string,
  text: string,
): Promise<void> => {
  await updateDoc(doc(db, "tasks", taskId, "comments", commentId), {
    text,
    isEdited: true,
    updatedAt: serverTimestamp(),
  });
};

export const deleteTaskCommentSubcollection = async (
  taskId: string,
  commentId: string,
): Promise<void> => {
  await deleteDoc(doc(db, "tasks", taskId, "comments", commentId));
};

export const subscribeToTaskCommentsSubcollection = (
  taskId: string,
  callback: (comments: TaskComment[]) => void,
): Unsubscribe => {
  const q = query(
    collection(db, "tasks", taskId, "comments"),
    orderBy("createdAt", "asc"),
  );
  return onSnapshot(
    q,
    (snap) => {
      const comments = snap.docs.map((d) => ({
        ...d.data(),
        id: d.id,
        createdAt: toDate(d.data().createdAt),
        updatedAt: toDate(d.data().updatedAt),
      })) as unknown as TaskComment[];
      callback(comments);
    },
    () => callback([]),
  );
};
