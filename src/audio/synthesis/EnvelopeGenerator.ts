import type { EnvelopeOptions } from '../types.js';

export const DEFAULT_ENVELOPE: EnvelopeOptions = {
  attackSec: 0.015,
  decaySec: 0.04,
  sustainLevel: 0.7,
  releaseSec: 0.06
};

export class EnvelopeGenerator {
  /**
   * Applies an ADSR envelope to a GainNode starting at startTimeSec.
   */
  public static applyEnvelope(
    gainNode: GainNode,
    startTimeSec: number,
    durationSec: number,
    peakGain: number = 0.3,
    options: EnvelopeOptions = DEFAULT_ENVELOPE
  ): void {
    const { attackSec, decaySec, sustainLevel, releaseSec } = options;
    const gain = gainNode.gain;

    // Minimum positive value to prevent exponential ramp to zero errors
    const zeroFloor = 0.0001;

    const t0 = startTimeSec;
    const tAttack = t0 + attackSec;
    const tDecay = tAttack + decaySec;
    const tSustainEnd = Math.max(tDecay, t0 + durationSec - releaseSec);
    const tEnd = tSustainEnd + releaseSec;

    const sustainGain = Math.max(zeroFloor, peakGain * sustainLevel);

    gain.cancelScheduledValues(t0);
    gain.setValueAtTime(zeroFloor, t0);

    // Attack: zero to peak
    gain.exponentialRampToValueAtTime(Math.max(zeroFloor, peakGain), tAttack);

    // Decay: peak to sustain level
    gain.exponentialRampToValueAtTime(sustainGain, tDecay);

    // Sustain hold
    if (tSustainEnd > tDecay) {
      gain.setValueAtTime(sustainGain, tSustainEnd);
    }

    // Release: sustain to zero
    gain.exponentialRampToValueAtTime(zeroFloor, tEnd);
  }
}
