import type {
  LabTestCase,
  LabTestRecord,
  LabSessionSummary,
  LabTestCategory,
  LabMode
} from './types.js';
import { LAB_TEST_CASES } from './fixtures.js';
import type { ParitySonificationEngine } from '../../audio/parity/ParitySonificationEngine.js';
import type { NodeShape } from '../presentation/types.js';

export type LabStateListener = () => void;

/**
 * LabManager coordinates the Sound Mapping Laboratory state, test progression,
 * interaction timing, replay counting, answer validation, and session exports.
 *
 * Rule E: Laboratory data is strictly session-scoped and never written to formal study storage.
 */
export class LabManager {
  private readonly testCases: readonly LabTestCase[];
  private readonly audioEngine?: ParitySonificationEngine;
  private currentTestIndex: number = 0;
  private selectedCategory: LabTestCategory | 'all' = 'all';
  private mode: LabMode = 'training';

  private activeTestStartTime: number = 0;
  private currentReplayCount: number = 0;
  private records: LabTestRecord[] = [];

  private listeners: Set<LabStateListener> = new Set();

  constructor(
    testCases: readonly LabTestCase[] = LAB_TEST_CASES,
    audioEngine?: ParitySonificationEngine,
    initialMode: LabMode = 'training'
  ) {
    this.testCases = testCases;
    this.audioEngine = audioEngine;
    this.mode = initialMode;
    this.startActiveTestTiming();
  }

