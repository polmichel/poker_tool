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

import { spawn, execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { unlinkSync, existsSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(__dirname, '..');

// Parse arguments - skip the first two (node and script path)
const playwrightArgs = process.argv.slice(2);

// Clean up any stale processes from previous runs
console.log('🧹 Cleaning up stale processes...');
try {
  execSync('lsof -ti:5001 | xargs kill -9 2>/dev/null', { stdio: 'ignore' });
  execSync('lsof -ti:3001 | xargs kill -9 2>/dev/null', { stdio: 'ignore' });
  // Clean up test database from previous runs
  const dbPath = path.resolve(__dirname, '../../backend/instance/poker_tool_e2e.db');
  if (existsSync(dbPath)) {
    unlinkSync(dbPath);
  }
  console.log('   ✅ Cleaned up stale processes and test database\n');
} catch {
  console.log('   ℹ️  No stale processes found\n');
}

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

// Handle interrupt - kill child processes gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  test.kill('SIGINT');

  // Also kill the servers directly in case they don't stop
  try {
    execSync('lsof -ti:5001 | xargs kill -15 2>/dev/null', { stdio: 'ignore' });
    execSync('lsof -ti:3001 | xargs kill -15 2>/dev/null', { stdio: 'ignore' });
    console.log('   ✅ Servers stopped gracefully\n');
  } catch {
    // ignore
  }
  process.exit(1);
});
