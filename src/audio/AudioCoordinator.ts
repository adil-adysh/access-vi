import { AudioContextManager } from './AudioContextManager.js';
import { SequenceScheduler, type PlaybackHandle } from './scheduling/SequenceScheduler.js';
import type { ISonificationStrategy } from './sonification/types.js';
import { ParitySonificationStrategy } from './sonification/ParitySonificationStrategy.js';
import { LegacySonificationStrategy } from './sonification/LegacySonificationStrategy.js';
import { SpeechOnlyStrategy } from './sonification/SpeechOnlyStrategy.js';
import type {
  SonificationConfig,
  SemanticAudioEvent,
  SemanticEventType,
  AudioSequence
} from './types.js';
import { DEFAULT_SONIFICATION_CONFIG } from './types.js';
import type { NavigationState, NavigationActionType } from '../domain/navigation/types.js';
import type { DirectedGraph } from '../domain/graph/Graph.js';
import { ParitySoundRegistry } from './parity/ParitySoundRegistry.js';
import type { NodeShape } from '../domain/presentation/types.js';

export class AudioCoordinator {
  private readonly contextManager: AudioContextManager;
  private scheduler: SequenceScheduler | null = null;
  private config: SonificationConfig;
  private currentPlayback: PlaybackHandle | null = null;
  private strategy: ISonificationStrategy;
  private legacyStrategy: LegacySonificationStrategy | null = null;
  private speechOnlyStrategy: SpeechOnlyStrategy | null = null;

  constructor(
    contextManager?: AudioContextManager,
    config: SonificationConfig = DEFAULT_SONIFICATION_CONFIG,
    strategy?: ISonificationStrategy
  ) {
    this.contextManager = contextManager ?? new AudioContextManager();
    this.config = config;
    this.strategy = strategy ?? new ParitySonificationStrategy();
  }

  public getConfig(): SonificationConfig {
    return { ...this.config };
  }

  public updateConfig(partial: Partial<SonificationConfig>): void {
    this.config = { ...this.config, ...partial };
    if (partial.masterVolume !== undefined) {
      this.contextManager.setMasterVolume(partial.masterVolume);
    }
  }

  public getContextManager(): AudioContextManager {
    return this.contextManager;
  }

  public getStrategy(): ISonificationStrategy {
    return this.strategy;
  }

  public setStrategy(strategy: ISonificationStrategy): void {
    this.cancelPlayback();
    this.strategy = strategy;
  }

  public setStrategyByVersion(version: string): void {
    if (version === 'legacy-study-v1') {
      this.setStrategy(this.legacyStrategy ??= new LegacySonificationStrategy());
    } else if (version === 'speech-only-v1') {
      this.setStrategy(this.speechOnlyStrategy ??= new SpeechOnlyStrategy());
    } else {
      this.setStrategy(new ParitySonificationStrategy());
    }
  }

  public getParityRegistry(): ParitySoundRegistry {
    if (this.strategy instanceof ParitySonificationStrategy) {
      return this.strategy.getRegistry();
    }
    return new ParitySoundRegistry();
  }

  public playShapeTone(shape: NodeShape): PlaybackHandle | null {
    const registry = this.getParityRegistry();
    const tone = registry.createNodeCategoryTone(shape);
    const sequence: AudioSequence = {
      id: `test-tone-${shape}-${Date.now()}`,
      notes: [{ timeOffsetSec: 0.0, tone }],
      totalDurationSec: tone.durationSec + 0.05
    };
    try {
      const ctx = this.contextManager.getAudioContext();
      if (!this.scheduler) {
        this.scheduler = new SequenceScheduler(ctx, this.contextManager.getDestination());
      }
      this.cancelPlayback();
      this.currentPlayback = this.scheduler.scheduleSequence(sequence, this.config.playbackSpeed);
      return this.currentPlayback;
    } catch (err) {
      console.warn('Audio playback not started:', err);
      return null;
    }
  }

