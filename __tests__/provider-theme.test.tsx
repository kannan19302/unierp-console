import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@kannan19302/ui/theme";
import { ProviderThemeBoundary, ProviderThemeControl } from "../src/components/provider-theme";

beforeEach(() => {
  localStorage.clear();
  document.cookie = "unierp_theme=; Max-Age=0; Path=/";
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("provider appearance", () => {
  it.each([["light", "strata"], ["dark", "strata-dark"], ["strata-high-contrast", "strata-high-contrast"]])(
    "restores %s as %s", async (stored, expected) => {
      localStorage.setItem("unierp.theme", stored);
      render(<ThemeProvider defaultSetting="strata-dark"><ProviderThemeBoundary /><ProviderThemeControl /></ThemeProvider>);
      await waitFor(() => expect(document.documentElement).toHaveAttribute("data-theme", expected));
      expect(screen.getByRole("combobox", { name: "Appearance" })).toHaveValue(expected);
      fireEvent.change(screen.getByRole("combobox", { name: "Appearance" }), { target: { value: "strata-high-contrast" } });
      await waitFor(() => expect(document.documentElement).toHaveAttribute("data-theme", "strata-high-contrast"));
      expect(localStorage.getItem("unierp.theme")).toBe("strata-high-contrast");
    },
  );
});
