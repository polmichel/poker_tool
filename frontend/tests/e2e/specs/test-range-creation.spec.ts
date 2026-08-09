/**
 * Test minimal pour vérifier que la création de range fonctionne
 * après le fix du proxy API
 */

import { test, expect } from '@playwright/test';

test.describe('Test création de range - Vérification fix proxy', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ranges');
    await page.waitForLoadState('networkidle');
  });

  test('Créer une range fonctionne', async ({ page }) => {
    // 1. Ouvrir le dialogue de nouvelle range
    const newRangeButton = page.locator('button:has-text("Nouvelle Range")');
    await newRangeButton.waitFor({ state: 'visible', timeout: 10000 });
    await newRangeButton.click();
    
    // 2. Attendre que le dialogue s'ouvre
    const dialog = page.locator('.MuiDialog-root');
    await dialog.waitFor({ state: 'visible', timeout: 5000 });
    
    // 3. Remplir le nom
    const nameInput = page.locator('.MuiTextField-root:has-text("Nom") input').first();
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });
    const rangeName = 'Test Range ' + Date.now();
    await nameInput.fill(rangeName);
    
    // 4. Sélectionner le type (Préflop)
    const typeSelect = page.locator('.MuiSelect-select').first();
    await typeSelect.waitFor({ state: 'visible', timeout: 5000 });
    await typeSelect.click();
    
    await page.waitForTimeout(1000);
    const preflopOption = page.locator('[role="option"]:has-text("Préflop")');
    await preflopOption.first().waitFor({ state: 'visible', timeout: 3000 });
    await preflopOption.first().click();
    
    // 5. Sélectionner la position (BTN)
    const positionSelect = page.locator('.MuiSelect-select').nth(1);
    await positionSelect.waitFor({ state: 'visible', timeout: 5000 });
    await positionSelect.click();
    
    await page.waitForTimeout(1000);
    const btnOption = page.locator('[role="option"]:has-text("BTN")');
    await btnOption.first().waitFor({ state: 'visible', timeout: 3000 });
    await btnOption.first().click();
    
    // 6. Cliquer sur Créer
    const createButton = page.locator('button:has-text("Créer")');
    await createButton.waitFor({ state: 'visible', timeout: 5000 });
    
    // 7. Intercepter la requête et la réponse
    const requestPromise = page.waitForRequest(request => 
      request.method() === 'POST' && request.url().includes('/api/ranges/')
    );
    
    await createButton.click();
    
    const request = await requestPromise;
    console.log('✅ Requête POST envoyée:', request.url());
    console.log('✅ Méthode:', request.method());
    console.log('✅ Body:', request.postData());
    
    // 8. Attendre la réponse
    const response = await page.waitForResponse(response => 
      response.request().method() === 'POST' && response.request().url().includes('/api/ranges/')
    );
    
    console.log('✅ Réponse reçue:', response.status());
    const responseBody = await response.json();
    console.log('✅ Body de la réponse:', JSON.stringify(responseBody));
    
    // 9. Vérifier que la création a réussi
    expect(response.status()).toBe(201);
    expect(responseBody.name).toBe(rangeName);
    expect(responseBody.id).toBeDefined();
    
    // 10. Vérifier que la range apparaît dans la liste
    await page.waitForTimeout(2000);
    const rangeNameLocator = page.locator(`text="${rangeName}"`);
    await rangeNameLocator.waitFor({ state: 'visible', timeout: 10000 });
    expect(await rangeNameLocator.count()).toBeGreaterThan(0);
    
    console.log('✅ Range créée et affichée avec succès!');
  });
});
