import { AudioContextManager } from './AudioContextManager.js';
import { SequenceScheduler, type PlaybackHandle } from './scheduling/SequenceScheduler.js';
import { SonificationStrategy } from './sonification/SonificationStrategy.js';
import type {
  SonificationConfig,
  SemanticAudioEvent,
  SemanticEventType
} from './types.js';
import { DEFAULT_SONIFICATION_CONFIG } from './types.js';
import type { NavigationState, NavigationActionType } from '../domain/navigation/types.js';

export class AudioCoordinator {
  private readonly contextManager: AudioContextManager;
  private scheduler: SequenceScheduler | null = null;
  private config: SonificationConfig;
  private currentPlayback: PlaybackHandle | null = null;

  constructor(
    contextManager?: AudioContextManager,
    config: SonificationConfig = DEFAULT_SONIFICATION_CONFIG
  ) {
    this.contextManager = contextManager ?? new AudioContextManager();
    this.config = config;
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

    const isSpatial = state.condition === 'condition_c_spatial';
    const activeConfig: SonificationConfig = {
      ...this.config,
      useSpatial: isSpatial
    };

    const semanticEvent = this.createSemanticEvent(state, action, isSpatial);
    if (!semanticEvent) return null;

    return this.playSemanticEvent(semanticEvent, activeConfig);
  }

  public playSemanticEvent(
    event: SemanticAudioEvent,
    configOverride?: SonificationConfig
  ): PlaybackHandle | null {
    const config = configOverride ?? this.config;

    try {
      const ctx = this.contextManager.getAudioContext();
      if (!this.scheduler) {
        this.scheduler = new SequenceScheduler(ctx, this.contextManager.getDestination());
      }

      this.cancelPlayback();

      const sequence = SonificationStrategy.mapEventToSequence(event, config);
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
