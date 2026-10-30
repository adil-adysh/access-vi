import type { AudioSequence, SemanticAudioEvent, SonificationConfig } from '../types.js';
import type { DirectedGraph } from '../../domain/graph/Graph.js';

export interface ISonificationStrategy {
  readonly version: string;
  readonly name: string;
  readonly description: string;

  mapEventToSequence(
    event: SemanticAudioEvent,
    config: SonificationConfig,
    graph?: DirectedGraph
  ): AudioSequence | null;
}
