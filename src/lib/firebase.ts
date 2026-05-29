// ============================================
// TASKLYN — Firebase Configuration
// ============================================
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCKZQKXkOw2rTTuDd16hR6f9xa2m8qIQhM",
  authDomain: "tasklyn-51996.firebaseapp.com",
  projectId: "tasklyn-51996",
  storageBucket: "tasklyn-51996.firebasestorage.app",
  messagingSenderId: "594302321618",
  appId: "1:594302321618:web:8c275079dc68bcd3acfe0b",
  measurementId: "G-H6SKRKBKPT",
};

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
      experimentalAutoDetectLongPolling: true,
    });
  } catch {
    return getFirestore(app);
  }
})();

export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();

export default app;
