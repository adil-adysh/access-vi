import { DirectedGraph } from '../graph/Graph.js';
import type {
  NavigationState,
  NavigationDirection,
  PlaybackState,
  ExplorationMode,
  ExperimentalConditionId,
  NodeInspection,
  NavigationLogEntry,
  NavigationActionType,
  InformationExposurePolicy
} from './types.js';
import { DEFAULT_FREE_POLICY } from './types.js';

export type StateChangeListener = (state: NavigationState, action: NavigationActionType) => void;
export type PlaybackRequestListener = (state: NavigationState, action: NavigationActionType) => void;
export type AnnouncementListener = (announcement: string, priority: 'polite' | 'assertive') => void;

/**
 * ExplorationController manages the state machine for graph navigation,
 * keyboard actions, history tracking, and logging.
 */
export class ExplorationController {
  private graph: DirectedGraph;
  private currentNodeId: string;
  private startNodeId: string;
  private history: string[] = [];
  private visitedNodes: Set<string> = new Set();
  private direction: NavigationDirection = 'outgoing';
  private selectedNeighborIndex: number = 0;
  private playbackState: PlaybackState = 'idle';
  private condition: ExperimentalConditionId = 'condition_a_speech';
  private mode: ExplorationMode = 'free_exploration';
  private inspection: NodeInspection | null = null;
  private exposurePolicy: InformationExposurePolicy;

  private readonly sessionStartMonotonic: number;
  private actionLog: NavigationLogEntry[] = [];

  private stateChangeListeners: Set<StateChangeListener> = new Set();
  private playbackRequestListeners: Set<PlaybackRequestListener> = new Set();
  private announcementListeners: Set<AnnouncementListener> = new Set();

  constructor(
    initialGraph?: DirectedGraph,
    initialCondition: ExperimentalConditionId = 'condition_a_speech',
    initialMode: ExplorationMode = 'free_exploration',
    initialPolicy: InformationExposurePolicy = DEFAULT_FREE_POLICY
  ) {
    this.sessionStartMonotonic = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.condition = initialCondition;
    this.mode = initialMode;
    this.exposurePolicy = initialPolicy;

    if (initialGraph && initialGraph.getNodeIds().length > 0) {
      this.graph = initialGraph;
      this.startNodeId = initialGraph.getNodeIds()[0];
      this.currentNodeId = this.startNodeId;
    } else {
      this.graph = new DirectedGraph({ id: 'empty', name: 'Empty Graph' });
      this.startNodeId = '';
      this.currentNodeId = '';
    }

    if (this.startNodeId) { this.visitedNodes.add(this.startNodeId); }
    this.updateInspection();
  }

  public getState(): NavigationState {
    return {
      graph: this.graph,
      currentNodeId: this.currentNodeId,
      startNodeId: this.startNodeId,
      history: [...this.history],
      visitedNodeIds: Array.from(this.visitedNodes),
      direction: this.direction,
      selectedNeighborIndex: this.selectedNeighborIndex,
      playbackState: this.playbackState,
      condition: this.condition,
      mode: this.mode,
      inspection: this.inspection,
      exposurePolicy: this.exposurePolicy
    };
  }

  public getExposurePolicy(): InformationExposurePolicy {
    return this.exposurePolicy;
  }

  public setExposurePolicy(policy: InformationExposurePolicy): void {
    this.exposurePolicy = policy;
    this.emitStateChange('SET_GRAPH');
  }

  public setGraph(graph: DirectedGraph, startNodeId?: string): void {
    this.cancelPlayback();
    const nodeIds = graph.getNodeIds();
    if (nodeIds.length === 0) {
      throw new Error('Cannot set an empty graph for exploration.');
    }

    this.graph = graph;
    this.startNodeId = startNodeId && graph.hasNode(startNodeId) ? startNodeId : nodeIds[0];
    this.currentNodeId = this.startNodeId;
    this.history = [];
    this.visitedNodes = new Set([this.startNodeId]);
    this.direction = 'outgoing';
    this.selectedNeighborIndex = 0;
    this.playbackState = 'idle';
    this.updateInspection();

    this.logAction('SET_GRAPH', { graphId: graph.getMetadata().id, startNodeId: this.startNodeId });
    const displayName = this.exposurePolicy.anonymizedGraphTitle ?? graph.getMetadata().name;
    this.emitAnnouncement(`Loaded graph: ${displayName}. Focused on node ${this.currentNodeId}.`, 'polite');
    this.emitStateChange('SET_GRAPH');
  }

