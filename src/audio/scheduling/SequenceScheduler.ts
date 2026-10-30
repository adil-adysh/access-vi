import type { AudioSequence } from '../types.js';
import { ToneSynthesizer, type ActiveToneHandle } from '../synthesis/ToneSynthesizer.js';

export interface PlaybackHandle {
  readonly id: string;
  readonly cancel: () => void;
  readonly isDone: () => boolean;
  readonly promise: Promise<void>;
}

export class SequenceScheduler {
  private activePlaybacks: Map<string, () => void> = new Map();

  constructor(
    private readonly context: AudioContext,
    private readonly destination: AudioNode
  ) {}

  public scheduleSequence(sequence: AudioSequence, playbackSpeed: number = 1.0): PlaybackHandle {
    // Cancel any previous playback for safety
    this.cancelAll();

    const speed = Math.max(0.2, Math.min(playbackSpeed, 3.0));
    const now = this.context.currentTime;
    const toneHandles: ActiveToneHandle[] = [];
    let isCancelled = false;
    let isFinished = false;

    for (const note of sequence.notes) {
      const scheduledTime = now + note.timeOffsetSec / speed;
      const adjustedDuration = note.tone.durationSec / speed;

      const handle = ToneSynthesizer.playTone(
        this.context,
        this.destination,
        {
          ...note.tone,
          durationSec: adjustedDuration
        },
        scheduledTime
      );
      toneHandles.push(handle);
    }

    let finishTimeout: ReturnType<typeof setTimeout> | undefined;
    const totalDurationMs = ((sequence.totalDurationSec / speed) + 0.1) * 1000;

    const cancel = () => {
      if (isCancelled || isFinished) return;
      isCancelled = true;
      if (finishTimeout) clearTimeout(finishTimeout);
      for (const h of toneHandles) {
        h.stop();
      }
      this.activePlaybacks.delete(sequence.id);
    };

    this.activePlaybacks.set(sequence.id, cancel);

    const promise = new Promise<void>((resolve) => {
      finishTimeout = setTimeout(() => {
        isFinished = true;
        this.activePlaybacks.delete(sequence.id);
        resolve();
      }, Math.max(50, totalDurationMs));
    });

    return {
      id: sequence.id,
      cancel,
      isDone: () => isFinished || isCancelled,
      promise
    };
  }

  public cancelAll(): void {
    for (const cancel of this.activePlaybacks.values()) {
      cancel();
    }
    this.activePlaybacks.clear();
  }
}
