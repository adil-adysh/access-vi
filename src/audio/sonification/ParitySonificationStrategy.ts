import type { ISonificationStrategy } from './types.js';
import type { AudioSequence, SemanticAudioEvent, SonificationConfig, ScheduledAudioNote } from '../types.js';
import type { DirectedGraph } from '../../domain/graph/Graph.js';
import { ParitySoundRegistry } from '../parity/ParitySoundRegistry.js';
import { resolveNodePresentation, type NodeShape } from '../../domain/presentation/types.js';

/**
 * ParitySonificationStrategy implements the faithful visual-auditory parity mapping (v1).
 *
 * Governing Rules:
 * - Rule A: Equal visual shape produces identical intrinsic sound.
 * - Rule B: All graph text belongs to the screen reader; audio never encodes characters or IDs as pitches.
 * - Rule C: Node shape and connection cues are orthogonal and independent.
 * - Rule D: Audio does not invent visual hierarchy or arbitrary pitch sequences.
 * - Rule E: Historical research conditions are preserved under legacy configurations.
 */
export class ParitySonificationStrategy implements ISonificationStrategy {
  public readonly version = 'visual-auditory-parity-v1';
  public readonly name = 'Visual-Auditory Parity (v1)';
  public readonly description =
    'Faithful semantic representation where node shape dictates waveform timbre at 300 Hz carrier, connection cues convey direction, and text belongs to the screen reader.';

  private readonly registry: ParitySoundRegistry;

  constructor(registry?: ParitySoundRegistry) {
    this.registry = registry ?? new ParitySoundRegistry();
  }

  public getRegistry(): ParitySoundRegistry {
    return this.registry;
  }

