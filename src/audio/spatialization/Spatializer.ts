export class Spatializer {
  /**
   * Creates and configures a StereoPannerNode connected between source and destination.
   */
  public static createPanner(
    context: AudioContext,
    destination: AudioNode,
    pan: number = 0,
    startTimeSec?: number,
    endPan?: number,
    durationSec?: number
  ): StereoPannerNode | AudioNode {
    const clampedPan = Math.min(Math.max(-1.0, pan), 1.0);

    if (typeof context.createStereoPanner === 'function') {
      const panner = context.createStereoPanner();
      const t0 = startTimeSec ?? context.currentTime;
      panner.pan.setValueAtTime(clampedPan, t0);

      if (endPan !== undefined && durationSec !== undefined && durationSec > 0) {
        const clampedEndPan = Math.min(Math.max(-1.0, endPan), 1.0);
        panner.pan.linearRampToValueAtTime(clampedEndPan, t0 + durationSec);
      }

      panner.connect(destination);
      return panner;
    }

    // Fallback: simple passthrough
    return destination;
  }
}
