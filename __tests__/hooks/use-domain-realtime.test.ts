import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDomainRealtime } from "../../src/lib/use-domain-realtime";

// Mock event listener bus
const listeners: Record<string, ((data: any) => void)[]> = {};
const mockSocket = {
  on: vi.fn((event: string, cb: (data: any) => void) => {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(cb);
  }),
  off: vi.fn((event: string, cb: (data: any) => void) => {
    if (listeners[event]) {
      listeners[event] = listeners[event].filter((fn) => fn !== cb);
    }
  }),
};

vi.mock("../../src/lib/use-console-socket", () => ({
  useConsoleSocket: () => ({
    socket: mockSocket,
    isConnected: true,
  }),
}));

vi.mock("../../src/lib/hooks/use-console-socket", () => ({
  useConsoleSocket: () => ({
    socket: mockSocket,
    isConnected: true,
  }),
}));

describe("useDomainRealtime hook", () => {
  it("subscribes to domain events when connected", () => {
    const handleEvent = vi.fn();
    const { result } = renderHook(() => useDomainRealtime("tenants", handleEvent));

    expect(result.current.status).toBe("connected");
    expect(mockSocket.on).toHaveBeenCalledWith("tenants.created", expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith("tenants.updated", expect.any(Function));

    // Simulate receiving an event
    act(() => {
      listeners["tenants.created"]?.forEach((cb) => cb({ tenantId: "t-123" }));
    });

    expect(handleEvent).toHaveBeenCalledWith("tenants.created", { tenantId: "t-123" });
    expect(result.current.lastPayload).toEqual({ tenantId: "t-123" });
    expect(result.current.lastEventTime).toBeInstanceOf(Date);
  });
});
