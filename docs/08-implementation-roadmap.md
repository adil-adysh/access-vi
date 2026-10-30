# Implementation roadmap and verifiable acceptance criteria

**Implementation state:** this plan is not a claim that Bob or any agent has completed a phase. Update progress based on commits, automated results, and manual evidence.

## New program milestones — faithful access before audio-first optimization

The accepted [three-stage governing strategy](13-faithful-access-to-audio-first-research-strategy.md) sets the **research priority**; the numbered phases below describe the **legacy engineering roadmap** and do not correspond to those three stages. Do not mark any of these new milestones completed without a source-feature audit and test evidence.

| Milestone | Deliverable | Gate to continue |
|---|---|---|
| **F0 — Source-information inventory** | Explicit coverage matrix: source node/edge text, IDs, topology, shapes, meaningful styling, groups, position when meaningful, labels and annotations; named unsupported cases | No silent feature omission in the supported test corpus |
| **F1 — Faithful representation** | Shared visual metadata/legend and intrinsic category sounds; independent edge/direction cues; NVDA ownership of all graph text; a separately versioned lab/mode | Mapping invariants, import roundtrips, keyboard reachability and manual NVDA evidence |
| **F2 — Independent exploration** | Complete discoverability/inspection of all supported source features (including edge labels, disconnected regions, loops and parallel edges where supported) | Audit proves every supported fact reachable without sighted assistance |
| **V — Fidelity validation** | Formative cue tests and graph reconstruction studies, including false-rank inferences and workload | Report verified coverage and perception/understanding problems; remediate systematic failures |
| **O — Audio-first optimization** | One optional, source-preserving auditory improvement per versioned experiment | Show fidelity remains intact and quantify task-specific benefit/trade-offs before promotion |

**Known unfinished work:** Current ID-derived pitch mapping conflicts with same-shape parity; shape/style is not standardized in the graph model; complete edge-label announcements and supported-property coverage require audit. This document does not assert those issues have been corrected.

## Phase 1 — Foundation

Create Svelte/Vite/TS app, lint/test setup, directed graph schema, immutable fixtures, import validators, Graphology adapter and pure structural oracles. **Done when:** tests cover branching, convergence, reachability, cycles, invalid edges and seeded reproducibility.

## Phase 2 — Keyboard-only explorer

Implement navigation controller, stable focus, selectable incoming/outgoing neighbors, traversal, history, reset, exact inspection and help. **Done when:** exploration works using the keyboard without sound and without requiring a graph drawing.

## Phase 3 — Auditory engine

Create semantic audio event types, Web Audio synthesizer, envelopes, scheduler, volume limits, cancellation/replay and deterministic traces. **Done when:** unit/integration tests verify scheduling, no stale playback and stable sound event generation.

## Phase 4 — A/B/C conditions

Build three presentation adapters; B uses centered sonification, C uses same sounds with panning; A uses speech/text only. **Done when:** an automated comparison proves B and C event properties match apart from spatial fields, and graph access stays equal.

## Phase 5 — Research task bank

Implement tasks, oracle independent of UI, answer input, ambiguity checks, reconstruction and scoring. **Done when:** known graph fixtures produce verified answers, no task prompt or default sound exposes a solution.

## Phase 6 — Research-session manager

Add anonymous session codes, consent flow, calibrated training, randomized and counterbalanced blocks, timing, interrupted-trial marking, IndexedDB persistence, export/deletion. **Done when:** a complete artificial session can run offline and its scores recomputed from exported raw data.

## Phase 7 — Accessible UI and usability pilot

Accessible home/explorer/experiment/results/settings, extensive manual NVDA checks, tone discrimination and pilot readiness. **Done when:** a researcher and a screen-reader user can complete the entire workflow without visual help; manual findings are recorded and fixed or listed.

## Phase 8 — Research readiness

Freeze mapping/protocol version, stimulus balancing, ethics/consent process, analysis plan, study sample justification, QA artifacts. **Done when:** a separate research-readiness checklist is approved; **not** when build/test commands merely pass.

## Required commands/checks (adapt to actual project scripts)

- Typecheck and lint.
- Vitest graph/domain/audio/scoring suites.
- Playwright keyboard and workflow tests.
- axe-core automated a11y scan.
- Production build.
- Manual Edge/NVDA checklist.
- Export/import round trip and deterministic scoring audit.

## Not part of the first milestone

Screen-photo extraction, LLM narration, standalone native editor, automatic HRTF hardware support, cloud accounts, braille/haptic integrations, matrix explorer or a generalized diagram reasoning platform. Those should be separately scoped research tasks.

## Issue and commit practice

Each functional phase should have a small implementation checklist, known test evidence, and provenance. Any change to task wording, speaker policy, sound mapping or timing during a study requires a version bump and protocol review. Keep pilot observations, engineering verification and formal participant results in separate artifacts.
