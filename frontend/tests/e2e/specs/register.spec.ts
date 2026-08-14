/**
 * E2E tests for the registration flow.
 *
 * Covers:
 * - Successful registration redirects to the home page
 * - Duplicate registration shows a meaningful error message (not generic)
 * - Registration with missing fields shows validation error
 */
import { test, expect } from '@playwright/test';

const uniqueUser = () => ({
  username: `e2e_${Date.now()}`,
  email: `e2e_${Date.now()}@test.com`,
  password: 'password123',
});

test.describe('Registration flow', () => {
  test('register a new user and redirect to home', async ({ page }) => {
    const user = uniqueUser();

    await page.goto('http://localhost:3000/register');
    await page.waitForLoadState('domcontentloaded');

    await page.fill('[data-testid="register-username"]', user.username);
    await page.fill('[data-testid="register-email"]', user.email);
    await page.fill('[data-testid="register-password"]', user.password);
    await page.click('[data-testid="register-submit"]');

    // Should redirect to the home page
    await page.waitForURL('http://localhost:3000/', { timeout: 10000 });
    expect(page.url()).toBe('http://localhost:3000/');
  });

  test('register with missing fields shows validation error', async ({ page }) => {
    await page.goto('http://localhost:3000/register');
    await page.waitForLoadState('domcontentloaded');

    // Submit empty form
    await page.click('[data-testid="register-submit"]');
    await page.waitForTimeout(1000);

    // Should stay on the register page with an error
    expect(page.url()).toContain('/register');
    const alert = page.locator('[role="alert"]');
    await expect(alert).toBeVisible();
    const alertText = await alert.textContent();
    expect(alertText).toContain('obligatoire');
  });

  test('register duplicate user shows specific error message', async ({ page }) => {
    const user = uniqueUser();

    // First registration
    await page.goto('http://localhost:3000/register');
    await page.waitForLoadState('domcontentloaded');
    await page.fill('[data-testid="register-username"]', user.username);
    await page.fill('[data-testid="register-email"]', user.email);
    await page.fill('[data-testid="register-password"]', user.password);
    await page.click('[data-testid="register-submit"]');
    await page.waitForURL('http://localhost:3000/', { timeout: 10000 });

    // Logout (clear the token) so we can register again
    await page.evaluate(() => localStorage.removeItem('poker_tool_token'));

    // Second registration with same credentials
    await page.goto('http://localhost:3000/register');
    await page.waitForLoadState('domcontentloaded');
    await page.fill('[data-testid="register-username"]', user.username);
    await page.fill('[data-testid="register-email"]', user.email);
    await page.fill('[data-testid="register-password"]', user.password);
    await page.click('[data-testid="register-submit"]');
    await page.waitForTimeout(3000);

    // Should stay on register page with a specific error
    expect(page.url()).toContain('/register');
    const alert = page.locator('[role="alert"]');
    await expect(alert).toBeVisible();
    const alertText = await alert.textContent();
    // The error should mention "already exists" (from the backend), not the
    // generic "Erreur lors de l'inscription"
    expect(alertText).toContain('exist');
  });
});
