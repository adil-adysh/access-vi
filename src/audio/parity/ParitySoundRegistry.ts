import type { NodeShape } from '../../domain/presentation/types.js';
import type { OscillatorWaveform, ToneOptions, EnvelopeOptions, AudioSequence } from '../types.js';

export interface ShapeSoundDefinition {
  readonly waveform: OscillatorWaveform;
  readonly gain: number;
  readonly durationSec: number;
  readonly envelope: EnvelopeOptions;
  readonly description: string;
}

export interface ParitySoundRegistryConfig {
  readonly version: string;
  readonly referenceFrequencyHz: number;
  readonly referenceDurationSec: number;
  readonly shapes: Record<NodeShape, ShapeSoundDefinition>;
  readonly connectionPulseFrequencyHz: number;
  readonly outgoingFrequenciesHz: readonly [number, number];
  readonly incomingFrequenciesHz: readonly [number, number];
}

/**
 * Standard visual-auditory parity v1 sound mapping.
 *
 * Governing Rules A & D:
 * - Equal visual shape produces identical intrinsic sound.
 * - Same reference pitch and duration for all shapes (300 Hz, 0.20s).
 * - Calibrated gains account for psychoacoustic harmonic energy differences:
 *   sine (0.28) > triangle (0.22) > square (0.14).
 * - Higher pitch is NEVER used to imply greater node importance or sequence.
 */
export const DEFAULT_PARITY_CONFIG_V1: ParitySoundRegistryConfig = {
  version: 'visual-auditory-parity-v1',
  referenceFrequencyHz: 300,
  referenceDurationSec: 0.20,
  shapes: {
    circle: {
      waveform: 'sine',
      gain: 0.28,
      durationSec: 0.20,
      envelope: {
        attackSec: 0.02,
        decaySec: 0.04,
        sustainLevel: 0.8,
        releaseSec: 0.04
      },
      description: 'Sine tone at 300 Hz (smooth, pure tone for Circle)'
    },
    rectangle: {
      waveform: 'triangle',
      gain: 0.22,
      durationSec: 0.20,
      envelope: {
        attackSec: 0.02,
        decaySec: 0.04,
        sustainLevel: 0.8,
        releaseSec: 0.04
      },
      description: 'Triangle tone at 300 Hz (mellow harmonic timbre for Rectangle)'
    },
    diamond: {
      waveform: 'square',
      gain: 0.14, // Initial candidate gain to mitigate perceived loudness of odd harmonics
      durationSec: 0.20,
      envelope: {
        attackSec: 0.03, // Softened attack to prevent harsh click
        decaySec: 0.05,
        sustainLevel: 0.75,
        releaseSec: 0.05
      },
      description: 'Softened square tone at 300 Hz (rich, buzzy timbre for Diamond)'
    }
  },
  connectionPulseFrequencyHz: 400,
  outgoingFrequenciesHz: [360, 440],
  incomingFrequenciesHz: [440, 360]
};

export class ParitySoundRegistry {
  private config: ParitySoundRegistryConfig;

  constructor(initialConfig: ParitySoundRegistryConfig = DEFAULT_PARITY_CONFIG_V1) {
    this.config = JSON.parse(JSON.stringify(initialConfig));
  }

  public getVersion(): string {
    return this.config.version;
  }

  public getConfig(): ParitySoundRegistryConfig {
    return JSON.parse(JSON.stringify(this.config));
  }

  public getShapeDefinition(shape: NodeShape): ShapeSoundDefinition {
    const def = this.config.shapes[shape];
    if (!def) {
      // Documented fallback for unknown shape to circle
      return this.config.shapes.circle;
    }
    return def;
  }

  public updateShapeDefinition(shape: NodeShape, partial: Partial<ShapeSoundDefinition>): void {
    if (this.config.shapes[shape]) {
      this.config = {
        ...this.config,
        shapes: {
          ...this.config.shapes,
          [shape]: {
            ...this.config.shapes[shape],
            ...partial
          }
        }
      };
    }
  }

  public getShapeGain(shape: NodeShape): number {
    return this.getShapeDefinition(shape).gain;
  }

  public setShapeGain(shape: NodeShape, gain: number): void {
    const clamped = Math.max(0, Math.min(1.0, gain));
    this.updateShapeDefinition(shape, { gain: clamped });
  }

