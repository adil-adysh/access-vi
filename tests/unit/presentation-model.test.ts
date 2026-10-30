import { describe, it, expect } from 'vitest';
import {
  normalizeShape,
  resolveNodePresentation,
  resolveEdgePresentation,
  DEFAULT_NODE_SHAPE,
  SUPPORTED_NODE_SHAPES
} from '../../src/domain/presentation/types.js';
import { GraphParser } from '../../src/domain/graph/parser.js';
import { DirectedGraph } from '../../src/domain/graph/Graph.js';

describe('Shared Presentation Model (Phase 1)', () => {
  it('supports circle, rectangle, and diamond as core shapes', () => {
    expect(SUPPORTED_NODE_SHAPES).toContain('circle');
    expect(SUPPORTED_NODE_SHAPES).toContain('rectangle');
    expect(SUPPORTED_NODE_SHAPES).toContain('diamond');
  });

  it('normalizes shape variants (e.g., box -> rectangle, rect -> rectangle)', () => {
    expect(normalizeShape('circle').shape).toBe('circle');
    expect(normalizeShape('box').shape).toBe('rectangle');
    expect(normalizeShape('rect').shape).toBe('rectangle');
    expect(normalizeShape('rectangle').shape).toBe('rectangle');
    expect(normalizeShape('diamond').shape).toBe('diamond');
    expect(normalizeShape('rhombus').shape).toBe('diamond');
  });

  it('defaults to single default shape (circle) when shape metadata is missing', () => {
    const resNull = normalizeShape(null);
    const resUndefined = normalizeShape(undefined);
    const resEmpty = normalizeShape('');

    expect(resNull.shape).toBe(DEFAULT_NODE_SHAPE);
    expect(resNull.isFallback).toBe(false);

    expect(resUndefined.shape).toBe(DEFAULT_NODE_SHAPE);
    expect(resUndefined.isFallback).toBe(false);

    expect(resEmpty.shape).toBe(DEFAULT_NODE_SHAPE);
    expect(resEmpty.isFallback).toBe(false);
  });

  it('provides a documented, deterministic fallback for unsupported or unknown shapes', () => {
    const resHex = normalizeShape('hexagon');
    expect(resHex.shape).toBe(DEFAULT_NODE_SHAPE); // Falls back to circle
    expect(resHex.isFallback).toBe(true);
    expect(resHex.rawShape).toBe('hexagon');

    const resOct = normalizeShape('octagon');
    expect(resOct.shape).toBe(DEFAULT_NODE_SHAPE);
    expect(resOct.isFallback).toBe(true);
    expect(resOct.rawShape).toBe('octagon');

    // Verify resolveNodePresentation reflects the documented fallback in accessibility description
    const nodePresentation = resolveNodePresentation({
      id: 'N1',
      presentation: { shape: 'star' }
    });
    expect(nodePresentation.shape).toBe('circle');
    expect(nodePresentation.isFallback).toBe(true);
    expect(nodePresentation.shapeDescription).toContain('Fallback Circle');
    expect(nodePresentation.shapeDescription).toContain('unsupported shape "star"');
  });

  it('never infers shape from node ID or label (Rule A & B)', () => {
    const nodeA = resolveNodePresentation({ id: 'circle', label: 'Diamond Server' });
    // Without explicit presentation/shape metadata, must default to circle, not infer from label 'Diamond Server'
    expect(nodeA.shape).toBe(DEFAULT_NODE_SHAPE);
    expect(nodeA.isFallback).toBe(false);

    const nodeB = resolveNodePresentation({ id: 'rect_01', label: 'box' });
    expect(nodeB.shape).toBe(DEFAULT_NODE_SHAPE);
  });

  it('preserves presentation metadata in DirectedGraph serialization and deserialization', () => {
    const graph = new DirectedGraph({ id: 'test-g', name: 'Presentation Test' });
    graph.addNode({
      id: 'A',
      label: 'Node Alpha',
      presentation: { shape: 'rectangle', fillColor: '#ff0000' }
    });
    graph.addNode({
      id: 'B',
      label: 'Node Beta',
      presentation: { shape: 'diamond' }
    });
    graph.addEdge({
      id: 'e1',
      source: 'A',
      target: 'B',
      presentation: { lineStyle: 'dashed', geometryVariation: 'curved' }
    });

    const json = graph.toJSON();
    const restored = DirectedGraph.fromJSON(json);

    const nodeA = restored.getNode('A');
    expect(nodeA).not.toBeNull();
    expect(nodeA?.presentation?.shape).toBe('rectangle');
    expect(nodeA?.presentation?.fillColor).toBe('#ff0000');

    const nodeB = restored.getNode('B');
    expect(nodeB).not.toBeNull();
    expect(nodeB?.presentation?.shape).toBe('diamond');

    const edge = restored.getEdges().find((e) => e.id === 'e1');
    expect(edge).not.toBeNull();
    expect(edge?.presentation?.geometryVariation).toBe('curved');
    expect(edge?.presentation?.lineStyle).toBe('dashed');
  });

  it('extracts shape and decorative geometry attributes from DOT format', () => {
    const dot = `
      digraph Test {
        A [shape=box, label="Alpha"];
        B [shape=diamond, label="Beta"];
        C [shape=circle];
        A -> B [geometryVariation=curved];
        B -> C [geometryVariation=step];
      }
    `;

    const graph = GraphParser.parseDOT(dot);

    const nodeA = graph.getNode('A');
    expect(nodeA?.presentation?.shape).toBe('rectangle');

    const nodeB = graph.getNode('B');
    expect(nodeB?.presentation?.shape).toBe('diamond');

    const nodeC = graph.getNode('C');
    expect(nodeC?.presentation?.shape).toBe('circle');

    const edges = graph.getEdges();
    const eAB = edges.find((e) => e.source === 'A' && e.target === 'B');
    expect(eAB?.presentation?.geometryVariation).toBe('curved');

    const eBC = edges.find((e) => e.source === 'B' && e.target === 'C');
    expect(eBC?.presentation?.geometryVariation).toBe('step');

    // Export round-trip
    const exportedDot = GraphParser.exportDOT(graph);
    expect(exportedDot).toContain('shape="rectangle"');
    expect(exportedDot).toContain('shape="diamond"');
    expect(exportedDot).toContain('shape="circle"');
  });

  it('resolves edge presentations with decorative geometry invariance', () => {
    const edgeStraight = resolveEdgePresentation({
      source: 'A',
      target: 'B',
      presentation: { geometryVariation: 'straight' }
    });
    const edgeCurved = resolveEdgePresentation({
      source: 'A',
      target: 'B',
      presentation: { geometryVariation: 'curved' }
    });
    const edgeStep = resolveEdgePresentation({
      source: 'A',
      target: 'B',
      presentation: { geometryVariation: 'step' }
    });

    expect(edgeStraight.geometryVariation).toBe('straight');
    expect(edgeCurved.geometryVariation).toBe('curved');
    expect(edgeStep.geometryVariation).toBe('step');

    // All represent the same underlying directed edge between A and B
    expect(edgeStraight.ariaLabel).toContain('from A to B');
    expect(edgeCurved.ariaLabel).toContain('from A to B');
    expect(edgeStep.ariaLabel).toContain('from A to B');
  });

  it('correctly announces unsupported shapes with warning and preserved original shape (Fix 7)', () => {
    const nodePresentation = resolveNodePresentation({
      id: 'N_status',
      label: 'Status Node',
      presentation: { shape: 'hexagon' }
    });

    expect(nodePresentation.shape).toBe('circle');
    expect(nodePresentation.isFallback).toBe(true);
    expect(nodePresentation.originalDeclaredShape).toBe('hexagon');
    expect(nodePresentation.fallbackReason).toContain('Unsupported shape "hexagon"');
    expect(nodePresentation.ariaLabel).toBe(
      'Status Node, hexagon shape (unsupported, mapped to circle sound and visual)'
    );
  });

  it('preserves presentation styling (colors, stroke, geometry) during DOT roundtrip (Fix 8)', () => {
    const dot = `
      digraph Stylized {
        A [shape=box, fillcolor="#112233", color="#445566", style="dashed", label="Node A"];
        B [shape=diamond, fillcolor="#778899", color="#aabbcc", label="Node B"];
        C [shape=hexagon, label="Node C"];
        A -> B [geometryVariation=curved, style="dotted", color="#123456"];
        B -> C [geometryVariation=step];
      }
    `;

    const parsed1 = GraphParser.parseDOT(dot);
    const exported1 = GraphParser.exportDOT(parsed1);
    const parsed2 = GraphParser.parseDOT(exported1);

    const a2 = parsed2.getNode('A')!;
    expect(a2.presentation?.shape).toBe('rectangle');
    expect(a2.presentation?.fillColor).toBe('#112233');
    expect(a2.presentation?.strokeColor).toBe('#445566');
    expect(a2.presentation?.strokeStyle).toBe('dashed');

    const c2 = parsed2.getNode('C')!;
    expect(c2.presentation?.shape).toBe('circle');
    expect(c2.presentation?.isFallback).toBe(true);
    expect(c2.presentation?.originalDeclaredShape).toBe('hexagon');

    const edgeAB = parsed2.getEdges().find((e) => e.source === 'A' && e.target === 'B')!;
    expect(edgeAB.presentation?.geometryVariation).toBe('curved');
    expect(edgeAB.presentation?.lineStyle).toBe('dotted');
    expect(edgeAB.presentation?.strokeColor).toBe('#123456');
  });

  it('computes weakly connected components for discovering disconnected graph structures', () => {
    const graph = new DirectedGraph({ id: 'comp-test', name: 'Components Test' });
    // Component 1: A -> B
    graph.addNode({ id: 'A' });
    graph.addNode({ id: 'B' });
    graph.addEdge({ id: 'e1', source: 'A', target: 'B' });

    // Component 2: C -> D -> E
    graph.addNode({ id: 'C' });
    graph.addNode({ id: 'D' });
    graph.addNode({ id: 'E' });
    graph.addEdge({ id: 'e2', source: 'C', target: 'D' });
    graph.addEdge({ id: 'e3', source: 'D', target: 'E' });

    // Component 3: Isolated node F
    graph.addNode({ id: 'F' });

    const components = graph.getWeaklyConnectedComponents();
    expect(components.length).toBe(3);

    const comp1 = components.find((c) => c.includes('A'))!;
    expect(comp1).toContain('A');
    expect(comp1).toContain('B');
    expect(comp1.length).toBe(2);

    const comp2 = components.find((c) => c.includes('C'))!;
    expect(comp2).toContain('C');
    expect(comp2).toContain('D');
    expect(comp2).toContain('E');
    expect(comp2.length).toBe(3);

    const comp3 = components.find((c) => c.includes('F'))!;
    expect(comp3).toEqual(['F']);
  });
});
