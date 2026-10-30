import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { ExperimentRunner } from '../../src/research/recording/ExperimentRunner.js';
import { ExportService } from '../../src/research/recording/ExportService.js';
import { IndexedDBStorage } from '../../src/storage/IndexedDBStorage.js';
import { ExplorationController } from '../../src/domain/navigation/ExplorationController.js';
import { DirectedGraph } from '../../src/domain/graph/Graph.js';
import { AudioCoordinator } from '../../src/audio/AudioCoordinator.js';

describe('Experiment Runner & Session Lifecycle Integration', () => {
  it('walks through entire experiment session lifecycle and records metrics', async () => {
    const storage = new IndexedDBStorage();
    const runner = new ExperimentRunner({ participantId: 'P_01' }, storage);

    expect(runner.getSession().currentPhase).toBe('consent');

    // Consent
    runner.acceptConsent();
    expect(runner.getSession().currentPhase).toBe('calibration');

    // Calibration
    runner.completeCalibration();
    expect(runner.getSession().currentPhase).toBe('training');

    // Training
    runner.completeTraining();
    expect(runner.getSession().currentPhase).toBe('trial_prep');
    expect(runner.getSession().currentBlockIndex).toBe(0);

    // Block 0, Trial 0: Branch Identification
    const task0 = runner.getCurrentTask();
    expect(task0).not.toBeNull();
    expect(task0?.type).toBe('branch_identification');

    runner.startTrialExploration();
    expect(runner.getSession().currentPhase).toBe('trial_active');

    // Perform navigation actions
    runner.getController().nextNeighbor();
    runner.getController().traverseSelectedNeighbor();

    runner.finishExplorationProceedToResponse();
    expect(runner.getSession().currentPhase).toBe('trial_response');

    // Submit answer (A is valid branching node in Graph 1)
    const eval0 = runner.submitTrialResponse('A');
    expect(eval0.isCorrect).toBe(true);

    // Runner advances to next trial in block
    expect(runner.getSession().currentPhase).toBe('trial_prep');
    expect(runner.getSession().currentTrialIndex).toBe(1);

    // Complete remaining trials in Block 0
    const totalInBlock = runner.getTotalTasksInBlock();
    for (let t = 1; t < totalInBlock; t++) {
      runner.startTrialExploration();
      runner.finishExplorationProceedToResponse();
      runner.submitTrialResponse('D'); // answers
    }

    // Now Block 0 should be complete -> moved to workload phase
    expect(runner.getSession().currentPhase).toBe('workload');

    // Submit workload rating for Condition 1
    runner.submitWorkloadRating({
      mentalDemand: 4,
      physicalDemand: 1,
      temporalDemand: 3,
      performance: 8,
      effort: 4,
      frustration: 2
    });

    expect(runner.getSession().currentPhase).toBe('rest');

    // Proceed to Block 1
    runner.finishRestProceedToNextBlock();
    expect(runner.getSession().currentBlockIndex).toBe(1);
    expect(runner.getSession().currentPhase).toBe('trial_prep');

    // Verify session trials logged
    const session = runner.getSession();
    expect(session.trials.length).toBe(totalInBlock);
    expect(session.trials[0].navigationLog.length).toBeGreaterThan(0);

    // Test JSON and CSV export
    const json = ExportService.exportJSON(session);
    expect(json).toContain('"participantId": "P_01"');

    const csv = ExportService.exportCSV(session);
    expect(csv).toContain('participantId,sessionId,blockIndex');
    expect(csv).toContain('P_01');
  });

  it('persists session in storage and retrieves it', async () => {
    const storage = new IndexedDBStorage();
    const runner = new ExperimentRunner({ participantId: 'P_PERSIST' }, storage);
    runner.acceptConsent();

    const retrieved = await storage.getSession(runner.getSession().sessionId);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.participantId).toBe('P_PERSIST');
    expect(retrieved?.currentPhase).toBe('calibration');
  });

  it('rejects invalid state machine phase transitions and repeated submissions', () => {
    const storage = new IndexedDBStorage();
    const runner = new ExperimentRunner({ participantId: 'P_FSM' }, storage);

    // Initial phase is consent: cannot skip straight to trials or calibration
    expect(() => runner.completeCalibration()).toThrow(/invalid phase transition/i);
    expect(() => runner.startTrialExploration()).toThrow(/invalid phase transition/i);
    expect(() => runner.submitTrialResponse('A')).toThrow(/invalid phase transition/i);

    runner.acceptConsent(); // now in calibration
    expect(() => runner.acceptConsent()).toThrow(/invalid phase transition/i);
    expect(() => runner.completeTraining()).toThrow(/invalid phase transition/i);

    runner.completeCalibration(); // now in training
    runner.completeTraining(); // now in trial_prep
    expect(() => runner.finishExplorationProceedToResponse()).toThrow(/invalid phase transition/i);

    runner.startTrialExploration(); // now in trial_active
    expect(() => runner.startTrialExploration()).toThrow(/invalid phase transition/i);
    expect(() => runner.submitTrialResponse('A')).toThrow(/invalid phase transition/i);

    runner.finishExplorationProceedToResponse(); // now in trial_response
    runner.submitTrialResponse('A'); // advances to trial_prep for next trial

    // Cannot resubmit response for already submitted trial
    expect(() => runner.submitTrialResponse('A')).toThrow(/invalid phase transition/i);
  });

  it('isolates experiment controller from external free exploration and imports', () => {
    const storage = new IndexedDBStorage();
    const runner = new ExperimentRunner({ participantId: 'P_ISOLATED' }, storage);

    runner.acceptConsent();
    runner.completeCalibration();
    runner.completeTraining();
    runner.startTrialExploration();

    const experimentController = runner.getController();
    const experimentGraphId = runner.getCurrentGraph().getMetadata().id;
    const initialCondition = runner.getCurrentCondition();

    expect(experimentController.getState().mode).toBe('experiment_trial');
    expect(experimentController.getState().exposurePolicy.showAdjacencyTable).toBe(false);
    expect(experimentController.getState().exposurePolicy.showGlobalMetrics).toBe(false);

    // Create a separate free controller simulating external UI actions
    const freeGraph = new DirectedGraph({ id: 'external-custom', name: 'External Custom Graph' });
    freeGraph.addNode({ id: 'Z' });

    const freeController = new ExplorationController(freeGraph, 'condition_c_spatial');

    // Free controller actions should NOT mutate runner state or its controller
    freeController.nextNeighbor();
    expect(runner.getController().getState().graph.getMetadata().id).toBe(experimentGraphId);
    expect(runner.getCurrentCondition()).toBe(initialCondition);
    expect(runner.getSession().currentPhase).toBe('trial_active');
  });

  it('measures monotonic duration and separates exploration time from response time', async () => {
    const storage = new IndexedDBStorage();
    const runner = new ExperimentRunner({ participantId: 'P_TIMER' }, storage);

    runner.acceptConsent();
    runner.completeCalibration();
    runner.completeTraining();

    runner.startTrialExploration();
    // Simulate short exploration delay
    await new Promise((r) => setTimeout(r, 20));
    runner.finishExplorationProceedToResponse();

    // Simulate short response delay
    await new Promise((r) => setTimeout(r, 20));
    runner.submitTrialResponse('A');

    const session = runner.getSession();
    const trial = session.trials[0];
    expect(trial.explorationDurationMs).toBeGreaterThan(0);
    expect(trial.responseDurationMs).toBeGreaterThan(0);
    expect(trial.durationMs).toBeGreaterThanOrEqual(trial.explorationDurationMs + trial.responseDurationMs);
    expect(trial.graphHash).toBeDefined();
    expect(trial.status).toBe('completed');
  });

  it('records trial interruptions when participant switches away or aborts', () => {
    const storage = new IndexedDBStorage();
    const runner = new ExperimentRunner({ participantId: 'P_INTERRUPT' }, storage);

    runner.acceptConsent();
    runner.completeCalibration();
    runner.completeTraining();
    runner.startTrialExploration();

    runner.recordInterruption('Switched tab');

    const log = runner.getController().getActionHistory();
    const interruptAction = log.find((e) => e.actionType === 'CANCEL_PLAYBACK');
    expect(interruptAction).toBeDefined();
    expect(interruptAction?.details?.interruptionReason).toBe('Switched tab');
  });

  it('starts with empty workload ratings and accurately records raw NASA-TLX subscales', () => {
    const storage = new IndexedDBStorage();
    const runner = new ExperimentRunner({ participantId: 'P_WORKLOAD' }, storage);

    // Initial session must not have fake participant scores
    expect(runner.getSession().workloadRatings).toEqual({});

    runner.acceptConsent();
    runner.completeCalibration();
    runner.completeTraining();

    // Finish block 0 trials
    const total = runner.getTotalTasksInBlock();
    for (let i = 0; i < total; i++) {
      runner.startTrialExploration();
      runner.finishExplorationProceedToResponse();
      runner.submitTrialResponse('A');
    }

    expect(runner.getSession().currentPhase).toBe('workload');

    const submittedRating = {
      mentalDemand: 6,
      physicalDemand: 2,
      temporalDemand: 4,
      performance: 9,
      effort: 5,
      frustration: 3,
      comments: 'Auditory sweep was easy to distinguish'
    };

    runner.submitWorkloadRating(submittedRating);
    const cond = runner.getSession().conditionOrder[0];
    expect(runner.getSession().workloadRatings[cond]).toEqual(submittedRating);
  });

  it('captures real audio configuration from coordinator and records actual parameters in trial and CSV', () => {
    const storage = new IndexedDBStorage();
    const audioCoordinator = new AudioCoordinator();
    audioCoordinator.updateConfig({
      masterVolume: 0.42,
      playbackSpeed: 1.25,
      baseFrequencyHz: 330
    });

    const runner = new ExperimentRunner(
      { participantId: 'P_AUDIO_CONFIG' },
      storage,
      undefined,
      undefined,
      audioCoordinator
    );

    runner.acceptConsent();
    runner.completeCalibration();
    runner.completeTraining();
    runner.startTrialExploration();
    runner.finishExplorationProceedToResponse();
    runner.submitTrialResponse('A');

    const trial = runner.getSession().trials[0];
    expect(trial.audioSettings).toBeDefined();
    expect(trial.audioSettings?.masterVolume).toBe(0.42);
    expect(trial.audioSettings?.playbackSpeed).toBe(1.25);
    expect(trial.audioSettings?.baseFrequencyHz).toBe(330);

    const csv = ExportService.exportCSV(runner.getSession());
    expect(csv).toContain('0.42');
    expect(csv).toContain('1.25');
  });

  it('handles interruption lifecycle: pause, restart, and exclusion of interrupted attempts', () => {
    const storage = new IndexedDBStorage();
    const runner = new ExperimentRunner({ participantId: 'P_INTERRUPT_FLOW' }, storage);

    runner.acceptConsent();
    runner.completeCalibration();
    runner.completeTraining();
    runner.startTrialExploration();

    expect(runner.isTrialActive()).toBe(true);
    runner.recordInterruption('User minimized window');

    expect(runner.getSession().currentPhase).toBe('trial_interrupted');
    expect(runner.isTrialActive()).toBe(true); // Locked while trial is interrupted/paused

    // Restart trial: previous attempt is recorded as 'interrupted', new attempt begins at trial_active
    runner.restartTrial();
    expect(runner.getSession().currentPhase).toBe('trial_active');

    const interruptedAttempt = runner.getSession().trials.find((t) => t.status === 'interrupted');
    expect(interruptedAttempt).toBeDefined();
    expect(interruptedAttempt?.interruptionReason).toBe('User minimized window');

    // Finish new attempt cleanly
    runner.finishExplorationProceedToResponse();
    runner.submitTrialResponse('A');

    const completedAttempt = runner.getSession().trials.find((t) => t.status === 'completed');
    expect(completedAttempt).toBeDefined();
  });

  it('safely rehydrates an interrupted session upon browser reload into trial_interrupted phase', () => {
    const storage = new IndexedDBStorage();
    const runner1 = new ExperimentRunner({ participantId: 'P_RELOAD' }, storage);

    runner1.acceptConsent();
    runner1.completeCalibration();
    runner1.completeTraining();
    runner1.startTrialExploration();

    const activeSession = runner1.getSession();
    expect(activeSession.currentPhase).toBe('trial_active');

    // Simulate browser reload where saved session is loaded on startup
    const runner2 = new ExperimentRunner({}, storage, undefined, activeSession);

    // Runner2 must NOT blindly continue with corrupted monotonic time
    expect(runner2.getSession().currentPhase).toBe('trial_interrupted');
    expect(runner2.getSession().activeTrialInterruptedReason).toContain('Browser reloaded');
  });
});
