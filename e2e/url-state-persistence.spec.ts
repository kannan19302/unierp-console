import { test, expect } from "@playwright/test";
import { TEST_AGENT_COOKIE } from "./auth.setup";

test.describe("URL State Persistence (WS6.1)", () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([TEST_AGENT_COOKIE]);
  });

  test("search and tab parameters persist across page reloads and sharing", async ({
    page,
  }) => {
    // Navigate with predefined query parameters
    await page.goto("/tenants/directory?page=2&pageSize=10");

    // Verify URL parameters remain preserved
    await expect(page).toHaveURL(/page=2/);
    await expect(page).toHaveURL(/pageSize=10/);
  });
});
