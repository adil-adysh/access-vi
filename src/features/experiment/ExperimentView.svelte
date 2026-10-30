<script lang="ts">
  import type { ExperimentRunner } from '../../research/recording/ExperimentRunner.js';
  import type { AudioCoordinator } from '../../audio/AudioCoordinator.js';
  import type { ExperimentSession, WorkloadRating } from '../../research/recording/types.js';
  import type { ExperimentalConditionId } from '../../domain/navigation/types.js';
  import { EXPERIMENTAL_CONDITIONS } from '../../research/conditions/types.js';
  import CalibrationView from './CalibrationView.svelte';
  import TrialView from './TrialView.svelte';
  import WorkloadView from './WorkloadView.svelte';
  import GraphExplorer from '../explorer/GraphExplorer.svelte';

  interface Props {
    runner: ExperimentRunner;
    audioCoordinator: AudioCoordinator;
    onNavigateToResults: () => void;
    onOpenHelp: () => void;
  }

  let {
    runner,
    audioCoordinator,
    onNavigateToResults,
    onOpenHelp
  }: Props = $props();

  let session: ExperimentSession = $state(runner.getSession());

  $effect(() => {
    session = runner.getSession();
    const unsub = runner.subscribe((updated: ExperimentSession) => {
      session = updated;
    });
    return unsub;
  });

  const currentCondition = $derived<ExperimentalConditionId>(
    session.currentPhase === 'training'
      ? 'condition_a_speech'
      : session.conditionOrder[Math.min(session.currentBlockIndex, session.conditionOrder.length - 1)]
  );
  const currentConditionDef = $derived(
    EXPERIMENTAL_CONDITIONS[currentCondition]
  );
  const currentTask = $derived.by(() => {
    if (!session) return null;
    void session.currentBlockIndex;
    void session.currentTrialIndex;
    return runner.getCurrentTask();
  });
  const totalTasksInBlock = $derived.by(() => {
    if (!session) return 0;
    void session.currentBlockIndex;
    return runner.getTotalTasksInBlock();
  });
</script>

