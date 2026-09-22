import { expect, test } from "@playwright/test";
import { TEST_AGENT_COOKIE } from "./auth.setup";

const response = (body: unknown) => ({ status: 200, contentType: "application/json", body: JSON.stringify(body) });

test.beforeEach(async ({ context, page }) => {
  await context.addCookies([TEST_AGENT_COOKIE]);
  await page.route("**/api/session", (route) => route.fulfill(response({})));
  await page.route("**/api/v1/platform/v1/runbooks", (route) => route.fulfill(response([
    { id: "rb-node-drain", name: "Drain provider node", status: "PUBLISHED", version: 4, steps: [{ resourceId: "node-provider-04", proposedState: { cordoned: true } }], createdAt: "2026-09-22T04:30:00.000Z" },
    { id: "rb-cache-evict", name: "Evict regional cache", status: "DRAFT", version: 1, steps: [{ resourceId: "cache-region-02", proposedState: { evict: true } }], createdAt: "2026-09-22T05:00:00.000Z" },
  ])));
});

test("presents a searchable runbook register and guarded actions", async ({ page }) => {
  await page.route("**/api/v1/platform/v1/runbooks/rb-node-drain/dry-run", (route) => route.fulfill(response([{ id: "plan-1" }])));
  await page.goto("/ops/automation");

  await expect(page.getByRole("heading", { level: 1, name: "Automation" })).toBeVisible();
  await expect(page.getByText("Drain provider node", { exact: true })).toBeVisible();
  await expect(page.getByText("100%")).toHaveCount(0);

  const search = page.getByRole("searchbox", { name: "Search records" });
  await search.fill("cache");
  await expect(page.getByText("Evict regional cache", { exact: true })).toBeVisible();
  await expect(page.getByText("Drain provider node", { exact: true })).toHaveCount(0);
  await search.clear();

  await page.getByRole("button", { name: "Dry run" }).first().click();
  await expect(page.getByText("1 PLAN")).toBeVisible();
  await expect(page.getByText("Validated this session").locator("xpath=following-sibling::strong")).toHaveText("1");

  await page.getByRole("button", { name: "Publish" }).click();
  const publishDialog = page.getByRole("dialog", { name: "Publish runbook" });
  await expect(publishDialog.getByRole("button", { name: "Evaluate and publish" })).toBeDisabled();
  await publishDialog.getByPlaceholder("Enter a registered platform policy").fill("platform.change-safe");
  await expect(publishDialog.getByRole("button", { name: "Evaluate and publish" })).toBeEnabled();
  await publishDialog.getByRole("button", { name: "Cancel" }).click();

  await page.getByRole("button", { name: "Decommission Drain provider node" }).click();
  const deleteDialog = page.getByRole("dialog", { name: "Decommission runbook" });
  await expect(deleteDialog.getByRole("button", { name: "Decommission runbook" })).toBeDisabled();
  await deleteDialog.getByLabel("I understand this removes the runbook definition and cannot be undone here.").check();
  await expect(deleteDialog.getByRole("button", { name: "Decommission runbook" })).toBeEnabled();
});

test("keeps the automation register contained at a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/ops/automation");
  await expect(page.getByRole("heading", { level: 1, name: "Automation" })).toBeVisible();
  await expect(page.getByText("Drain provider node", { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
