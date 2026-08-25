import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";

describe("privileged control-plane request headers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards purge confirmation and break-glass headers with the JSON request", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => JSON.stringify({ message: "Tenant permanently purged" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await api.post(
      "/platform/v1/tenants/tenant-1/purge",
      {},
      {
        headers: {
          "x-confirm-purge": "true",
          "x-break-glass-reason": "INC-1001 approved emergency purge",
          "x-correlation-id": "correlation-1",
        },
      },
    );

    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(init.body).toBe("{}");
    expect(init.headers).toMatchObject({
      "Content-Type": "application/json",
      "x-confirm-purge": "true",
      "x-break-glass-reason": "INC-1001 approved emergency purge",
      "x-correlation-id": "correlation-1",
    });
  });
});
