import type { NodeShape, EdgeGeometryVariation } from '../presentation/types.js';

export type LabTestCategory =
  | 'shape_discrimination'
  | 'shape_recognition'
  | 'identity_vs_category'
  | 'perceived_hierarchy'
  | 'relationship_direction'
  | 'shape_independence'
  | 'geometry_invariance'
  | 'destination_recognition'
  | 'perceived_meaning';

export type LabMode = 'training' | 'assessment';

export type LabStimulusType =
  | 'single_shape'
  | 'compare_shapes'
  | 'edge_journey'
  | 'compare_edge_journeys'
  | 'direction_only';

export interface LabSoundStimulus {
  readonly type: LabStimulusType;
  readonly shape1?: NodeShape;
  readonly shape2?: NodeShape;
  readonly direction?: 'outgoing' | 'incoming';
  readonly journey1?: {
    readonly shape1: NodeShape;
    readonly shape2: NodeShape;
    readonly direction: 'outgoing' | 'incoming';
    readonly lineStyle?: 'solid' | 'dashed' | 'dotted';
  };
  readonly journey2?: {
    readonly shape1: NodeShape;
    readonly shape2: NodeShape;
    readonly direction: 'outgoing' | 'incoming';
    readonly lineStyle?: 'solid' | 'dashed' | 'dotted';
  };
}

export interface LabAnswerOption {
  readonly id: string;
  readonly label: string;
  readonly explanation?: string;
}

export interface LabNodeStimulus {
  readonly id: string;
  readonly label: string;
  readonly shape: NodeShape;
  readonly x?: number;
  readonly y?: number;
}

export interface LabEdgeStimulus {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly direction: 'outgoing' | 'incoming';
  readonly geometryVariation?: EdgeGeometryVariation;
  readonly label?: string;
}

export interface LabTestCase {
  readonly id: string;
  readonly category: LabTestCategory;
  readonly title: string;
  readonly instructions: string;
  readonly prompt: string;
  readonly options: readonly LabAnswerOption[];
  readonly expectedAnswerId?: string; // Stable identifier, never a raw response string
  readonly soundStimulus: LabSoundStimulus;
  readonly visualStimulus?: {
    readonly nodes: readonly LabNodeStimulus[];
    readonly edges: readonly LabEdgeStimulus[];
    readonly decorativeNote?: string;
    readonly blindInAssessment?: boolean; // When true, visual shapes are hidden during sound-only assessment
  };
  readonly supportsPerceivedMeaning?: boolean;
}

export interface LabTestRecord {
  readonly mappingVersion: string;
  readonly testCaseId: string;
  readonly category: LabTestCategory;
  readonly mode: LabMode;
  readonly prompt: string;
  readonly expectedAnswerId?: string;
  readonly participantResponseId: string;
  readonly participantResponseLabel: string;
  readonly isCorrect: boolean | null; // null if subjective
  readonly replayCount: number;
  readonly responseDurationMs: number;
  readonly perceivedMeaning?: string;
  readonly qualitativeFeedback?: string;
  readonly timestamp: string;
}

export interface LabSessionSummary {
  readonly totalTrials: number;
  readonly scoredTrials: number;
  readonly correctTrials: number;
  readonly accuracyPercent: number;
  readonly avgReplayCount: number;
  readonly avgResponseDurationMs: number;
}
