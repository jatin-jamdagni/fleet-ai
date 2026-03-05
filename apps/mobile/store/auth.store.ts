import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

interface User {
  id:           string;
  name:         string;
  email:        string;
  role:         string;
  tenantId:     string;
  tenantName:   string;
}

interface AuthState {
  user:         User | null;
  accessToken:  string | null;
  hydrated:     boolean;

  setAuth:   (user: User, tokens: { accessToken: string; refreshToken: string }) => Promise<void>;
  clearAuth: () => Promise<void>;
  hydrate:   () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user:        null,
  accessToken: null,
  hydrated:    false,

  setAuth: async (user, tokens) => {
    await SecureStore.setItemAsync("accessToken",  tokens.accessToken);
    await SecureStore.setItemAsync("refreshToken", tokens.refreshToken);
    set({ user, accessToken: tokens.accessToken });
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");
    set({ user: null, accessToken: null });
  },

  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync("accessToken");
      if (token) {
        // Re-fetch user from /me
        const { api, authApi } = await import("../lib/api");
        const res  = await authApi.me();
        const user = res.data.data;
        set({ user, accessToken: token });
      }
    } catch {
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");
    } finally {
      set({ hydrated: true });
    }
  },
}));