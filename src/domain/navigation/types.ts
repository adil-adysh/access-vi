import type { DirectedGraph } from '../graph/Graph.js';

export type NavigationDirection = 'outgoing' | 'incoming';

export type PlaybackState = 'idle' | 'playing' | 'interrupted';

export type ExplorationMode = 'free_exploration' | 'experiment_trial' | 'training';

export type ExperimentalConditionId =
  | 'condition_a_speech'
  | 'condition_b_non_spatial'
  | 'condition_c_spatial';

export interface NodeInspection {
  readonly nodeId: string;
  readonly label: string;
  readonly inDegree: number;
  readonly outDegree: number;
  readonly incomingNeighbors: string[];
  readonly outgoingNeighbors: string[];
  readonly category?: string;
  readonly metadata?: Record<string, unknown>;
}

export type NavigationActionType =
  | 'SET_GRAPH'
  | 'SET_DIRECTION'
  | 'SELECT_NEIGHBOR'
  | 'TRAVERSE'
  | 'GO_BACK'
  | 'GO_TO_START'
  | 'JUMP_TO_NODE'
  | 'REPLAY'
  | 'CANCEL_PLAYBACK'
  | 'INSPECT'
  | 'HELP';

export interface NavigationLogEntry {
  readonly actionType: NavigationActionType;
  readonly timestamp: number;
  readonly monotonicOffsetMs: number;
  readonly currentNodeId: string;
  readonly targetNodeId?: string;
  readonly direction: NavigationDirection;
  readonly selectedNeighborIndex: number;
  readonly details?: Record<string, unknown>;
}

export interface NavigationState {
  readonly graph: DirectedGraph;
  readonly currentNodeId: string;
  readonly startNodeId: string;
  readonly history: string[];
  readonly direction: NavigationDirection;
  readonly selectedNeighborIndex: number;
  readonly playbackState: PlaybackState;
  readonly condition: ExperimentalConditionId;
  readonly mode: ExplorationMode;
  readonly inspection: NodeInspection | null;
}
