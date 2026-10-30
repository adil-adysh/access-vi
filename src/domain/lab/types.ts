import type { NodeShape, EdgeGeometryVariation } from '../presentation/types.js';

export type LabTestCategory =
  | 'shape_discrimination'
  | 'identity_vs_category'
  | 'relationship_direction'
  | 'shape_independence'
  | 'geometry_invariance'
  | 'perceived_meaning';

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
}

export interface LabTestCase {
  readonly id: string;
  readonly category: LabTestCategory;
  readonly title: string;
  readonly instructions: string;
  readonly prompt: string;
  readonly options: readonly string[];
  readonly expectedAnswer?: string; // Optional if subjective/interpretive
  readonly soundStimulus: {
    readonly type: 'single_shape' | 'compare_shapes' | 'edge_journey' | 'direction_only';
    readonly shape1?: NodeShape;
    readonly shape2?: NodeShape;
    readonly direction?: 'outgoing' | 'incoming';
  };
  readonly visualStimulus?: {
    readonly nodes: readonly LabNodeStimulus[];
    readonly edges: readonly LabEdgeStimulus[];
    readonly decorativeNote?: string;
  };
  readonly supportsPerceivedMeaning?: boolean;
}

export interface LabTestRecord {
  readonly mappingVersion: string;
  readonly testCaseId: string;
  readonly category: LabTestCategory;
  readonly prompt: string;
  readonly expectedAnswer?: string;
  readonly participantResponse: string;
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
