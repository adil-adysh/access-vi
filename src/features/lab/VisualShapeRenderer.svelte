<script lang="ts">
  import type { LabNodeStimulus, LabEdgeStimulus } from '../../domain/lab/types.js';

  interface Props {
    nodes?: readonly LabNodeStimulus[];
    edges?: readonly LabEdgeStimulus[];
    decorativeNote?: string;
    width?: number;
    height?: number;
  }

  let {
    nodes = [],
    edges = [],
    decorativeNote,
    width = 300,
    height = 160
  }: Props = $props();

  const accessibleDescription = $derived(generateDescription(nodes, edges, decorativeNote));

  function generateDescription(
    nList: readonly LabNodeStimulus[],
    eList: readonly LabEdgeStimulus[],
    note?: string
  ): string {
    const nodeDescs = nList
      .map((n) => `Node ${n.label} (${n.shape} shape)`)
      .join(', ');

    const edgeDescs = eList
      .map((e) => `${e.source} to ${e.target} (${e.direction}${e.geometryVariation ? `, ${e.geometryVariation} geometry` : ''})`)
      .join('; ');

    let full = `Diagram with ${nList.length} node${nList.length === 1 ? '' : 's'}: ${nodeDescs}.`;
    if (eList.length > 0) {
      full += ` Directed connections: ${edgeDescs}.`;
    }
    if (note) {
      full += ` Note: ${note}.`;
    }
    return full;
  }

  function getNodeCoordinates(node: LabNodeStimulus, idx: number, total: number) {
    if (node.x !== undefined && node.y !== undefined) {
      return { x: node.x, y: node.y };
    }
    if (total === 1) return { x: width / 2, y: height / 2 };
    const spacing = width / (total + 1);
    return { x: spacing * (idx + 1), y: height / 2 };
  }

  function getPathData(
    srcCoords: { x: number; y: number },
    tgtCoords: { x: number; y: number },
    variation?: 'straight' | 'curved' | 'step'
  ): string {
    const { x: x1, y: y1 } = srcCoords;
    const { x: x2, y: y2 } = tgtCoords;

    if (variation === 'curved') {
      const midX = (x1 + x2) / 2;
      const midY = Math.min(y1, y2) - 35;
      return `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`;
    }

    if (variation === 'step') {
      const midX = (x1 + x2) / 2;
      return `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
    }

    // Default straight
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  }
</script>

<div class="visual-renderer-card" role="region" aria-label="Visual Graph Diagram Canvas">
  <svg
    {width}
    {height}
    viewBox={`0 0 ${width} ${height}`}
    class="graph-svg"
    role="img"
    aria-label={accessibleDescription}
  >
    <title>Visual Graph Stimulus</title>
    <desc>{accessibleDescription}</desc>

    <defs>
      <marker
        id="arrowhead-standard"
        markerWidth="10"
        markerHeight="7"
        refX="9"
        refY="3.5"
        orient="auto"
      >
        <polygon points="0 0, 10 3.5, 0 7" fill="#38bdf8" />
      </marker>
    </defs>

    <!-- Edges -->
    {#each edges as edge}
      {@const srcIdx = nodes.findIndex((n) => n.id === edge.source)}
      {@const tgtIdx = nodes.findIndex((n) => n.id === edge.target)}
      {#if srcIdx !== -1 && tgtIdx !== -1}
        {@const srcCoords = getNodeCoordinates(nodes[srcIdx], srcIdx, nodes.length)}
        {@const tgtCoords = getNodeCoordinates(nodes[tgtIdx], tgtIdx, nodes.length)}
        {@const pathD = getPathData(srcCoords, tgtCoords, edge.geometryVariation)}
        <path
          d={pathD}
          class="edge-path"
          class:curved={edge.geometryVariation === 'curved'}
          class:step={edge.geometryVariation === 'step'}
          marker-end="url(#arrowhead-standard)"
        />
      {/if}
    {/each}

    <!-- Nodes -->
    {#each nodes as node, idx}
      {@const coords = getNodeCoordinates(node, idx, nodes.length)}
      <g class="node-group" transform={`translate(${coords.x}, ${coords.y})`}>
        {#if node.shape === 'circle'}
          <circle
            r="24"
            class="node-shape circle"
          />
        {:else if node.shape === 'rectangle'}
          <rect
            x="-24"
            y="-20"
            width="48"
            height="40"
            rx="4"
            class="node-shape rectangle"
          />
        {:else if node.shape === 'diamond'}
          <polygon
            points="0,-26 26,0 0,26 -26,0"
            class="node-shape diamond"
          />
        {/if}
        <text
          y="4"
          text-anchor="middle"
          class="node-text"
        >
          {node.label}
        </text>
      </g>
    {/each}
  </svg>

  {#if decorativeNote}
    <div class="decorative-caption">
      <span class="caption-label">Rendering Note:</span> {decorativeNote}
    </div>
  {/if}
</div>

<style>
  .visual-renderer-card {
    background-color: #0b1120;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: 12px 0;
  }

  .graph-svg {
    max-width: 100%;
    overflow: visible;
  }

  .node-shape {
    fill: #1e293b;
    stroke: var(--color-primary);
    stroke-width: 2.5px;
    transition: all 0.2s ease;
  }

  .node-shape.circle {
    stroke: #38bdf8; /* Cyan */
  }

  .node-shape.rectangle {
    stroke: #fbbf24; /* Amber */
  }

  .node-shape.diamond {
    stroke: #a78bfa; /* Violet */
  }

  .node-text {
    fill: #f8fafc;
    font-size: 13px;
    font-weight: 600;
    pointer-events: none;
    user-select: none;
  }

  .edge-path {
    fill: none;
    stroke: #38bdf8;
    stroke-width: 2.5px;
  }

  .edge-path.curved {
    stroke-dasharray: 4, 2;
    stroke: #0ea5e9;
  }

  .edge-path.step {
    stroke: #0ea5e9;
  }

  .decorative-caption {
    margin-top: 8px;
    font-size: 12px;
    color: var(--color-text-muted);
  }

  .caption-label {
    font-weight: 600;
    color: var(--color-text);
  }
</style>
