import { expect, test } from "@playwright/test";
import { TEST_AGENT_COOKIE } from "./auth.setup";

const response = (body: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify(body),
});

test.beforeEach(async ({ context, page }) => {
  await context.addCookies([TEST_AGENT_COOKIE]);
  await page.route("**/api/session", (route) => route.fulfill(response({})));
  await page.route("**/api/v1/platform/v1/super-admin/tenants**", (route) =>
    route.fulfill(
      response({
        data: [
          { id: "tenant-1", name: "Northwind", status: "ACTIVE", plan: "Enterprise", region: "eu-west" },
          { id: "tenant-2", name: "Contoso", status: "SUSPENDED", plan: "Growth", region: "us-east" },
        ],
        total: 2,
      }),
    ),
  );
  await page.route("**/api/v1/platform/v1/operations/dashboard**", (route) =>
    route.fulfill(
      response({ totalTenants: 2, activeTenants: 1, clustersHealthy: 3, clustersTotal: 4, mrr: 48250 }),
    ),
  );
  await page.route("**/api/v1/platform/v1/operations/incidents**", (route) =>
    route.fulfill(
      response({
        data: [{ id: "inc-1", title: "Database failover", severity: "HIGH", status: "INVESTIGATING" }],
        total: 1,
      }),
    ),
  );
});

test("shows sourced provider metrics and operational work", async ({ page }) => {
  await page.goto("/overview");

  await expect(page.getByRole("heading", { name: "Provider overview" })).toBeVisible();
  await expect(page.getByText("Telemetry unavailable")).toBeVisible();
  await expect(page.getByText("Database failover")).toBeVisible();
  await expect(page.getByText("All systems operational")).toHaveCount(0);
  await expect(page.getByText("99.98%")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Refresh" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Provision tenant" })).toBeVisible();
});

test("keeps the overview contained at a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/overview");
  await expect(page.getByRole("heading", { name: "Provider overview" })).toBeVisible();

  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
    .toBe(true);
  await expect(page.getByRole("button", { name: "Refresh" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Provision tenant" })).toBeVisible();
});
