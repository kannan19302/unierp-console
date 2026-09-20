import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFilterSort } from "../../src/lib/use-filter-sort";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/test",
}));

describe("useFilterSort hook", () => {
  it("initializes with provided defaults", () => {
    const { result } = renderHook(() =>
      useFilterSort({
        defaultSort: "createdAt",
        defaultDirection: "desc",
        syncUrl: false,
      })
    );

    expect(result.current.sortColumn).toBe("createdAt");
    expect(result.current.sortDirection).toBe("desc");
    expect(result.current.filters).toEqual({});
  });

  it("updates sort column and toggles directions", () => {
    const { result } = renderHook(() =>
      useFilterSort({
        defaultSort: "name",
        defaultDirection: "asc",
        syncUrl: false,
      })
    );

    act(() => {
      result.current.toggleSort("name");
    });
    expect(result.current.sortDirection).toBe("desc");

    act(() => {
      result.current.setSort("name", "asc");
    });
    expect(result.current.sortDirection).toBe("asc");
  });

  it("manages filter updates and clear operations", () => {
    const { result } = renderHook(() =>
      useFilterSort({
        syncUrl: false,
      })
    );

    act(() => {
      result.current.setFilter("tier", "ENTERPRISE");
    });
    expect(result.current.filters).toEqual({
      tier: "ENTERPRISE",
    });

    act(() => {
      result.current.setFilter("status", "ACTIVE");
    });
    expect(result.current.filters).toEqual({
      tier: "ENTERPRISE",
      status: "ACTIVE",
    });

    act(() => {
      result.current.removeFilter("tier");
    });
    expect(result.current.filters).toEqual({
      status: "ACTIVE",
    });

    act(() => {
      result.current.clearFilters();
    });
    expect(result.current.filters).toEqual({});
  });
});
