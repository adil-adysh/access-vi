import Graphology from 'graphology';
import type {
  GraphNode,
  GraphEdge,
  GraphMetadata,
  GraphDifficultyMetrics,
  SerializedGraph,
  GraphComparisonResult
} from './types.js';

/**
 * DirectedGraph provides high-level directed graph operations, traversals,
 * topological queries, metric computations, and graph comparisons.
 */
export class DirectedGraph {
  private readonly inner: Graphology;
  private metadata: GraphMetadata;

  constructor(metadata: GraphMetadata = { id: 'unnamed', name: 'Unnamed Graph' }) {
    this.inner = new Graphology({ type: 'directed', multi: false, allowSelfLoops: true });
    this.metadata = metadata;
  }

  public getMetadata(): GraphMetadata {
    return this.metadata;
  }

  public setMetadata(metadata: GraphMetadata): void {
    this.metadata = metadata;
  }

  public addNode(node: GraphNode): void {
    if (this.inner.hasNode(node.id)) {
      throw new Error(`Node with id "${node.id}" already exists.`);
    }
    this.inner.addNode(node.id, {
      label: node.label ?? node.id,
      category: node.category,
      metadata: node.metadata ?? {}
    });
  }

  public addEdge(edge: GraphEdge): void {
    if (!this.inner.hasNode(edge.source)) {
      throw new Error(`Source node "${edge.source}" does not exist.`);
    }
    if (!this.inner.hasNode(edge.target)) {
      throw new Error(`Target node "${edge.target}" does not exist.`);
    }
    if (this.inner.hasEdge(edge.source, edge.target)) {
      throw new Error(`Directed edge from "${edge.source}" to "${edge.target}" already exists.`);
    }
    this.inner.addEdgeWithKey(edge.id, edge.source, edge.target, {
      label: edge.label,
      category: edge.category,
      metadata: edge.metadata ?? {}
    });
  }

  public hasNode(nodeId: string): boolean {
    return this.inner.hasNode(nodeId);
  }

  public hasEdge(sourceId: string, targetId: string): boolean {
    return this.inner.hasEdge(sourceId, targetId);
  }

  public getNode(nodeId: string): GraphNode | null {
    if (!this.inner.hasNode(nodeId)) return null;
    const attrs = this.inner.getNodeAttributes(nodeId);
    return {
      id: nodeId,
      label: attrs.label,
      category: attrs.category,
      metadata: attrs.metadata
    };
  }

  public getNodes(): GraphNode[] {
    return this.inner.nodes().map((id) => this.getNode(id)!);
  }

  public getNodeIds(): string[] {
    return this.inner.nodes();
  }

  public getEdges(): GraphEdge[] {
    return this.inner.edges().map((key) => {
      const source = this.inner.source(key);
      const target = this.inner.target(key);
      const attrs = this.inner.getEdgeAttributes(key);
      return {
        id: key,
        source,
        target,
        label: attrs.label,
        category: attrs.category,
        metadata: attrs.metadata
      };
    });
  }

  public getOutgoingNeighbors(nodeId: string): string[] {
    if (!this.inner.hasNode(nodeId)) return [];
    return this.inner.outNeighbors(nodeId);
  }

  public getIncomingNeighbors(nodeId: string): string[] {
    if (!this.inner.hasNode(nodeId)) return [];
    return this.inner.inNeighbors(nodeId);
  }

  public getInDegree(nodeId: string): number {
    if (!this.inner.hasNode(nodeId)) return 0;
    return this.inner.inDegree(nodeId);
  }

  public getOutDegree(nodeId: string): number {
    if (!this.inner.hasNode(nodeId)) return 0;
    return this.inner.outDegree(nodeId);
  }

  public getTotalDegree(nodeId: string): number {
    if (!this.inner.hasNode(nodeId)) return 0;
    return this.inner.degree(nodeId);
  }

  public isReachable(sourceId: string, targetId: string): boolean {
    if (!this.inner.hasNode(sourceId) || !this.inner.hasNode(targetId)) return false;
    if (sourceId === targetId) return true;

    const visited = new Set<string>();
    const queue: string[] = [sourceId];
    visited.add(sourceId);

    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const neighbor of this.getOutgoingNeighbors(current)) {
        if (neighbor === targetId) return true;
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    return false;
  }

