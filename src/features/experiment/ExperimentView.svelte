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

  .training-header {
    margin-bottom: 16px;
  }

  .training-header p {
    font-size: 14px;
    color: var(--color-text-muted);
  }
</style>
