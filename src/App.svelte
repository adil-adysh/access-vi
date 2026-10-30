<script lang="ts">
  import { ExplorationController } from './domain/navigation/ExplorationController.js';
  import { AudioCoordinator } from './audio/AudioCoordinator.js';
  import { ExperimentRunner } from './research/recording/ExperimentRunner.js';
  import { IndexedDBStorage } from './storage/IndexedDBStorage.js';
  import { getFreeExplorationGraphs } from './research/datasets/sampleGraphs.js';
  import { DEFAULT_FREE_POLICY } from './domain/navigation/types.js';
  import type { DirectedGraph } from './domain/graph/Graph.js';
  import type { NavigationState } from './domain/navigation/types.js';
  import type { ExperimentSession } from './research/recording/types.js';

  import Header from './components/Header.svelte';
  import LiveAnnouncer from './components/LiveAnnouncer.svelte';
  import KeyboardHelpModal from './components/KeyboardHelpModal.svelte';
  import ImportModal from './features/import/ImportModal.svelte';
  import GraphExplorer from './features/explorer/GraphExplorer.svelte';
  import SoundMappingLab from './features/lab/SoundMappingLab.svelte';
  import ExperimentView from './features/experiment/ExperimentView.svelte';
  import ResultsView from './features/results/ResultsView.svelte';
  import SettingsView from './features/settings/SettingsView.svelte';
  import { ParitySonificationEngine } from './audio/parity/ParitySonificationEngine.js';

  const freeGraphs = getFreeExplorationGraphs();
  const initialGraph = freeGraphs['free-sandbox-1'];

  const storage = new IndexedDBStorage();
  const audioCoordinator = new AudioCoordinator();
  const parityEngine = new ParitySonificationEngine(audioCoordinator.getContextManager());

  // Distinct isolated controllers for free exploration and experimental trials
  const freeController = new ExplorationController(
    initialGraph,
    'condition_b_non_spatial',
    'free_exploration',
    DEFAULT_FREE_POLICY
  );

  let runner = $state(
    new ExperimentRunner({}, storage, undefined, undefined, audioCoordinator)
  );
  let experimentController = $derived(runner.getController());

  let activeTab = $state<'explorer' | 'lab' | 'experiment' | 'results' | 'settings'>('explorer');
  let isHelpOpen = $state(false);
  let isImportOpen = $state(false);

  let politeAnnouncement = $state('');
  let assertiveAnnouncement = $state('');
  let freeNavState: NavigationState = $state(freeController.getState());
  let session = $state(runner.getSession());

  // Session Recovery State
  let recoverableSession = $state<ExperimentSession | null>(null);
  let showRecoveryPrompt = $state(false);

  // Discover saved sessions on mount
  $effect(() => {
    storage.getAllSessions().then((sessions) => {
      const incomplete = sessions.find((s) => s.currentPhase !== 'completed');
      if (incomplete && incomplete.sessionId !== runner.getSession().sessionId) {
        recoverableSession = incomplete;
        showRecoveryPrompt = true;
      }
    });
  });

  function handleResumeSession() {
    if (recoverableSession) {
      runner = new ExperimentRunner({}, storage, undefined, recoverableSession, audioCoordinator);
      session = runner.getSession();
      showRecoveryPrompt = false;
      handleTabChange('experiment');
    }
  }

  function handleDiscardSession() {
    if (recoverableSession) {
      storage.deleteSession(recoverableSession.sessionId);
      recoverableSession = null;
      showRecoveryPrompt = false;
    }
  }

  // Intercept window visibility changes to detect backgrounding during active trials
  $effect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden' && runner.isTrialActive()) {
        runner.recordInterruption('Browser window minimized or backgrounded');
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  });

  // Connect Free Controller with Audio Coordinator and Screen Reader Announcer
  $effect(() => {
    const unsubFreeState = freeController.onStateChange((state) => {
      freeNavState = state;
    });

    const unsubFreeAudio = freeController.onPlaybackRequest((state, action) => {
      if (activeTab === 'explorer' || activeTab === 'settings') {
        audioCoordinator.handleNavigationAction(state, action);
      }
    });

    const unsubFreeAnnounce = freeController.onAnnouncement((msg, priority) => {
      if (activeTab === 'explorer' || activeTab === 'settings') {
        if (priority === 'assertive') {
          assertiveAnnouncement = msg;
        } else {
          politeAnnouncement = msg;
        }
      }
    });

    // Connect Experiment Controller
    const unsubExpAudio = experimentController.onPlaybackRequest((state, action) => {
      if (activeTab === 'experiment') {
        audioCoordinator.handleNavigationAction(state, action);
      }
    });

    const unsubExpAnnounce = experimentController.onAnnouncement((msg, priority) => {
      if (activeTab === 'experiment') {
        if (priority === 'assertive') {
          assertiveAnnouncement = msg;
        } else {
          politeAnnouncement = msg;
        }
      }
    });

    // Keep session reactive
    const unsubRunner = runner.subscribe((updatedSession) => {
      session = updatedSession;
    });

    return () => {
      unsubFreeState();
      unsubFreeAudio();
      unsubFreeAnnounce();
      unsubExpAudio();
      unsubExpAnnounce();
      unsubRunner();
    };
  });

  function handleTabChange(tab: 'explorer' | 'lab' | 'experiment' | 'results' | 'settings') {
    if (tab !== activeTab) {
      audioCoordinator.cancelPlayback();
      freeController.cancelPlayback();
      experimentController.cancelPlayback();
      parityEngine.cancelPlayback();

      if (activeTab === 'experiment' && tab !== 'experiment') {
        runner.recordInterruption('Participant switched away from experiment tab');
      }

      activeTab = tab;
    }
  }

  function handleGraphLoaded(graph: DirectedGraph) {
    // Only imports into free exploration controller; never affects experiment
    freeController.setGraph(graph);
    handleTabChange('explorer');
  }

  async function handleClearData() {
    if (confirm('Are you sure you want to delete all recorded session data from local storage?')) {
      await storage.clearAll();
      alert('Local session data cleared.');
    }
  }

  const currentDisplayedCondition = $derived(
    activeTab === 'experiment' ? runner.getCurrentCondition() : freeNavState.condition
  );
