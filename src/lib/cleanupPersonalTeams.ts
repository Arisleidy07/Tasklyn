/**
 * CLEANUP UTILITY — Remove legacy auto-created personal teams from Firestore.
 *
 * HOW TO USE (browser console):
 *   import { findPersonalTeams, deletePersonalTeams } from "@/lib/cleanupPersonalTeams";
 *   const found = await findPersonalTeams();
 *   console.table(found);
 *   // Review the list, then:
 *   await deletePersonalTeams(found.map(t => t.id));
 *
 * Or from a one-time page / server action — never run automatically.
 */

import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface PersonalTeamInfo {
  id: string;
  name: string;
  owner: string;
  isPersonal: boolean;
  createdAt: string;
}

/** Find all documents in /teams that have isPersonal:true */
export const findPersonalTeams = async (): Promise<PersonalTeamInfo[]> => {
  const q = query(collection(db, "teams"), where("isPersonal", "==", true));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    name: d.data().name ?? "(sin nombre)",
    owner: d.data().owner ?? "",
    isPersonal: true,
    createdAt: d.data().createdAt ?? "",
  }));
};

/** Find ALL teams where the user is owner (for manual cleanup) */
export const findAllMyTeams = async (
  userId: string,
): Promise<PersonalTeamInfo[]> => {
  const q = query(collection(db, "teams"), where("owner", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    name: d.data().name ?? "(sin nombre)",
    owner: d.data().owner ?? "",
    isPersonal: !!d.data().isPersonal,
    createdAt: d.data().createdAt ?? "",
  }));
};

/** Delete team documents by ID. Does NOT delete subcollections (members/activity/scores).
 *  Subcollections are cleaned up automatically by Firestore TTL or Firebase Extensions.
 */
export const deletePersonalTeams = async (ids: string[]): Promise<void> => {
  for (const id of ids) {
    await deleteDoc(doc(db, "teams", id));
    console.log(`🗑 Deleted personal team: ${id}`);
  }
  console.log(`✅ Deleted ${ids.length} personal team(s).`);
};
