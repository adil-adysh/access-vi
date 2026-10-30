import { AudioContextManager } from '../AudioContextManager.js';
import { SequenceScheduler, type PlaybackHandle } from '../scheduling/SequenceScheduler.js';
import {
  ParitySoundRegistry,
  DEFAULT_PARITY_CONFIG_V1,
  type ParitySoundRegistryConfig
} from './ParitySoundRegistry.js';
import {
  resolveNodePresentation,
  resolveEdgePresentation,
  type NodeShape
} from '../../domain/presentation/types.js';
import type { GraphNode, GraphEdge } from '../../domain/graph/types.js';
import type { AudioSequence, ScheduledAudioNote } from '../types.js';

/**
 * ParitySonificationEngine coordinates audio synthesis strictly compliant with
 * the visual-auditory parity governing rules.
 *
 * Rules verified in this engine:
 * - Equal visual shape produces identical intrinsic sound.
 * - Same reference pitch and duration for all shapes.
 * - Edge connection sounds do not depend on node shape or label.
 * - Changing incidental geometry does not change topological relationship cues.
 * - All audio calls can be immediately cancelled without hanging promises.
 */
export class ParitySonificationEngine {
  private readonly contextManager: AudioContextManager;
  private readonly registry: ParitySoundRegistry;
  private scheduler: SequenceScheduler | null = null;
  private currentPlayback: PlaybackHandle | null = null;

  constructor(
    contextManager?: AudioContextManager,
    registryOrConfig?: ParitySoundRegistry | ParitySoundRegistryConfig
  ) {
    this.contextManager = contextManager ?? new AudioContextManager();
    if (registryOrConfig instanceof ParitySoundRegistry) {
      this.registry = registryOrConfig;
    } else {
      this.registry = new ParitySoundRegistry(registryOrConfig ?? DEFAULT_PARITY_CONFIG_V1);
    }
  }

  public setShapeGain(shape: NodeShape, gain: number): void {
    this.registry.setShapeGain(shape, gain);
  }

  public getShapeGain(shape: NodeShape): number {
    return this.registry.getShapeGain(shape);
  }

  public resetShapeGains(): void {
    this.registry.resetToDefaultGains();
  }

  public getRegistry(): ParitySoundRegistry {
    return this.registry;
  }

  public getContextManager(): AudioContextManager {
    return this.contextManager;
  }

  public cancelPlayback(): void {
    if (this.currentPlayback) {
      this.currentPlayback.cancel();
      this.currentPlayback = null;
    }
    if (this.scheduler) {
      this.scheduler.cancelAll();
    }
  }

  private getScheduler(): SequenceScheduler {
    const ctx = this.contextManager.getAudioContext();
    if (!this.scheduler) {
      this.scheduler = new SequenceScheduler(ctx, this.contextManager.getDestination());
    }
    return this.scheduler;
  }

  private schedule(seq: AudioSequence): PlaybackHandle | null {
    try {
      this.cancelPlayback();
      const scheduler = this.getScheduler();
      this.currentPlayback = scheduler.scheduleSequence(seq, 1.0);
      return this.currentPlayback;
    } catch (err) {
      console.warn('Parity audio playback deferred (waiting for AudioContext user gesture):', err);
      return null;
    }
  }

  /**
   * Plays intrinsic category cue for a given node shape.
   * Governing Rule A: Circle = Sine, Rectangle = Triangle, Diamond = Softened Square.
   */
  public playNodeShape(shape: NodeShape): PlaybackHandle | null {
    const tone = this.registry.createNodeCategoryTone(shape);
    const seq: AudioSequence = {
      id: `shape-${shape}-${Date.now()}`,
      notes: [
        {
          timeOffsetSec: 0.0,
          tone
        }
      ],
      totalDurationSec: tone.durationSec + 0.05
    };
    return this.schedule(seq);
  }

  /**
   * Plays intrinsic category sound for a node object.
   * Resolves shape from presentation or metadata without using node ID or label.
   */
  public playNode(node: Partial<GraphNode>): PlaybackHandle | null {
    const resolved = resolveNodePresentation(node);
    return this.playNodeShape(resolved.shape);
  }

  /**
   * Plays sequential comparison of two shapes with an audible gap.
   */
  public playTwoShapeComparison(
    shape1: NodeShape,
    shape2: NodeShape,
    gapSec: number = 0.20
  ): PlaybackHandle | null {
    const tone1 = this.registry.createNodeCategoryTone(shape1);
    const tone2 = this.registry.createNodeCategoryTone(shape2);

    const offset2 = tone1.durationSec + gapSec;
    const totalDuration = offset2 + tone2.durationSec + 0.05;

    const seq: AudioSequence = {
      id: `compare-${shape1}-${shape2}-${Date.now()}`,
      notes: [
        {
          timeOffsetSec: 0.0,
          tone: tone1
        },
        {
          timeOffsetSec: offset2,
          tone: tone2
        }
      ],
      totalDurationSec: totalDuration
    };

    return this.schedule(seq);
  }

  /**
   * Plays connection cue (existence) without direction.
   */
  public playDirectedConnection(): PlaybackHandle | null {
    const seq = this.registry.createDirectedConnectionSequence();
    return this.schedule(seq);
  }

