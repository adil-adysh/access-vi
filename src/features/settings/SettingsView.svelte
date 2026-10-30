<script lang="ts">
  import type { AudioCoordinator } from '../../audio/AudioCoordinator.js';
  import type { ExplorationController } from '../../domain/navigation/ExplorationController.js';
  import type { ExperimentalConditionId } from '../../domain/navigation/types.js';
  import type { OscillatorWaveform } from '../../audio/types.js';
  import { EXPERIMENTAL_CONDITIONS } from '../../research/conditions/types.js';

  interface Props {
    audioCoordinator: AudioCoordinator;
    controller: ExplorationController;
    isTrialActive?: boolean;
  }

  let { audioCoordinator, controller, isTrialActive = false }: Props = $props();

  let config = $state(audioCoordinator.getConfig());
  let currentCondition = $state<ExperimentalConditionId>(controller.getState().condition);

  $effect(() => {
    currentCondition = controller.getState().condition;
    const unsub = controller.onStateChange((state) => {
      currentCondition = state.condition;
    });
    return unsub;
  });

  function handleVolumeChange(e: Event) {
    const val = parseFloat((e.target as HTMLInputElement).value);
    audioCoordinator.updateConfig({ masterVolume: val });
    config = audioCoordinator.getConfig();
  }

  function handleSpeedChange(e: Event) {
    const val = parseFloat((e.target as HTMLInputElement).value);
    audioCoordinator.updateConfig({ playbackSpeed: val });
    config = audioCoordinator.getConfig();
  }

  function handleWaveformChange(waveform: OscillatorWaveform) {
    audioCoordinator.updateConfig({ waveform });
    config = audioCoordinator.getConfig();
  }

  function handleConditionChange(condId: ExperimentalConditionId) {
    currentCondition = condId;
    controller.setCondition(condId);
  }
</script>

<div class="settings-container">
  <div class="card">
    <h2>Audio & Sonification Settings</h2>

    {#if isTrialActive}
      <div class="trial-locked-banner" role="alert">
        <strong>🔒 Settings Locked:</strong> An experimental trial is currently in progress. Audio settings are frozen during trials to ensure controlled experimental measurement across participants.
      </div>
    {/if}

    <!-- Condition Selector for Explorer Mode -->
    <div class="setting-item">
      <label for="explorer-condition"><strong>Exploration Audio Condition:</strong></label>
      <p class="setting-desc">Switch between the experimental audio conditions for free graph exploration.</p>
      <select
        id="explorer-condition"
        value={currentCondition}
        disabled={isTrialActive}
        onchange={(e) => handleConditionChange((e.target as HTMLSelectElement).value as ExperimentalConditionId)}
      >
        {#each Object.values(EXPERIMENTAL_CONDITIONS) as cond}
          <option value={cond.id}>{cond.name}</option>
        {/each}
      </select>
    </div>

    <!-- Master Volume -->
    <div class="setting-item">
      <div class="setting-header">
        <label for="settings-volume"><strong>Master Sound Volume:</strong></label>
        <span class="value-tag">{Math.round(config.masterVolume * 100)}%</span>
      </div>
      <input
        id="settings-volume"
        type="range"
        min="0"
        max="1"
        step="0.05"
        disabled={isTrialActive}
        value={config.masterVolume}
        oninput={handleVolumeChange}
      />
    </div>

    <!-- Playback Speed -->
    <div class="setting-item">
      <div class="setting-header">
        <label for="settings-speed"><strong>Playback Speed:</strong></label>
        <span class="value-tag">{config.playbackSpeed.toFixed(1)}x</span>
      </div>
      <input
        id="settings-speed"
        type="range"
        min="0.5"
        max="2.0"
        step="0.1"
        disabled={isTrialActive}
        value={config.playbackSpeed}
        oninput={handleSpeedChange}
      />
    </div>

    <!-- Waveform / Timbre -->
    <div class="setting-item">
      <fieldset>
        <legend><strong>Synthesis Waveform (Timbre):</strong></legend>
        <div class="radio-row">
          {#each (['sine', 'triangle', 'sawtooth', 'square'] as OscillatorWaveform[]) as wf}
            <label class="radio-label">
              <input
                type="radio"
                name="waveform"
                value={wf}
                checked={config.waveform === wf}
                onchange={() => handleWaveformChange(wf)}
              />
              {wf.charAt(0).toUpperCase() + wf.slice(1)}
            </label>
          {/each}
        </div>
      </fieldset>
    </div>
  </div>

  <div class="card">
    <h2>Accessibility & Screen Reader Guidelines</h2>
    <div class="info-list">
      <p>
        <strong>Screen Reader Compatibility:</strong> Tested for NVDA on Windows and Microsoft Edge / Google Chrome. All visual representations are backed by semantic HTML and textual tables.
      </p>
      <p>
        <strong>Spatial Panning:</strong> Uses <code>StereoPannerNode</code>. Incoming relationships are positioned in the left stereo field, and outgoing relationships in the right stereo field.
      </p>
      <p>
        <strong>Monotonic Timers:</strong> High-precision monotonic timestamps (<code>performance.now()</code>) are used for all response latency recordings.
      </p>
    </div>
  </div>
</div>

<style>
  .settings-container {
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  h2 {
    font-size: 18px;
    color: var(--color-primary);
    margin-bottom: 16px;
  }

  .setting-item {
    padding: 14px 0;
    border-bottom: 1px solid var(--color-border);
  }

  .setting-item:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .setting-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .setting-desc {
    font-size: 13px;
    color: var(--color-text-muted);
    margin: 4px 0 8px 0;
  }

  .value-tag {
    background: #0f172a;
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 13px;
    font-weight: 700;
  }

  select {
    background: #0f172a;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    padding: 8px 12px;
    font-size: 14px;
    width: 100%;
    margin-top: 4px;
  }

  input[type='range'] {
    width: 100%;
  }

  fieldset {
    border: none;
    padding: 0;
  }

  .radio-row {
    display: flex;
    gap: 20px;
    margin-top: 8px;
    flex-wrap: wrap;
  }

  .radio-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    cursor: pointer;
  }

  .trial-locked-banner {
    background: rgba(234, 179, 8, 0.15);
    border: 1px solid #eab308;
    color: #fef08a;
    padding: 12px 16px;
    border-radius: 6px;
    font-size: 14px;
    margin-bottom: 20px;
    line-height: 1.5;
  }

  .info-list p {
    font-size: 14px;
    color: var(--color-text-muted);
    margin-bottom: 12px;
    line-height: 1.5;
  }
</style>
