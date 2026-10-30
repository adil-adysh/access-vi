import type { ExperimentSession } from './types.js';

export class ExportService {
  /**
   * Generates a formatted JSON string of the complete experiment session.
   */
  public static exportJSON(session: ExperimentSession): string {
    return JSON.stringify(session, null, 2);
  }

  /**
   * Generates a CSV string containing trial-level data and workload ratings.
   */
  public static exportCSV(session: ExperimentSession): string {
    const headers = [
      'participantId',
      'sessionId',
      'blockIndex',
      'trialIndexInBlock',
      'condition',
      'graphId',
      'taskId',
      'taskType',
      'isTraining',
      'isCorrect',
      'score',
      'durationMs',
      'actionCount',
      'replayCount',
      'inspectionCount',
      'backtrackCount',
      'traversalCount',
      'mentalDemand',
      'physicalDemand',
      'temporalDemand',
      'performance',
      'effort',
      'frustration',
      'startTimestamp',
      'endTimestamp'
    ];

    const rows: string[][] = [headers];

    for (const trial of session.trials) {
      const workload = session.workloadRatings[trial.condition];

      const row = [
        session.participantId,
        session.sessionId,
        trial.blockIndex.toString(),
        trial.trialIndexInBlock.toString(),
        trial.condition,
        trial.graphId,
        trial.task.id,
        trial.task.type,
        trial.isTraining ? 'true' : 'false',
        trial.evaluation.isCorrect ? 'true' : 'false',
        trial.evaluation.score.toFixed(3),
        trial.durationMs.toFixed(0),
        trial.navigationLog.length.toString(),
        trial.replayCount.toString(),
        trial.inspectionCount.toString(),
        trial.backtrackCount.toString(),
        trial.traversalCount.toString(),
        workload?.mentalDemand?.toString() ?? '',
        workload?.physicalDemand?.toString() ?? '',
        workload?.temporalDemand?.toString() ?? '',
        workload?.performance?.toString() ?? '',
        workload?.effort?.toString() ?? '',
        workload?.frustration?.toString() ?? '',
        trial.startTimestamp.toString(),
        trial.endTimestamp.toString()
      ];

      rows.push(row.map((val) => ExportService.escapeCSV(val)));
    }

    return rows.map((r) => r.join(',')).join('\n');
  }

  /**
   * Triggers a browser file download of text content.
   */
  public static downloadFile(filename: string, content: string, mimeType: string): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private static escapeCSV(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }
}
