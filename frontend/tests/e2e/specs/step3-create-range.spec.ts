/**
 * ÉTAPE 3: Test pour créer une range
 * 
 * Objectif: Créer une range et vérifier qu'elle est enregistrée.
 * 
 * À exécuter localement avec:
 *   npm run start (dans un terminal)
 *   npx playwright test --headed tests/e2e/specs/step3-create-range.spec.ts (dans un autre terminal)
 */

import { test, expect } from '@playwright/test';

test.describe('Étape 3: Créer une range', () => {
  
  test('Accéder à la page de création de range', async ({ page }) => {
    // 1. Aller sur la page /ranges
    await page.goto('http://localhost:3000/ranges');
    await page.waitForLoadState('networkidle');
    
    // 2. Cliquer sur "Nouvelle Range"
    // NOTE: À adapter selon ton implémentation réelle
    const newRangeButton = page.locator('button:has-text("Nouvelle Range")');
    await newRangeButton.waitFor({ state: 'visible', timeout: 10000 });
    await newRangeButton.click();
    
    // 3. Attendre la navigation vers /ranges/new
    await expect(page).toHaveURL('http://localhost:3000/ranges/new');
    
    // 4. Vérifier que le titre de la page est correct
    const pageTitle = page.locator('text=/Nouvelle Range|Créer une range|Create Range/');
    await expect(pageTitle).toBeVisible();
  });
  
  test('Remplir le formulaire de création de range', async ({ page }) => {
    // 1. Aller sur la page de création
    await page.goto('http://localhost:3000/ranges/new');
    await page.waitForLoadState('networkidle');
    
    // 2. Remplir le nom de la range
    // NOTE: À adapter selon ton implémentation
    // Possibilités :
    // - input[name="name"]
    // - input[id="name"]
    // - .MuiTextField-root input
    // - input[label="Nom"]
    const nameInput = page.locator('input[name="name"]');
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });
    await nameInput.fill('Ma Première Range E2E');
    
    // 3. Remplir la description (si le champ existe)
    const descriptionInput = page.locator('input[name="description"], textarea[name="description"]');
    const descCount = await descriptionInput.count();
    if (descCount > 0) {
      await descriptionInput.fill('Créée automatiquement par les tests E2E');
    }
    
    // 4. Sélectionner le type de range (si le champ existe)
    const rangeTypeSelect = page.locator('select[name="range_type"], .MuiSelect-select');
    const typeCount = await rangeTypeSelect.count();
    if (typeCount > 0) {
      await rangeTypeSelect.waitFor({ state: 'visible' });
      await rangeTypeSelect.selectOption('preflop');
    }
    
    // 5. Sélectionner la position (si le champ existe)
    const positionSelect = page.locator('select[name="position"], .MuiSelect-select');
    const posCount = await positionSelect.count();
    if (posCount > 0) {
      await positionSelect.waitFor({ state: 'visible' });
      await positionSelect.selectOption('BTN');
    }
    
    // 6. Vérifier que les champs sont remplis
    const nameValue = await nameInput.inputValue();
    expect(nameValue).toBe('Ma Première Range E2E');
  });
  
  test('Sauvegarder la range', async ({ page }) => {
    // 1. Aller sur la page de création
    await page.goto('http://localhost:3000/ranges/new');
    await page.waitForLoadState('networkidle');
    
    // 2. Remplir le nom (minimum requis)
    const nameInput = page.locator('input[name="name"]');
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });
    await nameInput.fill('Range E2E Test Sauvegarde');
    
    // 3. Cliquer sur le bouton Sauvegarder
    // NOTE: À adapter selon ton implémentation
    // Possibilités :
    // - button[type="submit"]
    // - button:has-text("Sauvegarder")
    // - button:has-text("Enregistrer")
    // - .MuiButton-contained
    const saveButton = page.locator('button[type="submit"]');
    await saveButton.waitFor({ state: 'visible', timeout: 5000 });
    await saveButton.click();
    
    // 4. Attendre la navigation ou la confirmation
    // Selon ton implémentation, ça peut :
    // - Rediriger vers /ranges
    // - Afficher un message de succès
    // - Fermer le dialogue
    
    // Attendre soit une redirection, soit un message de succès
    try {
      await expect(page).toHaveURL('http://localhost:3000/ranges', { timeout: 5000 });
    } catch {
      // Si pas de redirection, vérifier un message de succès
      const successMessage = page.locator('text=/Range enregistrée|Sauvegardé|Success/');
      await expect(successMessage).toBeVisible({ timeout: 5000 });
    }
  });
  
  test('Vérifier que la range apparaît dans la liste', async ({ page }) => {
    // 1. Créer une range d'abord
    await page.goto('http://localhost:3000/ranges/new');
    await page.waitForLoadState('networkidle');
    
    const nameInput = page.locator('input[name="name"]');
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });
    await nameInput.fill('Range pour Test Liste');
    
    const saveButton = page.locator('button[type="submit"]');
    await saveButton.waitFor({ state: 'visible', timeout: 5000 });
    await saveButton.click();
    
    // Attendre la redirection ou le message de succès
    try {
      await expect(page).toHaveURL('http://localhost:3000/ranges', { timeout: 5000 });
    } catch {
      await page.waitForTimeout(2000);
    }
    
    // 2. Aller sur la page /ranges
    await page.goto('http://localhost:3000/ranges');
    await page.waitForLoadState('networkidle');
    
    // 3. Vérifier que la range apparaît dans la liste
    // NOTE: À adapter selon comment les ranges sont affichées
    // Possibilités :
    // - text="Range pour Test Liste"
    // - .MuiListItem-text:has-text("Range pour Test Liste")
    // - .MuiChip-root:has-text("Range pour Test Liste")
    const rangeName = page.locator('text="Range pour Test Liste"');
    await expect(rangeName).toBeVisible({ timeout: 10000 });
  });
});
