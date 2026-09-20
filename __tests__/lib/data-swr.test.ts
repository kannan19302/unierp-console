import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { api } from "@/lib/api";
import { useList, useItem, clearDataCache } from "@/lib/data";

describe("Data SWR Caching (WS7)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearDataCache();
  });

  it("serves stale cached list data immediately while revalidating", async () => {
    const mockData1 = [{ id: "1", name: "Alpha" }];
    const mockData2 = [{ id: "1", name: "Alpha Updated" }];

    vi.spyOn(api, "get").mockResolvedValueOnce({ data: mockData1, status: 200 });

    // First mount
    const hook1 = renderHook(() => useList<{ id: string; name: string }>({ path: "/tenants" }));
    await waitFor(() => expect(hook1.result.current.loading).toBe(false));
    expect(hook1.result.current.data).toEqual(mockData1);

    // Second mount with same path should immediately have cached data
    vi.spyOn(api, "get").mockResolvedValueOnce({ data: mockData2, status: 200 });
    const hook2 = renderHook(() => useList<{ id: string; name: string }>({ path: "/tenants" }));

    // Immediate cached data available synchronously
    expect(hook2.result.current.data).toEqual(mockData1);

    // Background revalidation updates the data
    await waitFor(() => expect(hook2.result.current.data).toEqual(mockData2));
  });

  it("serves stale cached item data immediately while revalidating", async () => {
    const item1 = { id: "item-1", status: "PENDING" };
    const item2 = { id: "item-1", status: "ACTIVE" };

    vi.spyOn(api, "get").mockResolvedValueOnce({ data: item1, status: 200 });

    // First mount
    const hook1 = renderHook(() => useItem<{ id: string; status: string }>("/status/1"));
    await waitFor(() => expect(hook1.result.current.data).toEqual(item1));

    // Second mount immediately has item1
    vi.spyOn(api, "get").mockResolvedValueOnce({ data: item2, status: 200 });
    const hook2 = renderHook(() => useItem<{ id: string; status: string }>("/status/1"));
    expect(hook2.result.current.data).toEqual(item1);

    // Background revalidation updates to item2
    await waitFor(() => expect(hook2.result.current.data).toEqual(item2));
  });

  it("clears cache via clearDataCache", async () => {
    const item = { id: "item-1", title: "Test" };
    vi.spyOn(api, "get").mockResolvedValueOnce({ data: item, status: 200 });

    const hook1 = renderHook(() => useItem<{ id: string; title: string }>("/record/1"));
    await waitFor(() => expect(hook1.result.current.data).toEqual(item));

    clearDataCache();

    vi.spyOn(api, "get").mockResolvedValueOnce({ data: { id: "item-1", title: "Refetched" }, status: 200 });
    const hook2 = renderHook(() => useItem<{ id: string; title: string }>("/record/1"));
    // Since cache was cleared, initial data is null
    expect(hook2.result.current.data).toBeNull();
    await waitFor(() => expect(hook2.result.current.data?.title).toBe("Refetched"));
  });
});
