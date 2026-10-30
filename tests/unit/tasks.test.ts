import { describe, it, expect } from 'vitest';
import { DirectedGraph } from '../../src/domain/graph/Graph.js';
import { TaskEvaluator } from '../../src/domain/tasks/TaskEvaluator.js';
import { TaskFactory } from '../../src/domain/tasks/taskFactory.js';
import type { TaskDefinition } from '../../src/domain/tasks/types.js';

describe('Task Factory & Automated Scoring Oracles', () => {
  function createTestGraph(): DirectedGraph {
    const graph = new DirectedGraph({ id: 'g_eval', name: 'Evaluation Graph' });
    ['A', 'B', 'C', 'D'].forEach((id) => graph.addNode({ id }));
    // A -> B, A -> C, B -> D, C -> D (branch at A, converge at D)
    graph.addEdge({ id: 'e1', source: 'A', target: 'B' });
    graph.addEdge({ id: 'e2', source: 'A', target: 'C' });
    graph.addEdge({ id: 'e3', source: 'B', target: 'D' });
    graph.addEdge({ id: 'e4', source: 'C', target: 'D' });
    return graph;
  }

  it('creates standard task battery for a graph', () => {
    const graph = createTestGraph();
    const battery = TaskFactory.createStandardTaskBattery(graph);

    expect(battery).toHaveLength(5);
    expect(battery.map((t) => t.type)).toEqual([
      'branch_identification',
      'convergence_identification',
      'reachability',
      'cycle_identification',
      'mental_model_reconstruction'
    ]);
  });

  it('correctly evaluates branch identification task', () => {
    const graph = createTestGraph();
    const task: TaskDefinition = {
      id: 't_branch',
      type: 'branch_identification',
      title: 'Branch',
      promptText: 'Which node branches?',
      graphId: 'g_eval',
      inputType: 'single_choice'
    };

    // Correct answer: A
    const resA = TaskEvaluator.evaluate(graph, task, {
      taskId: 't_branch',
      answer: 'A',
      startTimeMonotonicMs: 0,
      endTimeMonotonicMs: 1000,
      durationMs: 1000
    });
    expect(resA.isCorrect).toBe(true);
    expect(resA.score).toBe(1.0);

    // Incorrect answer: B
    const resB = TaskEvaluator.evaluate(graph, task, {
      taskId: 't_branch',
      answer: 'B',
      startTimeMonotonicMs: 0,
      endTimeMonotonicMs: 1000,
      durationMs: 1000
    });
    expect(resB.isCorrect).toBe(false);
    expect(resB.score).toBe(0.0);
  });

  it('correctly evaluates convergence identification task', () => {
    const graph = createTestGraph();
    const task: TaskDefinition = {
      id: 't_conv',
      type: 'convergence_identification',
      title: 'Convergence',
      promptText: 'Which node converges?',
      graphId: 'g_eval',
      inputType: 'single_choice'
    };

    const resD = TaskEvaluator.evaluate(graph, task, {
      taskId: 't_conv',
      answer: 'D',
      startTimeMonotonicMs: 0,
      endTimeMonotonicMs: 1000,
      durationMs: 1000
    });
    expect(resD.isCorrect).toBe(true);

    const resA = TaskEvaluator.evaluate(graph, task, {
      taskId: 't_conv',
      answer: 'A',
      startTimeMonotonicMs: 0,
      endTimeMonotonicMs: 1000,
      durationMs: 1000
    });
    expect(resA.isCorrect).toBe(false);
  });

  it('correctly evaluates reachability queries', () => {
    const graph = createTestGraph();
    const task: TaskDefinition = {
      id: 't_reach',
      type: 'reachability',
      title: 'Reachability',
      promptText: 'Can A reach D?',
      graphId: 'g_eval',
      inputType: 'boolean',
      parameters: { source: 'A', target: 'D' }
    };

    const resTrue = TaskEvaluator.evaluate(graph, task, {
      taskId: 't_reach',
      answer: true,
      startTimeMonotonicMs: 0,
      endTimeMonotonicMs: 1000,
      durationMs: 1000
    });
    expect(resTrue.isCorrect).toBe(true);

    const resFalse = TaskEvaluator.evaluate(graph, task, {
      taskId: 't_reach',
      answer: false,
      startTimeMonotonicMs: 0,
      endTimeMonotonicMs: 1000,
      durationMs: 1000
    });
    expect(resFalse.isCorrect).toBe(false);
  });

  it('correctly evaluates cycle detection queries', () => {
    const graph = createTestGraph();
    const task: TaskDefinition = {
      id: 't_cycle',
      type: 'cycle_identification',
      title: 'Cycle',
      promptText: 'Does graph have cycle?',
      graphId: 'g_eval',
      inputType: 'boolean'
    };

    // Test DAG (no cycle -> expected false)
    const resNoCycle = TaskEvaluator.evaluate(graph, task, {
      taskId: 't_cycle',
      answer: false,
      startTimeMonotonicMs: 0,
      endTimeMonotonicMs: 1000,
      durationMs: 1000
    });
    expect(resNoCycle.isCorrect).toBe(true);

    // Add back edge D -> A creating cycle
    graph.addEdge({ id: 'e_cycle', source: 'D', target: 'A' });
    const resHasCycle = TaskEvaluator.evaluate(graph, task, {
      taskId: 't_cycle',
      answer: true,
      startTimeMonotonicMs: 0,
      endTimeMonotonicMs: 1000,
      durationMs: 1000
    });
    expect(resHasCycle.isCorrect).toBe(true);
  });

  it('correctly scores mental model reconstruction', () => {
    const graph = createTestGraph();
    const task: TaskDefinition = {
      id: 't_reconstruct',
      type: 'mental_model_reconstruction',
      title: 'Reconstruction',
      promptText: 'Reconstruct edges',
      graphId: 'g_eval',
      inputType: 'edge_list'
    };

    const submissionEdges = [
      { source: 'A', target: 'B' },
      { source: 'A', target: 'C' },
      { source: 'B', target: 'D' },
      { source: 'C', target: 'D' }
    ];

    const result = TaskEvaluator.evaluate(graph, task, {
      taskId: 't_reconstruct',
      answer: submissionEdges,
      startTimeMonotonicMs: 0,
      endTimeMonotonicMs: 5000,
      durationMs: 5000
    });

    expect(result.isCorrect).toBe(true);
    expect(result.score).toBe(1.0);
  });
});
