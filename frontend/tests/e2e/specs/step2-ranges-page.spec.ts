/**
 * ÉTAPE 2: Test pour accéder à la page des ranges
 * 
 * Objectif: Vérifier que la page /ranges se charge correctement
 * et que l'on peut voir la liste des ranges.
 * 
 * À exécuter localement avec:
 *   npm run start (dans un terminal)
 *   npx playwright test --headed tests/e2e/specs/step2-ranges-page.spec.ts (dans un autre terminal)
 */

import { test, expect } from '@playwright/test';

test.describe('Étape 2: Accès à la page des ranges', () => {
  
  test('Accéder à la page /ranges', async ({ page }) => {
    // 1. Accéder directement à la page /ranges
    await page.goto('http://localhost:3000/ranges');
    
    // 2. Attendre que la page soit complètement chargée
    await page.waitForLoadState('networkidle');
    
    // 3. Vérifier que l'URL est correcte
    await expect(page).toHaveURL('http://localhost:3000/ranges');
    
    // 4. Vérifier que le titre de la page contient "Ranges" ou "Mes Ranges"
    const title = await page.title();
    expect(title.toLowerCase()).toContain('range');
    
    // 5. Vérifier qu'il y a du contenu sur la page
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).not.toBe('');
    expect(bodyText?.length).toBeGreaterThan(100);
  });
  
  test('Voir la liste des ranges ou un message vide', async ({ page }) => {
    await page.goto('http://localhost:3000/ranges');
    await page.waitForLoadState('networkidle');
    
    // Avec Material-UI, la liste pourrait être dans :
    // - Un composant List (.MuiList-root)
    // - Une grille (.MuiGrid-root)
    // - Des cartes (.MuiCard-root)
    // - Un message "Aucune range" ou "No ranges"
    
    // Vérifier qu'il y a au moins un de ces éléments
    const list = page.locator('.MuiList-root');
    const grid = page.locator('.MuiGrid-root');
    const cards = page.locator('.MuiCard-root');
    const noRangesText = page.locator('text=/Aucune range|No ranges|Pas de range/');
    
    const listCount = await list.count();
    const gridCount = await grid.count();
    const cardsCount = await cards.count();
    const noRangesCount = await noRangesText.count();
    
    // Si on trouve au moins un de ces éléments, c'est bon
    expect(listCount > 0 || gridCount > 0 || cardsCount > 0 || noRangesCount > 0).toBeTruthy();
    
    // Afficher des infos pour le débogage
    console.log(`List: ${listCount}, Grid: ${gridCount}, Cards: ${cardsCount}, NoRanges: ${noRangesCount}`);
  });
  
  test('Voir le bouton "Nouvelle Range"', async ({ page }) => {
    await page.goto('http://localhost:3000/ranges');
    await page.waitForLoadState('networkidle');
    
    // Le bouton pourrait être :
    // - Un Button Material-UI avec le texte "Nouvelle Range"
    // - Un bouton avec une icône +
    // - Un Floating Action Button
    
    const newRangeButton = page.locator('button:has-text("Nouvelle Range")');
    const addButton = page.locator('button:has-text("Ajouter")');
    const plusButton = page.locator('button[aria-label*="ajouter" i]');
    const fabButton = page.locator('.MuiFab-root');
    
    const newRangeCount = await newRangeButton.count();
    const addCount = await addButton.count();
    const plusCount = await plusButton.count();
    const fabCount = await fabButton.count();
    
    // Si on trouve au moins un de ces boutons, c'est bon
    expect(newRangeCount > 0 || addCount > 0 || plusCount > 0 || fabCount > 0).toBeTruthy();
    
    // Afficher des infos pour le débogage
    console.log(`NewRange: ${newRangeCount}, Add: ${addCount}, Plus: ${plusCount}, FAB: ${fabCount}`);
  });
});
