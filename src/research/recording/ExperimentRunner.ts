import { DirectedGraph } from '../../domain/graph/Graph.js';
import { ExplorationController } from '../../domain/navigation/ExplorationController.js';
import { TaskEvaluator } from '../../domain/tasks/TaskEvaluator.js';
import { TaskFactory } from '../../domain/tasks/taskFactory.js';
import { Counterbalance } from './Counterbalance.js';
import { IndexedDBStorage } from '../../storage/IndexedDBStorage.js';
import { getSampleGraphs } from '../datasets/sampleGraphs.js';
import type {
  ExperimentSession,
  TrialLog,
  WorkloadRating,
  ExperimentConfig
} from './types.js';
import type { TaskDefinition, TaskSubmission, TaskEvaluationResult } from '../../domain/tasks/types.js';
import type { ExperimentalConditionId } from '../../domain/navigation/types.js';

export type ExperimentListener = (session: ExperimentSession) => void;

export class ExperimentRunner {
  private session: ExperimentSession;
  private readonly storage: IndexedDBStorage;
  private readonly allGraphs: Record<string, DirectedGraph>;
  private readonly controller: ExplorationController;

  private currentTasks: TaskDefinition[] = [];
  private activeTrialStartTime: number = 0;
  private activeTrialMonotonicStart: number = 0;

  private listeners: Set<ExperimentListener> = new Set();

  constructor(
    config: Partial<ExperimentConfig> = {},
    storage?: IndexedDBStorage,
    controller?: ExplorationController
  ) {
    this.storage = storage ?? new IndexedDBStorage();
    this.allGraphs = getSampleGraphs();
    this.controller = controller ?? new ExplorationController();

    const participantId = config.participantId ?? `P_${Math.floor(100 + Math.random() * 900)}`;
    const conditionOrder =
      config.conditionOrder ?? Counterbalance.getOrderForParticipant(participantId);

    const sessionId = `S_${Date.now()}_${participantId}`;

    this.session = {
      schemaVersion: '1.0.0',
      sessionId,
      participantId,
      appVersion: '0.1.0',
      sonificationVersion: '1.0.0',
      conditionOrder,
      currentPhase: 'consent',
      currentBlockIndex: 0,
      currentTrialIndex: 0,
      startedAt: Date.now(),
      trials: [],
      workloadRatings: {
        condition_a_speech: { mentalDemand: 5, physicalDemand: 2, temporalDemand: 5, performance: 7, effort: 5, frustration: 3 },
        condition_b_non_spatial: { mentalDemand: 5, physicalDemand: 2, temporalDemand: 5, performance: 7, effort: 5, frustration: 3 },
        condition_c_spatial: { mentalDemand: 5, physicalDemand: 2, temporalDemand: 5, performance: 7, effort: 5, frustration: 3 }
      }
    };
  }

  public getSession(): ExperimentSession {
    return { ...this.session };
  }

  public getController(): ExplorationController {
    return this.controller;
  }

  public getCurrentCondition(): ExperimentalConditionId {
    if (this.session.currentPhase === 'training') {
      return 'condition_a_speech'; // Training starts with baseline speech
    }
    const idx = Math.min(this.session.currentBlockIndex, this.session.conditionOrder.length - 1);
    return this.session.conditionOrder[idx];
  }

  public getCurrentGraph(): DirectedGraph {
    if (this.session.currentPhase === 'training') {
      return this.allGraphs['graph-training'];
    }
    const graphId = Counterbalance.getGraphForBlock(this.session.currentBlockIndex);
    return this.allGraphs[graphId] ?? this.allGraphs['graph-exp-1'];
  }

  public getCurrentTask(): TaskDefinition | null {
    if (this.currentTasks.length === 0) {
      this.loadTasksForCurrentBlock();
    }
    return this.currentTasks[this.session.currentTrialIndex] ?? null;
  }

  public getTotalTasksInBlock(): number {
    return this.currentTasks.length;
  }

  public acceptConsent(): void {
    this.session = {
      ...this.session,
      currentPhase: 'calibration'
    };
    this.persistAndNotify();
  }

  public completeCalibration(): void {
    this.session = {
      ...this.session,
      currentPhase: 'training'
    };
    const trainingGraph = this.allGraphs['graph-training'];
    this.controller.setGraph(trainingGraph);
    this.controller.setCondition('condition_a_speech');
    this.controller.setMode('training');
    this.persistAndNotify();
  }

  public completeTraining(): void {
    this.session = {
      ...this.session,
      currentPhase: 'trial_prep',
      currentBlockIndex: 0,
      currentTrialIndex: 0
    };
    this.prepareBlock(0);
    this.persistAndNotify();
  }

  public startTrialExploration(): void {
    this.activeTrialStartTime = Date.now();
    this.activeTrialMonotonicStart =
      typeof performance !== 'undefined' ? performance.now() : Date.now();

    this.controller.resetActionHistory();
    this.session = {
      ...this.session,
      currentPhase: 'trial_active'
    };
    this.persistAndNotify();
  }

