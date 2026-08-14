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
  testDir: './specs',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: isCI,
  /* Retry on CI only */
  retries: isCI ? 1 : 0,
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
    timeout: 120000,

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

    // Only test additional browsers in non-CI environments to save resources
    ...(isCI
      ? []
      : [
          {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
          },
          {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
          },
        ]),
  ],

  /*
   * Web server configuration
   * In local dev: Start both backend and frontend servers
   * In CI: Servers are started manually in the workflow
   */
  webServer: isCI
    ? undefined
    : {
        // Start backend first (Flask server)
        command: 'cd ../../backend && python3 main.py',
        url: 'http://localhost:5000/api/health',
        reuseExistingServer: true,
        timeout: 60000, // 60 seconds for backend to start
        env: {
          FLASK_ENV: 'development',
          DATABASE_URL: 'sqlite:///../../backend/instance/poker_tool.db',
        },
      },

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: '../../test-results/',

  /* Global setup file */
  globalSetup: './global-setup.ts',
});