  public subscribe(listener: LabStateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        console.error('Error in LabStateListener:', err);
      }
    }
  }

  public getMode(): LabMode {
    return this.mode;
  }

  public setMode(mode: LabMode): void {
    if (this.mode !== mode) {
      this.mode = mode;
      this.startActiveTestTiming();
      this.notify();
    }
  }

  public getSelectedCategory(): LabTestCategory | 'all' {
    return this.selectedCategory;
  }

  public setSelectedCategory(cat: LabTestCategory | 'all'): void {
    this.selectedCategory = cat;
    this.currentTestIndex = 0;
    this.startActiveTestTiming();
    this.notify();
  }

  public getFilteredTestCases(): readonly LabTestCase[] {
    if (this.selectedCategory === 'all') {
      return this.testCases;
    }
    return this.testCases.filter((tc) => tc.category === this.selectedCategory);
  }

  public getCurrentTestIndex(): number {
    return this.currentTestIndex;
  }

  public getCurrentTestCase(): LabTestCase | null {
    const list = this.getFilteredTestCases();
    if (list.length === 0) return null;
    return list[this.currentTestIndex] ?? null;
  }

  public getTotalTests(): number {
    return this.getFilteredTestCases().length;
  }

  public getReplayCount(): number {
    return this.currentReplayCount;
  }

  public getRecords(mode?: LabMode): readonly LabTestRecord[] {
    if (mode) {
      return this.records.filter((r) => r.mode === mode);
    }
    return this.records.filter((r) => r.mode === this.mode);
  }

  public getAllRecords(): readonly LabTestRecord[] {
    return [...this.records];
  }

  public clearRecords(mode?: LabMode): void {
    if (mode) {
      this.records = this.records.filter((r) => r.mode !== mode);
    } else {
      this.records = [];
    }
    this.notify();
  }

  public nextTest(): boolean {
    const total = this.getTotalTests();
    if (this.currentTestIndex < total - 1) {
      this.currentTestIndex++;
      this.startActiveTestTiming();
      this.notify();
      return true;
    }
    return false;
  }

  public previousTest(): boolean {
    if (this.currentTestIndex > 0) {
      this.currentTestIndex--;
      this.startActiveTestTiming();
      this.notify();
      return true;
    }
    return false;
  }

  public jumpToTest(index: number): void {
    const total = this.getTotalTests();
    if (index >= 0 && index < total) {
      this.currentTestIndex = index;
      this.startActiveTestTiming();
      this.notify();
    }
  }

  private startActiveTestTiming(): void {
    this.activeTestStartTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.currentReplayCount = 0;
  }

  // Audio Playback Triggers
  public playActiveSound(): void {
    const tc = this.getCurrentTestCase();
    if (!tc || !this.audioEngine) return;

    this.currentReplayCount++;
    const stim = tc.soundStimulus;

    switch (stim.type) {
      case 'single_shape':
        if (stim.shape1) {
          this.audioEngine.playNodeShape(stim.shape1);
        }
        break;

      case 'compare_shapes':
        if (stim.shape1 && stim.shape2) {
          this.audioEngine.playTwoShapeComparison(stim.shape1, stim.shape2);
        }
        break;

      case 'edge_journey':
        if (stim.shape1 && stim.shape2 && stim.direction) {
          this.audioEngine.playFullDirectedRelationship(
            stim.shape1,
            stim.shape2,
            stim.direction
          );
        }
        break;

      case 'compare_edge_journeys':
        if (stim.journey1 && stim.journey2) {
          this.audioEngine.playTwoJourneyComparison(stim.journey1, stim.journey2);
        }
        break;

      case 'direction_only':
        if (stim.direction) {
          this.audioEngine.playRelationshipDirection(stim.direction);
        }
        break;
    }
    this.notify();
  }

  public playSpecificShape(shape: NodeShape): void {
    if (this.audioEngine) {
      this.currentReplayCount++;
      this.audioEngine.playNodeShape(shape);
      this.notify();
    }
  }

  public stopAudio(): void {
    if (this.audioEngine) {
      this.audioEngine.cancelPlayback();
    }
  }

  /**
   * Submits a participant response for the active test case using stable answer IDs.
   */
  public submitResponse(
    responseId: string,
    perceivedMeaning?: string,
    qualitativeFeedback?: string
  ): LabTestRecord {
    const tc = this.getCurrentTestCase();
    if (!tc) {
      throw new Error('No active test case to record response.');
    }

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const durationMs = Math.round(Math.max(0, now - this.activeTestStartTime));

    const option = tc.options.find((o) => o.id === responseId);
    const participantResponseId = responseId;
    const participantResponseLabel = option ? option.label : responseId;

    const isCorrect =
      tc.expectedAnswerId !== undefined
        ? participantResponseId === tc.expectedAnswerId
        : null;

    const record: LabTestRecord = {
      mappingVersion: this.audioEngine?.getRegistry().getVersion() ?? 'visual-auditory-parity-v1',
      testCaseId: tc.id,
      category: tc.category,
      mode: this.mode,
      prompt: tc.prompt,
      expectedAnswerId: tc.expectedAnswerId,
      participantResponseId,
      participantResponseLabel,
      isCorrect,
      replayCount: this.currentReplayCount,
      responseDurationMs: durationMs,
      perceivedMeaning,
      qualitativeFeedback,
      timestamp: new Date().toISOString()
    };

    // Remove existing record for the same testCaseId and mode if already answered
    this.records = this.records.filter((r) => !(r.testCaseId === tc.id && r.mode === this.mode));
    this.records.push(record);

    this.notify();
    return record;
  }

  public getRecordForTestCase(testCaseId: string, mode?: LabMode): LabTestRecord | undefined {
    const targetMode = mode ?? this.mode;
    return this.records.find((r) => r.testCaseId === testCaseId && r.mode === targetMode);
  }

  public getSessionSummary(mode?: LabMode): LabSessionSummary {
    const targetMode = mode ?? this.mode;
    const modeRecords = this.records.filter((r) => r.mode === targetMode);
    const totalTrials = modeRecords.length;
    const scoredRecords = modeRecords.filter((r) => r.isCorrect !== null);
    const scoredTrials = scoredRecords.length;
    const correctTrials = scoredRecords.filter((r) => r.isCorrect === true).length;
    const accuracyPercent = scoredTrials > 0 ? (correctTrials / scoredTrials) * 100 : 0;

    const avgReplayCount =
      totalTrials > 0
        ? modeRecords.reduce((sum, r) => sum + r.replayCount, 0) / totalTrials
        : 0;

    const avgResponseDurationMs =
      totalTrials > 0
        ? modeRecords.reduce((sum, r) => sum + r.responseDurationMs, 0) / totalTrials
        : 0;

    return {
      totalTrials,
      scoredTrials,
      correctTrials,
      accuracyPercent,
      avgReplayCount,
      avgResponseDurationMs
    };
  }

  public exportJSON(mode?: LabMode): string {
    const targetMode = mode ?? this.mode;
    const payload = {
      exportedAt: new Date().toISOString(),
      mappingVersion: this.audioEngine?.getRegistry().getVersion() ?? 'visual-auditory-parity-v1',
      mode: targetMode,
      summary: this.getSessionSummary(targetMode),
      records: this.getRecords(targetMode)
    };
    return JSON.stringify(payload, null, 2);
  }

  public exportCSV(mode?: LabMode): string {
    const targetMode = mode ?? this.mode;
    const modeRecords = this.getRecords(targetMode);
    const headers = [
      'timestamp',
      'mappingVersion',
      'mode',
      'testCaseId',
      'category',
      'expectedAnswerId',
      'participantResponseId',
      'participantResponseLabel',
      'isCorrect',
      'replayCount',
      'responseDurationMs',
      'perceivedMeaning',
      'qualitativeFeedback'
    ];

    function escapeCSV(val: unknown): string {
      if (val === null || val === undefined) return '';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }

    const rows = modeRecords.map((r) => [
      escapeCSV(r.timestamp),
      escapeCSV(r.mappingVersion),
      escapeCSV(r.mode),
      escapeCSV(r.testCaseId),
      escapeCSV(r.category),
      escapeCSV(r.expectedAnswerId),
      escapeCSV(r.participantResponseId),
      escapeCSV(r.participantResponseLabel),
      escapeCSV(r.isCorrect === null ? 'N/A' : r.isCorrect ? 'TRUE' : 'FALSE'),
      escapeCSV(r.replayCount),
      escapeCSV(r.responseDurationMs),
      escapeCSV(r.perceivedMeaning),
      escapeCSV(r.qualitativeFeedback)
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  }
}
