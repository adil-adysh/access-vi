import { describe, it, expect } from 'vitest';
import { ExperimentRunner } from '../../src/research/recording/ExperimentRunner.js';
import { ExportService } from '../../src/research/recording/ExportService.js';
import { IndexedDBStorage } from '../../src/storage/IndexedDBStorage.js';

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
});
