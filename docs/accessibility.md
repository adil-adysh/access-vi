# Accessibility Architecture & NVDA Manual Testing Guide

## 1. Accessibility Design Principles

1. **Keyboard-First Operability:** Every feature, setting, navigation action, and experimental task is operable strictly using standard keyboard shortcuts without requiring mouse interactions.
2. **Predictable Focus Management:** Focus is retained within the exploration region or modal dialogs. No keyboard traps exist. Modals trap focus appropriately and dismiss on `Escape`.
3. **Screen Reader Live Regions:** Dedicated `polite` and `assertive` live regions announce graph transitions, neighbor selections, and inspection details cleanly without spamming.
4. **Complete Textual Alternatives:** Visual graph rendering is never required. Every node, degree, and neighbor relationship is provided in structured semantic HTML tables and textual inspection summaries.
5. **Safe Listening Limiter:** A master Dynamics Compressor node prevents sudden volume spikes.

---

## 2. Keyboard Interaction Matrix

| Key | Action | Description | Scope |
| :--- | :--- | :--- | :--- |
| <kbd>ArrowDown</kbd> / <kbd>J</kbd> | Next Neighbor | Selects the next neighboring node in the active direction list | Explorer Panel |
| <kbd>ArrowUp</kbd> / <kbd>K</kbd> | Previous Neighbor | Selects the previous neighboring node in the active direction list | Explorer Panel |
| <kbd>ArrowRight</kbd> / <kbd>Enter</kbd> / <kbd>Space</kbd> | Traverse | Moves focus into the currently selected neighbor node | Explorer Panel |
| <kbd>ArrowLeft</kbd> / <kbd>Backspace</kbd> | Go Back | Returns to previously visited node in navigation history | Explorer Panel |
| <kbd>Home</kbd> / <kbd>H</kbd> | Go to Start | Returns directly to the root start node | Explorer Panel |
| <kbd>D</kbd> | Toggle Direction | Toggles between Outgoing ($\to$) and Incoming ($\leftarrow$) connections | Explorer Panel |
| <kbd>R</kbd> | Replay Audio | Replays the auditory sequence for the currently focused node | Explorer Panel |
| <kbd>I</kbd> | Inspect Node | Announce exact in/out connection lists for current node | Explorer Panel |
| <kbd>Escape</kbd> | Stop Audio / Close Modal | Immediately cancels audio playback or dismisses modal dialogs | Global |
| <kbd>?</kbd> / <kbd>/</kbd> | Help Dialog | Opens the full keyboard shortcuts guide | Global |

---

## 3. NVDA & Microsoft Edge Manual Verification Procedure

To conduct rigorous screen reader testing on Windows 11:

1. **Environment Setup:**
   - Launch NVDA (latest version).
   - Open Microsoft Edge and navigate to `http://localhost:5173`.
2. **Initial Verification:**
   - Verify that NVDA announces page title: *"Auditory Graph Explorer — Research Prototype"*.
   - Use <kbd>Tab</kbd> to move through the main navigation buttons (*Graph Explorer*, *Research Experiment*, *Results & Export*, *Settings*, *Import*, *Help*).
   - Ensure the skip link (*"Skip to main content"*) functions as expected.
3. **Exploration Verification:**
   - Press <kbd>Tab</kbd> until the Explorer region is focused.
   - Press <kbd>ArrowDown</kbd>: verify NVDA speaks *"Selected outgoing connection 2 of 2: Node C"*.
   - Press <kbd>Enter</kbd>: verify NVDA speaks *"Moved to Node C. Outgoing: 1, Incoming: 1"*.
   - Press <kbd>I</kbd>: verify NVDA announces node inspection details.
   - Press <kbd>D</kbd>: verify NVDA announces *"Switched to incoming connections"*.
   - Press <kbd>ArrowLeft</kbd>: verify NVDA speaks *"Returned back to Node A"*.
4. **Experiment Workflow Verification:**
   - Navigate to *Research Experiment* tab.
   - Verify consent checkbox / button, audio calibration controls, and practice exploration.
   - In response entry, test radio buttons and edge input fields for Mental Model Reconstruction.
