import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { execSync } from 'child_process';

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

// E2e backend runs on port 5001 (separate from dev backend on 5000).
// Set API_URL for test specs that hit the backend directly via axios.
if (!isCI) {
  process.env.API_URL = process.env.API_URL || 'http://localhost:5001/api';
}

// E2E test database: kept separate from the dev database so local data
// is never touched. Deleted before each run so tests start from a clean
// state. The backend recreates it on startup (create_all), and
// global-setup populates it via the API.
const e2eDbPath = path.resolve(__dirname, '../../../backend/instance/poker_tool_e2e.db');
// Only run cleanup in the main process, not in worker processes.
// Playwright sets TEST_WORKER_INDEX in worker processes.
if (!isCI && process.env.TEST_WORKER_INDEX === undefined) {
  // Kill any process left on port 5001 from a previous e2e run so the
  // fresh backend can bind cleanly and pick up the new (deleted) DB.
  // Guarded by PWWORKER to prevent worker processes from re-executing
  // this and killing the backend the main process just started.
  try {
    execSync('lsof -ti:5001 | xargs kill -9 2>/dev/null', { stdio: 'ignore' });
  } catch {
    // ignore — no process on the port
  }
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
          // port 5000. FLASK_DEBUG=0 disables the reloader so Playwright
          // can manage the process cleanly. reuseExistingServer: false
          // ensures the backend always starts fresh. Stale processes on
          // port 5001 are killed above before the run starts.
          command: 'python backend/main.py',
          cwd: path.resolve(__dirname, '../../..'),
          url: 'http://localhost:5001/api/health',
          reuseExistingServer: false,
          timeout: 60000,
          env: {
            FLASK_ENV: 'development',
            FLASK_DEBUG: '0',
            DATABASE_URL: 'sqlite:///backend/instance/poker_tool_e2e.db',
            PORT: '5001',
            PYTHONPATH: 'backend',
          },
        },
        {
          // Start frontend (Vite dev server). VITE_API_URL makes the
          // frontend hit the e2e backend on port 5001 directly, so the
          // Vite proxy (hardcoded to port 5000 for dev) is bypassed.
          command: 'npm run start',
          cwd: path.resolve(__dirname, '../..'),
          url: 'http://localhost:3000',
          reuseExistingServer: true,
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
