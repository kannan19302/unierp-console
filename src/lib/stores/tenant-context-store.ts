import { create } from "zustand";

export interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  status: string;
  tier?: string;
}

export interface TenantContextState {
  activeTenant: TenantSummary | null;
  tenantList: TenantSummary[];
  isImpersonating: boolean;

  setActiveTenant: (tenant: TenantSummary | null) => void;
  setTenantList: (list: TenantSummary[]) => void;
  startImpersonating: (tenant: TenantSummary) => void;
  stopImpersonating: () => void;
}

export const useTenantContextStore = create<TenantContextState>()((set) => ({
  activeTenant: {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Acme Corp",
    slug: "acme",
    status: "ACTIVE",
    tier: "enterprise",
  },
  tenantList: [],
  isImpersonating: false,

  setActiveTenant: (activeTenant) => set({ activeTenant }),

  setTenantList: (tenantList) => set({ tenantList }),

  startImpersonating: (tenant) =>
    set({ activeTenant: tenant, isImpersonating: true }),

  stopImpersonating: () =>
    set({
      activeTenant: {
        id: "00000000-0000-0000-0000-000000000001",
        name: "Acme Corp",
        slug: "acme",
        status: "ACTIVE",
        tier: "enterprise",
      },
      isImpersonating: false,
    }),
}));
