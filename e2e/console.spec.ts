import { test, expect } from '@playwright/test';

test.describe('Console Application', () => {
  test.beforeEach(async ({ context }) => {
    const payload = {
      sid: 'test-session',
      userId: 'test-user',
      tenantId: null,
      realm: 'provider',
      mfaVerified: true,
    };
    const token = `header.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`;
    await context.addCookies([
      {
        name: '__session',
        value: token,
        domain: 'localhost',
        path: '/',
      },
    ]);
  });

  test('navigates to tenants overview', async ({ page }) => {
    // Navigate to root which should either show console or redirect to a default view
    await page.goto('/');

    // Ensure the console shell loads
    await expect(page.locator('text=uniERP Console')).toBeVisible();

    // Click on the Tenants link in the sidebar
    await page.click('nav button:has-text("Tenants")');

    // Verify we navigated to tenants overview
    await expect(page.locator('h1:has-text("Overview")')).toBeVisible();
    await expect(page.locator('h3:has-text("Tenant registry")')).toBeVisible();
  });
});
