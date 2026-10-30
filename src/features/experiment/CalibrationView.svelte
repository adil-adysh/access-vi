<script lang="ts">
  import type { AudioCoordinator } from '../../audio/AudioCoordinator.js';

  interface Props {
    audioCoordinator: AudioCoordinator;
    onComplete: () => void;
  }

  let { audioCoordinator, onComplete }: Props = $props();

  let volume = $state(0.7);
  let statusMessage = $state('Click Test Tone to verify your audio output.');

  function handleVolumeChange(e: Event) {
    const val = parseFloat((e.target as HTMLInputElement).value);
    volume = val;
    audioCoordinator.updateConfig({ masterVolume: val });
  }

  function playTestTone() {
    statusMessage = 'Playing centered test tone (C4 261Hz)...';
    audioCoordinator.playSemanticEvent({
      type: 'NODE_FOCUS',
      nodeId: 'A',
      nodeIndex: 0,
      totalNodes: 4,
      direction: 'outgoing',
      neighborIds: [],
      isSpatial: false
    });
  }

  function playLeftTone() {
    statusMessage = 'Playing Left Channel Tone (Incoming simulation)...';
    audioCoordinator.playSemanticEvent(
      {
        type: 'INCOMING_SUMMARY',
        nodeId: 'B',
        nodeIndex: 1,
        totalNodes: 4,
        direction: 'incoming',
        neighborIds: ['A'],
        selectedNeighborIndex: 0,
        isSpatial: true
      },
      { ...audioCoordinator.getConfig(), useSpatial: true }
    );
  }

  function playRightTone() {
    statusMessage = 'Playing Right Channel Tone (Outgoing simulation)...';
    audioCoordinator.playSemanticEvent(
      {
        type: 'OUTGOING_SUMMARY',
        nodeId: 'A',
        nodeIndex: 0,
        totalNodes: 4,
        direction: 'outgoing',
        neighborIds: ['B'],
        selectedNeighborIndex: 0,
        isSpatial: true
      },
      { ...audioCoordinator.getConfig(), useSpatial: true }
    );
  }
</script>

<div class="card calibration-card">
  <h2>Step 1: Audio Calibration & Hearing Check</h2>
  <p class="desc">
    Before beginning the research experiment, please ensure your headphones or stereo speakers are properly connected and set to a comfortable listening volume.
  </p>

  <div class="control-group">
    <label for="master-volume">
      Master Sound Volume: <strong>{Math.round(volume * 100)}%</strong>
    </label>
    <input
      id="master-volume"
      type="range"
      min="0"
      max="1"
      step="0.05"
      bind:value={volume}
      oninput={handleVolumeChange}
    />
  </div>

  <div class="audio-tests-grid">
    <button onclick={playTestTone} aria-label="Play centered test tone">
      ♫ Test Centered Audio
    </button>
    <button onclick={playLeftTone} aria-label="Play left channel spatial tone">
      ◄ Test Left Channel (Incoming)
    </button>
    <button onclick={playRightTone} aria-label="Play right channel spatial tone">
      ► Test Right Channel (Outgoing)
    </button>
  </div>

  <div class="status-banner" role="status" aria-live="polite">
    {statusMessage}
  </div>

  <div class="action-footer">
    <button class="primary" onclick={onComplete}>
      Confirm Audio & Proceed to Training →
    </button>
  </div>
</div>

<style>
  .calibration-card {
    max-width: 700px;
    margin: 0 auto;
  }

  h2 {
    font-size: 20px;
    margin-bottom: 8px;
    color: var(--color-primary);
  }

  .desc {
    color: var(--color-text-muted);
    font-size: 14px;
    margin-bottom: 20px;
  }

  .control-group {
    margin-bottom: 20px;
  }

  .control-group label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
  }

  input[type='range'] {
    width: 100%;
  }

  .audio-tests-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
    margin-bottom: 20px;
  }

  .status-banner {
    padding: 12px;
    background: #0f172a;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    font-size: 14px;
    color: var(--color-primary);
    margin-bottom: 24px;
  }

  .action-footer {
    display: flex;
    justify-content: flex-end;
  }
</style>
