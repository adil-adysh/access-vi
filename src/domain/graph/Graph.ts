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
    const cycles: string[][] = [];
    const nodes = this.getNodeIds();
    const visitedGlobal = new Set<string>();

    for (const startNode of nodes) {
      if (visitedGlobal.has(startNode)) continue;

      const stack: string[] = [];
      const onStack = new Set<string>();
      const visitedLocal = new Set<string>();

      const dfs = (node: string) => {
        visitedLocal.add(node);
        visitedGlobal.add(node);
        stack.push(node);
        onStack.add(node);

        for (const neighbor of this.getOutgoingNeighbors(node)) {
          if (!visitedLocal.has(neighbor)) {
            dfs(neighbor);
          } else if (onStack.has(neighbor)) {
            const cycleStartIndex = stack.indexOf(neighbor);
            if (cycleStartIndex !== -1) {
              const cycle = stack.slice(cycleStartIndex);
              cycles.push([...cycle, neighbor]);
            }
          }
        }

        stack.pop();
        onStack.delete(node);
      };

      dfs(startNode);
    }

    return cycles;
  }

  public hasCycle(): boolean {
    return this.detectCycles().length > 0;
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

  public static compareReconstruction(
    groundTruth: DirectedGraph,
    reconstructedEdges: Array<{ source: string; target: string }>
  ): GraphComparisonResult {
    const truthEdgesSet = new Set(
      groundTruth.getEdges().map((e) => `${e.source}->${e.target}`)
    );

    const reconstructedSet = new Set(
      reconstructedEdges.map((e) => `${e.source}->${e.target}`)
    );

    const matchedEdges: Array<{ source: string; target: string }> = [];
    const extraEdges: Array<{ source: string; target: string }> = [];
    const missingEdges: Array<{ source: string; target: string }> = [];

    for (const edgeStr of reconstructedSet) {
      const [source, target] = edgeStr.split('->');
      if (truthEdgesSet.has(edgeStr)) {
        matchedEdges.push({ source, target });
      } else {
        extraEdges.push({ source, target });
      }
    }

    for (const edgeStr of truthEdgesSet) {
      const [source, target] = edgeStr.split('->');
      if (!reconstructedSet.has(edgeStr)) {
        missingEdges.push({ source, target });
      }
    }

    const precision =
      reconstructedSet.size > 0 ? matchedEdges.length / reconstructedSet.size : truthEdgesSet.size === 0 ? 1 : 0;
    const recall =
      truthEdgesSet.size > 0 ? matchedEdges.length / truthEdgesSet.size : reconstructedSet.size === 0 ? 1 : 0;
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
