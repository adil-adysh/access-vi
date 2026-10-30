import { DirectedGraph } from '../../domain/graph/Graph.js';
import { ExplorationController } from '../../domain/navigation/ExplorationController.js';
import { TaskEvaluator } from '../../domain/tasks/TaskEvaluator.js';
import { TaskFactory } from '../../domain/tasks/taskFactory.js';
import { Counterbalance } from './Counterbalance.js';
import { IndexedDBStorage } from '../../storage/IndexedDBStorage.js';
import { getSampleGraphs } from '../datasets/sampleGraphs.js';
import {
  DEFAULT_EXPERIMENT_POLICY,
  DEFAULT_TRAINING_POLICY
} from '../../domain/navigation/types.js';
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
  private explorationMonotonicStart: number = 0;
  private explorationDurationMs: number = 0;
  private responseMonotonicStart: number = 0;

  private lastPersistenceError: Error | null = null;
  private listeners: Set<ExperimentListener> = new Set();

  constructor(
    config: Partial<ExperimentConfig> = {},
    storage?: IndexedDBStorage,
    controller?: ExplorationController,
    initialSession?: ExperimentSession
  ) {
    this.storage = storage ?? new IndexedDBStorage();
    this.allGraphs = getSampleGraphs();
    this.controller = controller ?? new ExplorationController(
      undefined,
      'condition_a_speech',
      'training',
      DEFAULT_TRAINING_POLICY
    );

    if (initialSession) {
      this.session = initialSession;
      this.setupControllerForCurrentTask();
    } else {
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
        workloadRatings: {}
      };
    }
  }

  public getSession(): ExperimentSession {
    return { ...this.session };
  }

  public getController(): ExplorationController {
    return this.controller;
  }

  public getLastPersistenceError(): Error | null {
    return this.lastPersistenceError;
  }

  public getCurrentCondition(): ExperimentalConditionId {
    if (this.session.currentPhase === 'training') {
      return 'condition_a_speech';
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
    if (this.session.currentPhase !== 'consent') {
      throw new Error(`Invalid phase transition: cannot accept consent from phase "${this.session.currentPhase}".`);
    }
    this.session = {
      ...this.session,
      currentPhase: 'calibration'
    };
    this.persistAndNotify();
  }

  public completeCalibration(): void {
    if (this.session.currentPhase !== 'calibration') {
      throw new Error(`Invalid phase transition: cannot complete calibration from phase "${this.session.currentPhase}".`);
    }
    this.session = {
      ...this.session,
      currentPhase: 'training'
    };
    const trainingGraph = this.allGraphs['graph-training'];
    this.controller.setExposurePolicy(DEFAULT_TRAINING_POLICY);
    this.controller.setGraph(trainingGraph);
    this.controller.setCondition('condition_a_speech');
    this.controller.setMode('training');
    this.persistAndNotify();
  }

  public completeTraining(): void {
    if (this.session.currentPhase !== 'training') {
      throw new Error(`Invalid phase transition: cannot complete training from phase "${this.session.currentPhase}".`);
    }
    this.controller.cancelPlayback();
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
    if (this.session.currentPhase !== 'trial_prep') {
      throw new Error(`Invalid phase transition: cannot start exploration from phase "${this.session.currentPhase}".`);
    }
    this.activeTrialStartTime = Date.now();
    this.explorationMonotonicStart =
      typeof performance !== 'undefined' ? performance.now() : Date.now();

    this.controller.resetActionHistory();
    this.controller.setMode('experiment_trial');
    this.controller.setExposurePolicy(DEFAULT_EXPERIMENT_POLICY);
    this.session = {
      ...this.session,
      currentPhase: 'trial_active'
    };
    this.persistAndNotify();
  }

  public finishExplorationProceedToResponse(): void {
    if (this.session.currentPhase !== 'trial_active') {
      throw new Error(`Invalid phase transition: cannot finish exploration from phase "${this.session.currentPhase}".`);
    }
    const nowMonotonic = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.explorationDurationMs = Math.max(0, nowMonotonic - this.explorationMonotonicStart);
    this.responseMonotonicStart = nowMonotonic;

    this.controller.cancelPlayback();
    this.session = {
      ...this.session,
      currentPhase: 'trial_response'
    };
    this.persistAndNotify();
  }

  public submitTrialResponse(
    answer: string | boolean | string[] | Array<{ source: string; target: string }>
  ): TaskEvaluationResult {
    if (this.session.currentPhase !== 'trial_response') {
      throw new Error(`Invalid phase transition: cannot submit response from phase "${this.session.currentPhase}".`);
    }

    const nowMonotonic = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const responseDurationMs = Math.max(0, nowMonotonic - this.responseMonotonicStart);
    const durationMs = this.explorationDurationMs + responseDurationMs;
    const task = this.getCurrentTask()!;
    const graph = this.getCurrentGraph();

    const submission: TaskSubmission = {
      taskId: task.id,
      answer,
      startTimeMonotonicMs: this.explorationMonotonicStart,
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
      isTraining: false,
      condition: this.getCurrentCondition(),
      graphId: graph.getMetadata().id,
      graphHash: graph.computeHash(),
      graphMetrics: graph.getMetadata().difficultyMetrics,
      task,
      submission,
      evaluation,
      navigationLog: navLog,
      startTimestamp: this.activeTrialStartTime,
      endTimestamp: Date.now(),
      durationMs,
      explorationDurationMs: this.explorationDurationMs,
      responseDurationMs,
      replayCount,
      inspectionCount,
      backtrackCount,
      traversalCount,
      status: 'completed',
      audioMappingVersion: this.session.sonificationVersion,
      audioSettings: {
        waveform: 'sine',
        playbackSpeed: 1.0,
        masterVolume: 0.7,
        sonificationVersion: this.session.sonificationVersion
      }
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
    if (this.session.currentPhase !== 'workload') {
      throw new Error(`Invalid phase transition: cannot submit workload rating from phase "${this.session.currentPhase}".`);
    }

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
    if (this.session.currentPhase !== 'rest') {
      throw new Error(`Invalid phase transition: cannot finish rest from phase "${this.session.currentPhase}".`);
    }

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

  public recordInterruption(reason: string): void {
    if (this.session.currentPhase === 'trial_active') {
      this.controller.cancelPlayback(reason);
    }
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
    this.controller.cancelPlayback();
    this.controller.setExposurePolicy(DEFAULT_EXPERIMENT_POLICY);
    this.controller.setGraph(graph);
    this.controller.setCondition(condition);
    this.controller.setMode('experiment_trial');
  }

  private persistAndNotify(): void {
    this.storage.saveSession(this.session).catch((err) => {
      this.lastPersistenceError = err instanceof Error ? err : new Error(String(err));
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
