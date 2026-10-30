import { describe, it, expect, vi } from 'vitest';
import { ExplorationController } from '../../src/domain/navigation/ExplorationController.js';
import { DirectedGraph } from '../../src/domain/graph/Graph.js';

describe('ExplorationController Navigation State Machine', () => {
  function createSampleGraph(): DirectedGraph {
    const graph = new DirectedGraph({ id: 'sample', name: 'Sample Graph' });
    ['A', 'B', 'C', 'D'].forEach((id) => graph.addNode({ id, label: `Node ${id}` }));
    graph.addEdge({ id: 'e1', source: 'A', target: 'B' });
    graph.addEdge({ id: 'e2', source: 'A', target: 'C' });
    graph.addEdge({ id: 'e3', source: 'B', target: 'D' });
    graph.addEdge({ id: 'e4', source: 'C', target: 'D' });
    return graph;
  }

  it('initializes on start node with outgoing direction', () => {
    const graph = createSampleGraph();
    const controller = new ExplorationController(graph);
    const state = controller.getState();

    expect(state.currentNodeId).toBe('A');
    expect(state.startNodeId).toBe('A');
    expect(state.direction).toBe('outgoing');
    expect(controller.getAvailableNeighbors()).toEqual(['B', 'C']);
    expect(controller.getSelectedNeighbor()).toBe('B');
  });

  it('cycles through neighbors with nextNeighbor and prevNeighbor', () => {
    const graph = createSampleGraph();
    const controller = new ExplorationController(graph);

    expect(controller.getSelectedNeighbor()).toBe('B');
    controller.nextNeighbor();
    expect(controller.getSelectedNeighbor()).toBe('C');
    controller.nextNeighbor();
    expect(controller.getSelectedNeighbor()).toBe('B'); // wrap-around

    controller.prevNeighbor();
    expect(controller.getSelectedNeighbor()).toBe('C');
  });

  it('toggles direction between outgoing and incoming', () => {
    const graph = createSampleGraph();
    const controller = new ExplorationController(graph);

    controller.toggleDirection();
    expect(controller.getState().direction).toBe('incoming');
    expect(controller.getAvailableNeighbors()).toEqual([]); // A has no incoming

    controller.toggleDirection();
    expect(controller.getState().direction).toBe('outgoing');
    expect(controller.getAvailableNeighbors()).toEqual(['B', 'C']);
  });

  it('traverses to selected neighbor and tracks history', () => {
    const graph = createSampleGraph();
    const controller = new ExplorationController(graph);

    // From A, select C and traverse
    controller.nextNeighbor(); // selects C
    const traversed = controller.traverseSelectedNeighbor();
    expect(traversed).toBe(true);

    const state = controller.getState();
    expect(state.currentNodeId).toBe('C');
    expect(state.history).toEqual(['A']);
    expect(controller.getAvailableNeighbors()).toEqual(['D']);

    // Traverse into D
    controller.traverseSelectedNeighbor();
    expect(controller.getState().currentNodeId).toBe('D');
    expect(controller.getState().history).toEqual(['A', 'C']);

    // Backtrack to C
    const back1 = controller.goBack();
    expect(back1).toBe(true);
    expect(controller.getState().currentNodeId).toBe('C');
    expect(controller.getState().history).toEqual(['A']);

    // Backtrack to A
    const back2 = controller.goBack();
    expect(back2).toBe(true);
    expect(controller.getState().currentNodeId).toBe('A');
    expect(controller.getState().history).toEqual([]);

    // Backtrack when history is empty
    expect(controller.goBack()).toBe(false);
  });

  it('returns to start node directly', () => {
    const graph = createSampleGraph();
    const controller = new ExplorationController(graph);

    controller.traverseSelectedNeighbor(); // A -> B
    controller.traverseSelectedNeighbor(); // B -> D
    expect(controller.getState().currentNodeId).toBe('D');

    controller.goToStartNode();
    expect(controller.getState().currentNodeId).toBe('A');
  });

  it('inspects current node details', () => {
    const graph = createSampleGraph();
    const controller = new ExplorationController(graph);

    const inspection = controller.inspectCurrentNode();
    expect(inspection.nodeId).toBe('A');
    expect(inspection.outDegree).toBe(2);
    expect(inspection.inDegree).toBe(0);
    expect(inspection.outgoingNeighbors).toEqual(['B', 'C']);
  });

  it('dispatches keyboard commands', () => {
    const graph = createSampleGraph();
    const controller = new ExplorationController(graph);

    expect(controller.handleKeyboardCommand('ArrowDown')).toBe(true);
    expect(controller.getSelectedNeighbor()).toBe('C');

    expect(controller.handleKeyboardCommand('ArrowRight')).toBe(true);
    expect(controller.getState().currentNodeId).toBe('C');

    expect(controller.handleKeyboardCommand('ArrowLeft')).toBe(true);
    expect(controller.getState().currentNodeId).toBe('A');

    expect(controller.handleKeyboardCommand('d')).toBe(true);
    expect(controller.getState().direction).toBe('incoming');

    expect(controller.handleKeyboardCommand('Escape')).toBe(true);
    expect(controller.getState().playbackState).toBe('interrupted');
  });

  it('records navigation action logs with timestamps and offsets', () => {
    const graph = createSampleGraph();
    const controller = new ExplorationController(graph);

    controller.nextNeighbor();
    controller.traverseSelectedNeighbor();
    controller.goBack();

    const history = controller.getActionHistory();
    expect(history.length).toBeGreaterThanOrEqual(3);
    expect(history.some((e) => e.actionType === 'SELECT_NEIGHBOR')).toBe(true);
    expect(history.some((e) => e.actionType === 'TRAVERSE')).toBe(true);
    expect(history.some((e) => e.actionType === 'GO_BACK')).toBe(true);
  });

  it('notifies listeners on state changes and announcements', () => {
    const graph = createSampleGraph();
    const controller = new ExplorationController(graph);

    const stateListener = vi.fn();
    const announcementListener = vi.fn();

    controller.onStateChange(stateListener);
    controller.onAnnouncement(announcementListener);

    controller.nextNeighbor();
    expect(stateListener).toHaveBeenCalled();
    expect(announcementListener).toHaveBeenCalled();
  });
});
