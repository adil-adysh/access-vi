<script lang="ts">
  import { ExplorationController } from './domain/navigation/ExplorationController.js';
  import { AudioCoordinator } from './audio/AudioCoordinator.js';
  import { ExperimentRunner } from './research/recording/ExperimentRunner.js';
  import { IndexedDBStorage } from './storage/IndexedDBStorage.js';
  import { getSampleGraphs } from './research/datasets/sampleGraphs.js';
  import { DEFAULT_FREE_POLICY } from './domain/navigation/types.js';
  import type { DirectedGraph } from './domain/graph/Graph.js';
  import type { NavigationState } from './domain/navigation/types.js';

  import Header from './components/Header.svelte';
  import LiveAnnouncer from './components/LiveAnnouncer.svelte';
  import KeyboardHelpModal from './components/KeyboardHelpModal.svelte';
  import ImportModal from './features/import/ImportModal.svelte';
  import GraphExplorer from './features/explorer/GraphExplorer.svelte';
  import ExperimentView from './features/experiment/ExperimentView.svelte';
  import ResultsView from './features/results/ResultsView.svelte';
  import SettingsView from './features/settings/SettingsView.svelte';

  const sampleGraphs = getSampleGraphs();
  const initialGraph = sampleGraphs['graph-exp-1'];

  const storage = new IndexedDBStorage();
  const audioCoordinator = new AudioCoordinator();

  // Distinct isolated controllers for free exploration and experimental trials
  const freeController = new ExplorationController(
    initialGraph,
    'condition_b_non_spatial',
    'free_exploration',
    DEFAULT_FREE_POLICY
  );
  const runner = new ExperimentRunner({}, storage);
  const experimentController = runner.getController();

  let activeTab = $state<'explorer' | 'experiment' | 'results' | 'settings'>('explorer');
  let isHelpOpen = $state(false);
  let isImportOpen = $state(false);

  let politeAnnouncement = $state('');
  let assertiveAnnouncement = $state('');
  let freeNavState: NavigationState = $state(freeController.getState());
  let session = $state(runner.getSession());

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

  function handleTabChange(tab: 'explorer' | 'experiment' | 'results' | 'settings') {
    if (tab !== activeTab) {
      audioCoordinator.cancelPlayback();
      freeController.cancelPlayback();
      experimentController.cancelPlayback();

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
