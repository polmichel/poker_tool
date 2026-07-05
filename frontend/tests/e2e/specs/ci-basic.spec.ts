/**
 * Basic CI tests that don't require any server
 * These tests verify that the test infrastructure is properly set up
 */

import { test, expect } from '@playwright/test';
import { navigateTo, waitForLoadingToComplete } from '../utils';
import { mockRange, mockRanges, newRangeData } from '../fixtures';

test.describe('CI Basic Tests - No Server Required', () => {
  
  test('Playwright is properly configured', async ({ page }) => {
    // Test that Playwright can launch and navigate to a public site
    await page.goto('https://www.example.com');
    expect(await page.title()).toContain('Example');
  });

  test('Test utilities are properly exported', async () => {
    // Verify that all expected utility functions exist
    expect(typeof navigateTo).toBe('function');
    expect(typeof waitForLoadingToComplete).toBe('function');
  });

  test('Fixtures are properly exported', async () => {
    // Verify that all expected fixtures exist
    expect(mockRange).toBeDefined();
    expect(mockRanges).toBeDefined();
    expect(newRangeData).toBeDefined();
  });

  test('Mock range has correct structure', async () => {
    // Verify the structure of mockRange
    expect(mockRange).toHaveProperty('id');
    expect(mockRange).toHaveProperty('name');
    expect(mockRange).toHaveProperty('description');
    expect(mockRange).toHaveProperty('range_type');
    expect(mockRange).toHaveProperty('position');
    expect(mockRange).toHaveProperty('hands');
    expect(mockRange).toHaveProperty('user_id');
    
    // Verify specific values
    expect(mockRange.id).toBe(1);
    expect(mockRange.name).toBe('Test Range');
    expect(mockRange.range_type).toBe('preflop');
    expect(mockRange.position).toBe('BTN');
    expect(mockRange.hands).toHaveProperty('AA');
    expect(mockRange.hands['AA']).toBe('raise');
  });

  test('Mock ranges array has correct structure', async () => {
    // Verify the structure of mockRanges
    expect(Array.isArray(mockRanges)).toBeTruthy();
    expect(mockRanges.length).toBeGreaterThan(0);
    
    // Verify each range in the array
    mockRanges.forEach(range => {
      expect(range).toHaveProperty('id');
      expect(range).toHaveProperty('name');
      expect(range).toHaveProperty('hands');
    });
  });

  test('New range data has correct structure', async () => {
    // Verify the structure of newRangeData
    expect(newRangeData).toHaveProperty('name');
    expect(newRangeData).toHaveProperty('description');
    expect(newRangeData).toHaveProperty('range_type');
    expect(newRangeData).toHaveProperty('position');
    expect(newRangeData).toHaveProperty('hands');
    
    // Verify specific values
    expect(newRangeData.name).toBe('New Test Range');
    expect(newRangeData.range_type).toBe('preflop');
    expect(newRangeData.position).toBe('CO');
  });

  test('Playwright devices are available', async ({ browser }) => {
    // Verify that Playwright devices are available
    const { devices } = await import('@playwright/test');
    expect(devices).toBeDefined();
    expect(devices['Desktop Chrome']).toBeDefined();
    expect(devices['Desktop Firefox']).toBeDefined();
    expect(devices['Desktop Safari']).toBeDefined();
  });

  test('Playwright can create browser contexts', async ({ browser }) => {
    // Verify that Playwright can create browser contexts
    const context = await browser.newContext();
    expect(context).toBeDefined();
    await context.close();
  });
});
