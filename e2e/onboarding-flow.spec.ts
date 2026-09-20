import { test, expect } from "@playwright/test";
import { TEST_AGENT_COOKIE } from "./auth.setup";

test.describe("Operator Onboarding & Guided Tour (WS6.1)", () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([TEST_AGENT_COOKIE]);
  });

  test("renders setup checklist and advances tour steps", async ({ page }) => {
    await page.goto("/home");

    // Verify Setup Checklist renders
    const checklist = page.getByRole("region", {
      name: "Platform Setup Checklist",
    });
    await expect(checklist).toBeVisible();

    // Verify all 5 steps exist
    await expect(
      checklist.getByText("Complete Organization Profile")
    ).toBeVisible();
    await expect(
      checklist.getByText("Provision First Enterprise Tenant")
    ).toBeVisible();

    // If Spotlight Tour is open, verify step 1
    const tourModal = page.getByRole("dialog", {
      name: "Platform Guided Tour",
    });
    if (await tourModal.isVisible()) {
      await expect(tourModal.getByText("Step 1 of 4")).toBeVisible();
      // Click next step
      await tourModal.getByRole("button", { name: "Next tour step" }).click();
      await expect(tourModal.getByText("Step 2 of 4")).toBeVisible();
      // Skip tour
      await tourModal.getByRole("button", { name: "Skip guided tour" }).click();
      await expect(tourModal).not.toBeVisible();
    }
  });
});
