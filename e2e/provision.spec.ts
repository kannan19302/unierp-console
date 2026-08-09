import { test, expect } from '@playwright/test';

test.describe('Tenant Provisioning Flow', () => {
  test.beforeEach(async ({ context }) => {
    const payload = {
      sid: 'test-session',
      userId: 'test-user',
      tenantId: null,
      realm: 'provider',
      mfaVerified: true,
      permissions: ['system.tenant.provision', 'system.tenant.view'],
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

  test('successfully provisions a new tenant', async ({ page }) => {
    // Navigate to the provision page
    await page.goto('/tenants/provision');

    // Ensure the provision page loads and we're on the first step
    await expect(page.locator('h1:has-text("Provision new tenant")')).toBeVisible();
    await expect(page.locator('h3:has-text("Tenant Basics")')).toBeVisible();

    // Step 1: Basics
    await page.getByLabel('Tenant Name').fill('E2E Test Tenant');
    await page.getByLabel('Primary Region').selectOption('eu-west-1');
    await page.click('button:has-text("Next step")');

    // Step 2: Configuration
    await expect(page.locator('h3:has-text("Configuration")')).toBeVisible();
    await page.getByLabel('Subscription Plan').selectOption('ENTERPRISE');
    await page.getByLabel('Initial Owner Email').fill('e2e@acme.com');
    await page.click('button:has-text("Next step")');

    // Step 3: Review and Provision
    await expect(page.locator('h3:has-text("Review and Provision")')).toBeVisible();
    
    // Verify review details
    await expect(page.locator('text=E2E Test Tenant')).toBeVisible();
    await expect(page.locator('text=eu-west-1')).toBeVisible();
    await expect(page.locator('text=ENTERPRISE')).toBeVisible();
    await expect(page.locator('text=e2e@acme.com')).toBeVisible();

    // Fill audit justification
    await page.getByLabel('Justification (Audit)').fill('JIRA-E2E: Provisioned via automated testing');

    // Click provision button
    await page.click('button:has-text("Provision tenant")');

    // The component redirects to /tenants/directory on success
    await page.waitForURL('**/tenants/directory');
    
    // Verify successful navigation
    await expect(page.url()).toContain('/tenants/directory');
  });
});
