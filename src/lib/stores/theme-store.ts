import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ThemeMode = "dark" | "light" | "system";
export type LayoutDensity = "comfortable" | "compact";

export interface ThemeState {
  mode: ThemeMode;
  density: LayoutDensity;
  accentColor: string;

  setMode: (mode: ThemeMode) => void;
  setDensity: (density: LayoutDensity) => void;
  setAccentColor: (accentColor: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: "dark",
      density: "comfortable",
      accentColor: "default",

      setMode: (mode) => {
        set({ mode });
        if (typeof document !== "undefined") {
          document.documentElement.setAttribute("data-theme", mode);
        }
      },

      setDensity: (density) => {
        set({ density });
        if (typeof document !== "undefined") {
          document.documentElement.setAttribute("data-density", density);
        }
      },

      setAccentColor: (accentColor) => set({ accentColor }),
    }),
    {
      name: "unierp_theme_store",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : ({} as Storage))),
    }
  )
);
