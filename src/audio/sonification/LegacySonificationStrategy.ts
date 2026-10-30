import type { ISonificationStrategy } from './types.js';
import type { AudioSequence, SemanticAudioEvent, SonificationConfig } from '../types.js';
import type { DirectedGraph } from '../../domain/graph/Graph.js';
import { SonificationStrategy } from './SonificationStrategy.js';

/**
 * LegacySonificationStrategy wraps the historical study mappings (pentatonic scale by node ID).
 *
 * Preserves experimental reproducibility under Governing Rule E for Condition B and Condition C
 * study trials. MUST NOT be used for new parity workflows or general graph exploration.
 */
export class LegacySonificationStrategy implements ISonificationStrategy {
  public readonly version = 'legacy-study-v1';
  public readonly name = 'Legacy Study Replication (A/B/C)';
  public readonly description =
    'Historical study mapping using pentatonic pitch encoding of node IDs. Strictly for replicating published experiment results.';

  public mapEventToSequence(
    event: SemanticAudioEvent,
    config: SonificationConfig,
    _graph?: DirectedGraph
  ): AudioSequence | null {
    return SonificationStrategy.mapEventToSequence(event, config);
  }
}
