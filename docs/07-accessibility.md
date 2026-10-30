# Accessibility, NVDA and usability test plan

## Non-negotiable requirements

The browser app must support a complete nonvisual journey: choose graph, learn controls, explore, start/finish task, enter answer, review consent/settings, export and delete session. Every action needs a keyboard path and a discoverable accessible name. Sighted operation is not required to interpret the interface.

Target platform: **Windows 11 + Microsoft Edge + NVDA (latest stable)**. Automated axe checks are required during continuous integration, but manual verification with a live screen reader is necessary to validate speech fluency, forms mode switching, and auditory ergonomics.

## Governing text-channel requirement

See [mandatory visual–auditory parity rule](11-visual-auditory-parity-governing-rules.md). **All textual graph data is the responsibility of semantic HTML and NVDA/screen-reader announcements, including complete node and edge labels.** Do not convert label spelling into pitches or invoke a competing narrator. For nodes with matching visual shape/style, the non-speech intrinsic node cue must match; shape/style distinctions require separately mapped and consistently distinguishable cues. These requirements are not yet fully implemented.

## Keyboard Architecture & Focus Model

- **Focused Workspace Scope**: Keyboard shortcuts are scoped strictly to the exploration panel (`tabindex="0"`, `role="region"`, `aria-label="Graph exploration workspace..."`).
- **No Global Shortcut Capture**: Unconditional `<svelte:window onkeydown>` handlers were removed. When focus is outside the exploration region (e.g. navigation headers, form inputs, or background containers), graph traversal keys are not intercepted.
- **Form & Input Isolation**: Typing inside `<input>`, `<textarea>`, `<select>`, and `[contenteditable]` elements natively preserves all keystrokes. Characters such as `j`, `k`, `Space`, `Enter`, and Arrow keys do not trigger graph actions while focused on form elements.
- **Modal Focus Management**:
  - `KeyboardHelpModal` and `ImportModal` trap Tab/Shift+Tab focus within the dialog boundaries.
  - Dialogs suspend all graph navigation shortcuts while open.
  - Pressing `Escape` closes the modal immediately.
  - Focus is deterministically restored to the triggering button upon dismissal.
- **Predictable Tab Navigation**: Normal Tab and Shift+Tab key flows proceed sequentially through interactive controls without keyboard traps.

## Speech, Live Regions & Accessible Alerts

- **No Nested Interactive Options**: Connections are rendered using semantic `<ul>` and `<li><button class="neighbor-select-btn">` controls with `aria-current="true"` on the selected neighbor.
- **WCAG 2.5.3 (Label in Name)**: Every accessible name (`aria-label`) begins with or contains the visible text on the button to support voice control and screen-reader fidelity.
- **Polite vs. Assertive Announcements**:
  - Traversal, neighbor selection, and state updates are sent to polite live regions (`aria-live="polite"`).
  - Navigation errors, boundary notices, and task transitions use assertive live regions (`aria-live="assertive"`).
- **Session Recovery Banner**:
  - When an interrupted session is detected on load, an accessible recovery banner (`role="region"`, `aria-label="Incomplete Session Detected"`) notifies the user and provides keyboard buttons to "Resume Interrupted Session" or "Discard Session".
- **Storage Persistence Alert**:
  - If IndexedDB storage fails or falls back to ephemeral memory, an assertive alert (`role="alert"`, `class="storage-warning-banner"`) warns the participant/researcher: "Session data is being saved in temporary memory only and may be lost if this browser window is refreshed or closed."
- **Settings Locked Notice**:
  - During active or interrupted trials, navigating to Settings displays an alert (`role="alert"`, `class="trial-locked-banner"`): "Settings are locked during an active experimental trial to preserve experimental control." Controls are disabled to prevent mid-trial configuration tampering.
- **Forms Mode**: When entering response entry forms or workload sliders, NVDA remains in forms mode without shortcut interference.

## Color Contrast & Visual Accessibility

- Automated axe audits run with the `color-contrast` rule strictly enabled (no blanket exemptions).
- High contrast color palette:
  - Background: `#0a0e17`
  - Surface cards: `#131b2e`
  - Text primary: `#f1f5f9` (contrast ratio > 12:1 against dark background)
  - Text muted: `#94a3b8` (contrast ratio > 5.5:1 against card surface)
  - Primary accents: `#38bdf8` (contrast ratio > 7:1)
  - Danger: `#f87171` (contrast ratio > 6:1)

---

## Comprehensive Manual NVDA Testing Checklist

**Environment:** Windows 11, Microsoft Edge (latest stable version), NVDA (2024.x or later).

### Test Setup
- [ ] Connect stereo headphones or calibrated stereo speakers.
- [ ] Start NVDA with default speech synthesizer.
- [ ] Launch Microsoft Edge and navigate to `http://localhost:5173`.

### 1. Initial Page Load & Heading Hierarchy
- [ ] Press `H` in NVDA browse mode to navigate headings.
- [ ] Verify `H1`: "Auditory Graph Explorer" is announced clearly.
- [ ] Verify `H2` subheadings are structurally ordered without skipping levels.
- [ ] Verify NVDA announces current mode: "Current Mode: Interactive Speech Baseline" (or active condition).

### 2. Main Navigation & Tab Switching
- [ ] Press `Tab` through the main navigation bar.
- [ ] Verify buttons: "Graph Explorer", "Research Experiment", "Results & Export", "Settings", "Import", and "Help (?)".
- [ ] Verify `aria-current="page"` is announced only for the active tab.
- [ ] Switch to Settings tab; verify heading "Audio & Sonification Settings" is announced.
- [ ] Switch back to Graph Explorer tab; verify focus is predictable.

