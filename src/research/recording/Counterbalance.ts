import type { ExperimentalConditionId } from '../../domain/navigation/types.js';

export class Counterbalance {
  public static readonly ORDERS: ExperimentalConditionId[][] = [
    ['condition_a_speech', 'condition_b_non_spatial', 'condition_c_spatial'],
    ['condition_b_non_spatial', 'condition_c_spatial', 'condition_a_speech'],
    ['condition_c_spatial', 'condition_a_speech', 'condition_b_non_spatial'],
    ['condition_a_speech', 'condition_c_spatial', 'condition_b_non_spatial'],
    ['condition_b_non_spatial', 'condition_a_speech', 'condition_c_spatial'],
    ['condition_c_spatial', 'condition_b_non_spatial', 'condition_a_speech']
  ];

  /**
   * Deterministically assigns a condition order based on participant ID or index.
   */
  public static getOrderForParticipant(participantId: string): ExperimentalConditionId[] {
    const num = parseInt(participantId.replace(/\D/g, ''), 10);
    const index = isNaN(num) ? 0 : Math.abs(num - 1) % Counterbalance.ORDERS.length;
    return [...Counterbalance.ORDERS[index]];
  }

  /**
   * Assigns matched unique research graphs to each block index.
   */
  public static getGraphForBlock(blockIndex: number): string {
    const graphIds = ['graph-exp-1', 'graph-exp-2', 'graph-exp-3'];
    return graphIds[blockIndex % graphIds.length];
  }
}