  public resetToDefaultGains(): void {
    for (const shape of ['circle', 'rectangle', 'diamond'] as const) {
      this.updateShapeDefinition(shape, { gain: DEFAULT_PARITY_CONFIG_V1.shapes[shape].gain });
    }
  }

  public createNodeCategoryTone(shape: NodeShape): ToneOptions {
    const def = this.getShapeDefinition(shape);
    return {
      frequency: this.config.referenceFrequencyHz,
      durationSec: def.durationSec,
      waveform: def.waveform,
      gain: def.gain,
      envelope: def.envelope,
      pan: 0.0 // Mono-compatible diotic delivery
    };
  }

  /**
   * Generates a neutral directed-connection cue.
   * Invariant of endpoint shapes and labels.
   */
  public createDirectedConnectionSequence(idPrefix: string = 'conn'): AudioSequence {
    const freq = this.config.connectionPulseFrequencyHz;
    return {
      id: `${idPrefix}-${Date.now()}`,
      notes: [
        {
          timeOffsetSec: 0.0,
          tone: {
            frequency: freq,
            durationSec: 0.05,
            waveform: 'sine',
            gain: 0.22,
            pan: 0.0
          }
        },
        {
          timeOffsetSec: 0.08,
          tone: {
            frequency: freq,
            durationSec: 0.05,
            waveform: 'sine',
            gain: 0.22,
            pan: 0.0
          }
        }
      ],
      totalDurationSec: 0.18
    };
  }

  /**
   * Generates relationship direction cue.
   * Outgoing = forward interval (360 -> 440 Hz)
   * Incoming = reverse interval (440 -> 360 Hz)
   * Invariant of endpoint shapes, labels, and geometry.
   */
  public createRelationshipDirectionSequence(
    direction: 'outgoing' | 'incoming',
    idPrefix: string = 'rel'
  ): AudioSequence {
    const [f1, f2] =
      direction === 'outgoing'
        ? this.config.outgoingFrequenciesHz
        : this.config.incomingFrequenciesHz;

    return {
      id: `${idPrefix}-${direction}-${Date.now()}`,
      notes: [
        {
          timeOffsetSec: 0.0,
          tone: {
            frequency: f1,
            durationSec: 0.06,
            waveform: 'sine',
            gain: 0.22,
            pan: 0.0
          }
        },
        {
          timeOffsetSec: 0.08,
          tone: {
            frequency: f2,
            durationSec: 0.09,
            waveform: 'sine',
            gain: 0.24,
            pan: 0.0
          }
        }
      ],
      totalDurationSec: 0.22
    };
  }

  /**
   * Generates node selection/focus cue.
   */
  public createSelectionFocusSequence(idPrefix: string = 'focus'): AudioSequence {
    return {
      id: `${idPrefix}-${Date.now()}`,
      notes: [
        {
          timeOffsetSec: 0.0,
          tone: {
            frequency: 500,
            durationSec: 0.05,
            waveform: 'sine',
            gain: 0.20,
            pan: 0.0
          }
        }
      ],
      totalDurationSec: 0.08
    };
  }

  /**
   * Generates traversal confirmation chime.
   */
  public createTraversalConfirmationSequence(idPrefix: string = 'traverse'): AudioSequence {
    return {
      id: `${idPrefix}-${Date.now()}`,
      notes: [
        {
          timeOffsetSec: 0.0,
          tone: {
            frequency: 400,
            durationSec: 0.06,
            waveform: 'sine',
            gain: 0.22,
            pan: 0.0
          }
        },
        {
          timeOffsetSec: 0.08,
          tone: {
            frequency: 500,
            durationSec: 0.09,
            waveform: 'sine',
            gain: 0.25,
            pan: 0.0
          }
        }
      ],
      totalDurationSec: 0.22
    };
  }

  /**
   * Generates navigation boundary or error cue.
   */
  public createBoundaryErrorSequence(idPrefix: string = 'boundary'): AudioSequence {
    return {
      id: `${idPrefix}-${Date.now()}`,
      notes: [
        {
          timeOffsetSec: 0.0,
          tone: {
            frequency: 150,
            durationSec: 0.08,
            waveform: 'triangle',
            gain: 0.20,
            pan: 0.0
          }
        },
        {
          timeOffsetSec: 0.10,
          tone: {
            frequency: 120,
            durationSec: 0.10,
            waveform: 'triangle',
            gain: 0.20,
            pan: 0.0
          }
        }
      ],
      totalDurationSec: 0.25
    };
  }
}
