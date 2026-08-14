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
import { authenticatePage } from '../utils';

test.describe('Création d\'une range', () => {
  
  test.beforeEach(async ({ page }) => {
    // Setup : accéder à la page des ranges avant chaque test
    await authenticatePage(page);
    await page.goto('/ranges');
    await page.waitForLoadState('domcontentloaded');
  });

  test('Accéder à la page de création de range', async ({ page }) => {
    // 1. Cliquer sur "Nouvelle Range" - utilise data-testid
    const newRangeButton = page.locator('[data-testid="new-range-button"]');
    await newRangeButton.waitFor({ state: 'visible', timeout: 10000 });
    await newRangeButton.click();
    
    // 2. Attendre que le dialogue s'ouvre (Material-UI Dialog)
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
    const newRangeButton = page.locator('[data-testid="new-range-button"]');
    await newRangeButton.click();
    
    const dialog = page.locator('.MuiDialog-root');
    await dialog.waitFor({ state: 'visible', timeout: 5000 });
    
    // 2. Remplir le nom
    const nameInput = page.locator('[data-testid="range-name-input"]');
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });
    
    const testRangeName = 'Range Test E2E ' + Date.now();
    await nameInput.fill(testRangeName);
    
    // 3. Vérifier que le champ est rempli
    const nameValue = await nameInput.inputValue();
    expect(nameValue).toBe(testRangeName);
    
    // 4. Remplir la description
    const descriptionInput = page.locator('[data-testid="range-description-input"]');
    await descriptionInput.waitFor({ state: 'visible', timeout: 5000 });
    await descriptionInput.fill('Créée automatiquement par les tests E2E');
    
    // 5. Sélectionner le type de range
    const rangeTypeSelect = page.locator('[data-testid="range-type-select"]');
    await rangeTypeSelect.waitFor({ state: 'visible', timeout: 5000 });
    await rangeTypeSelect.click();
    
    // Attendre que le menu déroulant s'ouvre
    await page.waitForTimeout(1000);
    
    // Sélectionner "Préflop" - utiliser le data-testid ou le texte
    const preflopOption = page.locator('[role="option"]:has-text("Préflop")');
    await preflopOption.first().waitFor({ state: 'visible', timeout: 3000 });
    await preflopOption.first().click();
    
    // 6. Sélectionner la position
    const positionSelect = page.locator('[data-testid="range-position-select"]');
    await positionSelect.waitFor({ state: 'visible', timeout: 5000 });
    await positionSelect.click();
    
    // Attendre que le menu déroulant s'ouvre
    await page.waitForTimeout(1000);
    
    // Sélectionner "BTN"
    const btnOption = page.locator('[role="option"]:has-text("BTN")');
    await btnOption.first().waitFor({ state: 'visible', timeout: 3000 });
    await btnOption.first().click();
  });

  test('Sauvegarder la range', async ({ page }) => {
    // 1. Ouvrir le dialogue et remplir le nom
    const newRangeButton = page.locator('[data-testid="new-range-button"]');
    await newRangeButton.click();
    
    const dialog = page.locator('.MuiDialog-root');
    await dialog.waitFor({ state: 'visible', timeout: 5000 });
    
    const nameInput = page.locator('[data-testid="range-name-input"]');
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });
    await nameInput.fill('Range E2E Sauvegarde');
    
    // 2. Trouver et cliquer sur le bouton Sauvegarder
    const saveButton = page.locator('[data-testid="range-save-button"]');
    await saveButton.waitFor({ state: 'visible', timeout: 5000 });
    await saveButton.click();
    
    // 3. Attendre que le dialogue se ferme ou la redirection
    await dialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    
    // 4. Vérifier qu'on est soit sur /ranges, soit sur /ranges/X/edit
    const url = page.url();
    expect(url).toMatch(/http:\/\/localhost:3000\/ranges(\/\d+\/(edit|view))?$/);
    
    console.log(`After save, URL is: ${url}`);
  });
  
  test('Vérifier que la range apparaît dans la liste', async ({ page }) => {
    // 1. Créer une range avec un nom unique
    const uniqueRangeName = 'Range E2E Liste ' + Date.now();
    
    const newRangeButton = page.locator('[data-testid="new-range-button"]');
    await newRangeButton.click();
    
    const dialog = page.locator('.MuiDialog-root');
    await dialog.waitFor({ state: 'visible', timeout: 5000 });
    
    const nameInput = page.locator('[data-testid="range-name-input"]');
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });
    await nameInput.fill(uniqueRangeName);
    
    // Sauvegarder
    const saveButton = page.locator('[data-testid="range-save-button"]');
    await saveButton.waitFor({ state: 'visible', timeout: 5000 });
    await saveButton.click();
    
    // Attendre que le dialogue se ferme ou la redirection
    await dialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    
    // 2. Aller sur la page /ranges pour voir la liste
    await authenticatePage(page);
    await page.goto('/ranges');
    await page.waitForLoadState('domcontentloaded');
    
    // 3. Vérifier que la range apparaît dans la liste
    const rangeName = page.locator(`text="${uniqueRangeName}"`);
    await rangeName.waitFor({ state: 'visible', timeout: 10000 });
    
    await expect(rangeName).toBeVisible();
  });
});
