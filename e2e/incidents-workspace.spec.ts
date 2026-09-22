import { expect, test } from "@playwright/test";
import { TEST_AGENT_COOKIE } from "./auth.setup";

const response = (body: unknown) => ({ status: 200, contentType: "application/json", body: JSON.stringify(body) });

const incidents = [
  { id: "inc-gateway", title: "Gateway latency degradation", service: "api-gateway", severity: "CRITICAL", status: "INVESTIGATING", createdAt: "2026-09-22T04:00:00.000Z", updatedAt: "2026-09-22T04:30:00.000Z", timeline: [{ timestamp: "2026-09-22T04:00:00.000Z", actor: "System monitor", event: "Latency alert triggered" }, { timestamp: "2026-09-22T04:20:00.000Z", actor: "Platform operator", event: "Response team joined" }] },
  { id: "inc-database", title: "Database replication lag", service: "db-primary", severity: "MAJOR", status: "IDENTIFIED", createdAt: "2026-09-22T03:00:00.000Z", updatedAt: "2026-09-22T03:30:00.000Z", timeline: [] },
];

test.beforeEach(async ({ context, page }) => {
  await context.addCookies([TEST_AGENT_COOKIE]);
  await page.route("**/api/session", (route) => route.fulfill(response({})));
  await page.route("**/api/v1/platform/v1/incidents**", async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    const url = new URL(route.request().url());
    const search = (url.searchParams.get("search") ?? "").toLowerCase();
    const severity = url.searchParams.get("severity");
    const status = url.searchParams.get("status");
    const filtered = incidents.filter((incident) => (!search || `${incident.id} ${incident.title} ${incident.service}`.toLowerCase().includes(search)) && (!severity || incident.severity === severity) && (!status || incident.status === status));
    if (url.pathname.endsWith("/inc-gateway")) return route.fulfill(response(incidents[0]));
    if (url.pathname.endsWith("/inc-database")) return route.fulfill(response(incidents[1]));
    return route.fulfill(response(filtered));
  });
});

test("presents a measured incident register and guarded response actions", async ({ page }) => {
  let escalationBody: unknown;
  await page.route("**/api/v1/platform/v1/incidents/inc-database/escalate", async (route) => {
    escalationBody = route.request().postDataJSON();
    await route.fulfill(response({ ...incidents[1], severity: "CRITICAL" }));
  });

  await page.goto("/ops/incidents");
  await expect(page.getByRole("heading", { level: 1, name: "Incidents" })).toBeVisible();
  await expect(page.getByText("Gateway latency degradation", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /simulate/i })).toHaveCount(0);
  await expect(page.getByText("99.92%")).toHaveCount(0);

  const search = page.getByRole("searchbox", { name: "Search records" });
  await search.fill("database");
  await expect(page.getByText("Database replication lag", { exact: true })).toBeVisible();
  await expect(page.getByText("Gateway latency degradation", { exact: true })).toHaveCount(0);
  await search.clear();

  await page.getByRole("button", { name: "Open incident" }).nth(1).click();
  const drawer = page.getByRole("dialog", { name: "Incident inc-database" });
  await expect(drawer.getByRole("button", { name: "Escalate severity" })).toBeVisible();
  await drawer.getByRole("button", { name: "Escalate severity" }).click();
  const dialog = page.getByRole("dialog", { name: "Escalate incident" });
  await expect(dialog.getByRole("button", { name: "Escalate incident" })).toBeDisabled();
  await dialog.getByPlaceholder("Describe the measured change requiring escalation").fill("Replication lag is increasing");
  await dialog.getByRole("button", { name: "Escalate incident" }).click();
  await expect.poll(() => escalationBody).toEqual({ severity: "CRITICAL", note: "Replication lag is increasing" });
});

test("keeps incident evidence contained at a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/ops/incidents");
  await expect(page.getByRole("heading", { level: 1, name: "Incidents" })).toBeVisible();
  await expect(page.getByText("Gateway latency degradation", { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
