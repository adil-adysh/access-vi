export type TaskType =
  | 'branch_identification'
  | 'convergence_identification'
  | 'reachability'
  | 'cycle_identification'
  | 'mental_model_reconstruction'
  | 'retention'
  | 'transfer';

export type TaskInputType = 'single_choice' | 'boolean' | 'multiple_choice' | 'edge_list';

export interface EdgeInput {
  readonly source: string;
  readonly target: string;
}

export interface TaskDefinition {
  readonly id: string;
  readonly type: TaskType;
  readonly title: string;
  readonly promptText: string;
  readonly graphId: string;
  readonly inputType: TaskInputType;
  readonly options?: string[]; // for choice questions
  readonly parameters?: Record<string, unknown>;
}

export interface TaskSubmission {
  readonly taskId: string;
  readonly answer: string | boolean | string[] | EdgeInput[];
  readonly startTimeMonotonicMs: number;
  readonly endTimeMonotonicMs: number;
  readonly durationMs: number;
  readonly timedOut?: boolean;
}

export interface TaskEvaluationResult {
  readonly taskId: string;
  readonly taskType: TaskType;
  readonly isCorrect: boolean;
  readonly score: number; // 0.0 to 1.0 (exact accuracy or F1 score)
  readonly expectedAnswer: unknown;
  readonly actualAnswer: unknown;
  readonly explanation: string;
  readonly detailedMetrics?: Record<string, unknown>;
}
