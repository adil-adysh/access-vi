import type { ExperimentalConditionId, NavigationLogEntry } from '../../domain/navigation/types.js';
import type { TaskDefinition, TaskSubmission, TaskEvaluationResult } from '../../domain/tasks/types.js';
import type { GraphDifficultyMetrics } from '../../domain/graph/types.js';

export type ExperimentPhase =
  | 'consent'
  | 'calibration'
  | 'training'
  | 'trial_prep'
  | 'trial_active'
  | 'trial_response'
  | 'workload'
  | 'rest'
  | 'completed';

export interface WorkloadRating {
  readonly mentalDemand: number;   // 1 to 10
  readonly physicalDemand: number; // 1 to 10
  readonly temporalDemand: number; // 1 to 10
  readonly performance: number;    // 1 to 10
  readonly effort: number;         // 1 to 10
  readonly frustration: number;    // 1 to 10
  readonly comments?: string;
}

export interface TrialLog {
  readonly trialId: string;
  readonly blockIndex: number;
  readonly trialIndexInBlock: number;
  readonly isTraining: boolean;
  readonly condition: ExperimentalConditionId;
  readonly graphId: string;
  readonly graphMetrics?: GraphDifficultyMetrics;
  readonly task: TaskDefinition;
  readonly submission: TaskSubmission;
  readonly evaluation: TaskEvaluationResult;
  readonly navigationLog: NavigationLogEntry[];
  readonly startTimestamp: number;
  readonly endTimestamp: number;
  readonly durationMs: number;
  readonly replayCount: number;
  readonly inspectionCount: number;
  readonly backtrackCount: number;
  readonly traversalCount: number;
}

export interface ExperimentSession {
  readonly schemaVersion: string;
  readonly sessionId: string;
  readonly participantId: string;
  readonly appVersion: string;
  readonly sonificationVersion: string;
  readonly conditionOrder: ExperimentalConditionId[];
  readonly currentPhase: ExperimentPhase;
  readonly currentBlockIndex: number;
  readonly currentTrialIndex: number;
  readonly startedAt: number;
  readonly completedAt?: number;
  readonly trials: TrialLog[];
  readonly workloadRatings: Record<ExperimentalConditionId, WorkloadRating>;
  readonly notes?: string;
}

export interface ExperimentConfig {
  readonly participantId: string;
  readonly conditionOrder: ExperimentalConditionId[];
  readonly allowPractice: boolean;
  readonly trialTimeoutSec: number; // e.g. 180s (0 = no limit)
  readonly autoAdvance: boolean;
}
