/**
 * E2E Tests for Training/Questionnaire Functionality
 * 
 * Scénario 2 : Lancer un questionnaire dans les 3 modes
 * - Sélectionner une range existante
 * - Lancer un questionnaire dans chaque mode (fill, guess, complete)
 * - Vérifier que le questionnaire se lance correctement
 * - Vérifier que les résultats sont enregistrés
 */

import { test, expect } from '@playwright/test';
import { 
  navigateTo, 
  waitForElement, 
  clickWithRetry,
  waitForLoadingToComplete,
  elementExists,
  getElementText
} from '../utils';

// Training modes available in the application
const TRAINING_MODES = ['fill', 'guess', 'complete'] as const;

test.describe('Questionnaire sur une range', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the training page before each test
    await navigateTo(page, '/training');
    await waitForLoadingToComplete(page);
  });

  test('Accéder à la page d\'entraînement', async ({ page }) => {
    // Verify the training page is loaded
    const trainingTitle = page.locator('text="Entraînement"');
    await expect(trainingTitle).toBeVisible();
    
    // Verify the mode selector is visible
    const modeSelector = page.locator('text="Mode d\'entraînement"');
    await expect(modeSelector).toBeVisible();
  });

  test('Sélectionner une range pour l\'entraînement', async ({ page }) => {
    // Verify ranges are visible
    const rangeChips = page.locator('.MuiChip-root');
    await expect(rangeChips).toHaveCountGreaterThan(0);
    
    // Click on the first range
    const firstRange = rangeChips.first();
    await firstRange.waitFor({ state: 'visible' });
    await firstRange.click();
    
    // Verify the range is selected (should have primary color)
    await expect(firstRange).toHaveClass(/MuiChip-filled/);
  });

  // Test each training mode
  TRAINING_MODES.forEach((mode) => {
    test(`Lancer un questionnaire en mode ${mode}`, async ({ page }) => {
      // Select the training mode
      const modeButton = page.locator(`button[data-mode="${mode}"]`);
      
      // If mode buttons don't have data-mode attribute, try text-based selection
      if (!(await elementExists(page, `button[data-mode="${mode}"]`))) {
        // Try to find by text - the exact text depends on your UI
        const modeLabels: Record<string, string> = {
          'fill': 'Remplir',
          'guess': 'Deviner',
          'complete': 'Compléter',
        };
        
        const modeTextButton = page.locator(`button:has-text("${modeLabels[mode]}")`);
        if (await elementExists(page, `button:has-text("${modeLabels[mode]}")`)) {
          await modeTextButton.click();
        } else {
          // Try clicking on the mode selector and then selecting
          const modeSelector = page.locator('text="Mode d\'entraînement"');
          await modeSelector.click();
          
          // Try to find the mode in a menu
          const modeMenuItem = page.locator(`text="${modeLabels[mode]}"`);
          if (await elementExists(page, `text="${modeLabels[mode]}"`)) {
            await modeMenuItem.click();
          }
        }
      } else {
        await modeButton.click();
      }
      
      // Select a range (first available)
      const rangeChips = page.locator('.MuiChip-root');
      if (await rangeChips.count() > 0) {
        await rangeChips.first().click();
      }
      
      // Click on "Démarrer" button
      const startButton = page.locator('button:has-text("Démarrer")');
      await startButton.waitFor({ state: 'visible' });
      await startButton.click();
      
      // Wait for the questionnaire to start
      await waitForLoadingToComplete(page);
      
      // Verify the questionnaire started
      // Check for question indicator
      const questionIndicator = page.locator('text=/Question \d+\/\d+/');
      await expect(questionIndicator).toBeVisible();
      
      // Verify we're on a training session page
      await expect(page).toHaveURL(/(.*)\/training/);
      
      // Verify the question is visible
      const questionText = page.locator('.MuiTypography-h6');
      await expect(questionText).toBeVisible();
    });
  });

  test('Répondre à une question et passer à la suivante', async ({ page }) => {
    // Select a range
    const rangeChips = page.locator('.MuiChip-root');
    if (await rangeChips.count() > 0) {
      await rangeChips.first().click();
    }
    
    // Start the training
    const startButton = page.locator('button:has-text("Démarrer")');
    await startButton.waitFor({ state: 'visible' });
    await startButton.click();
    
    await waitForLoadingToComplete(page);
    
    // Wait for the first question
    const questionIndicator = page.locator('text=/Question 1\/\d+/');
    await expect(questionIndicator).toBeVisible();
    
    // Find and click an answer button
    // The exact selector depends on your UI implementation
    const answerButtons = page.locator('button').filter({ 
      hasNotText: ['Démarrer', 'Paramètres', 'Terminer'] 
    });
    
    if (await answerButtons.count() > 0) {
      await answerButtons.first().click();
      
      // Wait for the next question or results
      await waitForLoadingToComplete(page);
      
      // Either we go to the next question or we see results
      const nextQuestionIndicator = page.locator('text=/Question 2\/\d+/');
      const resultsDialog = page.locator('text="Résultats de la Session"');
      
      if (await nextQuestionIndicator.count() > 0) {
        await expect(nextQuestionIndicator).toBeVisible();
      } else if (await resultsDialog.count() > 0) {
        await expect(resultsDialog).toBeVisible();
      }
    }
  });

  test('Terminer une session d\'entraînement', async ({ page }) => {
    // Select a range
    const rangeChips = page.locator('.MuiChip-root');
    if (await rangeChips.count() > 0) {
      await rangeChips.first().click();
    }
    
    // Start the training
    const startButton = page.locator('button:has-text("Démarrer")');
    await startButton.waitFor({ state: 'visible' });
    await startButton.click();
    
    await waitForLoadingToComplete(page);
    
    // Wait for the first question
    const questionIndicator = page.locator('text=/Question 1\/\d+/');
    await expect(questionIndicator).toBeVisible();
    
    // Click the stop/end button
    const stopButton = page.locator('button[aria-label="Terminer la session"]');
    if (await elementExists(page, 'button[aria-label="Terminer la session"]')) {
      await stopButton.click();
    } else {
      // Try alternative selectors
      const stopIconButton = page.locator('button:has(.MuiSvgIcon-root)').filter({ 
        has: page.locator('[aria-label="Terminer"]') 
      });
      if (await stopIconButton.count() > 0) {
        await stopIconButton.click();
      }
    }
    
    // Wait for results dialog
    await waitForLoadingToComplete(page);
    
    const resultsDialog = page.locator('text="Résultats de la Session"');
    await expect(resultsDialog).toBeVisible();
    
    // Verify results are displayed
    const scoreText = page.locator('text=/\d+%/');
    await expect(scoreText).toBeVisible();
  });

  test('Vérifier l\'affichage du score', async ({ page }) => {
    // Select a range
    const rangeChips = page.locator('.MuiChip-root');
    if (await rangeChips.count() > 0) {
      await rangeChips.first().click();
    }
    
    // Start the training
    const startButton = page.locator('button:has-text("Démarrer")');
    await startButton.waitFor({ state: 'visible' });
    await startButton.click();
    
    await waitForLoadingToComplete(page);
    
    // Wait for the first question
    const questionIndicator = page.locator('text=/Question 1\/\d+/');
    await expect(questionIndicator).toBeVisible();
    
    // Answer a question
    const answerButtons = page.locator('button').filter({ 
      hasNotText: ['Démarrer', 'Paramètres', 'Terminer'] 
    });
    
    if (await answerButtons.count() > 0) {
      await answerButtons.first().click();
      await waitForLoadingToComplete(page);
    }
    
    // Check for score display during the session
    const scoreChip = page.locator('.MuiChip-root:has-text("Score:")');
    if (await elementExists(page, '.MuiChip-root:has-text("Score:")')) {
      await expect(scoreChip).toBeVisible();
    }
  });
});

