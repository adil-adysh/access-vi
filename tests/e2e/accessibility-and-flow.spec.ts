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

  test('retains complete accessible textual structure and cycle metrics in free exploration mode', async ({ page }) => {
    await page.goto('/');

    // Free exploration mode must expose the complete textual structure table
    await expect(page.locator('.textual-structure')).toBeVisible();
    await expect(page.locator('.graph-table')).toBeVisible();
    await expect(page.locator('.graph-table tbody tr')).toHaveCount(5); // 5 nodes in sandbox

    // Free exploration mode must expose global metrics including cycle status
    await expect(page.locator('.metrics-badge-row .badge', { hasText: /Cycles|Acyclic/i })).toBeVisible();

    // Verify sample graphs in Import modal do NOT leak research study graphs
    await page.getByRole('button', { name: /Import/i }).click();
    await expect(page.locator('#import-title')).toBeVisible();

    const sampleButtons = page.locator('.sample-btn');
    const buttonTexts = await sampleButtons.allTextContents();
    expect(buttonTexts.length).toBeGreaterThanOrEqual(3);
    for (const text of buttonTexts) {
      expect(text.toLowerCase()).not.toContain('study graph');
      expect(text.toLowerCase()).not.toContain('transfer');
      expect(text).toContain('Playground');
    }
    await page.keyboard.press('Escape');
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

  test('prevents experimental answer leakage during active trials using actual DOM selectors', async ({ page }) => {
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

    // 2. Full textual adjacency structure table must NOT exist in the DOM during trials
    await expect(page.locator('.textual-structure')).toHaveCount(0);
    await expect(page.locator('.graph-table')).toHaveCount(0);

    // 3. Global cycle count / DAG badges must NOT exist in the DOM during trials
    await expect(page.locator('.metrics-badge-row .badge', { hasText: /Cycles|Acyclic/i })).toHaveCount(0);

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

  test('handles trial interruption when switching tabs and allows resuming', async ({ page }) => {
    await page.goto('/');

    // Go to experiment and start trial
    await page.getByRole('button', { name: 'Research Experiment' }).click();
    await page.getByRole('button', { name: /I Understand & Acknowledge Consent/i }).click();
    await page.getByRole('button', { name: /Confirm Audio & Proceed to Training/i }).click();
    await page.getByRole('button', { name: /I Am Ready to Begin Experimental Trials/i }).click();
    await page.getByRole('button', { name: /Start Graph Exploration/i }).click();

    // Now switch away to Settings tab
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByRole('heading', { name: 'Audio & Sonification Settings' })).toBeVisible();
    await expect(page.locator('.trial-locked-banner')).toBeVisible();

    // Switch back to Experiment tab
    await page.getByRole('button', { name: 'Research Experiment' }).click();

    // Must be in trial_interrupted view
    await expect(page.locator('.interruption-card')).toBeVisible();
    await expect(page.getByRole('button', { name: /Restart Trial/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Resume Trial/i })).toBeVisible();

    // Click Resume Trial to resume exploration
    await page.getByRole('button', { name: /Resume Trial/i }).click();
    await expect(page.locator('.explorer-panel')).toBeVisible();
  });

  test('walks through research experiment workflow across all three conditions to completion', async ({ page }) => {
    await page.goto('/');

    // Switch to Research Experiment tab
    await page.getByRole('button', { name: 'Research Experiment' }).click();
    await page.getByRole('button', { name: /I Understand & Acknowledge Consent/i }).click();
    await page.getByRole('button', { name: /Confirm Audio & Proceed to Training/i }).click();
    await page.getByRole('button', { name: /I Am Ready to Begin Experimental Trials/i }).click();

    // Loop through 3 condition blocks (5 trials per block = 15 trials total)
    for (let block = 0; block < 3; block++) {
      for (let trial = 0; trial < 5; trial++) {
        await page.getByRole('button', { name: /Start Graph Exploration/i }).click();
        await page.getByRole('button', { name: /Finish Exploration & Enter Response/i }).click();

        // For boolean tasks, select True
        const boolRadio = page.locator('input[name="boolChoice"]').first();
        if (await boolRadio.isVisible()) {
          await boolRadio.check();
        }

        await page.getByRole('button', { name: /Submit Answer/i }).click();
      }

      // Workload assessment (Modified Raw NASA-TLX)
      await expect(page.getByRole('heading', { name: /Condition Workload Assessment/i })).toBeVisible();
      await expect(page.locator('.scale-group')).toHaveCount(6);

      // Sliders default to 5
      const mentalSlider = page.locator('#mental');
      await expect(mentalSlider).toHaveValue('5');

      await page.getByRole('button', { name: /Submit Workload Rating/i }).click();

      if (block < 2) {
        // Rest period between blocks
        await expect(page.locator('h2')).toContainText('Rest Period');
        await page.getByRole('button', { name: /Continue to Next Condition Block/i }).click();
      }
    }

    // After all 3 blocks complete -> Session Completed view!
    await expect(page.getByRole('heading', { name: /Research Session Completed/i })).toBeVisible();

    // Navigate to Results view
    await page.getByRole('button', { name: /View Results & Export Data/i }).click();
    await expect(page.getByRole('heading', { name: 'Research Results & Metrics' })).toBeVisible();
    await expect(page.locator('.results-table').first().locator('tbody tr')).toHaveCount(15);
    await expect(page.locator('.results-table').nth(1).locator('tbody tr')).toHaveCount(3);
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

  test('navigates to Sound Mapping Laboratory and passes axe accessibility scan', async ({ page }) => {
    await page.goto('/');

    // Navigate to Sound Lab tab
    await page.getByRole('button', { name: 'Sound Lab' }).click();
    await expect(page.getByRole('heading', { name: 'Sound Mapping Laboratory' })).toBeVisible();
    await expect(page.getByRole('status', { name: /visual-auditory-parity-v1/i })).toBeVisible();

    // Verify legend cards
    await expect(page.locator('.legend-card')).toBeVisible();
    await expect(page.getByRole('button', { name: /Play Circle/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Play Rectangle/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Play Diamond/i })).toBeVisible();

    // Verify visual diagram renderer SVG is present and accessible
    await expect(page.locator('.visual-renderer-card svg')).toBeVisible();

    // Run axe audit on Sound Mapping Laboratory
    const accessibilityScanResults = await new AxeBuilder({ page })
      .exclude('vite-error-overlay')
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);

    // Select an option in the active test case and submit
    await page.locator('.option-label').first().click();
    await page.getByRole('button', { name: /Submit Answer/i }).click();

    // Verify submission feedback and records table
    await expect(page.locator('.submission-feedback')).toBeVisible();
    await expect(page.locator('.records-table tbody tr')).toHaveCount(1);
  });
});
