import { describe, it, expect, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useThemeStore } from "@/lib/stores/theme-store";

describe("useThemeStore (WS10)", () => {
  beforeEach(() => {
    act(() => {
      useThemeStore.getState().setMode("dark");
      useThemeStore.getState().setDensity("comfortable");
    });
  });

  it("updates theme mode and document attribute", () => {
    expect(useThemeStore.getState().mode).toBe("dark");

    act(() => {
      useThemeStore.getState().setMode("light");
    });

    expect(useThemeStore.getState().mode).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("updates density and document attribute", () => {
    expect(useThemeStore.getState().density).toBe("comfortable");

    act(() => {
      useThemeStore.getState().setDensity("compact");
    });

    expect(useThemeStore.getState().density).toBe("compact");
    expect(document.documentElement.getAttribute("data-density")).toBe("compact");
  });
});
