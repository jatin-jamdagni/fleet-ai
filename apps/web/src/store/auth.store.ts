import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id:         string;
  name:       string;
  email:      string;
  role:       string;
  tenantId:   string;
  tenantName: string;
  tenantPlan?: string;
}

interface AuthState {
  user:         User | null;
  accessToken:  string | null;
  refreshToken: string | null;
  setAuth:      (user: User, tokens: { accessToken: string; refreshToken: string }) => void;
  clearAuth:    () => void;
  isManager:    () => boolean;
  isDriver:     () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:         null,
      accessToken:  null,
      refreshToken: null,

      setAuth: (user, tokens) => {
        localStorage.setItem("accessToken",  tokens.accessToken);
        localStorage.setItem("refreshToken", tokens.refreshToken);
        set({ user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
      },

      clearAuth: () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        set({ user: null, accessToken: null, refreshToken: null });
      },

      isManager: () => {
        const role = get().user?.role;
        return role === "FLEET_MANAGER" || role === "SUPER_ADMIN";
      },

      isDriver: () => get().user?.role === "DRIVER",
    }),
    {
      name:    "fleet-auth",
      partialize: (s) => ({
        user:         s.user,
        accessToken:  s.accessToken,
        refreshToken: s.refreshToken,
      }),
    }
  )
);