import { DirectedGraph } from '../graph/Graph.js';
import type {
  TaskDefinition,
  TaskSubmission,
  TaskEvaluationResult,
  EdgeInput
} from './types.js';

export class TaskEvaluator {
  /**
   * Evaluates a participant's submission against the ground truth graph.
   */
  public static evaluate(
    graph: DirectedGraph,
    task: TaskDefinition,
    submission: TaskSubmission
  ): TaskEvaluationResult {
    const { type, parameters } = task;
    const answer = submission.answer;

    switch (type) {
      case 'branch_identification': {
        const branchingNodes = graph.getBranchingNodes();
        const submittedNode = String(answer).trim();
        const isCorrect = branchingNodes.includes(submittedNode);

        return {
          taskId: task.id,
          taskType: type,
          isCorrect,
          score: isCorrect ? 1.0 : 0.0,
          expectedAnswer: branchingNodes,
          actualAnswer: submittedNode,
          explanation: isCorrect
            ? `Node ${submittedNode} is a valid branching node with out-degree >= 2.`
            : `Node ${submittedNode} is not a branching node. Ground truth branching nodes: [${branchingNodes.join(', ')}].`,
          detailedMetrics: { branchingNodes }
        };
      }

      case 'convergence_identification': {
        const convergenceNodes = graph.getConvergenceNodes();
        const submittedNode = String(answer).trim();
        const isCorrect = convergenceNodes.includes(submittedNode);

        return {
          taskId: task.id,
          taskType: type,
          isCorrect,
          score: isCorrect ? 1.0 : 0.0,
          expectedAnswer: convergenceNodes,
          actualAnswer: submittedNode,
          explanation: isCorrect
            ? `Node ${submittedNode} is a valid convergence node with in-degree >= 2.`
            : `Node ${submittedNode} is not a convergence node. Ground truth convergence nodes: [${convergenceNodes.join(', ')}].`,
          detailedMetrics: { convergenceNodes }
        };
      }

      case 'reachability': {
        const source = String(parameters?.source ?? 'A');
        const target = String(parameters?.target ?? 'F');
        const expected = graph.isReachable(source, target);
        const actual = typeof answer === 'boolean' ? answer : String(answer).toLowerCase() === 'true';
        const isCorrect = actual === expected;

        return {
          taskId: task.id,
          taskType: type,
          isCorrect,
          score: isCorrect ? 1.0 : 0.0,
          expectedAnswer: expected,
          actualAnswer: actual,
          explanation: `Reachability from ${source} to ${target} is ${expected}. Participant responded ${actual}.`,
          detailedMetrics: { source, target, reachable: expected }
        };
      }

      case 'cycle_identification': {
        const hasCycle = graph.hasCycle();
        const actual = typeof answer === 'boolean' ? answer : String(answer).toLowerCase() === 'true';
        const isCorrect = actual === hasCycle;

        return {
          taskId: task.id,
          taskType: type,
          isCorrect,
          score: isCorrect ? 1.0 : 0.0,
          expectedAnswer: hasCycle,
          actualAnswer: actual,
          explanation: `Graph ${hasCycle ? 'contains' : 'does not contain'} a directed cycle. Participant answered ${actual}.`,
          detailedMetrics: { hasCycle, cycles: graph.detectCycles() }
        };
      }

      case 'mental_model_reconstruction': {
        const reconstructedEdges = Array.isArray(answer) ? (answer as EdgeInput[]) : [];
        const comparison = DirectedGraph.compareReconstruction(graph, reconstructedEdges);

        return {
          taskId: task.id,
          taskType: type,
          isCorrect: comparison.exactMatch,
          score: comparison.f1Score,
          expectedAnswer: graph.getEdges().map((e) => ({ source: e.source, target: e.target })),
          actualAnswer: reconstructedEdges,
          explanation: `Reconstruction achieved Precision: ${(comparison.precision * 100).toFixed(1)}%, Recall: ${(comparison.recall * 100).toFixed(1)}%, F1: ${(comparison.f1Score * 100).toFixed(1)}%.`,
          detailedMetrics: { ...comparison }
        };
      }

      case 'retention':
      case 'transfer': {
        // General query evaluation based on task parameters
        if (parameters?.queryType === 'reachability') {
          return TaskEvaluator.evaluate(
            graph,
            { ...task, type: 'reachability' },
            submission
          );
        }
        if (parameters?.queryType === 'cycle') {
          return TaskEvaluator.evaluate(
            graph,
            { ...task, type: 'cycle_identification' },
            submission
          );
        }
        if (parameters?.queryType === 'branch') {
          return TaskEvaluator.evaluate(
            graph,
            { ...task, type: 'branch_identification' },
            submission
          );
        }

        // Default exact string match against parameters.expected
        const expected = String(parameters?.expectedAnswer ?? '');
        const actual = String(answer).trim();
        const isCorrect = actual.toLowerCase() === expected.toLowerCase();

        return {
          taskId: task.id,
          taskType: type,
          isCorrect,
          score: isCorrect ? 1.0 : 0.0,
          expectedAnswer: expected,
          actualAnswer: actual,
          explanation: isCorrect ? 'Answer is correct.' : `Expected: ${expected}, Got: ${actual}`,
          detailedMetrics: {}
        };
      }
    }
  }
}
