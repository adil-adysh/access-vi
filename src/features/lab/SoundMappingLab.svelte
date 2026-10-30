<script lang="ts">
  import { onMount } from 'svelte';
  import { LabManager } from '../../domain/lab/LabManager.js';
  import type { LabTestCase, LabTestCategory, LabMode } from '../../domain/lab/types.js';
  import type { ParitySonificationEngine } from '../../audio/parity/ParitySonificationEngine.js';
  import type { NodeShape } from '../../domain/presentation/types.js';
  import VisualShapeRenderer from './VisualShapeRenderer.svelte';

  interface Props {
    audioEngine: ParitySonificationEngine;
    onAnnounce?: (msg: string, priority: 'polite' | 'assertive') => void;
  }

  let { audioEngine, onAnnounce }: Props = $props();

  const labManager = new LabManager(undefined, audioEngine);

  let currentCategory = $state<LabTestCategory | 'all'>('all');
  let currentTest = $state<LabTestCase | null>(labManager.getCurrentTestCase());
  let currentTestIndex = $state(labManager.getCurrentTestIndex());
  let totalTests = $state(labManager.getTotalTests());
  let replayCount = $state(0);
  let currentMode = $state<LabMode>(labManager.getMode());

  // Form draft state isolated from replay/audio sync
  let lastLoadedTestId = $state<string | null>(null);
  let selectedOptionId = $state<string>('');
  let selectedPerceivedMeaning = $state<string>('');
  let qualitativeFeedback = $state<string>('');
  let isSubmitted = $state<boolean>(false);
  let submissionMessage = $state<string>('');
  let submissionSuccess = $state<boolean | null>(null);
  let isPlayingAudio = $state<boolean>(false);

  // Summary & records
  let records = $state(labManager.getRecords());
  let summary = $state(labManager.getSessionSummary());

  function syncState() {
    currentCategory = labManager.getSelectedCategory();
    currentTest = labManager.getCurrentTestCase();
    currentTestIndex = labManager.getCurrentTestIndex();
    totalTests = labManager.getTotalTests();
    replayCount = labManager.getReplayCount();
    records = labManager.getRecords();
    summary = labManager.getSessionSummary();
    currentMode = labManager.getMode();

    // Fix 3: ONLY update or reset form draft state when the test case actually changes
    if (currentTest && currentTest.id !== lastLoadedTestId) {
      lastLoadedTestId = currentTest.id;
      const existing = labManager.getRecordForTestCase(currentTest.id);
      if (existing) {
        selectedOptionId = existing.participantResponseId;
        selectedPerceivedMeaning = existing.perceivedMeaning || '';
        qualitativeFeedback = existing.qualitativeFeedback || '';
        submissionSuccess = existing.isCorrect;
        isSubmitted = true;
        submissionMessage =
          existing.isCorrect === null
            ? 'Response recorded.'
            : existing.isCorrect
              ? 'Correct answer recorded.'
              : `Answer recorded. Expected: "${existing.expectedAnswerId}".`;
      } else {
        selectedOptionId = '';
        selectedPerceivedMeaning = '';
        qualitativeFeedback = '';
        submissionMessage = '';
        submissionSuccess = null;
        isSubmitted = false;
      }
    }
  }

  onMount(() => {
    const unsub = labManager.subscribe(syncState);
    syncState();
    return () => unsub();
  });

  function handleModeChange(mode: LabMode) {
    audioEngine.cancelPlayback();
    labManager.setMode(mode);
    currentMode = mode;
    announce(`Switched to ${mode === 'training' ? 'Training Practice' : 'Blinded Assessment'} mode.`);
  }

  function handleCategoryChange(cat: LabTestCategory | 'all') {
    audioEngine.cancelPlayback();
    labManager.setSelectedCategory(cat);
    announce(`Switched to category: ${cat.replace(/_/g, ' ')}`);
  }

  // Fix 4: Do not emit live-region speech when triggering playback to prevent masking test stimulus
  function handlePlaySound() {
    isPlayingAudio = true;
    labManager.playActiveSound();
    setTimeout(() => {
      isPlayingAudio = false;
    }, 400);
  }

  function handlePlaySpecificShape(shape: NodeShape) {
    isPlayingAudio = true;
    labManager.playSpecificShape(shape);
    setTimeout(() => {
      isPlayingAudio = false;
    }, 400);
  }

  function handlePlayShapeLegend(shape: NodeShape) {
    audioEngine.cancelPlayback();
    audioEngine.playNodeShape(shape);
  }

  function handlePlayDirectionLegend(dir: 'outgoing' | 'incoming') {
    audioEngine.cancelPlayback();
    audioEngine.playRelationshipDirection(dir);
  }

  function handleStopAudio() {
    audioEngine.cancelPlayback();
    isPlayingAudio = false;
  }

  function handleSubmit() {
    if (!selectedOptionId) {
      submissionMessage = 'Please select an answer option before submitting.';
      submissionSuccess = false;
      announce(submissionMessage, 'assertive');
      return;
    }

    const record = labManager.submitResponse(
      selectedOptionId,
      selectedPerceivedMeaning || undefined,
      qualitativeFeedback || undefined
    );

    isSubmitted = true;
    submissionSuccess = record.isCorrect;

    if (record.isCorrect === true) {
      submissionMessage = 'Response recorded: Correct!';
    } else if (record.isCorrect === false) {
      const expOpt = currentTest?.options.find((o) => o.id === record.expectedAnswerId);
      submissionMessage = `Response recorded. Expected: "${expOpt ? expOpt.label : record.expectedAnswerId}".`;
    } else {
      submissionMessage = 'Perceptual observation recorded.';
    }

    announce(submissionMessage, 'polite');
  }

  function handleNext() {
    audioEngine.cancelPlayback();
    if (labManager.nextTest()) {
      announce(`Moved to test ${labManager.getCurrentTestIndex() + 1} of ${labManager.getTotalTests()}`);
    }
  }

  function handlePrevious() {
    audioEngine.cancelPlayback();
    if (labManager.previousTest()) {
      announce(`Moved to test ${labManager.getCurrentTestIndex() + 1} of ${labManager.getTotalTests()}`);
    }
  }

  function handleExportJSON() {
    const json = labManager.exportJSON();
    downloadFile(json, 'sound-mapping-lab-results.json', 'application/json');
    announce('Exported laboratory results to JSON');
  }

  function handleExportCSV() {
    const csv = labManager.exportCSV();
    downloadFile(csv, 'sound-mapping-lab-results.csv', 'text/csv');
    announce('Exported laboratory results to CSV');
  }

  function handleClearRecords() {
    if (confirm('Are you sure you want to clear all recorded laboratory responses?')) {
      labManager.clearRecords();
      announce('Laboratory responses cleared');
    }
  }

  function downloadFile(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function announce(msg: string, priority: 'polite' | 'assertive' = 'polite') {
    if (onAnnounce) {
      onAnnounce(msg, priority);
    }
  }
</script>

<div class="lab-workspace" role="region" aria-label="Sound Mapping Laboratory Workspace">
  <div class="lab-header">
    <div class="title-row">
      <h2>Sound Mapping Laboratory</h2>
      <span class="badge version-badge" role="status" aria-label="Mapping Version: visual-auditory-parity-v1">
        visual-auditory-parity-v1
      </span>
    </div>
    <p class="lead-text">
      Interactive exploratory environment for evaluating whether users perceive proposed shape timbres,
      direction intervals, and connection invariance prior to formal study trials.
    </p>

    <!-- Lab Mode Switcher (Training vs Blinded Assessment) -->
    <div class="mode-switcher-container card" role="toolbar" aria-label="Laboratory Operating Mode">
      <span class="mode-label"><strong>Operating Mode:</strong></span>
      <div class="mode-buttons">
        <button
          class={currentMode === 'training' ? 'primary small' : 'secondary small'}
          onclick={() => handleModeChange('training')}
          aria-pressed={currentMode === 'training'}
        >
          📖 Training & Practice Mode
        </button>
        <button
          class={currentMode === 'assessment' ? 'primary small' : 'secondary small'}
          onclick={() => handleModeChange('assessment')}
          aria-pressed={currentMode === 'assessment'}
        >
          🎯 Blinded Assessment Mode
        </button>
      </div>
      <p class="mode-caption">
        {#if currentMode === 'training'}
          Training mode explicitly associates shapes with candidate waveforms and reference guides.
        {:else}
          Blinded assessment mode hides answers and masks visual shapes during listening trials to evaluate genuine perception.
        {/if}
      </p>
    </div>

    <div class="research-isolation-notice" role="note">
      <strong>Research Isolation:</strong> Laboratory trials are exploratory and session-scoped. Results are never
      mixed into formal A/B/C research experimental datasets.
    </div>
  </div>

  <!-- Candidate Sound Reference Legend (Visible in Training mode or collapsible) -->
  {#if currentMode === 'training'}
    <section class="card legend-card" aria-label="Candidate Sound Correspondence Legend">
      <h3>Visual-Auditory Correspondence Reference (Training)</h3>
      <p class="legend-note">
        All candidate shapes share the identical reference pitch (300 Hz) and duration (0.20s). Initial candidate gains
        reflect spectral energy estimation (sine: 0.28, triangle: 0.22, softened square: 0.14) subject to empirical validation.
      </p>

      <div class="legend-grid">
        <div class="legend-item">
          <div class="legend-badge circle-badge">Circle</div>
          <div class="legend-detail">
            <strong>Sine Wave (300 Hz)</strong>
            <span class="subtext">Smooth, pure harmonic content</span>
          </div>
          <button
            class="secondary small"
            onclick={() => handlePlayShapeLegend('circle')}
          >
            Play Circle
          </button>
        </div>

        <div class="legend-item">
          <div class="legend-badge rectangle-badge">Rectangle</div>
          <div class="legend-detail">
            <strong>Triangle Wave (300 Hz)</strong>
            <span class="subtext">Mellow odd-harmonic timbre</span>
          </div>
          <button
            class="secondary small"
            onclick={() => handlePlayShapeLegend('rectangle')}
          >
            Play Rectangle
          </button>
        </div>

        <div class="legend-item">
          <div class="legend-badge diamond-badge">Diamond</div>
          <div class="legend-detail">
            <strong>Softened Square Wave (300 Hz)</strong>
            <span class="subtext">Initial candidate gain (0.14) & gentle attack</span>
          </div>
          <button
            class="secondary small"
            onclick={() => handlePlayShapeLegend('diamond')}
          >
            Play Diamond
          </button>
        </div>

        <div class="legend-item">
          <div class="legend-badge direction-badge">Outgoing</div>
          <div class="legend-detail">
            <strong>Forward Step (360 → 440 Hz)</strong>
            <span class="subtext">Direction cue invariant to node shape</span>
          </div>
          <button
            class="secondary small"
            onclick={() => handlePlayDirectionLegend('outgoing')}
          >
            Play Outgoing
          </button>
        </div>

        <div class="legend-item">
          <div class="legend-badge direction-badge">Incoming</div>
          <div class="legend-detail">
            <strong>Inward Step (440 → 360 Hz)</strong>
            <span class="subtext">Inverted interval for arrival</span>
          </div>
          <button
            class="secondary small"
            onclick={() => handlePlayDirectionLegend('incoming')}
          >
            Play Incoming
          </button>
        </div>
      </div>
    </section>
  {/if}

  <!-- Category Filter Bar -->
  <nav class="category-nav" aria-label="Laboratory Test Categories">
    <button
      class={currentCategory === 'all' ? 'cat-btn active' : 'cat-btn'}
      onclick={() => handleCategoryChange('all')}
      aria-current={currentCategory === 'all' ? 'true' : undefined}
    >
      All Tests ({labManager.getTotalTests()})
    </button>
    <button
      class={currentCategory === 'shape_discrimination' ? 'cat-btn active' : 'cat-btn'}
      onclick={() => handleCategoryChange('shape_discrimination')}
      aria-current={currentCategory === 'shape_discrimination' ? 'true' : undefined}
    >
      A. Shape Discrimination
    </button>
    <button
      class={currentCategory === 'shape_recognition' ? 'cat-btn active' : 'cat-btn'}
      onclick={() => handleCategoryChange('shape_recognition')}
      aria-current={currentCategory === 'shape_recognition' ? 'true' : undefined}
    >
      B. Shape Recognition
    </button>
    <button
      class={currentCategory === 'identity_vs_category' ? 'cat-btn active' : 'cat-btn'}
      onclick={() => handleCategoryChange('identity_vs_category')}
      aria-current={currentCategory === 'identity_vs_category' ? 'true' : undefined}
    >
      C. Identity vs Category
    </button>
    <button
      class={currentCategory === 'perceived_hierarchy' ? 'cat-btn active' : 'cat-btn'}
      onclick={() => handleCategoryChange('perceived_hierarchy')}
      aria-current={currentCategory === 'perceived_hierarchy' ? 'true' : undefined}
    >
      D. Perceived Hierarchy
    </button>
    <button
      class={currentCategory === 'relationship_direction' ? 'cat-btn active' : 'cat-btn'}
      onclick={() => handleCategoryChange('relationship_direction')}
      aria-current={currentCategory === 'relationship_direction' ? 'true' : undefined}
    >
      E. Relationship & Direction
    </button>
    <button
      class={currentCategory === 'shape_independence' ? 'cat-btn active' : 'cat-btn'}
      onclick={() => handleCategoryChange('shape_independence')}
      aria-current={currentCategory === 'shape_independence' ? 'true' : undefined}
    >
      F. Shape Independence
    </button>
    <button
      class={currentCategory === 'geometry_invariance' ? 'cat-btn active' : 'cat-btn'}
      onclick={() => handleCategoryChange('geometry_invariance')}
      aria-current={currentCategory === 'geometry_invariance' ? 'true' : undefined}
    >
      G. Geometry Invariance
    </button>
    <button
      class={currentCategory === 'destination_recognition' ? 'cat-btn active' : 'cat-btn'}
      onclick={() => handleCategoryChange('destination_recognition')}
      aria-current={currentCategory === 'destination_recognition' ? 'true' : undefined}
    >
      H. Destination Recognition
    </button>
    <button
      class={currentCategory === 'perceived_meaning' ? 'cat-btn active' : 'cat-btn'}
      onclick={() => handleCategoryChange('perceived_meaning')}
      aria-current={currentCategory === 'perceived_meaning' ? 'true' : undefined}
    >
      I. Perceived Meaning
    </button>
  </nav>

  <!-- Active Test Workspace -->
  {#if currentTest}
    <div class="active-test-container">
      <div class="test-header">
        <span class="test-progress">Test {currentTestIndex + 1} of {totalTests}</span>
        <h3 id="test-title">
          {#if currentMode === 'assessment'}
            Trial {currentTestIndex + 1}: {currentTest.category.replace(/_/g, ' ')}
          {:else}
            {currentTest.title}
          {/if}
        </h3>
      </div>

      <p class="test-instructions">{currentTest.instructions}</p>

      <!-- Visual Renderer Stimulus (Blinded during assessment until answered) -->
      {#if currentTest.visualStimulus}
        <VisualShapeRenderer
          nodes={currentTest.visualStimulus.nodes}
          edges={currentTest.visualStimulus.edges}
          decorativeNote={currentTest.visualStimulus.decorativeNote}
          blinded={currentMode === 'assessment' && !isSubmitted && Boolean(currentTest.visualStimulus.blindInAssessment)}
        />
      {/if}

      <!-- Auditory Playback Controls (Neutral labels in assessment to eliminate answer leakage) -->
      <div
        class="audio-control-bar"
        role="toolbar"
        aria-label="Auditory Test Controls"
        aria-busy={isPlayingAudio ? 'true' : 'false'}
      >
        <button
          class="primary play-btn"
          onclick={handlePlaySound}
        >
          ▶ Play Test Sound
        </button>

        {#if currentTest.soundStimulus.type === 'compare_shapes'}
          <button
            class="secondary"
            onclick={() => {
              if (currentTest?.soundStimulus.shape1) {
                handlePlaySpecificShape(currentTest.soundStimulus.shape1);
              }
            }}
          >
            {#if currentMode === 'assessment'}
              Play Sound 1
            {:else}
              Play Sound 1 ({currentTest.soundStimulus.shape1})
            {/if}
          </button>
          <button
            class="secondary"
            onclick={() => {
              if (currentTest?.soundStimulus.shape2) {
                handlePlaySpecificShape(currentTest.soundStimulus.shape2);
              }
            }}
          >
            {#if currentMode === 'assessment'}
              Play Sound 2
            {:else}
              Play Sound 2 ({currentTest.soundStimulus.shape2})
            {/if}
          </button>
        {/if}

        <button
          class="secondary danger-btn"
          onclick={handleStopAudio}
        >
          ⏹ Stop Audio
        </button>

        <span class="replay-badge" role="status" aria-label={`Current replay count: ${replayCount}`}>
          Replays: {replayCount}
        </span>
      </div>

      <!-- Question and Answer Form (Bound to stable IDs) -->
      <form class="response-form card" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <fieldset class="options-fieldset">
          <legend class="prompt-legend">{currentTest.prompt}</legend>

          <div class="options-group" role="radiogroup" aria-labelledby="test-title">
            {#each currentTest.options as option}
              <label class="option-label" class:selected={selectedOptionId === option.id}>
                <input
                  type="radio"
                  name="test-option"
                  value={option.id}
                  bind:group={selectedOptionId}
                />
                <span class="option-text">{option.label}</span>
              </label>
            {/each}
          </div>
        </fieldset>

        <!-- Perceived Meaning Investigation -->
        {#if currentTest.supportsPerceivedMeaning}
          <div class="perceived-meaning-section">
            <label for="perceived-meaning-select" class="section-label">
              What did this sound suggest to you? (Investigating unintended hierarchy or bias):
            </label>
            <select
              id="perceived-meaning-select"
              bind:value={selectedPerceivedMeaning}
              class="form-select"
              aria-label="Perceived meaning interpretation"
            >
              <option value="">-- Select interpretation (optional) --</option>
              <option value="Different category / type of object">Different category / type of object</option>
              <option value="Higher importance, priority, or ranking">Higher importance, priority, or ranking</option>
              <option value="Direction, flow, or movement">Direction, flow, or movement</option>
              <option value="Greater quantity, magnitude, or size">Greater quantity, magnitude, or size</option>
              <option value="No particular meaning">No particular meaning</option>
              <option value="Other interpretation">Other interpretation</option>
            </select>

            <label for="qualitative-feedback" class="section-label">
              Qualitative observations (optional):
            </label>
            <textarea
              id="qualitative-feedback"
              bind:value={qualitativeFeedback}
              placeholder="Describe what you heard, any acoustic artifacts, or clarity issues..."
              rows="2"
              class="form-textarea"
              aria-label="Qualitative observations textarea"
            ></textarea>
          </div>
        {/if}

        <div class="form-actions">
          <button type="submit" class="primary submit-btn">
            Submit Answer & Record
          </button>
        </div>

        {#if submissionMessage}
          <div
            class="submission-feedback"
            class:success={submissionSuccess === true}
            class:error={submissionSuccess === false}
            class:neutral={submissionSuccess === null}
            role="status"
            aria-live="polite"
          >
            {submissionMessage}
          </div>
        {/if}
      </form>

      <!-- Progression Controls -->
      <div class="test-pagination" role="navigation" aria-label="Test Progression">
        <button
          class="secondary"
          onclick={handlePrevious}
          disabled={currentTestIndex === 0}
          aria-label="Go to previous test"
        >
          ← Previous Test
        </button>

        <span class="pagination-info">
          Test {currentTestIndex + 1} of {totalTests}
        </span>

        <button
          class="secondary"
          onclick={handleNext}
          disabled={currentTestIndex === totalTests - 1}
          aria-label="Go to next test"
        >
          Next Test →
        </button>
      </div>
    </div>
  {:else}
    <div class="empty-state card">
      <p>No tests found in this category.</p>
    </div>
  {/if}

  <!-- Session Records and Export Section -->
  <section class="card results-card" aria-label="Session Records and Data Export">
    <div class="results-header">
      <h3>Laboratory Session Records</h3>
      <div class="export-btn-group">
        <button class="secondary small" onclick={handleExportJSON}>
          Export JSON
        </button>
        <button class="secondary small" onclick={handleExportCSV}>
          Export CSV
        </button>
        <button class="danger small" onclick={handleClearRecords}>
          Clear Records
        </button>
      </div>
    </div>

    <!-- Summary Metrics -->
    <div class="metrics-grid">
      <div class="metric-box">
        <span class="metric-value">{summary.totalTrials}</span>
        <span class="metric-label">Completed Trials</span>
      </div>
      <div class="metric-box">
        <span class="metric-value">{summary.accuracyPercent.toFixed(1)}%</span>
        <span class="metric-label">Scored Accuracy ({summary.correctTrials}/{summary.scoredTrials})</span>
      </div>
      <div class="metric-box">
        <span class="metric-value">{summary.avgReplayCount.toFixed(1)}</span>
        <span class="metric-label">Avg Replays / Trial</span>
      </div>
      <div class="metric-box">
        <span class="metric-value">{Math.round(summary.avgResponseDurationMs)} ms</span>
        <span class="metric-label">Avg Duration</span>
      </div>
    </div>

    <!-- Records Table -->
    {#if records.length > 0}
      <div class="table-container">
        <table class="records-table">
          <caption class="sr-only">List of recorded laboratory test responses</caption>
          <thead>
            <tr>
              <th scope="col">Test ID</th>
              <th scope="col">Mode</th>
              <th scope="col">Category</th>
              <th scope="col">Response</th>
              <th scope="col">Status</th>
              <th scope="col">Replays</th>
              <th scope="col">Duration</th>
              <th scope="col">Perceived Meaning</th>
            </tr>
          </thead>
          <tbody>
            {#each records as r}
              <tr>
                <td><code>{r.testCaseId}</code></td>
                <td><span class="badge mode-tag">{r.mode}</span></td>
                <td>{r.category.replace(/_/g, ' ')}</td>
                <td>{r.participantResponseLabel}</td>
                <td>
                  {#if r.isCorrect === true}
                    <span class="badge success">Correct</span>
                  {:else if r.isCorrect === false}
                    <span class="badge error">Incorrect</span>
                  {:else}
                    <span class="badge neutral">Subjective</span>
                  {/if}
                </td>
                <td>{r.replayCount}</td>
                <td>{r.responseDurationMs} ms</td>
                <td>{r.perceivedMeaning || '—'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <p class="empty-records-text">No trials completed in this session yet.</p>
    {/if}
  </section>
</div>

<style>
  .lab-workspace {
    padding: 16px 0 40px 0;
  }

  .lab-header {
    margin-bottom: 24px;
  }

  .title-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }

  h2 {
    font-size: 24px;
    font-weight: 700;
    color: var(--color-primary);
    margin: 0;
  }

  .version-badge {
    background: #0f172a;
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    font-size: 12px;
    font-family: monospace;
    padding: 3px 8px;
    border-radius: 4px;
  }

  .lead-text {
    font-size: 15px;
    color: var(--color-text-muted);
    margin-bottom: 16px;
    line-height: 1.5;
  }

  .mode-switcher-container {
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .mode-buttons {
    display: flex;
    gap: 12px;
  }

  .mode-caption {
    font-size: 13px;
    color: #94a3b8;
    margin: 0;
  }

  .mode-tag {
    background: #1e293b;
    border: 1px solid #475569;
    color: #cbd5e1;
    font-size: 11px;
    text-transform: uppercase;
  }

  .research-isolation-notice {
    background: rgba(30, 41, 59, 0.7);
    border-left: 4px solid var(--color-primary);
    padding: 10px 14px;
    font-size: 13px;
    color: #cbd5e1;
    border-radius: 0 4px 4px 0;
  }

  .legend-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 18px;
    margin-bottom: 24px;
  }

  .legend-card h3 {
    margin-top: 0;
    margin-bottom: 6px;
    font-size: 16px;
    color: #f8fafc;
  }

  .legend-note {
    font-size: 13px;
    color: var(--color-text-muted);
    margin-bottom: 16px;
  }

  .legend-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
  }

  .legend-item {
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 6px;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .legend-badge {
    font-size: 12px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 4px;
    display: inline-block;
    align-self: flex-start;
  }

  .circle-badge {
    background: #0c4a6e;
    border: 1px solid #38bdf8;
    color: #f0f9ff;
  }

  .rectangle-badge {
    background: #713f12;
    border: 1px solid #fbbf24;
    color: #fefce8;
  }

  .diamond-badge {
    background: #881337;
    border: 1px solid #f43f5e;
    color: #fff1f2;
  }

  .direction-badge {
    background: #581c87;
    border: 1px solid #a855f7;
    color: #faf5ff;
  }

  .legend-detail strong {
    display: block;
    font-size: 13px;
    color: #f1f5f9;
  }

  .legend-detail .subtext {
    display: block;
    font-size: 11px;
    color: #94a3b8;
  }

  .category-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 24px;
  }

  .cat-btn {
    background: #0f172a;
    border: 1px solid var(--color-border);
    color: var(--color-text-muted);
    padding: 8px 14px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .cat-btn:hover {
    border-color: var(--color-primary);
    color: #f8fafc;
  }

  .cat-btn.active {
    background: var(--color-primary);
    color: #0f172a;
    border-color: var(--color-primary);
  }

  .active-test-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 32px;
  }

  .test-header {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .test-progress {
    font-size: 12px;
    font-weight: 700;
    color: var(--color-primary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  #test-title {
    font-size: 20px;
    font-weight: 700;
    color: #f8fafc;
    margin: 0;
  }

  .test-instructions {
    font-size: 14px;
    color: #cbd5e1;
    margin: 0;
    line-height: 1.5;
  }

  .audio-control-bar {
    background: #0f172a;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 12px 16px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
  }

  .play-btn {
    font-weight: 700;
  }

  .danger-btn {
    background: #2a1b1b;
    color: #f87171;
    border-color: #ef4444;
  }

  .danger-btn:hover {
    background: #ef4444;
    color: #ffffff;
  }

  .replay-badge {
    margin-left: auto;
    background: #1e293b;
    color: #94a3b8;
    border: 1px solid #334155;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
  }

  .response-form {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .options-fieldset {
    border: none;
    padding: 0;
    margin: 0;
  }

  .prompt-legend {
    font-size: 16px;
    font-weight: 700;
    color: #f8fafc;
    margin-bottom: 14px;
    line-height: 1.4;
  }

  .options-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .option-label {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 6px;
    padding: 12px 16px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .option-label:hover {
    border-color: var(--color-primary);
    background: #132039;
  }

  .option-label.selected {
    border-color: var(--color-primary);
    background: rgba(56, 189, 248, 0.12);
  }

  .option-text {
    font-size: 14px;
    color: #f8fafc;
    font-weight: 500;
  }

  .perceived-meaning-section {
    border-top: 1px solid var(--color-border);
    padding-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .section-label {
    font-size: 13px;
    font-weight: 600;
    color: #cbd5e1;
  }

  .form-select,
  .form-textarea {
    background: #0f172a;
    border: 1px solid var(--color-border);
    color: #f8fafc;
    border-radius: 6px;
    padding: 8px 12px;
    font-family: inherit;
    font-size: 13px;
  }

  .form-select:focus,
  .form-textarea:focus {
    border-color: var(--color-primary);
    outline: none;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
  }

  .submit-btn {
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 700;
  }

  .submission-feedback {
    border-radius: 6px;
    padding: 12px 16px;
    font-size: 14px;
    font-weight: 600;
  }

  .submission-feedback.success {
    background: rgba(34, 197, 94, 0.15);
    border: 1px solid #22c55e;
    color: #4ade80;
  }

  .submission-feedback.error {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid #ef4444;
    color: #f87171;
  }

  .submission-feedback.neutral {
    background: rgba(56, 189, 248, 0.15);
    border: 1px solid #38bdf8;
    color: #38bdf8;
  }

  .test-pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
  }

  .pagination-info {
    font-size: 13px;
    color: var(--color-text-muted);
    font-weight: 600;
  }

  .results-card {
    padding: 20px;
    margin-top: 16px;
  }

  .results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .results-header h3 {
    margin: 0;
    font-size: 18px;
    color: #f8fafc;
  }

  .export-btn-group {
    display: flex;
    gap: 8px;
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
    margin-bottom: 20px;
  }

  .metric-box {
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 6px;
    padding: 12px;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .metric-value {
    font-size: 22px;
    font-weight: 700;
    color: var(--color-primary);
  }

  .metric-label {
    font-size: 12px;
    color: var(--color-text-muted);
  }

  .table-container {
    overflow-x: auto;
  }

  .records-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .records-table th,
  .records-table td {
    padding: 10px 12px;
    text-align: left;
    border-bottom: 1px solid var(--color-border);
  }

  .records-table th {
    background: #0f172a;
    color: var(--color-primary);
    font-weight: 600;
  }

  .badge.success {
    background: rgba(34, 197, 94, 0.2);
    border: 1px solid #22c55e;
    color: #4ade80;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .badge.error {
    background: rgba(239, 68, 68, 0.2);
    border: 1px solid #ef4444;
    color: #f87171;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .badge.neutral {
    background: rgba(148, 163, 184, 0.2);
    border: 1px solid #64748b;
    color: #cbd5e1;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .empty-records-text,
  .empty-state p {
    color: var(--color-text-muted);
    font-size: 14px;
    text-align: center;
    margin: 20px 0;
  }
</style>
