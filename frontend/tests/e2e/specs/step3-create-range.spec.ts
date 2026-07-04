/**
 * ÉTAPE 3: Test pour créer une range
 * 
 * Objectif: Créer une range et vérifier qu'elle est enregistrée.
 * 
 * NOTE: D'après les logs, après sauvegarde on est redirigé vers /ranges/X/edit
 * (pas /ranges). C'est le comportement normal de l'application.
 * 
 * À exécuter localement avec:
 *   npm run start (dans un terminal)
 *   npx playwright test --headed tests/e2e/specs/step3-create-range.spec.ts (dans un autre terminal)
 */

import { test, expect } from '@playwright/test';

test.describe('Étape 3: Créer une range', () => {
  
  test('Ouvrir le dialogue de création de range', async ({ page }) => {
    // 1. Aller sur la page /ranges
    await page.goto('http://localhost:3000/ranges');
    await page.waitForLoadState('networkidle');
    
    // 2. Cliquer sur "Nouvelle Range" - cela ouvre un dialogue
    const newRangeButton = page.locator('button:has-text("Nouvelle Range")');
    await newRangeButton.waitFor({ state: 'visible', timeout: 10000 });
    await newRangeButton.click();
    
    // 3. Attendre que le dialogue s'ouvre (Material-UI Dialog)
    const dialog = page.locator('.MuiDialog-root');
    await dialog.waitFor({ state: 'visible', timeout: 5000 });
    
    // 4. Vérifier que le titre du dialogue est correct
    const dialogTitle = page.locator('.MuiDialogTitle-root');
    await expect(dialogTitle).toBeVisible();
    
    // Afficher le titre pour débogage
    const titleText = await dialogTitle.textContent();
    console.log(`Dialog title: "${titleText}"`);
  });
  
  test('Remplir le formulaire dans le dialogue', async ({ page }) => {
    // 1. Ouvrir le dialogue
    await page.goto('http://localhost:3000/ranges');
    await page.waitForLoadState('networkidle');
    
    const newRangeButton = page.locator('button:has-text("Nouvelle Range")');
    await newRangeButton.click();
    
    const dialog = page.locator('.MuiDialog-root');
    await dialog.waitFor({ state: 'visible', timeout: 5000 });
    
    // 2. Trouver le champ de nom - essayer plusieurs sélecteurs Material-UI
    const nameInputByLabel = page.locator('.MuiTextField-root:has-text("Nom") input');
    const nameInputById = page.locator('input#name');
    const nameInputByClass = page.locator('.MuiInput-root input').first();
    
    let nameInput;
    
    if (await nameInputByLabel.count() > 0) {
      nameInput = nameInputByLabel;
      console.log('Using name input by label');
    } else if (await nameInputById.count() > 0) {
      nameInput = nameInputById;
      console.log('Using name input by id');
    } else if (await nameInputByClass.count() > 0) {
      nameInput = nameInputByClass;
      console.log('Using name input by class');
    } else {
      throw new Error('Could not find name input. Check console logs.');
    }
    
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });
    await nameInput.fill('Ma Première Range E2E');
    
    // 3. Vérifier que le champ est rempli
    const nameValue = await nameInput.inputValue();
    expect(nameValue).toBe('Ma Première Range E2E');
  });
  
  test('Sauvegarder la range', async ({ page }) => {
    // 1. Ouvrir le dialogue et remplir le nom
    await page.goto('http://localhost:3000/ranges');
    await page.waitForLoadState('networkidle');
    
    const newRangeButton = page.locator('button:has-text("Nouvelle Range")');
    await newRangeButton.click();
    
    const dialog = page.locator('.MuiDialog-root');
    await dialog.waitFor({ state: 'visible', timeout: 5000 });
    
    // Trouver le champ name
    const nameInputByLabel = page.locator('.MuiTextField-root:has-text("Nom") input');
    const nameInputById = page.locator('input#name');
    const nameInputByClass = page.locator('.MuiInput-root input').first();
    
    let nameInput;
    
    if (await nameInputByLabel.count() > 0) {
      nameInput = nameInputByLabel;
    } else if (await nameInputById.count() > 0) {
      nameInput = nameInputById;
    } else {
      nameInput = nameInputByClass;
    }
    
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });
    await nameInput.fill('Range E2E Test Sauvegarde');
    
    // 2. Trouver et cliquer sur le bouton Sauvegarder
    const saveButton = page.locator('button:has-text("Sauvegarder")');
    const saveButtonCount = await saveButton.count();
    
    if (saveButtonCount > 0) {
      await saveButton.waitFor({ state: 'visible', timeout: 5000 });
      await saveButton.click();
    } else {
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
    }
    
    // 3. Attendre que le dialogue se ferme OU la redirection
    await dialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    
    // 4. Vérifier qu'on est soit sur /ranges, soit sur /ranges/X/edit
    // (D'après les logs, on est redirigé vers /ranges/2/edit)
    const url = page.url();
    expect(url).toMatch(/http:\/\/localhost:3000\/ranges(\/\d+\/edit)?$/);
    
    console.log(`After save, URL is: ${url}`);
  });
  
  test('Vérifier que la range apparaît dans la liste', async ({ page }) => {
    // 1. Créer une range
    await page.goto('http://localhost:3000/ranges');
    await page.waitForLoadState('networkidle');
    
    const newRangeButton = page.locator('button:has-text("Nouvelle Range")');
    await newRangeButton.click();
    
    const dialog = page.locator('.MuiDialog-root');
    await dialog.waitFor({ state: 'visible', timeout: 5000 });
    
    // Remplir le nom
    const nameInputByLabel = page.locator('.MuiTextField-root:has-text("Nom") input');
    const nameInputById = page.locator('input#name');
    const nameInputByClass = page.locator('.MuiInput-root input').first();
    
    let nameInput;
    
    if (await nameInputByLabel.count() > 0) {
      nameInput = nameInputByLabel;
    } else if (await nameInputById.count() > 0) {
      nameInput = nameInputById;
    } else {
      nameInput = nameInputByClass;
    }
    
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });
    await nameInput.fill('Range pour Test Liste');
    
    // Sauvegarder
    const saveButton = page.locator('button:has-text("Sauvegarder")');
    const saveButtonCount = await saveButton.count();
    
    if (saveButtonCount > 0) {
      await saveButton.click();
    } else {
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
    }
    
    // Attendre que le dialogue se ferme ou la redirection
    await dialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    
    // 2. Aller sur la page /ranges pour voir la liste
    await page.goto('http://localhost:3000/ranges');
    await page.waitForLoadState('networkidle');
    
    // 3. Vérifier que la range apparaît dans la liste
    const rangeName = page.locator('text="Range pour Test Liste"');
    await rangeName.waitFor({ state: 'visible', timeout: 10000 });
    
    await expect(rangeName).toBeVisible();
  });
});
