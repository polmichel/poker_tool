/**
 * Tests E2E pour le questionnaire (Scénarios 2a, 2b, 2c)
 * 
 * Scénario 2 : Lancer un questionnaire dans les 3 modes
 * - Sélectionner une range existante (avec des mains)
 * - Lancer un questionnaire dans chaque mode
 * - Vérifier que le questionnaire se lance correctement
 * - Vérifier que les résultats sont enregistrés
 * 
 * NOTE: Le questionnaire ne démarre que si la range a au moins une main.
 * On doit donc s'assurer qu'une range avec des mains existe.
 */

import { test, expect } from '@playwright/test';

// Les modes de questionnaire avec leurs labels en français
const QUESTIONNAIRE_MODES = [
  { value: 'fill', label: 'Remplir une range' },
  { value: 'guess', label: 'Deviner une range' },
  { value: 'complete', label: 'Compléter une range' },
] as const;

// Fonction utilitaire pour créer une range avec des mains via l'API
// On va utiliser l'API directement pour créer une range avec des mains
async function ensureRangeWithHandsExists(page: any) {
  // Vérifier si une range avec des mains existe déjà
  await page.goto('http://localhost:3000/ranges');
  await page.waitForLoadState('networkidle');
  
  const rangeChips = page.locator('.MuiChip-root');
  const chipCount = await rangeChips.count();
  
  // Si des ranges existent, on suppose qu'au moins une a des mains
  if (chipCount > 0) {
    return;
  }
  
  // Sinon, créer une range via l'API
  // On va utiliser fetch pour créer une range directement
  const rangeData = {
    name: 'Range E2E avec Mains',
    description: 'Créée automatiquement pour les tests E2E',
    range_type: 'preflop',
    position: 'BTN',
    hands: {
      'AA': 'raise',
      'KK': 'raise',
      'QQ': 'open',
      'AKs': 'open',
      'JJ': 'call'
    }
  };
  
  try {
    const response = await page.request.post('http://localhost:3000/api/ranges', {
      data: rangeData
    });
    
    if (!response.ok()) {
      console.log('Failed to create range via API, will try via UI');
      // Si l'API échoue, essayer via l'UI
      await createRangeViaUI(page);
    }
  } catch (error) {
    console.log('API request failed, will try via UI:', error);
    // Si l'API échoue, essayer via l'UI
    await createRangeViaUI(page);
  }
}

// Fonction utilitaire pour créer une range avec des mains via l'UI
async function createRangeViaUI(page: any) {
  console.log('Creating range via UI...');
  
  // Aller sur la page des ranges
  await page.goto('http://localhost:3000/ranges');
  await page.waitForLoadState('networkidle');
  
  // Cliquer sur "Nouvelle Range"
  const newRangeButton = page.locator('button:has-text("Nouvelle Range")');
  await newRangeButton.waitFor({ state: 'visible', timeout: 5000 });
  await newRangeButton.click();
  
  // Attendre que le dialogue s'ouvre
  const dialog = page.locator('.MuiDialog-root');
  await dialog.waitFor({ state: 'visible', timeout: 5000 });
  
  // Remplir le nom
  const nameInput = page.locator('.MuiTextField-root:has-text("Nom") input').first();
  await nameInput.waitFor({ state: 'visible', timeout: 5000 });
  await nameInput.fill('Range E2E avec Mains');
  
  // Ajouter des mains en cliquant sur la grille
  // La grille contient des cellules avec des mains comme "AA", "KK", etc.
  // On va cliquer sur quelques cellules pour ajouter des actions
  
  // Attendre que la grille soit visible
  const gridCells = page.locator('.MuiPaper-root .MuiButtonBase-root');
  await gridCells.first().waitFor({ state: 'visible', timeout: 5000 });
  
  // Cliquer sur les premières cellules pour ajouter des actions
  // Chaque clic change l'action de la main
  const cellCount = await gridCells.count();
  if (cellCount > 0) {
    // Cliquer sur la première cellule (AA)
    await gridCells.nth(0).click();
    await page.waitForTimeout(100);
    
    // Cliquer sur la deuxième cellule (AKs)
    if (cellCount > 1) {
      await gridCells.nth(1).click();
      await page.waitForTimeout(100);
    }
    
    // Cliquer sur la troisième cellule (KK)
    if (cellCount > 2) {
      await gridCells.nth(2).click();
      await page.waitForTimeout(100);
    }
  }
  
  // Sauvegarder
  const saveButton = page.locator('button[type="submit"]');
  await saveButton.waitFor({ state: 'visible', timeout: 5000 });
  await saveButton.click();
  
  // Attendre que le dialogue se ferme ou la redirection
  await dialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  
  console.log('Range created via UI');
}

test.describe('Questionnaire sur une range', () => {
  
  test.beforeEach(async ({ page }) => {
    // Setup : s'assurer qu'une range avec des mains existe
    await ensureRangeWithHandsExists(page);
    
    // Accéder à la page de training
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
      
      // Afficher l'URL avant le clic pour débogage
      console.log(`Before click, URL: ${page.url()}`);
      
      await startButton.click();
      
      // Afficher l'URL après le clic pour débogage
      await page.waitForTimeout(1000);
      console.log(`After click, URL: ${page.url()}`);
      
      // Vérifier s'il y a une alerte
      const alert = page.locator('.MuiAlert-root');
      const alertCount = await alert.count();
      if (alertCount > 0) {
        const alertText = await alert.textContent();
        console.log(`Alert found: ${alertText}`);
      }
      
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
