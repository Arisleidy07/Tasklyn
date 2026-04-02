'use client';

import { create } from 'zustand';
import { User } from '@/types';
import { generateId } from '@/lib/utils';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

// Demo user for development — will be replaced by Firebase Auth
const DEMO_USER: User = {
  id: 'user-1',
  name: 'Alex Rivera',
  email: 'alex@tasklyn.app',
  photoURL: '',
  plan: 'FREE',
  createdAt: new Date().toISOString(),
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: () => {
    set({ isLoading: true });
    // Simulate Google login delay
    setTimeout(() => {
      set({
        user: { ...DEMO_USER, id: generateId() },
        isAuthenticated: true,
        isLoading: false,
      });
    }, 800);
  },

  logout: () => {
    set({ user: null, isAuthenticated: false });
  },

  updateUser: (updates) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    }));
  },
}));
