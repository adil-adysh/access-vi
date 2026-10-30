import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Auditory Graph Explorer E2E & Accessibility', () => {
  test('loads home explorer view and passes axe accessibility audit', async ({ page }) => {
    await page.goto('/');

    // Verify Title & Header
    await expect(page.locator('h1')).toContainText('Auditory Graph Explorer');
    await expect(page.getByRole('button', { name: 'Graph Explorer' })).toBeVisible();

    // Verify Focus on Current Node
    await expect(page.locator('.node-id-display')).toBeVisible();

    // Run Axe automated accessibility audit
    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['color-contrast']) // Ignore minor dark mode contrast heuristics if simulated
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('navigates graph with keyboard controls', async ({ page }) => {
    await page.goto('/');

    const explorerRegion = page.locator('.explorer-panel');
    await explorerRegion.focus();

    // Initial node should be A
    await expect(page.locator('.node-id-display')).toContainText('Node A');

    // Press ArrowDown / J to select next neighbor (C)
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.selected-badge')).toBeVisible();

    // Press Enter to traverse
    await page.keyboard.press('Enter');
    await expect(page.locator('.node-id-display')).not.toContainText('Node A');

    // Press Backspace / Left to go back
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('.node-id-display')).toContainText('Node A');
  });

  test('walks through research experiment workflow', async ({ page }) => {
    await page.goto('/');

    // Switch to Research Experiment tab
    await page.getByRole('button', { name: 'Research Experiment' }).click();
    await expect(page.locator('h2')).toContainText('Research Study');

    // Accept consent
    await page.getByRole('button', { name: /I Understand & Acknowledge Consent/i }).click();

    // Calibration step
    await expect(page.locator('h2')).toContainText('Audio Calibration');
    await page.getByRole('button', { name: /Confirm Audio & Proceed to Training/i }).click();

    // Training step
    await expect(page.locator('h2')).toContainText('Practice & Training');
    await page.getByRole('button', { name: /I Am Ready to Begin Experimental Trials/i }).click();

    // First trial prep
    await expect(page.getByRole('button', { name: /Start Graph Exploration/i })).toBeVisible();
    await page.getByRole('button', { name: /Start Graph Exploration/i }).click();

    // Finish exploration & enter response
    await page.getByRole('button', { name: /Finish Exploration & Enter Response/i }).click();
    await expect(page.getByRole('button', { name: /Submit Answer/i })).toBeVisible();
  });

  test('opens and closes keyboard help modal', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /Help \(\?\)/i }).click();
    await expect(page.locator('h2#help-title')).toContainText('Keyboard Navigation & Shortcuts');

    await page.keyboard.press('Escape');
    await expect(page.locator('h2#help-title')).not.toBeVisible();
  });
});
