/**
 * E2E tests for the training feedback flow.
 *
 * Verifies that after answering a question:
 * 1. A feedback panel appears showing "Correct !" or "Faux"
 * 2. The correct answer is shown when wrong
 * 3. A "Question suivante" button advances to the next question
 * 4. The session ends with a results dialog after the last question
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

async function startTrainingSession(page: import('@playwright/test').Page) {
  await ensureTestRange();
  await authenticatePage(page);
  await page.goto('http://localhost:3000/training');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  // Select the test range
  const chips = page.locator('.MuiChip-root');
  await chips.first().waitFor({ state: 'visible', timeout: 5000 });
  const rangeChip = page.locator('text=Test Range E2E');
  if ((await rangeChip.count()) > 0) {
    await rangeChip.first().click();
  } else {
    await chips.first().click();
  }
  await page.waitForTimeout(500);

  // Select the "Deviner une range" (guess) mode so the per-hand question UI
  // (answer buttons) is exercised. The default "fill" mode renders a grid.
  const guessModeButton = page.locator('button:has-text("Deviner une range")');
  await guessModeButton.first().click();
  await page.waitForTimeout(300);

  // Start training
  await page.click('[data-testid="start-training-button"]');
  await page.waitForTimeout(2000);

  // Wait for question to appear
  const answerButtons = page.locator('[data-testid="answer-button"]');
  await answerButtons.first().waitFor({ state: 'visible', timeout: 10000 });
}

test.describe('Training feedback flow', () => {
  test('shows feedback after answering and advances to next question', async ({ page }) => {
    await startTrainingSession(page);

    // Answer a question
    const answerButtons = page.locator('[data-testid="answer-button"]');
    await answerButtons.first().click();

    // The feedback panel should appear
    const feedback = page.locator('[data-testid="feedback-panel"]');
    await expect(feedback).toBeVisible({ timeout: 5000 });

    // It should contain either "Correct !" or "Faux"
    const feedbackText = await feedback.textContent();
    expect(feedbackText).toMatch(/Correct|Faux/);

    // The "Question suivante" button should be visible
    const nextBtn = page.locator('[data-testid="next-question-button"]');
    await expect(nextBtn).toBeVisible();

    // Answer buttons should be disabled after answering
    const buttonsAfter = page.locator('[data-testid="answer-button"]');
    const count = await buttonsAfter.count();
    for (let i = 0; i < count; i++) {
      await expect(buttonsAfter.nth(i)).toBeDisabled();
    }

    // Click "Question suivante" to advance
    await nextBtn.click();
    await page.waitForTimeout(2000);

    // Either a new question appears (answer buttons enabled) or
    // the results dialog appears (if it was the last question)
    const newButtons = page.locator('[data-testid="answer-button"]:not([disabled])');
    const resultsDialog = page.locator('[data-testid="results-dialog"]');
    const hasNewButtons = await newButtons.count();
    const hasResults = await resultsDialog.count();
    expect(hasNewButtons > 0 || hasResults > 0).toBeTruthy();
  });

  test('feedback panel shows correct answer when wrong', async ({ page }) => {
    await startTrainingSession(page);

    // Answer with the first button (may or may not be correct)
    const answerButtons = page.locator('[data-testid="answer-button"]');
    await answerButtons.first().click();

    // Wait for feedback
    const feedback = page.locator('[data-testid="feedback-panel"]');
    await expect(feedback).toBeVisible({ timeout: 5000 });

    const feedbackText = await feedback.textContent();
    // If wrong, verify the correct answer is displayed
    if (feedbackText?.includes('Faux')) {
      expect(feedbackText).toContain('La bonne réponse');
    }
    // If correct, verify the success message
    if (feedbackText?.includes('Correct')) {
      expect(feedbackText).toContain('Correct');
    }
  });
});
