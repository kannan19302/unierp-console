import { expect, test } from "@playwright/test";
import { TEST_AGENT_COOKIE } from "./auth.setup";

const response = (body: unknown) => ({ status: 200, contentType: "application/json", body: JSON.stringify(body) });

test.beforeEach(async ({ context, page }) => {
  await context.addCookies([TEST_AGENT_COOKIE]);
  await page.route("**/api/session", (route) => route.fulfill(response({})));
  await page.route("**/api/v1/platform/v1/operations/dashboard**", (route) => route.fulfill(response({
    status: "HEALTHY",
    metrics: { queueDepth: 18, deadLetters: 2, outboxLagSeconds: 4, degradedTenants: 1 },
  })));
  await page.route("**/api/v1/platform/v1/operations/health**", (route) => {
    if (route.request().url().includes("/health/services")) {
      return route.fulfill(response({ data: [
        { service: "database", name: "Application database", status: "HEALTHY", latencyMs: 4, observedAt: "2026-09-21T10:00:00.000Z" },
        { service: "worker", name: "Notification worker", status: "DEGRADED", latencyMs: 84, observedAt: "2026-09-21T10:00:00.000Z" },
      ] }));
    }
    return route.fulfill(response({
      status: "OK", timestamp: "2026-09-21T10:00:00.000Z", metrics: { cpuUsage: 28, memoryUsage: 61, totalMemoryGB: 64, apiLatencyMs: 42 },
    }));
  });
  await page.route("**/api/v1/platform/v1/operations/jobs**", (route) => route.fulfill(response({ data: [
    { name: "outbox-delivery", pending: 7, processing: 2, completed: 1240, deadLetter: 2, status: "RUNNING" },
    { name: "billing-rollup", pending: 0, processing: 0, completed: 96, deadLetter: 0, status: "IDLE" },
  ] })));
  await page.route("**/api/v1/platform/v1/operations/incidents**", (route) => route.fulfill(response({ data: [
    { id: "incident-1", severity: "HIGH", status: "INVESTIGATING" },
  ] })));
});

test("presents measured operations without fabricated destinations", async ({ page }) => {
  await page.goto("/ops");
  await expect(page.getByRole("heading", { name: "Platform operations" })).toBeVisible();
  await expect(page.getByText("Measured sources agree")).toBeVisible();
  await expect(page.getByText("Application database")).toBeVisible();
  await expect(page.getByText("Cluster overview not configured")).toBeVisible();
  await expect(page.getByText("Unknown%" )).toHaveCount(0);
  await expect(page.locator('a[href^="http://localhost"]')).toHaveCount(0);
});

test("contains the operations workspace at a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/ops");
  await expect(page.getByRole("heading", { name: "Platform operations" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await expect(page.getByRole("button", { name: "Refresh telemetry" })).toBeVisible();
});
