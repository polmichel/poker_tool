import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'url';
import fs from 'fs';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv#how-does-it-work
 */
import path from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
// override: true so .env.test takes precedence over shell env vars
// (e.g. the shell may export CI=true, but .env.test sets CI=false for
// local e2e runs).
const envPath = path.resolve(__dirname, '../../.env.test');
dotenv.config({ path: envPath, override: true });

// Determine if we're running in CI
const isCI = !!process.env.CI && process.env.CI !== 'false';

// E2E test database: kept separate from the dev database so local data
// is never touched. Deleted before each run so tests start from a clean
// state. The backend recreates it on startup (create_all), and
// global-setup populates it via the API.
const e2eDbPath = path.resolve(__dirname, '../../../backend/instance/poker_tool_e2e.db');
if (!isCI) {
  try {
    if (fs.existsSync(e2eDbPath)) {
      fs.unlinkSync(e2eDbPath);
    }
  } catch {
    // ignore — may be locked by a running server
  }
}

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
    ['./recap-reporter.ts'],
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
    : [
        {
          // Start backend (Flask server) with the e2e test database.
          // Uses port 5001 to avoid conflicting with a dev backend on
          // port 5000. reuseExistingServer: false ensures the backend
          // always restarts fresh with the clean e2e database.
          command: './venv/bin/python3 main.py',
          cwd: path.resolve(__dirname, '../../../backend'),
          url: 'http://localhost:5001/api/health',
          reuseExistingServer: false,
          timeout: 60000,
          env: {
            FLASK_ENV: 'development',
            DATABASE_URL: 'sqlite:///poker_tool_e2e.db',
            PORT: '5001',
          },
        },
        {
          // Start frontend (Vite dev server). VITE_API_URL makes the
          // frontend hit the e2e backend on port 5001 directly, so the
          // Vite proxy (hardcoded to port 5000 for dev) is bypassed.
          command: 'npm run start',
          cwd: path.resolve(__dirname, '../..'),
          url: 'http://localhost:3000',
          reuseExistingServer: false,
          timeout: 60000,
          env: {
            VITE_API_URL: 'http://localhost:5001/api',
          },
        },
      ],

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: '../../test-results/',

  /* Global setup file */
  globalSetup: './global-setup.ts',
});
