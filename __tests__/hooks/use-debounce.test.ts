import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "../../src/lib/use-debounce";

describe("useDebounce hook", () => {
  it("returns initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("hello", 300));
    expect(result.current).toBe("hello");
  });

  it("updates value only after delay", () => {
    vi.useFakeTimers();
    let val = "initial";
    const { result, rerender } = renderHook(() => useDebounce(val, 300));

    expect(result.current).toBe("initial");

    val = "updated";
    rerender();

    expect(result.current).toBe("initial");

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe("initial");

    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current).toBe("updated");

    vi.useRealTimers();
  });
});
