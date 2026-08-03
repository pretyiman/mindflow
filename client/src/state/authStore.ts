import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '../api/auth.api';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  updateUser: (user: AuthUser) => void;
  logout: () => void;
}

// Persisted to localStorage so a page refresh doesn't drop the session -
// client.ts reads this via getState() (outside React) to attach the bearer
// token to every request.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      // Refreshes just the user record (e.g. after verifying email) without
      // touching the existing token/session.
      updateUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null })
    }),
    { name: 'mindflow-auth' }
  )
);
