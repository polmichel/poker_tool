/**
 * Test E2E de régression pour le bug "Range non trouvée" après création.
 *
 * Scénario : créer une range via l'UI, puis vérifier que l'éditeur affiche la
 * range (et non le message "Range non trouvée") même avec une latence réseau
 * sur le GET /ranges/:id.
 *
 * On intercepte la réponse du GET /ranges/:id pour y ajouter un délai qui
 * simule une latence réseau réaliste (le cas où le bug se manifeste).
 */
import { test, expect } from '@playwright/test';
import { authenticatePage } from '../utils';

test.describe('Bug "Range non trouvée" après création', () => {
  test.beforeEach(async ({ page }) => {
    await authenticatePage(page);
  });

  test("crée une range puis l'éditeur affiche la range (avec latence API)", async ({ page }) => {
    // Intercepter GET /ranges/:id pour ajouter un délai (simule la latence).
    // On ne fait que forwarder la vraie réponse, mais après 800ms.
    await page.route('**/api/ranges/*', async (route) => {
      const request = route.request();
      if (request.method() !== 'GET') {
        await route.continue();
        return;
      }
      // Récupère la vraie réponse du backend
      const response = await route.fetch();
      const body = await response.text();
      await new Promise((resolve) => setTimeout(resolve, 800));
      await route.fulfill({
        status: response.status(),
        contentType: 'application/json',
        body,
      });
    });

    // Aller sur la liste des ranges
    await page.goto('/ranges');
    await page.waitForLoadState('domcontentloaded');

    // Ouvrir le dialogue de création
    const newRangeButton = page.locator('[data-testid="new-range-button"]');
    await newRangeButton.waitFor({ state: 'visible', timeout: 10000 });
    await newRangeButton.click();

    const dialog = page.locator('.MuiDialog-root');
    await dialog.waitFor({ state: 'visible', timeout: 5000 });

    // Remplir le nom
    const nameInput = page.locator('[data-testid="range-name-input"]');
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });
    const rangeName = 'Range Latency Bug ' + Date.now();
    await nameInput.fill(rangeName);

    // Sauvegarder
    const saveButton = page.locator('[data-testid="range-save-button"]');
    await saveButton.waitFor({ state: 'visible', timeout: 5000 });
    await saveButton.click();

    // Attendre la redirection vers l'éditeur
    await dialog.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.waitForURL(/\/ranges\/\d+\/edit$/, { timeout: 15000 });

    // Le nom de la range doit être affiché dans l'éditeur (pas "Range non trouvée")
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByText(rangeName)).toBeVisible({ timeout: 15000 });

    // Vérifier explicitement qu'on n'a pas le message d'erreur
    await expect(page.getByText('Range non trouvée')).not.toBeVisible();

    // La grille doit être présente
    const firstCell = page.locator('[data-testid^="range-cell-"]').first();
    await firstCell.waitFor({ state: 'visible', timeout: 10000 });
    await expect(firstCell).toBeVisible();
  });

  test("crée une range puis l'éditeur affiche la range (sans latence)", async ({ page }) => {
    await page.goto('/ranges');
    await page.waitForLoadState('domcontentloaded');

    const newRangeButton = page.locator('[data-testid="new-range-button"]');
    await newRangeButton.waitFor({ state: 'visible', timeout: 10000 });
    await newRangeButton.click();

    const dialog = page.locator('.MuiDialog-root');
    await dialog.waitFor({ state: 'visible', timeout: 5000 });

    const nameInput = page.locator('[data-testid="range-name-input"]');
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });
    const rangeName = 'Range NoLatency ' + Date.now();
    await nameInput.fill(rangeName);

    const saveButton = page.locator('[data-testid="range-save-button"]');
    await saveButton.waitFor({ state: 'visible', timeout: 5000 });
    await saveButton.click();

    await dialog.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.waitForURL(/\/ranges\/\d+\/edit$/, { timeout: 15000 });

    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByText(rangeName)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Range non trouvée')).not.toBeVisible();

    const firstCell = page.locator('[data-testid^="range-cell-"]').first();
    await firstCell.waitFor({ state: 'visible', timeout: 10000 });
    await expect(firstCell).toBeVisible();
  });
});
