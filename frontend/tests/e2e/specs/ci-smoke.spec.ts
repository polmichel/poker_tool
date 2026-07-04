/**
 * Smoke tests for CI environment
 * These tests verify that the test infrastructure works in CI
 * without requiring a full React application
 */

import { test, expect } from '@playwright/test';

test.describe('CI Smoke Tests', () => {
  
  test('Playwright can launch browser in CI', async ({ page }) => {
    // Test that Playwright can launch a browser and navigate
    await page.goto('http://localhost:3000');
    
    // In CI, the test server should be running
    // We just verify that we can make a request
    const response = await page.request.get('http://localhost:3000/api/ranges');
    expect(response.ok()).toBeTruthy();
    
    const ranges = await response.json();
    expect(Array.isArray(ranges)).toBeTruthy();
    expect(ranges.length).toBeGreaterThan(0);
  });

  test('API mock server is running', async ({ page }) => {
    // Test the mock API endpoints
    const response = await page.request.get('http://localhost:3000/api/ranges');
    expect(response.ok()).toBeTruthy();
    
    const ranges = await response.json();
    expect(ranges.length).toBeGreaterThan(0);
    
    // Verify range structure
    const firstRange = ranges[0];
    expect(firstRange).toHaveProperty('id');
    expect(firstRange).toHaveProperty('name');
    expect(firstRange).toHaveProperty('hands');
  });

  test('Training modes API is available', async ({ page }) => {
    const response = await page.request.get('http://localhost:3000/api/training/modes');
    expect(response.ok()).toBeTruthy();
    
    const modes = await response.json();
    expect(Array.isArray(modes)).toBeTruthy();
    expect(modes.length).toBeGreaterThan(0);
    
    // Verify we have the expected modes
    const modeIds = modes.map((m: any) => m.id);
    expect(modeIds).toContain('fill');
    expect(modeIds).toContain('guess');
    expect(modeIds).toContain('complete');
  });

  test('Static files are served', async ({ page }) => {
    // Test that static files are served
    const response = await page.request.get('http://localhost:3000/');
    expect(response.ok()).toBeTruthy();
    
    const html = await response.text();
    expect(html).toContain('<!DOCTYPE html>');
  });

  test('Test utilities can be imported', async ({ page }) => {
    // Test that our test utilities can be imported
    const { navigateTo, waitForLoadingToComplete } = await import('../utils');
    
    // These should not throw
    expect(typeof navigateTo).toBe('function');
    expect(typeof waitForLoadingToComplete).toBe('function');
  });

  test('Fixtures can be imported', async () => {
    // Test that our fixtures can be imported
    const { mockRange, mockRanges, newRangeData } = await import('../fixtures');
    
    // Verify fixture structure
    expect(mockRange).toHaveProperty('id');
    expect(mockRange).toHaveProperty('name');
    expect(mockRange).toHaveProperty('hands');
    expect(Array.isArray(mockRanges)).toBeTruthy();
  });
});
