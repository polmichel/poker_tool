/**
 * E2E Tests for Range Creation and Management
 * 
 * Scénario 1 : Créer et enregistrer une range
 * - Accéder à la page de création de range
 * - Remplir le formulaire (nom, description, type, position)
 * - Sauvegarder la range
 * - Vérifier qu'elle apparaît dans la liste des ranges enregistrées
 */

import { test, expect } from '@playwright/test';
import { mockRanges, newRangeData, rangeFormData } from '../fixtures';
import { 
  navigateTo, 
  waitForElement, 
  fillField, 
  selectOption,
  clickWithRetry,
  waitForLoadingToComplete,
  elementExists
} from '../utils';

test.describe('Création d\'une range', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the ranges page before each test
    await navigateTo(page, '/ranges');
    await waitForLoadingToComplete(page);
  });

  test('Accéder à la page de création de range', async ({ page }) => {
    // Click on "Nouvelle Range" button
    const newRangeButton = page.locator('button:has-text("Nouvelle Range")');
    await newRangeButton.waitFor({ state: 'visible' });
    await newRangeButton.click();
    
    // Should navigate to the range creation page
    await expect(page).toHaveURL('/ranges/new');
    
    // Verify the form is visible
    const formTitle = page.locator('text="Nouvelle Range"');
    await expect(formTitle).toBeVisible();
  });

  test('Créer et enregistrer une range avec le formulaire', async ({ page }) => {
    // Navigate to the range creation page
    await page.goto('/ranges/new');
    await waitForLoadingToComplete(page);
    
    // Fill the form
    const nameField = page.locator('input[name="name"]');
    await nameField.waitFor({ state: 'visible' });
    await nameField.fill(rangeFormData.rangeName);
    
    const descriptionField = page.locator('input[name="description"]');
    if (await elementExists(page, 'input[name="description"]')) {
      await descriptionField.fill(rangeFormData.rangeDescription);
    }
    
    // Select range type
    const rangeTypeSelect = page.locator('select[name="range_type"]');
    if (await elementExists(page, 'select[name="range_type"]')) {
      await rangeTypeSelect.selectOption(rangeFormData.rangeType);
    }
    
    // Select position
    const positionSelect = page.locator('select[name="position"]');
    if (await elementExists(page, 'select[name="position"]')) {
      await positionSelect.selectOption(rangeFormData.position);
    }
    
    // Submit the form
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.waitFor({ state: 'visible' });
    await submitButton.click();
    
    // Wait for navigation and loading to complete
    await waitForLoadingToComplete(page);
    
    // Should redirect to the range editor or view page
    // The exact URL depends on your implementation
    // It might redirect to /ranges/:id/edit or /ranges/:id/view
    await expect(page).toHaveURL(/(.*)\/ranges\/\d+\/(edit|view)/);
    
    // Verify the range name is visible on the page
    const rangeName = page.locator(`text="${rangeFormData.rangeName}"`);
    await expect(rangeName).toBeVisible();
  });

  test('Créer une range via le bouton Nouvelle Range', async ({ page }) => {
    // Click on "Nouvelle Range" button
    const newRangeButton = page.locator('button:has-text("Nouvelle Range")');
    await newRangeButton.waitFor({ state: 'visible' });
    await newRangeButton.click();
    
    // Fill the form with minimal data
    const nameField = page.locator('input[name="name"]');
    await nameField.waitFor({ state: 'visible' });
    await nameField.fill('Range Test Rapide');
    
    // Submit the form
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.waitFor({ state: 'visible' });
    await submitButton.click();
    
    // Wait for navigation
    await waitForLoadingToComplete(page);
    
    // Verify the range was created by checking if it appears in the list
    // Navigate back to ranges page
    await page.goto('/ranges');
    await waitForLoadingToComplete(page);
    
    // Check if the new range appears in the list
    const rangeNameInList = page.locator('text="Range Test Rapide"');
    await expect(rangeNameInList).toBeVisible();
  });

  test('Vérifier que la range créée apparaît dans la liste', async ({ page }) => {
    // First, create a range
    await page.goto('/ranges/new');
    await waitForLoadingToComplete(page);
    
    const nameField = page.locator('input[name="name"]');
    await nameField.waitFor({ state: 'visible' });
    await nameField.fill('Range pour Test Liste');
    
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.waitFor({ state: 'visible' });
    await submitButton.click();
    
    await waitForLoadingToComplete(page);
    
    // Navigate to ranges page
    await page.goto('/ranges');
    await waitForLoadingToComplete(page);
    
    // Verify the range appears in the list
    const rangeNameInList = page.locator('text="Range pour Test Liste"');
    await expect(rangeNameInList).toBeVisible();
  });

  test('Annuler la création d\'une range', async ({ page }) => {
    // Navigate to the range creation page
    await page.goto('/ranges/new');
    await waitForLoadingToComplete(page);
    
    // Fill the form partially
    const nameField = page.locator('input[name="name"]');
    await nameField.waitFor({ state: 'visible' });
    await nameField.fill('Range à Annuler');
    
    // Click on cancel button (if it exists)
    const cancelButton = page.locator('button:has-text("Annuler")');
    if (await elementExists(page, 'button:has-text("Annuler")')) {
      await cancelButton.click();
      await waitForLoadingToComplete(page);
      
      // Should be back on the ranges page
      await expect(page).toHaveURL('/ranges');
      
      // Verify the range was not created
      const rangeNameInList = page.locator('text="Range à Annuler"');
      await expect(rangeNameInList).not.toBeVisible();
    }
  });
});

test.describe('Gestion des ranges existantes', () => {
  
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/ranges');
    await waitForLoadingToComplete(page);
  });

  test('Sélectionner une range existante', async ({ page }) => {
    // Click on the first range in the list
    const firstRange = page.locator('.MuiListItemButton-root').first();
    await firstRange.waitFor({ state: 'visible' });
    await firstRange.click();
    
    // Should navigate to the range view or edit page
    await expect(page).toHaveURL(/(.*)\/ranges\/\d+\/(view|edit)/);
  });

  test('Voir les détails d\'une range', async ({ page }) => {
    // Click on the first range in the list
    const firstRange = page.locator('.MuiListItemButton-root').first();
    await firstRange.waitFor({ state: 'visible' });
    await firstRange.click();
    
    await waitForLoadingToComplete(page);
    
    // Verify the range details are visible
    // The range grid should be visible
    const rangeGrid = page.locator('.MuiPaper-root');
    await expect(rangeGrid).toBeVisible();
  });
});
