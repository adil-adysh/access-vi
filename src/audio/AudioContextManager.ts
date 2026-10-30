export class AudioContextManager {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private masterVolume: number = 0.7;

  constructor() {
    // Context is created on demand / on user gesture
  }

  public getAudioContext(): AudioContext {
    if (!this.context) {
      const AudioCtx =
        typeof window !== 'undefined'
          ? window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
          : undefined;

      if (!AudioCtx) {
        throw new Error('Web Audio API is not supported in this environment.');
      }

      this.context = new AudioCtx();

      // Master compressor to act as a brickwall limiter protecting user hearing
      this.compressor = this.context.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-3, this.context.currentTime);
      this.compressor.knee.setValueAtTime(6, this.context.currentTime);
      this.compressor.ratio.setValueAtTime(12, this.context.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.context.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.context.currentTime);

      this.masterGain = this.context.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.context.currentTime);

      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.context.destination);
    }

    if (this.context.state === 'suspended') {
      this.context.resume().catch((err) => {
        console.warn('AudioContext resume failed:', err);
      });
    }

    return this.context;
  }

  public getDestination(): AudioNode {
    this.getAudioContext();
    return this.masterGain!;
  }

  public getCurrentTime(): number {
    return this.context ? this.context.currentTime : 0;
  }

  public setMasterVolume(volume: number): void {
    this.masterVolume = Math.min(Math.max(0, volume), 1.0);
    if (this.masterGain && this.context) {
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.context.currentTime);
    }
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public async close(): Promise<void> {
    if (this.context && this.context.state !== 'closed') {
      await this.context.close();
      this.context = null;
      this.masterGain = null;
      this.compressor = null;
    }
  }
}
