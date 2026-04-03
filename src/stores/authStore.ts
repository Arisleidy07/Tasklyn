"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { createUser, getUser, subscribeToUser } from "@/lib/firestore";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthReady: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

// Convert Firebase user to our User type
const firebaseToUser = (firebaseUser: FirebaseUser): User => ({
  id: firebaseUser.uid,
  name: firebaseUser.displayName || "Anonymous",
  email: firebaseUser.email || "",
  photoURL: firebaseUser.photoURL || "",
  plan: "FREE",
  createdAt: new Date().toISOString(),
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      firebaseUser: null,
      isAuthenticated: false,
      isLoading: false,
      isAuthReady: false,

      login: async () => {
        set({ isLoading: true });
        try {
          const result = await signInWithPopup(auth, googleProvider);
          const firebaseUser = result.user;

          // Check if user exists in Firestore
          let user = await getUser(firebaseUser.uid);

          // If new user, create in Firestore
          if (!user) {
            user = firebaseToUser(firebaseUser);
            await createUser(user);
          }

          set({
            user,
            firebaseUser,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error("Login error:", error);
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await signOut(auth);
          set({
            user: null,
            firebaseUser: null,
            isAuthenticated: false,
          });
        } catch (error) {
          console.error("Logout error:", error);
          throw error;
        }
      },

      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user }),
    },
  ),
);

// Initialize auth state listener
export const initAuthListener = () => {
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      let user = await getUser(firebaseUser.uid);

      if (!user) {
        user = firebaseToUser(firebaseUser);
        await createUser(user);
      }

      useAuthStore.setState({
        user,
        firebaseUser,
        isAuthenticated: true,
        isAuthReady: true,
        isLoading: false,
      });

      subscribeToUser(firebaseUser.uid, (updatedUser) => {
        if (updatedUser) {
          useAuthStore.setState({ user: updatedUser });
        }
      });
    } else {
      useAuthStore.setState({
        user: null,
        firebaseUser: null,
        isAuthenticated: false,
        isAuthReady: true,
        isLoading: false,
      });
    }
  });
};
