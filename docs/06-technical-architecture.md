# Technical architecture — implemented design and boundaries

## Stack

- Svelte 5 (with modern runes `$state`, `$derived`, `$effect`), TypeScript 5, Vite 6.
- Pure domain DirectedGraph data structure, JSON import and robust token-based recursive-descent Graphviz DOT importer (with lexer tokens, quoted identifiers with `->` and semicolons, escaped quotes, multiline attributes, and chained edge definitions).
- Web Audio API synthesizer (`ToneSynthesizer`) using oscillator/gain nodes and `StereoPannerNode` with exponential click-free ramps and active node tracking for instantaneous cancellation.
- Semantic HTML, dedicated keyboard interaction region (`tabindex="0"`, `role="region"`), screen-reader live region coordination (`aria-live="polite"` and `"assertive"`).
- IndexedDB via `IndexedDBStorage` with transaction completion waiting, serialized FIFO write queuing, explicit `StorageResult` contracts, and memory fallback detection.
- Session recovery engine with schema validation and safe restoration into `trial_interrupted`.
- Vitest for domain, graph algorithm, audio scheduling, and state machine integration tests; Playwright and axe-core for full browser accessibility and workflow verification with strict WCAG 2.2 AA contrast compliance.

Reference the Web Audio API [R8], WAI keyboard practices [R7] and WCAG 2.2 [R9].

## Boundaries and Controller Separation

In earlier iterations, the free exploration view and research runner shared controller state. In the hardened architecture, controllers are strictly isolated:

```
[Free Exploration View]               [Research Experiment View]
        │                                         │
        ▼                                         ▼
Free ExplorationController               ExperimentRunner
  • DEFAULT_FREE_POLICY                    • Isolated ExplorationController
  • Complete textual adjacency tables      • DEFAULT_EXPERIMENT_POLICY
  • Interactive node jumping               • Strict phase state machine
  • Free condition toggling                • Anonymized graph metadata
                                           • Monotonic timing (exploration vs response)
                                           • Interruption & pause tracking
                                           • Immutable AudioSettingsSnapshot
```

### Information Exposure Policy

To prevent experimental confounds and leakage between free exploration and recorded trials, an explicit `InformationExposurePolicy` governs UI rendering:

- `showAdjacencyTable`: Render complete node connection matrix (`false` during trials).
- `showGlobalMetrics`: Display cycle presence/count and density badges (`false` during trials).
- `allowNodeJumping`: Allow direct jump navigation to arbitrary nodes (`false` during trials).
- `anonymizeGraphName`: Anonymize graph titles (e.g. "Study Graph") to prevent semantic leakage of topology.

### Domain Models

- **DirectedGraph**: Directed multigraph representation with immutable node/edge lists, degree computations, Johnson's elementary cycle enumeration, 3-color DFS cycle existence detection, reachability checks, and deterministic FNV-1a structural hashing (`computeHash()`).
- **ExplorationController**: Testable state machine handling neighbor traversal, direction toggling, back-tracking, replaying, inspecting, and audio cancellation.
- **SequenceScheduler & ToneSynthesizer**: Web Audio sequence scheduling where cancelled handles settle promises immediately (`settlePromise()`), disconnect future scheduled notes, and smoothly ramp gain to avoid acoustic clicks.
- **ExperimentRunner**: Controls session lifecycle (`consent` -> `calibration` -> `training` -> `trial_prep` -> `trial_active` -> `trial_response` (or `trial_interrupted`) -> `workload` -> `rest` -> `completed`). Rejects invalid phase transitions and duplicate submissions.
- **TaskEvaluator**: Deterministic task battery evaluation (branching, convergence, reachability with negative cases, cycle detection, mental model reconstruction).

## Graph Algorithms and DOT Grammar

