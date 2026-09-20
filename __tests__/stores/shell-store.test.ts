import { describe, it, expect, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useShellStore } from "@/lib/stores/shell-store";

describe("useShellStore (WS10)", () => {
  beforeEach(() => {
    act(() => {
      useShellStore.setState({
        sidebarCollapsed: false,
        sidebarHidden: false,
        commandPaletteOpen: false,
        activeNavItem: "overview",
      });
    });
  });

  it("toggles sidebar collapsed state", () => {
    expect(useShellStore.getState().sidebarCollapsed).toBe(false);

    act(() => {
      useShellStore.getState().toggleSidebar();
    });
    expect(useShellStore.getState().sidebarCollapsed).toBe(true);

    act(() => {
      useShellStore.getState().toggleSidebar();
    });
    expect(useShellStore.getState().sidebarCollapsed).toBe(false);
  });

  it("sets command palette open state", () => {
    act(() => {
      useShellStore.getState().setCommandPaletteOpen(true);
    });
    expect(useShellStore.getState().commandPaletteOpen).toBe(true);
  });

  it("sets active nav item", () => {
    act(() => {
      useShellStore.getState().setActiveNavItem("tenants");
    });
    expect(useShellStore.getState().activeNavItem).toBe("tenants");
  });
});
