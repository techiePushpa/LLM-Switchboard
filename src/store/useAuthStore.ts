import { create } from "zustand";
import { apiFetch, ApiError, setAccessToken } from "@/lib/api";
import type { AuthUser } from "@/types/auth";

type AuthStatus = "checking" | "authenticated" | "unauthenticated";

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;

  bootstrap: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAllDevices: () => Promise<void>;
  updateProfile: (patch: { name?: string; defaultModel?: string }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "checking",
  error: null,

  // Runs once on app load. There's no access token yet (it lives only in
  // memory and resets on refresh), so we ask the API to mint a new one
  // using the httpOnly refresh cookie -- if there's no valid cookie,
  // this just resolves to "logged out" instead of throwing.
  bootstrap: async () => {
    try {
      const data = await apiFetch<{ accessToken: string; user: AuthUser }>("/api/auth/refresh", {
        method: "POST",
      });
      setAccessToken(data.accessToken);
      set({ user: data.user, status: "authenticated" });
    } catch {
      set({ user: null, status: "unauthenticated" });
    }
  },

  register: async (name, email, password) => {
    set({ error: null });
    try {
      const data = await apiFetch<{ accessToken: string; user: AuthUser }>("/api/auth/register", {
        method: "POST",
        body: { name, email, password },
      });
      setAccessToken(data.accessToken);
      set({ user: data.user, status: "authenticated" });
    } catch (err) {
      set({ error: err instanceof ApiError ? err.message : "Couldn't create your account." });
      throw err;
    }
  },

  login: async (email, password) => {
    set({ error: null });
    try {
      const data = await apiFetch<{ accessToken: string; user: AuthUser }>("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });
      setAccessToken(data.accessToken);
      set({ user: data.user, status: "authenticated" });
    } catch (err) {
      set({ error: err instanceof ApiError ? err.message : "Couldn't log you in." });
      throw err;
    }
  },

  logout: async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } finally {
      setAccessToken(null);
      set({ user: null, status: "unauthenticated" });
    }
  },

  logoutAllDevices: async () => {
    try {
      await apiFetch("/api/auth/logout-all", { method: "POST" });
    } finally {
      setAccessToken(null);
      set({ user: null, status: "unauthenticated" });
    }
  },

  updateProfile: async (patch) => {
    const data = await apiFetch<{ user: AuthUser }>("/api/auth/me", {
      method: "PATCH",
      body: patch,
    });
    set({ user: data.user });
  },

  changePassword: async (currentPassword, newPassword) => {
    const data = await apiFetch<{ accessToken: string }>("/api/auth/change-password", {
      method: "POST",
      body: { currentPassword, newPassword },
    });
    setAccessToken(data.accessToken);
  },

  deleteAccount: async () => {
    await apiFetch("/api/auth/me", { method: "DELETE" });
    setAccessToken(null);
    set({ user: null, status: "unauthenticated" });
  },

  clearError: () => set({ error: null }),
}));

// Re-exported so components don't need to know the store shape just to
// check "am I logged in".
export function currentUser() {
  return useAuthStore.getState().user;
}
