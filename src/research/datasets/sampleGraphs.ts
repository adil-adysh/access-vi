import { DirectedGraph } from '../../domain/graph/Graph.js';
import { GraphParser } from '../../domain/graph/parser.js';

// ==========================================
// FREE EXPLORATION SANDBOX GRAPHS
// (Completely segregated from research stimuli)
// ==========================================

export const FREE_SANDBOX_1_DOT = `
digraph FreePlayground {
  "A" [label="Node A"];
  "B" [label="Node B"];
  "C" [label="Node C"];
  "D" [label="Node D"];
  "E" [label="Node E"];
  "A" -> "B";
  "A" -> "C";
  "B" -> "D";
  "C" -> "E";
  "D" -> "E";
}
`;

export const FREE_SANDBOX_2_DOT = `
digraph FreeCycleSandbox {
  "A" [label="Node A"];
  "B" [label="Node B"];
  "C" [label="Node C"];
  "D" [label="Node D"];
  "A" -> "B";
  "B" -> "C";
  "C" -> "A";
  "B" -> "D";
}
`;

export const FREE_SANDBOX_3_DOT = `
digraph FreeHierarchySandbox {
  "A" [label="Node A"];
  "B" [label="Node B"];
  "C" [label="Node C"];
  "D" [label="Node D"];
  "E" [label="Node E"];
  "F" [label="Node F"];
  "A" -> "B";
  "A" -> "C";
  "B" -> "D";
  "B" -> "E";
  "C" -> "F";
}
`;

// ==========================================
// RESEARCH STIMULI GRAPHS
// (Used exclusively by ExperimentRunner during controlled trials)
// ==========================================

export const TRAINING_GRAPH_DOT = `
digraph TrainingGraph {
  "A" [label="Node A"];
  "B" [label="Node B"];
  "C" [label="Node C"];
  "D" [label="Node D"];
  "A" -> "B";
  "B" -> "C";
  "B" -> "D";
}
`;

export const PRACTICE_CYCLE_GRAPH_DOT = `
digraph PracticeCycleGraph {
  "A" [label="Node A"];
  "B" [label="Node B"];
  "C" [label="Node C"];
  "D" [label="Node D"];
  "A" -> "B";
  "B" -> "C";
  "C" -> "A";
  "C" -> "D";
}
`;

export const EXP_GRAPH_1_DOT = `
digraph BranchConvergeNet {
  "A" [label="Node A"];
  "B" [label="Node B"];
  "C" [label="Node C"];
  "D" [label="Node D"];
  "E" [label="Node E"];
  "F" [label="Node F"];
  "A" -> "B";
  "A" -> "C";
  "B" -> "D";
  "C" -> "D";
  "D" -> "E";
  "D" -> "F";
}
`;

export const EXP_GRAPH_2_DOT = `
digraph FeedbackNetwork {
  "A" [label="Node A"];
  "B" [label="Node B"];
  "C" [label="Node C"];
  "D" [label="Node D"];
  "E" [label="Node E"];
  "F" [label="Node F"];
  "G" [label="Node G"];
  "A" -> "B";
  "B" -> "C";
  "C" -> "D";
  "D" -> "E";
  "C" -> "B";
  "D" -> "F";
  "F" -> "G";
  "E" -> "G";
}
`;

export const EXP_GRAPH_3_DOT = `
digraph MultiPathHierarchy {
  "A" [label="Node A"];
  "B" [label="Node B"];
  "C" [label="Node C"];
  "D" [label="Node D"];
  "E" [label="Node E"];
  "F" [label="Node F"];
  "G" [label="Node G"];
  "H" [label="Node H"];
  "I" [label="Node I"];
  "A" -> "B";
  "A" -> "C";
  "B" -> "D";
  "B" -> "E";
  "C" -> "F";
  "D" -> "G";
  "E" -> "G";
  "F" -> "H";
  "G" -> "I";
  "H" -> "I";
}
`;

export const TRANSFER_GRAPH_DOT = `
digraph UnfamiliarTransferGraph {
  "A" [label="Node A"];
  "B" [label="Node B"];
  "C" [label="Node C"];
  "D" [label="Node D"];
  "E" [label="Node E"];
  "F" [label="Node F"];
  "G" [label="Node G"];
  "H" [label="Node H"];
  "A" -> "B";
  "B" -> "C";
  "C" -> "D";
  "A" -> "E";
  "E" -> "F";
  "F" -> "G";
  "B" -> "F";
  "C" -> "G";
  "G" -> "H";
  "D" -> "H";
}
`;

