<script lang="ts">
  import { KEY_BINDINGS } from '../accessibility/keyboard/keyBindings.js';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
  }

  let { isOpen, onClose }: Props = $props();

  let dialogElement = $state<HTMLElement | null>(null);
  let previousActiveElement: HTMLElement | null = null;

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

  function handleKeydown(event: KeyboardEvent) {
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
    onkeydown={handleKeydown}
  >
    <div
      class="modal-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-title"
      tabindex="-1"
      bind:this={dialogElement}
      onclick={(e) => e.stopPropagation()}
      onkeydown={handleKeydown}
    >
      <div class="modal-header">
        <h2 id="help-title">Keyboard Navigation & Shortcuts</h2>
        <button class="close-btn" onclick={onClose} aria-label="✕ Close Help Dialog">✕</button>
      </div>

      <div class="modal-body">
        <p class="intro-text">
          Access-VI is designed for NVDA-compatible keyboard-first exploration. Focus the exploration panel and use the shortcuts below:
        </p>

        <table class="shortcuts-table">
          <thead>
            <tr>
              <th scope="col">Key</th>
              <th scope="col">Action</th>
              <th scope="col">Description</th>
            </tr>
          </thead>
          <tbody>
            {#each KEY_BINDINGS as binding}
              <tr>
                <td><kbd>{binding.key}</kbd></td>
                <td><strong>{binding.label}</strong></td>
                <td>{binding.description}</td>
              </tr>
            {/each}
          </tbody>
        </table>

        <!-- Visual-Auditory Parity Sound Legend -->
        <div class="experimental-notes">
          <h3>Visual-Auditory Semantic Parity</h3>
          <p class="note-intro">
            Governing Rule: Non-speech audio represents non-text visual shapes and relationship directions, while all node text and edge descriptions belong exclusively to the screen reader.
          </p>
          <ul>
            <li><strong>Circle Shape:</strong> Sine wave tone at 300 Hz (smooth, pure tone).</li>
            <li><strong>Rectangle Shape:</strong> Triangle wave tone at 300 Hz (mellow harmonic timbre).</li>
            <li><strong>Diamond Shape:</strong> Softened square wave tone at 300 Hz (rich buzzy timbre).</li>
            <li><strong>Outgoing Direction:</strong> Upward two-tone interval (360 → 440 Hz).</li>
            <li><strong>Incoming Direction:</strong> Downward two-tone interval (440 → 360 Hz).</li>
            <li><strong>Disconnected Graphs:</strong> A warning and jump buttons appear when disconnected components exist.</li>
          </ul>
        </div>

        <div class="experimental-notes">
          <h3>Experimental Study Conditions</h3>
          <ul>
            <li><strong>Condition A (Speech-Only):</strong> Structural information provided sequentially via spoken announcements.</li>
            <li><strong>Condition B (Non-Spatial):</strong> Distinguishable node tones and transition sounds with centered panning.</li>
            <li><strong>Condition C (Spatial):</strong> Stereo-panned relationships (left for incoming connections, right for outgoing).</li>
          </ul>
        </div>
      </div>

      <div class="modal-footer">
        <button class="primary" onclick={onClose}>Close Help (Escape)</button>
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
    max-width: 700px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--color-border);
  }

  .modal-header h2 {
    font-size: 18px;
    margin: 0;
  }

  .close-btn {
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    font-size: 18px;
    cursor: pointer;
    padding: 4px 8px;
  }

  .close-btn:hover {
    color: #ffffff;
  }

  .modal-body {
    padding: 20px;
    overflow-y: auto;
    font-size: 14px;
    line-height: 1.5;
  }

  .intro-text {
    margin-bottom: 16px;
    color: var(--color-text-muted);
  }

  .shortcuts-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 24px;
  }

  .shortcuts-table th,
  .shortcuts-table td {
    padding: 8px 12px;
    text-align: left;
    border-bottom: 1px solid var(--color-border);
  }

  .shortcuts-table th {
    background: #0f172a;
    color: var(--color-primary);
  }

  kbd {
    background: #0f172a;
    border: 1px solid #475569;
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 12px;
    font-family: monospace;
    color: var(--color-primary);
  }

  .experimental-notes {
    background: #0f172a;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    padding: 14px 18px;
    margin-top: 14px;
  }

  .experimental-notes h3 {
    font-size: 15px;
    margin: 0 0 8px 0;
    color: var(--color-primary);
  }

  .note-intro {
    font-size: 13px;
    color: #94a3b8;
    margin-bottom: 8px;
  }

  .experimental-notes ul {
    margin: 0;
    padding-left: 20px;
  }

  .experimental-notes li {
    margin-bottom: 6px;
  }

  .experimental-notes li:last-child {
    margin-bottom: 0;
  }

  .modal-footer {
    padding: 12px 20px;
    border-top: 1px solid var(--color-border);
    display: flex;
    justify-content: flex-end;
  }
</style>
