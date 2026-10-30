<script lang="ts">
  import { GraphParser } from '../../domain/graph/parser.js';
  import { DirectedGraph } from '../../domain/graph/Graph.js';
  import { getFreeExplorationGraphs } from '../../research/datasets/sampleGraphs.js';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
    onGraphLoaded: (graph: DirectedGraph) => void;
  }

  let { isOpen, onClose, onGraphLoaded }: Props = $props();

  let importFormat: 'dot' | 'json' = $state('dot');
  let inputText = $state('');
  let errorMessage = $state('');
  let dialogElement = $state<HTMLElement | null>(null);
  let previousActiveElement: HTMLElement | null = null;
  const sampleGraphs = getFreeExplorationGraphs();

  $effect(() => {
    if (isOpen) {
      previousActiveElement = (document.activeElement as HTMLElement) ?? null;
      setTimeout(() => {
        if (dialogElement) {
          const focusable = dialogElement.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length > 0) {
            focusable[0].focus();
          } else {
            dialogElement.focus();
          }
        }
      }, 10);
    } else if (previousActiveElement) {
      previousActiveElement.focus();
      previousActiveElement = null;
    }
  });

  function handleImport() {
    errorMessage = '';
    if (!inputText.trim()) {
      errorMessage = 'Please provide graph input text.';
      return;
    }

    try {
      const graph =
        importFormat === 'dot'
          ? GraphParser.parseDOT(inputText, `imported_${Date.now()}`)
          : GraphParser.parseJSON(inputText);

      onGraphLoaded(graph);
      onClose();
    } catch (err: unknown) {
      errorMessage = err instanceof Error ? err.message : String(err);
    }
  }

  function loadSample(key: string) {
    const graph = sampleGraphs[key];
    if (graph) {
      onGraphLoaded(graph);
      onClose();
    }
  }

  function handleModalKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      return;
    }

    if (event.key === 'Tab' && dialogElement) {
      const focusables = Array.from(
        dialogElement.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === first || document.activeElement === dialogElement) {
          last.focus();
          event.preventDefault();
        }
      } else {
        if (document.activeElement === last) {
          first.focus();
          event.preventDefault();
        }
      }
    }
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if (isOpen && event.key === 'Escape') {
      event.stopPropagation();
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

{#if isOpen}
  <div
    class="modal-backdrop"
    role="presentation"
    onclick={onClose}
    onkeydown={handleModalKeydown}
  >
    <div
      class="modal-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-title"
      tabindex="-1"
      bind:this={dialogElement}
      onclick={(e) => e.stopPropagation()}
      onkeydown={handleModalKeydown}
    >
      <div class="modal-header">
        <h2 id="import-title">Import Directed Graph</h2>
        <button class="close-btn" onclick={onClose} aria-label="✕ Close Import Dialog">✕</button>
      </div>

      <div class="modal-body">
        <div class="sample-section">
          <h3>Load Standard Research Graph</h3>
          <div class="sample-buttons">
            {#each Object.entries(sampleGraphs) as [key, g]}
              <button onclick={() => loadSample(key)} class="sample-btn">
                {g.getMetadata().name} ({g.getNodeIds().length} nodes)
              </button>
            {/each}
          </div>
        </div>

        <hr class="divider" />

        <div class="custom-import-section">
          <h3>Custom Graph Import</h3>
          <div class="format-toggle" role="radiogroup" aria-label="Import format">
            <label>
              <input type="radio" bind:group={importFormat} value="dot" />
              Graphviz DOT
            </label>
            <label>
              <input type="radio" bind:group={importFormat} value="json" />
              JSON Schema
            </label>
          </div>

          <label for="graph-input" class="input-label">
            Paste {importFormat === 'dot' ? 'DOT' : 'JSON'} text:
          </label>
          <textarea
            id="graph-input"
            bind:value={inputText}
            rows="6"
            placeholder={importFormat === 'dot' ? 'digraph G { A -> B; B -> C; }' : '{\n  "nodes": [{"id": "A"}],\n  "edges": [{"id": "e1", "source": "A", "target": "B"}]\n}'}
          ></textarea>

          {#if errorMessage}
            <div class="error-banner" role="alert">
              <strong>Import Error:</strong> {errorMessage}
            </div>
          {/if}
        </div>
      </div>

      <div class="modal-footer">
        <button onclick={onClose}>Cancel</button>
        <button class="primary" onclick={handleImport}>Load Graph</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal-dialog {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    width: 90%;
    max-width: 650px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--color-border);
  }

  .close-btn {
    background: transparent;
    border: none;
    font-size: 18px;
  }

  .modal-body {
    padding: 20px;
    overflow-y: auto;
  }

  .sample-section h3, .custom-import-section h3 {
    font-size: 15px;
    margin-bottom: 10px;
    color: var(--color-primary);
  }

  .sample-buttons {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .sample-btn {
    text-align: left;
    font-size: 13px;
  }

  .divider {
    border: 0;
    border-top: 1px solid var(--color-border);
    margin: 16px 0;
  }

  .format-toggle {
    display: flex;
    gap: 20px;
    margin-bottom: 12px;
    font-size: 14px;
  }

  .input-label {
    display: block;
    margin-bottom: 6px;
    font-size: 13px;
    color: var(--color-text-muted);
  }

  textarea {
    width: 100%;
    background: #0f172a;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    padding: 10px;
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--color-text);
  }

  .error-banner {
    margin-top: 10px;
    padding: 10px;
    background: rgba(248, 113, 113, 0.2);
    border: 1px solid var(--color-danger);
    border-radius: 6px;
    color: #fca5a5;
    font-size: 13px;
  }

  .modal-footer {
    padding: 12px 20px;
    border-top: 1px solid var(--color-border);
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
</style>
