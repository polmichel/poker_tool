/**
 * Tests E2E pour le questionnaire (Scénarios 2a, 2b, 2c)
 * 
 * Scénario 2 : Lancer un questionnaire dans les 3 modes
 * - Sélectionner une range existante
 * - Lancer un questionnaire dans chaque mode
 * - Vérifier que le questionnaire se lance correctement
 * - Vérifier que les résultats sont enregistrés
 * 
 * NOTE: D'après les logs, il y a 2 boutons "Démarrer" :
 * - "Démarrer rapidement" (bouton vert)
 * - "Démarrer l'entraînement" (bouton bleu, large) ← C'est celui qu'on veut
 */

import { test, expect } from '@playwright/test';

// Les modes de questionnaire avec leurs labels en français
const QUESTIONNAIRE_MODES = [
  { value: 'fill', label: 'Remplir une range' },
  { value: 'guess', label: 'Deviner une range' },
  { value: 'complete', label: 'Compléter une range' },
] as const;

test.describe('Questionnaire sur une range', () => {
  
  test.beforeEach(async ({ page }) => {
    // Setup : accéder à la page de training avant chaque test
    await page.goto('http://localhost:3000/training');
    await page.waitForLoadState('networkidle');
    
    // Vérifier qu'on est bien sur la page de training
    await expect(page).toHaveURL('http://localhost:3000/training');
  });

  test('Accéder à la page de training', async ({ page }) => {
    // Vérifier que le titre de la page contient "Poker"
    const title = await page.title();
    expect(title.toLowerCase()).toContain('poker');
    
    // Vérifier qu'il y a du contenu sur la page
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).not.toBe('');
    expect(bodyText?.length).toBeGreaterThan(100);
    
    // Vérifier que le sélecteur de mode est visible
    const modeSelector = page.locator('.MuiToggleButtonGroup-root');
    await expect(modeSelector).toBeVisible();
  });

  test('Sélectionner une range pour le questionnaire', async ({ page }) => {
    // Attendre que les chips de ranges soient visibles
    const rangeChips = page.locator('.MuiChip-root');
    await rangeChips.first().waitFor({ state: 'visible', timeout: 5000 });
    
    // Vérifier qu'il y a au moins une range
    const chipCount = await rangeChips.count();
    expect(chipCount).toBeGreaterThan(0);
    
    // Sélectionner la première range
    await rangeChips.first().click();
    
    // Vérifier que la range est sélectionnée
    const selectedChip = page.locator('.MuiChip-filled');
    const selectedCount = await selectedChip.count();
    expect(selectedCount).toBeGreaterThan(0);
  });

  // Test pour chaque mode de questionnaire
  QUESTIONNAIRE_MODES.forEach((mode) => {
    test(`Lancer un questionnaire en mode ${mode.value}`, async ({ page }) => {
      // 1. Sélectionner une range (la première disponible)
      const rangeChips = page.locator('.MuiChip-root');
      await rangeChips.first().waitFor({ state: 'visible', timeout: 5000 });
      await rangeChips.first().click();
      
      // 2. Sélectionner le mode de questionnaire (utiliser le label en français)
      const modeButton = page.locator(`button:has-text("${mode.label}")`);
      await modeButton.waitFor({ state: 'visible', timeout: 5000 });
      await modeButton.click();
      
      // 3. Cliquer sur "Démarrer l'entraînement" (le bouton bleu, pas "Démarrer rapidement")
      const startButton = page.locator('button:has-text("Démarrer l\'entraînement")');
      await startButton.waitFor({ state: 'visible', timeout: 5000 });
      await startButton.click();
      
      // 4. Attendre que le questionnaire démarre
      const questionIndicator = page.locator('text=/Question \d+\/\d+/');
      await questionIndicator.waitFor({ state: 'visible', timeout: 10000 });
      
      // 5. Vérifier qu'on est toujours sur la page /training
      const url = page.url();
      expect(url).toContain('/training');
      
      console.log(`Questionnaire en mode ${mode.value} (${mode.label}) démarré avec succès`);
    });
  });

  test('Répondre à une question et passer à la suivante', async ({ page }) => {
    // 1. Sélectionner une range
    const rangeChips = page.locator('.MuiChip-root');
    await rangeChips.first().waitFor({ state: 'visible', timeout: 5000 });
    await rangeChips.first().click();
    
    // 2. Sélectionner le premier mode
    const firstModeButton = page.locator('.MuiToggleButton-root').first();
    await firstModeButton.waitFor({ state: 'visible', timeout: 5000 });
    await firstModeButton.click();
    
    // 3. Démarrer le questionnaire
    const startButton = page.locator('button:has-text("Démarrer l\'entraînement")');
    await startButton.click();
    
    // 4. Attendre la première question
    const questionIndicator = page.locator('text=/Question 1\/\d+/');
    await questionIndicator.waitFor({ state: 'visible', timeout: 10000 });
    
    // 5. Trouver et cliquer sur une réponse
    const answerButtons = page.locator('button').filter({
      hasNotText: ['Démarrer rapidement', 'Démarrer l\'entraînement', 'Paramètres', 'Terminer', 'Précédent', 'Suivant', 
                   'Remplir une range', 'Deviner une range', 'Compléter une range']
    });
    
    const answerCount = await answerButtons.count();
    
    if (answerCount > 0) {
      // Cliquer sur la première réponse disponible
      await answerButtons.first().waitFor({ state: 'visible', timeout: 5000 });
      await answerButtons.first().click();
      
      // 6. Attendre la question suivante ou les résultats
      await page.waitForTimeout(2000);
      
      // Vérifier soit la question suivante, soit les résultats
      const nextQuestion = page.locator('text=/Question 2\/\d+/');
      const resultsDialog = page.locator('text="Résultats de la Session"');
      
      const nextQuestionCount = await nextQuestion.count();
      const resultsCount = await resultsDialog.count();
      
      expect(nextQuestionCount > 0 || resultsCount > 0).toBeTruthy();
      
      console.log(`Réponse soumise, question suivante ou résultats affichés`);
    } else {
      // Afficher tous les boutons pour débogage
      const allButtons = page.locator('button');
      const allButtonCount = await allButtons.count();
      console.log(`Found ${allButtonCount} buttons total`);
      
      const buttonTexts = [];
      for (let i = 0; i < Math.min(allButtonCount, 10); i++) {
        const btn = allButtons.nth(i);
        const text = await btn.textContent();
        buttonTexts.push(`Button ${i}: "${text}"`);
      }
      console.log(buttonTexts.join('\n'));
      
      throw new Error('Could not find answer buttons. Check console logs.');
    }
  });

  test('Terminer une session de questionnaire', async ({ page }) => {
    // 1. Sélectionner une range
    const rangeChips = page.locator('.MuiChip-root');
    await rangeChips.first().waitFor({ state: 'visible', timeout: 5000 });
    await rangeChips.first().click();
    
    // 2. Sélectionner le premier mode
    const firstModeButton = page.locator('.MuiToggleButton-root').first();
    await firstModeButton.waitFor({ state: 'visible', timeout: 5000 });
    await firstModeButton.click();
    
    // 3. Démarrer le questionnaire
    const startButton = page.locator('button:has-text("Démarrer l\'entraînement")');
    await startButton.click();
    
    // 4. Attendre la première question
    const questionIndicator = page.locator('text=/Question 1\/\d+/');
    await questionIndicator.waitFor({ state: 'visible', timeout: 10000 });
    
    // 5. Terminer la session (bouton Terminer)
    const endButton = page.locator('button:has-text("Terminer")');
    await endButton.waitFor({ state: 'visible', timeout: 5000 });
    await endButton.click();
    
    // 6. Vérifier que le dialogue des résultats s'affiche
    const resultsDialog = page.locator('text="Résultats de la Session"');
    await resultsDialog.waitFor({ state: 'visible', timeout: 5000 });
    
    // 7. Vérifier qu'un score est affiché
    const scoreElement = page.locator('text=/\d+%/');
    await scoreElement.waitFor({ state: 'visible', timeout: 5000 });
    
    const scoreText = await scoreElement.textContent();
    expect(scoreText).toMatch(/\d+%/);
    
    console.log(`Session terminée avec score: ${scoreText}`);
  });
});
