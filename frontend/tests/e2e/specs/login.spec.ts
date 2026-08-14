/**
 * E2E tests for the login flow.
 *
 * Verifies that after login, the top bar updates: the "Connexion" button
 * is replaced by the username + a user menu (instead of staying frozen).
 */
import { test, expect } from '@playwright/test';
import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

test.describe('Login flow', () => {
  test('login updates the top bar from "Connexion" to username', async ({ page }) => {
    const username = `e2e_login_${Date.now()}`;
    const password = 'password123';

    // Register a user via API
    try {
      await axios.post(`${API_URL}/auth/register`, {
        username,
        email: `${username}@test.com`,
        password,
      });
    } catch {
      // User might already exist — fine
    }

    // Go to login page
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Fill and submit the login form
    await page.fill('input[type="text"]', username);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    // Wait for redirect to home
    await page.waitForURL('http://localhost:3000/', { timeout: 10000 });

    // The "Connexion" button should be gone
    const connBtn = page.locator('text=Connexion');
    await expect(connBtn).toHaveCount(0);

    // The username should be visible in the top bar
    const userBtn = page.locator(`text=${username}`);
    await expect(userBtn).toBeVisible({ timeout: 5000 });
  });

  test('logout returns to "Connexion" button', async ({ page }) => {
    const username = `e2e_logout_${Date.now()}`;
    const password = 'password123';

    // Register
    try {
      await axios.post(`${API_URL}/auth/register`, {
        username,
        email: `${username}@test.com`,
        password,
      });
    } catch {}

    // Login
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    await page.fill('input[type="text"]', username);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000/', { timeout: 10000 });

    // Verify username is visible
    await expect(page.locator(`text=${username}`)).toBeVisible();

    // Click the user menu button to open it
    await page.locator(`text=${username}`).click();
    await page.waitForTimeout(500);

    // Click "Déconnexion"
    const logoutBtn = page.locator('text=Déconnexion');
    await logoutBtn.click();
    await page.waitForTimeout(2000);

    // The "Connexion" button should reappear
    const connBtn = page.locator('text=Connexion');
    await expect(connBtn).toBeVisible({ timeout: 5000 });
  });

  test('login with wrong password shows error', async ({ page }) => {
    const username = `e2e_wrongpw_${Date.now()}`;
    const password = 'password123';

    // Register
    try {
      await axios.post(`${API_URL}/auth/register`, {
        username,
        email: `${username}@test.com`,
        password,
      });
    } catch {}

    // Try to login with wrong password
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    await page.fill('input[type="text"]', username);
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Should stay on login page with an error
    expect(page.url()).toContain('/login');
    const alert = page.locator('[role="alert"]');
    await expect(alert).toBeVisible();
  });
});
