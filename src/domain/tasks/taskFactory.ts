import type { DirectedGraph } from '../graph/Graph.js';
import type { TaskDefinition } from './types.js';

export class TaskFactory {
  /**
   * Generates a standard research task battery for a given graph.
   */
  public static createStandardTaskBattery(graph: DirectedGraph): TaskDefinition[] {
    const meta = graph.getMetadata();
    const nodeIds = graph.getNodeIds();
    const tasks: TaskDefinition[] = [];

    // Task 1: Branch Identification
    tasks.push({
      id: `task-branch-${meta.id}`,
      type: 'branch_identification',
      title: 'Task 1: Branch Identification',
      promptText: 'Which node in this graph has outgoing connections to two or more different nodes?',
      graphId: meta.id,
      inputType: 'single_choice',
      options: nodeIds
    });

    // Task 2: Convergence Identification
    tasks.push({
      id: `task-convergence-${meta.id}`,
      type: 'convergence_identification',
      title: 'Task 2: Convergence Identification',
      promptText: 'Which node receives incoming connections from two or more different nodes?',
      graphId: meta.id,
      inputType: 'single_choice',
      options: nodeIds
    });

    // Task 3: Reachability
    if (nodeIds.length >= 2) {
      const source = nodeIds[0];
      const target = nodeIds[nodeIds.length - 1];
      tasks.push({
        id: `task-reachability-${meta.id}`,
        type: 'reachability',
        title: 'Task 3: Reachability Query',
        promptText: `Can you reach Node ${target} from Node ${source} by following directed connections?`,
        graphId: meta.id,
        inputType: 'boolean',
        parameters: { source, target }
      });
    }

    // Task 4: Cycle Identification
    tasks.push({
      id: `task-cycle-${meta.id}`,
      type: 'cycle_identification',
      title: 'Task 4: Cycle Detection',
      promptText: 'Does this graph contain any directed cycles (a path that loops back to a previously visited node)?',
      graphId: meta.id,
      inputType: 'boolean'
    });

    // Task 5: Mental Model Reconstruction
    tasks.push({
      id: `task-reconstruct-${meta.id}`,
      type: 'mental_model_reconstruction',
      title: 'Task 5: Mental Model Reconstruction',
      promptText: 'Reconstruct all directed connections you discovered in this graph by adding source and target node pairs.',
      graphId: meta.id,
      inputType: 'edge_list',
      options: nodeIds
    });

    return tasks;
  }
}
