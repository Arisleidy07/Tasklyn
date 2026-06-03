// ============================================
// TASKLYN — Subscription Firestore Functions
// ============================================

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  Subscription,
  PaymentHistory,
  PlanType,
} from "@/types/subscription";

const subscriptionsCollection = collection(db, "subscriptions");
const paymentsCollection = collection(db, "payments");

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

// Create a new subscription
export const createSubscription = async (
  subscription: Omit<Subscription, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  const subscriptionRef = doc(subscriptionsCollection);
  await setDoc(subscriptionRef, {
    ...subscription,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return subscriptionRef.id;
};

// Get subscription by ID
export const getSubscription = async (
  subscriptionId: string
): Promise<Subscription | null> => {
  const subscriptionRef = doc(db, "subscriptions", subscriptionId);
  const snap = await getDoc(subscriptionRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    ...data,
    id: snap.id,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    currentPeriodStart: toDate(data.currentPeriodStart),
    currentPeriodEnd: toDate(data.currentPeriodEnd),
    trialStart: data.trialStart ? toDate(data.trialStart) : undefined,
    trialEnd: data.trialEnd ? toDate(data.trialEnd) : undefined,
    cancelledAt: data.cancelledAt ? toDate(data.cancelledAt) : undefined,
    gracePeriodEnd: data.gracePeriodEnd ? toDate(data.gracePeriodEnd) : undefined,
  } as Subscription;
};

// Get subscription by user ID
export const getUserSubscription = async (
  userId: string
): Promise<Subscription | null> => {
  const q = query(subscriptionsCollection, where("userId", "==", userId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const doc = snap.docs[0];
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    currentPeriodStart: toDate(data.currentPeriodStart),
    currentPeriodEnd: toDate(data.currentPeriodEnd),
    trialStart: data.trialStart ? toDate(data.trialStart) : undefined,
    trialEnd: data.trialEnd ? toDate(data.trialEnd) : undefined,
    cancelledAt: data.cancelledAt ? toDate(data.cancelledAt) : undefined,
    gracePeriodEnd: data.gracePeriodEnd ? toDate(data.gracePeriodEnd) : undefined,
  } as Subscription;
};

// Update subscription
export const updateSubscription = async (
  subscriptionId: string,
  updates: Partial<Subscription>
): Promise<void> => {
  const subscriptionRef = doc(db, "subscriptions", subscriptionId);
  const { id, createdAt, ...rest } = updates;
  await updateDoc(subscriptionRef, {
    ...rest,
    updatedAt: serverTimestamp(),
  });
};

// Subscribe to user's subscription
export const subscribeToUserSubscription = (
  userId: string,
  callback: (subscription: Subscription | null) => void
): Unsubscribe => {
  const q = query(subscriptionsCollection, where("userId", "==", userId));

  return onSnapshot(q, (snap) => {
    if (snap.empty) {
      callback(null);
      return;
    }
    const doc = snap.docs[0];
    const data = doc.data();
    callback({
      ...data,
      id: doc.id,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
      currentPeriodStart: toDate(data.currentPeriodStart),
      currentPeriodEnd: toDate(data.currentPeriodEnd),
      trialStart: data.trialStart ? toDate(data.trialStart) : undefined,
      trialEnd: data.trialEnd ? toDate(data.trialEnd) : undefined,
      cancelledAt: data.cancelledAt ? toDate(data.cancelledAt) : undefined,
      gracePeriodEnd: data.gracePeriodEnd
        ? toDate(data.gracePeriodEnd)
        : undefined,
    } as Subscription);
  });
};

// Get payment history for user
export const getUserPaymentHistory = async (
  userId: string
): Promise<PaymentHistory[]> => {
  const q = query(paymentsCollection, where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: toDate(data.createdAt),
    } as PaymentHistory;
  });
};

// Cancel subscription locally (updates Firestore)
export const cancelLocalSubscription = async (
  subscriptionId: string,
  reason?: string
): Promise<void> => {
  const subscriptionRef = doc(db, "subscriptions", subscriptionId);
  await updateDoc(subscriptionRef, {
    status: "cancelled",
    cancelAtPeriodEnd: true,
    cancelledAt: serverTimestamp(),
    cancelReason: reason || "User requested",
    updatedAt: serverTimestamp(),
  });
};

// Reactivate a cancelled subscription
export const reactivateSubscription = async (
  subscriptionId: string
): Promise<void> => {
  const subscriptionRef = doc(db, "subscriptions", subscriptionId);
  await updateDoc(subscriptionRef, {
    status: "active",
    cancelAtPeriodEnd: false,
    updatedAt: serverTimestamp(),
  });
};

// Check if subscription is active
export const isSubscriptionActive = (subscription: Subscription | null): boolean => {
  if (!subscription) return false;
  if (subscription.status === "active") return true;
  if (subscription.status === "cancelled" && !subscription.cancelAtPeriodEnd) {
    // Check if still within current period
    const periodEnd = new Date(subscription.currentPeriodEnd);
    return periodEnd > new Date();
  }
  return false;
};

// Check if user needs downgrade (expired subscription)
export const shouldDowngradeUser = (subscription: Subscription | null): boolean => {
  if (!subscription) return true;
  if (subscription.status === "expired") return true;
  if (subscription.status === "cancelled" && subscription.cancelAtPeriodEnd) {
    const periodEnd = new Date(subscription.currentPeriodEnd);
    return periodEnd < new Date();
  }
  return false;
};
