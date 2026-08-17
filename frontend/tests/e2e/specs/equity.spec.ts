/**
 * E2E tests for the equity simulator window (/equity).
 *
 * Verifies that an authenticated user can navigate to the equity calculator,
 * configure a hero hand + range, run a simulation, and see the results
 * (win/tie/lose bars + detail table).
 */
import { test, expect } from '@playwright/test';
import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

async function loginAsNewUser(page: import('@playwright/test').Page): Promise<string> {
  const username = `e2e_equity_${Date.now()}`;
  const password = 'password123';
  try {
    await axios.post(`${API_URL}/auth/register`, {
      username,
      email: `${username}@test.com`,
      password,
    });
  } catch {
    // User might already exist — fine.
  }

  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);
  await page.fill('input[type="text"]', username);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('http://localhost:3000/', { timeout: 10000 });
  return username;
}

test.describe('Equity simulator', () => {
  test('computes equity of a hero hand against a range', async ({ page }) => {
    await loginAsNewUser(page);

    // Navigate to the equity window.
    await page.goto('http://localhost:3000/equity');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // The page title (h1) should be visible.
    await expect(page.getByRole('heading', { name: "Calculateur d'Équité" })).toBeVisible({
      timeout: 5000,
    });

    // Configure the hero hand.
    const heroInput = page.getByTestId('equity-hero-input');
    await heroInput.fill('AKs');

    // Configure the opposing range.
    const rangeInput = page.getByTestId('equity-range-input');
    await rangeInput.fill('QQ');

    // Lower iterations to keep the test fast.
    const iterationsInput = page.getByTestId('equity-iterations-input');
    await iterationsInput.fill('500');

    // Launch the simulation.
    await page.getByTestId('equity-simulate-button').click();

    // The aggregated results block should appear.
    await expect(page.getByTestId('equity-results')).toBeVisible({ timeout: 15000 });

    // The detail table should be populated with the QQ breakdown.
    await expect(page.getByTestId('equity-detail-table')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('equity-cell-QQ')).toBeVisible();
  });

  test('shows a validation error for an invalid hero hand', async ({ page }) => {
    await loginAsNewUser(page);

    await page.goto('http://localhost:3000/equity');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Enter an invalid hero hand.
    await page.getByTestId('equity-hero-input').fill('ZZ');
    await page.getByTestId('equity-range-input').fill('QQ');
    await page.getByTestId('equity-simulate-button').click();

    // A validation error should be displayed and no results shown.
    await expect(page.getByTestId('equity-validation-error')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('equity-results')).toHaveCount(0);
  });
});
