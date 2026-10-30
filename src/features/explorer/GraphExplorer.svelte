<script lang="ts">
  import type { ExplorationController } from '../../domain/navigation/ExplorationController.js';
  import type { NavigationState } from '../../domain/navigation/types.js';
  import { resolveNodePresentation } from '../../domain/presentation/types.js';

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

  const availableNeighbors = $derived(
    navState.direction === 'outgoing'
      ? navState.graph.getOutgoingNeighbors(navState.currentNodeId)
      : navState.graph.getIncomingNeighbors(navState.currentNodeId)
  );
  const selectedNeighbor = $derived(
    availableNeighbors[navState.selectedNeighborIndex] ?? null
  );
  const meta = $derived(navState.graph.getMetadata());
  const metrics = $derived(meta.difficultyMetrics);
  const exposure = $derived(navState.exposurePolicy);
  const displayName = $derived(exposure.anonymizedGraphTitle ?? meta.name);

  const currentNode = $derived(
    navState.currentNodeId ? navState.graph.getNode(navState.currentNodeId) : null
  );
  const currentPres = $derived(
    currentNode ? resolveNodePresentation(currentNode) : null
  );
  const weaklyConnectedComponents = $derived(
    navState.graph.getWeaklyConnectedComponents()
  );

  function isInteractiveElement(el: EventTarget | null): boolean {
    if (!el || !(el instanceof HTMLElement)) return false;
    const tag = el.tagName.toUpperCase();
    return (
      tag === 'BUTTON' ||
      tag === 'INPUT' ||
      tag === 'SELECT' ||
      tag === 'TEXTAREA' ||
      tag === 'A' ||
      el.isContentEditable
    );
  }

  function handleKeydown(event: KeyboardEvent) {
    if (document.querySelector('dialog[open], [role="dialog"]')) {
      return;
    }

    if (event.key === 'Tab') {
      return;
    }

    if (isInteractiveElement(event.target)) {
      if (event.key === 'Escape') {
        controller.cancelPlayback();
        event.preventDefault();
      }
      return;
    }

    if (controller.handleKeyboardCommand(event.key, event.ctrlKey, event.altKey)) {
      event.preventDefault();
    }
  }
</script>

