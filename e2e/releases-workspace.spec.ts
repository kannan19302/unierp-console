import { expect, test } from "@playwright/test";
import { TEST_AGENT_COOKIE } from "./auth.setup";

const response = (body: unknown) => ({ status: 200, contentType: "application/json", body: JSON.stringify(body) });

test.beforeEach(async ({ context, page }) => {
  await context.addCookies([TEST_AGENT_COOKIE]);
  await page.route("**/api/session", (route) => route.fulfill(response({})));
  await page.route("**/api/v1/platform/v1/releases/manifest**", (route) => route.fulfill(response({
    version: "2026.09.1",
    previousManifestVersion: "2026.09.0",
    deployedAt: "2026-09-22T04:30:00.000Z",
    services: { api: "4.18.0", idp: "3.9.2" },
    migrations: ["2026092201_release_index"],
  })));
  await page.route("**/api/v1/platform/v1/releases/pipeline**", (route) => route.fulfill(response({
    activeCanaryPercent: 15,
    stages: [
      { stage: "canary", label: "Provider canary", status: "ROLLING_OUT", version: "2026.09.1", trafficWeightPercent: 15, commitHash: "9c33a8f52d1b", lastDeployedAt: "2026-09-22T04:30:00.000Z" },
      { stage: "production", label: "Production fleet", status: "HEALTHY", version: "2026.09.0", trafficWeightPercent: 85, commitHash: "7f802e11320a", lastDeployedAt: "2026-09-21T18:00:00.000Z" },
    ],
  })));
});

test("presents reported release evidence and guards mutation commands", async ({ page }) => {
  let canaryBody: unknown;
  await page.route("**/api/v1/platform/v1/releases/pipeline/canary-traffic", async (route) => {
    canaryBody = route.request().postDataJSON();
    await route.fulfill(response({ activeCanaryPercent: 20 }));
  });

  await page.goto("/ops/releases");
  await expect(page.getByRole("heading", { level: 1, name: "Releases" })).toBeVisible();
  await expect(page.getByText("Provider canary", { exact: true })).toBeVisible();
  await expect(page.getByText("2026.09.1", { exact: true }).first()).toBeVisible();

  await page.getByRole("slider", { name: "Canary traffic percentage" }).fill("20");
  await page.getByRole("button", { name: "Review change" }).click();
  const canaryDialog = page.getByRole("dialog");
  await expect(canaryDialog.getByText("Global provider ingress")).toBeVisible();
  await canaryDialog.getByRole("button", { name: "Apply allocation" }).click();
  await expect.poll(() => canaryBody).toEqual({ percentage: 20 });

  await page.getByRole("button", { name: "Rollback platform" }).click();
  const rollbackDialog = page.getByRole("dialog");
  await expect(rollbackDialog.getByRole("button", { name: "Rollback platform" })).toBeDisabled();
  await rollbackDialog.getByPlaceholder("Describe the measured failure requiring rollback").fill("Measured provider ingress regression");
  await expect(rollbackDialog.getByRole("button", { name: "Rollback platform" })).toBeEnabled();
  await rollbackDialog.getByRole("button", { name: "Cancel" }).click();

  await page.getByRole("button", { name: "Promote release" }).click();
  const promoteDialog = page.getByRole("dialog");
  await expect(promoteDialog.getByRole("button", { name: "Promote release" })).toBeDisabled();
  await promoteDialog.getByLabel("I verified the external health gate for this manifest and target.").check();
  await expect(promoteDialog.getByRole("button", { name: "Promote release" })).toBeEnabled();
});

test("keeps release evidence and controls contained at a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/ops/releases");
  await expect(page.getByRole("heading", { level: 1, name: "Releases" })).toBeVisible();
  await expect(page.getByText("Provider canary", { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
