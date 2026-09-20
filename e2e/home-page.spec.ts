import { test, expect } from "@playwright/test";
import { TEST_AGENT_COOKIE } from "./auth.setup";

test.describe("Home Page & Desk Launcher (WS6.1)", () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([TEST_AGENT_COOKIE]);
  });

  test("root / redirects to /home and renders Desk Launcher", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/home/);

    // Verify Frappe-style Desk Launcher hero
    await expect(page.locator("h1")).toContainText("Platform Control Center");
    await expect(
      page.getByText("FRAPPE ERPNEXT-INSPIRED DESK LAUNCHER")
    ).toBeVisible();

    // Verify 6-column icon grid renders
    const iconGrid = page.getByTestId("pcc-icon-grid");
    await expect(iconGrid).toBeVisible();

    // Verify all 22 PCC domains render
    const tiles = iconGrid.locator("a");
    await expect(tiles).toHaveCount(22);
  });

  test("search input filters PCC tiles in real-time", async ({ page }) => {
    await page.goto("/home");

    const searchInput = page.getByTestId("pcc-search-input");
    await expect(searchInput).toBeVisible();

    // Filter by 'Secrets'
    await searchInput.fill("Secrets");
    const iconGrid = page.getByTestId("pcc-icon-grid");
    const matchingTiles = iconGrid.locator("a");
    await expect(matchingTiles).toHaveCount(1);
    await expect(matchingTiles.first()).toContainText("Keys & Secrets");

    // Clear search
    await page.getByLabel("Clear search").click();
    await expect(iconGrid.locator("a")).toHaveCount(22);
  });

  test("cluster filter pills filter domains by architectural pillar", async ({
    page,
  }) => {
    await page.goto("/home");

    // Filter by Security cluster
    const secPill = page.getByTestId("filter-security");
    await secPill.click();

    const iconGrid = page.getByTestId("pcc-icon-grid");
    const secTiles = iconGrid.locator("a");
    // Security cluster has 5 domains (PCC-02, 07, 09, 10, and policies)
    const count = await secTiles.count();
    expect(count).toBeGreaterThanOrEqual(4);

    // Switch back to All Domains
    await page.getByTestId("filter-all").click();
    await expect(iconGrid.locator("a")).toHaveCount(22);
  });

  test("pressing '/' key focuses search bar", async ({ page }) => {
    await page.goto("/home");

    // Click outside input
    await page.locator("body").click();

    // Press '/'
    await page.keyboard.press("/");
    const searchInput = page.getByTestId("pcc-search-input");
    await expect(searchInput).toBeFocused();
  });
});