  public setCondition(condition: ExperimentalConditionId): void {
    if (this.condition !== condition) {
      this.cancelPlayback();
      this.condition = condition;
      this.emitStateChange('SET_GRAPH');
    }
  }

  public setMode(mode: ExplorationMode): void {
    this.mode = mode;
    this.emitStateChange('SET_GRAPH');
  }

  public setPlaybackState(playbackState: PlaybackState): void {
    this.playbackState = playbackState;
    this.emitStateChange('REPLAY');
  }

  public getAvailableNeighbors(): string[] {
    if (!this.currentNodeId || !this.graph.hasNode(this.currentNodeId)) return [];
    return this.direction === 'outgoing'
      ? this.graph.getOutgoingNeighbors(this.currentNodeId)
      : this.graph.getIncomingNeighbors(this.currentNodeId);
  }

  public getSelectedNeighbor(): string | null {
    const neighbors = this.getAvailableNeighbors();
    if (neighbors.length === 0) return null;
    const clampedIndex = Math.min(Math.max(0, this.selectedNeighborIndex), neighbors.length - 1);
    return neighbors[clampedIndex] ?? null;
  }

  public setDirection(direction: NavigationDirection): void {
    if (this.direction === direction) return;
    this.direction = direction;
    this.selectedNeighborIndex = 0;
    this.logAction('SET_DIRECTION', { direction });

    const neighbors = this.getAvailableNeighbors();
    const countStr = neighbors.length === 1 ? '1 connection' : `${neighbors.length} connections`;
    this.emitAnnouncement(
      `Switched to ${direction} connections. ${countStr} available.${neighbors.length > 0 ? ` Selected ${neighbors[0]}.` : ''}`,
      'polite'
    );

    this.emitStateChange('SET_DIRECTION');
    this.emitPlaybackRequest('SET_DIRECTION');
  }

  public toggleDirection(): void {
    this.setDirection(this.direction === 'outgoing' ? 'incoming' : 'outgoing');
  }

  public nextNeighbor(): void {
    const neighbors = this.getAvailableNeighbors();
    if (neighbors.length === 0) {
      this.emitAnnouncement(`No ${this.direction} connections from node ${this.currentNodeId}.`, 'polite');
      return;
    }

    this.selectedNeighborIndex = (this.selectedNeighborIndex + 1) % neighbors.length;
    const selected = neighbors[this.selectedNeighborIndex];
    this.logAction('SELECT_NEIGHBOR', { selectedNeighborIndex: this.selectedNeighborIndex, selectedNeighbor: selected });

    this.emitAnnouncement(`Selected ${this.direction} connection ${this.selectedNeighborIndex + 1} of ${neighbors.length}: Node ${selected}`, 'polite');
    this.emitStateChange('SELECT_NEIGHBOR');
    this.emitPlaybackRequest('SELECT_NEIGHBOR');
  }

  public prevNeighbor(): void {
    const neighbors = this.getAvailableNeighbors();
    if (neighbors.length === 0) {
      this.emitAnnouncement(`No ${this.direction} connections from node ${this.currentNodeId}.`, 'polite');
      return;
    }

    this.selectedNeighborIndex = (this.selectedNeighborIndex - 1 + neighbors.length) % neighbors.length;
    const selected = neighbors[this.selectedNeighborIndex];
    this.logAction('SELECT_NEIGHBOR', { selectedNeighborIndex: this.selectedNeighborIndex, selectedNeighbor: selected });

    this.emitAnnouncement(`Selected ${this.direction} connection ${this.selectedNeighborIndex + 1} of ${neighbors.length}: Node ${selected}`, 'polite');
    this.emitStateChange('SELECT_NEIGHBOR');
    this.emitPlaybackRequest('SELECT_NEIGHBOR');
  }

  public selectNeighborByIndex(index: number): void {
    const neighbors = this.getAvailableNeighbors();
    if (index < 0 || index >= neighbors.length) return;
    this.selectedNeighborIndex = index;
    const selected = neighbors[this.selectedNeighborIndex];
    this.logAction('SELECT_NEIGHBOR', { selectedNeighborIndex: index, selectedNeighbor: selected });
    this.emitStateChange('SELECT_NEIGHBOR');
    this.emitPlaybackRequest('SELECT_NEIGHBOR');
  }

