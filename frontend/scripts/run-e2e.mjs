#!/usr/bin/env node

/**
 * Run E2E tests with backend and frontend servers
 * Usage: node scripts/run-e2e.cjs [playwright-args...]
 *
 * Examples:
 *   node scripts/run-e2e.cjs                    # Run all tests
 *   node scripts/run-e2e.cjs --ui               # Run in UI mode
 *   node scripts/run-e2e.cjs --headed          # Run in headed mode
 *   node scripts/run-e2e.cjs smoke.spec.ts      # Run specific test file
 */

import { spawn, execSync } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(__dirname, '..');
const backendDir = path.resolve(frontendDir, '..', 'backend');

// Parse arguments - skip the first two (node and script path)
const playwrightArgs = process.argv.slice(2);

console.log('Starting E2E test environment...\n');

// Start backend server
console.log('🚀 Starting backend server...');
const backend = spawn('python3', ['backend/main.py'], {
  cwd: path.resolve(frontendDir, '..'),
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, FLASK_ENV: 'production', PORT: '5001', FLASK_DEBUG: '0' }
});

backend.stdout.on('data', (data) => {
  if (data.toString().includes('Running on')) {
    console.log(`   Backend: ${data.toString().trim()}`);
  }
});

backend.stderr.on('data', (data) => {
  console.error(`   Backend error: ${data}`);
});

// Start frontend server
console.log('🚀 Starting frontend server...');
const frontend = spawn('npm', ['run', 'start'], {
  cwd: frontendDir,
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, PORT: '3001', BROWSER: 'none' }
});

frontend.stdout.on('data', (data) => {
  const output = data.toString();
  if (output.includes('Local:') || output.includes('ready')) {
    console.log(`   Frontend: ${output.trim()}`);
  }
});

frontend.stderr.on('data', (data) => {
  console.error(`   Frontend error: ${data}`);
});

// Wait for servers to be ready
const waitForServer = async (url, name, maxRetries = 30) => {
  for (let i = 1; i <= maxRetries; i++) {
    try {
      execSync(`curl -s -f -o /dev/null ${url}`, { stdio: 'ignore' });
      console.log(`✅ ${name} is ready!`);
      return true;
    } catch {
      if (i % 5 === 0) {
        console.log(`   Waiting for ${name}... (${i}/${maxRetries})`);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  console.error(`❌ ${name} failed to start`);
  return false;
};

// Wait for both servers
const backendReady = await waitForServer('http://localhost:5001/api/health', 'Backend (port 5001)');
const frontendReady = await waitForServer('http://localhost:3001', 'Frontend (port 3001)');

if (!backendReady || !frontendReady) {
  console.error('\nFailed to start test environment. Exiting...');
  backend.kill();
  frontend.kill();
  process.exit(1);
}

console.log('\n🎯 Servers are ready! Running tests...\n');

// Run Playwright tests
const playwrightArgsString = playwrightArgs.length > 0 ? playwrightArgs.join(' ') : '';
const testCommand = `npx playwright test --config tests/e2e/playwright.config.ts ${playwrightArgsString}`;

console.log(`Running: ${testCommand}\n`);

const test = spawn('npx', ['playwright', 'test', '--config', 'tests/e2e/playwright.config.ts', ...playwrightArgs], {
  cwd: frontendDir,
  stdio: 'inherit',
  env: { ...process.env, BASE_URL: 'http://localhost:3001', CI: 'false', PORT: '5001' }
});

// Handle test exit
let testExitCode = 0;
test.on('close', (code) => {
  testExitCode = code || 0;
  console.log('\n🧹 Cleaning up...');

  // Stop servers
  backend.kill();
  frontend.kill();

  setTimeout(() => {
    console.log('✅ Done!\n');
    process.exit(testExitCode);
  }, 1000);
});

// Handle errors
test.on('error', (err) => {
  console.error('Test error:', err);
  backend.kill();
  frontend.kill();
  process.exit(1);
});

// Handle interrupt
process.on('SIGINT', () => {
  console.log('\n🛑 Interrupted. Cleaning up...');
  backend.kill();
  frontend.kill();
  process.exit(1);
});
