<script lang="ts">
  import type { ExplorationController } from '../../domain/navigation/ExplorationController.js';
  import type { NavigationState } from '../../domain/navigation/types.js';

  interface Props {
    controller: ExplorationController;
    onOpenHelp: () => void;
  }

  let { controller, onOpenHelp }: Props = $props();

  let navState: NavigationState = $state(controller.getState());

  $effect(() => {
    navState = controller.getState();
    const unsub = controller.onStateChange((newState: NavigationState) => {
      navState = newState;
    });
    return unsub;
  });

  const availableNeighbors = $derived(controller.getAvailableNeighbors());
  const selectedNeighbor = $derived(controller.getSelectedNeighbor());
  const meta = $derived(navState.graph.getMetadata());
  const metrics = $derived(meta.difficultyMetrics);

  function handleKeydown(event: KeyboardEvent) {
    if (controller.handleKeyboardCommand(event.key, event.ctrlKey, event.altKey)) {
      event.preventDefault();
    }
  }
</script>

<div class="explorer-container">
  <div class="card graph-header">
    <div class="graph-title-row">
      <div>
        <h2>{meta.name}</h2>
        <p class="description">{meta.description ?? 'Directed Graph'}</p>
      </div>
      <div class="metrics-badge-row">
        {#if metrics}
          <span class="badge" title="Node Count">{metrics.nodeCount} Nodes</span>
          <span class="badge" title="Edge Count">{metrics.edgeCount} Edges</span>
          <span class="badge" title="Cycles Present">{metrics.hasCycles ? 'Has Cycles' : 'Acyclic (DAG)'}</span>
        {/if}
      </div>
    </div>
  </div>

  <!-- Interactive Exploration Panel (Keyboard Accessible) -->
  <div
    class="card explorer-panel"
    tabindex="0"
    role="region"
    aria-label={`Graph Exploration Panel for ${meta.name}. Use arrow keys to navigate.`}
    onkeydown={handleKeydown}
  >
    <div class="panel-header">
      <span class="hint-text">
        Keyboard focus active. Use <strong>Arrows</strong> to navigate, <strong>D</strong> for direction, <strong>R</strong> to replay.
      </span>
      <button class="help-btn" onclick={onOpenHelp} aria-label="Open Keyboard Help Dialog">
        Keyboard Guide (?)
      </button>
    </div>

    <div class="current-node-card">
      <span class="eyebrow">CURRENTLY FOCUSED NODE</span>
      <div class="node-id-display">
        Node {navState.currentNodeId}
      </div>
      <div class="node-degree-row">
        <span>In-Degree: <strong>{navState.graph.getInDegree(navState.currentNodeId)}</strong></span>
        <span>•</span>
        <span>Out-Degree: <strong>{navState.graph.getOutDegree(navState.currentNodeId)}</strong></span>
      </div>
    </div>

    <!-- Direction Selection -->
    <div class="direction-control">
      <fieldset>
        <legend class="sr-only">Connection Direction</legend>
        <div class="direction-toggle-group">
          <button
            class={navState.direction === 'outgoing' ? 'dir-btn active' : 'dir-btn'}
            onclick={() => controller.setDirection('outgoing')}
            aria-pressed={navState.direction === 'outgoing'}
          >
            Outgoing Connections (→)
          </button>
          <button
            class={navState.direction === 'incoming' ? 'dir-btn active' : 'dir-btn'}
            onclick={() => controller.setDirection('incoming')}
            aria-pressed={navState.direction === 'incoming'}
          >
            Incoming Connections (←)
          </button>
        </div>
      </fieldset>
    </div>

    <!-- Available Connections List -->
    <div class="neighbors-section">
      <h3>
        Available {navState.direction === 'outgoing' ? 'Outgoing Targets' : 'Incoming Sources'} ({availableNeighbors.length}):
      </h3>

      {#if availableNeighbors.length === 0}
        <p class="empty-neighbors">
          No {navState.direction} connections from Node {navState.currentNodeId}.
        </p>
      {:else}
        <ul class="neighbor-list" role="listbox" aria-label={`${navState.direction} connections list`}>
          {#each availableNeighbors as neighbor, idx}
            <li
              class={idx === navState.selectedNeighborIndex ? 'neighbor-item selected' : 'neighbor-item'}
              role="option"
              aria-selected={idx === navState.selectedNeighborIndex}
            >
              <button
                class="neighbor-select-btn"
                onclick={() => controller.selectNeighborByIndex(idx)}
              >
                <span class="indicator">{idx === navState.selectedNeighborIndex ? '▶' : '•'}</span>
                <strong>Node {neighbor}</strong>
                {#if idx === navState.selectedNeighborIndex}
                  <span class="selected-badge">Selected (Enter to move)</span>
                {/if}
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <!-- Controls Button Bar -->
    <div class="actions-grid">
      <button onclick={() => controller.prevNeighbor()} aria-label="Previous Neighbor (Up Arrow)">
        ▲ Prev Neighbor (K)
      </button>

      <button onclick={() => controller.nextNeighbor()} aria-label="Next Neighbor (Down Arrow)">
        ▼ Next Neighbor (J)
      </button>

      <button
        class="primary"
        onclick={() => controller.traverseSelectedNeighbor()}
        disabled={!selectedNeighbor}
        aria-label="Traverse to selected neighbor (Right Arrow or Enter)"
      >
        Traverse into Node {selectedNeighbor ?? '—'} (Enter)
      </button>

      <button
        onclick={() => controller.goBack()}
        disabled={navState.history.length === 0}
        aria-label="Go Back to previous node (Left Arrow or Backspace)"
      >
        ◀ Go Back
      </button>

      <button onclick={() => controller.goToStartNode()} aria-label="Return to Start Node (Home key)">
        ⌂ Go to Start (H)
      </button>

      <button onclick={() => controller.replay()} aria-label="Replay Audio (R key)">
        ♫ Replay Audio (R)
      </button>

      <button onclick={() => controller.inspectCurrentNode()} aria-label="Inspect Node Details (I key)">
        ℹ Inspect Node (I)
      </button>

      <button class="danger" onclick={() => controller.cancelPlayback()} aria-label="Cancel Audio Playback (Escape)">
        ✕ Stop Audio (Esc)
      </button>
    </div>

    <!-- Navigation Breadcrumbs History -->
    {#if navState.history.length > 0}
      <div class="history-bar">
        <span class="history-label">Visit History:</span>
        <span class="history-crumbs">{navState.history.join(' → ')} → <strong>{navState.currentNodeId}</strong></span>
      </div>
    {/if}

    <!-- Inspection Output Display -->
    {#if navState.inspection}
      <div class="card inspection-card" role="region" aria-label="Node Inspection Details">
        <h4>Detailed Inspection: Node {navState.inspection.nodeId}</h4>
        <div class="inspection-grid">
          <div>
            <strong>Incoming Sources ({navState.inspection.inDegree}):</strong>
            <span>{navState.inspection.incomingNeighbors.length > 0 ? navState.inspection.incomingNeighbors.join(', ') : 'None'}</span>
          </div>
          <div>
            <strong>Outgoing Targets ({navState.inspection.outDegree}):</strong>
            <span>{navState.inspection.outgoingNeighbors.length > 0 ? navState.inspection.outgoingNeighbors.join(', ') : 'None'}</span>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Textual Graph Structure Table (Accessibility Fallback) -->
  <div class="card textual-structure">
    <h3>Complete Textual Graph Structure</h3>
    <table class="graph-table">
      <thead>
        <tr>
          <th scope="col">Node</th>
          <th scope="col">Incoming Connections</th>
          <th scope="col">Outgoing Connections</th>
          <th scope="col">Action</th>
        </tr>
      </thead>
      <tbody>
        {#each navState.graph.getNodeIds() as nodeId}
          <tr class={nodeId === navState.currentNodeId ? 'current-row' : ''}>
            <td><strong>Node {nodeId}</strong></td>
            <td>{navState.graph.getIncomingNeighbors(nodeId).join(', ') || 'None'}</td>
            <td>{navState.graph.getOutgoingNeighbors(nodeId).join(', ') || 'None'}</td>
            <td>
              <button
                class="jump-btn"
                onclick={() => controller.jumpToNode(nodeId)}
                aria-label={`Jump directly to Node ${nodeId}`}
              >
                Focus {nodeId}
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
  .explorer-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .graph-header {
    margin-bottom: 0;
  }

  .graph-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }

  .description {
    color: var(--color-text-muted);
    font-size: 14px;
    margin-top: 4px;
  }

  .metrics-badge-row {
    display: flex;
    gap: 8px;
  }

  .explorer-panel {
    border: 2px solid var(--color-primary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    margin-bottom: 0;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--color-border);
  }

  .hint-text {
    font-size: 13px;
    color: var(--color-text-muted);
  }

  .help-btn {
    font-size: 13px;
    padding: 4px 10px;
  }

  .current-node-card {
    text-align: center;
    background: #0f172a;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
  }

  .eyebrow {
    font-size: 12px;
    font-weight: 700;
    color: var(--color-primary);
    letter-spacing: 1px;
  }

  .node-id-display {
    font-size: 32px;
    font-weight: 800;
    color: #ffffff;
    margin: 4px 0;
  }

  .node-degree-row {
    display: flex;
    justify-content: center;
    gap: 12px;
    font-size: 14px;
    color: var(--color-text-muted);
  }

  .direction-control {
    margin-bottom: 16px;
  }

  fieldset {
    border: none;
    padding: 0;
  }

  .direction-toggle-group {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .dir-btn {
    padding: 10px;
    font-size: 14px;
  }

  .dir-btn.active {
    background-color: var(--color-primary);
    color: #0f172a;
    border-color: var(--color-primary-focus);
    font-weight: 700;
  }

  .neighbors-section h3 {
    font-size: 15px;
    margin-bottom: 10px;
  }

  .empty-neighbors {
    padding: 12px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 6px;
    color: var(--color-text-muted);
    font-style: italic;
  }

  .neighbor-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }

  .neighbor-item {
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-surface);
  }

  .neighbor-item.selected {
    border-color: var(--color-primary);
    background: rgba(56, 189, 248, 0.15);
  }

  .neighbor-select-btn {
    width: 100%;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border: none;
    background: transparent;
  }

  .selected-badge {
    margin-left: auto;
    font-size: 12px;
    color: var(--color-primary);
    font-weight: 600;
  }

  .actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 8px;
    margin-top: 16px;
  }

  .history-bar {
    margin-top: 16px;
    padding: 10px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 6px;
    font-size: 13px;
  }

  .history-label {
    color: var(--color-text-muted);
    margin-right: 8px;
  }

  .inspection-card {
    margin-top: 16px;
    margin-bottom: 0;
    background: rgba(15, 23, 42, 0.8);
  }

  .inspection-card h4 {
    color: var(--color-primary);
    margin-bottom: 8px;
  }

  .inspection-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    font-size: 14px;
  }

  .textual-structure h3 {
    font-size: 16px;
    margin-bottom: 12px;
  }

  .graph-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }

  .graph-table th, .graph-table td {
    padding: 8px 12px;
    border-bottom: 1px solid var(--color-border);
    text-align: left;
  }

  .graph-table th {
    background: rgba(0, 0, 0, 0.2);
    color: var(--color-primary);
  }

  .current-row {
    background: rgba(56, 189, 248, 0.1);
  }

  .jump-btn {
    padding: 4px 8px;
    font-size: 12px;
  }
</style>
