// ============================================
// TASKLYN — Server-side auth helpers
// ============================================
import { adminAuth } from "@/lib/admin";

export interface AuthenticatedUser {
  uid: string;
  email?: string;
}

export async function verifyBearerToken(
  authHeader: string | null,
): Promise<AuthenticatedUser> {
  if (!adminAuth) {
    throw new Error("Firebase Admin is not configured");
  }

  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }

  const idToken = authHeader.replace("Bearer ", "").trim();
  const decoded = await adminAuth.verifyIdToken(idToken);
  return { uid: decoded.uid, email: decoded.email };
}
