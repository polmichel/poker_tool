/**
 * Tests E2E pour le questionnaire (Scénarios 2a, 2b, 2c)
 * 
 * Scénario 2 : Lancer un questionnaire dans les 3 modes
 * - Sélectionner une range existante (avec des mains)
 * - Lancer un questionnaire dans chaque mode
 * - Vérifier que le questionnaire se lance correctement
 * - Vérifier que les résultats sont enregistrés
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
    
    // Afficher le nom de la range sélectionnée pour débogage
    const selectedRangeName = await rangeChips.first().textContent();
    console.log(`Range sélectionnée: "${selectedRangeName}"`);
    
    // Vérifier les mains de la range via l'API
    try {
      const response = await page.request.get('http://localhost:3000/api/ranges');
      if (response.ok()) {
        const ranges = await response.json();
        const selectedRange = ranges.find((r: any) => r.name === selectedRangeName);
        if (selectedRange) {
          const handsCount = Object.keys(selectedRange.hands || {}).length;
          console.log(`Mains dans la range: ${handsCount}`);
          if (handsCount === 0) {
            console.log('WARNING: La range sélectionnée n\'a pas de mains !');
          }
        }
      }
    } catch (error) {
      console.log('Could not fetch ranges:', error);
    }
  });

  // Test pour chaque mode de questionnaire
  QUESTIONNAIRE_MODES.forEach((mode) => {
    test(`Lancer un questionnaire en mode ${mode.value}`, async ({ page }) => {
      // 1. Sélectionner une range (la première disponible)
      const rangeChips = page.locator('.MuiChip-root');
      await rangeChips.first().waitFor({ state: 'visible', timeout: 5000 });
      
      // Vérifier les mains de la première range
      let hasHands = false;
      try {
        const response = await page.request.get('http://localhost:3000/api/ranges');
        if (response.ok()) {
          const ranges = await response.json();
          const firstRange = ranges[0];
          hasHands = firstRange && Object.keys(firstRange.hands || {}).length > 0;
          console.log(`Première range: "${firstRange.name}" a ${Object.keys(firstRange.hands || {}).length} mains`);
        }
      } catch (error) {
        console.log('Could not check hands:', error);
      }
      
      // Si la première range n'a pas de mains, en sélectionner une autre ou en créer une
      if (!hasHands) {
        console.log('La première range n\'a pas de mains, on essaie la deuxième...');
        const chipCount = await rangeChips.count();
        if (chipCount > 1) {
          await rangeChips.nth(1).click();
        } else {
          console.log('Une seule range disponible et elle n\'a pas de mains. Il faut en créer une.');
          // Pour l'instant, on skip ce test
          test.skip();
          return;
        }
      } else {
        await rangeChips.first().click();
      }
      
      const selectedRangeName = await rangeChips.first().textContent();
      console.log(`Range sélectionnée: "${selectedRangeName}"`);
      
      // 2. Sélectionner le mode de questionnaire (utiliser le label en français)
      const modeButton = page.locator(`button:has-text("${mode.label}")`);
      await modeButton.waitFor({ state: 'visible', timeout: 5000 });
      await modeButton.click();
      
      // Vérifier que le mode est bien sélectionné
      const selectedModeButton = page.locator('.MuiToggleButton-root.Mui-selected');
      const selectedModeText = await selectedModeButton.textContent();
      console.log(`Mode sélectionné: "${selectedModeText}"`);
      
      // 3. Cliquer sur "Démarrer l'entraînement" (le bouton bleu, pas "Démarrer rapidement")
      const startButton = page.locator('button:has-text("Démarrer l\'entraînement")');
      await startButton.waitFor({ state: 'visible', timeout: 5000 });
      
      console.log(`Avant clic, URL: ${page.url()}`);
      await startButton.click();
      
      // Attendre un peu pour voir si quelque chose change
      await page.waitForTimeout(2000);
      console.log(`Après clic, URL: ${page.url()}`);
      
      // Vérifier s'il y a une alerte ou un snackbar
      const alert = page.locator('.MuiAlert-root, .MuiSnackbar-root');
      const alertCount = await alert.count();
      if (alertCount > 0) {
        const alertText = await alert.textContent();
        console.log(`ALERTE/SNACKBAR: ${alertText}`);
      }
      
      // Vérifier si isSessionActive est vrai (en regardant le DOM)
      const sessionActiveIndicator = page.locator('text=/Question|Résultats/');
      const sessionActiveCount = await sessionActiveIndicator.count();
      console.log(`Indicateurs de session active: ${sessionActiveCount}`);
      
      // 4. Attendre que le questionnaire démarre
      // NOTE: Le format est "Question X sur Y" (d'après TrainingQuestion.tsx)
      const questionIndicator = page.locator('text=/Question \d+ sur \d+/');
      await questionIndicator.waitFor({ state: 'visible', timeout: 10000 });
      
      // 5. Vérifier qu'on est toujours sur la page /training
      const url = page.url();
      expect(url).toContain('/training');
      
      console.log(`Questionnaire en mode ${mode.value} (${mode.label}) démarré avec succès`);
    });
  });

  test('Répondre à une question et passer à la suivante', async ({ page }) => {
    // 1. Sélectionner une range avec des mains
    const rangeChips = page.locator('.MuiChip-root');
    await rangeChips.first().waitFor({ state: 'visible', timeout: 5000 });
    
    // Trouver une range avec des mains
    let rangeIndex = 0;
    try {
      const response = await page.request.get('http://localhost:3000/api/ranges');
      if (response.ok()) {
        const ranges = await response.json();
        for (let i = 0; i < ranges.length; i++) {
          if (Object.keys(ranges[i].hands || {}).length > 0) {
            rangeIndex = i;
            break;
          }
        }
      }
    } catch (error) {
      console.log('Could not find range with hands:', error);
    }
    
    await rangeChips.nth(rangeIndex).click();
    
    // 2. Sélectionner le premier mode
    const firstModeButton = page.locator('.MuiToggleButton-root').first();
    await firstModeButton.waitFor({ state: 'visible', timeout: 5000 });
    await firstModeButton.click();
    
    // 3. Démarrer le questionnaire
    const startButton = page.locator('button:has-text("Démarrer l\'entraînement")');
    await startButton.click();
    
    // 4. Attendre la première question (format: "Question 1 sur 10")
    const questionIndicator = page.locator('text=/Question 1 sur \d+/');
    await questionIndicator.waitFor({ state: 'visible', timeout: 10000 });
    
    // 5. Trouver et cliquer sur une réponse
    const answerButtons = page.locator('button').filter({
      hasNotText: ['Démarrer rapidement', 'Démarrer l\'entraînement', 'Paramètres', 'Terminer', 'Précédent', 'Suivant', 
                   'Remplir une range', 'Deviner une range', 'Compléter une range', 'Besoin d\'un indice ?']
    });
    
    const answerCount = await answerButtons.count();
    
    if (answerCount > 0) {
      // Cliquer sur la première réponse disponible
      await answerButtons.first().waitFor({ state: 'visible', timeout: 5000 });
      await answerButtons.first().click();
      
      // 6. Attendre la question suivante ou les résultats
      await page.waitForTimeout(2000);
      
      // Vérifier soit la question suivante, soit les résultats
      const nextQuestion = page.locator('text=/Question 2 sur \d+/');
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
      for (let i = 0; i < Math.min(allButtonCount, 15); i++) {
        const btn = allButtons.nth(i);
        const text = await btn.textContent();
        buttonTexts.push(`Button ${i}: "${text}"`);
      }
      console.log(buttonTexts.join('\n'));
      
      throw new Error('Could not find answer buttons. Check console logs.');
    }
  });

  test('Terminer une session de questionnaire', async ({ page }) => {
    // 1. Sélectionner une range avec des mains
    const rangeChips = page.locator('.MuiChip-root');
    await rangeChips.first().waitFor({ state: 'visible', timeout: 5000 });
    
    // Trouver une range avec des mains
    let rangeIndex = 0;
    try {
      const response = await page.request.get('http://localhost:3000/api/ranges');
      if (response.ok()) {
        const ranges = await response.json();
        for (let i = 0; i < ranges.length; i++) {
          if (Object.keys(ranges[i].hands || {}).length > 0) {
            rangeIndex = i;
            break;
          }
        }
      }
    } catch (error) {
      console.log('Could not find range with hands:', error);
    }
    
    await rangeChips.nth(rangeIndex).click();
    
    // 2. Sélectionner le premier mode
    const firstModeButton = page.locator('.MuiToggleButton-root').first();
    await firstModeButton.waitFor({ state: 'visible', timeout: 5000 });
    await firstModeButton.click();
    
    // 3. Démarrer le questionnaire
    const startButton = page.locator('button:has-text("Démarrer l\'entraînement")');
    await startButton.click();
    
    // 4. Attendre la première question (format: "Question 1 sur 10")
    const questionIndicator = page.locator('text=/Question 1 sur \d+/');
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
