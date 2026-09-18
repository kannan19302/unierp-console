import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../src/lib/api";
import { useItem, useList } from "../src/lib/data";

afterEach(() => vi.restoreAllMocks());

describe("operations query failure and refresh", () => {
  it("exposes denial instead of a successful empty list and recovers on awaited refresh", async () => {
    vi.spyOn(api, "get").mockRejectedValueOnce(new Error("Forbidden"))
      .mockResolvedValueOnce({ data: [{ name: "email", waiting: 3 }], status: 200 });
    const { result } = renderHook(() => useList<{ name: string }>({ path: "/platform/v1/operations/jobs" }));
    await waitFor(() => expect(result.current.error?.message).toBe("Forbidden"));
    expect(result.current.data).toEqual([]);
    await act(async () => { expect(await result.current.reload()).toBe(true); });
    expect(result.current.error).toBeNull();
    expect(result.current.data[0].name).toBe("email");
  });

  it("clears stale health on a failed refresh and reports failure", async () => {
    vi.spyOn(api, "get").mockResolvedValueOnce({ data: { status: "OK" }, status: 200 })
      .mockRejectedValueOnce(new Error("Offline"));
    const { result } = renderHook(() => useItem<{ status: string }>("/platform/v1/operations/health"));
    await waitFor(() => expect(result.current.data?.status).toBe("OK"));
    await act(async () => { expect(await result.current.reload()).toBe(false); });
    expect(result.current.data).toBeNull();
    expect(result.current.error?.message).toBe("Offline");
  });
});
