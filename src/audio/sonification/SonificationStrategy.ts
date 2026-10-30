import type {
  SemanticAudioEvent,
  AudioSequence,
  ScheduledAudioNote,
  SonificationConfig,
  OscillatorWaveform
} from '../types.js';

export class SonificationStrategy {
  // Pentatonic scale semitone offsets spanning 2+ octaves
  private static readonly PENTATONIC_SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];

  /**
   * Deterministically maps a node identifier to a musical frequency in Hz.
   */
  public static getNodeFrequency(nodeId: string, baseFreqHz: number = 261.63): number {
    let index = 0;
    if (nodeId.length === 1 && nodeId >= 'A' && nodeId <= 'Z') {
      index = nodeId.charCodeAt(0) - 65; // A=0, B=1, ...
    } else {
      // Hash string to non-negative integer
      let hash = 0;
      for (let i = 0; i < nodeId.length; i++) {
        hash = (hash << 5) - hash + nodeId.charCodeAt(i);
        hash |= 0;
      }
      index = Math.abs(hash) % 20;
    }

    const scaleLen = SonificationStrategy.PENTATONIC_SCALE.length;
    const octave = Math.floor(index / scaleLen);
    const scaleIndex = index % scaleLen;
    const semitones = SonificationStrategy.PENTATONIC_SCALE[scaleIndex] + octave * 12;

    return baseFreqHz * Math.pow(2, semitones / 12);
  }

  /**
   * Transforms a high-level SemanticAudioEvent into an executable Web Audio Sequence.
   */
  public static mapEventToSequence(
    event: SemanticAudioEvent,
    config: SonificationConfig
  ): AudioSequence {
    const isSpatial = config.useSpatial && event.isSpatial;
    const baseFreq = config.baseFrequencyHz;
    const waveform: OscillatorWaveform = config.waveform;
    const notes: ScheduledAudioNote[] = [];

    const rootFreq = SonificationStrategy.getNodeFrequency(event.nodeId, baseFreq);

    switch (event.type) {
      case 'NODE_FOCUS':
      case 'OUTGOING_SUMMARY':
      case 'INCOMING_SUMMARY': {
        // Step 1: Focused node reference tone
        notes.push({
          timeOffsetSec: 0.0,
          tone: {
            frequency: rootFreq,
            durationSec: 0.16,
            waveform,
            gain: 0.28,
            pan: 0.0
          }
        });

        // If no neighbors in this direction, add boundary earcon
        if (event.neighborIds.length === 0) {
          notes.push({
            timeOffsetSec: 0.22,
            tone: {
              frequency: baseFreq * 0.5, // 1 octave below base
              durationSec: 0.12,
              waveform: 'triangle',
              gain: 0.18,
              pan: 0.0
            }
          });
          break;
        }

        // Step 2: Sequence of connected neighbors
        let offset = 0.24;
        const noteDuration = 0.14;
        const gap = 0.08;
        const total = event.neighborIds.length;

        for (let i = 0; i < total; i++) {
          const neighborId = event.neighborIds[i];
          const neighborFreq = SonificationStrategy.getNodeFrequency(neighborId, baseFreq);

          let pan = 0.0;
          let endPan: number | undefined;

          if (isSpatial) {
            if (event.direction === 'outgoing') {
              // Outgoing: positioned center to right
              pan = total === 1 ? 0.4 : 0.2 + (i / (total - 1)) * 0.6;
            } else {
              // Incoming: positioned left to center
              pan = total === 1 ? -0.4 : -0.8 + (i / (total - 1)) * 0.6;
            }
          }

          // Distinguish direction: outgoing sweeps upward slightly, incoming sweeps downward
          const pitchSweepEnd =
            event.direction === 'outgoing' ? neighborFreq * 1.05 : neighborFreq * 0.95;

          notes.push({
            timeOffsetSec: offset,
            tone: {
              frequency: neighborFreq,
              endFrequency: pitchSweepEnd,
              durationSec: noteDuration,
              waveform,
              gain: i === event.selectedNeighborIndex ? 0.35 : 0.22,
              pan,
              endPan
            }
          });

          offset += noteDuration + gap;
        }
        break;
      }

      case 'NEIGHBOR_SELECTED': {
        const selectedId =
          event.selectedNeighborIndex !== undefined &&
          event.neighborIds[event.selectedNeighborIndex]
            ? event.neighborIds[event.selectedNeighborIndex]
            : event.nodeId;

        const targetFreq = SonificationStrategy.getNodeFrequency(selectedId, baseFreq);
        const total = event.neighborIds.length;
        const idx = event.selectedNeighborIndex ?? 0;

        let pan = 0.0;
        if (isSpatial && total > 0) {
          if (event.direction === 'outgoing') {
            pan = total === 1 ? 0.4 : 0.2 + (idx / Math.max(1, total - 1)) * 0.6;
          } else {
            pan = total === 1 ? -0.4 : -0.8 + (idx / Math.max(1, total - 1)) * 0.6;
          }
        }

        notes.push({
          timeOffsetSec: 0.0,
          tone: {
            frequency: targetFreq,
            durationSec: 0.12,
            waveform,
            gain: 0.3,
            pan
          }
        });
        break;
      }

      case 'TRAVERSAL': {
        // Traversal chime: two connected notes (start -> target)
        notes.push({
          timeOffsetSec: 0.0,
          tone: {
            frequency: rootFreq,
            durationSec: 0.1,
            waveform,
            gain: 0.25,
            pan: isSpatial ? (event.direction === 'outgoing' ? -0.2 : 0.2) : 0.0
          }
        });
        notes.push({
          timeOffsetSec: 0.12,
          tone: {
            frequency: rootFreq * 1.25, // major 3rd interval leap
            durationSec: 0.18,
            waveform,
            gain: 0.32,
            pan: isSpatial ? (event.direction === 'outgoing' ? 0.4 : -0.4) : 0.0
          }
        });
        break;
      }

      case 'BACKTRACK': {
        // Backtrack cue: falling minor third
        notes.push({
          timeOffsetSec: 0.0,
          tone: {
            frequency: rootFreq * 1.2,
            durationSec: 0.1,
            waveform: 'triangle',
            gain: 0.22,
            pan: isSpatial ? 0.2 : 0.0
          }
        });
        notes.push({
          timeOffsetSec: 0.11,
          tone: {
            frequency: rootFreq,
            durationSec: 0.16,
            waveform: 'triangle',
            gain: 0.25,
            pan: isSpatial ? -0.2 : 0.0
          }
        });
        break;
      }

      case 'START_RESET': {
        // Start reset earcon: 3-tone chord (root, 3rd, 5th)
        notes.push({
          timeOffsetSec: 0.0,
          tone: {
            frequency: baseFreq,
            durationSec: 0.22,
            waveform: 'sine',
            gain: 0.2,
            pan: isSpatial ? -0.3 : 0.0
          }
        });
        notes.push({
          timeOffsetSec: 0.06,
          tone: {
            frequency: baseFreq * 1.2599, // Major 3rd
            durationSec: 0.22,
            waveform: 'sine',
            gain: 0.2,
            pan: 0.0
          }
        });
        notes.push({
          timeOffsetSec: 0.12,
          tone: {
            frequency: baseFreq * 1.4983, // Perfect 5th
            durationSec: 0.26,
            waveform: 'sine',
            gain: 0.22,
            pan: isSpatial ? 0.3 : 0.0
          }
        });
        break;
      }

      case 'DIRECTION_TOGGLE': {
        // Direction toggle cue
        const f1 = event.direction === 'outgoing' ? baseFreq : baseFreq * 1.5;
        const f2 = event.direction === 'outgoing' ? baseFreq * 1.5 : baseFreq;
        notes.push({
          timeOffsetSec: 0.0,
          tone: {
            frequency: f1,
            durationSec: 0.08,
            waveform: 'sine',
            gain: 0.2,
            pan: 0.0
          }
        });
        notes.push({
          timeOffsetSec: 0.09,
          tone: {
            frequency: f2,
            durationSec: 0.12,
            waveform: 'sine',
            gain: 0.24,
            pan: isSpatial ? (event.direction === 'outgoing' ? 0.3 : -0.3) : 0.0
          }
        });
        break;
      }

      case 'BOUNDARY_EMPTY': {
        notes.push({
          timeOffsetSec: 0.0,
          tone: {
            frequency: baseFreq * 0.5,
            durationSec: 0.12,
            waveform: 'triangle',
            gain: 0.18,
            pan: 0.0
          }
        });
        break;
      }
    }

    const totalDuration = notes.reduce(
      (max, n) => Math.max(max, n.timeOffsetSec + n.tone.durationSec + 0.05),
      0.1
    );

    return {
      id: `seq-${event.type}-${event.nodeId}-${Date.now()}`,
      notes,
      totalDurationSec: totalDuration
    };
  }
}
