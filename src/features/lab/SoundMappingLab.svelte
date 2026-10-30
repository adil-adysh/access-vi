<script lang="ts">
  import { onMount } from 'svelte';
  import { LabManager } from '../../domain/lab/LabManager.js';
  import type { LabTestCase, LabTestCategory } from '../../domain/lab/types.js';
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

  // Form inputs
  let selectedOption = $state<string>('');
  let selectedPerceivedMeaning = $state<string>('');
  let qualitativeFeedback = $state<string>('');

  let submissionMessage = $state<string>('');
  let submissionSuccess = $state<boolean | null>(null);

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

    // Check if test was already answered
    if (currentTest) {
      const existing = labManager.getRecordForTestCase(currentTest.id);
      if (existing) {
        selectedOption = existing.participantResponse;
        selectedPerceivedMeaning = existing.perceivedMeaning || '';
        qualitativeFeedback = existing.qualitativeFeedback || '';
        submissionSuccess = existing.isCorrect;
        submissionMessage =
          existing.isCorrect === null
            ? 'Response recorded.'
            : existing.isCorrect
              ? 'Correct answer recorded.'
              : `Answer recorded. Expected: "${existing.expectedAnswer}".`;
      } else {
        selectedOption = '';
        selectedPerceivedMeaning = '';
        qualitativeFeedback = '';
        submissionMessage = '';
        submissionSuccess = null;
      }
    }
  }

  onMount(() => {
    const unsub = labManager.subscribe(syncState);
    syncState();
    return () => unsub();
  });

  function handleCategoryChange(cat: LabTestCategory | 'all') {
    audioEngine.cancelPlayback();
    labManager.setSelectedCategory(cat);
    announce(`Switched to category: ${cat.replace(/_/g, ' ')}`);
  }

  function handlePlaySound() {
    labManager.playActiveSound();
    announce(`Playing sound for ${currentTest?.title}. Replay count: ${labManager.getReplayCount()}`);
  }

  function handlePlayShapeLegend(shape: NodeShape) {
    audioEngine.cancelPlayback();
    audioEngine.playNodeShape(shape);
    announce(`Playing candidate sound for ${shape}`);
  }

  function handlePlayDirectionLegend(dir: 'outgoing' | 'incoming') {
    audioEngine.cancelPlayback();
    audioEngine.playRelationshipDirection(dir);
    announce(`Playing ${dir} relationship sound`);
  }

  function handleStopAudio() {
    audioEngine.cancelPlayback();
    announce('Audio playback stopped');
  }

  function handleSubmit() {
    if (!selectedOption) {
      submissionMessage = 'Please select an answer option before submitting.';
      submissionSuccess = false;
      announce(submissionMessage, 'assertive');
      return;
    }

    const record = labManager.submitResponse(
      selectedOption,
      selectedPerceivedMeaning || undefined,
      qualitativeFeedback || undefined
    );

    submissionSuccess = record.isCorrect;
    if (record.isCorrect === true) {
      submissionMessage = 'Response recorded: Correct!';
    } else if (record.isCorrect === false) {
      submissionMessage = `Response recorded. Expected: "${record.expectedAnswer}".`;
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
    <div class="research-isolation-notice" role="note">
      <strong>Research Isolation:</strong> Laboratory trials are exploratory and session-scoped. Results are never
      mixed into formal A/B/C research experimental datasets.
    </div>
  </div>

  <!-- Candidate Sound Reference Legend -->
  <section class="card legend-card" aria-label="Candidate Sound Correspondence Legend">
    <h3>Visual-Auditory Correspondence Legend</h3>
    <p class="legend-note">
      All three shapes use the identical reference pitch (300 Hz) and duration (0.20s). Gains are psychoacoustically
      calibrated to match perceived loudness.
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
          aria-label="Play Circle (Sine tone)"
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
          aria-label="Play Rectangle (Triangle tone)"
        >
          Play Rectangle
        </button>
      </div>

      <div class="legend-item">
        <div class="legend-badge diamond-badge">Diamond</div>
        <div class="legend-detail">
          <strong>Softened Square Wave (300 Hz)</strong>
          <span class="subtext">Attenuated gain (0.14) & gentle envelope</span>
        </div>
        <button
          class="secondary small"
          onclick={() => handlePlayShapeLegend('diamond')}
          aria-label="Play Diamond (Softened square tone)"
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
          aria-label="Play Outgoing (Forward step)"
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
          aria-label="Play Incoming (Inward step)"
        >
          Play Incoming
        </button>
      </div>
    </div>
  </section>

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
      class={currentCategory === 'identity_vs_category' ? 'cat-btn active' : 'cat-btn'}
      onclick={() => handleCategoryChange('identity_vs_category')}
      aria-current={currentCategory === 'identity_vs_category' ? 'true' : undefined}
    >
      B. Identity vs Category
    </button>
    <button
      class={currentCategory === 'relationship_direction' ? 'cat-btn active' : 'cat-btn'}
      onclick={() => handleCategoryChange('relationship_direction')}
      aria-current={currentCategory === 'relationship_direction' ? 'true' : undefined}
    >
      C. Relationship & Direction
    </button>
    <button
      class={currentCategory === 'shape_independence' ? 'cat-btn active' : 'cat-btn'}
      onclick={() => handleCategoryChange('shape_independence')}
      aria-current={currentCategory === 'shape_independence' ? 'true' : undefined}
    >
      D. Shape Independence
    </button>
    <button
      class={currentCategory === 'geometry_invariance' ? 'cat-btn active' : 'cat-btn'}
      onclick={() => handleCategoryChange('geometry_invariance')}
      aria-current={currentCategory === 'geometry_invariance' ? 'true' : undefined}
    >
      E. Geometry Invariance
    </button>
    <button
      class={currentCategory === 'perceived_meaning' ? 'cat-btn active' : 'cat-btn'}
      onclick={() => handleCategoryChange('perceived_meaning')}
      aria-current={currentCategory === 'perceived_meaning' ? 'true' : undefined}
    >
      F. Perceived Meaning
    </button>
  </nav>

  <!-- Active Test Workspace -->
  {#if currentTest}
    <div class="active-test-container">
      <div class="test-header">
        <span class="test-progress">Test {currentTestIndex + 1} of {totalTests}</span>
        <h3 id="test-title">{currentTest.title}</h3>
      </div>

      <p class="test-instructions">{currentTest.instructions}</p>

      <!-- Visual Renderer Stimulus -->
      {#if currentTest.visualStimulus}
        <VisualShapeRenderer
          nodes={currentTest.visualStimulus.nodes}
          edges={currentTest.visualStimulus.edges}
          decorativeNote={currentTest.visualStimulus.decorativeNote}
        />
      {/if}

      <!-- Auditory Playback Controls -->
      <div class="audio-control-bar" role="toolbar" aria-label="Auditory Test Controls">
        <button
          class="primary play-btn"
          onclick={handlePlaySound}
          aria-label={`Play Test Sound for ${currentTest.title}`}
        >
          ▶ Play Test Sound
        </button>

        {#if currentTest.soundStimulus.type === 'compare_shapes'}
          <button
            class="secondary"
            onclick={() => {
              if (currentTest?.soundStimulus.shape1) {
                labManager.playSpecificShape(currentTest.soundStimulus.shape1);
              }
            }}
          >
            Play Sound 1 ({currentTest.soundStimulus.shape1})
          </button>
          <button
            class="secondary"
            onclick={() => {
              if (currentTest?.soundStimulus.shape2) {
                labManager.playSpecificShape(currentTest.soundStimulus.shape2);
              }
            }}
          >
            Play Sound 2 ({currentTest.soundStimulus.shape2})
          </button>
        {/if}

        <button
          class="secondary danger-btn"
          onclick={handleStopAudio}
          aria-label="Stop Audio playback"
        >
          ⏹ Stop Audio
        </button>

        <span class="replay-badge" role="status" aria-label={`Current replay count: ${replayCount}`}>
          Replays: {replayCount}
        </span>
      </div>

      <!-- Question and Answer Form -->
      <form class="response-form card" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <fieldset class="options-fieldset">
          <legend class="prompt-legend">{currentTest.prompt}</legend>

          <div class="options-group" role="radiogroup" aria-labelledby="test-title">
            {#each currentTest.options as option}
              <label class="option-label" class:selected={selectedOption === option}>
                <input
                  type="radio"
                  name="test-option"
                  value={option}
                  bind:group={selectedOption}
                  aria-label={option}
                />
                <span class="option-text">{option}</span>
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
                <td>{r.category.replace(/_/g, ' ')}</td>
                <td>{r.participantResponse}</td>
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
    flex-wrap: wrap;
  }

  h2 {
    font-size: 24px;
    font-weight: 700;
    margin: 0;
  }

  .version-badge {
    background: rgba(56, 189, 248, 0.15);
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    font-size: 13px;
    padding: 3px 8px;
    border-radius: 4px;
  }

  .lead-text {
    color: var(--color-text-muted);
    font-size: 15px;
    margin: 8px 0;
  }

  .research-isolation-notice {
    background: #172554;
    border-left: 4px solid #3b82f6;
    padding: 8px 12px;
    color: #bfdbfe;
    font-size: 13px;
    border-radius: 0 4px 4px 0;
  }

  .card {
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 24px;
  }

  .legend-card h3 {
    margin-top: 0;
    font-size: 18px;
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
    background: #0b1120;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .legend-badge {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 2px 6px;
    border-radius: 3px;
    width: fit-content;
  }

  .circle-badge {
    background: rgba(56, 189, 248, 0.2);
    color: #38bdf8;
    border: 1px solid #38bdf8;
  }

  .rectangle-badge {
    background: rgba(251, 191, 36, 0.2);
    color: #fbbf24;
    border: 1px solid #fbbf24;
  }

  .diamond-badge {
    background: rgba(167, 139, 250, 0.2);
    color: #a78bfa;
    border: 1px solid #a78bfa;
  }

  .direction-badge {
    background: rgba(52, 211, 153, 0.2);
    color: #34d399;
    border: 1px solid #34d399;
  }

  .legend-detail {
    display: flex;
    flex-direction: column;
    font-size: 13px;
  }

  .subtext {
    font-size: 11px;
    color: var(--color-text-muted);
  }

  .category-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 20px;
  }

  .cat-btn {
    background: transparent;
    border: 1px solid var(--color-border);
    color: var(--color-text-muted);
    padding: 6px 12px;
    font-size: 13px;
    border-radius: 4px;
    cursor: pointer;
  }

  .cat-btn:hover {
    color: var(--color-text);
    background: var(--color-surface-hover);
  }

  .cat-btn.active {
    color: var(--color-primary);
    background: rgba(56, 189, 248, 0.12);
    border-color: var(--color-primary);
    font-weight: 600;
  }

  .active-test-container {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 24px;
    margin-bottom: 24px;
  }

  .test-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 8px;
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 12px;
    margin-bottom: 16px;
  }

  .test-progress {
    font-size: 13px;
    color: var(--color-primary);
    font-weight: 600;
  }

  h3 {
    margin: 0;
    font-size: 20px;
  }

  .test-instructions {
    font-size: 15px;
    color: var(--color-text);
    line-height: 1.5;
    margin-bottom: 16px;
  }

  .audio-control-bar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    background: #0b1120;
    border: 1px solid var(--color-border);
    padding: 12px 16px;
    border-radius: 6px;
    margin: 16px 0;
  }

  .play-btn {
    font-weight: 600;
    padding: 8px 16px;
  }

  .replay-badge {
    margin-left: auto;
    font-size: 13px;
    color: var(--color-text-muted);
  }

  .response-form {
    background: #0f172a;
    border-radius: 6px;
    padding: 20px;
    margin: 16px 0;
  }

  .options-fieldset {
    border: none;
    padding: 0;
    margin: 0 0 16px 0;
  }

  .prompt-legend {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: 12px;
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
    padding: 10px 14px;
    background: #1e293b;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.15s ease;
  }

  .option-label:hover {
    border-color: var(--color-primary);
    background: #243248;
  }

  .option-label.selected {
    border-color: var(--color-primary);
    background: rgba(56, 189, 248, 0.12);
    font-weight: 600;
  }

  .option-label input[type='radio'] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  .perceived-meaning-section {
    border-top: 1px solid var(--color-border);
    padding-top: 16px;
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .section-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-muted);
  }

  .form-select,
  .form-textarea {
    background: #1e293b;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    color: var(--color-text);
    padding: 8px 12px;
    font-size: 14px;
  }

  .form-textarea {
    resize: vertical;
  }

  .form-actions {
    margin-top: 16px;
  }

  .submit-btn {
    padding: 8px 18px;
    font-weight: 600;
  }

  .submission-feedback {
    margin-top: 14px;
    padding: 10px 14px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
  }

  .submission-feedback.success {
    background: #064e3b;
    color: #6ee7b7;
    border: 1px solid #10b981;
  }

  .submission-feedback.error {
    background: #7f1d1d;
    color: #fca5a5;
    border: 1px solid #ef4444;
  }

  .submission-feedback.neutral {
    background: #1e293b;
    color: #e2e8f0;
    border: 1px solid #475569;
  }

  .test-pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--color-border);
  }

  .pagination-info {
    font-size: 13px;
    color: var(--color-text-muted);
  }

  .results-card {
    margin-top: 32px;
  }

  .results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 16px;
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
    background: #0b1120;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .metric-value {
    font-size: 20px;
    font-weight: 700;
    color: var(--color-primary);
  }

  .metric-label {
    font-size: 12px;
    color: var(--color-text-muted);
    text-align: center;
    margin-top: 4px;
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
    padding: 8px 12px;
    border-bottom: 1px solid var(--color-border);
    text-align: left;
  }

  .records-table th {
    background: #0b1120;
    color: var(--color-text-muted);
    font-weight: 600;
  }

  .badge.success {
    background: #065f46;
    color: #6ee7b7;
    padding: 2px 6px;
    border-radius: 3px;
  }

  .badge.error {
    background: #991b1b;
    color: #fca5a5;
    padding: 2px 6px;
    border-radius: 3px;
  }

  .badge.neutral {
    background: #334155;
    color: #cbd5e1;
    padding: 2px 6px;
    border-radius: 3px;
  }

  .empty-records-text {
    color: var(--color-text-muted);
    font-size: 14px;
    text-align: center;
    padding: 20px;
  }

  .small {
    padding: 4px 10px;
    font-size: 12px;
  }

  .danger-btn {
    border-color: #f87171;
    color: #f87171;
  }

  .danger-btn:hover {
    background: rgba(248, 113, 113, 0.15);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
