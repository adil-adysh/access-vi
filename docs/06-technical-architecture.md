# Technical architecture — initial plan

## Stack (proposed, not a claim of current implementation)

- Svelte 5, TypeScript, Vite.
- Graphology directed graph, JSON import and a tested DOT importer.
- Web Audio API oscillator/gain/envelope nodes and StereoPannerNode; no AudioWorklet until DSP needs require it.
- Semantic HTML, dedicated keyboard interaction, screen-reader coordination, optional Web Speech API.
- IndexedDB for local sessions, JSON/CSV export, no initial remote service.
- Vitest for domain/audio tests; Playwright and axe-core for browser/accessibility checks.

Reference the Web Audio API [R8], WAI keyboard practices [R7] and WCAG 2.2 [R9].

## Boundaries

**Import -> ValidatedGraph -> GraphAnalysis -> ExplorationController -> SemanticAudioEvent[] -> RenderingStrategy -> WebAudioEngine**

Parallel, independent branch: **ExperimentRunner -> TaskOracle/Scoring -> EventRecorder -> LocalStore -> Export**.

UI listens to exploration/experiment state and emits user intent; UI components do not calculate graph topology or directly synthesize audio.

### Domain models (conceptual)

- Node { id, label?, category?, attributes? }
- Edge { id, sourceId, targetId, label?, category? } with explicit *direction*.
- GraphSnapshot { schemaVersion, graphId, seed?, nodes[], edges[] }.
- ExplorationState { focusedNodeId, selectedNeighbor, history[], condition, playbackStatus }.
- SemanticAudioEvent { eventType, nodeId?, edgeId?, direction?, relativeOrder?, timeOffsetMs }.
- ConditionConfig { id: A|B|C, mappingVersion, speechPolicy, panPolicy }.
- TrialRecord { schemaVersion, participantCode, graphId, graphHash, taskId, condition, timestamps, response, oracle, eventLog, configVersions }.

These are interfaces to refine through implementation, not deployed schemas.

## Graph domain

Use explicit directed edges and validate duplicate IDs, nonexistent endpoints, malformed DOT, empty graphs and unsupported attributes. Directed reachability, cycle tests and edge reconstruction scoring live in pure domain code. Generate graph fixtures from seeds, then persist exact snapshots and hashes.

Oracle correctness must not depend on the audio strategy or the UI's current cursor.

## Exploration controller

A testable state machine handles neighbor selection, traversing edges, returning, resetting, replaying, cancelling and requesting precise text. Navigation should work when audio rendering is disabled.

## Audio renderer

Convert semantic events into versioned schedules. B and C share tone sequences; C adds only controlled pan. Use injected clock and audio-device interfaces for tests; browser Web Audio implementation is a thin adapter.

## Experiment runner

Distinct states: calibration -> training -> practice -> recorded trial -> questionnaire -> completion. Persist at transition boundaries so interruption cannot silently erase records. Record wall-clock time for audit and monotonic elapsed offsets for durations.

Exports must be compatible with offline analysis, must not include unnecessary personal data, and must expose enough metadata to reproduce scoring.

## Example structure (flexible)

- src/domain/graph, src/domain/tasks
- src/exploration
- src/audio/{events,mappings,renderer}
- src/research/{conditions,runner,scoring,recorder}
- src/accessibility/{keyboard,speech}
- src/storage
- src/components
- tests/{unit,integration,e2e,fixtures}

## Delivery trade-offs

No backend or AI model is needed to answer the first research question. Tauri/Rust, neural diagram extraction, dynamic-programming matrices and HRTF become separate experiments only after initial data justifies the additional complexity.
