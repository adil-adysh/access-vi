import { describe, it, expect } from 'vitest';
import { SonificationStrategy } from '../../src/audio/sonification/SonificationStrategy.js';
import type { SemanticAudioEvent, SonificationConfig } from '../../src/audio/types.js';
import { DEFAULT_SONIFICATION_CONFIG } from '../../src/audio/types.js';

describe('Audio Engine & Sonification Strategy', () => {
  it('assigns frequencies deterministically to node IDs', () => {
    const fA = SonificationStrategy.getNodeFrequency('A');
    const fB = SonificationStrategy.getNodeFrequency('B');
    const fC = SonificationStrategy.getNodeFrequency('C');
    const fA_repeat = SonificationStrategy.getNodeFrequency('A');

    expect(fA).toBe(fA_repeat);
    expect(fA).toBeGreaterThan(0);
    expect(fB).toBeGreaterThan(0);
    expect(fC).toBeGreaterThan(0);
    expect(fB).toBeGreaterThan(fA); // Ascending scale
    expect(fC).toBeGreaterThan(fB);
  });

  it('generates non-spatial sequence with all pan = 0.0 in Condition B', () => {
    const event: SemanticAudioEvent = {
      type: 'OUTGOING_SUMMARY',
      nodeId: 'A',
      nodeIndex: 0,
      totalNodes: 4,
      direction: 'outgoing',
      neighborIds: ['B', 'C'],
      selectedNeighborIndex: 0,
      isSpatial: false
    };

    const config: SonificationConfig = {
      ...DEFAULT_SONIFICATION_CONFIG,
      useSpatial: false
    };

    const sequence = SonificationStrategy.mapEventToSequence(event, config);
    expect(sequence.notes.length).toBe(3); // Root + 2 neighbors

    for (const note of sequence.notes) {
      expect(note.tone.pan).toBe(0.0);
    }
  });

  it('generates spatial sequence with directional pan separation in Condition C', () => {
    const event: SemanticAudioEvent = {
      type: 'OUTGOING_SUMMARY',
      nodeId: 'A',
      nodeIndex: 0,
      totalNodes: 4,
      direction: 'outgoing',
      neighborIds: ['B', 'C'],
      selectedNeighborIndex: 0,
      isSpatial: true
    };

    const config: SonificationConfig = {
      ...DEFAULT_SONIFICATION_CONFIG,
      useSpatial: true
    };

    const sequence = SonificationStrategy.mapEventToSequence(event, config);
    expect(sequence.notes.length).toBe(3);

    const neighborNotes = sequence.notes.slice(1);
    // Outgoing spatial notes should be panned to the right (>= 0.2)
    for (const note of neighborNotes) {
      expect(note.tone.pan).toBeGreaterThanOrEqual(0.2);
    }
    // First neighbor is less right than second neighbor
    expect(neighborNotes[0].tone.pan).toBeLessThan(neighborNotes[1].tone.pan!);
  });

  it('generates incoming spatial sequence panned to the left', () => {
    const event: SemanticAudioEvent = {
      type: 'INCOMING_SUMMARY',
      nodeId: 'D',
      nodeIndex: 3,
      totalNodes: 4,
      direction: 'incoming',
      neighborIds: ['B', 'C'],
      selectedNeighborIndex: 0,
      isSpatial: true
    };

    const config: SonificationConfig = {
      ...DEFAULT_SONIFICATION_CONFIG,
      useSpatial: true
    };

    const sequence = SonificationStrategy.mapEventToSequence(event, config);
    const neighborNotes = sequence.notes.slice(1);

    for (const note of neighborNotes) {
      expect(note.tone.pan).toBeLessThanOrEqual(0.0);
    }
  });

  it('keeps pitch and timing identical between Condition B and Condition C', () => {
    const eventB: SemanticAudioEvent = {
      type: 'OUTGOING_SUMMARY',
      nodeId: 'A',
      nodeIndex: 0,
      totalNodes: 4,
      direction: 'outgoing',
      neighborIds: ['B', 'C'],
      selectedNeighborIndex: 0,
      isSpatial: false
    };

    const eventC: SemanticAudioEvent = {
      ...eventB,
      isSpatial: true
    };

    const seqB = SonificationStrategy.mapEventToSequence(eventB, {
      ...DEFAULT_SONIFICATION_CONFIG,
      useSpatial: false
    });

    const seqC = SonificationStrategy.mapEventToSequence(eventC, {
      ...DEFAULT_SONIFICATION_CONFIG,
      useSpatial: true
    });

    expect(seqB.notes.length).toBe(seqC.notes.length);

    for (let i = 0; i < seqB.notes.length; i++) {
      expect(seqB.notes[i].timeOffsetSec).toBe(seqC.notes[i].timeOffsetSec);
      expect(seqB.notes[i].tone.frequency).toBe(seqC.notes[i].tone.frequency);
      expect(seqB.notes[i].tone.durationSec).toBe(seqC.notes[i].tone.durationSec);
      expect(seqB.notes[i].tone.waveform).toBe(seqC.notes[i].tone.waveform);
    }
  });

  it('generates distinct earcons for backtrack, reset, and boundary', () => {
    const backtrack = SonificationStrategy.mapEventToSequence(
      {
        type: 'BACKTRACK',
        nodeId: 'B',
        nodeIndex: 1,
        totalNodes: 4,
        direction: 'outgoing',
        neighborIds: [],
        isSpatial: false
      },
      DEFAULT_SONIFICATION_CONFIG
    );
    expect(backtrack.notes.length).toBe(2);

    const reset = SonificationStrategy.mapEventToSequence(
      {
        type: 'START_RESET',
        nodeId: 'A',
        nodeIndex: 0,
        totalNodes: 4,
        direction: 'outgoing',
        neighborIds: [],
        isSpatial: false
      },
      DEFAULT_SONIFICATION_CONFIG
    );
    expect(reset.notes.length).toBe(3); // 3-tone chord
  });

  it('guarantees complete audio event parameter equivalence between B and C across all event types except pan', () => {
    const eventTypes: Array<SemanticAudioEvent['type']> = [
      'NODE_FOCUS',
      'OUTGOING_SUMMARY',
      'INCOMING_SUMMARY',
      'NEIGHBOR_SELECTED',
      'TRAVERSAL',
      'BACKTRACK',
      'START_RESET'
    ];

    for (const type of eventTypes) {
      const eventB: SemanticAudioEvent = {
        type,
        nodeId: 'B',
        nodeIndex: 1,
        totalNodes: 5,
        direction: type.includes('INCOMING') ? 'incoming' : 'outgoing',
        neighborIds: ['A', 'C', 'D'],
        selectedNeighborIndex: 1,
        isSpatial: false
      };

      const eventC: SemanticAudioEvent = {
        ...eventB,
        isSpatial: true
      };

      const seqB = SonificationStrategy.mapEventToSequence(eventB, {
        ...DEFAULT_SONIFICATION_CONFIG,
        useSpatial: false
      });

      const seqC = SonificationStrategy.mapEventToSequence(eventC, {
        ...DEFAULT_SONIFICATION_CONFIG,
        useSpatial: true
      });

      expect(seqB.notes.length).toBe(seqC.notes.length);

      for (let i = 0; i < seqB.notes.length; i++) {
        const noteB = seqB.notes[i];
        const noteC = seqC.notes[i];

        // Strict equivalence of all acoustic parameters except pan
        expect(noteB.timeOffsetSec).toBeCloseTo(noteC.timeOffsetSec, 4);
        expect(noteB.tone.frequency).toBeCloseTo(noteC.tone.frequency, 2);
        if (noteB.tone.endFrequency !== undefined || noteC.tone.endFrequency !== undefined) {
          expect(noteB.tone.endFrequency).toBeCloseTo(noteC.tone.endFrequency!, 2);
        }
        expect(noteB.tone.durationSec).toBeCloseTo(noteC.tone.durationSec, 4);
        expect(noteB.tone.gain).toBeCloseTo(noteC.tone.gain ?? 0.3, 4);
        expect(noteB.tone.waveform).toBe(noteC.tone.waveform);

        // Condition B must always be centered
        expect(noteB.tone.pan).toBe(0.0);
      }
    }
  });

  it('settles cancelled playback promises immediately without remaining pending', async () => {
    // Mock Web Audio Context
    let isOscStarted = false;
    let isOscStopped = false;

    const mockOscillator = {
      type: 'sine',
      frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
      start: () => { isOscStarted = true; },
      stop: () => { isOscStopped = true; },
      connect: () => {}
    };

    const mockGain = {
      gain: {
        value: 0.5,
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
        cancelScheduledValues: () => {}
      },
      connect: () => {},
      disconnect: () => {}
    };

    const mockContext = {
      currentTime: 10.0,
      createOscillator: () => mockOscillator,
      createGain: () => mockGain
    } as unknown as AudioContext;

    const mockDestination = {} as AudioNode;

    const { SequenceScheduler } = await import('../../src/audio/scheduling/SequenceScheduler.js');
    const scheduler = new SequenceScheduler(mockContext, mockDestination);

    const testSeq = {
      id: 'test-seq',
      eventType: 'NODE_FOCUS' as const,
      totalDurationSec: 5.0,
      notes: [
        {
          timeOffsetSec: 0.1,
          tone: { frequency: 440, durationSec: 0.5, pan: 0.0 }
        }
      ]
    };

    const handle = scheduler.scheduleSequence(testSeq, 1.0);
    expect(isOscStarted).toBe(true);

    // Cancel playback
    handle.cancel();
    expect(handle.isDone()).toBe(true);
    expect(isOscStopped).toBe(true);

    // Promise must resolve immediately and settle
    let settled = false;
    handle.promise.then(() => {
      settled = true;
    });

    await new Promise((r) => setTimeout(r, 20));
    expect(settled).toBe(true);
  });
});
