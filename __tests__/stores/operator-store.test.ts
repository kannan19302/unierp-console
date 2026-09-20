import { describe, it, expect, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useOperatorStore } from "@/lib/stores/operator-store";

describe("useOperatorStore (WS10)", () => {
  beforeEach(() => {
    act(() => {
      useOperatorStore.getState().clearOperator();
      useOperatorStore.setState({ permissions: ["*"] });
    });
  });

  it("sets operator profile and checks permissions", () => {
    act(() => {
      useOperatorStore.getState().setOperator({
        id: "op-1",
        email: "test.agent@unierp.com",
        name: "Test Agent",
        role: "SUPER_ADMIN",
      });
    });

    expect(useOperatorStore.getState().operator?.email).toBe("test.agent@unierp.com");
    // With universal permission "*", any permission passes
    expect(useOperatorStore.getState().hasPermission("pcc.billing.manage")).toBe(true);
  });

  it("enforces granular permissions correctly", () => {
    act(() => {
      useOperatorStore.getState().setPermissions(["pcc.tenants.view", "pcc.tenants.edit"]);
    });

    expect(useOperatorStore.getState().hasPermission("pcc.tenants.view")).toBe(true);
    expect(useOperatorStore.getState().hasPermission("pcc.billing.manage")).toBe(false);
  });

  it("updates operator preferences", () => {
    act(() => {
      useOperatorStore.getState().setPreferences({ density: "compact" });
    });

    expect(useOperatorStore.getState().preferences.density).toBe("compact");
  });
});
