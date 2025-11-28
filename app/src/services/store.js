import { create } from "zustand";
import { persist } from "zustand/middleware";

const store = create(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set(() => ({ user })),

      organization: null,
      setOrganization: (organization) => set(() => ({ organization })),

      darkMode: false,
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      setDarkMode: (darkMode) => set(() => ({ darkMode })),
    }),
    {
      name: "app-storage",
      partialize: (state) => ({ darkMode: state.darkMode }),
    }
  )
);

export default store;
