import { DirectedGraph } from '../../domain/graph/Graph.js';
import { ExplorationController } from '../../domain/navigation/ExplorationController.js';
import { TaskEvaluator } from '../../domain/tasks/TaskEvaluator.js';
import { TaskFactory } from '../../domain/tasks/taskFactory.js';
import { Counterbalance } from './Counterbalance.js';
import { IndexedDBStorage, type StorageResult } from '../../storage/IndexedDBStorage.js';
import { getResearchStimuli } from '../datasets/sampleGraphs.js';
import {
  DEFAULT_EXPERIMENT_POLICY,
  DEFAULT_TRAINING_POLICY
} from '../../domain/navigation/types.js';
import type {
  ExperimentSession,
  TrialLog,
  TrialStatus,
  WorkloadRating,
  ExperimentConfig,
  AudioSettingsSnapshot
} from './types.js';
import type { TaskDefinition, TaskSubmission, TaskEvaluationResult } from '../../domain/tasks/types.js';
import type { ExperimentalConditionId } from '../../domain/navigation/types.js';
import type { AudioCoordinator } from '../../audio/AudioCoordinator.js';

export type ExperimentListener = (session: ExperimentSession) => void;

export class ExperimentRunner {
  private session: ExperimentSession;
  private readonly storage: IndexedDBStorage;
  private readonly allGraphs: Record<string, DirectedGraph>;
  private readonly controller: ExplorationController;
  private readonly audioCoordinator: AudioCoordinator | null = null;

  private currentTasks: TaskDefinition[] = [];
  private activeTrialStartTime: number = 0;
  private explorationMonotonicStart: number = 0;
  private explorationDurationMs: number = 0;
  private responseMonotonicStart: number = 0;

  // Interruption and Pause state
  private pauseMonotonicStart: number = 0;
  private totalPausedDurationMs: number = 0;
  private pauseCount: number = 0;
  private interruptedPhase: 'trial_active' | 'trial_response' = 'trial_active';
  private interruptionReason: string = '';

  // Audio snapshot frozen at trial start
  private activeTrialAudioSnapshot: AudioSettingsSnapshot | null = null;

  private lastStorageResult: StorageResult | null = null;
  private lastPersistenceError: Error | null = null;
  private listeners: Set<ExperimentListener> = new Set();

