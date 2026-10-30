<script lang="ts">
  import type { WorkloadRating } from '../../research/recording/types.js';

  interface Props {
    onSubmit: (rating: WorkloadRating) => void;
  }

  let { onSubmit }: Props = $props();

  let mentalDemand = $state(5);
  let physicalDemand = $state(5);
  let temporalDemand = $state(5);
  let performance = $state(5);
  let effort = $state(5);
  let frustration = $state(5);
  let comments = $state('');

  function handleSubmit(e: Event) {
    e.preventDefault();
    onSubmit({
      mentalDemand,
      physicalDemand,
      temporalDemand,
      performance,
      effort,
      frustration,
      comments
    });
  }
</script>

<div class="card workload-card">
  <h2>Condition Workload Assessment (Modified Raw NASA-TLX)</h2>
  <p class="desc">
    Please rate your experience navigating and reasoning about the graph structure in the condition you just completed (scale from 1 to 10 across 6 subscales).
  </p>

  <form onsubmit={handleSubmit}>
    <div class="scale-group">
      <div class="scale-header">
        <label for="mental">Mental Demand: How mentally demanding was the task?</label>
        <span class="value-badge">{mentalDemand} / 10</span>
      </div>
      <input id="mental" type="range" min="1" max="10" step="1" bind:value={mentalDemand} />
      <div class="scale-labels"><span>Very Low (1)</span><span>Very High (10)</span></div>
    </div>

    <div class="scale-group">
      <div class="scale-header">
        <label for="physical">Physical Demand: How physically demanding was the interaction?</label>
        <span class="value-badge">{physicalDemand} / 10</span>
      </div>
      <input id="physical" type="range" min="1" max="10" step="1" bind:value={physicalDemand} />
      <div class="scale-labels"><span>Very Low (1)</span><span>Very High (10)</span></div>
    </div>

    <div class="scale-group">
      <div class="scale-header">
        <label for="temporal">Temporal Demand: How hurried or rushed was the pace?</label>
        <span class="value-badge">{temporalDemand} / 10</span>
      </div>
      <input id="temporal" type="range" min="1" max="10" step="1" bind:value={temporalDemand} />
      <div class="scale-labels"><span>Very Low (1)</span><span>Very High (10)</span></div>
    </div>

    <div class="scale-group">
      <div class="scale-header">
        <label for="performance">Performance: How successful do you think you were?</label>
        <span class="value-badge">{performance} / 10</span>
      </div>
      <input id="performance" type="range" min="1" max="10" step="1" bind:value={performance} />
      <div class="scale-labels"><span>Failure (1)</span><span>Perfect (10)</span></div>
    </div>

    <div class="scale-group">
      <div class="scale-header">
        <label for="effort">Effort: How hard did you have to work to accomplish your level of performance?</label>
        <span class="value-badge">{effort} / 10</span>
      </div>
      <input id="effort" type="range" min="1" max="10" step="1" bind:value={effort} />
      <div class="scale-labels"><span>Very Low (1)</span><span>Very High (10)</span></div>
    </div>

    <div class="scale-group">
      <div class="scale-header">
        <label for="frustration">Frustration: How insecure, discouraged, irritated, or stressed were you?</label>
        <span class="value-badge">{frustration} / 10</span>
      </div>
      <input id="frustration" type="range" min="1" max="10" step="1" bind:value={frustration} />
      <div class="scale-labels"><span>Very Low (1)</span><span>Very High (10)</span></div>
    </div>

    <div class="comments-group">
      <label for="comments">Optional Comments / Strategy Notes:</label>
      <textarea id="comments" bind:value={comments} rows="3" placeholder="Describe any audio cues or strategies you used..."></textarea>
    </div>

    <div class="action-footer">
      <button type="submit" class="primary">Submit Workload Rating & Continue →</button>
    </div>
  </form>
</div>

<style>
  .workload-card {
    max-width: 750px;
    margin: 0 auto;
  }

  h2 {
    font-size: 20px;
    color: var(--color-primary);
    margin-bottom: 8px;
  }

  .desc {
    color: var(--color-text-muted);
    font-size: 14px;
    margin-bottom: 24px;
  }

  .scale-group {
    background: #0f172a;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    padding: 14px;
    margin-bottom: 16px;
  }

  .scale-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    font-size: 14px;
  }

  .value-badge {
    background: var(--color-surface);
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 700;
    font-size: 13px;
  }

  input[type='range'] {
    width: 100%;
  }

  .scale-labels {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--color-text-muted);
    margin-top: 4px;
  }

  .comments-group {
    margin-bottom: 20px;
  }

  .comments-group label {
    display: block;
    margin-bottom: 6px;
    font-size: 14px;
  }

  textarea {
    width: 100%;
    background: #0f172a;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    padding: 10px;
    font-size: 14px;
    color: var(--color-text);
  }

  .action-footer {
    display: flex;
    justify-content: flex-end;
  }
</style>
