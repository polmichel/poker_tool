/**
 * E2E tests for the "Remplir une range" (fill) grid-painting mode.
 *
 * Verifies that selecting the "fill" training mode shows an editable 13x13
 * grid the user can paint and then validate, rather than a per-hand question.
 * After validation the feedback panel shows the share of correct cells, and the
 * session ends with a results dialog.
 */
import { test, expect } from '@playwright/test';
import { authenticatePage } from '../utils';
import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

async function ensureTestRange(): Promise<void> {
  try {
    const rangesRes = await axios.get(`${API_URL}/ranges/`);
    const existing = rangesRes.data.find((r: { name: string }) => r.name === 'Test Range E2E');
    if (existing) return;
  } catch {}

  await axios.post(`${API_URL}/ranges/`, {
    name: 'Test Range E2E',
    description: 'Range de test pour E2E',
    range_type: 'preflop',
    position: 'BTN',
    hands: {
      AA: 'raise',
      KK: 'raise',
      QQ: 'raise',
      AKs: 'raise',
      JJ: 'call',
      TT: 'call',
      AQs: 'raise',
      KQs: 'call',
    },
    user_id: 1,
  });
}

async function startFillSession(page: import('@playwright/test').Page) {
  await ensureTestRange();
  await authenticatePage(page);
  await page.goto('http://localhost:3000/training');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  // Select the "Remplir une range" mode (fill).
  const fillButton = page.locator('button[role="tab"], .MuiToggleButton-root', {
    hasText: 'Remplir une range',
  });
  await fillButton.first().click();
  await page.waitForTimeout(300);

  // Select the test range.
  const rangeChip = page.locator('.MuiChip-root', { hasText: 'Test Range E2E' });
  await rangeChip.first().click();
  await page.waitForTimeout(300);

  // Start training.
  await page.click('[data-testid="start-training-button"]');
  await page.waitForTimeout(1500);
}

test.describe('Training "Remplir une range" (fill) grid mode', () => {
  test('shows an editable grid instead of a per-hand question', async ({ page }) => {
    await startFillSession(page);

    // The grid question paper must be visible (not the per-hand question paper).
    const gridPaper = page.locator('[data-testid="grid-question-paper"]');
    await expect(gridPaper).toBeVisible({ timeout: 10000 });
    // A validate button must be present while unanswered.
    await expect(page.locator('[data-testid="validate-grid-button"]')).toBeVisible();

    // The grid cells (13x13 = 169) must be present.
    const cell = page.locator('[data-testid="range-cell-AA"]');
    await expect(cell.first()).toBeVisible();

    // The classic per-hand question paper must NOT be present.
    await expect(page.locator('[data-testid="question-paper"]')).toHaveCount(0);
  });

  test('painting cells and validating shows the feedback panel', async ({ page }) => {
    await startFillSession(page);

    const gridPaper = page.locator('[data-testid="grid-question-paper"]');
    await expect(gridPaper).toBeVisible({ timeout: 10000 });

    // Select the "Ouvrir" (open) action from the legend.
    const openLegend = page.locator('[data-testid="legend-item-open"]');
    await openLegend.first().click();

    // Paint the AA cell.
    const aaCell = page.locator('[data-testid="range-cell-AA"]').first();
    await aaCell.dispatchEvent('mousedown', { button: 0 });
    await aaCell.dispatchEvent('mouseup');

    // Validate the painted range.
    await page.click('[data-testid="validate-grid-button"]');
    await page.waitForTimeout(1500);

    // The feedback panel must appear, showing the share of correct cells.
    const feedback = page.locator('[data-testid="feedback-panel"]');
    await expect(feedback).toBeVisible({ timeout: 5000 });
    expect(await feedback.textContent()).toMatch(/cellules correspondent/i);
    expect(await feedback.textContent()).toMatch(/%/);

    // Regression invariant: validating must NOT drop the user back to the
    // main menu. The "Démarrer l'entraînement" start button and the session's
    // grid-question-paper must stay mounted while the feedback is shown.
    await expect(page.locator('[data-testid="start-training-button"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="grid-question-paper"]')).toBeVisible();

    // The grid must be locked: no more validate button.
    await expect(page.locator('[data-testid="validate-grid-button"]')).toHaveCount(0);

    // The solution grid is shown alongside the user's attempt after validation.
    await expect(page.locator('[data-testid="solution-grid"]')).toBeVisible();

    // The "next" button advertises the results (session complete).
    await expect(page.locator('[data-testid="next-question-button"]')).toHaveText(/résultats/i);

    // Finish the session -> results dialog.
    await page.click('[data-testid="next-question-button"]');
    await page.waitForTimeout(1000);
    await expect(page.locator('[data-testid="results-dialog"]')).toBeVisible({ timeout: 5000 });
  });
});
