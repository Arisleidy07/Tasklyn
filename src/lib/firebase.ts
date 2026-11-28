// ============================================
// TASKLYN — Firebase Configuration
// ============================================
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  connectAuthEmulator,
  signInWithCredential,
} from "firebase/auth";
import {
  initializeFirestore,
  getFirestore,
  connectFirestoreEmulator,
} from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getMessaging } from "firebase/messaging";

// Local testing against the Firebase Emulator Suite (never production data).
// Off unless NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true (see `npm run dev:emulators`).
const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";

// Your web app's Firebase configuration
const productionConfig = {
  apiKey: "AIzaSyCKZQKXkOw2rTTuDd16hR6f9xa2m8qIQhM",
  authDomain: "tasklyn-51996.firebaseapp.com",
  projectId: "tasklyn-51996",
  storageBucket: "tasklyn-51996.firebasestorage.app",
  messagingSenderId: "594302321618",
  appId: "1:594302321618:web:8c275079dc68bcd3acfe0b",
  measurementId: "G-H6SKRKBKPT",
};

const firebaseConfig = useEmulators
  ? {
      ...productionConfig,
      projectId: "demo-tasklyn",
      authDomain: "demo-tasklyn.firebaseapp.com",
      storageBucket: "demo-tasklyn.appspot.com",
    }
  : productionConfig;

// Initialize Firebase (prevent duplicate initialization in dev hot-reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Use initializeFirestore with long-polling auto-detection to prevent
// the Firebase watch-stream "INTERNAL ASSERTION FAILED: Unexpected state (ID: ca9)
// CONTEXT: {ve:-1}" bug which occurs on WebSocket race conditions.
// try/catch guards against Next.js hot-reload calling initializeFirestore twice.
export const db = (() => {
  try {
    return initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
  } catch {
    return getFirestore(app);
  }
})();

export const storage = getStorage(app);

if (useEmulators && typeof window !== "undefined") {
  const w = window as unknown as Record<string, unknown>;
  if (!w.__tasklynEmulatorsConnected) {
    w.__tasklynEmulatorsConnected = true;
    const port = (name: string, fallback: number) =>
      Number(process.env[`NEXT_PUBLIC_EMULATOR_${name}_PORT`] || fallback);
    connectAuthEmulator(auth, `http://127.0.0.1:${port("AUTH", 9299)}`, {
      disableWarnings: true,
    });
    connectFirestoreEmulator(db, "127.0.0.1", port("FIRESTORE", 8280));
    connectStorageEmulator(storage, "127.0.0.1", port("STORAGE", 9399));
    // Test-only sign-in (the Auth emulator accepts unsigned Google tokens).
    w.__tasklynEmulatorSignIn = (email: string, name = email.split("@")[0]) =>
      signInWithCredential(
        auth,
        GoogleAuthProvider.credential(
          JSON.stringify({ sub: email, email, name, email_verified: true }),
        ),
      );
  }
}

export const googleProvider = new GoogleAuthProvider();

export const messaging =
  typeof window !== "undefined" ? getMessaging(app) : null;

export default app;