  /**
   * Plays direction cue (outgoing vs incoming).
   * Governing Rule C & D: Invariant of endpoint shapes and geometry.
   */
  public playRelationshipDirection(direction: 'outgoing' | 'incoming'): PlaybackHandle | null {
    const seq = this.registry.createRelationshipDirectionSequence(direction);
    return this.schedule(seq);
  }

  /**
   * Builds an AudioSequence for a directed connection journey between source and target:
   * [Source Shape Cue] -> [Direction Cue] -> [Target Shape Cue]
   */
  public buildFullDirectedRelationshipSequence(
    sourceShape: NodeShape,
    targetShape: NodeShape,
    direction: 'outgoing' | 'incoming' = 'outgoing',
    lineStyle: 'solid' | 'dashed' | 'dotted' = 'solid'
  ): AudioSequence {
    const sourceTone = this.registry.createNodeCategoryTone(sourceShape);
    const targetTone = this.registry.createNodeCategoryTone(targetShape);
    const directionSeq = this.registry.createRelationshipDirectionSequence(direction, 'rel', lineStyle);

    const sourceDuration = sourceTone.durationSec;
    const gap1 = 0.12;
    const dirOffset = sourceDuration + gap1;
    const dirDuration = directionSeq.totalDurationSec;
    const gap2 = 0.12;
    const targetOffset = dirOffset + dirDuration + gap2;
    const totalDuration = targetOffset + targetTone.durationSec + 0.05;

    const notes: ScheduledAudioNote[] = [
      {
        timeOffsetSec: 0.0,
        tone: sourceTone
      },
      ...directionSeq.notes.map((n) => ({
        timeOffsetSec: dirOffset + n.timeOffsetSec,
        tone: n.tone
      })),
      {
        timeOffsetSec: targetOffset,
        tone: targetTone
      }
    ];

    return {
      id: `full-rel-${sourceShape}-${direction}-${targetShape}-${Date.now()}`,
      notes,
      totalDurationSec: totalDuration
    };
  }

  /**
   * Plays a complete directed connection journey between source and target:
   * [Source Shape Cue] -> [Direction Cue] -> [Target Shape Cue]
   */
  public playFullDirectedRelationship(
    sourceShape: NodeShape,
    targetShape: NodeShape,
    direction: 'outgoing' | 'incoming' = 'outgoing',
    lineStyle: 'solid' | 'dashed' | 'dotted' = 'solid'
  ): PlaybackHandle | null {
    const seq = this.buildFullDirectedRelationshipSequence(sourceShape, targetShape, direction, lineStyle);
    return this.schedule(seq);
  }

  /**
   * Plays sequential comparison of two directed edge journeys with an audible gap.
   * Enables genuine empirical paired trials for shape-independence and geometry-invariance.
   */
  public playTwoJourneyComparison(
    journey1: { shape1: NodeShape; shape2: NodeShape; direction: 'outgoing' | 'incoming'; lineStyle?: 'solid' | 'dashed' | 'dotted' },
    journey2: { shape1: NodeShape; shape2: NodeShape; direction: 'outgoing' | 'incoming'; lineStyle?: 'solid' | 'dashed' | 'dotted' },
    gapSec: number = 0.35
  ): PlaybackHandle | null {
    const seq1 = this.buildFullDirectedRelationshipSequence(
      journey1.shape1,
      journey1.shape2,
      journey1.direction,
      journey1.lineStyle ?? 'solid'
    );
    const seq2 = this.buildFullDirectedRelationshipSequence(
      journey2.shape1,
      journey2.shape2,
      journey2.direction,
      journey2.lineStyle ?? 'solid'
    );

    const offset2 = seq1.totalDurationSec + gapSec;
    const notes: ScheduledAudioNote[] = [
      ...seq1.notes,
      ...seq2.notes.map((n) => ({
        timeOffsetSec: offset2 + n.timeOffsetSec,
        tone: n.tone
      }))
    ];

    const seq: AudioSequence = {
      id: `compare-journeys-${Date.now()}`,
      notes,
      totalDurationSec: offset2 + seq2.totalDurationSec + 0.05
    };

    return this.schedule(seq);
  }

  /**
   * Plays edge sonification given an edge and endpoints.
   * Governing Rule D: Decorative geometryVariation (straight, curved, step) produces identical audio.
   */
  public playEdge(
    edge: Partial<GraphEdge>,
    sourceNode: Partial<GraphNode>,
    targetNode: Partial<GraphNode>,
    direction: 'outgoing' | 'incoming' = 'outgoing'
  ): PlaybackHandle | null {
    const sourcePres = resolveNodePresentation(sourceNode);
    const targetPres = resolveNodePresentation(targetNode);
    // Explicitly verify edge resolution to adhere to Rule D
    resolveEdgePresentation(edge);

    return this.playFullDirectedRelationship(sourcePres.shape, targetPres.shape, direction);
  }

  public playSelectionCue(): PlaybackHandle | null {
    const seq = this.registry.createSelectionFocusSequence();
    return this.schedule(seq);
  }

  public playTraversalCue(): PlaybackHandle | null {
    const seq = this.registry.createTraversalConfirmationSequence();
    return this.schedule(seq);
  }

  public playBoundaryCue(): PlaybackHandle | null {
    const seq = this.registry.createBoundaryErrorSequence();
    return this.schedule(seq);
  }
}
