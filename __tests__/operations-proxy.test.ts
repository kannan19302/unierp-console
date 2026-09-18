// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { proxyOperationsRead } from "../src/lib/operations-proxy";

afterEach(() => vi.unstubAllGlobals());
describe("operations adapter", () => {
  it("requires authentication before contacting the backend", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    expect((await proxyOperationsRead(new NextRequest("http://localhost/api"), "queues")).status).toBe(401);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each([403, 404, 503])("preserves HTTP %s instead of inventing telemetry", async status => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"message":"Unavailable"}', { status })));
    const response = await proxyOperationsRead(new NextRequest("http://localhost/api", { headers: { authorization: "Bearer synthetic-test" } }), "queues");
    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ message: "Unavailable" });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("reports network failure without fallback services", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("connection refused")));
    const response = await proxyOperationsRead(new NextRequest("http://localhost/api", { headers: { authorization: "Bearer synthetic-test" } }), "health/services");
    expect(response.status).toBe(502);
    expect(await response.json()).not.toHaveProperty("data");
  });
});
