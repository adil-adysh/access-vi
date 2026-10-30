import type { ToneOptions } from '../types.js';
import { EnvelopeGenerator, DEFAULT_ENVELOPE } from './EnvelopeGenerator.js';
import { Spatializer } from '../spatialization/Spatializer.js';

export interface ActiveToneHandle {
  readonly oscillator: OscillatorNode;
  readonly gainNode: GainNode;
  readonly pannerNode?: StereoPannerNode | AudioNode;
  readonly stop: () => void;
}

export class ToneSynthesizer {
  /**
   * Synthesizes and plays a single tone or frequency sweep.
   */
  public static playTone(
    context: AudioContext,
    destination: AudioNode,
    options: ToneOptions,
    startTimeSec?: number
  ): ActiveToneHandle {
    const t0 = startTimeSec ?? context.currentTime;
    const duration = options.durationSec;
    const osc = context.createOscillator();
    const gainNode = context.createGain();

    osc.type = options.waveform ?? 'sine';
    osc.frequency.setValueAtTime(options.frequency, t0);

    if (options.endFrequency !== undefined && options.endFrequency !== options.frequency) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(10, options.endFrequency),
        t0 + duration
      );
    }

    const envelope = options.envelope ?? DEFAULT_ENVELOPE;
    const peakGain = options.gain ?? 0.3;
    EnvelopeGenerator.applyEnvelope(gainNode, t0, duration, peakGain, envelope);

    let pannerNode: StereoPannerNode | AudioNode | undefined;
    if (options.pan !== undefined || options.endPan !== undefined) {
      pannerNode = Spatializer.createPanner(
        context,
        destination,
        options.pan ?? 0,
        t0,
        options.endPan,
        duration
      );
      gainNode.connect(pannerNode);
    } else {
      gainNode.connect(destination);
    }

    osc.connect(gainNode);

    osc.start(t0);
    const stopTime = t0 + duration + (envelope.releaseSec ?? 0.05);
    osc.stop(stopTime);

    let isStopped = false;
    const stop = () => {
      if (isStopped) return;
      isStopped = true;
      try {
        const now = context.currentTime;
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(gainNode.gain.value, now);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);
        osc.stop(now + 0.025);
      } catch {
        // already stopped
      }
    };

    return {
      oscillator: osc,
      gainNode,
      pannerNode,
      stop
    };
  }
}
