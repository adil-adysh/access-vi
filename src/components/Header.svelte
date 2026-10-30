<script lang="ts">
  import type { ExperimentalConditionId } from '../domain/navigation/types.js';
  import { EXPERIMENTAL_CONDITIONS } from '../research/conditions/types.js';

  interface Props {
    activeTab: 'explorer' | 'experiment' | 'results' | 'settings';
    condition: ExperimentalConditionId;
    onTabChange: (tab: 'explorer' | 'experiment' | 'results' | 'settings') => void;
    onOpenHelp: () => void;
    onOpenImport: () => void;
  }

  let {
    activeTab,
    condition,
    onTabChange,
    onOpenHelp,
    onOpenImport
  }: Props = $props();

  const condDef = $derived(EXPERIMENTAL_CONDITIONS[condition]);
</script>

<header class="app-header">
  <div class="container header-content">
    <div class="header-branding">
      <h1>Auditory Graph Explorer</h1>
      <span class="badge primary" role="status" aria-label={`Current Mode: ${condDef.name}`}>
        {condDef.shortLabel}
      </span>
    </div>

    <nav aria-label="Main Navigation" class="main-nav">
      <button
        class={activeTab === 'explorer' ? 'nav-btn active' : 'nav-btn'}
        onclick={() => onTabChange('explorer')}
        aria-current={activeTab === 'explorer' ? 'page' : undefined}
      >
        Graph Explorer
      </button>

      <button
        class={activeTab === 'experiment' ? 'nav-btn active' : 'nav-btn'}
        onclick={() => onTabChange('experiment')}
        aria-current={activeTab === 'experiment' ? 'page' : undefined}
      >
        Research Experiment
      </button>

      <button
        class={activeTab === 'results' ? 'nav-btn active' : 'nav-btn'}
        onclick={() => onTabChange('results')}
        aria-current={activeTab === 'results' ? 'page' : undefined}
      >
        Results & Export
      </button>

      <button
        class={activeTab === 'settings' ? 'nav-btn active' : 'nav-btn'}
        onclick={() => onTabChange('settings')}
        aria-current={activeTab === 'settings' ? 'page' : undefined}
      >
        Settings
      </button>

      <button class="nav-btn action-btn" onclick={onOpenImport} aria-label="Import Graph (DOT or JSON)">
        Import
      </button>

      <button class="nav-btn action-btn" onclick={onOpenHelp} aria-label="Keyboard Shortcuts and Help">
        Help (?)
      </button>
    </nav>
  </div>
</header>

<style>
  .app-header {
    background-color: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    padding: 12px 0;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
    padding-top: 0;
    padding-bottom: 0;
  }

  .header-branding {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  h1 {
    font-size: 20px;
    font-weight: 700;
  }

  .main-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .nav-btn {
    background: transparent;
    border: 1px solid transparent;
    color: var(--color-text-muted);
    font-size: 14px;
    padding: 6px 12px;
  }

  .nav-btn:hover {
    color: var(--color-text);
    background-color: var(--color-surface-hover);
    border-color: var(--color-border);
  }

  .nav-btn.active {
    color: var(--color-primary);
    background-color: rgba(56, 189, 248, 0.1);
    border-color: var(--color-primary);
  }

  .action-btn {
    border-color: var(--color-border);
  }
</style>
