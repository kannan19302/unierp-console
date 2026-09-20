import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useTabSync } from "@/lib/hooks/use-tab-sync";

describe("useTabSync (WS8.11)", () => {
  let listeners: ((event: any) => void)[] = [];
  const mockPostMessage = vi.fn();
  const mockClose = vi.fn();

  class MockBroadcastChannel {
    name: string;
    constructor(name: string) {
      this.name = name;
    }
    postMessage(msg: any) {
      mockPostMessage(msg);
    }
    addEventListener(event: string, cb: any) {
      if (event === "message") listeners.push(cb);
    }
    removeEventListener(event: string, cb: any) {
      if (event === "message") {
        listeners = listeners.filter((l) => l !== cb);
      }
    }
    close() {
      mockClose();
    }
  }

  beforeEach(() => {
    listeners = [];
    vi.clearAllMocks();
    (globalThis as any).BroadcastChannel = MockBroadcastChannel;
  });

  afterEach(() => {
    delete (globalThis as any).BroadcastChannel;
  });

  it("initializes in an unlocked state", () => {
    const { result } = renderHook(() =>
      useTabSync({ entityType: "tenant", entityId: "t-123" })
    );

    expect(result.current.isLockedByOtherTab).toBe(false);
    expect(result.current.lockedBy).toBeNull();
  });

  it("acquires lock and broadcasts message", () => {
    const { result } = renderHook(() =>
      useTabSync({ entityType: "tenant", entityId: "t-123", operatorName: "Operator Alpha" })
    );

    act(() => {
      result.current.acquireLock();
    });

    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "LOCK",
        entityType: "tenant",
        entityId: "t-123",
        operatorName: "Operator Alpha",
      })
    );
  });

  it("updates isLockedByOtherTab when another tab broadcasts a lock", () => {
    const { result } = renderHook(() =>
      useTabSync({ entityType: "tenant", entityId: "t-123" })
    );

    // Another tab broadcasts LOCK
    act(() => {
      listeners.forEach((listener) =>
        listener({
          data: {
            type: "LOCK",
            entityType: "tenant",
            entityId: "t-123",
            tabId: "other-tab-456",
            operatorName: "Jane Doe",
            timestamp: Date.now(),
          },
        })
      );
    });

    expect(result.current.isLockedByOtherTab).toBe(true);
    expect(result.current.lockedBy?.operatorName).toBe("Jane Doe");

    // Other tab broadcasts UNLOCK
    act(() => {
      listeners.forEach((listener) =>
        listener({
          data: {
            type: "UNLOCK",
            entityType: "tenant",
            entityId: "t-123",
            tabId: "other-tab-456",
            timestamp: Date.now(),
          },
        })
      );
    });

    expect(result.current.isLockedByOtherTab).toBe(false);
    expect(result.current.lockedBy).toBeNull();
  });
});
