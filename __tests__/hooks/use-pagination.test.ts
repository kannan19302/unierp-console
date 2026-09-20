import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePagination } from "../../src/lib/use-pagination";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/test",
}));

describe("usePagination hook", () => {
  it("initializes with default page and pageSize", () => {
    const { result } = renderHook(() =>
      usePagination({
        defaultPageSize: 10,
        total: 50,
        syncUrl: false,
      })
    );

    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(10);
    expect(result.current.totalPages).toBe(5);
    expect(result.current.hasPrev).toBe(false);
    expect(result.current.hasNext).toBe(true);
  });

  it("advances page and updates hasNext/hasPrev correctly", () => {
    const { result } = renderHook(() =>
      usePagination({
        defaultPageSize: 10,
        total: 30,
        syncUrl: false,
      })
    );

    act(() => {
      result.current.setPage(2);
    });

    expect(result.current.page).toBe(2);
    expect(result.current.hasPrev).toBe(true);
    expect(result.current.hasNext).toBe(true);

    act(() => {
      result.current.setPage(3);
    });

    expect(result.current.page).toBe(3);
    expect(result.current.hasNext).toBe(false);
  });

  it("handles pageSize change", () => {
    const { result } = renderHook(() =>
      usePagination({
        defaultPageSize: 10,
        total: 35,
        syncUrl: false,
      })
    );

    act(() => {
      result.current.setPageSize(25);
    });

    expect(result.current.pageSize).toBe(25);
    expect(result.current.totalPages).toBe(2);
  });
});
