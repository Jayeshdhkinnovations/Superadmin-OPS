import { create } from "zustand";

let nextId = 1;

export const useToastStore = create((set, get) => ({
  toasts: [],
  push: (type, message) => {
    const id = nextId++;
    set({ toasts: [...get().toasts, { id, type, message }] });
    setTimeout(() => get().dismiss(id), 3500);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export const toast = {
  success: (message) => useToastStore.getState().push("success", message),
  error: (message) => useToastStore.getState().push("error", message),
  info: (message) => useToastStore.getState().push("info", message),
};