  public traverseSelectedNeighbor(): boolean {
    const target = this.getSelectedNeighbor();
    if (!target) {
      this.emitAnnouncement(`Cannot traverse: no ${this.direction} connection selected.`, 'assertive');
      return false;
    }

    const previousNode = this.currentNodeId;
    this.history.push(previousNode);
    this.currentNodeId = target;
    this.visitedNodes.add(target);
    this.selectedNeighborIndex = 0;
    this.updateInspection();

    this.logAction('TRAVERSE', { previousNode, targetNode: target, direction: this.direction });

    const outCount = this.graph.getOutDegree(target);
    const inCount = this.graph.getInDegree(target);
    this.emitAnnouncement(
      `Moved to Node ${target}. Outgoing: ${outCount}, Incoming: ${inCount}.`,
      'assertive'
    );

    this.emitStateChange('TRAVERSE');
    this.emitPlaybackRequest('TRAVERSE');
    return true;
  }

  public goBack(): boolean {
    if (this.history.length === 0) {
      this.emitAnnouncement('Cannot go back: navigation history is empty.', 'polite');
      return false;
    }

    const previous = this.history.pop()!;
    const fromNode = this.currentNodeId;
    this.currentNodeId = previous;
    this.visitedNodes.add(previous);
    this.selectedNeighborIndex = 0;
    this.updateInspection();

    this.logAction('GO_BACK', { fromNode, returnedToNode: previous });
    this.emitAnnouncement(`Returned back to Node ${previous}.`, 'assertive');

    this.emitStateChange('GO_BACK');
    this.emitPlaybackRequest('GO_BACK');
    return true;
  }

  public goToStartNode(): boolean {
    if (this.currentNodeId === this.startNodeId) {
      this.emitAnnouncement(`Already at starting Node ${this.startNodeId}.`, 'polite');
      return false;
    }

    const fromNode = this.currentNodeId;
    this.history.push(fromNode);
    this.currentNodeId = this.startNodeId;
    this.visitedNodes.add(this.startNodeId);
    this.selectedNeighborIndex = 0;
    this.updateInspection();

    this.logAction('GO_TO_START', { fromNode, startNode: this.startNodeId });
    this.emitAnnouncement(`Returned to starting Node ${this.startNodeId}.`, 'assertive');

    this.emitStateChange('GO_TO_START');
    this.emitPlaybackRequest('GO_TO_START');
    return true;
  }

  public jumpToNode(nodeId: string): boolean {
    if (!this.exposurePolicy.allowNodeJumping) {
      this.emitAnnouncement('Direct node jumping is disabled in this mode.', 'assertive');
      return false;
    }
    if (!this.graph.hasNode(nodeId)) {
      this.emitAnnouncement(`Cannot jump: Node ${nodeId} does not exist.`, 'assertive');
      return false;
    }
    if (nodeId === this.currentNodeId) return true;

    const fromNode = this.currentNodeId;
    this.history.push(fromNode);
    this.currentNodeId = nodeId;
    this.visitedNodes.add(nodeId);
    this.selectedNeighborIndex = 0;
    this.updateInspection();

    this.logAction('JUMP_TO_NODE', { fromNode, targetNode: nodeId });
    this.emitAnnouncement(`Jumped directly to Node ${nodeId}.`, 'assertive');

    this.emitStateChange('JUMP_TO_NODE');
    this.emitPlaybackRequest('JUMP_TO_NODE');
    return true;
  }

  public replay(): void {
    this.logAction('REPLAY', { currentNode: this.currentNodeId, direction: this.direction });
    this.emitAnnouncement(`Replaying audio for Node ${this.currentNodeId}.`, 'polite');
    this.emitPlaybackRequest('REPLAY');
  }

  public cancelPlayback(reason?: string): void {
    this.playbackState = 'interrupted';
    this.logAction('CANCEL_PLAYBACK', {
      currentNode: this.currentNodeId,
      ...(reason ? { interruptionReason: reason } : {})
    });
    this.emitAnnouncement('Audio playback cancelled.', 'polite');
    this.emitStateChange('CANCEL_PLAYBACK');
    this.emitPlaybackRequest('CANCEL_PLAYBACK');
  }

  public inspectCurrentNode(): NodeInspection {
    this.updateInspection();
    this.logAction('INSPECT', { inspection: this.inspection });

    const insp = this.inspection!;
    const inList = insp.incomingNeighbors.length > 0 ? insp.incomingNeighbors.join(', ') : 'none';
    const outList = insp.outgoingNeighbors.length > 0 ? insp.outgoingNeighbors.join(', ') : 'none';

    this.emitAnnouncement(
      `Inspection for Node ${insp.nodeId} (${insp.label}): In-degree ${insp.inDegree} from [${inList}], Out-degree ${insp.outDegree} to [${outList}].`,
      'assertive'
    );

    this.emitStateChange('INSPECT');
    return insp;
  }