  public finishExplorationProceedToResponse(): void {
    this.session = {
      ...this.session,
      currentPhase: 'trial_response'
    };
    this.persistAndNotify();
  }

  public submitTrialResponse(
    answer: string | boolean | string[] | Array<{ source: string; target: string }>
  ): TaskEvaluationResult {
    const nowMonotonic = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const durationMs = nowMonotonic - this.activeTrialMonotonicStart;
    const task = this.getCurrentTask()!;
    const graph = this.getCurrentGraph();

    const submission: TaskSubmission = {
      taskId: task.id,
      answer,
      startTimeMonotonicMs: this.activeTrialMonotonicStart,
      endTimeMonotonicMs: nowMonotonic,
      durationMs
    };

    const evaluation = TaskEvaluator.evaluate(graph, task, submission);
    const navLog = this.controller.getActionHistory();

    const replayCount = navLog.filter((e) => e.actionType === 'REPLAY').length;
    const inspectionCount = navLog.filter((e) => e.actionType === 'INSPECT').length;
    const backtrackCount = navLog.filter((e) => e.actionType === 'GO_BACK').length;
    const traversalCount = navLog.filter((e) => e.actionType === 'TRAVERSE').length;

    const trialLog: TrialLog = {
      trialId: `trial_${this.session.currentBlockIndex}_${this.session.currentTrialIndex}_${Date.now()}`,
      blockIndex: this.session.currentBlockIndex,
      trialIndexInBlock: this.session.currentTrialIndex,
      isTraining: this.session.currentPhase === 'training',
      condition: this.getCurrentCondition(),
      graphId: graph.getMetadata().id,
      graphMetrics: graph.getMetadata().difficultyMetrics,
      task,
      submission,
      evaluation,
      navigationLog: navLog,
      startTimestamp: this.activeTrialStartTime,
      endTimestamp: Date.now(),
      durationMs,
      replayCount,
      inspectionCount,
      backtrackCount,
      traversalCount
    };

    this.session = {
      ...this.session,
      trials: [...this.session.trials, trialLog]
    };

    // Advance trial or block
    if (this.session.currentTrialIndex + 1 < this.currentTasks.length) {
      // Next trial in current block
      this.session = {
        ...this.session,
        currentTrialIndex: this.session.currentTrialIndex + 1,
        currentPhase: 'trial_prep'
      };
      this.setupControllerForCurrentTask();
    } else {
      // Completed all tasks in current block -> move to Workload questionnaire
      this.session = {
        ...this.session,
        currentPhase: 'workload'
      };
    }

    this.persistAndNotify();
    return evaluation;
  }

  public submitWorkloadRating(rating: WorkloadRating): void {
    const currentCondition = this.getCurrentCondition();
    this.session = {
      ...this.session,
      workloadRatings: {
        ...this.session.workloadRatings,
        [currentCondition]: rating
      }
    };

    // Check if more blocks exist
    if (this.session.currentBlockIndex + 1 < this.session.conditionOrder.length) {
      this.session = {
        ...this.session,
        currentPhase: 'rest'
      };
    } else {
      // All blocks finished -> Completed
      this.session = {
        ...this.session,
        currentPhase: 'completed',
        completedAt: Date.now()
      };
    }

    this.persistAndNotify();
  }

  public finishRestProceedToNextBlock(): void {
    const nextBlockIndex = this.session.currentBlockIndex + 1;
    this.session = {
      ...this.session,
      currentBlockIndex: nextBlockIndex,
      currentTrialIndex: 0,
      currentPhase: 'trial_prep'
    };
    this.prepareBlock(nextBlockIndex);
    this.persistAndNotify();
  }

  public subscribe(listener: ExperimentListener): () => void {
    this.listeners.add(listener);
    listener(this.getSession());
    return () => this.listeners.delete(listener);
  }

  private prepareBlock(_blockIndex: number): void {
    this.loadTasksForCurrentBlock();
    this.setupControllerForCurrentTask();
  }

  private loadTasksForCurrentBlock(): void {
    const graph = this.getCurrentGraph();
    this.currentTasks = TaskFactory.createStandardTaskBattery(graph);
  }

  private setupControllerForCurrentTask(): void {
    const graph = this.getCurrentGraph();
    const condition = this.getCurrentCondition();
    this.controller.setGraph(graph);
    this.controller.setCondition(condition);
    this.controller.setMode('experiment_trial');
  }

  private persistAndNotify(): void {
    this.storage.saveSession(this.session).catch((err) => {
      console.warn('Failed to save session to IndexedDB:', err);
    });

    const sessionCopy = this.getSession();
    for (const listener of this.listeners) {
      try {
        listener(sessionCopy);
      } catch (err) {
        console.error('Error in experiment listener:', err);
      }
    }
  }
}