### 3. Graph Explorer Focus & Keyboard Traversal
- [ ] Verify that matching-shape nodes A and B have the same intrinsic non-speech node cue, while NVDA correctly announces different labels; **expected to fail against the legacy ID-based pitch mapping until fixed**.
- [ ] Verify that circle vs rectangle uses different shape-category cues when that style data and visual diagram are implemented; document as a pending test until then.
- [ ] Inspect labeled edges: NVDA must announce the actual edge label, source and destination; a numeric or symbolic edge label must never be replaced by an arbitrary melodic code.
- [ ] Verify that graph descriptions and all other displayed graph text are accessible by focus/inspection without a second Web Speech API voice.
- [ ] Press `Tab` into the graph exploration region.
- [ ] Verify NVDA announces: "Graph Exploration Workspace... region".
- [ ] Press `Down Arrow` or `J`. Verify announcement of selected neighbor and directional relationship.
- [ ] Press `Enter` or `Right Arrow`. Verify announcement of node traversal and updated in/out degrees.
- [ ] Press `Left Arrow` or `Backspace`. Verify announcement: "Returned back to Node X".
- [ ] Press `D` to toggle between Outgoing and Incoming directions. Verify announcement: "Direction switched to incoming/outgoing".
- [ ] Press `I` to inspect current node. Verify detailed breakdown is announced via assertive live region.
- [ ] Press `R` to replay audio. Verify audio triggers and announcement: "Replaying audio for Node X".

### 4. Form Field Isolation & Modal Dialogs
- [ ] Press `Tab` to the "Import" button and press `Enter`.
- [ ] Verify NVDA announces: "Import Directed Graph dialog".
- [ ] Verify initial focus lands on the first focusable element inside the modal.
- [ ] Press `Tab` repeatedly. Verify focus cycles within the modal and does NOT escape to background elements.
- [ ] Move focus into the "Paste DOT or JSON text" textarea.
- [ ] Type `digraph { A -> B; }`.
- [ ] Verify typing keys `j`, `k`, `Space`, `Enter` types text into the textarea and does NOT trigger graph traversal in the background.
- [ ] Press `Escape`. Verify modal closes and focus is restored directly to the "Import" button.
- [ ] Open the "Help (?)" modal via button or `?`. Verify dialog opens, Tab is trapped, and `Escape` closes it, returning focus to the Help button.

### 5. Research Experiment Workflow & Interruption Handling
- [ ] Navigate to the "Research Experiment" tab.
- [ ] Review Participant Consent. Press `Enter` on "I Understand & Acknowledge Consent".
- [ ] Audio Calibration: Press "Test Left Tone" and "Test Right Tone". Verify stereo separation.
- [ ] Click "Confirm Audio & Proceed to Training".
- [ ] Training: Read instructions and practice navigating. Click "I Am Ready to Begin Experimental Trials".
- [ ] Trial Prep: Read Task 1 prompt. Verify no answer leaks are present in the prompt or title.
- [ ] Click "Start Graph Exploration".
- [ ] In Active Trial:
  - [ ] Verify full adjacency table is NOT present in the DOM.
  - [ ] Verify cycle status and count badges are NOT displayed.
  - [ ] Verify graph title is anonymized (e.g. "Study Graph").
  - [ ] Navigate nodes using arrow keys.
- [ ] **Tab Switching & Interruption Test**:
  - [ ] While in active trial exploration, press `Tab` up to "Settings" and activate it.
  - [ ] In Settings, verify the alert: "Settings are locked during an active experimental trial" is announced and controls are disabled.
  - [ ] Switch back to "Research Experiment".
  - [ ] Verify NVDA announces "Trial Interrupted" region.
  - [ ] Verify options: "Restart Trial (Recommended)", "Resume Trial", and "Abandon Trial".
  - [ ] Press "Resume Trial". Verify focus returns to the exploration workspace and exploration resumes.
- [ ] Click "Finish Exploration & Enter Response".
  - [ ] Verify exploration region is replaced by response form.
  - [ ] Verify graph cannot be traversed or re-inspected during response entry.
  - [ ] For single choice: select option using arrow keys.
  - [ ] For boolean: select Yes/No.
  - [ ] For reconstruction: add edge pairs.
  - [ ] Submit answer.
- [ ] After Block 0 completes:
  - [ ] Verify Condition Workload Assessment (Modified Raw NASA-TLX) appears.
  - [ ] Verify 6 sliders (Mental, Physical, Temporal, Performance, Effort, Frustration) start at neutral 5.
  - [ ] Adjust sliders and submit.
  - [ ] Verify transition to "Rest Period".

### 6. Results, Export & Session Recovery Verification
- [ ] Navigate to "Results & Export" tab.
- [ ] Verify trial summary table announces completed trials, durations, accuracy, and status tags.
- [ ] Verify interrupted or abandoned trials (if any) are reported under separate interrupted trial statistics and excluded from primary accuracy %.
- [ ] Click "Export JSON" and "Export CSV". Verify downloads complete without error and CSV contains actual audio settings snapshot columns (`waveform`, `playbackSpeed`, `masterVolume`).
- [ ] **Mid-Trial Session Recovery Test**:
  - [ ] Start a new trial in the experiment view.
  - [ ] Refresh the browser (`F5`).
  - [ ] On reload, verify NVDA announces the "Incomplete Session Detected" recovery banner.
  - [ ] Activate "Resume Interrupted Session".
  - [ ] Verify trial is placed into `trial_interrupted` (not silently resumed with a broken timer), allowing deliberate restart or resume.
- [ ] Click "Clear Data". Verify confirmation prompt and clean reset.
