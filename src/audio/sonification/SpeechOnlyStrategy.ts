import type { ISonificationStrategy } from './types.js';
import type { AudioSequence, SemanticAudioEvent, SonificationConfig } from '../types.js';
import type { DirectedGraph } from '../../domain/graph/Graph.js';

/**
 * SpeechOnlyStrategy provides completely silent non-speech audio.
 *
 * All graph information is vocalized exclusively through the screen reader,
 * corresponding to Experimental Condition A.
 */
export class SpeechOnlyStrategy implements ISonificationStrategy {
  public readonly version = 'speech-only-v1';
  public readonly name = 'Speech Only';
  public readonly description =
    'All non-speech audio is silenced. Graph structure and attributes are vocalized exclusively by the screen reader.';

  public mapEventToSequence(
    _event: SemanticAudioEvent,
    _config: SonificationConfig,
    _graph?: DirectedGraph
  ): AudioSequence | null {
    return null;
  }
}
