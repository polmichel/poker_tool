/**
 * Tests E2E pour le questionnaire (Sc\u00e9narios 2a, 2b, 2c)
 *
 * Sc\u00e9nario 2 : Lancer un questionnaire dans les 3 modes
 * - S\u00e9lectionner une range existante (avec des mains)
 * - Lancer un questionnaire dans chaque mode
 * - V\u00e9rifier que le questionnaire se lance correctement
 * - V\u00e9rifier que les r\u00e9sultats sont enregistr\u00e9s
 */

import { test, expect } from '@playwright/test';
import { authenticatePage } from '../utils';

// Les modes de questionnaire avec leurs labels en fran\u0007ais
const QUESTIONNAIRE_MODES = [
  { value: 'fill', label: 'Remplir une range' },
  { value: 'guess', label: 'Deviner une range' },
  { value: 'complete', label: 'Compl\u00e9ter une range' },
] as const;

test.describe('Questionnaire sur une range', () => {
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    // Authenticate so the ProtectedRoute lets us through.
    await authenticatePage(page);
    // Setup : acc\u00e9der \u00e0 la page de training avant chaque test
    await page.goto('/training');
    await page.waitForLoadState('domcontentloaded');

    // V\u00e9rifier qu'on est bien sur la page de training
    await expect(page).toHaveURL('/training');
  });

  test('Acc\u00e9der \u00e0 la page de training', async ({ page }) => {
    // V\u00e9rifier que le titre de la page contient "Poker" ou "Entra\u00eenement"
    const title = await page.title();
    expect(title.toLowerCase()).toContain('poker');

    // V\u00e9rifier qu'il y a du contenu sur la page
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).not.toBe('');
    expect(bodyText?.length).toBeGreaterThan(100);

    // V\u00e9rifier que le s\u00e9lecteur de mode est visible
    const modeSelector = page.locator('.MuiToggleButtonGroup-root');
    await expect(modeSelector).toBeVisible();
  });

  test('S\u00e9lectionner une range pour le questionnaire', async ({ page }) => {
    // 1. V\u00e9rifier qu'il y a des ranges disponibles
    const rangeChips = page.locator('.MuiChip-root');
    await rangeChips.first().waitFor({ state: 'visible', timeout: 5000 });

    const chipCount = await rangeChips.count();
    expect(chipCount).toBeGreaterThan(0);

    // 2. S\u00e9lectionner la premi\u00e8re range
    await rangeChips.first().click();

    // 3. V\u00e9rifier que la range est s\u00e9lectionn\u00e9e (style change)
    const firstChip = rangeChips.first();
    const chipClasses = await firstChip.getAttribute('class');
    expect(chipClasses).toContain('MuiChip-colorPrimary');

    console.log(`Range s\u00e9lectionn\u00e9e avec succ\u00e8s`);
  });

  test('Lancer un questionnaire dans chaque mode', async ({ page }) => {
    for (const mode of QUESTIONNAIRE_MODES) {
      // 1. S\u00e9lectionner une range
      const rangeChips = page.locator('.MuiChip-root');
      await rangeChips.first().waitFor({ state: 'visible', timeout: 5000 });
      await rangeChips.first().click();

      // 2. S\u00e9lectionner le mode
      const modeButton = page.locator(`button:has-text("${mode.label}")`);
      await modeButton.waitFor({ state: 'visible', timeout: 5000 });
      await modeButton.click();

      // 3. D\u00e9marrer le questionnaire
      const startButton = page.locator('[data-testid="start-training-button"]');
      await startButton.click();

      // 4. Attendre qu'une question apparaisse (diff\u00e9rents types de questions)
      const questionIndicator = page.locator('[data-testid="question-indicator"]');
      const guessRangePaper = page.locator('[data-testid="guess-range-paper"]');
      const gridQuestionPaper = page.locator('[data-testid="grid-question-paper"]');

      try {
        await questionIndicator.waitFor({ state: 'visible', timeout: 10000 });
      } catch {
        // Try other question types
        try {
          await guessRangePaper.waitFor({ state: 'visible', timeout: 10000 });
        } catch {
          await gridQuestionPaper.waitFor({ state: 'visible', timeout: 10000 });
        }
      }

      // 4. Verifier qu'on est toujours sur la page /training
      const url = page.url();
      expect(url).toContain('/training');

      console.log(`Questionnaire en mode ${mode.value} (${mode.label}) demarre avec succes`);
    }
  });

  test('Repondre a une question et passer a la suivante', async ({ page }) => {
    // 1. Selectionner une range
    const rangeChips = page.locator('.MuiChip-root');
    await rangeChips.first().waitFor({ state: 'visible', timeout: 5000 });
    await rangeChips.first().click();

    // 2. Selectionner le mode "Completer une range" (questions une par une).
    const completeModeButton = page.locator('button:has-text("Compl\u00e9ter une range")');
    await completeModeButton.waitFor({ state: 'visible', timeout: 5000 });
    await completeModeButton.click();

    // 3. Demarrer le questionnaire
    const startButton = page.locator('[data-testid="start-training-button"]');
    await startButton.click();

    // 4. Attendre la premiere question (format: "Question 1 sur 10")
    const questionIndicator = page.locator('[data-testid="question-indicator"]');
    await questionIndicator.waitFor({ state: 'visible', timeout: 90000 });

    // 5. Trouver et cliquer sur une reponse
    // Try different test IDs for different question types
    const answerButtons = page.locator('[data-testid="answer-button"]');
    const guessButtons = page.locator('[data-testid="guess-option-button"]');
    const validateButton = page.locator('[data-testid="validate-grid-button"]');

    const answerCount = await answerButtons.count();
    const guessCount = await guessButtons.count();
    const validateCount = await validateButton.count();

    if (answerCount > 0) {
      // Cliquer sur la premiere reponse disponible (TrainingQuestion - action buttons)
      await answerButtons.first().waitFor({ state: 'visible', timeout: 10000 });
      await answerButtons.first().click();

      // 6. Attendre la question suivante ou les resultats
      await page.waitForTimeout(2000);

      // Verifier soit la question suivante, soit les resultats
      const nextQuestion = page.locator('[data-testid="question-indicator"]');
      const resultsDialog = page.locator('[data-testid="results-dialog"]');

      const nextQuestionCount = await nextQuestion.count();
      const resultsCount = await resultsDialog.count();

      expect(nextQuestionCount > 0 || resultsCount > 0).toBeTruthy();

      console.log(`Reponse soumise, question suivante ou resultats affiches`);
    } else if (guessCount > 0) {
      // Cliquer sur la premiere option de range (TrainingGuessRangeQuestion)
      await guessButtons.first().waitFor({ state: 'visible', timeout: 10000 });
      await guessButtons.first().click();

      // Then click the next button
      const nextButton = page.locator('[data-testid="next-question-button"]');
      await nextButton.waitFor({ state: 'visible', timeout: 10000 });
      await nextButton.click();

      console.log(`Range guess submitted, next question clicked`);
    } else if (validateCount > 0) {
      // Cliquer sur le bouton de validation (TrainingGridQuestion)
      await validateButton.waitFor({ state: 'visible', timeout: 10000 });
      await validateButton.click();

      console.log(`Grid validated`);
    } else {
      // Afficher tous les boutons pour debogage
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
    // 1. S\u00e9lectionner une range
    const rangeChips = page.locator('.MuiChip-root');
    await rangeChips.first().waitFor({ state: 'visible', timeout: 5000 });
    await rangeChips.first().click();

    // 2. S\u00e9lectionner le mode "Compl\u00e9ter une range" (questions une par une).
    const completeModeButton = page.locator('button:has-text("Compl\u00e9ter une range")');
    await completeModeButton.waitFor({ state: 'visible', timeout: 5000 });
    await completeModeButton.click();

    // 3. D\u00e9marrer le questionnaire
    const startButton = page.locator('[data-testid="start-training-button"]');
    await startButton.click();

    // 4. Attendre la premi\u00e8re question (format: "Question 1 sur 10")
    const questionIndicator = page.locator('[data-testid="question-indicator"]');
    await questionIndicator.waitFor({ state: 'visible', timeout: 90000 });

    // 5. Terminer la session (bouton Terminer)
    const endButton = page.locator('[data-testid="end-session-button"]');
    await endButton.waitFor({ state: 'visible', timeout: 5000 });
    await endButton.click();

    // 6. V\u00e9rifier que le dialogue des r\u00e9sultats s'affiche
    const resultsDialog = page.locator('[data-testid="results-dialog"]');
    await resultsDialog.waitFor({ state: 'visible', timeout: 5000 });

    // 7. V\u00e9rifier qu'un score est affich\u00e9
    const scoreElement = page.locator('[data-testid="final-score"]');
    await scoreElement.waitFor({ state: 'visible', timeout: 5000 });

    const scoreText = await scoreElement.textContent();
    expect(scoreText).toMatch(/\d+%/);

    console.log(`Session terminee avec score: ${scoreText}`);
  });
});
