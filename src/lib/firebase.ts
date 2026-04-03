// ============================================
// TASKLYN — Firebase Configuration
// ============================================
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
