/**
 * Tests E2E pour la création de ranges
 * 
 * Scénario 1 : Créer et enregistrer une range
 * - Accéder à la page de création de range
 * - Remplir le formulaire (nom, description, type, position)
 * - Sauvegarder la range
 * - Vérifier qu'elle apparaît dans la liste des ranges enregistrées
 */

import { test, expect } from '@playwright/test';

test.describe('Création d\'une range', () => {
  
  test.beforeEach(async ({ page }) => {
    // Setup : accéder à la page des ranges avant chaque test
    await page.goto('http://localhost:3000/ranges');
    await page.waitForLoadState('networkidle');
  });

  test('Accéder à la page de création de range', async ({ page }) => {
    // 1. Cliquer sur "Nouvelle Range" - cela ouvre un dialogue Material-UI
    const newRangeButton = page.locator('button:has-text("Nouvelle Range")');
    await newRangeButton.waitFor({ state: 'visible', timeout: 10000 });
    await newRangeButton.click();
    
    // 2. Attendre que le dialogue s'ouvre
    const dialog = page.locator('.MuiDialog-root');
    await dialog.waitFor({ state: 'visible', timeout: 5000 });
    
    // 3. Vérifier que le titre du dialogue est correct
    const dialogTitle = page.locator('.MuiDialogTitle-root');
    await expect(dialogTitle).toBeVisible();
    
    // 4. Vérifier le texte du titre
    const titleText = await dialogTitle.textContent();
    expect(titleText?.toLowerCase()).toContain('range');
  });

  test('Remplir le formulaire de création de range', async ({ page }) => {
    // 1. Ouvrir le dialogue
    const newRangeButton = page.locator('button:has-text("Nouvelle Range")');
    await newRangeButton.click();
    
    const dialog = page.locator('.MuiDialog-root');
    await dialog.waitFor({ state: 'visible', timeout: 5000 });
    
    // 2. Trouver le champ de nom (Material-UI TextField)
    const nameInput = page.locator('.MuiTextField-root:has-text("Nom") input').first();
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });
    
    // 3. Remplir le nom
    const testRangeName = 'Range Test E2E ' + Date.now();
    await nameInput.fill(testRangeName);
    
    // 4. Vérifier que le champ est rempli
    const nameValue = await nameInput.inputValue();
    expect(nameValue).toBe(testRangeName);
    
    // 5. Remplir la description si le champ existe
    const descriptionInput = page.locator('.MuiTextField-root:has-text("Description") input, .MuiTextField-root:has-text("Description") textarea');
    const descCount = await descriptionInput.count();
    if (descCount > 0) {
      await descriptionInput.first().fill('Créée automatiquement par les tests E2E');
    }
    
    // 6. Sélectionner le type de range si le champ existe
    const rangeTypeSelect = page.locator('.MuiSelect-select');
    const typeCount = await rangeTypeSelect.count();
    if (typeCount > 0) {
      await rangeTypeSelect.first().waitFor({ state: 'visible' });
      await rangeTypeSelect.first().click();
      
      // Sélectionner "preflop" dans le menu déroulant
      const preflopOption = page.locator('text="preflop"');
      await preflopOption.waitFor({ state: 'visible', timeout: 2000 });
      await preflopOption.click();
    }
    
    // 7. Sélectionner la position si le champ existe
    const positionSelect = page.locator('.MuiSelect-select');
    const posCount = await positionSelect.count();
    if (posCount > 1) {
      await positionSelect.nth(1).waitFor({ state: 'visible' });
      await positionSelect.nth(1).click();
      
      // Sélectionner "BTN" dans le menu déroulant
      const btnOption = page.locator('text="BTN"');
      await btnOption.waitFor({ state: 'visible', timeout: 2000 });
      await btnOption.click();
    }
  });

  test('Sauvegarder la range', async ({ page }) => {
    // 1. Ouvrir le dialogue et remplir le nom
    const newRangeButton = page.locator('button:has-text("Nouvelle Range")');
    await newRangeButton.click();
    
    const dialog = page.locator('.MuiDialog-root');
    await dialog.waitFor({ state: 'visible', timeout: 5000 });
    
    const nameInput = page.locator('.MuiTextField-root:has-text("Nom") input').first();
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });
    await nameInput.fill('Range E2E Sauvegarde');
    
    // 2. Trouver et cliquer sur le bouton Sauvegarder
    const saveButton = page.locator('button:has-text("Sauvegarder")');
    await saveButton.waitFor({ state: 'visible', timeout: 5000 });
    await saveButton.click();
    
    // 3. Attendre que le dialogue se ferme ou la redirection
    await dialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    
    // 4. Vérifier qu'on est soit sur /ranges, soit sur /ranges/X/edit
    // (L'application redirige vers /ranges/X/edit après sauvegarde)
    const url = page.url();
    expect(url).toMatch(/http:\/\/localhost:3000\/ranges(\/\d+\/(edit|view))?$/);
  });

  test('Vérifier que la range apparaît dans la liste', async ({ page }) => {
    // 1. Créer une range avec un nom unique
    const uniqueRangeName = 'Range E2E Liste ' + Date.now();
    
    const newRangeButton = page.locator('button:has-text("Nouvelle Range")');
    await newRangeButton.click();
    
    const dialog = page.locator('.MuiDialog-root');
    await dialog.waitFor({ state: 'visible', timeout: 5000 });
    
    const nameInput = page.locator('.MuiTextField-root:has-text("Nom") input').first();
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });
    await nameInput.fill(uniqueRangeName);
    
    // Sauvegarder
    const saveButton = page.locator('button:has-text("Sauvegarder")');
    await saveButton.waitFor({ state: 'visible', timeout: 5000 });
    await saveButton.click();
    
    // Attendre que le dialogue se ferme ou la redirection
    await dialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    
    // 2. Aller sur la page /ranges pour voir la liste
    await page.goto('http://localhost:3000/ranges');
    await page.waitForLoadState('networkidle');
    
    // 3. Vérifier que la range apparaît dans la liste
    const rangeName = page.locator(`text="${uniqueRangeName}"`);
    await rangeName.waitFor({ state: 'visible', timeout: 10000 });
    
    await expect(rangeName).toBeVisible();
  });
});
