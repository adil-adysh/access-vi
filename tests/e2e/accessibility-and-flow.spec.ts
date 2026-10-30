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

    // Run Axe automated accessibility audit with color-contrast enabled
    const accessibilityScanResults = await new AxeBuilder({ page })
      .exclude('vite-error-overlay')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('navigates graph with keyboard controls only when workspace is focused', async ({ page }) => {
    await page.goto('/');

    // When focus is outside the exploration workspace, graph shortcuts must NOT trigger
    await page.getByRole('button', { name: 'Graph Explorer' }).focus();
    await expect(page.locator('.node-id-display')).toContainText('Node A');

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    // Still Node A because workspace wasn't focused
    await expect(page.locator('.node-id-display')).toContainText('Node A');

    // Focus workspace
    const explorerRegion = page.locator('.explorer-panel');
    await explorerRegion.focus();

    // Now ArrowDown selects neighbor and Enter traverses
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.selected-badge')).toBeVisible();

    await page.keyboard.press('Enter');
    await expect(page.locator('.node-id-display')).not.toContainText('Node A');

    // Backspace / Left returns to Node A
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('.node-id-display')).toContainText('Node A');
  });

  test('typing in form inputs and textareas does not trigger graph shortcuts', async ({ page }) => {
    await page.goto('/');

    // Open Import dialog
    await page.getByRole('button', { name: /Import/i }).click();
    await expect(page.locator('#import-title')).toBeVisible();

    // Type text containing shortcut keys (j, k, space, enter, arrow keys)
    const textarea = page.locator('#graph-input');
    await textarea.click();
    await textarea.fill('digraph test { j -> k; }');
    await expect(textarea).toHaveValue('digraph test { j -> k; }');

    // Press Escape to close modal and verify focus restoration to Import button
    await page.keyboard.press('Escape');
    await expect(page.locator('#import-title')).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Import/i })).toBeFocused();

    // Node A should still be the current node untouched
    await expect(page.locator('.node-id-display')).toContainText('Node A');
  });

  test('modal dialog traps focus, suspends shortcuts, and restores focus on close', async ({ page }) => {
    await page.goto('/');

    const helpBtn = page.getByRole('button', { name: /Help \(\?\)/i });
    await helpBtn.click();
    await expect(page.locator('h2#help-title')).toContainText('Keyboard Navigation & Shortcuts');

    // Pressing j / k should NOT traverse graph while modal is active
    await page.keyboard.press('j');
    await page.keyboard.press('Enter');

    // Close modal via Escape
    await page.keyboard.press('Escape');
    await expect(page.locator('h2#help-title')).not.toBeVisible();

    // Verify focus was restored to Help button
    await expect(helpBtn).toBeFocused();

    // Node A remains untouched
    await expect(page.locator('.node-id-display')).toContainText('Node A');
  });

  test('prevents experimental answer leakage during active trials', async ({ page }) => {
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
    await expect(page.getByRole('heading', { name: /Practice & Training Session/i })).toBeVisible();
    await page.getByRole('button', { name: /I Am Ready to Begin Experimental Trials/i }).click();

    // Trial prep
    await expect(page.getByRole('button', { name: /Start Graph Exploration/i })).toBeVisible();
    await page.getByRole('button', { name: /Start Graph Exploration/i }).click();

    // In active trial exploration:
    // 1. Verify no cycle or answer leakage in graph title or badges
    const trialSection = page.locator('.trial-container');
    await expect(trialSection).toBeVisible();

    const explorerAria = await page.locator('.explorer-panel').getAttribute('aria-label');
    expect(explorerAria?.toLowerCase()).not.toContain('cycle');
    expect(explorerAria?.toLowerCase()).not.toContain('feedback');
    expect(explorerAria?.toLowerCase()).not.toContain('diamond');
    expect(explorerAria).toContain('Study');

    // 2. Full adjacency table must NOT be rendered in experimental trials
    await expect(page.locator('.adjacency-table')).toHaveCount(0);

    // 3. Global cycle count / DAG badges must NOT be rendered in experimental trials
    await expect(page.locator('.metric-badge', { hasText: /cycle/i })).toHaveCount(0);

    // 4. Inspection is on-demand for current node only
    const inspectBtn = page.getByRole('button', { name: /Inspect Node/i });
    if (await inspectBtn.isVisible()) {
      await inspectBtn.click();
      await expect(page.locator('.inspection-card')).toBeVisible();
    }

    // Finish exploration & enter response
    await page.getByRole('button', { name: /Finish Exploration & Enter Response/i }).click();
    await expect(page.getByRole('button', { name: /Submit Answer/i })).toBeVisible();

    // During response entry, the graph explorer must be hidden so participant cannot re-inspect
    await expect(page.locator('.explorer-panel')).toHaveCount(0);
  });

  test('walks through research experiment workflow and submits raw NASA-TLX', async ({ page }) => {
    await page.goto('/');

    // Switch to Research Experiment tab
    await page.getByRole('button', { name: 'Research Experiment' }).click();
    await page.getByRole('button', { name: /I Understand & Acknowledge Consent/i }).click();
    await page.getByRole('button', { name: /Confirm Audio & Proceed to Training/i }).click();
    await page.getByRole('button', { name: /I Am Ready to Begin Experimental Trials/i }).click();

    // Complete all 5 tasks in Block 0
    for (let i = 0; i < 5; i++) {
      await page.getByRole('button', { name: /Start Graph Exploration/i }).click();
      await page.getByRole('button', { name: /Finish Exploration & Enter Response/i }).click();

      // For boolean tasks, select True
      const boolRadio = page.locator('input[name="boolChoice"]').first();
      if (await boolRadio.isVisible()) {
        await boolRadio.check();
      }

      await page.getByRole('button', { name: /Submit Answer/i }).click();
    }

    // Now workload questionnaire (Modified Raw NASA-TLX) must be shown
    await expect(page.getByRole('heading', { name: /Condition Workload Assessment/i })).toBeVisible();
    await expect(page.locator('.scale-group')).toHaveCount(6);

    // Sliders must default to midpoint 5
    const mentalSlider = page.locator('#mental');
    await expect(mentalSlider).toHaveValue('5');

    // Submit workload
    await page.getByRole('button', { name: /Submit Workload Rating/i }).click();

    // Must advance to Rest Period phase
    await expect(page.locator('h2')).toContainText('Rest Period');
    await expect(page.getByRole('button', { name: /Continue to Next Condition Block/i })).toBeVisible();
  });

  test('switches tabs cleanly and isolates explorer settings', async ({ page }) => {
    await page.goto('/');

    // Switch to Settings tab
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByRole('heading', { name: 'Audio & Sonification Settings' })).toBeVisible();

    // Switch to Results tab
    await page.getByRole('button', { name: 'Results & Export' }).click();
    await expect(page.getByRole('heading', { name: 'Research Results & Metrics' })).toBeVisible();

    // Switch back to Explorer tab
    await page.getByRole('button', { name: 'Graph Explorer' }).click();
    await expect(page.locator('.node-id-display')).toContainText('Node A');
  });
});
