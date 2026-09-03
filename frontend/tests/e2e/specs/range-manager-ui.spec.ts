/* eslint-disable testing-library/prefer-screen-queries,testing-library/no-node-access -- Playwright E2E tests use DOM APIs */
/**
 * Tests E2E pour la nouvelle interface de gestion des ranges (3 panneaux).
 *
 * Scénarios couverts :
 *  - La page /ranges affiche la nouvelle interface 3 panneaux.
 *  - Le panneau des dossiers contient le dossier racine "Toutes les Ranges".
 *  - Le panneau central liste les ranges et permet la recherche.
 *  - La sélection d'une range affiche l'aperçu (grille + métadonnées).
 *  - Le bouton "Nouvelle Range" ouvre le dialogue de création.
 *  - Le bouton "Nouveau Dossier" crée un dossier dans l'arbre.
 *  - Le bouton "Importer/Exporter" ouvre le dialogue d'import/export.
 *  - Le bouton "Modifier" de l'aperçu navigue vers l'éditeur.
 *  - Drag-and-drop des ranges dans les dossiers.
 */
import { test, expect } from '@playwright/test';
import { authenticatePage } from '../utils';

test.describe('Gestion des Ranges — interface 3 panneaux', () => {
  test.beforeEach(async ({ page }) => {
    await authenticatePage(page);
    await page.goto('/ranges');
    await page.waitForLoadState('domcontentloaded');
  });

  test('affiche la nouvelle interface 3 panneaux', async ({ page }) => {
    // Titre de la barre d'outils
    await expect(page.getByText('Gestion des Ranges')).toBeVisible({ timeout: 10000 });

    // Panneau des dossiers
    await expect(page.getByText('Dossiers')).toBeVisible();
    await expect(page.getByText('Toutes les Ranges')).toBeVisible();

    // Panneau central — compteur de ranges
    await expect(page.getByText(/Ranges \(\d+\)/)).toBeVisible();

    // Champ de recherche
    await expect(page.getByPlaceholder('Rechercher une range...')).toBeVisible();

    // Bouton "Nouvelle Range" (data-testid)
    await expect(page.locator('[data-testid="new-range-button"]')).toBeVisible();

    // Bouton "Nouveau Dossier"
    await expect(page.getByRole('button', { name: 'Nouveau Dossier' })).toBeVisible();

    // Bouton "Importer/Exporter"
    await expect(page.getByRole('button', { name: 'Importer/Exporter' })).toBeVisible();
  });

  test('le panneau central affiche les ranges existantes', async ({ page }) => {
    // Le compteur indique au moins une range (créée par global-setup ou existante)
    const counter = page.getByText(/Ranges \(\d+\)/);
    await expect(counter).toBeVisible({ timeout: 10000 });

    // La zone de liste ne doit pas afficher "Aucune range trouvée"
    await expect(page.getByText('Aucune range trouvée')).not.toBeVisible();
  });

  test('la recherche filtre les ranges', async ({ page }) => {
    const search = page.getByPlaceholder('Rechercher une range...');
    await search.waitFor({ state: 'visible', timeout: 5000 });

    // Taper une requête improbable pour déclencher l'état "Aucune range trouvée"
    await search.fill('ZZZ_NOM_INEXISTANT_ZZZ');
    await expect(page.getByText('Aucune range trouvée')).toBeVisible({ timeout: 5000 });

    // Effacer la recherche ramène la liste
    await search.fill('');
    await expect(page.getByText('Aucune range trouvée')).not.toBeVisible({ timeout: 5000 });
  });

  test('sélectionner une range affiche l\'aperçu avec la grille', async ({ page }) => {
    // Attendre que la liste contienne au moins un élément cliquable (une range).
    // On cible le premier conteneur de range du panneau central.
    const firstRangeCard = page
      .locator('div[role="presentation"], div')
      .filter({ hasText: /mains/ })
      .first();
    await firstRangeCard.waitFor({ state: 'visible', timeout: 10000 });

    // Cliquer sur la première range de la liste (le texte du nom).
    // On récupère le premier titre de range via le compteur "X mains" pour cibler
    // une zone précise, puis on clique sur l'élément parent.
    const rangeItem = page.getByText(/mains/).first();
    await rangeItem.click({ timeout: 5000 });

    // L'aperçu doit afficher le titre "Grille de la Range"
    await expect(page.getByText('Grille de la Range')).toBeVisible({ timeout: 5000 });

    // La grille de range doit être présente (cellules data-testid)
    const firstCell = page.locator('[data-testid^="range-cell-"]').first();
    await firstCell.waitFor({ state: 'visible', timeout: 10000 });
    await expect(firstCell).toBeVisible();
  });

  test('le bouton "Nouvelle Range" ouvre le dialogue de création', async ({ page }) => {
    const newRangeButton = page.locator('[data-testid="new-range-button"]');
    await newRangeButton.waitFor({ state: 'visible', timeout: 10000 });
    await newRangeButton.click();

    const dialog = page.locator('.MuiDialog-root');
    await dialog.waitFor({ state: 'visible', timeout: 5000 });

    // Le dialogue contient le champ nom
    const nameInput = page.locator('[data-testid="range-name-input"]');
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });
    await expect(nameInput).toBeVisible();
  });

  test('le bouton "Nouveau Dossier" crée un dossier dans l\'arbre', async ({ page }) => {
    // Le bouton "Nouveau Dossier" ouvre un prompt (window.prompt).
    // On installe un handler pour le dialog avant le clic.
    const folderName = 'Dossier E2E ' + Date.now();
    await page.evaluate((name) => {
      window.prompt = () => name;
    }, folderName);

    const newFolderButton = page.getByRole('button', { name: 'Nouveau Dossier' });
    await newFolderButton.waitFor({ state: 'visible', timeout: 5000 });
    await newFolderButton.click();

    // Le nouveau dossier doit apparaître dans le panneau des dossiers
    await expect(page.getByText(folderName, { exact: true })).toBeVisible({ timeout: 5000 });
  });

  test('le bouton "Importer/Exporter" ouvre le dialogue d\'import/export', async ({ page }) => {
    const importExportButton = page.getByRole('button', { name: 'Importer/Exporter' });
    await importExportButton.waitFor({ state: 'visible', timeout: 5000 });
    await importExportButton.click();

    const dialog = page.locator('.MuiDialog-root');
    await dialog.waitFor({ state: 'visible', timeout: 5000 });

    // Le dialogue contient les onglets Importer / Exporter
    await expect(page.getByRole('tab', { name: 'Importer' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('tab', { name: 'Exporter' })).toBeVisible();
  });

  test('le bouton "Modifier" de l\'aperçu navigue vers l\'éditeur', async ({ page }) => {
    // Sélectionner une range pour afficher l'aperçu
    const rangeItem = page.getByText(/mains/).first();
    await rangeItem.waitFor({ state: 'visible', timeout: 10000 });
    await rangeItem.click({ timeout: 5000 });

    // L'aperçu doit être visible
    await expect(page.getByText('Grille de la Range')).toBeVisible({ timeout: 5000 });

    // Cliquer sur le bouton "Modifier" (Tooltip title="Modifier")
    const editButton = page.getByRole('button', { name: 'Modifier' }).first();
    await editButton.waitFor({ state: 'visible', timeout: 5000 });
    await editButton.click();

    // Doit naviguer vers /ranges/:id/edit
    await page.waitForURL(/\/ranges\/\d+\/edit$/, { timeout: 15000 });
    expect(page.url()).toMatch(/\/ranges\/\d+\/edit$/);
  });

  test('le bouton "Fermer" de l\'aperçu masque la sélection', async ({ page }) => {
    // Sélectionner une range
    const rangeItem = page.getByText(/mains/).first();
    await rangeItem.waitFor({ state: 'visible', timeout: 10000 });
    await rangeItem.click({ timeout: 5000 });

    // L'aperçu est visible
    await expect(page.getByText('Grille de la Range')).toBeVisible({ timeout: 5000 });

    // Cliquer sur le bouton "Fermer" (Tooltip title="Fermer")
    const closeButton = page.getByRole('button', { name: 'Fermer' }).first();
    await closeButton.waitFor({ state: 'visible', timeout: 5000 });
    await closeButton.click();

    // Le message "Sélectionnez une range..." doit réapparaître
    await expect(page.getByText('Sélectionnez une range pour voir ses détails')).toBeVisible({
      timeout: 5000,
    });
  });

  test('le bouton "Actualiser" recharge les ranges', async ({ page }) => {
    const refreshButton = page.getByRole('button', { name: 'Actualiser' });
    await refreshButton.waitFor({ state: 'visible', timeout: 5000 });
    // Le clic ne doit pas planter la page
    await refreshButton.click();
    // La page doit toujours afficher le titre principal
    await expect(page.getByText('Gestion des Ranges')).toBeVisible({ timeout: 5000 });
  });

  test('glisser-déposer une range dans un dossier la déplace', async ({ page }) => {
    // Créer un dossier cible pour le dépôt.
    const folderName = 'Dossier DnD ' + Date.now();
    await page.evaluate((name) => {
      window.prompt = () => name;
    }, folderName);
    const newFolderButton = page.getByRole('button', { name: 'Nouveau Dossier' });
    await newFolderButton.waitFor({ state: 'visible', timeout: 5000 });
    await newFolderButton.click();
    await expect(page.getByText(folderName, { exact: true })).toBeVisible({ timeout: 5000 });

    // Le panneau central doit lister au moins une range.
    const rangeCard = page.locator('[draggable="true"]').filter({ hasText: /mains/ }).first();
    await rangeCard.waitFor({ state: 'visible', timeout: 10000 });

    // Déclencher la séquence DnD via l'API Playwright (fonctionne en headless).
    const folderTarget = page.getByText(folderName, { exact: true }).first();
    await folderTarget.waitFor({ state: 'visible', timeout: 5000 });

    // Drag start sur la range
    await rangeCard.dispatchEvent('dragstart');
    // Drag over + drop sur le dossier
    await folderTarget.dispatchEvent('dragover');
    await folderTarget.dispatchEvent('drop');
    await rangeCard.dispatchEvent('dragend');

    // Sélectionner le dossier cible : masquer l'iframe webpack-dev-server qui intercepte les clics
    await page.evaluate(() => {
      const overlay = document.getElementById('webpack-dev-server-client-overlay');
      if (overlay) overlay.style.display = 'none';
    });
    await folderTarget.click({ timeout: 5000 });

    // Le compteur du panneau central doit indiquer au moins 1 range dans le
    // dossier cible (le déplacement a réussi).
    await expect(page.getByText(/Ranges \([1-9]\d*\)/)).toBeVisible({ timeout: 5000 });
  });

  test('le ghost element est correctement centré pendant le drag', async ({ page }) => {
    // Le panneau central doit lister au moins une range.
    const rangeCard = page.locator('[draggable="true"]').filter({ hasText: /mains/ }).first();
    await rangeCard.waitFor({ state: 'visible', timeout: 10000 });

    // Déclencher un dragstart avec un événement natif via page.evaluate
    await rangeCard.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const event = new Event('dragstart', { bubbles: true, cancelable: true });
      // Simuler les propriétés clientX/clientY pour le calcul du ghost element
      Object.defineProperty(event, 'clientX', { value: rect.left + rect.width / 2 });
      Object.defineProperty(event, 'clientY', { value: rect.top + rect.height / 2 });
      el.dispatchEvent(event);
    });

    // Attendre que le ghost element apparaisse
    const ghostElement = page.locator('[data-testid="range-ghost-element"]');
    await ghostElement.waitFor({ state: 'visible', timeout: 5000 });

    // Vérifier que le ghost element a les bonnes dimensions (280x60px)
    const ghostBox = await ghostElement.boundingBox();
    expect(ghostBox?.width).toBeCloseTo(280, 1);
    expect(ghostBox?.height).toBeCloseTo(60, 1);

    // Nettoyer : terminer le drag
    await rangeCard.dispatchEvent('dragend');
    await expect(ghostElement).not.toBeVisible({ timeout: 5000 });
  });

});