/**
 * Returns graphs safe for public, unrestricted free exploration and sample imports.
 * Never includes controlled research stimuli.
 */
export function getFreeExplorationGraphs(): Record<string, DirectedGraph> {
  const g1 = GraphParser.parseDOT(FREE_SANDBOX_1_DOT, 'free-sandbox-1');
  g1.setMetadata({
    id: 'free-sandbox-1',
    name: 'Exploration Playground',
    description: '5-node open sandbox graph for free practice and exploration',
    isTraining: false,
    difficultyMetrics: g1.computeDifficultyMetrics()
  });

  const g2 = GraphParser.parseDOT(FREE_SANDBOX_2_DOT, 'free-sandbox-2');
  g2.setMetadata({
    id: 'free-sandbox-2',
    name: 'Cycle Playground',
    description: '4-node cyclic sandbox graph demonstrating loops',
    isTraining: false,
    difficultyMetrics: g2.computeDifficultyMetrics()
  });

  const g3 = GraphParser.parseDOT(FREE_SANDBOX_3_DOT, 'free-sandbox-3');
  g3.setMetadata({
    id: 'free-sandbox-3',
    name: 'Hierarchy Playground',
    description: '6-node branching sandbox graph',
    isTraining: false,
    difficultyMetrics: g3.computeDifficultyMetrics()
  });

  return {
    'free-sandbox-1': g1,
    'free-sandbox-2': g2,
    'free-sandbox-3': g3
  };
}

/**
 * Returns controlled experimental stimuli used exclusively by the research experiment runner.
 */
export function getResearchStimuli(): Record<string, DirectedGraph> {
  const gTraining = GraphParser.parseDOT(TRAINING_GRAPH_DOT, 'graph-training');
  gTraining.setMetadata({
    id: 'graph-training',
    name: 'Practice Graph 1',
    description: '4-node directed practice graph',
    isTraining: true,
    difficultyMetrics: gTraining.computeDifficultyMetrics()
  });

  const gPractice = GraphParser.parseDOT(PRACTICE_CYCLE_GRAPH_DOT, 'graph-practice-cycle');
  gPractice.setMetadata({
    id: 'graph-practice-cycle',
    name: 'Practice Graph 2',
    description: '4-node directed practice graph',
    isTraining: true,
    difficultyMetrics: gPractice.computeDifficultyMetrics()
  });

  const gExp1 = GraphParser.parseDOT(EXP_GRAPH_1_DOT, 'graph-exp-1');
  gExp1.setMetadata({
    id: 'graph-exp-1',
    name: 'Study Graph 1',
    description: '6-node directed stimulus graph',
    isTraining: false,
    difficultyMetrics: gExp1.computeDifficultyMetrics()
  });

  const gExp2 = GraphParser.parseDOT(EXP_GRAPH_2_DOT, 'graph-exp-2');
  gExp2.setMetadata({
    id: 'graph-exp-2',
    name: 'Study Graph 2',
    description: '7-node directed stimulus graph',
    isTraining: false,
    difficultyMetrics: gExp2.computeDifficultyMetrics()
  });

  const gExp3 = GraphParser.parseDOT(EXP_GRAPH_3_DOT, 'graph-exp-3');
  gExp3.setMetadata({
    id: 'graph-exp-3',
    name: 'Study Graph 3',
    description: '9-node directed stimulus graph',
    isTraining: false,
    difficultyMetrics: gExp3.computeDifficultyMetrics()
  });

  const gTransfer = GraphParser.parseDOT(TRANSFER_GRAPH_DOT, 'graph-transfer');
  gTransfer.setMetadata({
    id: 'graph-transfer',
    name: 'Study Graph Transfer',
    description: '8-node directed stimulus graph',
    isTraining: false,
    difficultyMetrics: gTransfer.computeDifficultyMetrics()
  });

  return {
    'graph-training': gTraining,
    'graph-practice-cycle': gPractice,
    'graph-exp-1': gExp1,
    'graph-exp-2': gExp2,
    'graph-exp-3': gExp3,
    'graph-transfer': gTransfer
  };
}

/**
 * Returns the public sample graphs (defaults to free exploration graphs to prevent leakage).
 */
export function getSampleGraphs(): Record<string, DirectedGraph> {
  return getFreeExplorationGraphs();
}
