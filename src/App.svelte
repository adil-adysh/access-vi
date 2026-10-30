<script lang="ts">
  import { ExplorationController } from './domain/navigation/ExplorationController.js';
  import { AudioCoordinator } from './audio/AudioCoordinator.js';
  import { ExperimentRunner } from './research/recording/ExperimentRunner.js';
  import { IndexedDBStorage } from './storage/IndexedDBStorage.js';
  import { getSampleGraphs } from './research/datasets/sampleGraphs.js';
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
  const controller = new ExplorationController(initialGraph, 'condition_b_non_spatial');
  const runner = new ExperimentRunner({}, storage, controller);

  let activeTab: 'explorer' | 'experiment' | 'results' | 'settings' = $state('explorer');
  let isHelpOpen = $state(false);
  let isImportOpen = $state(false);

  let politeAnnouncement = $state('');
  let assertiveAnnouncement = $state('');
  let navState: NavigationState = $state(controller.getState());

  // Connect Controller with Audio Coordinator and Screen Reader Announcer
  $effect(() => {
    const unsubState = controller.onStateChange((state) => {
      navState = state;
    });

    const unsubAudio = controller.onPlaybackRequest((state, action) => {
      audioCoordinator.handleNavigationAction(state, action);
    });

    const unsubAnnounce = controller.onAnnouncement((msg, priority) => {
      if (priority === 'assertive') {
        assertiveAnnouncement = msg;
      } else {
        politeAnnouncement = msg;
      }
    });

    return () => {
      unsubState();
      unsubAudio();
      unsubAnnounce();
    };
  });

  function handleGraphLoaded(graph: DirectedGraph) {
    controller.setGraph(graph);
    activeTab = 'explorer';
  }

  async function handleClearData() {
    if (confirm('Are you sure you want to delete all recorded session data from local storage?')) {
      await storage.clearAll();
      alert('Local session data cleared.');
    }
  }
</script>

<a href="#main-content" class="skip-link">Skip to main content</a>

<LiveAnnouncer
  politeText={politeAnnouncement}
  assertiveText={assertiveAnnouncement}
/>

<Header
  {activeTab}
  condition={navState.condition}
  onTabChange={(tab: 'explorer' | 'experiment' | 'results' | 'settings') => (activeTab = tab)}
  onOpenHelp={() => (isHelpOpen = true)}
  onOpenImport={() => (isImportOpen = true)}
/>

<main id="main-content" class="container">
  {#if activeTab === 'explorer'}
    <GraphExplorer
      {controller}
      onOpenHelp={() => (isHelpOpen = true)}
    />
  {:else if activeTab === 'experiment'}
    <ExperimentView
      {runner}
      {audioCoordinator}
      onNavigateToResults={() => (activeTab = 'results')}
      onOpenHelp={() => (isHelpOpen = true)}
    />
  {:else if activeTab === 'results'}
    <ResultsView
      session={runner.getSession()}
      onClearData={handleClearData}
    />
  {:else if activeTab === 'settings'}
    <SettingsView
      {audioCoordinator}
      {controller}
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
