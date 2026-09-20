import { describe, it, expect, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useTenantContextStore } from "@/lib/stores/tenant-context-store";

describe("useTenantContextStore (WS10)", () => {
  beforeEach(() => {
    act(() => {
      useTenantContextStore.getState().stopImpersonating();
      useTenantContextStore.setState({ tenantList: [] });
    });
  });

  it("initializes with default Acme Corp enterprise tenant", () => {
    expect(useTenantContextStore.getState().activeTenant?.slug).toBe("acme");
    expect(useTenantContextStore.getState().isImpersonating).toBe(false);
  });

  it("handles impersonation switching and restore", () => {
    const customTenant = {
      id: "t-99",
      name: "Stark Industries",
      slug: "stark",
      status: "ACTIVE",
    };

    act(() => {
      useTenantContextStore.getState().startImpersonating(customTenant);
    });

    expect(useTenantContextStore.getState().activeTenant?.name).toBe("Stark Industries");
    expect(useTenantContextStore.getState().isImpersonating).toBe(true);

    act(() => {
      useTenantContextStore.getState().stopImpersonating();
    });

    expect(useTenantContextStore.getState().activeTenant?.slug).toBe("acme");
    expect(useTenantContextStore.getState().isImpersonating).toBe(false);
  });
});
