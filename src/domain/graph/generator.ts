import { DirectedGraph } from './Graph.js';
import type { GraphMetadata } from './types.js';

export interface GraphGeneratorOptions {
  readonly seed: number;
  readonly nodeCount: number;
  readonly edgeCount: number;
  readonly allowCycles?: boolean;
  readonly minBranching?: number;
  readonly minConvergence?: number;
  readonly name?: string;
  readonly id?: string;
}

/**
 * Seeded pseudo-random number generator (Mulberry32).
 */
export class SeededPRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  public next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  public nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  public shuffle<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
}

/**
 * Deterministic graph generator creating matched graphs with controlled difficulty.
 */
export class DeterministicGraphGenerator {
  public static generate(options: GraphGeneratorOptions): DirectedGraph {
    const {
      seed,
      nodeCount,
      edgeCount,
      allowCycles = true,
      minBranching = 0,
      minConvergence = 0,
      name = `Generated Graph (Seed ${options.seed})`,
      id = `gen-${options.seed}-${nodeCount}n-${edgeCount}e`
    } = options;

    if (nodeCount < 2) {
      throw new Error('Graph generation requires at least 2 nodes.');
    }

    const maxEdges = nodeCount * (nodeCount - 1);
    if (edgeCount < nodeCount - 1) {
      throw new Error(
        `Requested edgeCount (${edgeCount}) is less than minimum edges required to connect ${nodeCount} nodes (${nodeCount - 1}).`
      );
    }
    if (edgeCount > maxEdges) {
      throw new Error(
        `Requested edgeCount (${edgeCount}) exceeds maximum possible directed edges without self-loops (${maxEdges}).`
      );
    }

    const clampedEdgeCount = edgeCount;

    const prng = new SeededPRNG(seed);
    const metadata: GraphMetadata = {
      id,
      name,
      description: `Deterministically generated graph with seed ${seed}`,
      version: '1.0.0',
      customData: { seed, nodeCount, edgeCount: clampedEdgeCount, allowCycles }
    };

    const graph = new DirectedGraph(metadata);

    // Create node IDs: A, B, C, ... or N1, N2, ...
    const nodeIds: string[] = [];
    for (let i = 0; i < nodeCount; i++) {
      const id = i < 26 ? String.fromCharCode(65 + i) : `N${i + 1}`;
      nodeIds.push(id);
      graph.addNode({ id, label: `Node ${id}` });
    }

    // Step 1: Ensure connectivity by creating a backbone tree/DAG
    // Permute nodes to avoid always having A->B->C...
    const permuted = prng.shuffle(nodeIds);
    let edgeIdx = 1;

    for (let i = 1; i < permuted.length; i++) {
      // Connect to one of the earlier nodes in permutation to avoid cycles in backbone
      const parentIdx = prng.nextInt(0, i - 1);
      const source = permuted[parentIdx];
      const target = permuted[i];
      graph.addEdge({
        id: `e_${source}_${target}_${edgeIdx++}`,
        source,
        target
      });
    }

    // Step 2: Add branching if requested
    let attempts = 0;
    while (graph.getBranchingNodes().length < minBranching && graph.getEdges().length < clampedEdgeCount && attempts < 500) {
      attempts++;
      // Pick a source that already has outDegree >= 1 to make it branch
      const candidates = nodeIds.filter((n) => graph.getOutDegree(n) >= 1 && graph.getOutDegree(n) < nodeCount - 1);
      const source = candidates.length > 0 ? candidates[prng.nextInt(0, candidates.length - 1)] : nodeIds[prng.nextInt(0, nodeCount - 1)];
      const target = nodeIds[prng.nextInt(0, nodeCount - 1)];

      if (source !== target && !graph.hasEdge(source, target)) {
        if (!allowCycles && graph.isReachable(target, source)) continue;
        graph.addEdge({
          id: `e_${source}_${target}_${edgeIdx++}`,
          source,
          target
        });
      }
    }

    // Step 3: Add convergence if requested
    attempts = 0;
    while (graph.getConvergenceNodes().length < minConvergence && graph.getEdges().length < clampedEdgeCount && attempts < 500) {
      attempts++;
      const candidates = nodeIds.filter((n) => graph.getInDegree(n) >= 1 && graph.getInDegree(n) < nodeCount - 1);
      const target = candidates.length > 0 ? candidates[prng.nextInt(0, candidates.length - 1)] : nodeIds[prng.nextInt(0, nodeCount - 1)];
      const source = nodeIds[prng.nextInt(0, nodeCount - 1)];

      if (source !== target && !graph.hasEdge(source, target)) {
        if (!allowCycles && graph.isReachable(target, source)) continue;
        graph.addEdge({
          id: `e_${source}_${target}_${edgeIdx++}`,
          source,
          target
        });
      }
    }

    // Step 4: Fill remaining edges up to clampedEdgeCount
    attempts = 0;
    while (graph.getEdges().length < clampedEdgeCount && attempts < 1000) {
      attempts++;
      const source = nodeIds[prng.nextInt(0, nodeCount - 1)];
      const target = nodeIds[prng.nextInt(0, nodeCount - 1)];

      if (source !== target && !graph.hasEdge(source, target)) {
        if (!allowCycles && graph.isReachable(target, source)) {
          continue;
        }
        graph.addEdge({
          id: `e_${source}_${target}_${edgeIdx++}`,
          source,
          target
        });
      }
    }

    // Validate constraints
    if (graph.getEdges().length !== clampedEdgeCount) {
      throw new Error(
        `Failed to satisfy requested edgeCount (${clampedEdgeCount}): generated graph has ${graph.getEdges().length} edges.`
      );
    }
    if (graph.getBranchingNodes().length < minBranching) {
      throw new Error(
        `Failed to satisfy minBranching (${minBranching}): generated graph has ${graph.getBranchingNodes().length} branching nodes.`
      );
    }
    if (graph.getConvergenceNodes().length < minConvergence) {
      throw new Error(
        `Failed to satisfy minConvergence (${minConvergence}): generated graph has ${graph.getConvergenceNodes().length} convergence nodes.`
      );
    }
    if (!allowCycles && graph.hasCycle()) {
      throw new Error('Generated graph contains cycle despite allowCycles=false.');
    }

    // Compute metrics and update metadata
    const metrics = graph.computeDifficultyMetrics();
    graph.setMetadata({
      ...graph.getMetadata(),
      difficultyMetrics: metrics
    });

    return graph;
  }
}
