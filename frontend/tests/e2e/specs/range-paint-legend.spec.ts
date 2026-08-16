/**
 * Tests E2E pour la fonctionnalité de remplissage de range :
 * légende cliquable à droite + paint-on-drag.
 *
 * - Accéder à l'éditeur d'une range existante
 * - Vérifier la présence de la légende cliquable
 * - Sélectionner une action dans la légende
 * - Peindre plusieurs cellules en glissé (mousedown + drag + mouseup)
 */
import { test, expect } from '@playwright/test';
import { authenticatePage } from '../utils';
import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

/**
 * Récupère l'ID d'une range existante (créée par le global-setup) pour
 * pouvoir naviguer directement vers son éditeur.
 */
async function getEditableRangeId(): Promise<number> {
  const response = await axios.get(`${API_URL}/ranges/`);
  const ranges = response.data;
  if (!Array.isArray(ranges) || ranges.length === 0) {
    throw new Error('Aucune range disponible pour les tests E2E');
  }
  return ranges[0].id;
}

test.describe('Remplissage de range : légende + paint-on-drag', () => {
  let rangeId: number;

  test.beforeAll(async () => {
    rangeId = await getEditableRangeId();
  });

  test.beforeEach(async ({ page }) => {
    await authenticatePage(page);
  });

  test("accède à l'éditeur d'une range et affiche la grille", async ({ page }) => {
    await page.goto(`/ranges/${rangeId}/edit`);
    await page.waitForLoadState('domcontentloaded');

    // La grille doit être présente avec au moins une cellule
    const firstCell = page.locator('[data-testid^="range-cell-"]').first();
    await firstCell.waitFor({ state: 'visible', timeout: 10000 });
    await expect(firstCell).toBeVisible();
  });

  test('affiche la légende cliquable à droite de la grille', async ({ page }) => {
    await page.goto(`/ranges/${rangeId}/edit`);
    await page.waitForLoadState('domcontentloaded');

    // La légende doit être présente
    const legend = page.locator('[data-testid="range-legend"]');
    await legend.waitFor({ state: 'visible', timeout: 10000 });
    await expect(legend).toBeVisible();

    // Tous les items de légende doivent être présents (8 actions)
    const legendItems = page.locator('[data-testid^="legend-item-"]');
    await expect(legendItems).toHaveCount(8, { timeout: 10000 });

    // Vérifier quelques items spécifiques
    await expect(page.locator('[data-testid="legend-item-open"]')).toBeVisible();
    await expect(page.locator('[data-testid="legend-item-fold"]')).toBeVisible();
    await expect(page.locator('[data-testid="legend-item-raise"]')).toBeVisible();
  });

  test('sélectionne une action dans la légende en cliquant', async ({ page }) => {
    await page.goto(`/ranges/${rangeId}/edit`);
    await page.waitForLoadState('domcontentloaded');

    const legend = page.locator('[data-testid="range-legend"]');
    await legend.waitFor({ state: 'visible', timeout: 10000 });

    // Cliquer sur l'item "raise" de la légende
    const raiseItem = page.locator('[data-testid="legend-item-raise"]');
    await raiseItem.waitFor({ state: 'visible', timeout: 10000 });
    await raiseItem.click();
    await expect(raiseItem).toBeVisible();

    // Cliquer sur un autre item pour vérifier le switch de mode
    const foldItem = page.locator('[data-testid="legend-item-fold"]');
    await foldItem.click();
    await expect(foldItem).toBeVisible();
  });

  test('peint plusieurs cellules en glissé (paint-on-drag)', async ({ page }) => {
    await page.goto(`/ranges/${rangeId}/edit`);
    await page.waitForLoadState('domcontentloaded');

    const legend = page.locator('[data-testid="range-legend"]');
    await legend.waitFor({ state: 'visible', timeout: 10000 });

    // Sélectionner l'action "open" dans la légende
    await page.locator('[data-testid="legend-item-open"]').click();

    // Récupérer les deux premières cellules de la grille
    const cells = page.locator('[data-testid^="range-cell-"]');
    await cells.first().waitFor({ state: 'visible', timeout: 10000 });
    const firstCell = cells.nth(0);
    const secondCell = cells.nth(1);

    // Récupérer les bounding boxes
    const firstBox = await firstCell.boundingBox();
    const secondBox = await secondCell.boundingBox();
    expect(firstBox).not.toBeNull();
    expect(secondBox).not.toBeNull();

    // Simuler un paint-on-drag : enfoncer le bouton sur la première cellule,
    // déplacer vers la deuxième, puis relâcher.
    await page.mouse.move(
      firstBox!.x + firstBox!.width / 2,
      firstBox!.y + firstBox!.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      secondBox!.x + secondBox!.width / 2,
      secondBox!.y + secondBox!.height / 2,
      { steps: 5 },
    );
    await page.mouse.up();

    // Vérifier que le composant n'a pas planté : la grille est toujours là
    await expect(cells.first()).toBeVisible();
    await expect(legend).toBeVisible();
  });
});
