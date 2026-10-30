import type { ExperimentalConditionId } from '../../domain/navigation/types.js';

export interface ConditionDefinition {
  readonly id: ExperimentalConditionId;
  readonly name: string;
  readonly shortLabel: string;
  readonly description: string;
  readonly hasSonification: boolean;
  readonly isSpatial: boolean;
  readonly hasSpeech: boolean;
}

export const EXPERIMENTAL_CONDITIONS: Record<ExperimentalConditionId, ConditionDefinition> = {
  condition_parity: {
    id: 'condition_parity',
    name: 'Visual-Auditory Parity (Default Reference)',
    shortLabel: 'Parity Audio',
    description: 'Governing visual-auditory parity representation: waveform timbre denotes shape at 300 Hz carrier, connection cues denote direction, screen reader vocalizes text.',
    hasSonification: true,
    isSpatial: false,
    hasSpeech: true
  },
  condition_a_speech: {
    id: 'condition_a_speech',
    name: 'Condition A: Speech-Only',
    shortLabel: 'Speech Only',
    description: 'Baseline condition using keyboard navigation and structured spoken announcements only.',
    hasSonification: false,
    isSpatial: false,
    hasSpeech: true
  },
  condition_b_non_spatial: {
    id: 'condition_b_non_spatial',
    name: 'Condition B: Non-Spatial Sonification',
    shortLabel: 'Non-Spatial Audio',
    description: 'Sonification with centered node pitches and transition cues, plus spoken descriptions.',
    hasSonification: true,
    isSpatial: false,
    hasSpeech: true
  },
  condition_c_spatial: {
    id: 'condition_c_spatial',
    name: 'Condition C: Spatial Sonification',
    shortLabel: 'Spatial Audio',
    description: 'Sonification with stereo-positioned cues (left for incoming, right for outgoing), plus spoken descriptions.',
    hasSonification: true,
    isSpatial: true,
    hasSpeech: true
  }
};
