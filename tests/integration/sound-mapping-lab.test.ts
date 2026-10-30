import { describe, it, expect, beforeEach } from 'vitest';
import { LabManager } from '../../src/domain/lab/LabManager.js';
import { LAB_TEST_CASES } from '../../src/domain/lab/fixtures.js';
import { ParitySonificationEngine } from '../../src/audio/parity/ParitySonificationEngine.js';
import { IndexedDBStorage } from '../../src/storage/IndexedDBStorage.js';
import 'fake-indexeddb/auto';

describe('Sound Mapping Laboratory Integration (Phase 2)', () => {
  let audioEngine: ParitySonificationEngine;
  let labManager: LabManager;

  beforeEach(() => {
    audioEngine = new ParitySonificationEngine();
    labManager = new LabManager(LAB_TEST_CASES, audioEngine);
  });

  it('loads all core capability test cases', () => {
    const cases = labManager.getFilteredTestCases();
    expect(cases.length).toBeGreaterThanOrEqual(10);

    const categories = new Set(cases.map((c) => c.category));
    expect(categories.has('shape_discrimination')).toBe(true);
    expect(categories.has('shape_recognition')).toBe(true);
    expect(categories.has('identity_vs_category')).toBe(true);
    expect(categories.has('perceived_hierarchy')).toBe(true);
    expect(categories.has('relationship_direction')).toBe(true);
    expect(categories.has('shape_independence')).toBe(true);
    expect(categories.has('geometry_invariance')).toBe(true);
    expect(categories.has('destination_recognition')).toBe(true);
    expect(categories.has('perceived_meaning')).toBe(true);
  });

  it('filters test cases by category correctly', () => {
    labManager.setSelectedCategory('shape_discrimination');
    const shapeCases = labManager.getFilteredTestCases();
    expect(shapeCases.every((c) => c.category === 'shape_discrimination')).toBe(true);

    labManager.setSelectedCategory('geometry_invariance');
    const geomCases = labManager.getFilteredTestCases();
    expect(geomCases.every((c) => c.category === 'geometry_invariance')).toBe(true);

    labManager.setSelectedCategory('all');
    expect(labManager.getFilteredTestCases().length).toBe(LAB_TEST_CASES.length);
  });

  it('supports toggling between training mode and assessment mode (Fix 1)', () => {
    expect(labManager.getMode()).toBe('training');
    labManager.setMode('assessment');
    expect(labManager.getMode()).toBe('assessment');
    labManager.setMode('training');
    expect(labManager.getMode()).toBe('training');
  });

  it('strictly isolates training and blinded assessment responses, timing, and records (Finding 2)', () => {
    // 1. Answer trial 0 in training mode
    labManager.jumpToTest(0);
    const tc0 = labManager.getCurrentTestCase()!;
    labManager.submitResponse('same_category', 'Category test', 'Training observation');

    expect(labManager.getRecords().length).toBe(1);
    expect(labManager.getRecordForTestCase(tc0.id)?.mode).toBe('training');

    // 2. Switch to blinded assessment mode
    labManager.setMode('assessment');

    // Assessment records must be completely empty!
    expect(labManager.getRecords().length).toBe(0);
    expect(labManager.getRecordForTestCase(tc0.id)).toBeUndefined();

    // 3. Submit answer in assessment mode
    labManager.submitResponse('same_category', undefined, undefined);
    expect(labManager.getRecords().length).toBe(1);
    expect(labManager.getRecordForTestCase(tc0.id)?.mode).toBe('assessment');

    // 4. Switch back to training mode
    labManager.setMode('training');
    expect(labManager.getRecords().length).toBe(1);
    expect(labManager.getRecordForTestCase(tc0.id)?.mode).toBe('training');

    // Total records stored across all modes
    expect(labManager.getAllRecords().length).toBe(2);
  });

  it('navigates tests sequentially and supports direct jumps', () => {
    expect(labManager.getCurrentTestIndex()).toBe(0);

    const advanced = labManager.nextTest();
    expect(advanced).toBe(true);
    expect(labManager.getCurrentTestIndex()).toBe(1);

    const backed = labManager.previousTest();
    expect(backed).toBe(true);
    expect(labManager.getCurrentTestIndex()).toBe(0);

    labManager.jumpToTest(3);
    expect(labManager.getCurrentTestIndex()).toBe(3);
  });

  it('tracks replays when audio is triggered', () => {
    expect(labManager.getReplayCount()).toBe(0);

    labManager.playActiveSound();
    expect(labManager.getReplayCount()).toBe(1);

    labManager.playActiveSound();
    expect(labManager.getReplayCount()).toBe(2);

    // Switching test resets replay count
    labManager.nextTest();
    expect(labManager.getReplayCount()).toBe(0);
  });

  it('submits response with stable IDs, evaluates objective correctness, and logs timing (Fix 2)', async () => {
    // Jump to Trial 1: Circle and Circle (shape_discrimination)
    labManager.jumpToTest(0);
    const tc = labManager.getCurrentTestCase()!;
    expect(tc.expectedAnswerId).toBe('same_category');

    // Simulate play
    labManager.playActiveSound();

    // Short delay to ensure duration > 0
    await new Promise((r) => setTimeout(r, 10));

    const record = labManager.submitResponse(
      'same_category',
      'Different category / type of object',
      'Both sounds sounded like pure sine tones.'
    );

    expect(record.testCaseId).toBe(tc.id);
    expect(record.participantResponseId).toBe('same_category');
    expect(record.participantResponseLabel).toBe('Same shape category');
    expect(record.isCorrect).toBe(true);
    expect(record.replayCount).toBe(1);
    expect(record.responseDurationMs).toBeGreaterThanOrEqual(5);
    expect(record.perceivedMeaning).toBe('Different category / type of object');
    expect(record.qualitativeFeedback).toContain('pure sine tones');

    // Verify session summary
    const summary = labManager.getSessionSummary();
    expect(summary.totalTrials).toBe(1);
    expect(summary.scoredTrials).toBe(1);
    expect(summary.correctTrials).toBe(1);
    expect(summary.accuracyPercent).toBe(100);
  });

  it('handles subjective / open-ended perceived meaning trials where isCorrect is null', () => {
    labManager.setSelectedCategory('perceived_meaning');
    labManager.jumpToTest(0);
    const tc = labManager.getCurrentTestCase()!;
    expect(tc.expectedAnswerId).toBeUndefined();

    const record = labManager.submitResponse(
      'diff_category',
      'Different category / type of object',
      'Rich buzz without feeling like an emergency.'
    );

    expect(record.isCorrect).toBeNull(); // Subjective, not objectively scorable
    expect(record.participantResponseId).toBe('diff_category');

    const summary = labManager.getSessionSummary();
    expect(summary.totalTrials).toBe(1);
    expect(summary.scoredTrials).toBe(0); // Excluded from scored accuracy
  });

  it('Verification 12: Laboratory results are not written into formal experiment data', async () => {
    const storage = new IndexedDBStorage();

    // Complete multiple laboratory trials
    labManager.jumpToTest(0);
    labManager.submitResponse('same_category');
    labManager.jumpToTest(1);
    labManager.submitResponse('different_category');

    expect(labManager.getRecords().length).toBe(2);

    // Verify that formal IndexedDB experiment sessions storage remains completely empty
    const allFormalSessions = await storage.getAllSessions();
    expect(allFormalSessions.length).toBe(0);
  });

  it('exports session data to valid JSON and CSV formats with stable identifiers', () => {
    labManager.jumpToTest(0);
    labManager.submitResponse('same_category', 'Different category / type of object', 'No issue');

    // JSON Export
    const jsonStr = labManager.exportJSON();
    const parsed = JSON.parse(jsonStr);
    expect(parsed.mappingVersion).toBe('visual-auditory-parity-v1');
    expect(parsed.records.length).toBe(1);
    expect(parsed.records[0].participantResponseId).toBe('same_category');
    expect(parsed.records[0].expectedAnswerId).toBe('same_category');

    // CSV Export
    const csvStr = labManager.exportCSV();
    expect(csvStr).toContain('participantResponseId');
    expect(csvStr).toContain('same_category');
  });
});