</script>

<a href="#main-content" class="skip-link">Skip to main content</a>

<LiveAnnouncer
  politeText={politeAnnouncement}
  assertiveText={assertiveAnnouncement}
/>

{#if showRecoveryPrompt && recoverableSession}
  <div class="recovery-banner" role="region" aria-label="Incomplete Session Recovery">
    <div class="container recovery-content">
      <span>
        Found saved session for Participant <strong>{recoverableSession.participantId}</strong> (Block {recoverableSession.currentBlockIndex + 1}, Trial {recoverableSession.currentTrialIndex + 1}).
      </span>
      <div class="recovery-btn-group">
        <button class="primary" onclick={handleResumeSession}>
          Resume Session
        </button>
        <button class="danger" onclick={handleDiscardSession}>
          Discard & Start New
        </button>
      </div>
    </div>
  </div>
{/if}

<Header
  {activeTab}
  condition={currentDisplayedCondition}
  onTabChange={handleTabChange}
  onOpenHelp={() => (isHelpOpen = true)}
  onOpenImport={() => (isImportOpen = true)}
/>

<main id="main-content" class="container">
  {#if activeTab === 'explorer'}
    <GraphExplorer
      controller={freeController}
      onOpenHelp={() => (isHelpOpen = true)}
    />
  {:else if activeTab === 'lab'}
    <SoundMappingLab
      audioEngine={parityEngine}
      onAnnounce={(msg, priority) => {
        if (priority === 'assertive') {
          assertiveAnnouncement = msg;
        } else {
          politeAnnouncement = msg;
        }
      }}
    />
  {:else if activeTab === 'experiment'}
    <ExperimentView
      {runner}
      {audioCoordinator}
      onNavigateToResults={() => handleTabChange('results')}
      onOpenHelp={() => (isHelpOpen = true)}
    />
  {:else if activeTab === 'results'}
    <ResultsView
      {session}
      onClearData={handleClearData}
    />
  {:else if activeTab === 'settings'}
    <SettingsView
      {audioCoordinator}
      controller={freeController}
      isTrialActive={runner.isTrialActive()}
    />
  {/if}
</main>

<KeyboardHelpModal
  isOpen={isHelpOpen}
  onClose={() => (isHelpOpen = false)}
/>

<ImportModal
  isOpen={isImportOpen}
  onClose={() => (isImportOpen = false)}
  onGraphLoaded={handleGraphLoaded}
/>

<style>
  .recovery-banner {
    background: #1e1b4b;
    border-bottom: 2px solid #6366f1;
    color: #e0e7ff;
    padding: 10px 0;
    font-size: 14px;
  }

  .recovery-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }

  .recovery-btn-group {
    display: flex;
    gap: 8px;
  }

  .recovery-btn-group .danger {
    background: #7f1d1d;
    border-color: #ef4444;
    color: white;
  }
</style>
