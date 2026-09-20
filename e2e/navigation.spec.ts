import { test, expect } from "@playwright/test";
import { TEST_AGENT_COOKIE } from "./auth.setup";

test.describe("Console Shell Navigation & Accessibility (WS6.1)", () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([TEST_AGENT_COOKIE]);
  });

  test("hides sidebar on /home and shows on domain pages", async ({ page }) => {
    await page.goto("/home");

    // Sidebar should not be visible on /home
    await expect(page.locator("#provider-navigation")).not.toBeVisible();

    // Navigate to a domain page (e.g. /tenants/directory)
    await page.goto("/tenants/directory");

    // Sidebar should be present on domain pages
    const sidebar = page.locator("#provider-navigation");
    await expect(sidebar).toBeVisible();
  });

  test("skip-to-content link appears on Tab focus", async ({ page }) => {
    await page.goto("/tenants/directory");

    // Focus into the page and press Tab
    await page.keyboard.press("Tab");

    // The skip link should be focused
    const skipLink = page.locator('a:has-text("Skip to")');
    await expect(skipLink).toBeFocused();
  });

  test("Command Palette opens on Cmd+K or Ctrl+K", async ({ page }) => {
    await page.goto("/tenants/directory");

    // Press Cmd+K or Ctrl+K
    await page.keyboard.press("Control+k");

    // Palette modal should be open
    const palette = page.locator('[role="dialog"]');
    await expect(palette).toBeVisible();

    // Press Escape to close
    await page.keyboard.press("Escape");
    await expect(palette).not.toBeVisible();
  });
});
