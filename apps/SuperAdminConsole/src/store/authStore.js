import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: null,
  isSuperAdmin: false,
  isLoading: true,
  setUser: (user) =>
    set({
      user,
      isSuperAdmin: user?.role === "super_admin",
      isLoading: false,
    }),
  clear: () => set({ user: null, isSuperAdmin: false, isLoading: false }),
}));
