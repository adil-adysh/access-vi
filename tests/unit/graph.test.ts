import { describe, it, expect } from 'vitest';
import { DirectedGraph } from '../../src/domain/graph/Graph.js';
import { GraphParser } from '../../src/domain/graph/parser.js';
import { DeterministicGraphGenerator } from '../../src/domain/graph/generator.js';
import { getSampleGraphs } from '../../src/research/datasets/sampleGraphs.js';

describe('DirectedGraph Domain Model', () => {
  it('creates nodes and edges, rejects duplicates and invalid links', () => {
    const graph = new DirectedGraph({ id: 'test', name: 'Test' });
    graph.addNode({ id: 'A', label: 'Node A' });
    graph.addNode({ id: 'B', label: 'Node B' });

    expect(() => graph.addNode({ id: 'A' })).toThrow('already exists');
    expect(() => graph.addEdge({ id: 'e1', source: 'A', target: 'C' })).toThrow('does not exist');

    graph.addEdge({ id: 'e1', source: 'A', target: 'B' });
    expect(graph.hasEdge('A', 'B')).toBe(true);
    expect(() => graph.addEdge({ id: 'e2', source: 'A', target: 'B' })).toThrow('already exists');
  });

  it('queries incoming and outgoing neighbors correctly', () => {
    const graph = new DirectedGraph();
    graph.addNode({ id: 'A' });
    graph.addNode({ id: 'B' });
    graph.addNode({ id: 'C' });
    graph.addEdge({ id: 'e1', source: 'A', target: 'B' });
    graph.addEdge({ id: 'e2', source: 'A', target: 'C' });

    expect(graph.getOutgoingNeighbors('A')).toEqual(['B', 'C']);
    expect(graph.getIncomingNeighbors('B')).toEqual(['A']);
    expect(graph.getInDegree('B')).toBe(1);
    expect(graph.getOutDegree('A')).toBe(2);
    expect(graph.getBranchingNodes()).toEqual(['A']);
    expect(graph.getConvergenceNodes()).toEqual([]);
  });

  it('detects reachability and pathfinding', () => {
    const graph = new DirectedGraph();
    ['A', 'B', 'C', 'D'].forEach((id) => graph.addNode({ id }));
    graph.addEdge({ id: 'e1', source: 'A', target: 'B' });
    graph.addEdge({ id: 'e2', source: 'B', target: 'C' });
    graph.addEdge({ id: 'e3', source: 'A', target: 'C' });

    expect(graph.isReachable('A', 'C')).toBe(true);
    expect(graph.isReachable('C', 'A')).toBe(false);
    expect(graph.isReachable('A', 'D')).toBe(false);

    const shortestPath = graph.findShortestPath('A', 'C');
    expect(shortestPath).toEqual(['A', 'C']);

    const allPaths = graph.findAllSimplePaths('A', 'C');
    expect(allPaths).toHaveLength(2);
    expect(allPaths).toContainEqual(['A', 'C']);
    expect(allPaths).toContainEqual(['A', 'B', 'C']);
  });

  it('detects cycles correctly', () => {
    const graph = new DirectedGraph();
    ['A', 'B', 'C'].forEach((id) => graph.addNode({ id }));
    graph.addEdge({ id: 'e1', source: 'A', target: 'B' });
    graph.addEdge({ id: 'e2', source: 'B', target: 'C' });
    expect(graph.hasCycle()).toBe(false);

    graph.addEdge({ id: 'e3', source: 'C', target: 'A' });
    expect(graph.hasCycle()).toBe(true);
    const cycles = graph.detectCycles();
    expect(cycles.length).toBeGreaterThan(0);
  });

  it('computes difficulty metrics accurately', () => {
    const graph = new DirectedGraph();
    ['A', 'B', 'C', 'D'].forEach((id) => graph.addNode({ id }));
    graph.addEdge({ id: 'e1', source: 'A', target: 'B' });
    graph.addEdge({ id: 'e2', source: 'A', target: 'C' });
    graph.addEdge({ id: 'e3', source: 'B', target: 'D' });
    graph.addEdge({ id: 'e4', source: 'C', target: 'D' });

    const metrics = graph.computeDifficultyMetrics();
    expect(metrics.nodeCount).toBe(4);
    expect(metrics.edgeCount).toBe(4);
    expect(metrics.branchingNodes).toContain('A');
    expect(metrics.convergenceNodes).toContain('D');
    expect(metrics.hasCycles).toBe(false);
  });

  it('evaluates graph reconstruction precision, recall, and f1', () => {
    const groundTruth = new DirectedGraph();
    ['A', 'B', 'C'].forEach((id) => groundTruth.addNode({ id }));
    groundTruth.addEdge({ id: 'e1', source: 'A', target: 'B' });
    groundTruth.addEdge({ id: 'e2', source: 'B', target: 'C' });

    // Perfect reconstruction
    const perfect = DirectedGraph.compareReconstruction(groundTruth, [
      { source: 'A', target: 'B' },
      { source: 'B', target: 'C' }
    ]);
    expect(perfect.exactMatch).toBe(true);
    expect(perfect.precision).toBe(1.0);
    expect(perfect.recall).toBe(1.0);
    expect(perfect.f1Score).toBe(1.0);

    // Partial reconstruction with false positive
    const partial = DirectedGraph.compareReconstruction(groundTruth, [
      { source: 'A', target: 'B' },
      { source: 'A', target: 'C' } // Extra edge, missing B->C
    ]);
    expect(partial.exactMatch).toBe(false);
    expect(partial.matchedEdges).toHaveLength(1);
    expect(partial.extraEdges).toHaveLength(1);
    expect(partial.missingEdges).toHaveLength(1);
    expect(partial.precision).toBe(0.5);
    expect(partial.recall).toBe(0.5);
    expect(partial.f1Score).toBe(0.5);
  });
});