  public handleNavigationAction(
    state: NavigationState,
    action: NavigationActionType
  ): PlaybackHandle | null {
    if (action === 'CANCEL_PLAYBACK') {
      this.cancelPlayback();
      return null;
    }

    // Condition A: Speech only -> no non-speech audio synthesized
    if (state.condition === 'condition_a_speech') {
      this.cancelPlayback();
      return null;
    }

    const isSpatial = state.condition === 'condition_c_spatial' || (this.config.useSpatial ?? false);
    const activeConfig: SonificationConfig = {
      ...this.config,
      useSpatial: isSpatial
    };

    const semanticEvent = this.createSemanticEvent(state, action, isSpatial);
    if (!semanticEvent) return null;

    // Governing Rule E: Formal study trials strictly enforce historical mappings for reproducibility
    if (state.mode === 'experiment_trial') {
      if (state.condition === 'condition_b_non_spatial' || state.condition === 'condition_c_spatial') {
        const legacy = (this.legacyStrategy ??= new LegacySonificationStrategy());
        return this.executeStrategySequence(legacy, semanticEvent, activeConfig, state.graph);
      }
    }

    // In free exploration or training:
    // If the active strategy is explicitly legacy, execute legacy mapping
    if (this.strategy instanceof LegacySonificationStrategy) {
      const legacy = (this.legacyStrategy ??= new LegacySonificationStrategy());
      return this.executeStrategySequence(legacy, semanticEvent, activeConfig, state.graph);
    }

    // Otherwise, execute the active strategy (ParitySonificationStrategy by default)
    return this.executeStrategySequence(this.strategy, semanticEvent, activeConfig, state.graph);
  }

  public playSemanticEvent(
    event: SemanticAudioEvent,
    configOverride?: SonificationConfig,
    graph?: DirectedGraph
  ): PlaybackHandle | null {
    const config = configOverride ?? this.config;
    return this.executeStrategySequence(this.strategy, event, config, graph);
  }

  private executeStrategySequence(
    strategy: ISonificationStrategy,
    event: SemanticAudioEvent,
    config: SonificationConfig,
    graph?: DirectedGraph
  ): PlaybackHandle | null {
    try {
      const ctx = this.contextManager.getAudioContext();
      if (!this.scheduler) {
        this.scheduler = new SequenceScheduler(ctx, this.contextManager.getDestination());
      }

      this.cancelPlayback();

      const sequence = strategy.mapEventToSequence(event, config, graph);
      if (!sequence) return null;

      this.currentPlayback = this.scheduler.scheduleSequence(sequence, config.playbackSpeed);
      return this.currentPlayback;
    } catch (err) {
      console.warn('Audio playback not started (waiting for user gesture or audio context):', err);
      return null;
    }
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

  private createSemanticEvent(
    state: NavigationState,
    action: NavigationActionType,
    isSpatial: boolean
  ): SemanticAudioEvent | null {
    const { graph, currentNodeId, direction, selectedNeighborIndex } = state;
    if (!currentNodeId || !graph.hasNode(currentNodeId)) return null;

    const nodeIds = graph.getNodeIds();
    const nodeIndex = nodeIds.indexOf(currentNodeId);
    const neighbors =
      direction === 'outgoing'
        ? graph.getOutgoingNeighbors(currentNodeId)
        : graph.getIncomingNeighbors(currentNodeId);

    let type: SemanticEventType = 'NODE_FOCUS';

    switch (action) {
      case 'SET_GRAPH':
      case 'TRAVERSE':
      case 'REPLAY':
      case 'JUMP_TO_NODE':
        type = direction === 'outgoing' ? 'OUTGOING_SUMMARY' : 'INCOMING_SUMMARY';
        break;

      case 'SET_DIRECTION':
        type = 'DIRECTION_TOGGLE';
        break;

      case 'SELECT_NEIGHBOR':
        type = 'NEIGHBOR_SELECTED';
        break;

      case 'GO_BACK':
        type = 'BACKTRACK';
        break;

      case 'GO_TO_START':
        type = 'START_RESET';
        break;

      case 'INSPECT':
      case 'HELP':
      case 'CANCEL_PLAYBACK':
        return null;
    }

    return {
      type,
      nodeId: currentNodeId,
      nodeIndex,
      totalNodes: nodeIds.length,
      direction,
      neighborIds: neighbors,
      selectedNeighborIndex,
      isSpatial
    };
  }
}