  constructor(
    config: Partial<ExperimentConfig> & { audioCoordinator?: AudioCoordinator } = {},
    storage?: IndexedDBStorage,
    controller?: ExplorationController,
    initialSession?: ExperimentSession,
    audioCoordinator?: AudioCoordinator
  ) {
    this.storage = storage ?? new IndexedDBStorage();
    this.audioCoordinator = audioCoordinator ?? config.audioCoordinator ?? null;
    this.allGraphs = getResearchStimuli();
    this.controller = controller ?? new ExplorationController(
      undefined,
      'condition_a_speech',
      'training',
      DEFAULT_TRAINING_POLICY
    );

    if (initialSession) {
      if (!ExperimentRunner.validateSessionSchema(initialSession)) {
        throw new Error('Invalid experiment session schema; cannot rehydrate session.');
      }

      // If reloaded while a trial was active or in response, do not resume as if uninterrupted
      if (initialSession.currentPhase === 'trial_active' || initialSession.currentPhase === 'trial_response') {
        const phaseBefore = initialSession.currentPhase;
        this.interruptedPhase = phaseBefore;
        this.interruptionReason = 'Browser reloaded / tab closed while trial was active';
        this.session = {
          ...initialSession,
          currentPhase: 'trial_interrupted',
          activeTrialInterruptedReason: this.interruptionReason,
          activeTrialPausedAt: Date.now(),
          interruptedPhaseBeforePause: phaseBefore
        };
      } else {
        this.session = initialSession;
      }
      this.prepareBlock(this.session.currentBlockIndex);
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

  public static validateSessionSchema(data: unknown): data is ExperimentSession {
    if (!data || typeof data !== 'object') return false;
    const s = data as Record<string, unknown>;
    return (
      typeof s.sessionId === 'string' &&
      typeof s.participantId === 'string' &&
      Array.isArray(s.conditionOrder) &&
      s.conditionOrder.length === 3 &&
      typeof s.currentPhase === 'string' &&
      typeof s.currentBlockIndex === 'number' &&
      typeof s.currentTrialIndex === 'number' &&
      Array.isArray(s.trials) &&
      typeof s.workloadRatings === 'object'
    );
  }

  public getSession(): ExperimentSession {
    return { ...this.session };
  }

  public getController(): ExplorationController {
    return this.controller;
  }

  public getLastStorageResult(): StorageResult | null {
    return this.lastStorageResult;
  }

  public getLastPersistenceError(): Error | null {
    return this.lastPersistenceError;
  }

  public isTrialActive(): boolean {
    return (
      this.session.currentPhase === 'trial_active' ||
      this.session.currentPhase === 'trial_response' ||
      this.session.currentPhase === 'trial_interrupted'
    );
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
    if (this.session.currentPhase !== 'trial_prep' && this.session.currentPhase !== 'trial_interrupted') {
      throw new Error(`Invalid phase transition: cannot start exploration from phase "${this.session.currentPhase}".`);
    }

    const nowMonotonic = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.activeTrialStartTime = Date.now();
    this.explorationMonotonicStart = nowMonotonic;
    this.explorationDurationMs = 0;
    this.responseMonotonicStart = 0;
    this.pauseMonotonicStart = 0;
    this.totalPausedDurationMs = 0;
    this.pauseCount = 0;
    this.interruptionReason = '';

    // Capture frozen immutable snapshot of audio settings from coordinator
    this.activeTrialAudioSnapshot = this.captureAudioSnapshot();

    this.controller.resetActionHistory();
    this.controller.setMode('experiment_trial');
    this.controller.setExposurePolicy(DEFAULT_EXPERIMENT_POLICY);
    this.session = {
      ...this.session,
      currentPhase: 'trial_active',
      activeTrialInterruptedReason: undefined,
      activeTrialPausedAt: undefined,
      interruptedPhaseBeforePause: undefined
    };
    this.persistAndNotify();
  }

  public finishExplorationProceedToResponse(): void {
    if (this.session.currentPhase !== 'trial_active') {
      throw new Error(`Invalid phase transition: cannot finish exploration from phase "${this.session.currentPhase}".`);
    }
    const nowMonotonic = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const activeSegment = Math.max(0, nowMonotonic - this.explorationMonotonicStart);
    this.explorationDurationMs += activeSegment;
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
      pauseCount: this.pauseCount,
      pausedDurationMs: this.totalPausedDurationMs,
      audioMappingVersion: this.activeTrialAudioSnapshot?.sonificationVersion ?? this.session.sonificationVersion,
      audioSettings: this.activeTrialAudioSnapshot ?? {
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

    this.advanceToNextTrialOrPhase();
    return evaluation;
  }

  public recordInterruption(reason: string): void {
    if (this.session.currentPhase === 'trial_active' || this.session.currentPhase === 'trial_response') {
      this.controller.cancelPlayback(reason);
      const nowMonotonic = typeof performance !== 'undefined' ? performance.now() : Date.now();

      // Accumulate exploration duration up to the interruption point
      if (this.session.currentPhase === 'trial_active') {
        const segment = Math.max(0, nowMonotonic - this.explorationMonotonicStart);
        this.explorationDurationMs += segment;
      }

      this.pauseMonotonicStart = nowMonotonic;
      this.interruptedPhase = this.session.currentPhase;
      this.interruptionReason = reason;

      this.session = {
        ...this.session,
        currentPhase: 'trial_interrupted',
        activeTrialInterruptedReason: reason,
        activeTrialPausedAt: Date.now(),
        interruptedPhaseBeforePause: this.interruptedPhase
      };

      this.persistAndNotify();
    }
  }

  public resumeTrial(): void {
    if (this.session.currentPhase !== 'trial_interrupted') {
      throw new Error(`Invalid phase transition: cannot resume trial from phase "${this.session.currentPhase}".`);
    }

    const nowMonotonic = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (this.pauseMonotonicStart > 0) {
      const pausedMs = Math.max(0, nowMonotonic - this.pauseMonotonicStart);
      this.totalPausedDurationMs += pausedMs;
      this.pauseCount++;
    }

    // Reset monotonic start time for remaining active duration
    if (this.interruptedPhase === 'trial_active') {
      this.explorationMonotonicStart = nowMonotonic;
    } else {
      this.responseMonotonicStart = nowMonotonic;
    }

    this.session = {
      ...this.session,
      currentPhase: this.interruptedPhase,
      activeTrialInterruptedReason: undefined,
      activeTrialPausedAt: undefined,
      interruptedPhaseBeforePause: undefined
    };

    this.persistAndNotify();
  }

  public restartTrial(): void {
    if (this.session.currentPhase !== 'trial_interrupted') {
      throw new Error(`Invalid phase transition: cannot restart trial from phase "${this.session.currentPhase}".`);
    }

    // Log the interrupted attempt for audit traceability
    this.recordInterruptedTrialLog('interrupted');

    // Reset trial state and start cleanly from the beginning
    this.setupControllerForCurrentTask();
    this.startTrialExploration();
  }

  public abandonTrial(reason: string = 'Participant abandoned trial'): void {
    if (this.session.currentPhase !== 'trial_interrupted' && !this.isTrialActive()) {
      throw new Error(`Invalid phase transition: cannot abandon trial from phase "${this.session.currentPhase}".`);
    }

    this.interruptionReason = reason;
    this.recordInterruptedTrialLog('abandoned');
    this.advanceToNextTrialOrPhase();
  }

  public timeoutTrial(): void {
    if (!this.isTrialActive() && this.session.currentPhase !== 'trial_interrupted') {
      throw new Error(`Invalid phase transition: cannot timeout trial from phase "${this.session.currentPhase}".`);
    }

    this.interruptionReason = 'Trial timeout limit reached';
    this.recordInterruptedTrialLog('timeout');
    this.advanceToNextTrialOrPhase();
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

  public subscribe(listener: ExperimentListener): () => void {
    this.listeners.add(listener);
    listener(this.getSession());
    return () => this.listeners.delete(listener);
  }

  private advanceToNextTrialOrPhase(): void {
    this.controller.cancelPlayback();
    if (this.session.currentTrialIndex + 1 < this.currentTasks.length) {
      this.session = {
        ...this.session,
        currentTrialIndex: this.session.currentTrialIndex + 1,
        currentPhase: 'trial_prep',
        activeTrialInterruptedReason: undefined,
        activeTrialPausedAt: undefined,
        interruptedPhaseBeforePause: undefined
      };
      this.setupControllerForCurrentTask();
    } else {
      this.session = {
        ...this.session,
        currentPhase: 'workload',
        activeTrialInterruptedReason: undefined,
        activeTrialPausedAt: undefined,
        interruptedPhaseBeforePause: undefined
      };
    }
    this.persistAndNotify();
  }

  private recordInterruptedTrialLog(status: TrialStatus): void {
    const graph = this.getCurrentGraph();
    const task = this.getCurrentTask();
    if (!task) return;

    const navLog = this.controller.getActionHistory();
    const now = Date.now();

    const submission: TaskSubmission = {
      taskId: task.id,
      answer: 'UNFINISHED',
      startTimeMonotonicMs: this.explorationMonotonicStart,
      endTimeMonotonicMs: typeof performance !== 'undefined' ? performance.now() : now,
      durationMs: this.explorationDurationMs
    };

    const evaluation: TaskEvaluationResult = {
      taskId: task.id,
      taskType: task.type,
      isCorrect: false,
      score: 0,
      expectedAnswer: null,
      actualAnswer: 'UNFINISHED',
      explanation: `Trial was not completed (status: ${status}, reason: ${this.interruptionReason || 'unknown'}).`
    };

    const trialLog: TrialLog = {
      trialId: `trial_${this.session.currentBlockIndex}_${this.session.currentTrialIndex}_${now}`,
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
      endTimestamp: now,
      durationMs: this.explorationDurationMs,
      explorationDurationMs: this.explorationDurationMs,
      responseDurationMs: 0,
      replayCount: navLog.filter((e) => e.actionType === 'REPLAY').length,
      inspectionCount: navLog.filter((e) => e.actionType === 'INSPECT').length,
      backtrackCount: navLog.filter((e) => e.actionType === 'GO_BACK').length,
      traversalCount: navLog.filter((e) => e.actionType === 'TRAVERSE').length,
      status,
      interruptionReason: this.interruptionReason,
      pauseCount: this.pauseCount,
      pausedDurationMs: this.totalPausedDurationMs,
      audioMappingVersion: this.activeTrialAudioSnapshot?.sonificationVersion ?? this.session.sonificationVersion,
      audioSettings: this.activeTrialAudioSnapshot ?? undefined
    };

    this.session = {
      ...this.session,
      trials: [...this.session.trials, trialLog]
    };
  }

  private captureAudioSnapshot(): AudioSettingsSnapshot {
    const cfg = this.audioCoordinator?.getConfig();
    return {
      waveform: 'sine',
      playbackSpeed: cfg?.playbackSpeed ?? 1.0,
      masterVolume: cfg?.masterVolume ?? 0.7,
      baseFrequencyHz: cfg?.baseFrequencyHz ?? 220,
      useSpatial: this.getCurrentCondition() === 'condition_c_spatial',
      sonificationVersion: cfg?.version ?? this.session.sonificationVersion
    };
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
    this.storage.saveSession(this.session).then((result) => {
      this.lastStorageResult = result;
      if (!result.isPersistent && result.error) {
        this.lastPersistenceError = result.error;
        console.warn('IndexedDB persistence warning:', result.error);
      }
    }).catch((err) => {
      this.lastPersistenceError = err instanceof Error ? err : new Error(String(err));
      console.warn('Failed to save session:', err);
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
