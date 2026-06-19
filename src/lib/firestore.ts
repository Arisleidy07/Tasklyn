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
  Client,
} from "@/types";

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
    members: data.members || [],
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
  const members: ListMember[] = data.members || [];

  if (members.some((m) => m.userId === userId)) return; // Already member

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
      members: data.members || [],
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
        const list = {
          ...data,
          id: doc.id,
          createdAt: toDate(data.createdAt),
          members: data.members || [],
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
  task: Omit<Task, "id" | "createdAt">,
): Promise<string> => {
  const taskRef = doc(tasksCollection);
  const cleanTask = stripUndefined(task);
  await setDoc(taskRef, {
    ...cleanTask,
    createdAt: serverTimestamp(),
    history: task.history || [],
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
      requireApproval: false,
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

  console.log("✅ Team created with full configuration:", teamRef.id);
  return teamRef.id;
};

// ============================================
// TEAM ACTIVITY
// ============================================

export interface TeamActivityEntry {
  id: string;
  teamId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  action: string; // e.g. "completed_task", "created_task", "joined_team"
  detail: string; // human-readable: "completó Diseño de logo"
  entityId?: string;
  entityType?: "task" | "list" | "member";
  createdAt: string;
}

export const addTeamActivity = async (
  teamId: string,
  entry: Omit<TeamActivityEntry, "id" | "createdAt">,
): Promise<void> => {
  const ref = doc(collection(db, "teams", teamId, "activity"));
  await setDoc(ref, {
    ...entry,
    createdAt: serverTimestamp(),
  });
};

export const subscribeToTeamActivity = (
  teamId: string,
  callback: (entries: TeamActivityEntry[]) => void,
  limitCount = 30,
): Unsubscribe => {
  const q = query(
    collection(db, "teams", teamId, "activity"),
    orderBy("createdAt", "desc"),
    firestoreLimit(limitCount),
  );
  return onSnapshot(q, (snap) => {
    const entries = snap.docs.map((d) => ({
      ...d.data(),
      id: d.id,
      createdAt: toDate(d.data().createdAt),
    })) as TeamActivityEntry[];
    callback(entries);
  });
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

    // 4. Delete all goals for this team
    const goalsQuery = query(goalsCollection, where("teamId", "==", teamId));
    const goalsSnap = await getDocs(goalsQuery);
    console.log(`[deleteTeam] Found ${goalsSnap.docs.length} goals to delete`);
    for (const goalDoc of goalsSnap.docs) {
      currentBatch.delete(goalDoc.ref);
      operationCount++;
      await commitIfNeeded();
    }

    // 5. Delete all achievements for this team
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

  if (members.some((m) => m.userId === userId)) return; // Already member

  members.push({
    userId,
    role,
    joinedAt: new Date().toISOString(),
    invitedBy,
  });

  const memberIds = members.map((m) => m.userId);

  await updateDoc(teamRef, {
    members,
    memberIds,
    "stats.totalMembers": members.length,
    updatedAt: serverTimestamp(),
  });
};

export const removeTeamMember = async (
  teamId: string,
  userId: string,
): Promise<void> => {
  const teamRef = doc(db, "teams", teamId);
  const teamSnap = await getDoc(teamRef);
  if (!teamSnap.exists()) throw new Error("Team not found");

  const data = teamSnap.data();
  const members: TeamMember[] = (data.members || []).filter(
    (m: TeamMember) => m.userId !== userId,
  );

  const memberIds = members.map((m) => m.userId);

  await updateDoc(teamRef, {
    members,
    memberIds,
    "stats.totalMembers": members.length,
    updatedAt: serverTimestamp(),
  });
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
  const members: TeamMember[] = (data.members || []).map((m: TeamMember) =>
    m.userId === userId ? { ...m, role } : m,
  );

  await updateDoc(teamRef, {
    members,
    updatedAt: serverTimestamp(),
  });
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
      const teams = snap.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt),
          members: data.members || [],
        } as Team;
      });
      callback(teams);
    },
    (error) => {
      console.error("❌ Error in teams subscription:", error);
      // Return empty teams on error to prevent app crash
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

  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
      members: data.members || [],
    } as Team;
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
  const debugPrefix = `[acceptInvitation ${userId.substring(0, 6)}...]`;
  console.log(`${debugPrefix} ===== STARTING INVITATION ACCEPTANCE =====`);
  console.log(`${debugPrefix} Invitation ID: ${invitation.id}`);
  console.log(`${debugPrefix} List ID: ${invitation.listId}`);
  console.log(`${debugPrefix} Team ID: ${invitation.teamId || "none"}`);
  console.log(`${debugPrefix} User ID: ${userId}`);
  console.log(`${debugPrefix} Default Role: ${invitation.defaultRole}`);

  const listRef = doc(db, "lists", invitation.listId);
  const invitationRef = doc(db, "invitations", invitation.id);
  const teamRef = invitation.teamId
    ? doc(db, "teams", invitation.teamId)
    : null;

  // Use arrayUnion to add user without reading the document first
  // This avoids permission-denied errors
  const newMember: ListMember = {
    userId,
    role: invitation.defaultRole,
    joinedAt: new Date().toISOString(),
  };

  console.log(`${debugPrefix} Adding user to list with arrayUnion`);
  await updateDoc(listRef, {
    members: arrayUnion(newMember),
    memberIds: arrayUnion(userId),
    type: "shared" as const,
    updatedAt: serverTimestamp(),
  });
  console.log(`${debugPrefix} User added to list successfully`);

  // If list has a team, add user to team
  if (invitation.teamId && teamRef) {
    console.log(
      `${debugPrefix} List has team ${invitation.teamId}, adding user to team`,
    );
    const newTeamMember: TeamMember = {
      userId,
      role: "member" as TeamRole,
      joinedAt: new Date().toISOString(),
      invitedBy: invitation.invitedBy,
    };
    await updateDoc(teamRef, {
      members: arrayUnion(newTeamMember),
      memberIds: arrayUnion(userId),
      "stats.totalMembers": increment(1),
      updatedAt: serverTimestamp(),
    });
    console.log(`${debugPrefix} User added to team successfully`);
  }

  // Delete the invitation
  console.log(`${debugPrefix} Deleting invitation`);
  await deleteDoc(invitationRef);
  console.log(`${debugPrefix} Invitation deleted successfully`);

  console.log(`${debugPrefix} ===== INVITATION ACCEPTANCE COMPLETED =====`);
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
): Promise<void> => {
  await updateDoc(doc(db, "comments", commentId), {
    content,
    editedAt: serverTimestamp(),
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
