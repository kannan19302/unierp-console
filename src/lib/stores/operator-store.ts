import { create } from "zustand";

export interface OperatorProfile {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface OperatorPreferences {
  density: "comfortable" | "compact";
  emailAlerts: boolean;
}

export interface OperatorState {
  operator: OperatorProfile | null;
  permissions: string[];
  preferences: OperatorPreferences;

  setOperator: (operator: OperatorProfile | null) => void;
  setPermissions: (permissions: string[]) => void;
  setPreferences: (preferences: Partial<OperatorPreferences>) => void;
  hasPermission: (permission: string) => boolean;
  clearOperator: () => void;
}

export const useOperatorStore = create<OperatorState>()((set, get) => ({
  operator: null,
  permissions: ["*"], // default fallback to universal permission
  preferences: {
    density: "comfortable",
    emailAlerts: true,
  },

  setOperator: (operator) => set({ operator }),

  setPermissions: (permissions) => set({ permissions }),

  setPreferences: (prefs) =>
    set((state) => ({ preferences: { ...state.preferences, ...prefs } })),

  hasPermission: (permission: string) => {
    const { permissions } = get();
    if (permissions.includes("*")) return true;
    return permissions.includes(permission);
  },

  clearOperator: () => set({ operator: null, permissions: [] }),
}));
