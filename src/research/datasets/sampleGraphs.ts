import { DirectedGraph } from '../../domain/graph/Graph.js';
import { GraphParser } from '../../domain/graph/parser.js';

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

export function getSampleGraphs(): Record<string, DirectedGraph> {
  const gTraining = GraphParser.parseDOT(TRAINING_GRAPH_DOT, 'graph-training');
  gTraining.setMetadata({
    id: 'graph-training',
    name: 'Training Graph (Simple Branch)',
    description: '4-node graph for learning navigation controls',
    isTraining: true,
    difficultyMetrics: gTraining.computeDifficultyMetrics()
  });

  const gPractice = GraphParser.parseDOT(PRACTICE_CYCLE_GRAPH_DOT, 'graph-practice-cycle');
  gPractice.setMetadata({
    id: 'graph-practice-cycle',
    name: 'Practice Graph (Cycle & Branch)',
    description: '4-node graph with cycle A-B-C-A',
    isTraining: true,
    difficultyMetrics: gPractice.computeDifficultyMetrics()
  });

  const gExp1 = GraphParser.parseDOT(EXP_GRAPH_1_DOT, 'graph-exp-1');
  gExp1.setMetadata({
    id: 'graph-exp-1',
    name: 'Experiment Graph 1 (Branching & Convergence)',
    description: '6-node diamond and dual fork structure',
    isTraining: false,
    difficultyMetrics: gExp1.computeDifficultyMetrics()
  });

  const gExp2 = GraphParser.parseDOT(EXP_GRAPH_2_DOT, 'graph-exp-2');
  gExp2.setMetadata({
    id: 'graph-exp-2',
    name: 'Experiment Graph 2 (Feedback Cycle Network)',
    description: '7-node structure with B-C cycle and convergent exit',
    isTraining: false,
    difficultyMetrics: gExp2.computeDifficultyMetrics()
  });

  const gExp3 = GraphParser.parseDOT(EXP_GRAPH_3_DOT, 'graph-exp-3');
  gExp3.setMetadata({
    id: 'graph-exp-3',
    name: 'Experiment Graph 3 (Multi-Path Hierarchy)',
    description: '9-node multi-layered directed graph',
    isTraining: false,
    difficultyMetrics: gExp3.computeDifficultyMetrics()
  });

  const gTransfer = GraphParser.parseDOT(TRANSFER_GRAPH_DOT, 'graph-transfer');
  gTransfer.setMetadata({
    id: 'graph-transfer',
    name: 'Transfer Evaluation Graph',
    description: '8-node complex interconnected graph',
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
