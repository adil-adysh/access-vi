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
    const clampedEdgeCount = Math.min(Math.max(nodeCount - 1, edgeCount), maxEdges);

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
    let currentBranching = graph.getBranchingNodes().length;
    let attempts = 0;
    while (currentBranching < minBranching && graph.getEdges().length < clampedEdgeCount && attempts < 100) {
      attempts++;
      const source = nodeIds[prng.nextInt(0, nodeCount - 1)];
      const target = nodeIds[prng.nextInt(0, nodeCount - 1)];
      if (source !== target && !graph.hasEdge(source, target)) {
        if (!allowCycles) {
          if (graph.isReachable(target, source)) continue; // would create cycle
        }
        graph.addEdge({
          id: `e_${source}_${target}_${edgeIdx++}`,
          source,
          target
        });
        currentBranching = graph.getBranchingNodes().length;
      }
    }

    // Step 3: Add convergence if requested
    let currentConvergence = graph.getConvergenceNodes().length;
    attempts = 0;
    while (currentConvergence < minConvergence && graph.getEdges().length < clampedEdgeCount && attempts < 100) {
      attempts++;
      const source = nodeIds[prng.nextInt(0, nodeCount - 1)];
      const target = nodeIds[prng.nextInt(0, nodeCount - 1)];
      if (source !== target && !graph.hasEdge(source, target)) {
        if (!allowCycles) {
          if (graph.isReachable(target, source)) continue; // would create cycle
        }
        graph.addEdge({
          id: `e_${source}_${target}_${edgeIdx++}`,
          source,
          target
        });
        currentConvergence = graph.getConvergenceNodes().length;
      }
    }

    // Step 4: Fill remaining edges up to clampedEdgeCount
    attempts = 0;
    while (graph.getEdges().length < clampedEdgeCount && attempts < 200) {
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

    // Compute metrics and update metadata
    const metrics = graph.computeDifficultyMetrics();
    graph.setMetadata({
      ...graph.getMetadata(),
      difficultyMetrics: metrics
    });

    return graph;
  }
}