<div class="explorer-container">
  <div class="card graph-header">
    <div class="graph-title-row">
      <div>
        <h2>{displayName}</h2>
        {#if exposure.showGraphDescription && meta.description}
          <p class="description">{meta.description}</p>
        {/if}
      </div>
      <div class="metrics-badge-row">
        {#if exposure.showGlobalMetrics && metrics}
          <span class="badge" title="Node Count">{metrics.nodeCount} Nodes</span>
          <span class="badge" title="Edge Count">{metrics.edgeCount} Edges</span>
          <span class="badge" title="Cycles Present">{metrics.hasCycles ? 'Has Cycles' : 'Acyclic (DAG)'}</span>
        {:else if metrics}
          <span class="badge" title="Node Count">{metrics.nodeCount} Nodes</span>
          <span class="badge" title="Study Stimulus">Study Stimulus</span>
        {/if}
      </div>
    </div>
  </div>

  <!-- Interactive Exploration Panel (Keyboard Accessible Region) -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="card explorer-panel"
    tabindex="0"
    role="region"
    aria-label={`Graph Exploration Workspace for ${displayName}. Press Tab to move to buttons, Shift+Tab to leave, Arrow keys or H/J/K/L to navigate.`}
    onkeydown={handleKeydown}
  >
    <div class="panel-header">
      <span class="hint-text">
        Graph navigation active. Use <strong>Arrows</strong> to navigate, <strong>D</strong> for direction, <strong>R</strong> to replay, <strong>Tab</strong> to exit.
      </span>
      <button class="help-btn" onclick={onOpenHelp} aria-label="Keyboard Guide (?) - Open Keyboard Help Dialog">
        Keyboard Guide (?)
      </button>
    </div>

    <!-- Currently Focused Node Card with Presentation Model Integration -->
    <div class="current-node-card">
      <span class="eyebrow">CURRENTLY FOCUSED NODE</span>
      <div class="node-id-display">
        <span>Node {navState.currentNodeId}</span>
        {#if currentNode?.label && currentNode.label !== navState.currentNodeId}
          <span class="node-label">({currentNode.label})</span>
        {/if}
        {#if currentPres}
          <span class={`badge shape-badge ${currentPres.shape}`}>
            {currentPres.shapeName}
          </span>
        {/if}
      </div>

      {#if currentPres?.isFallback}
        <div class="fallback-warning-badge" role="status">
          ⚠️ {currentPres.shapeDescription}
        </div>
      {/if}

      <div class="node-degree-row">
        <span>In-Degree: <strong>{navState.graph.getInDegree(navState.currentNodeId)}</strong></span>
        <span>•</span>
        <span>Out-Degree: <strong>{navState.graph.getOutDegree(navState.currentNodeId)}</strong></span>
        <span>•</span>
        <span class="visited-status-tag">
          {navState.visitedNodeIds?.includes(navState.currentNodeId) ? '✓ Visited' : 'Unvisited'}
        </span>
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

    <!-- Available Connections List with Shape Badges and Edge Labels -->
    <div class="neighbors-section">
      <h3>
        Available {navState.direction === 'outgoing' ? 'Outgoing Targets' : 'Incoming Sources'} ({availableNeighbors.length}):
      </h3>

      {#if availableNeighbors.length === 0}
        <p class="empty-neighbors">
          No {navState.direction} connections from Node {navState.currentNodeId}.
        </p>
      {:else}
        <ul class="neighbor-list" aria-label={`${navState.direction} connections list`}>
          {#each availableNeighbors as neighbor, idx}
            {@const nNode = navState.graph.getNode(neighbor)}
            {@const nPres = nNode ? resolveNodePresentation(nNode) : null}
            {@const edge = navState.direction === 'outgoing'
              ? navState.graph.getEdges().find((e) => e.source === navState.currentNodeId && e.target === neighbor)
              : navState.graph.getEdges().find((e) => e.source === neighbor && e.target === navState.currentNodeId)}
            <li
              class={idx === navState.selectedNeighborIndex ? 'neighbor-item selected' : 'neighbor-item'}
            >
              <button
                class="neighbor-select-btn"
                onclick={() => controller.selectNeighborByIndex(idx)}
                aria-current={idx === navState.selectedNeighborIndex ? 'true' : undefined}
              >
                <span class="indicator">{idx === navState.selectedNeighborIndex ? '▶' : '•'}</span>
                <strong>Node {neighbor}</strong>
                {#if nNode?.label && nNode.label !== neighbor}
                  <span class="neighbor-label">({nNode.label})</span>
                {/if}
                {#if nPres}
                  <span class={`badge shape-badge-sm ${nPres.shape}`}>
                    {nPres.shapeName}
                  </span>
                {/if}
                {#if edge?.label}
                  <span class="edge-label-badge">"{edge.label}"</span>
                {/if}
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
      <button onclick={() => controller.prevNeighbor()} aria-label="▲ Prev Neighbor (K) - Up Arrow">
        ▲ Prev Neighbor (K)
      </button>

      <button onclick={() => controller.nextNeighbor()} aria-label="▼ Next Neighbor (J) - Down Arrow">
        ▼ Next Neighbor (J)
      </button>

      <button
        class="primary"
        onclick={() => controller.traverseSelectedNeighbor()}
        disabled={!selectedNeighbor}
        aria-label={`Traverse into Node ${selectedNeighbor ?? '—'} (Enter)`}
      >
        Traverse into Node {selectedNeighbor ?? '—'} (Enter)
      </button>

      <button
        onclick={() => controller.goBack()}
        disabled={navState.history.length === 0}
        aria-label="◀ Go Back (Left Arrow or Backspace)"
      >
        ◀ Go Back
      </button>

      <button onclick={() => controller.goToStartNode()} aria-label="⌂ Go to Start (H) - Home key">
        ⌂ Go to Start (H)
      </button>

      <button onclick={() => controller.replay()} aria-label="♫ Replay Audio (R)">
        ♫ Replay Audio (R)
      </button>

      <button onclick={() => controller.inspectCurrentNode()} aria-label="ℹ Inspect Node (I)">
        ℹ Inspect Node (I)
      </button>

      <button class="danger" onclick={() => controller.cancelPlayback()} aria-label="✕ Stop Audio (Esc)">
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
          {#if currentPres}
            <div class="inspection-pres">
              <strong>Visual Shape:</strong>
              <span>{currentPres.shapeName} ({currentPres.shapeDescription})</span>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>

  <!-- Disconnected Graph Components Discovery (Free Exploration Only - Protected under Study Exposure Policy) -->
  {#if exposure.showAdjacencyTable && weaklyConnectedComponents.length > 1}
    <div class="card disconnected-banner" role="region" aria-label="Disconnected Graph Components">
      <div class="disconnected-header">
        <h4>⚠️ Disconnected Graph Structure ({weaklyConnectedComponents.length} Separate Components)</h4>
        <p class="disconnected-desc">
          This graph contains disconnected subgraphs. Nodes in other components cannot be reached by traversing edges from the current node.
        </p>
      </div>
      <div class="components-grid">
        {#each weaklyConnectedComponents as comp, idx}
          {@const isCurrentComp = comp.includes(navState.currentNodeId)}
          <div class="component-card" class:active-comp={isCurrentComp}>
            <div class="comp-info">
              <strong>Component {idx + 1} ({comp.length} nodes):</strong>
              <span class="comp-nodes">{comp.join(', ')}</span>
            </div>
            {#if isCurrentComp}
              <span class="badge active-component-badge">Current Component</span>
            {:else if exposure.allowNodeJumping}
              <button
                class="secondary small jump-comp-btn"
                onclick={() => controller.jumpToNode(comp[0])}
                aria-label={`Jump to Component ${idx + 1} at Node ${comp[0]}`}
              >
                Jump to Component {idx + 1} (Node {comp[0]})
              </button>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Complete Textual Graph Structure & Accessible Node Index (Free Exploration Only) -->
  {#if exposure.showAdjacencyTable}
    <div class="card textual-structure">
      <h3>Complete Accessible Node Index & Graph Structure</h3>
      <table class="graph-table">
        <thead>
          <tr>
            <th scope="col">Node ID</th>
            <th scope="col">Label</th>
            <th scope="col">Visual Shape</th>
            <th scope="col">Visited Status</th>
            <th scope="col">Incoming Connections</th>
            <th scope="col">Outgoing Connections</th>
            {#if exposure.allowNodeJumping}
              <th scope="col">Action</th>
            {/if}
          </tr>
        </thead>
        <tbody>
          {#each navState.graph.getNodeIds() as nodeId}
            {@const n = navState.graph.getNode(nodeId)}
            {@const p = n ? resolveNodePresentation(n) : null}
            {@const isVisited = navState.visitedNodeIds?.includes(nodeId)}
            <tr class={nodeId === navState.currentNodeId ? 'current-row' : ''}>
              <td><strong>Node {nodeId}</strong></td>
              <td>{n?.label || nodeId}</td>
              <td>
                {#if p}
                  <span class={`badge shape-badge-sm ${p.shape}`}>{p.shapeName}</span>
                {/if}
              </td>
              <td>
                <span class={isVisited ? 'visited-yes' : 'visited-no'}>
                  {isVisited ? '✓ Visited' : '○ Unvisited'}
                </span>
              </td>
              <td>{navState.graph.getIncomingNeighbors(nodeId).join(', ') || 'None'}</td>
              <td>{navState.graph.getOutgoingNeighbors(nodeId).join(', ') || 'None'}</td>
              {#if exposure.allowNodeJumping}
                <td>
                  <button
                    class="jump-btn"
                    onclick={() => controller.jumpToNode(nodeId)}
                    aria-label={`Focus ${nodeId} - Jump directly`}
                  >
                    Focus {nodeId}
                  </button>
                </td>
              {/if}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
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
    flex-wrap: wrap;
  }

  .explorer-panel {
    border: 2px solid var(--color-border);
    transition: border-color 0.2s;
  }

  .explorer-panel:focus-within {
    border-color: var(--color-primary);
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .hint-text {
    font-size: 13px;
    color: var(--color-text-muted);
  }

  .help-btn {
    background: transparent;
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }

  .help-btn:hover {
    background: var(--color-primary);
    color: #0f172a;
  }

  .current-node-card {
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 18px;
    text-align: center;
    margin-bottom: 16px;
  }

  .eyebrow {
    font-size: 11px;
    font-weight: 700;
    color: var(--color-primary);
    letter-spacing: 1px;
  }

  .node-id-display {
    font-size: 28px;
    font-weight: 800;
    color: #f8fafc;
    margin: 6px 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .node-label {
    font-size: 18px;
    color: #94a3b8;
    font-weight: 500;
  }

  .shape-badge {
    font-size: 13px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 6px;
  }

  .shape-badge.circle,
  .shape-badge-sm.circle {
    background: #0c4a6e;
    border: 1px solid #38bdf8;
    color: #f0f9ff;
  }

  .shape-badge.rectangle,
  .shape-badge-sm.rectangle {
    background: #713f12;
    border: 1px solid #fbbf24;
    color: #fefce8;
  }

  .shape-badge.diamond,
  .shape-badge-sm.diamond {
    background: #881337;
    border: 1px solid #f43f5e;
    color: #fff1f2;
  }

  .shape-badge-sm {
    font-size: 11px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .fallback-warning-badge {
    background: rgba(245, 158, 11, 0.15);
    border: 1px solid #f59e0b;
    color: #fbbf24;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 13px;
    margin: 8px 0;
  }

  .node-degree-row {
    font-size: 13px;
    color: var(--color-text-muted);
    display: flex;
    justify-content: center;
    gap: 8px;
    align-items: center;
  }

  .visited-status-tag {
    color: #34d399;
    font-weight: 600;
  }

  .direction-control {
    margin-bottom: 16px;
  }

  .direction-toggle-group {
    display: flex;
    gap: 10px;
  }

  .dir-btn {
    flex: 1;
    padding: 10px;
    background: #0f172a;
    border: 1px solid var(--color-border);
    color: var(--color-text-muted);
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
  }

  .dir-btn.active {
    background: var(--color-primary);
    color: #0f172a;
    border-color: var(--color-primary);
  }

  .neighbors-section h3 {
    font-size: 15px;
    margin-bottom: 10px;
    color: #cbd5e1;
  }

  .neighbor-list {
    list-style: none;
    padding: 0;
    margin: 0 0 16px 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .neighbor-item {
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 6px;
    overflow: hidden;
  }

  .neighbor-item.selected {
    border-color: var(--color-primary);
    background: #132039;
  }

  .neighbor-select-btn {
    width: 100%;
    padding: 10px 14px;
    background: transparent;
    border: none;
    color: #f8fafc;
    display: flex;
    align-items: center;
    gap: 10px;
    text-align: left;
    cursor: pointer;
    font-size: 14px;
  }

  .neighbor-label {
    color: #94a3b8;
    font-size: 13px;
  }

  .edge-label-badge {
    background: #1e293b;
    border: 1px solid #475569;
    color: #cbd5e1;
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .selected-badge {
    margin-left: auto;
    font-size: 12px;
    color: var(--color-primary);
    font-weight: 600;
  }

  .empty-neighbors {
    font-size: 14px;
    color: var(--color-text-muted);
    padding: 12px;
    background: #0f172a;
    border-radius: 6px;
    margin-bottom: 16px;
  }

  .actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 8px;
    margin-bottom: 16px;
  }

  .history-bar {
    font-size: 13px;
    color: var(--color-text-muted);
    padding: 8px 12px;
    background: #0f172a;
    border-radius: 6px;
    margin-bottom: 16px;
    overflow-x: auto;
    white-space: nowrap;
  }

  .history-crumbs {
    color: #cbd5e1;
  }

  .inspection-card {
    background: #0f172a;
    border: 1px solid var(--color-primary);
    padding: 14px;
    border-radius: 6px;
  }

  .inspection-card h4 {
    margin: 0 0 10px 0;
    font-size: 14px;
    color: var(--color-primary);
  }

  .inspection-grid {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 13px;
  }

  .disconnected-banner {
    border-left: 4px solid #f59e0b;
    background: #0f172a;
  }

  .disconnected-header h4 {
    color: #fbbf24;
    margin: 0 0 4px 0;
  }

  .disconnected-desc {
    font-size: 13px;
    color: #cbd5e1;
    margin-bottom: 12px;
  }

  .components-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .component-card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 6px;
    padding: 8px 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .component-card.active-comp {
    border-color: #38bdf8;
  }

  .comp-nodes {
    color: #94a3b8;
    font-family: monospace;
    font-size: 12px;
    margin-left: 6px;
  }

  .active-component-badge {
    background: rgba(56, 189, 248, 0.2);
    border: 1px solid #38bdf8;
    color: #38bdf8;
  }

  .textual-structure {
    overflow-x: auto;
  }

  .graph-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .graph-table th,
  .graph-table td {
    padding: 8px 12px;
    text-align: left;
    border-bottom: 1px solid var(--color-border);
  }

  .graph-table th {
    background: #0f172a;
    color: var(--color-primary);
  }

  .current-row {
    background: rgba(56, 189, 248, 0.1);
  }

  .visited-yes {
    color: #34d399;
    font-weight: 600;
  }

  .visited-no {
    color: #94a3b8;
  }

  .jump-btn {
    background: #0f172a;
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
  }

  .jump-btn:hover {
    background: var(--color-primary);
    color: #0f172a;
  }
</style>
