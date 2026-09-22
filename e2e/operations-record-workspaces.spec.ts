import { expect, test } from "@playwright/test";
import { TEST_AGENT_COOKIE } from "./auth.setup";

const response = (body: unknown) => ({ status: 200, contentType: "application/json", body: JSON.stringify(body) });

test.beforeEach(async ({ context, page }) => {
  await context.addCookies([TEST_AGENT_COOKIE]);
  await page.route("**/api/session", (route) => route.fulfill(response({})));
  await page.route("**/api/v1/platform/v1/releases/manifest**", (route) => route.fulfill(response({
    version: "2026.09.1",
    deployment: {
      staging: { gate: "integration", auto_deploy: true, requires_human_approval: false },
      production: { gate: "change-control", auto_deploy: false, requires_human_approval: true, rollback_sha: "a1b2c3d4e5f6" },
    },
  })));
  await page.route("**/api/v1/platform/v1/operations/db-schema**", (route) => route.fulfill(response({ data: [
    { tableName: "tenant", rowCount: 42, status: "ACTIVE" },
    { tableName: "outbox_event", rowCount: 1280, status: "ACTIVE" },
  ] })));
  await page.route("**/api/v1/platform/v1/operations/jobs**", (route) => route.fulfill(response({ data: [
    { name: "outbox-delivery", active: 2, waiting: 7, completed: 1240, failed: 2 },
    { name: "billing-rollup", active: 0, waiting: 0, completed: 96, failed: 0 },
  ] })));
  await page.route("**/api/v1/platform/v1/operations/tasks**", (route) => route.fulfill(response({ data: [
    { id: "task-1", name: "Reconcile outbox", handler: "outbox.reconcile", expression: "0 */5 * * * *", nextRun: "2026-09-22T08:30:00.000Z", lastResult: "COMPLETED", status: "ENABLED" },
  ] })));
  await page.route("**/api/v1/platform/v1/workflows**", (route) => route.fulfill(response({ data: [
    { id: "workflow-1", name: "Invoice export", trigger: "schedule", enabled: true, lastRun: "2026-09-22T08:00:00.000Z", lastStatus: "RUNNING", runs: { total: 7 } },
  ] })));
  await page.route("**/api/v1/platform/v1/broadcasts/windows**", (route) => route.fulfill(response({ data: [
    { id: "window-1", title: "Database patch", description: "Routine engine maintenance", status: "SCHEDULED", scheduledStart: "2026-09-23T18:00:00.000Z", scheduledEnd: "2026-09-23T19:00:00.000Z" },
  ], total: 1 })));
});

test("presents each read-heavy operations route as a searchable record workspace", async ({ page }) => {
  test.setTimeout(90_000);
  const routes = [
    ["/ops/jobs", "outbox-delivery"],
    ["/ops/environments", "outbox_event"],
    ["/ops/deployments", "change-control"],
    ["/ops/workflows", "Invoice export"],
    ["/ops/maintenance", "Database patch"],
  ] as const;

  for (const [route, expectedRecord] of routes) {
    await page.goto(route);
    await expect(page.getByText(expectedRecord, { exact: true })).toBeVisible();
    await expect(page.getByRole("searchbox", { name: "Search records" }).first()).toBeVisible();
  }

  await page.goto("/ops/jobs");
  await expect(page.getByText("outbox-delivery", { exact: true })).toBeVisible();
  const queueSearch = page.getByRole("searchbox", { name: "Search records" }).first();
  await queueSearch.focus();
  await page.keyboard.type("billing");
  await expect(page.getByText("billing-rollup", { exact: true })).toBeVisible();
  await expect(page.getByText("outbox-delivery", { exact: true })).toHaveCount(0);
});

test("keeps the jobs record workspace contained at a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/ops/jobs");
  await expect(page.getByRole("heading", { name: "Jobs" })).toBeVisible();
  await expect(page.getByText("outbox-delivery", { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
