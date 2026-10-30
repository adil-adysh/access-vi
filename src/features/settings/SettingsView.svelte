<script lang="ts">
  import type { AudioCoordinator } from '../../audio/AudioCoordinator.js';
  import type { ExplorationController } from '../../domain/navigation/ExplorationController.js';
  import type { ExperimentalConditionId } from '../../domain/navigation/types.js';
  import type { OscillatorWaveform } from '../../audio/types.js';
  import { ParitySonificationStrategy } from '../../audio/sonification/ParitySonificationStrategy.js';
  import type { NodeShape } from '../../domain/presentation/types.js';
  import { EXPERIMENTAL_CONDITIONS } from '../../research/conditions/types.js';

  interface Props {
    audioCoordinator: AudioCoordinator;
    controller: ExplorationController;
    isTrialActive?: boolean;
  }

  let { audioCoordinator, controller, isTrialActive = false }: Props = $props();

  let config = $state(audioCoordinator.getConfig());
  let currentCondition = $state<ExperimentalConditionId>(controller.getState().condition);
  let activeStrategyVersion = $state<string>(audioCoordinator.getStrategy().version);

  // Parity candidate shape gains
  let circleGain = $state<number>(0.28);
  let rectangleGain = $state<number>(0.22);
  let diamondGain = $state<number>(0.14);

  $effect(() => {
    currentCondition = controller.getState().condition;
    const unsub = controller.onStateChange((state) => {
      currentCondition = state.condition;
    });
    return unsub;
  });

  $effect(() => {
    const strat = audioCoordinator.getStrategy();
    activeStrategyVersion = strat.version;
    if (strat instanceof ParitySonificationStrategy) {
      circleGain = strat.getRegistry().getShapeGain('circle');
      rectangleGain = strat.getRegistry().getShapeGain('rectangle');
      diamondGain = strat.getRegistry().getShapeGain('diamond');
    }
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
    if (condId === 'condition_parity') {
      audioCoordinator.setStrategyByVersion('visual-auditory-parity-v1');
    } else if (condId === 'condition_a_speech') {
      audioCoordinator.setStrategyByVersion('speech-only-v1');
    } else if (condId === 'condition_b_non_spatial') {
      audioCoordinator.setStrategyByVersion('legacy-study-v1');
      audioCoordinator.updateConfig({ useSpatial: false });
    } else if (condId === 'condition_c_spatial') {
      audioCoordinator.setStrategyByVersion('legacy-study-v1');
      audioCoordinator.updateConfig({ useSpatial: true });
    }
    activeStrategyVersion = audioCoordinator.getStrategy().version;
  }

  function handleStrategyChange(version: string) {
    audioCoordinator.setStrategyByVersion(version);
    activeStrategyVersion = audioCoordinator.getStrategy().version;
    if (version === 'visual-auditory-parity-v1') {
      controller.setCondition('condition_parity');
      currentCondition = 'condition_parity';
    } else if (version === 'speech-only-v1') {
      controller.setCondition('condition_a_speech');
      currentCondition = 'condition_a_speech';
    } else if (version === 'legacy-study-v1') {
      controller.setCondition('condition_b_non_spatial');
      currentCondition = 'condition_b_non_spatial';
    }
  }

  function handleShapeGainChange(shape: NodeShape, gain: number) {
    const strat = audioCoordinator.getStrategy();
    if (strat instanceof ParitySonificationStrategy) {
      strat.getRegistry().setShapeGain(shape, gain);
      if (shape === 'circle') circleGain = gain;
      if (shape === 'rectangle') rectangleGain = gain;
      if (shape === 'diamond') diamondGain = gain;
    }
  }

  function testShapeTone(shape: NodeShape) {
    audioCoordinator.playShapeTone(shape);
  }

  function handleResetGains() {
    const strat = audioCoordinator.getStrategy();
    if (strat instanceof ParitySonificationStrategy) {
      strat.getRegistry().resetToDefaultGains();
      circleGain = strat.getRegistry().getShapeGain('circle');
      rectangleGain = strat.getRegistry().getShapeGain('rectangle');
      diamondGain = strat.getRegistry().getShapeGain('diamond');
    }
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

    <!-- Audio Representation Architecture Selector -->
    <div class="setting-item">
      <label for="strategy-selector"><strong>Audio Representation Strategy:</strong></label>
      <p class="setting-desc">
        Select the governing sonification model. Faithful Parity represents visual shapes via waveform timbre without arbitrary pitch encoding.
      </p>
      <select
        id="strategy-selector"
        value={activeStrategyVersion}
        disabled={isTrialActive}
        onchange={(e) => handleStrategyChange((e.target as HTMLSelectElement).value)}
      >
        <option value="visual-auditory-parity-v1">
          Faithful Visual-Auditory Parity (v1) [Default]
        </option>
        <option value="speech-only-v1">
          Speech Only (Non-speech audio silent)
        </option>
        <option value="legacy-study-v1">
          Legacy Study Replication (A/B/C Pentatonic ID Pitch Mapping)
        </option>
      </select>
    </div>

    <!-- Candidate Shape Gain Calibration Controls (Fix 9) -->
    {#if activeStrategyVersion === 'visual-auditory-parity-v1'}
      <div class="setting-item shape-gains-panel">
        <div class="setting-header">
          <span class="gain-section-title"><strong>Candidate Shape Gain Controls (Empirical Calibration):</strong></span>
          <button
            class="secondary small reset-gains-btn"
            disabled={isTrialActive}
            onclick={handleResetGains}
          >
            Reset Default Gains
          </button>
        </div>
        <p class="setting-desc">
          Adjust relative amplitudes for empirical equal-loudness testing. Initial candidate values reflect spectral energy differences.
        </p>

        <div class="shape-gain-rows">
          <div class="gain-control-row">
            <span class="gain-label">Circle (Sine, 300 Hz):</span>
            <input
              type="range"
              min="0.05"
              max="0.60"
              step="0.01"
              value={circleGain}
              disabled={isTrialActive}
              oninput={(e) => handleShapeGainChange('circle', parseFloat((e.target as HTMLInputElement).value))}
              aria-label="Circle sine wave gain"
            />
            <span class="gain-val">{circleGain.toFixed(2)}</span>
            <button
              class="secondary small test-btn"
              onclick={() => testShapeTone('circle')}
              aria-label="Test Circle tone"
            >
              ▶ Test
            </button>
          </div>

          <div class="gain-control-row">
            <span class="gain-label">Rectangle (Triangle, 300 Hz):</span>
            <input
              type="range"
              min="0.05"
              max="0.60"
              step="0.01"
              value={rectangleGain}
              disabled={isTrialActive}
              oninput={(e) => handleShapeGainChange('rectangle', parseFloat((e.target as HTMLInputElement).value))}
              aria-label="Rectangle triangle wave gain"
            />
            <span class="gain-val">{rectangleGain.toFixed(2)}</span>
            <button
              class="secondary small test-btn"
              onclick={() => testShapeTone('rectangle')}
              aria-label="Test Rectangle tone"
            >
              ▶ Test
            </button>
          </div>

          <div class="gain-control-row">
            <span class="gain-label">Diamond (Square, 300 Hz):</span>
            <input
              type="range"
              min="0.05"
              max="0.60"
              step="0.01"
              value={diamondGain}
              disabled={isTrialActive}
              oninput={(e) => handleShapeGainChange('diamond', parseFloat((e.target as HTMLInputElement).value))}
              aria-label="Diamond softened square wave gain"
            />
            <span class="gain-val">{diamondGain.toFixed(2)}</span>
            <button
              class="secondary small test-btn"
              onclick={() => testShapeTone('diamond')}
              aria-label="Test Diamond tone"
            >
              ▶ Test
            </button>
          </div>
        </div>
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

    <!-- Waveform / Timbre for Legacy Mode -->
    {#if activeStrategyVersion === 'legacy-study-v1'}
      <div class="setting-item">
        <fieldset>
          <legend><strong>Synthesis Waveform (Timbre for Legacy Mode):</strong></legend>
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
    {/if}
  </div>

  <div class="card">
    <h2>Accessibility & Screen Reader Guidelines</h2>
    <div class="info-list">
      <p>
        <strong>Visual-Auditory Semantic Parity:</strong> In accordance with Governing Rules A–E, non-speech audio communicates non-text visual distinctions (shapes, connection direction) while all node and edge labels belong strictly to screen-reader speech.
      </p>
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

  .shape-gains-panel {
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 14px;
    margin: 10px 0;
  }

  .shape-gain-rows {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 10px;
  }

  .gain-control-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .gain-label {
    width: 220px;
    font-size: 13px;
    color: #cbd5e1;
    font-weight: 600;
  }

  .gain-val {
    width: 40px;
    font-family: monospace;
    font-size: 13px;
    color: var(--color-primary);
  }

  .reset-gains-btn {
    font-size: 11px;
    padding: 3px 8px;
  }

  .test-btn {
    padding: 3px 8px;
    font-size: 11px;
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
    flex: 1;
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