  public getReachableNodes(sourceId: string): string[] {
    if (!this.inner.hasNode(sourceId)) return [];
    const visited = new Set<string>();
    const queue: string[] = [sourceId];
    visited.add(sourceId);

    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const neighbor of this.getOutgoingNeighbors(current)) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    return Array.from(visited);
  }

  public findShortestPath(sourceId: string, targetId: string): string[] | null {
    if (!this.inner.hasNode(sourceId) || !this.inner.hasNode(targetId)) return null;
    if (sourceId === targetId) return [sourceId];

    const visited = new Set<string>();
    const parent = new Map<string, string>();
    const queue: string[] = [sourceId];
    visited.add(sourceId);

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === targetId) break;

      for (const neighbor of this.getOutgoingNeighbors(current)) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          parent.set(neighbor, current);
          queue.push(neighbor);
        }
      }
    }

    if (!visited.has(targetId)) return null;

    const path: string[] = [];
    let curr: string | undefined = targetId;
    while (curr) {
      path.unshift(curr);
      if (curr === sourceId) break;
      curr = parent.get(curr);
    }
    return path;
  }

  public findAllSimplePaths(sourceId: string, targetId: string, maxDepth: number = 10): string[][] {
    if (!this.inner.hasNode(sourceId) || !this.inner.hasNode(targetId)) return [];
    const results: string[][] = [];

    const dfs = (current: string, visited: Set<string>, currentPath: string[]) => {
      if (current === targetId) {
        results.push([...currentPath]);
        return;
      }
      if (currentPath.length >= maxDepth) return;

      for (const next of this.getOutgoingNeighbors(current)) {
        if (!visited.has(next)) {
          visited.add(next);
          currentPath.push(next);
          dfs(next, visited, currentPath);
          currentPath.pop();
          visited.delete(next);
        }
      }
    };

    dfs(sourceId, new Set([sourceId]), [sourceId]);
    return results;
  }

  public detectCycles(): string[][] {
    const nodes = this.getNodeIds();
    const nodeIndexMap = new Map<string, number>();
    nodes.forEach((id, idx) => nodeIndexMap.set(id, idx));

    const cycles: string[][] = [];

    // Johnson's elementary cycles algorithm
    for (let sIdx = 0; sIdx < nodes.length; sIdx++) {
      const startNode = nodes[sIdx];
      const blocked = new Set<string>();
      const bMap = new Map<string, Set<string>>();
      const stack: string[] = [];

      const unblock = (u: string) => {
        blocked.delete(u);
        const bSet = bMap.get(u);
        if (bSet) {
          for (const w of Array.from(bSet)) {
            bSet.delete(w);
            if (blocked.has(w)) {
              unblock(w);
            }
          }
        }
      };

      const circuit = (v: string): boolean => {
        let foundCycle = false;
        stack.push(v);
        blocked.add(v);

        // Consider only nodes in subgraph G_s (indices >= sIdx)
        const neighbors = this.getOutgoingNeighbors(v).filter(
          (nbr) => (nodeIndexMap.get(nbr) ?? -1) >= sIdx
        );

        for (const w of neighbors) {
          if (w === startNode) {
            cycles.push([...stack, startNode]);
            foundCycle = true;
          } else if (!blocked.has(w)) {
            if (circuit(w)) {
              foundCycle = true;
            }
          }
        }

        if (foundCycle) {
          unblock(v);
        } else {
          for (const w of neighbors) {
            let bSet = bMap.get(w);
            if (!bSet) {
              bSet = new Set<string>();
              bMap.set(w, bSet);
            }
            bSet.add(v);
          }
        }

        stack.pop();
        return foundCycle;
      };

      circuit(startNode);
    }

    return cycles;
  }

  public hasCycle(): boolean {
    const color = new Map<string, number>(); // 0: unvisited, 1: visiting, 2: visited
    const nodes = this.getNodeIds();
    for (const node of nodes) {
      color.set(node, 0);
    }

    const dfs = (u: string): boolean => {
      color.set(u, 1);
      for (const v of this.getOutgoingNeighbors(u)) {
        const c = color.get(v) ?? 0;
        if (c === 1) return true; // back edge found
        if (c === 0 && dfs(v)) return true;
      }
      color.set(u, 2);
      return false;
    };

    for (const node of nodes) {
      if ((color.get(node) ?? 0) === 0) {
        if (dfs(node)) return true;
      }
    }
    return false;
  }

  public getBranchingNodes(): string[] {
    return this.getNodeIds().filter((id) => this.getOutDegree(id) >= 2);
  }

  public getConvergenceNodes(): string[] {
    return this.getNodeIds().filter((id) => this.getInDegree(id) >= 2);
  }

  public computeDifficultyMetrics(): GraphDifficultyMetrics {
    const nodeCount = this.inner.order;
    const edgeCount = this.inner.size;
    const maxPossibleEdges = nodeCount > 1 ? nodeCount * (nodeCount - 1) : 1;
    const density = nodeCount > 1 ? edgeCount / maxPossibleEdges : 0;

    let totalIn = 0;
    let totalOut = 0;
    let maxInDegree = 0;
    let maxOutDegree = 0;

    for (const id of this.getNodeIds()) {
      const inDeg = this.getInDegree(id);
      const outDeg = this.getOutDegree(id);
      totalIn += inDeg;
      totalOut += outDeg;
      if (inDeg > maxInDegree) maxInDegree = inDeg;
      if (outDeg > maxOutDegree) maxOutDegree = outDeg;
    }

    const avgInDegree = nodeCount > 0 ? totalIn / nodeCount : 0;
    const avgOutDegree = nodeCount > 0 ? totalOut / nodeCount : 0;

    const cycles = this.detectCycles();
    const cycleCount = cycles.length;
    const hasCycles = cycleCount > 0;
    const branchingNodes = this.getBranchingNodes();
    const convergenceNodes = this.getConvergenceNodes();

    let totalShortestPath = 0;
    let pathPairs = 0;
    let diameter = 0;

    const nodeIds = this.getNodeIds();
    for (let i = 0; i < nodeIds.length; i++) {
      for (let j = 0; j < nodeIds.length; j++) {
        if (i !== j) {
          const path = this.findShortestPath(nodeIds[i], nodeIds[j]);
          if (path) {
            const length = path.length - 1;
            totalShortestPath += length;
            pathPairs++;
            if (length > diameter) diameter = length;
          }
        }
      }
    }

    const avgShortestPathLength = pathPairs > 0 ? totalShortestPath / pathPairs : 0;

    return {
      nodeCount,
      edgeCount,
      density,
      avgInDegree,
      avgOutDegree,
      maxInDegree,
      maxOutDegree,
      cycleCount,
      hasCycles,
      branchingNodes,
      convergenceNodes,
      avgShortestPathLength,
      diameter
    };
  }

  public toJSON(): SerializedGraph {
    const difficultyMetrics = this.computeDifficultyMetrics();
    return {
      metadata: {
        ...this.metadata,
        difficultyMetrics
      },
      nodes: this.getNodes(),
      edges: this.getEdges()
    };
  }

  public static fromJSON(json: SerializedGraph): DirectedGraph {
    if (!json || typeof json !== 'object') {
      throw new Error('Invalid graph JSON: root must be an object.');
    }
    if (!Array.isArray(json.nodes) || !Array.isArray(json.edges)) {
      throw new Error('Invalid graph JSON: nodes and edges arrays are required.');
    }

    const graph = new DirectedGraph(json.metadata ?? { id: 'imported', name: 'Imported Graph' });

    for (const node of json.nodes) {
      if (!node.id || typeof node.id !== 'string') {
        throw new Error('Invalid node: id must be a non-empty string.');
      }
      graph.addNode(node);
    }

    for (const edge of json.edges) {
      if (!edge.id || !edge.source || !edge.target) {
        throw new Error('Invalid edge: id, source, and target are required.');
      }
      graph.addEdge(edge);
    }

    return graph;
  }

  public computeHash(): string {
    const nodeIds = [...this.getNodeIds()].sort();
    const edges = this.getEdges()
      .map((e) => `${e.source}->${e.target}`)
      .sort();
    const str = `${nodeIds.join(',')}|${edges.join(';')}`;
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
  }

  public static compareReconstruction(
    groundTruth: DirectedGraph,
    reconstructedEdges: Array<{ source: string; target: string }>
  ): GraphComparisonResult {
    const truthEdgesSet = new Set(
      groundTruth.getEdges().map((e) => `${e.source}->${e.target}`)
    );

    // Sanitize reconstructed edges
    const validReconstructed: Array<{ source: string; target: string }> = [];
    for (const e of reconstructedEdges ?? []) {
      if (
        e &&
        typeof e.source === 'string' &&
        typeof e.target === 'string' &&
        e.source.trim() &&
        e.target.trim()
      ) {
        validReconstructed.push({ source: e.source.trim(), target: e.target.trim() });
      }
    }

    const reconstructedSet = new Set(
      validReconstructed.map((e) => `${e.source}->${e.target}`)
    );

    const matchedEdges: Array<{ source: string; target: string }> = [];
    const extraEdges: Array<{ source: string; target: string }> = [];
    const missingEdges: Array<{ source: string; target: string }> = [];

    for (const edgeStr of reconstructedSet) {
      const parts = edgeStr.split('->');
      const source = parts[0];
      const target = parts.slice(1).join('->');
      if (truthEdgesSet.has(edgeStr)) {
        matchedEdges.push({ source, target });
      } else {
        extraEdges.push({ source, target });
      }
    }

    for (const edgeStr of truthEdgesSet) {
      const parts = edgeStr.split('->');
      const source = parts[0];
      const target = parts.slice(1).join('->');
      if (!reconstructedSet.has(edgeStr)) {
        missingEdges.push({ source, target });
      }
    }

    let precision = 0;
    let recall = 0;

    if (truthEdgesSet.size === 0 && reconstructedSet.size === 0) {
      precision = 1.0;
      recall = 1.0;
    } else if (reconstructedSet.size === 0) {
      precision = 0.0;
      recall = 0.0;
    } else if (truthEdgesSet.size === 0) {
      precision = 0.0;
      recall = 1.0;
    } else {
      precision = matchedEdges.length / reconstructedSet.size;
      recall = matchedEdges.length / truthEdgesSet.size;
    }

    const f1Score =
      precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    const exactMatch = missingEdges.length === 0 && extraEdges.length === 0;

    return {
      precision,
      recall,
      f1Score,
      missingEdges,
      extraEdges,
      matchedEdges,
      exactMatch
    };
  }
}
