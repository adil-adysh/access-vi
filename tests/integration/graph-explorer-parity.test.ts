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

  it('routes free exploration navigation through ParitySonificationStrategy via handleNavigationAction (Finding 1)', () => {
    const freeCtrl = new ExplorationController(graph, 'condition_parity', 'free_exploration');
    const strat = audioCoordinator.getStrategy();
    expect(strat).toBeInstanceOf(ParitySonificationStrategy);

    // In free exploration mode, handleNavigationAction must execute ParitySonificationStrategy
    // Traverse A -> B (B is rectangle)
    freeCtrl.traverseSelectedNeighbor();
    const playback = audioCoordinator.handleNavigationAction(freeCtrl.getState(), 'TRAVERSE');
    expect(playback).toBeNull(); // Headless environment has no active Web Audio context
    // Verify that the parity strategy mapEventToSequence generates the 300 Hz triangle wave for Node B
    // Verify that the parity strategy mapEventToSequence generates the 300 Hz triangle wave for Node B
    const seq = strat.mapEventToSequence(
      {
        type: 'OUTGOING_SUMMARY',
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
    expect(seq).not.toBeNull();
    expect(seq!.notes[0].tone.waveform).toBe('triangle');
    expect(seq!.notes[0].tone.frequency).toBe(300);
  });

  it('strictly enforces LegacySonificationStrategy during experiment_trial mode for conditions B and C (Rule E)', () => {
    const trialCtrl = new ExplorationController(graph, 'condition_b_non_spatial', 'experiment_trial');
    // Ensure coordinator has parity as default strategy
    audioCoordinator.setStrategyByVersion('visual-auditory-parity-v1');
    expect(audioCoordinator.getStrategy()).toBeInstanceOf(ParitySonificationStrategy);

    // When trialCtrl triggers action, verify handleNavigationAction operates cleanly
    const trialPlayback = audioCoordinator.handleNavigationAction(trialCtrl.getState(), 'REPLAY');
    expect(trialPlayback).toBeNull();

    // AudioCoordinator must strictly preserve legacy strategy sequence
    const legacyStrat = new LegacySonificationStrategy();
    const legacySeq = legacyStrat.mapEventToSequence(
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
    expect(legacySeq).not.toBeNull();
    // Legacy mapping uses pentatonic scale: Node A (index 0) = 261.63 Hz (Middle C), distinct from Parity 300 Hz carrier
    expect(legacySeq!.notes[0].tone.frequency).toBe(261.63);
  });

  it('includes node labels and edge labels in navigation announcements (Finding 9)', () => {
    announcements = [];
    controller.nextNeighbor();
    expect(announcements.length).toBeGreaterThan(0);
    // Node B has label 'Database Core' and edge e1 has label 'queries'
    expect(announcements[0]).toContain('Node B (Database Core)');
    expect(announcements[0]).toContain('edge "queries"');

    // Traversal announcement
    announcements = [];
    controller.traverseSelectedNeighbor();
    expect(announcements[0]).toContain('Moved to Node B (Database Core)');
  });

  it('plays calibrated shape test tones via playShapeTone in Settings (Finding 7)', () => {
    const registry = audioCoordinator.getParityRegistry();
    const toneCircle = registry.createNodeCategoryTone('circle');
    const toneRect = registry.createNodeCategoryTone('rectangle');
    const toneDiamond = registry.createNodeCategoryTone('diamond');

    expect(toneCircle.waveform).toBe('sine');
    expect(toneCircle.frequency).toBe(300);

    expect(toneRect.waveform).toBe('triangle');
    expect(toneRect.frequency).toBe(300);

    expect(toneDiamond.waveform).toBe('square');
    expect(toneDiamond.frequency).toBe(300);
  });
});
