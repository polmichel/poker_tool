#!/usr/bin/env node

/**
 * Run E2E tests with automatic server startup
 *
 * Playwright's webServer configuration automatically starts both backend
 * (port 5001) and frontend (port 3001) servers for local testing.
 *
 * Usage: node scripts/run-e2e.mjs [playwright-args...]
 *
 * Examples:
 *   node scripts/run-e2e.mjs                    # Run all tests
 *   node scripts/run-e2e.mjs --ui               # Run in UI mode
 *   node scripts/run-e2e.mjs --headed          # Run in headed mode
 *   node scripts/run-e2e.mjs smoke.spec.ts      # Run specific test file
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(__dirname, '..');

// Parse arguments - skip the first two (node and script path)
const playwrightArgs = process.argv.slice(2);

console.log('🎯 Running E2E tests with Playwright...');
console.log('   Playwright will automatically start backend and frontend servers.\n');

// Run Playwright tests - it will handle server startup via webServer config
const test = spawn('npx', ['playwright', 'test', '--config', 'tests/e2e/playwright.config.ts', ...playwrightArgs], {
  cwd: frontendDir,
  stdio: 'inherit',
  env: { ...process.env, CI: 'false' }
});

// Handle test exit
test.on('close', (code) => {
  const exitCode = code || 0;
  console.log(`\n✅ Tests completed with exit code: ${exitCode}`);
  process.exit(exitCode);
});

// Handle errors
test.on('error', (err) => {
  console.error('❌ Test error:', err);
  process.exit(1);
});

// Handle interrupt
process.on('SIGINT', () => {
  console.log('\n🛑 Interrupted.');
  process.exit(1);
});
