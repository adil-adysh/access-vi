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
  | 'trial_interrupted'
  | 'workload'
  | 'rest'
  | 'completed';

/**
 * Modified Raw NASA-TLX 6-subscale instrument (1 to 10 scale).
 * Note: Unweighted raw scores (Hart & Staveland, 1988).
 */
export interface WorkloadRating {
  readonly mentalDemand: number;   // 1 to 10
  readonly physicalDemand: number; // 1 to 10
  readonly temporalDemand: number; // 1 to 10
  readonly performance: number;    // 1 to 10
  readonly effort: number;         // 1 to 10
  readonly frustration: number;    // 1 to 10
  readonly comments?: string;
}

export type TrialStatus = 'completed' | 'timeout' | 'interrupted' | 'abandoned';

export interface AudioSettingsSnapshot {
  readonly waveform: string;
  readonly playbackSpeed: number;
  readonly masterVolume: number;
  readonly baseFrequencyHz?: number;
  readonly useSpatial?: boolean;
  readonly sonificationVersion?: string;
}

export interface TrialLog {
  readonly trialId: string;
  readonly blockIndex: number;
  readonly trialIndexInBlock: number;
  readonly isTraining: boolean;
  readonly condition: ExperimentalConditionId;
  readonly graphId: string;
  readonly graphHash?: string;
  readonly graphMetrics?: GraphDifficultyMetrics;
  readonly task: TaskDefinition;
  readonly submission: TaskSubmission;
  readonly evaluation: TaskEvaluationResult;
  readonly navigationLog: NavigationLogEntry[];
  readonly startTimestamp: number;
  readonly endTimestamp: number;
  readonly durationMs: number;
  readonly explorationDurationMs: number;
  readonly responseDurationMs: number;
  readonly replayCount: number;
  readonly inspectionCount: number;
  readonly backtrackCount: number;
  readonly traversalCount: number;
  readonly status: TrialStatus;
  readonly interruptionReason?: string;
  readonly pauseCount?: number;
  readonly pausedDurationMs?: number;
  readonly audioMappingVersion?: string;
  readonly audioSettings?: AudioSettingsSnapshot;
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
  readonly workloadRatings: Partial<Record<ExperimentalConditionId, WorkloadRating>>;
  readonly notes?: string;
  readonly activeTrialInterruptedReason?: string;
  readonly activeTrialPausedAt?: number;
  readonly interruptedPhaseBeforePause?: 'trial_active' | 'trial_response';
}

export interface ExperimentConfig {
  readonly participantId: string;
  readonly conditionOrder: ExperimentalConditionId[];
  readonly allowPractice: boolean;
  readonly trialTimeoutSec: number; // e.g. 180s (0 = no limit)
  readonly autoAdvance: boolean;
}