  public mapEventToSequence(
    event: SemanticAudioEvent,
    config: SonificationConfig,
    graph?: DirectedGraph
  ): AudioSequence | null {
    const isSpatial = config.useSpatial && event.isSpatial;

    switch (event.type) {
      case 'DIRECTION_TOGGLE': {
        return this.registry.createRelationshipDirectionSequence(event.direction, 'toggle');
      }

      case 'NODE_FOCUS':
      case 'OUTGOING_SUMMARY':
      case 'INCOMING_SUMMARY':
      case 'TRAVERSAL': {
        const shape = this.resolveShapeForNode(event.nodeId, graph);
        const rootTone = this.registry.createNodeCategoryTone(shape);
        const notes: ScheduledAudioNote[] = [];

        // 1. Current node intrinsic category tone (always 300 Hz carrier)
        notes.push({
          timeOffsetSec: 0.0,
          tone: rootTone
        });

        // If no neighbors in this direction, boundary tone
        if (event.neighborIds.length === 0) {
          notes.push({
            timeOffsetSec: rootTone.durationSec + 0.04,
            tone: {
              frequency: 160,
              durationSec: 0.12,
              waveform: 'sine',
              gain: 0.18,
              pan: 0.0
            }
          });

          return {
            id: `focus-boundary-${event.nodeId}-${Date.now()}`,
            notes,
            totalDurationSec: rootTone.durationSec + 0.20
          };
        }

        // 2. Directional connection cue (reflects lineStyle if edge is dashed)
        const selectedNeighborId =
          event.selectedNeighborIndex !== undefined ? event.neighborIds[event.selectedNeighborIndex] : undefined;
        let lineStyle: 'solid' | 'dashed' | 'dotted' = 'solid';
        if (graph && selectedNeighborId) {
          const edge =
            event.direction === 'outgoing'
              ? graph.getEdges().find((e) => e.source === event.nodeId && e.target === selectedNeighborId)
              : graph.getEdges().find((e) => e.source === selectedNeighborId && e.target === event.nodeId);
          if (edge?.presentation?.lineStyle === 'dashed' || edge?.presentation?.lineStyle === 'dotted') {
            lineStyle = edge.presentation.lineStyle;
          }
        }

        const [f1, f2] =
          event.direction === 'outgoing'
            ? [360, 440]
            : [440, 360];

        let offset = rootTone.durationSec + 0.06;

        if (lineStyle === 'dashed' || lineStyle === 'dotted') {
          notes.push(
            {
              timeOffsetSec: offset,
              tone: {
                frequency: f1,
                durationSec: 0.025,
                waveform: 'sine',
                gain: 0.20,
                pan: isSpatial ? (event.direction === 'outgoing' ? 0.3 : -0.3) : 0.0
              }
            },
            {
              timeOffsetSec: offset + 0.035,
              tone: {
                frequency: f1,
                durationSec: 0.025,
                waveform: 'sine',
                gain: 0.20,
                pan: isSpatial ? (event.direction === 'outgoing' ? 0.3 : -0.3) : 0.0
              }
            },
            {
              timeOffsetSec: offset + 0.08,
              tone: {
                frequency: f2,
                durationSec: 0.035,
                waveform: 'sine',
                gain: 0.22,
                pan: isSpatial ? (event.direction === 'outgoing' ? 0.4 : -0.4) : 0.0
              }
            },
            {
              timeOffsetSec: offset + 0.125,
              tone: {
                frequency: f2,
                durationSec: 0.035,
                waveform: 'sine',
                gain: 0.22,
                pan: isSpatial ? (event.direction === 'outgoing' ? 0.4 : -0.4) : 0.0
              }
            }
          );
        } else {
          notes.push(
            {
              timeOffsetSec: offset,
              tone: {
                frequency: f1,
                durationSec: 0.05,
                waveform: 'sine',
                gain: 0.20,
                pan: isSpatial ? (event.direction === 'outgoing' ? 0.3 : -0.3) : 0.0
              }
            },
            {
              timeOffsetSec: offset + 0.07,
              tone: {
                frequency: f2,
                durationSec: 0.07,
                waveform: 'sine',
                gain: 0.22,
                pan: isSpatial ? (event.direction === 'outgoing' ? 0.4 : -0.4) : 0.0
              }
            }
          );
        }

        offset += 0.16;

        // 3. Connected neighbor shape cues (one short pulse per neighbor shape at 300 Hz)
        const totalNeighbors = event.neighborIds.length;
        for (let i = 0; i < totalNeighbors; i++) {
          const neighborId = event.neighborIds[i];
          const neighborShape = this.resolveShapeForNode(neighborId, graph);
          const neighborTone = this.registry.createNodeCategoryTone(neighborShape);

          const isSelected = i === event.selectedNeighborIndex;
          let pan = 0.0;
          if (isSpatial) {
            pan =
              event.direction === 'outgoing'
                ? (totalNeighbors === 1 ? 0.4 : 0.2 + (i / (totalNeighbors - 1)) * 0.6)
                : (totalNeighbors === 1 ? -0.4 : -0.8 + (i / (totalNeighbors - 1)) * 0.6);
          }

          notes.push({
            timeOffsetSec: offset,
            tone: {
              ...neighborTone,
              durationSec: 0.12,
              gain: isSelected ? Math.min(1.0, (neighborTone.gain ?? 0.22) * 1.25) : (neighborTone.gain ?? 0.22) * 0.7,
              pan
            }
          });

          offset += 0.18;
        }

        return {
          id: `focus-summary-${event.nodeId}-${Date.now()}`,
          notes,
          totalDurationSec: offset + 0.05
        };
      }

      case 'NEIGHBOR_SELECTED': {
        const selectedId =
          event.selectedNeighborIndex !== undefined &&
          event.neighborIds[event.selectedNeighborIndex]
            ? event.neighborIds[event.selectedNeighborIndex]
            : event.nodeId;

        const neighborShape = this.resolveShapeForNode(selectedId, graph);
        const neighborTone = this.registry.createNodeCategoryTone(neighborShape);

        let pan = 0.0;
        if (isSpatial && event.neighborIds.length > 0) {
          const total = event.neighborIds.length;
          const idx = event.selectedNeighborIndex ?? 0;
          pan =
            event.direction === 'outgoing'
              ? (total === 1 ? 0.4 : 0.2 + (idx / Math.max(1, total - 1)) * 0.6)
              : (total === 1 ? -0.4 : -0.8 + (idx / Math.max(1, total - 1)) * 0.6);
        }

        return {
          id: `select-${selectedId}-${Date.now()}`,
          notes: [
            {
              timeOffsetSec: 0.0,
              tone: {
                ...neighborTone,
                pan
              }
            }
          ],
          totalDurationSec: neighborTone.durationSec + 0.05
        };
      }

      case 'BACKTRACK': {
        return this.registry.createRelationshipDirectionSequence('incoming', 'backtrack');
      }

      case 'START_RESET': {
        const shape = this.resolveShapeForNode(event.nodeId, graph);
        const tone = this.registry.createNodeCategoryTone(shape);
        return {
          id: `reset-${event.nodeId}-${Date.now()}`,
          notes: [{ timeOffsetSec: 0.0, tone }],
          totalDurationSec: tone.durationSec + 0.05
        };
      }

      case 'BOUNDARY_EMPTY': {
        return {
          id: `boundary-${Date.now()}`,
          notes: [
            {
              timeOffsetSec: 0.0,
              tone: {
                frequency: 160,
                durationSec: 0.12,
                waveform: 'sine',
                gain: 0.18,
                pan: 0.0
              }
            }
          ],
          totalDurationSec: 0.16
        };
      }

      default:
        return null;
    }
  }

  private resolveShapeForNode(nodeId: string, graph?: DirectedGraph): NodeShape {
    if (!graph || !graph.hasNode(nodeId)) {
      const lower = nodeId.toLowerCase();
      if (lower.includes('diamond')) return 'diamond';
      if (lower.includes('rect')) return 'rectangle';
      return 'circle';
    }
    const node = graph.getNode(nodeId);
    if (!node) return 'circle';
    return resolveNodePresentation(node).shape;
  }
}
