<script lang="ts">
  import type { TaskDefinition, EdgeInput } from '../../domain/tasks/types.js';
  import type { ExplorationController } from '../../domain/navigation/ExplorationController.js';
  import GraphExplorer from '../explorer/GraphExplorer.svelte';
  import ReconstructionInput from './ReconstructionInput.svelte';

  interface Props {
    task: TaskDefinition;
    controller: ExplorationController;
    phase: 'trial_prep' | 'trial_active' | 'trial_response';
    blockIndex: number;
    trialIndex: number;
    totalTrials: number;
    conditionLabel: string;
    onStartExploration: () => void;
    onFinishExploration: () => void;
    onSubmitResponse: (answer: string | boolean | string[] | EdgeInput[]) => void;
    onOpenHelp: () => void;
  }

  let {
    task,
    controller,
    phase,
    blockIndex,
    trialIndex,
    totalTrials,
    conditionLabel,
    onStartExploration,
    onFinishExploration,
    onSubmitResponse,
    onOpenHelp
  }: Props = $props();

  let singleChoiceAnswer = $state('');
  let booleanAnswer = $state<boolean | null>(null);
  let reconstructionEdges = $state<EdgeInput[]>([]);
  let lastTaskId = $state<string | null>(null);

  $effect(() => {
    // Reset inputs ONLY when task identity changes
    if (task.id !== lastTaskId) {
      lastTaskId = task.id;
      if (task.options && task.options.length > 0) {
        singleChoiceAnswer = task.options[0];
      } else {
        singleChoiceAnswer = '';
      }
      booleanAnswer = null;
      reconstructionEdges = [];
    }
  });

  function handleFinalSubmit(e: Event) {
    e.preventDefault();
    if (task.inputType === 'single_choice') {
      onSubmitResponse(singleChoiceAnswer);
    } else if (task.inputType === 'boolean') {
      onSubmitResponse(booleanAnswer ?? false);
    } else if (task.inputType === 'edge_list') {
      onSubmitResponse(reconstructionEdges);
    }
  }
</script>

<div class="trial-container">
  <!-- Progress Header -->
  <div class="card progress-header">
    <div class="progress-details">
      <span class="badge primary">Condition: {conditionLabel}</span>
      <span class="badge">Block {blockIndex + 1} • Trial {trialIndex + 1} of {totalTrials}</span>
    </div>
    <div class="task-info">
      <h3>{task.title}</h3>
      <p class="task-prompt">{task.promptText}</p>
    </div>
  </div>

  {#if phase === 'trial_prep'}
    <div class="card prep-card">
      <h4>Trial Instructions</h4>
      <p>
        Read the question prompt above carefully. When ready, click <strong>Start Graph Exploration</strong>. Explore the graph using keyboard shortcuts until you are confident in your answer, then proceed to enter your response.
      </p>
      <div class="action-row">
        <button class="primary start-btn" onclick={onStartExploration}>
          ▶ Start Graph Exploration
        </button>
      </div>
    </div>
  {:else if phase === 'trial_active'}
    <div class="active-exploration-wrapper">
      <div class="card exploration-toolbar">
        <span class="live-indicator">● Active Exploration in Progress</span>
        <button class="primary" onclick={onFinishExploration}>
          Finish Exploration & Enter Response →
        </button>
      </div>

      <!-- Graph Explorer Embedded in Trial -->
      <GraphExplorer {controller} {onOpenHelp} />
    </div>
  {:else if phase === 'trial_response'}
    <div class="card response-card">
      <h4>Submit Your Answer for: {task.title}</h4>
      <p class="prompt-reminder"><strong>Question:</strong> {task.promptText}</p>

      <form onsubmit={handleFinalSubmit}>
        {#if task.inputType === 'single_choice'}
          <fieldset class="input-fieldset">
            <legend>Select the target node:</legend>
            <div class="radio-group">
              {#each task.options ?? [] as opt}
                <label class="radio-label">
                  <input
                    type="radio"
                    name="singleChoice"
                    value={opt}
                    bind:group={singleChoiceAnswer}
                  />
                  Node {opt}
                </label>
              {/each}
            </div>
          </fieldset>
        {:else if task.inputType === 'boolean'}
          <fieldset class="input-fieldset">
            <legend>Choose Yes or No:</legend>
            <div class="radio-group horizontal">
              <label class="radio-label">
                <input
                  type="radio"
                  name="boolChoice"
                  value={true}
                  checked={booleanAnswer === true}
                  onchange={() => (booleanAnswer = true)}
                />
                Yes (True)
              </label>
              <label class="radio-label">
                <input
                  type="radio"
                  name="boolChoice"
                  value={false}
                  checked={booleanAnswer === false}
                  onchange={() => (booleanAnswer = false)}
                />
                No (False)
              </label>
            </div>
          </fieldset>
        {:else if task.inputType === 'edge_list'}
          <ReconstructionInput
            availableNodes={task.options ?? ['A', 'B', 'C', 'D']}
            bind:edges={reconstructionEdges}
          />
        {/if}

        <div class="submit-footer">
          <button
            type="submit"
            class="primary submit-btn"
            disabled={task.inputType === 'boolean' && booleanAnswer === null}
          >
            Submit Answer & Continue →
          </button>
        </div>
      </form>
    </div>
  {/if}
</div>

<style>
  .trial-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .progress-header {
    margin-bottom: 0;
  }

  .progress-details {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }

  .task-info h3 {
    font-size: 18px;
    color: var(--color-primary);
  }

  .task-prompt {
    font-size: 16px;
    font-weight: 500;
    margin-top: 6px;
  }

  .prep-card, .response-card {
    background: var(--color-surface);
    border: 2px solid var(--color-primary);
  }

  .prep-card h4, .response-card h4 {
    font-size: 16px;
    color: var(--color-primary);
    margin-bottom: 8px;
  }

  .action-row, .submit-footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }

  .start-btn, .submit-btn {
    font-size: 16px;
    padding: 10px 20px;
  }

  .exploration-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #0f172a;
    border-color: var(--color-primary);
  }

  .live-indicator {
    color: var(--color-warning);
    font-weight: 700;
    font-size: 14px;
  }

  .prompt-reminder {
    padding: 12px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 6px;
    margin: 12px 0 20px 0;
    font-size: 15px;
  }

  .input-fieldset {
    border: 1px solid var(--color-border);
    border-radius: 6px;
    padding: 16px;
    margin-bottom: 20px;
  }

  .input-fieldset legend {
    padding: 0 8px;
    font-weight: 600;
  }

  .radio-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .radio-group.horizontal {
    flex-direction: row;
    gap: 24px;
  }

  .radio-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    cursor: pointer;
  }
</style>