describe('Graph Parser', () => {
  it('parses Graphviz DOT format with attributes', () => {
    const dot = `
      digraph Sample {
        "A" [label="First Node", category="hub"];
        "B" [label="Second Node"];
        "A" -> "B" [label="connects"];
      }
    `;
    const graph = GraphParser.parseDOT(dot, 'sample');
    expect(graph.getNodeIds()).toEqual(['A', 'B']);
    expect(graph.getNode('A')?.label).toBe('First Node');
    expect(graph.getNode('A')?.category).toBe('hub');
    expect(graph.getEdges()).toHaveLength(1);
    expect(graph.getEdges()[0].source).toBe('A');
    expect(graph.getEdges()[0].target).toBe('B');
  });

  it('exports to DOT and roundtrips', () => {
    const graph = new DirectedGraph({ id: 'g1', name: 'Roundtrip' });
    graph.addNode({ id: 'X', label: 'Node X' });
    graph.addNode({ id: 'Y', label: 'Node Y' });
    graph.addEdge({ id: 'e1', source: 'X', target: 'Y', label: 'to' });

    const dot = GraphParser.exportDOT(graph);
    expect(dot).toContain('digraph Roundtrip');
    expect(dot).toContain('"X" -> "Y"');

    const reparsed = GraphParser.parseDOT(dot, 'reparsed');
    expect(reparsed.getNodeIds()).toEqual(['X', 'Y']);
    expect(reparsed.hasEdge('X', 'Y')).toBe(true);
  });

  it('parses and serializes JSON format', () => {
    const graph = new DirectedGraph({ id: 'j1', name: 'JSON Graph' });
    graph.addNode({ id: 'N1', label: 'Node 1' });
    graph.addNode({ id: 'N2', label: 'Node 2' });
    graph.addEdge({ id: 'e1', source: 'N1', target: 'N2' });

    const json = JSON.stringify(graph.toJSON());
    const parsed = GraphParser.parseJSON(json);
    expect(parsed.getNodeIds()).toEqual(['N1', 'N2']);
    expect(parsed.hasEdge('N1', 'N2')).toBe(true);
  });
});

describe('Deterministic Graph Generator', () => {
  it('generates identical graphs given identical seeds and options', () => {
    const g1 = DeterministicGraphGenerator.generate({ seed: 42, nodeCount: 6, edgeCount: 8 });
    const g2 = DeterministicGraphGenerator.generate({ seed: 42, nodeCount: 6, edgeCount: 8 });

    expect(g1.getNodeIds()).toEqual(g2.getNodeIds());
    expect(g1.getEdges().map((e) => `${e.source}->${e.target}`)).toEqual(
      g2.getEdges().map((e) => `${e.source}->${e.target}`)
    );
  });

  it('generates distinct graphs for different seeds', () => {
    const g1 = DeterministicGraphGenerator.generate({ seed: 42, nodeCount: 6, edgeCount: 8 });
    const g2 = DeterministicGraphGenerator.generate({ seed: 99, nodeCount: 6, edgeCount: 8 });

    const edges1 = g1.getEdges().map((e) => `${e.source}->${e.target}`);
    const edges2 = g2.getEdges().map((e) => `${e.source}->${e.target}`);
    expect(edges1).not.toEqual(edges2);
  });

  it('respects cycle constraints when allowCycles is false', () => {
    const g = DeterministicGraphGenerator.generate({
      seed: 1234,
      nodeCount: 7,
      edgeCount: 10,
      allowCycles: false
    });
    expect(g.hasCycle()).toBe(false);
  });
});

