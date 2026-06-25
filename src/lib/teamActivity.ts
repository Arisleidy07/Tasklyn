/**
 * @deprecated teamActivity.ts is superseded by logTeamActivity in firestore.ts.
 * This file only re-exports for backward compatibility with activityStore.
 */
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { ActivityItem } from "@/stores/activityStore";

const ACTIVITY_COLLECTION = "activity";

/**
 * @deprecated reads from the old flat `activity` collection.
 * New code should use subscribeToTeamActivity from firestore.ts
 * which reads teams/{teamId}/activity subcollection.
 */
export function subscribeToTeamActivity(
  teamId: string,
  callback: (activities: ActivityItem[]) => void,
) {
  const q = query(
    collection(db, ACTIVITY_COLLECTION),
    where("teamId", "==", teamId),
    orderBy("timestamp", "desc"),
    limit(50),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const activities = snapshot.docs.map((actDoc) => {
        const data = actDoc.data();
        return {
          id: actDoc.id,
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
      console.error("[TeamActivity] Subscribe error:", error);
      callback([]);
    },
  );
}
