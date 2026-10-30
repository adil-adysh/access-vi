<script lang="ts">
  import type { EdgeInput } from '../../domain/tasks/types.js';

  interface Props {
    availableNodes: string[];
    edges: EdgeInput[];
  }

  let {
    availableNodes,
    edges = $bindable<EdgeInput[]>([])
  }: Props = $props();

  let selectedSource = $state('A');
  let selectedTarget = $state('B');
  let duplicateWarning = $state('');

  $effect(() => {
    if (availableNodes.length > 0) {
      selectedSource = availableNodes[0];
      selectedTarget = availableNodes[1] ?? availableNodes[0];
    }
  });

  function addEdge() {
    duplicateWarning = '';
    if (selectedSource === selectedTarget) {
      duplicateWarning = 'Self-loops are not allowed in this task.';
      return;
    }

    const exists = edges.some(
      (e) => e.source === selectedSource && e.target === selectedTarget
    );

    if (exists) {
      duplicateWarning = `Edge ${selectedSource} → ${selectedTarget} is already added.`;
      return;
    }

    edges = [...edges, { source: selectedSource, target: selectedTarget }];
  }

  function removeEdge(index: number) {
    edges = edges.filter((_, i) => i !== index);
  }

  function clearAll() {
    edges = [];
  }
</script>

<div class="reconstruction-container">
  <div class="edge-creator-card">
    <h4>Add Directed Connection</h4>
    <div class="edge-inputs-row">
      <div class="input-field">
        <label for="recon-source">Source Node (From):</label>
        <select id="recon-source" bind:value={selectedSource}>
          {#each availableNodes as node}
            <option value={node}>Node {node}</option>
          {/each}
        </select>
      </div>

      <span class="arrow-indicator">→</span>

      <div class="input-field">
        <label for="recon-target">Target Node (To):</label>
        <select id="recon-target" bind:value={selectedTarget}>
          {#each availableNodes as node}
            <option value={node}>Node {node}</option>
          {/each}
        </select>
      </div>

      <button type="button" class="primary add-btn" onclick={addEdge}>
        + Add Edge
      </button>
    </div>

    {#if duplicateWarning}
      <p class="warning-text" role="alert">{duplicateWarning}</p>
    {/if}
  </div>

  <div class="edges-list-section">
    <div class="list-header">
      <h4>Reconstructed Connections ({edges.length})</h4>
      {#if edges.length > 0}
        <button type="button" class="clear-btn" onclick={clearAll}>Clear All</button>
      {/if}
    </div>

    {#if edges.length === 0}
      <p class="empty-text">No connections added yet. Select source and target nodes above and click Add Edge.</p>
    {:else}
      <table class="edges-table">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Connection</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {#each edges as edge, index}
            <tr>
              <td>{index + 1}</td>
              <td><strong>Node {edge.source} → Node {edge.target}</strong></td>
              <td>
                <button
                  type="button"
                  class="danger remove-btn"
                  onclick={() => removeEdge(index)}
                  aria-label={`Remove edge ${edge.source} to ${edge.target}`}
                >
                  Remove
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>

<style>
  .reconstruction-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .edge-creator-card {
    background: #0f172a;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    padding: 16px;
  }

  .edge-creator-card h4 {
    font-size: 14px;
    margin-bottom: 12px;
    color: var(--color-primary);
  }

  .edge-inputs-row {
    display: flex;
    align-items: flex-end;
    gap: 12px;
    flex-wrap: wrap;
  }

  .input-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-width: 120px;
  }

  .input-field label {
    font-size: 12px;
    color: var(--color-text-muted);
  }

  select {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    padding: 8px;
    font-size: 14px;
  }

  .arrow-indicator {
    font-size: 20px;
    font-weight: bold;
    color: var(--color-primary);
    padding-bottom: 6px;
  }

  .add-btn {
    height: 38px;
  }

  .warning-text {
    margin-top: 8px;
    color: var(--color-warning);
    font-size: 13px;
  }

  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .list-header h4 {
    font-size: 14px;
  }

  .clear-btn {
    font-size: 12px;
    padding: 2px 8px;
  }

  .empty-text {
    color: var(--color-text-muted);
    font-style: italic;
    font-size: 13px;
    padding: 12px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 6px;
  }

  .edges-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .edges-table th, .edges-table td {
    padding: 6px 10px;
    border-bottom: 1px solid var(--color-border);
    text-align: left;
  }

  .remove-btn {
    padding: 2px 8px;
    font-size: 12px;
  }
</style>