  /**
   * Dispatches keyboard key presses to navigation commands.
   * Returns true if key was handled.
   */

  public getVisitedNodes(): ReadonlySet<string> {
    return this.visitedNodes;
  }

  public getWeaklyConnectedComponents(): string[][] {
    return this.graph.getWeaklyConnectedComponents();
  }

  public handleKeyboardCommand(key: string, ctrl: boolean = false, alt: boolean = false): boolean {
    if (ctrl || alt) return false;

    switch (key) {
      case 'ArrowDown':
      case 'j':
      case 'J':
        this.nextNeighbor();
        return true;

      case 'ArrowUp':
      case 'k':
      case 'K':
        this.prevNeighbor();
        return true;

      case 'ArrowRight':
      case 'Enter':
      case ' ':
        return this.traverseSelectedNeighbor();

      case 'ArrowLeft':
      case 'Backspace':
        return this.goBack();

      case 'Home':
      case 'h':
      case 'H':
        return this.goToStartNode();

      case 'd':
      case 'D':
        this.toggleDirection();
        return true;

      case 'r':
      case 'R':
        this.replay();
        return true;

      case 'i':
      case 'I':
        this.inspectCurrentNode();
        return true;

      case 'Escape':
        this.cancelPlayback();
        return true;

      case '?':
      case '/':
        this.announceKeyboardHelp();
        return true;

      default:
        return false;
    }
  }

  public announceKeyboardHelp(): void {
    this.logAction('HELP', {});
    this.emitAnnouncement(
      'Keyboard Help: Up and Down arrows cycle neighbors. Right arrow or Enter traverses into selected neighbor. Left arrow or Backspace goes back. Home key returns to start. D toggles direction. R replays audio. I inspects node. Escape cancels audio.',
      'assertive'
    );
  }

  public getActionHistory(): NavigationLogEntry[] {
    return [...this.actionLog];
  }

  public resetActionHistory(): void {
    this.actionLog = [];
  }

  public onStateChange(listener: StateChangeListener): () => void {
    this.stateChangeListeners.add(listener);
    return () => this.stateChangeListeners.delete(listener);
  }

  public onPlaybackRequest(listener: PlaybackRequestListener): () => void {
    this.playbackRequestListeners.add(listener);
    return () => this.playbackRequestListeners.delete(listener);
  }

  public onAnnouncement(listener: AnnouncementListener): () => void {
    this.announcementListeners.add(listener);
    return () => this.announcementListeners.delete(listener);
  }

  private updateInspection(): void {
    if (!this.currentNodeId || !this.graph.hasNode(this.currentNodeId)) {
      this.inspection = null;
      return;
    }

    const node = this.graph.getNode(this.currentNodeId)!;
    this.inspection = {
      nodeId: node.id,
      label: node.label ?? node.id,
      inDegree: this.graph.getInDegree(node.id),
      outDegree: this.graph.getOutDegree(node.id),
      incomingNeighbors: this.graph.getIncomingNeighbors(node.id),
      outgoingNeighbors: this.graph.getOutgoingNeighbors(node.id),
      category: node.category,
      metadata: node.metadata
    };
  }

  public logAction(actionType: NavigationActionType, details?: Record<string, unknown>): void {
    const now = Date.now();
    const monotonicOffset =
      (typeof performance !== 'undefined' ? performance.now() : now) - this.sessionStartMonotonic;

    this.actionLog.push({
      actionType,
      timestamp: now,
      monotonicOffsetMs: monotonicOffset,
      currentNodeId: this.currentNodeId,
      targetNodeId: details?.targetNode as string | undefined,
      direction: this.direction,
      selectedNeighborIndex: this.selectedNeighborIndex,
      details
    });
  }

  private emitStateChange(action: NavigationActionType): void {
    const state = this.getState();
    for (const listener of this.stateChangeListeners) {
      try {
        listener(state, action);
      } catch (err) {
        console.error('Error in stateChangeListener:', err);
      }
    }
  }

  private emitPlaybackRequest(action: NavigationActionType): void {
    const state = this.getState();
    for (const listener of this.playbackRequestListeners) {
      try {
        listener(state, action);
      } catch (err) {
        console.error('Error in playbackRequestListener:', err);
      }
    }
  }

  private emitAnnouncement(announcement: string, priority: 'polite' | 'assertive'): void {
    for (const listener of this.announcementListeners) {
      try {
        listener(announcement, priority);
      } catch (err) {
        console.error('Error in announcementListener:', err);
      }
    }
  }
}
