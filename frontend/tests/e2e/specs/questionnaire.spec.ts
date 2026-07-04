/**
 * Tests E2E pour le questionnaire (Scénarios 2a, 2b, 2c)
 * 
 * Scénario 2 : Lancer un questionnaire dans les 3 modes
 * - Sélectionner une range existante
 * - Lancer un questionnaire dans chaque mode (fill, guess, complete)
 * - Vérifier que le questionnaire se lance correctement
 * - Vérifier que les résultats sont enregistrés
 */

import { test, expect } from '@playwright/test';

// Les modes de questionnaire disponibles dans ton application
const QUESTIONNAIRE_MODES = ['fill', 'guess', 'complete'] as const;

test.describe('Questionnaire sur une range', () => {
  
  test.beforeEach(async ({ page }) => {
    // Setup : accéder à la page de training avant chaque test
    await page.goto('http://localhost:3000/training');
    await page.waitForLoadState('networkidle');
    
    // Vérifier qu'on est bien sur la page de training
    await expect(page).toHaveURL('http://localhost:3000/training');
  });

  test('Accéder à la page de training', async ({ page }) => {
    // Vérifier que le titre de la page contient "Entraînement" ou "Training"
    const title = await page.title();
    expect(title.toLowerCase()).toContain('entraînement');
    
    // Vérifier qu'il y a du contenu sur la page
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).not.toBe('');
    expect(bodyText?.length).toBeGreaterThan(100);
  });

  test('Sélectionner une range pour le questionnaire', async ({ page }) => {
    // D'après l'Étape 2, on sait qu'il y a des ranges disponibles
    // Le sélecteur de range utilise probablement des Chips Material-UI
    
    // Attendre que les chips de ranges soient visibles
    const rangeChips = page.locator('.MuiChip-root');
    await rangeChips.first().waitFor({ state: 'visible', timeout: 5000 });
    
    // Vérifier qu'il y a au moins une range
    const chipCount = await rangeChips.count();
    expect(chipCount).toBeGreaterThan(0);
    
    // Sélectionner la première range
    await rangeChips.first().click();
    
    // Vérifier que la range est sélectionnée (devrait avoir un style différent)
    // Dans Material-UI, une Chip sélectionnée a souvent la classe MuiChip-filled
    const selectedChip = page.locator('.MuiChip-filled');
    const selectedCount = await selectedChip.count();
    expect(selectedCount).toBeGreaterThan(0);
  });

  // Test pour chaque mode de questionnaire
  QUESTIONNAIRE_MODES.forEach((mode) => {
    test(`Lancer un questionnaire en mode ${mode}`, async ({ page }) => {
      // 1. Sélectionner une range (la première disponible)
      const rangeChips = page.locator('.MuiChip-root');
      await rangeChips.first().waitFor({ state: 'visible', timeout: 5000 });
      await rangeChips.first().click();
      
      // 2. Sélectionner le mode de questionnaire
      // D'après ton code, il y a un TrainingModeSelector
      // Les modes sont probablement affichés comme des boutons ou des chips
      
      // Essayons plusieurs approches :
      const modeButtonByText = page.locator(`button:has-text("${mode}")`);
      const modeButtonByDataMode = page.locator(`button[data-mode="${mode}"]`);
      const modeChip = page.locator(`.MuiChip-root:has-text("${mode}")`);
      
      let modeSelector;
      
      if (await modeButtonByText.count() > 0) {
        modeSelector = modeButtonByText;
      } else if (await modeButtonByDataMode.count() > 0) {
        modeSelector = modeButtonByDataMode;
      } else if (await modeChip.count() > 0) {
        modeSelector = modeChip;
      } else {
        // Afficher tous les boutons/chips pour débogage
        const allButtons = page.locator('button, .MuiChip-root');
        const allCount = await allButtons.count();
        console.log(`Found ${allCount} buttons/chips total`);
        
        throw new Error(`Could not find mode selector for ${mode}. Check console logs.`);
      }
      
      await modeSelector.waitFor({ state: 'visible', timeout: 5000 });
      await modeSelector.click();
      
      // 3. Cliquer sur "Démarrer" ou "Démarrer l'entraînement"
      const startButton = page.locator('button:has-text(/Démarrer|Start/)');
      await startButton.waitFor({ state: 'visible', timeout: 5000 });
      await startButton.click();
      
      // 4. Attendre que le questionnaire démarre
      // On devrait voir :
      // - Un indicateur de question (ex: "Question 1/10")
      // - Une question affichée
      // - Des boutons de réponse
      
      const questionIndicator = page.locator('text=/Question \d+\/\d+/');
      await questionIndicator.waitFor({ state: 'visible', timeout: 10000 });
      
      // 5. Vérifier qu'on est toujours sur la page /training
      const url = page.url();
      expect(url).toContain('/training');
      
      console.log(`Questionnaire en mode ${mode} démarré avec succès`);
    });
  });

  test('Répondre à une question et passer à la suivante', async ({ page }) => {
    // 1. Sélectionner une range
    const rangeChips = page.locator('.MuiChip-root');
    await rangeChips.first().waitFor({ state: 'visible', timeout: 5000 });
    await rangeChips.first().click();
    
    // 2. Sélectionner le premier mode
    const modeButton = page.locator('button:has-text("fill")');
    await modeButton.waitFor({ state: 'visible', timeout: 5000 });
    await modeButton.click();
    
    // 3. Démarrer le questionnaire
    const startButton = page.locator('button:has-text(/Démarrer|Start/)');
    await startButton.click();
    
    // 4. Attendre la première question
    const questionIndicator = page.locator('text=/Question 1\/\d+/');
    await questionIndicator.waitFor({ state: 'visible', timeout: 10000 });
    
    // 5. Trouver et cliquer sur une réponse
    // Les réponses pourraient être :
    // - Des boutons avec des actions (open, call, raise, etc.)
    // - Des chips Material-UI
    // - Des cartes cliquables
    
    const answerButtons = page.locator('button').filter({
      hasNotText: ['Démarrer', 'Paramètres', 'Terminer', 'Précédent', 'Suivant']
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
      const resultsDialog = page.locator('text=/Résultats|Results/');
      
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
    const modeButton = page.locator('button:has-text("fill")');
    await modeButton.waitFor({ state: 'visible', timeout: 5000 });
    await modeButton.click();
    
    // 3. Démarrer le questionnaire
    const startButton = page.locator('button:has-text(/Démarrer|Start/)');
    await startButton.click();
    
    // 4. Attendre la première question
    const questionIndicator = page.locator('text=/Question 1\/\d+/');
    await questionIndicator.waitFor({ state: 'visible', timeout: 10000 });
    
    // 5. Terminer la session (bouton Terminer ou Stop)
    const endButton = page.locator('button[aria-label*="Terminer" i], button:has-text(/Terminer|Stop|End/)');
    await endButton.waitFor({ state: 'visible', timeout: 5000 });
    await endButton.click();
    
    // 6. Vérifier que le dialogue des résultats s'affiche
    const resultsDialog = page.locator('text=/Résultats|Results/');
    await resultsDialog.waitFor({ state: 'visible', timeout: 5000 });
    
    // 7. Vérifier qu'un score est affiché
    const scoreElement = page.locator('text=/\d+%/');
    await scoreElement.waitFor({ state: 'visible', timeout: 5000 });
    
    const scoreText = await scoreElement.textContent();
    expect(scoreText).toMatch(/\d+%/);
    
    console.log(`Session terminée avec score: ${scoreText}`);
  });
});
