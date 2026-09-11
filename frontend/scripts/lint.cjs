#!/usr/bin/env node

const { execSync } = require('child_process');

const args = process.argv.slice(2);
const write = args.includes('--write') || args.includes('-w');

const eslintCmd = write ? 'eslint src/ --ext .ts,.tsx --fix' : 'eslint src/ --ext .ts,.tsx';
const prettierCmd = write ? 'npx prettier --write "src/**/*.{ts,tsx,css,md}"' : 'npx prettier --check "src/**/*.{ts,tsx,css,md}"';

try {
  execSync(eslintCmd, { stdio: 'inherit' });
  execSync(prettierCmd, { stdio: 'inherit' });
} catch (error) {
  process.exit(1);
}
