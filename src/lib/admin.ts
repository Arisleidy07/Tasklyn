// ============================================
// TASKLYN — Firebase Admin SDK (server-side only)
// Used only in API routes. Never import in client components.
// ============================================
import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

function normalizePrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  // .env files often wrap the key in quotes with escaped \n
  return key.replace(/\\n/g, "\n").trim().replace(/^"/, "").replace(/"$/, "");
}

const isAdminConfigured =
  projectId && clientEmail && normalizePrivateKey(privateKey);

if (isAdminConfigured) {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: normalizePrivateKey(privateKey)!,
      }),
    });
  }
}

const app = getApps().length ? getApp() : null;

export const adminDb = app ? getFirestore(app) : null;
export const adminAuth = app ? getAuth(app) : null;

export function isServerAuthConfigured(): boolean {
  return !!adminDb && !!adminAuth;
}
