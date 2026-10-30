<script lang="ts">
  import type { ExperimentSession } from '../../research/recording/types.js';
  import type { ExperimentalConditionId } from '../../domain/navigation/types.js';
  import { ExportService } from '../../research/recording/ExportService.js';
  import { EXPERIMENTAL_CONDITIONS } from '../../research/conditions/types.js';

  interface Props {
    session: ExperimentSession;
    onClearData: () => void;
  }

  let { session, onClearData }: Props = $props();

  function downloadJSON() {
    const json = ExportService.exportJSON(session);
    ExportService.downloadFile(
      `auditory_graph_${session.participantId}_${session.sessionId}.json`,
      json,
      'application/json'
    );
  }

  function downloadCSV() {
    const csv = ExportService.exportCSV(session);
    ExportService.downloadFile(
      `auditory_graph_${session.participantId}_${session.sessionId}.csv`,
      csv,
      'text/csv'
    );
  }

  const allTrials = $derived(session.trials);
  const completedTrials = $derived(allTrials.filter((t: { status: string }) => t.status === 'completed'));
  const interruptedTrials = $derived(allTrials.filter((t: { status: string }) => t.status !== 'completed'));

  const totalCorrect = $derived(
    completedTrials.filter((t: { evaluation: { isCorrect: boolean } }) => t.evaluation.isCorrect).length
  );
  const accuracyPct = $derived(
    completedTrials.length > 0
      ? ((totalCorrect / completedTrials.length) * 100).toFixed(1)
      : '0.0'
  );
  const avgDurationSec = $derived(
    completedTrials.length > 0
      ? (
          completedTrials.reduce((sum: number, t: { durationMs: number }) => sum + t.durationMs, 0) /
          completedTrials.length /
          1000
        ).toFixed(1)
      : '0.0'
  );
</script>

<div class="results-container">
  <div class="card summary-header">
    <div class="header-row">
      <div>
        <h2>Research Results & Metrics</h2>
        <p class="subtitle">
          Participant: <strong>{session.participantId}</strong> • Session: <code>{session.sessionId}</code>
        </p>
      </div>
      <div class="export-btn-group">
        <button class="primary" onclick={downloadJSON}>
          ↓ Export JSON
        </button>
        <button class="primary" onclick={downloadCSV}>
          ↓ Export CSV
        </button>
      </div>
    </div>

    <!-- Quick Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-num">{completedTrials.length}</span>
        <span class="stat-label">Valid Completed Trials{#if interruptedTrials.length > 0} ({interruptedTrials.length} excluded){/if}</span>
      </div>
      <div class="stat-card">
        <span class="stat-num">{accuracyPct}%</span>
        <span class="stat-label">Overall Accuracy</span>
      </div>
      <div class="stat-card">
        <span class="stat-num">{avgDurationSec}s</span>
        <span class="stat-label">Avg Trial Time</span>
      </div>
    </div>
  </div>

  <!-- Trial By Trial Breakdown Table -->
  <div class="card">
    <h3>Completed Trial Breakdown</h3>
    {#if allTrials.length === 0}
      <p class="empty-text">No experimental trials recorded yet. Start an experiment session from the Research Experiment tab.</p>
    {:else}
      <div class="table-wrapper">
        <table class="results-table">
          <thead>
            <tr>
              <th scope="col">Status</th>
              <th scope="col">Block / Condition</th>
              <th scope="col">Task Type</th>
              <th scope="col">Outcome</th>
              <th scope="col">Score</th>
              <th scope="col">Duration</th>
              <th scope="col">Actions</th>
              <th scope="col">Replays</th>
              <th scope="col">Inspections</th>
            </tr>
          </thead>
          <tbody>
            {#each allTrials as trial}
              {@const condId = trial.condition as ExperimentalConditionId}
              <tr>
                <td>
                  <span class={`outcome-tag status-${trial.status}`}>
                    {trial.status}
                  </span>
                </td>
                <td>
                  <strong>{EXPERIMENTAL_CONDITIONS[condId]?.shortLabel ?? trial.condition}</strong>
                </td>
                <td>{trial.task.title}</td>
                <td>
                  <span class={trial.evaluation.isCorrect ? 'outcome-tag correct' : 'outcome-tag incorrect'}>
                    {trial.evaluation.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                  </span>
                </td>
                <td>{(trial.evaluation.score * 100).toFixed(0)}%</td>
                <td>{(trial.durationMs / 1000).toFixed(1)}s</td>
                <td>{trial.navigationLog.length}</td>
                <td>{trial.replayCount}</td>
                <td>{trial.inspectionCount}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>

  <!-- Workload Assessment Summary -->
  <div class="card">
    <h3>Self-Reported Workload by Condition (NASA-TLX)</h3>
    <div class="table-wrapper">
      <table class="results-table">
        <thead>
          <tr>
            <th scope="col">Condition</th>
            <th scope="col">Mental</th>
            <th scope="col">Physical</th>
            <th scope="col">Temporal</th>
            <th scope="col">Performance</th>
            <th scope="col">Effort</th>
            <th scope="col">Frustration</th>
          </tr>
        </thead>
        <tbody>
          {#each Object.entries(session.workloadRatings) as [condId, rating]}
            {@const r = rating as { mentalDemand: number; physicalDemand: number; temporalDemand: number; performance: number; effort: number; frustration: number }}
            <tr>
              <td><strong>{EXPERIMENTAL_CONDITIONS[condId as keyof typeof EXPERIMENTAL_CONDITIONS]?.shortLabel ?? condId}</strong></td>
              <td>{r.mentalDemand} / 10</td>
              <td>{r.physicalDemand} / 10</td>
              <td>{r.temporalDemand} / 10</td>
              <td>{r.performance} / 10</td>
              <td>{r.effort} / 10</td>
              <td>{r.frustration} / 10</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>

  <div class="danger-zone">
    <button class="danger" onclick={onClearData}>
      Delete Participant Session Data (IndexedDB)
    </button>
  </div>
</div>

<style>
  .results-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 20px;
  }

  h2 {
    font-size: 20px;
    color: var(--color-primary);
  }

  .subtitle {
    font-size: 14px;
    color: var(--color-text-muted);
    margin-top: 4px;
  }

  .export-btn-group {
    display: flex;
    gap: 8px;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
  }

  .stat-card {
    background: #0f172a;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    padding: 12px;
    text-align: center;
  }

  .stat-num {
    display: block;
    font-size: 24px;
    font-weight: 800;
    color: var(--color-primary);
  }

  .stat-label {
    font-size: 12px;
    color: var(--color-text-muted);
  }

  h3 {
    font-size: 16px;
    margin-bottom: 12px;
    color: var(--color-primary);
  }

  .table-wrapper {
    overflow-x: auto;
  }

  .results-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .results-table th, .results-table td {
    padding: 8px 12px;
    border-bottom: 1px solid var(--color-border);
    text-align: left;
  }

  .results-table th {
    background: rgba(0, 0, 0, 0.2);
    color: var(--color-primary);
  }

  .outcome-tag {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 600;
  }

  .outcome-tag.correct {
    background: rgba(74, 222, 128, 0.2);
    color: var(--color-success);
  }

  .outcome-tag.incorrect {
    background: rgba(248, 113, 113, 0.2);
    color: var(--color-danger);
  }

  .empty-text {
    color: var(--color-text-muted);
    font-style: italic;
    padding: 16px;
    text-align: center;
  }

  .danger-zone {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
  }
</style>
