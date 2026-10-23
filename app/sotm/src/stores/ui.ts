import { create } from "zustand";
export const useUI = create<{
  message: string;
  notify: (message: string) => void;
}>((set) => ({
  message: "",
  notify: (message) => {
    set({ message });
    setTimeout(
      () => set((s) => (s.message === message ? { message: "" } : s)),
      5000,
    );
  },
}));
