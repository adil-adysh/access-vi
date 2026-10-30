import { describe, it, expect, beforeEach } from 'vitest';
import { DirectedGraph } from '../../src/domain/graph/Graph.js';
import { ExplorationController } from '../../src/domain/navigation/ExplorationController.js';
import { AudioCoordinator } from '../../src/audio/AudioCoordinator.js';
import { ParitySonificationStrategy } from '../../src/audio/sonification/ParitySonificationStrategy.js';
import { LegacySonificationStrategy } from '../../src/audio/sonification/LegacySonificationStrategy.js';
import { SpeechOnlyStrategy } from '../../src/audio/sonification/SpeechOnlyStrategy.js';
import { resolveNodePresentation } from '../../src/domain/presentation/types.js';

describe('Graph Explorer Visual-Auditory Parity Integration', () => {
  let graph: DirectedGraph;
  let controller: ExplorationController;
  let audioCoordinator: AudioCoordinator;
  let announcements: string[];

  beforeEach(() => {
    graph = new DirectedGraph({ id: 'test-g', name: 'Parity Test Graph' });
    graph.addNode({
      id: 'A',
      label: 'Authentication Service',
      presentation: { shape: 'circle' }
    });
    graph.addNode({
      id: 'B',
      label: 'Database Core',
      presentation: { shape: 'rectangle' }
    });
    graph.addNode({
      id: 'C',
      label: 'Security Firewall',
      presentation: { shape: 'diamond' }
    });
    graph.addNode({
      id: 'D',
      label: 'Legacy Gateway',
      presentation: { shape: 'octagon' } // Unsupported shape -> fallback
    });

    graph.addEdge({ id: 'e1', source: 'A', target: 'B', label: 'queries' });
    graph.addEdge({ id: 'e2', source: 'B', target: 'C', label: 'validates' });
    // Note: D is disconnected (component 2)

    controller = new ExplorationController(graph);
    audioCoordinator = new AudioCoordinator();

    announcements = [];
    controller.onAnnouncement((msg) => {
      announcements.push(msg);
    });
  });

  it('uses ParitySonificationStrategy by default and generates category tone matching node shape', () => {
    const strat = audioCoordinator.getStrategy();
    expect(strat).toBeInstanceOf(ParitySonificationStrategy);
    expect(strat.version).toBe('visual-auditory-parity-v1');

    // Node A is circle: generates 300 Hz sine wave tone
    const seqA = strat.mapEventToSequence(
      {
        type: 'NODE_FOCUS',
        nodeId: 'A',
        nodeIndex: 0,
        totalNodes: 4,
        direction: 'outgoing',
        neighborIds: ['B'],
        isSpatial: false
      },
      audioCoordinator.getConfig(),
      graph
    );

    expect(seqA).not.toBeNull();
    expect(seqA!.notes.length).toBeGreaterThan(0);
    const rootNote = seqA!.notes[0].tone;
    expect(rootNote.waveform).toBe('sine');
    expect(rootNote.frequency).toBe(300); // Constant carrier, no ID pitch!

    // Node B is rectangle: generates 300 Hz triangle wave tone
    const seqB = strat.mapEventToSequence(
      {
        type: 'NODE_FOCUS',
        nodeId: 'B',
        nodeIndex: 1,
        totalNodes: 4,
        direction: 'outgoing',
        neighborIds: ['C'],
        isSpatial: false
      },
      audioCoordinator.getConfig(),
      graph
    );
    expect(seqB!.notes[0].tone.waveform).toBe('triangle');
    expect(seqB!.notes[0].tone.frequency).toBe(300);

    // Node C is diamond: generates 300 Hz square wave tone
    const seqC = strat.mapEventToSequence(
      {
        type: 'NODE_FOCUS',
        nodeId: 'C',
        nodeIndex: 2,
        totalNodes: 4,
        direction: 'outgoing',
        neighborIds: [],
        isSpatial: false
      },
      audioCoordinator.getConfig(),
      graph
    );
    expect(seqC!.notes[0].tone.waveform).toBe('square');
    expect(seqC!.notes[0].tone.frequency).toBe(300);
  });

  it('tracks visited nodes during navigation', () => {
    const state0 = controller.getState();
    expect(state0.currentNodeId).toBe('A');
    expect(state0.visitedNodeIds).toContain('A');
    expect(state0.visitedNodeIds).not.toContain('B');

    // Traverse A -> B
    const traversed = controller.traverseSelectedNeighbor();
    expect(traversed).toBe(true);

    const state1 = controller.getState();
    expect(state1.currentNodeId).toBe('B');
    expect(state1.visitedNodeIds).toContain('A');
    expect(state1.visitedNodeIds).toContain('B');
  });

  it('detects disconnected components and allows jumping to isolated subgraphs', () => {
    const components = controller.getWeaklyConnectedComponents();
    expect(components.length).toBe(2);

    const comp1 = components.find((c) => c.includes('A'))!;
    expect(comp1).toEqual(['A', 'B', 'C']);

    const comp2 = components.find((c) => c.includes('D'))!;
    expect(comp2).toEqual(['D']);

    // Jump directly to disconnected node D
    const jumped = controller.jumpToNode('D');
    expect(jumped).toBe(true);
    expect(controller.getState().currentNodeId).toBe('D');
    expect(controller.getState().visitedNodeIds).toContain('D');
  });

  it('handles unsupported shapes with documented fallback and announces accessible warning', () => {
    const nodeD = graph.getNode('D')!;
    const presD = resolveNodePresentation(nodeD);

    expect(presD.shape).toBe('circle');
    expect(presD.isFallback).toBe(true);
    expect(presD.originalDeclaredShape).toBe('octagon');
    expect(presD.ariaLabel).toContain('Legacy Gateway, octagon shape (unsupported, mapped to circle sound and visual)');

    // In parity strategy, unsupported shape plays circle fallback sound (sine 300 Hz)
    const seq = audioCoordinator.getStrategy().mapEventToSequence(
      {
        type: 'NODE_FOCUS',
        nodeId: 'D',
        nodeIndex: 3,
        totalNodes: 4,
        direction: 'outgoing',
        neighborIds: [],
        isSpatial: false
      },
      audioCoordinator.getConfig(),
      graph
    );
    expect(seq!.notes[0].tone.waveform).toBe('sine');
    expect(seq!.notes[0].tone.frequency).toBe(300);
  });

  it('switches between Parity, Speech-Only, and Legacy sonification strategies', () => {
    // Parity
    audioCoordinator.setStrategyByVersion('visual-auditory-parity-v1');
    expect(audioCoordinator.getStrategy()).toBeInstanceOf(ParitySonificationStrategy);

    // Speech-only
    audioCoordinator.setStrategyByVersion('speech-only-v1');
    expect(audioCoordinator.getStrategy()).toBeInstanceOf(SpeechOnlyStrategy);
    const seqSpeech = audioCoordinator.getStrategy().mapEventToSequence(
      {
        type: 'NODE_FOCUS',
        nodeId: 'A',
        nodeIndex: 0,
        totalNodes: 4,
        direction: 'outgoing',
        neighborIds: ['B'],
        isSpatial: false
      },
      audioCoordinator.getConfig(),
      graph
    );
    expect(seqSpeech).toBeNull(); // Completely silent

    // Legacy study
    audioCoordinator.setStrategyByVersion('legacy-study-v1');
    expect(audioCoordinator.getStrategy()).toBeInstanceOf(LegacySonificationStrategy);
  });
});