describe('Sample Datasets', () => {
  it('loads all standard research graphs with correct structures', () => {
    const datasets = getSampleGraphs();
    expect(Object.keys(datasets)).toHaveLength(6);

    const exp1 = datasets['graph-exp-1'];
    expect(exp1.getBranchingNodes()).toContain('A');
    expect(exp1.getBranchingNodes()).toContain('D');
    expect(exp1.getConvergenceNodes()).toContain('D');

    const exp2 = datasets['graph-exp-2'];
    expect(exp2.hasCycle()).toBe(true);

    const exp3 = datasets['graph-exp-3'];
    expect(exp3.getNodeIds()).toHaveLength(9);
  });

  it('anonymizes graph titles and descriptions to prevent experimental answer leaks', () => {
    const datasets = getSampleGraphs();
    for (const [, g] of Object.entries(datasets)) {
      const meta = g.getMetadata();
      expect(meta.name).not.toMatch(/cycle/i);
      expect(meta.name).not.toMatch(/feedback/i);
      expect(meta.name).not.toMatch(/diamond/i);
      expect(meta.description ?? '').not.toMatch(/cycle/i);
      expect(meta.description ?? '').not.toMatch(/feedback/i);
    }
  });

  it('enumerates all elementary simple cycles without duplicate permutations', () => {
    const g = new DirectedGraph({ id: 'cycles', name: 'Cycles' });
    ['A', 'B', 'C', 'D'].forEach((id) => g.addNode({ id }));
    // Cycle 1: A -> B -> A
    g.addEdge({ id: 'e1', source: 'A', target: 'B' });
    g.addEdge({ id: 'e2', source: 'B', target: 'A' });
    // Cycle 2: B -> C -> D -> B
    g.addEdge({ id: 'e3', source: 'B', target: 'C' });
    g.addEdge({ id: 'e4', source: 'C', target: 'D' });
    g.addEdge({ id: 'e5', source: 'D', target: 'B' });

    const cycles = g.detectCycles();
    expect(cycles).toHaveLength(2);

    // Verify first cycle is A-B-A
    const cycle1 = cycles.find((c) => c.length === 3);
    expect(cycle1).toEqual(['A', 'B', 'A']);

    // Verify second cycle is B-C-D-B
    const cycle2 = cycles.find((c) => c.length === 4);
    expect(cycle2).toEqual(['B', 'C', 'D', 'B']);
  });

  it('computes deterministic graph hash matching identical topologies', () => {
    const g1 = new DirectedGraph({ id: 'g1', name: 'G1' });
    ['A', 'B', 'C'].forEach((id) => g1.addNode({ id }));
    g1.addEdge({ id: 'e1', source: 'A', target: 'B' });
    g1.addEdge({ id: 'e2', source: 'B', target: 'C' });

    const g2 = new DirectedGraph({ id: 'g2', name: 'G2' });
    ['B', 'A', 'C'].forEach((id) => g2.addNode({ id })); // added in different order
    g2.addEdge({ id: 'e2', source: 'B', target: 'C' });
    g2.addEdge({ id: 'e1', source: 'A', target: 'B' });

    expect(g1.computeHash()).toBe(g2.computeHash());

    // Modify g2 by adding an edge
    g2.addEdge({ id: 'e3', source: 'A', target: 'C' });
    expect(g1.computeHash()).not.toBe(g2.computeHash());
  });

  it('parses DOT graphs with spaces in quoted node identifiers', () => {
    const dot = `
      digraph SpacesNet {
        "Start Node" -> "Middle Hub";
        "Middle Hub" -> "End Node";
      }
    `;
    const g = GraphParser.parseDOT(dot, 'spaces');
    expect(g.getNodeIds()).toEqual(['Start Node', 'Middle Hub', 'End Node']);
    expect(g.hasEdge('Start Node', 'Middle Hub')).toBe(true);
    expect(g.hasEdge('Middle Hub', 'End Node')).toBe(true);
  });

  it('rejects graph generation when requested constraints cannot be satisfied', () => {
    expect(() => {
      DeterministicGraphGenerator.generate({
        seed: 42,
        nodeCount: 5,
        edgeCount: 2 // impossible: 5 nodes need at least 4 edges to connect
      });
    }).toThrow(/less than minimum/i);
  });
});