<div class="experiment-view-container">
  {#if runner.getLastStorageResult() && !runner.getLastStorageResult()?.isPersistent}
    <div class="storage-warning-banner" role="alert">
      <strong>⚠️ Storage Warning:</strong> Browser IndexedDB is unavailable. Your session is currently saved in temporary memory only and will be lost on page reload. Please export your session data from the Results tab when finished.
    </div>
  {/if}

  {#if session.currentPhase === 'consent'}
    <div class="card consent-card">
      <h2>Research Study: Auditory Graph Explorer</h2>
      <div class="consent-text">
        <p>
          You are invited to participate in a research study investigating how interactive auditory representations and spatial sound assist in forming mental representations of directed network graphs.
        </p>
        <h3>Research Principles:</h3>
        <ul>
          <li>You will explore small directed graphs using keyboard navigation.</li>
          <li>In some blocks, you will hear non-speech audio tones representing nodes and directional connections.</li>
          <li>Your navigation timings, interactions, and responses will be stored locally on this machine (IndexedDB) with an anonymous ID (e.g. <code>{session.participantId}</code>).</li>
          <li>No personal identifiable information is collected. You can clear or export your data at any time.</li>
        </ul>
      </div>

      <div class="consent-footer">
        <button class="primary" onclick={() => runner.acceptConsent()}>
          I Understand & Acknowledge Consent →
        </button>
      </div>
    </div>
  {:else if session.currentPhase === 'calibration'}
    <CalibrationView
      {audioCoordinator}
      onComplete={() => runner.completeCalibration()}
    />
  {:else if session.currentPhase === 'training'}
    <div class="card training-card">
      <div class="training-header">
        <h2>Practice & Training Session</h2>
        <p>
          Learn the navigation controls on this simple 4-node practice graph. Use <strong>Arrows</strong> to navigate, <strong>D</strong> to toggle direction, <strong>R</strong> to replay audio, and <strong>I</strong> to inspect.
        </p>
      </div>

      <GraphExplorer controller={runner.getController()} {onOpenHelp} />

      <div class="training-footer">
        <button class="primary" onclick={() => runner.completeTraining()}>
          I Am Ready to Begin Experimental Trials →
        </button>
      </div>
    </div>
  {:else if session.currentPhase === 'trial_prep' || session.currentPhase === 'trial_active' || session.currentPhase === 'trial_response'}
    {#if currentTask}
      <TrialView
        task={currentTask}
        controller={runner.getController()}
        phase={session.currentPhase}
        blockIndex={session.currentBlockIndex}
        trialIndex={session.currentTrialIndex}
        totalTrials={totalTasksInBlock}
        conditionLabel={currentConditionDef.name}
        onStartExploration={() => runner.startTrialExploration()}
        onFinishExploration={() => runner.finishExplorationProceedToResponse()}
        onSubmitResponse={(ans: string | boolean | string[] | Array<{ source: string; target: string }>) => runner.submitTrialResponse(ans)}
        {onOpenHelp}
      />
    {/if}
  {:else if session.currentPhase === 'trial_interrupted'}
    <div class="card interruption-card" role="alert">
      <h2>⚠️ Trial Interrupted</h2>
      <p class="interruption-message">
        This trial was paused or interrupted ({session.activeTrialInterruptedReason ?? 'participant left trial or window was blurred'}).
      </p>
      <p class="protocol-explanation">
        <strong>Scientific Integrity Notice:</strong> Experimental graph reasoning tasks measure cognitive exploration time and mental model formation. Pausing midway introduces rehearsal confounds into timing measurements.
      </p>
      <div class="interruption-actions">
        <button class="primary" onclick={() => runner.restartTrial()}>
          ↺ Restart Trial (Recommended for Clean Data)
        </button>
        <button onclick={() => runner.resumeTrial()}>
          ▶ Resume Trial (Exclude Paused Time)
        </button>
        <button class="danger" onclick={() => runner.abandonTrial('Participant chose to abandon after interruption')}>
          ✕ Abandon Trial
        </button>
      </div>
    </div>
  {:else if session.currentPhase === 'workload'}
    <WorkloadView
      onSubmit={(rating: WorkloadRating) => runner.submitWorkloadRating(rating)}
    />
  {:else if session.currentPhase === 'rest'}
    <div class="card rest-card">
      <h2>Rest Period</h2>
      <p>
        You have completed Block {session.currentBlockIndex + 1} of {session.conditionOrder.length}. Take a short rest before continuing to the next condition block.
      </p>
      <div class="rest-footer">
        <button class="primary" onclick={() => runner.finishRestProceedToNextBlock()}>
          Continue to Next Condition Block →
        </button>
      </div>
    </div>
  {:else if session.currentPhase === 'completed'}
    <div class="card completed-card">
      <h2>🎉 Research Session Completed!</h2>
      <p>
        Thank you for completing the experimental session! All your navigation logs, response times, and workload scores have been safely recorded.
      </p>
      <div class="completed-footer">
        <button class="primary" onclick={onNavigateToResults}>
          View Results & Export Data →
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .experiment-view-container {
    max-width: 900px;
    margin: 0 auto;
  }

  .consent-card, .training-card, .rest-card, .completed-card {
    background: var(--color-surface);
  }

  h2 {
    font-size: 20px;
    color: var(--color-primary);
    margin-bottom: 12px;
  }

  .consent-text {
    font-size: 14px;
    line-height: 1.6;
    color: var(--color-text-muted);
    margin-bottom: 24px;
  }

  .consent-text h3 {
    font-size: 15px;
    color: var(--color-text);
    margin: 16px 0 8px 0;
  }

  .consent-text ul {
    padding-left: 20px;
  }

  .consent-text li {
    margin-bottom: 6px;
  }

  .consent-footer, .training-footer, .rest-footer, .completed-footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }

  .storage-warning-banner {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid #ef4444;
    color: #fca5a5;
    padding: 12px 16px;
    border-radius: 6px;
    font-size: 14px;
    margin-bottom: 20px;
    line-height: 1.5;
  }

  .interruption-card {
    background: #181d2f;
    border: 2px solid #eab308;
    padding: 24px;
    border-radius: 8px;
  }

  .interruption-message {
    font-size: 16px;
    color: #fef08a;
    margin-bottom: 12px;
  }

  .protocol-explanation {
    font-size: 14px;
    color: var(--color-text-muted);
    line-height: 1.6;
    margin-bottom: 24px;
  }

  .interruption-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .interruption-actions .danger {
    background: #991b1b;
    border-color: #ef4444;
    color: white;
  }

  .training-header {
    margin-bottom: 16px;
  }

  .training-header p {
    font-size: 14px;
    color: var(--color-text-muted);
  }
</style>
