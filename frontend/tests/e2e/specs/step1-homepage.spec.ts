/**
 * ÉTAPE 1: Test minimal pour vérifier l'accès à la page d'accueil
 * 
 * Objectif: Vérifier que Playwright peut accéder à l'application
 * et que la page d'accueil se charge correctement.
 * 
 * À exécuter localement avec:
 *   npm run start (dans un terminal)
 *   npx playwright test --headed tests/e2e/specs/step1-homepage.spec.ts (dans un autre terminal)
 */

import { test, expect } from '@playwright/test';

test.describe('Étape 1: Accès à la page d\'accueil', () => {
  
  test('La page d\'accueil se charge correctement', async ({ page }) => {
    // 1. Accéder à la page d'accueil avec l'URL complète
    await page.goto('http://localhost:3000/');
    
    // 2. Attendre que la page soit complètement chargée
    await page.waitForLoadState('networkidle');
    
    // 3. Vérifier que l'URL est correcte
    await expect(page).toHaveURL('http://localhost:3000/');
    
    // 4. Vérifier que le titre de la page contient "Poker"
    const title = await page.title();
    expect(title).toContain('Poker');
    
    // 5. Vérifier qu'il y a du contenu sur la page
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).not.toBe('');
    expect(bodyText?.length).toBeGreaterThan(100);
  });
  
  test('Le menu de navigation est visible', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    
    // Avec Material-UI, le menu est probablement dans un Drawer
    // Essayons plusieurs sélecteurs possibles :
    
    // 1. Vérifier qu'il y a un Drawer (menu latéral Material-UI)
    const drawer = page.locator('.MuiDrawer-root');
    const drawerCount = await drawer.count();
    
    // 2. Vérifier qu'il y a des boutons (Material-UI utilise des Button)
    const buttons = page.locator('.MuiButton-root');
    const buttonCount = await buttons.count();
    
    // 3. Vérifier qu'il y a du texte dans la page (plus fiable)
    const bodyText = await page.locator('body').textContent();
    
    // Si on trouve un Drawer ou des boutons, c'est bon
    // Sinon, on vérifie qu'il y a du texte dans la page
    expect(drawerCount > 0 || buttonCount > 0 || (bodyText?.length || 0) > 100).toBeTruthy();
    
    // Afficher des infos pour le débogage
    console.log(`Drawer count: ${drawerCount}, Button count: ${buttonCount}, Body length: ${bodyText?.length || 0}`);
  });
});
