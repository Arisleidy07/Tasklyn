import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { ActivityItem } from "@/stores/activityStore";

const ACTIVITY_COLLECTION = "activity";

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
      console.error("[TeamActivity] Subscribe error:", error);
      callback([]);
    }
  );
}
