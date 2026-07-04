/**
 * Test utilities for Playwright E2E tests
 */

import { Page, Locator, expect } from '@playwright/test';

/**
 * Navigation utilities
 */
export async function navigateTo(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await expect(page).toHaveURL(path);
}

/**
 * Wait for an element to be visible
 */
export async function waitForElement(page: Page, selector: string, timeout: number = 5000): Promise<Locator> {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible', timeout });
  return element;
}

/**
 * Wait for an element to disappear
 */
export async function waitForElementToDisappear(page: Page, selector: string, timeout: number = 5000): Promise<void> {
  await page.locator(selector).waitFor({ state: 'hidden', timeout });
}

/**
 * Click an element with retry logic
 */
export async function clickWithRetry(page: Page, selector: string, timeout: number = 5000): Promise<void> {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible', timeout });
  await element.click();
}

/**
 * Fill a form field
 */
export async function fillField(page: Page, selector: string, value: string): Promise<void> {
  const field = page.locator(selector);
  await field.waitFor({ state: 'visible' });
  await field.fill(value);
}

/**
 * Select an option from a dropdown
 */
export async function selectOption(page: Page, selector: string, value: string): Promise<void> {
  const dropdown = page.locator(selector);
  await dropdown.waitFor({ state: 'visible' });
  await dropdown.selectOption(value);
}

/**
 * Check if an element exists
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  const element = page.locator(selector);
  try {
    await element.waitFor({ state: 'visible', timeout: 1000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get text content of an element
 */
export async function getElementText(page: Page, selector: string): Promise<string> {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible' });
  return await element.textContent() || '';
}

/**
 * Wait for a specific number of elements to be visible
 */
export async function waitForElementCount(page: Page, selector: string, count: number, timeout: number = 5000): Promise<void> {
  const elements = page.locator(selector);
  await expect(elements).toHaveCount(count, { timeout });
}

/**
 * Check if current URL matches expected path
 */
export async function assertCurrentPath(page: Page, expectedPath: string): Promise<void> {
  await expect(page).toHaveURL(expectedPath);
}

/**
 * Wait for a loading spinner to disappear
 */
export async function waitForLoadingToComplete(page: Page, timeout: number = 10000): Promise<void> {
  // Common loading indicators
  const loadingSelectors = [
    '.MuiCircularProgress-root',
    '[role="progressbar"]',
    'text="Chargement..."',
    'text="Loading..."',
  ];
  
  for (const selector of loadingSelectors) {
    try {
      await page.locator(selector).waitFor({ state: 'hidden', timeout: 1000 });
    } catch {
      // Element not found or already hidden, continue
    }
  }
}

/**
 * Mock API responses using Playwright's route functionality
 */
export async function mockApiResponse(page: Page, url: string | RegExp, response: any, status: number = 200): Promise<void> {
  await page.route(url, (route) => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Mock a GET request
 */
export async function mockGetRequest(page: Page, url: string | RegExp, data: any): Promise<void> {
  await mockApiResponse(page, url, data, 200);
}

/**
 * Mock a POST request
 */
export async function mockPostRequest(page: Page, url: string | RegExp, data: any): Promise<void> {
  await page.route(url, (route) => {
    if (route.request().method() === 'POST') {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(data),
      });
    } else {
      route.continue();
    }
  });
}

/**
 * Take a screenshot for debugging
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `test-results/screenshots/${name}.png` });
}

/**
 * Scroll to an element
 */
export async function scrollToElement(page: Page, selector: string): Promise<void> {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible' });
  await element.scrollIntoViewIfNeeded();
}

/**
 * Press a key
 */
export async function pressKey(page: Page, key: string): Promise<void> {
  await page.keyboard.press(key);
}

/**
 * Type text
 */
export async function typeText(page: Page, text: string): Promise<void> {
  await page.keyboard.type(text);
}
