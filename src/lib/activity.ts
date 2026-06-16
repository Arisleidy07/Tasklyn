import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { ActivityItem, ActivityAction } from "@/stores/activityStore";

const ACTIVITY_COLLECTION = "activity";

export interface LogActivityParams {
  userId: string;
  userName: string;
  userPhotoURL?: string;
  action: ActivityAction;
  targetType: "task" | "list" | "team" | "comment";
  targetId: string;
  targetName: string;
  listId?: string;
  listName?: string;
  teamId?: string;
  teamName?: string;
  details?: string;
  metadata?: Record<string, any>;
}

/**
 * Log an activity to Firestore
 */
export async function logActivity(
  params: LogActivityParams
): Promise<string | null> {
  try {
    const activityData = {
      ...params,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(
      collection(db, ACTIVITY_COLLECTION),
      activityData
    );

    console.log("[Activity] Logged:", params.action, "for", params.targetName);
    return docRef.id;
  } catch (error) {
    console.error("[Activity] Failed to log activity:", error);
    return null;
  }
}

/**
 * Subscribe to activities for a specific user (all their lists and teams)
 */
export function subscribeToUserActivity(
  userId: string,
  callback: (activities: ActivityItem[]) => void
) {
  const q = query(
    collection(db, ACTIVITY_COLLECTION),
    where("userId", "==", userId),
    orderBy("timestamp", "desc"),
    limit(50)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const activities = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp:
            data.timestamp instanceof Timestamp
              ? data.timestamp.toDate().toISOString()
              : data.timestamp || data.createdAt || new Date().toISOString(),
        } as ActivityItem;
      });
      callback(activities);
    },
    (error) => {
      console.error("[Activity] Subscribe error:", error);
      callback([]);
    }
  );
}

/**
 * Subscribe to activities for a specific list
 */
export function subscribeToListActivity(
  listId: string,
  callback: (activities: ActivityItem[]) => void
) {
  const q = query(
    collection(db, ACTIVITY_COLLECTION),
    where("listId", "==", listId),
    orderBy("timestamp", "desc"),
    limit(50)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const activities = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp:
            data.timestamp instanceof Timestamp
              ? data.timestamp.toDate().toISOString()
              : data.timestamp || data.createdAt || new Date().toISOString(),
        } as ActivityItem;
      });
      callback(activities);
    },
    (error) => {
      console.error("[Activity] List subscribe error:", error);
      callback([]);
    }
  );
}

/**
 * Subscribe to activities for a specific team
 */
export function subscribeToTeamActivity(
  teamId: string,
  callback: (activities: ActivityItem[]) => void
) {
  const q = query(
    collection(db, ACTIVITY_COLLECTION),
    where("teamId", "==", teamId),
    orderBy("timestamp", "desc"),
    limit(50)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const activities = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp:
            data.timestamp instanceof Timestamp
              ? data.timestamp.toDate().toISOString()
              : data.timestamp || data.createdAt || new Date().toISOString(),
        } as ActivityItem;
      });
      callback(activities);
    },
    (error) => {
      console.error("[Activity] Team subscribe error:", error);
      callback([]);
    }
  );
}

/**
 * Get recent activities for a user (one-time fetch)
 */
export async function getRecentActivity(
  userId: string,
  limitCount: number = 20
): Promise<ActivityItem[]> {
  try {
    const { getDocs } = await import("firebase/firestore");
    const q = query(
      collection(db, ACTIVITY_COLLECTION),
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp:
          data.timestamp instanceof Timestamp
            ? data.timestamp.toDate().toISOString()
            : data.timestamp || data.createdAt || new Date().toISOString(),
      } as ActivityItem;
    });
  } catch (error) {
    console.error("[Activity] Get recent failed:", error);
    return [];
  }
}

/**
 * Log task completion activity
 */
export async function logTaskCompleted(
  task: {
    id: string;
    title: string;
    listId?: string;
    listName?: string;
  },
  user: { id: string; name: string; photoURL?: string },
  performedBy?: { id: string; name: string }
): Promise<string | null> {
  return logActivity({
    userId: user.id,
    userName: user.name,
    userPhotoURL: user.photoURL,
    action: "completed",
    targetType: "task",
    targetId: task.id,
    targetName: task.title,
    listId: task.listId,
    listName: task.listName,
    details: performedBy
      ? `Completada por ${performedBy.name}`
      : "Tarea completada",
    metadata: performedBy ? { performedById: performedBy.id } : undefined,
  });
}

/**
 * Log task creation activity
 */
export async function logTaskCreated(
  task: {
    id: string;
    title: string;
    listId?: string;
    listName?: string;
  },
  user: { id: string; name: string; photoURL?: string }
): Promise<string | null> {
  return logActivity({
    userId: user.id,
    userName: user.name,
    userPhotoURL: user.photoURL,
    action: "created",
    targetType: "task",
    targetId: task.id,
    targetName: task.title,
    listId: task.listId,
    listName: task.listName,
    details: "Tarea creada",
  });
}

/**
 * Log task update activity
 */
export async function logTaskUpdated(
  task: {
    id: string;
    title: string;
    listId?: string;
    listName?: string;
  },
  user: { id: string; name: string; photoURL?: string },
  changeDescription: string
): Promise<string | null> {
  return logActivity({
    userId: user.id,
    userName: user.name,
    userPhotoURL: user.photoURL,
    action: "updated",
    targetType: "task",
    targetId: task.id,
    targetName: task.title,
    listId: task.listId,
    listName: task.listName,
    details: changeDescription,
  });
}

/**
 * Log task deletion activity
 */
export async function logTaskDeleted(
  task: {
    id: string;
    title: string;
    listId?: string;
    listName?: string;
  },
  user: { id: string; name: string; photoURL?: string }
): Promise<string | null> {
  return logActivity({
    userId: user.id,
    userName: user.name,
    userPhotoURL: user.photoURL,
    action: "deleted",
    targetType: "task",
    targetId: task.id,
    targetName: task.title,
    listId: task.listId,
    listName: task.listName,
    details: "Tarea eliminada",
  });
}

/**
 * Log task assignment activity
 */
export async function logTaskAssigned(
  task: {
    id: string;
    title: string;
    listId?: string;
    listName?: string;
  },
  user: { id: string; name: string; photoURL?: string },
  assignedTo: { id: string; name: string }
): Promise<string | null> {
  return logActivity({
    userId: user.id,
    userName: user.name,
    userPhotoURL: user.photoURL,
    action: "assigned",
    targetType: "task",
    targetId: task.id,
    targetName: task.title,
    listId: task.listId,
    listName: task.listName,
    details: `Asignada a ${assignedTo.name}`,
    metadata: { assignedToId: assignedTo.id },
  });
}

/**
 * Log comment activity
 */
export async function logTaskCommented(
  task: {
    id: string;
    title: string;
    listId?: string;
    listName?: string;
  },
  user: { id: string; name: string; photoURL?: string },
  commentPreview?: string
): Promise<string | null> {
  return logActivity({
    userId: user.id,
    userName: user.name,
    userPhotoURL: user.photoURL,
    action: "commented",
    targetType: "task",
    targetId: task.id,
    targetName: task.title,
    listId: task.listId,
    listName: task.listName,
    details: commentPreview
      ? `Comentó: "${commentPreview.substring(0, 50)}${
          commentPreview.length > 50 ? "..." : ""
        }"`
      : "Nuevo comentario",
  });
}