1. **Cycle Enumeration (Johnson's Algorithm)**:
   - Identifies all simple directed elementary cycles without combinatorial duplicates.
   - Distinct from simple back-edge checks; accurately computes true cycle counts.
2. **Cycle Existence (3-Color DFS)**:
   - Efficient O(V + E) white/gray/black DFS for instantaneous cycle existence queries.
3. **Graph Generator Constraints**:
   - Strictly validates requested node counts, edge counts, and branching/convergence factors. Rejects impossible topologies rather than silently emitting invalid graphs.
4. **Tokenizer-Based Recursive-Descent DOT Parser (`DotLexer` & `parseDot`)**:
   - Replaced fragile regex-based parsing with a full token-based scanner and recursive-descent parser.
   - Accurately parses:
     - Quoted string identifiers containing edge operators and semicolons (e.g. `"Node -> 1"`, `"Alpha;Beta"`).
     - Escaped quote sequences inside strings (`\"`).
     - Line comments (`//`, `#`) and block comments (`/* ... */`) outside strings, while correctly retaining comment symbols inside quotes.
     - Multiline attribute blocks with comma- or whitespace-separated key/value pairs.
     - Chained edge definitions: `A -> B -> C` (producing directed edges `(A, B)` and `(B, C)`).
   - Rejects with detailed line and column syntax errors: undirected `graph` blocks, undirected edge operators (`--`), unsupported nested subgraphs, and unclosed quotes or comments.

## Audio Subsystem & Parameter Recording

- **Condition A**: Interactive speech/text baseline without non-speech sonification.
- **Condition B**: Non-spatial sonification with semantic pitch mapping, duration envelopes, and direction indications.
- **Condition C**: Identical sonification to Condition B with controlled stereo azimuth spatial panning (`pan` and `endPan`).
- Automated tests verify exact event-sequence parity between Conditions B and C (durations, frequencies, waveforms, attack/decay envelopes, and event offsets).
- **Actual Audio Configuration Capture**:
  - Rather than hardcoding static default values, `ExperimentRunner` captures an immutable `AudioSettingsSnapshot` directly from `AudioCoordinator` upon starting each trial (`waveform`, `playbackSpeed`, `masterVolume`, `audioMappingVersion`).
  - These values are recorded in every `TrialLog` entry and included in all CSV/JSON exports.
  - In `SettingsView`, controls are locked (`isTrialActive = true`) during active and interrupted trials to guarantee parameter constancy throughout experimental tasks.

## Persistence, Write Queuing & Recovery Architecture

- **`StorageResult` Contract**:
  - `IndexedDBStorage.saveSession()` and `deleteSession()` return an explicit `StorageResult` interface:
    ```typescript
    export interface StorageResult {
      isPersistent: boolean;
      error?: Error;
    }
    ```
  - Eliminates silent catch-and-ignore behavior. Surfaces an accessible warning alert (`role="alert"`) in `ExperimentView` if the browser fails to grant persistent IndexedDB storage and falls back to ephemeral memory.
- **Transaction Completion & Serialized Write Queue**:
  - Writes explicitly wait for `tx.oncomplete` (not merely `req.onsuccess`) to guarantee durable commits before resolving.
  - Asynchronous writes are serialized via a FIFO `writeQueue` promise chain, preventing asynchronous race conditions where earlier snapshots could overwrite newer session states.
  - Read-your-own-writes consistency: `getSession()` awaits pending write queue operations before reading from IndexedDB or falling back to memory.
- **Session Recovery & Schema Validation**:
  - On application startup, `App.svelte` queries storage for any incomplete sessions.
  - Found sessions undergo strict structural validation via `validateSessionSchema()` (checking `version`, `participantId`, `phases`, and `trials`).
  - If a participant reloads or experiences a browser crash mid-trial (`trial_active`), the session is rehydrated into `trial_interrupted` (never blindly resuming an active timed trial).
  - An accessible recovery banner prompts the user with explicit keyboard actions to either resume the interrupted session or discard it.
