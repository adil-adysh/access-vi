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
    expect(categories.has('identity_vs_category')).toBe(true);
    expect(categories.has('relationship_direction')).toBe(true);
    expect(categories.has('shape_independence')).toBe(true);
    expect(categories.has('geometry_invariance')).toBe(true);
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

  it('submits response, evaluates objective correctness, and logs timing and qualitative feedback', async () => {
    // Jump to Trial 1: Circle and Circle (shape_discrimination)
    labManager.jumpToTest(0);
    const tc = labManager.getCurrentTestCase()!;
    expect(tc.expectedAnswer).toBe('Same shape category');

    // Simulate play
    labManager.playActiveSound();

    // Short delay to ensure duration > 0
    await new Promise((r) => setTimeout(r, 10));

    const record = labManager.submitResponse(
      'Same shape category',
      'Different category / type of object',
      'Both sounds sounded like pure sine tones.'
    );

    expect(record.testCaseId).toBe(tc.id);
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
    expect(tc.expectedAnswer).toBeUndefined();

    const record = labManager.submitResponse(
      'Different category / type of object',
      'Different category / type of object',
      'Rich buzz without feeling like an emergency.'
    );

    expect(record.isCorrect).toBeNull(); // Subjective, not objectively scorable
    expect(record.participantResponse).toBe('Different category / type of object');

    const summary = labManager.getSessionSummary();
    expect(summary.totalTrials).toBe(1);
    expect(summary.scoredTrials).toBe(0); // Excluded from scored accuracy
  });

  // ------------------------------------------------------------------------
  // Verification Item 12: Laboratory results are not written into formal experiment data
  // ------------------------------------------------------------------------
  it('Verification 12: Laboratory results are not written into formal experiment data', async () => {
    const storage = new IndexedDBStorage();

    // Complete multiple laboratory trials
    labManager.jumpToTest(0);
    labManager.submitResponse('Same shape category');
    labManager.jumpToTest(1);
    labManager.submitResponse('Different shape categories');

    expect(labManager.getRecords().length).toBe(2);

    // Verify that formal IndexedDB experiment sessions storage remains completely empty
    const allFormalSessions = await storage.getAllSessions();
    expect(allFormalSessions.length).toBe(0);
  });

  it('exports session data to valid JSON and CSV formats', () => {
    labManager.jumpToTest(0);
    labManager.submitResponse('Same shape category', 'Different category / type of object', 'No issue');

    // JSON Export
    const jsonStr = labManager.exportJSON();
    const parsed = JSON.parse(jsonStr);
    expect(parsed.mappingVersion).toBe('visual-auditory-parity-v1');
    expect(parsed.summary.totalTrials).toBe(1);
    expect(parsed.records.length).toBe(1);
    expect(parsed.records[0].participantResponse).toBe('Same shape category');

    // CSV Export
    const csvStr = labManager.exportCSV();
    expect(csvStr).toContain('mappingVersion,testCaseId,category');
    expect(csvStr).toContain('visual-auditory-parity-v1');
    expect(csvStr).toContain('Same shape category');
  });

  it('clears records without side effects', () => {
    labManager.jumpToTest(0);
    labManager.submitResponse('Same shape category');
    expect(labManager.getRecords().length).toBe(1);

    labManager.clearRecords();
    expect(labManager.getRecords().length).toBe(0);
    expect(labManager.getSessionSummary().totalTrials).toBe(0);
  });
});
