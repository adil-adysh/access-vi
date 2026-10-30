# Research history and current findings

## Origins and progression

**2026-04-20 — Broad nonvisual representation question (conversation-derived).** The initial exploration considered language, sound, touch/haptics, proprioception, spatial reasoning, and memory as alternative ways to encode information commonly presented visually. The proposed *functional* targets were compression, relations, change, invariance, manipulation, and salience. This was a design framework, not an empirical finding.

**2026-09 to 2026-10 — Narrowed prototype (conversation-derived).** The idea was narrowed to a tractable directed-graph experiment with keyboard exploration, sound, and objective structural-reasoning tasks. The working name is **Auditory Graph Explorer**. A dynamic-programming matrix explorer was discussed as a possible later transfer domain, **not part of the initial MVP**.

**2026-10-30 — Study specification (conversation-derived).** The working comparison is speech-only vs non-spatial sound vs spatial sound using small, unfamiliar directed graphs. Technologies proposed: Svelte 5, TypeScript, Web Audio API, Graphology, NVDA-friendly keyboard interactions, IndexedDB and JSON/CSV exports.

## What we can say today

| Claim | Status | Basis |
|---|---|---|
| Blind and low-vision participants report substantial barriers accessing node-link diagrams | Supported by prior research | TADA formative interviews, [R2] |
| Touch and audio interfaces can facilitate multiple ways of exploring diagrams | Supported in the conditions tested | TADA evaluation, [R2] |
| Speech, sonification and tactile systems differ in time/workload in chart tasks | Supported for the particular devices and chart tasks studied | Chundury et al. 2026, [R3] |
| Keyboard-first spatial sound is superior for directed-graph reasoning | **Unknown** | Our proposed hypothesis, not an observed result |
| HRTF or 3D sound is necessary | **Unknown; not assumed** | Stereo chosen as first test |
| Access-VI has completed participant trials | **Not established** | No study dataset provided |
| A production-quality application already exists | **Not verified** | Implementation work is separate from documentation |

Source IDs [R2] and [R3] are defined in [references](references.md).

## What must remain separate

1. **The problem**: people should be able to inspect relational structures independently and at multiple levels.
2. **The hypothesis**: nonverbal and spatial audio *might* change reasoning outcomes.
3. **The mechanism**: an interactive keyboard interface emitting repeatable structural audio events.
4. **The observation**: task accuracy, completion time, workload, reconstruction and transfer measured in a study.

An app that produces impressive sounds does not establish an improvement in cognition. Accessibility conformance does not itself establish scientific efficacy.

## Earlier broader design goals retained for later work

- Meaningful structure instead of literal visual appearance.
- Overview plus local details; progressive disclosure rather than a compulsory linear narration.
- Direct manipulation and reversible exploration.
- Redundancy across auditory channels; precise spoken inspection remains available.
- Long-term opportunity: matrices, dependencies, flowcharts and other structures after the graph experiment.

## Research record policy

When trials eventually occur, add a dated record specifying recruitment, protocol version, stimulus IDs, code commit, participant consent, exclusions, anonymized outcomes and analysis scripts. Never retrofit this document into a claim that the study was previously performed.