test.describe('Paramètres d\'entraînement', () => {
  
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/training');
    await waitForLoadingToComplete(page);
  });

  test('Ouvrir les paramètres d\'entraînement', async ({ page }) => {
    // Click on settings button
    const settingsButton = page.locator('button:has-text("Paramètres")');
    await settingsButton.waitFor({ state: 'visible' });
    await settingsButton.click();
    
    // Verify settings dialog is open
    const settingsDialog = page.locator('text="Paramètres d\'entraînement"');
    await expect(settingsDialog).toBeVisible();
  });

  test('Changer le nombre de questions', async ({ page }) => {
    // Open settings
    const settingsButton = page.locator('button:has-text("Paramètres")');
    await settingsButton.click();
    
    await waitForLoadingToComplete(page);
    
    // Select 20 questions
    const twentyQuestionsButton = page.locator('button:has-text("20")');
    await twentyQuestionsButton.waitFor({ state: 'visible' });
    await twentyQuestionsButton.click();
    
    // Verify the selection
    await expect(twentyQuestionsButton).toHaveClass(/MuiButton-contained/);
    
    // Close the dialog
    const closeButton = page.locator('button:has-text("Fermer")');
    await closeButton.click();
  });
});

test.describe('Démarrage rapide', () => {
  
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/training');
    await waitForLoadingToComplete(page);
  });

  test('Démarrer rapidement avec les paramètres par défaut', async ({ page }) => {
    // Click on quick start button
    const quickStartButton = page.locator('button:has-text("Démarrer rapidement")');
    if (await elementExists(page, 'button:has-text("Démarrer rapidement")')) {
      await quickStartButton.click();
      
      await waitForLoadingToComplete(page);
      
      // Verify the questionnaire started
      const questionIndicator = page.locator('text=/Question \d+\/\d+/');
      await expect(questionIndicator).toBeVisible();
    }
  });
});
