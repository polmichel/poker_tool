/**
 * Smoke tests for CI environment
 * These tests verify that the test infrastructure works in CI
 * without requiring a full React application
 */

import { test, expect } from '@playwright/test';
import { navigateTo, waitForLoadingToComplete } from '../utils';
import { mockRange, mockRanges, newRangeData } from '../fixtures';

test.describe('CI Smoke Tests', () => {
  
  test('Playwright can launch browser in CI', async ({ page }) => {
    // Test that Playwright can launch a browser and navigate
    // Use a public URL to verify Playwright works
    await page.goto('https://www.example.com');
    expect(await page.title()).toContain('Example');
  });

  test('Test utilities are available', async ({ page }) => {
    // Test that our test utilities are available
    expect(typeof navigateTo).toBe('function');
    expect(typeof waitForLoadingToComplete).toBe('function');
  });

  test('Fixtures are available', async () => {
    // Test that our fixtures are available
    expect(mockRange).toHaveProperty('id');
    expect(mockRange).toHaveProperty('name');
    expect(mockRange).toHaveProperty('hands');
    expect(Array.isArray(mockRanges)).toBeTruthy();
    expect(mockRanges.length).toBeGreaterThan(0);
  });

  test('Fixtures have correct structure', async () => {
    // Verify the structure of our mock data
    expect(mockRange.id).toBe(1);
    expect(mockRange.name).toBe('Test Range');
    expect(mockRange.range_type).toBe('preflop');
    expect(mockRange.position).toBe('BTN');
    expect(mockRange.hands).toHaveProperty('AA');
    expect(mockRange.hands['AA']).toBe('raise');
  });

  test('New range data has correct structure', async () => {
    // Verify new range data structure
    expect(newRangeData).toHaveProperty('name');
    expect(newRangeData).toHaveProperty('description');
    expect(newRangeData).toHaveProperty('range_type');
    expect(newRangeData).toHaveProperty('position');
    expect(newRangeData).toHaveProperty('hands');
  });
});
