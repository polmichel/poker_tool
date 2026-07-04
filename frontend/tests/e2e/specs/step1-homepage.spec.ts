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
    // NOTE: À adapter selon le titre réel de ton application
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
    
    // NOTE: Ces sélecteurs doivent être adaptés à ton implémentation
    // Exemples de sélecteurs possibles :
    // - 'nav' (balise nav)
    // - '.MuiDrawer-root' (si tu utilises Material-UI)
    // - 'text="Mes Ranges"' (texte dans le menu)
    // - '[aria-label="menu"]' (bouton menu)
    
    // Pour l'instant, on vérifie juste qu'il y a des liens
    const links = page.locator('a');
    const linkCount = await links.count();
    expect(linkCount).toBeGreaterThan(0);
  });
});
