/**
 * Smoke tests to verify basic Playwright configuration
 */

import { test, expect } from '@playwright/test';
import { navigateTo, waitForLoadingToComplete } from '../utils';
import { mockRange, mockRanges, newRangeData } from '../fixtures';

test.describe('Smoke Tests', () => {
  
  test('Playwright is configured correctly', async ({ page }) => {
    // This test verifies that Playwright can launch a browser
    // Use a simple local navigation to avoid network issues in CI
    await page.goto('about:blank');
    // about:blank may have an empty title in some headless browsers,
    // so just verify navigation succeeded (URL is about:blank).
    await expect(page).toHaveURL('about:blank');
  });

  test('Application base URL is accessible', async ({ page }) => {
    // This test verifies that the base URL is configured
    // In CI, the frontend server should be running on localhost:3000
    // In local dev, this will use the configured baseURL
    await page.goto('/');
    
    // Just verify we can navigate without error
    // The page might show loading state or error, but navigation should work
    const url = page.url();
    expect(url).toContain('localhost:3000');
  });

  test('Test utilities are available', async ({ page }) => {
    // This test verifies that our test utilities can be imported
    // Test navigation utility
    await navigateTo(page, 'about:blank');
    await waitForLoadingToComplete(page);
    
    await expect(page).toHaveURL('about:blank');
  });

  test('Fixtures are available', async () => {
    // This test verifies that our fixtures can be imported
    // Verify fixture structure
    expect(mockRange).toHaveProperty('id');
    expect(mockRange).toHaveProperty('name');
    expect(mockRange).toHaveProperty('hands');
    expect(mockRanges).toBeInstanceOf(Array);
    expect(mockRanges.length).toBeGreaterThan(0);
  });
});
