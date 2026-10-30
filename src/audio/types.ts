export type OscillatorWaveform = 'sine' | 'triangle' | 'sawtooth' | 'square';

export interface EnvelopeOptions {
  readonly attackSec: number;
  readonly decaySec: number;
  readonly sustainLevel: number; // 0.0 to 1.0
  readonly releaseSec: number;
}

export interface ToneOptions {
  readonly frequency: number;          // Hz
  readonly endFrequency?: number;      // Optional frequency for pitch sweeps
  readonly durationSec: number;        // Total duration
  readonly waveform?: OscillatorWaveform;
  readonly gain?: number;              // 0.0 to 1.0
  readonly envelope?: EnvelopeOptions;
  readonly pan?: number;               // -1.0 (left) to +1.0 (right)
  readonly endPan?: number;            // Optional pan sweep
}

export interface ScheduledAudioNote {
  readonly timeOffsetSec: number;
  readonly tone: ToneOptions;
}

export interface AudioSequence {
  readonly id: string;
  readonly notes: ScheduledAudioNote[];
  readonly totalDurationSec: number;
}

export type SemanticEventType =
  | 'NODE_FOCUS'
  | 'OUTGOING_SUMMARY'
  | 'INCOMING_SUMMARY'
  | 'NEIGHBOR_SELECTED'
  | 'TRAVERSAL'
  | 'BACKTRACK'
  | 'START_RESET'
  | 'BOUNDARY_EMPTY'
  | 'DIRECTION_TOGGLE';

export interface SemanticAudioEvent {
  readonly type: SemanticEventType;
  readonly nodeId: string;
  readonly nodeIndex: number;
  readonly totalNodes: number;
  readonly direction: 'outgoing' | 'incoming';
  readonly neighborIds: string[];
  readonly selectedNeighborIndex?: number;
  readonly isSpatial: boolean;
  readonly metadata?: Record<string, unknown>;
}

export interface SonificationConfig {
  readonly version: string;
  readonly baseFrequencyHz: number;
  readonly masterVolume: number;
  readonly playbackSpeed: number; // 1.0 = normal
  readonly useSpatial: boolean;
  readonly waveform: OscillatorWaveform;
  readonly enableRedundantSpeech: boolean;
}

export const DEFAULT_SONIFICATION_CONFIG: SonificationConfig = {
  version: '1.0.0',
  baseFrequencyHz: 261.63, // Middle C (C4)
  masterVolume: 0.7,
  playbackSpeed: 1.0,
  useSpatial: false,
  waveform: 'sine',
  enableRedundantSpeech: true
};
