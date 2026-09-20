import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface ShellState {
  sidebarCollapsed: boolean;
  sidebarHidden: boolean;
  commandPaletteOpen: boolean;
  activeNavItem: string;

  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarHidden: (hidden: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setActiveNavItem: (item: string) => void;
}

export const useShellStore = create<ShellState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      sidebarHidden: false,
      commandPaletteOpen: false,
      activeNavItem: "overview",

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),

      setSidebarHidden: (sidebarHidden) => set({ sidebarHidden }),

      setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),

      setActiveNavItem: (activeNavItem) => set({ activeNavItem }),
    }),
    {
      name: "unierp_shell_store",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : ({} as Storage))),
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    }
  )
);
