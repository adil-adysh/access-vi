# Technical architecture — implemented design and boundaries

## Stack

- Svelte 5 (with modern runes `$state`, `$derived`, `$effect`), TypeScript 5, Vite 6.
- Pure domain DirectedGraph data structure, JSON import and robust Graphviz DOT importer (with quoted identifiers, whitespace support, and attribute preservation).
- Web Audio API synthesizer (`ToneSynthesizer`) using oscillator/gain nodes and `StereoPannerNode` with exponential click-free ramps and active node tracking for instantaneous cancellation.
- Semantic HTML, dedicated keyboard interaction region (`tabindex="0"`, `role="region"`), screen-reader live region coordination (`aria-live="polite"` and `"assertive"`).
- IndexedDB via `IndexedDBStorage` for durable session persistence, JSON and CSV export (`ExportService`), clear session controls.
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
- **ExperimentRunner**: Controls session lifecycle (`consent` -> `calibration` -> `training` -> `trial_prep` -> `trial_active` -> `trial_response` -> `workload` -> `rest` -> `completed`). Rejects invalid phase transitions and duplicate submissions.
- **TaskEvaluator**: Deterministic task battery evaluation (branching, convergence, reachability with negative cases, cycle detection, mental model reconstruction).

## Graph Algorithms and Validation

1. **Cycle Enumeration (Johnson's Algorithm)**:
   - Identifies all simple directed elementary cycles without combinatorial duplicates.
   - Distinct from simple back-edge checks; accurately computes true cycle counts.
2. **Cycle Existence (3-Color DFS)**:
   - Efficient O(V + E) white/gray/black DFS for instantaneous cycle existence queries.
3. **Graph Generator Constraints**:
   - Strictly validates requested node counts, edge counts, and branching/convergence factors. Rejects impossible topologies rather than silently emitting invalid graphs.
4. **DOT Parser**:
   - Supports quoted identifiers, alphanumeric labels, whitespace, direction tokens (`->`), and attribute blocks.

## Audio Playback and Parity Verification

- **Condition A**: Interactive speech/text baseline without non-speech sonification.
- **Condition B**: Non-spatial sonification with semantic pitch mapping, duration envelopes, and direction indications.
- **Condition C**: Identical sonification to Condition B with controlled stereo azimuth spatial panning (`pan` and `endPan`).
- Automated tests verify exact event-sequence parity between Conditions B and C (durations, frequencies, waveforms, attack/decay envelopes, and event offsets).

## Data Integrity and Storage

- **Monotonic Duration Measurement**: Separate `explorationDurationMs` (graph traversal) and `responseDurationMs` (form entry) measured via `performance.now()`.
- **Trial Status Tracking**: Explicit trial logging with `completed`, `interrupted`, `aborted`, or `timeout`.
- **Workload Instrument**: Modified Raw NASA-TLX with neutral starting values (midpoint 5) across 6 subscales without preset participant answers.
- **Persistence**: Durable IndexedDB persistence on every state transition with surfaced persistence warnings.
