<script lang="ts">
  import type { LabNodeStimulus, LabEdgeStimulus } from '../../domain/lab/types.js';
  import { calculateEdgePath, type Point } from './geometry.js';

  interface Props {
    nodes?: readonly LabNodeStimulus[];
    edges?: readonly LabEdgeStimulus[];
    decorativeNote?: string;
    width?: number;
    height?: number;
    blinded?: boolean;
  }

  let {
    nodes = [],
    edges = [],
    decorativeNote,
    width = 300,
    height = 160,
    blinded = false
  }: Props = $props();

  const accessibleDescription = $derived(generateDescription(nodes, edges, decorativeNote, blinded));

  function generateDescription(
    nList: readonly LabNodeStimulus[],
    eList: readonly LabEdgeStimulus[],
    note?: string,
    isBlinded?: boolean
  ): string {
    if (isBlinded) {
      const nodeDescs = nList.map((n) => `Node ${n.label}`).join(', ');
      return `Assessment Diagram with ${nList.length} node${nList.length === 1 ? '' : 's'}: ${nodeDescs}. Visual shapes blinded during listening test.`;
    }

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

  function getNodeCoordinates(node: LabNodeStimulus, idx: number, total: number): Point {
    if (node.x !== undefined && node.y !== undefined) {
      return { x: node.x, y: node.y };
    }
    if (total === 1) return { x: width / 2, y: height / 2 };
    const spacing = width / (total + 1);
    return { x: spacing * (idx + 1), y: height / 2 };
  }
</script>

<div class="visual-renderer-card" role="region" aria-label="Visual Graph Diagram Canvas">
  {#if blinded}
    <div class="blinded-overlay-banner" role="status">
      <span>👁️ <strong>Assessment Mode:</strong> Visual shape cues blinded during listening evaluation. Shapes will be revealed after response submission.</span>
    </div>
  {/if}

  <svg
    {width}
    {height}
    viewBox={`0 0 ${width} ${height}`}
    class="graph-svg"
    class:blinded-svg={blinded}
    role="img"
    aria-label={accessibleDescription}
  >
    <title>{blinded ? 'Blinded Auditory Stimulus Graph' : 'Visual Graph Stimulus'}</title>
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

    <!-- Boundary-aware Edges -->
    {#each edges as edge}
      {@const srcIdx = nodes.findIndex((n) => n.id === edge.source)}
      {@const tgtIdx = nodes.findIndex((n) => n.id === edge.target)}
      {#if srcIdx !== -1 && tgtIdx !== -1}
        {@const srcNode = nodes[srcIdx]}
        {@const tgtNode = nodes[tgtIdx]}
        {@const srcCoords = getNodeCoordinates(srcNode, srcIdx, nodes.length)}
        {@const tgtCoords = getNodeCoordinates(tgtNode, tgtIdx, nodes.length)}
        {@const isSelfLoop = edge.source === edge.target}
        {@const pathD = calculateEdgePath(
          blinded ? 'circle' : srcNode.shape,
          srcCoords,
          blinded ? 'circle' : tgtNode.shape,
          tgtCoords,
          edge.geometryVariation,
          isSelfLoop
        )}
        <path
          d={pathD}
          class="edge-path"
          class:curved={edge.geometryVariation === 'curved'}
          class:step={edge.geometryVariation === 'step'}
          marker-end="url(#arrowhead-standard)"
        />
      {/if}
    {/each}

    <!-- Nodes with boundary shapes -->
    {#each nodes as node, idx}
      {@const coords = getNodeCoordinates(node, idx, nodes.length)}
      <g class="node-group" transform={`translate(${coords.x}, ${coords.y})`}>
        {#if blinded}
          <!-- In blinded assessment mode, render neutral circle placeholder so visual shape is not revealed -->
          <circle
            r="22"
            class="node-shape neutral-blinded"
          />
        {:else if node.shape === 'circle'}
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

  {#if decorativeNote && !blinded}
    <div class="decorative-caption">
      <span class="caption-label">Rendering Note:</span> {decorativeNote}
    </div>
  {/if}
</div>

<style>
  .visual-renderer-card {
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
  }

  .blinded-overlay-banner {
    background: rgba(30, 41, 59, 0.85);
    border: 1px dashed #64748b;
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 13px;
    color: #94a3b8;
    text-align: center;
    width: 100%;
  }

  .graph-svg {
    background: #020617;
    border-radius: 6px;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
  }

  .edge-path {
    fill: none;
    stroke: #38bdf8;
    stroke-width: 2.5;
    stroke-linecap: round;
  }

  .edge-path.curved {
    stroke: #818cf8;
  }

  .edge-path.step {
    stroke: #34d399;
  }

  .node-shape {
    stroke-width: 2.5;
  }

  .node-shape.circle {
    fill: #1e293b;
    stroke: #38bdf8;
  }

  .node-shape.rectangle {
    fill: #1e293b;
    stroke: #fbbf24;
  }

  .node-shape.diamond {
    fill: #1e293b;
    stroke: #f43f5e;
  }

  .node-shape.neutral-blinded {
    fill: #1e293b;
    stroke: #64748b;
    stroke-dasharray: 3 3;
  }

  .node-text {
    fill: #f8fafc;
    font-size: 12px;
    font-weight: 600;
    font-family: inherit;
    pointer-events: none;
    user-select: none;
  }

  .decorative-caption {
    font-size: 12px;
    color: #94a3b8;
    background: #1e293b;
    padding: 4px 10px;
    border-radius: 4px;
    border: 1px solid #334155;
  }

  .caption-label {
    color: #38bdf8;
    font-weight: 600;
  }
</style>
