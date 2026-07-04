#!/usr/bin/env node

/**
 * Script to verify E2E test configuration
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification de la configuration E2E...\n');

// Check if tests directory exists
const testsDir = path.join(__dirname, '../tests/e2e');
if (!fs.existsSync(testsDir)) {
  console.error('❌ Le dossier tests/e2e n\'existe pas');
  process.exit(1);
}
console.log('✅ Dossier tests/e2e existe');

// Check required files
const requiredFiles = [
  'playwright.config.ts',
  'global-setup.ts',
  'specs/create-range.spec.ts',
  'specs/questionnaire.spec.ts',
  'fixtures/ranges.ts',
  'utils/test-utils.ts',
];

for (const file of requiredFiles) {
  const filePath = path.join(testsDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Fichier manquant: ${file}`);
    process.exit(1);
  }
  console.log(`✅ Fichier existe: ${file}`);
}

// Check package.json for Playwright dependencies
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

if (!packageJson.devDependencies || !packageJson.devDependencies['@playwright/test']) {
  console.error('❌ @playwright/test n\'est pas dans les devDependencies');
  process.exit(1);
}
console.log('✅ @playwright/test est dans les devDependencies');

// Check for test scripts
const requiredScripts = ['test:e2e', 'test:e2e:ui', 'test:e2e:headed'];
for (const script of requiredScripts) {
  if (!packageJson.scripts || !packageJson.scripts[script]) {
    console.error(`❌ Script manquant: ${script}`);
    process.exit(1);
  }
  console.log(`✅ Script existe: ${script}`);
}

// Check GitHub Actions workflow
const workflowPath = path.join(__dirname, '../../.github/workflows/e2e.yml');
if (!fs.existsSync(workflowPath)) {
  console.error('❌ Workflow GitHub Actions manquant: .github/workflows/e2e.yml');
  process.exit(1);
}
console.log('✅ Workflow GitHub Actions existe');

// Check .env.test file
const envTestPath = path.join(__dirname, '../.env.test');
if (!fs.existsSync(envTestPath)) {
  console.error('❌ Fichier .env.test manquant');
  process.exit(1);
}
console.log('✅ Fichier .env.test existe');

console.log('\n🎉 Toutes les vérifications ont réussi !');
console.log('\nProchaines étapes:');
console.log('1. Exécutez: npm install --save-dev @playwright/test');
console.log('2. Exécutez: npx playwright install');
console.log('3. Démarrez votre serveur: npm run start');
console.log('4. Exécutez les tests: npm run test:e2e');
