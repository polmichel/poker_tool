import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv#how-does-it-work
 */
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
const envPath = path.resolve(__dirname, '../../.env.test');
dotenv.config({ path: envPath });

// Determine if we're running in CI
const isCI = !!process.env.CI;

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e/specs',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: isCI,
  /* Retry on CI only */
  retries: isCI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: isCI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: '../../playwright-report' }],
    ['json', { outputFolder: '../../playwright-report' }],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take a screenshot when a test fails */
    screenshot: 'only-on-failure',
    
    /* Record video when a test fails */
    video: isCI ? 'off' : 'retain-on-failure',
    
    /* Timeout for each test */
    timeout: 60000,
    
    /* Timeout for each action (click, fill, etc.) */
    actionTimeout: 5000,
    
    /* Timeout for navigation */
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    // Only test WebKit in non-CI environments to save resources
    ...(isCI ? [] : [{
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    }]),
  ],

  /* 
   * In CI: Don't use webServer (we start it manually in the workflow)
   * In local dev: Run the React dev server
   */
  webServer: isCI ? undefined : {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000, // 2 minutes for dev server to start
  },

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: '../../test-results/',

  /* Global setup file */
  globalSetup: './global-setup.ts',
});
