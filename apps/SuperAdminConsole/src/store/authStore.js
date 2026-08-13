import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: null,
  isSuperAdmin: false,
  isLoading: true,
  setUser: (user) =>
    set({
      user,
      // sub_admin accounts get the same console access as super_admin - see
      // authGuard.js's requireSuperAdmin on the server side, which already
      // accepts both roles. This just has to agree with it.
      isSuperAdmin: user?.role === "super_admin" || user?.role === "sub_admin",
      isLoading: false,
    }),
  clear: () => set({ user: null, isSuperAdmin: false, isLoading: false }),
}));
