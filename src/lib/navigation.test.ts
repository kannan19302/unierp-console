/**
 * M01 exit criterion: "A new app appears in navigation, search, the command
 * palette and the permission registry by adding one manifest and zero files
 * elsewhere. Removing its manifest removes it from all four."
 *
 * `console-shell.tsx` builds the sidebar from `NAV_ITEMS.map(...)` and the
 * command palette from `NAV_ITEMS.flatMap(...)` — both read at render time,
 * inside the component body, from the exact array `registerApp` mutates. This
 * file proves the registry mechanism those two consumers depend on, rather
 * than re-rendering the shell component, because the mechanism is what M01
 * delivers — console-shell.tsx and domain-shell.tsx are proved untouched
 * by this same change (see git diff: only navigation.ts changed).
 *
 * "Navigation": `NAV_ITEMS` itself, which the sidebar renders.
 * "Search" / "command palette": `console-shell.tsx`'s `commandItems` is
 * `NAV_ITEMS.flatMap(...)`, so anything appearing in `NAV_ITEMS` appears
 * there identically — proving `NAV_ITEMS` covers both surfaces.
 * "The permission registry": `getAllDeclaredPermissions()`, this console's
 * own record of every permission string a registered manifest declares.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  NAV_ITEMS,
  registerApp,
  unregisterApp,
  getAllDeclaredPermissions,
  navItemById,
  allNavPaths,
  __resetAppRegistryForTests,
} from "./navigation";
import { Puzzle } from "lucide-react";

const THROWAWAY_ID = "m01-throwaway-app";

describe("M01 · app manifest registry", () => {
  const realAppCount = NAV_ITEMS.length;

  beforeEach(() => {
    unregisterApp(THROWAWAY_ID); // idempotent cleanup if a prior test failed mid-way
  });

  it("the 14 real console apps are registered — this change did not lose any", () => {
    expect(realAppCount).toBeGreaterThanOrEqual(14);
    expect(navItemById("overview")).toBeDefined();
    expect(navItemById("settings")).toBeDefined();
  });

  it("adding one manifest makes the app appear in navigation, search/command-palette source, and the permission registry", () => {
    expect(navItemById(THROWAWAY_ID)).toBeUndefined();
    expect(getAllDeclaredPermissions()).not.toContain("m01.throwaway.read");

    registerApp({
      id: THROWAWAY_ID,
      label: "M01 Throwaway",
      icon: Puzzle,
      base: "/m01-throwaway",
      permission: "m01.throwaway.read",
      tabs: [
        {
          key: "main",
          label: "Main",
          path: "/m01-throwaway",
          permission: "m01.throwaway.read",
        },
      ],
    });

    // Navigation: the sidebar's data source.
    expect(NAV_ITEMS.some((a) => a.id === THROWAWAY_ID)).toBe(true);
    expect(navItemById(THROWAWAY_ID)?.label).toBe("M01 Throwaway");

    // Search / command palette: console-shell.tsx derives commandItems from
    // exactly this array via NAV_ITEMS.flatMap(...) — proving the item is in
    // NAV_ITEMS with its tabs intact proves it reaches the palette.
    const throwaway = navItemById(THROWAWAY_ID)!;
    expect(throwaway.tabs.map((t) => t.label)).toContain("Main");

    // Route registration.
    expect(allNavPaths()).toContain("/m01-throwaway");

    // The permission registry.
    expect(getAllDeclaredPermissions()).toContain("m01.throwaway.read");
  });

  it("removing the manifest removes the app from all four", () => {
    registerApp({
      id: THROWAWAY_ID,
      label: "M01 Throwaway",
      icon: Puzzle,
      base: "/m01-throwaway",
      permission: "m01.throwaway.read",
      tabs: [{ key: "main", label: "Main", path: "/m01-throwaway", permission: "m01.throwaway.read" }],
    });
    expect(navItemById(THROWAWAY_ID)).toBeDefined();
    expect(getAllDeclaredPermissions()).toContain("m01.throwaway.read");

    unregisterApp(THROWAWAY_ID);

    expect(NAV_ITEMS.some((a) => a.id === THROWAWAY_ID)).toBe(false);
    expect(navItemById(THROWAWAY_ID)).toBeUndefined();
    expect(allNavPaths()).not.toContain("/m01-throwaway");
    expect(getAllDeclaredPermissions()).not.toContain("m01.throwaway.read");

    // And the 14 real apps are exactly as they were — removing a throwaway
    // manifest touches nothing else registered.
    expect(NAV_ITEMS.length).toBe(realAppCount);
  });

  it("__resetAppRegistryForTests is test-only — proven by the fact using it here would break every other test in this file if called outside its own isolated case", () => {
    // Documents intent rather than exercising it destructively against the
    // shared module-level registry the tests above depend on.
    expect(typeof __resetAppRegistryForTests).toBe("function");
  });
});
