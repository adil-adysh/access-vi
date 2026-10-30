# Sonification system design (version 0.1 proposal)

## Goal

Turn *graph semantics* into interpretable, repeatable auditory events while allowing users to discover connectivity through action. A special sound saying “this is a cycle” during a cycle-identification trial would invalidate the test.

## Two-stage model

**Graph semantic layer** emits events like FocusNode, NeighborEnumerationStart, NeighborItem, TraverseOutgoingEdge, TraverseIncomingEdge, ReturnToNode and EndSequence. It is independent of Web Audio.

**Audio renderer** maps those events to oscillator envelopes, timing, optional timbres, gain and stereo pan. The identical semantic event stream can be rendered in B (pan 0) or C (spatial pattern) for a meaningful comparison.

## Proposed mapping table

| Semantic event | B: non-spatial | C: stereo-spatial | Confound to watch |
|---|---|---|---|
| Focus node | brief reference tone centered | identical centered tone | loudness/timing |
| Outgoing edge | rising or forward-pattern sweep | same sweep + defined pan movement | do not change pitch |
| Incoming edge | distinguishable reverse pattern | same reverse pattern + defined pan movement | pattern must remain identical |
| Neighbor enumeration | ordered, repeatable tones | identical order, left/center/right positioning | spatial ordering cannot encode an answer shortcut |
| Confirm traversal | short confirmation sound | identical non-spatial confirmation | accidental extra hint |
| Exact inspection | speech or accessible text on demand | identical | screen-reader speech timing |

These are candidate sounds, **not validated psychoacoustic mappings**. Select actual pitch ranges, durations, timbres, and silence intervals during pilot testing and lock them for the controlled comparison.

## Spatial encoding decisions

Avoid mistaking a visual layout's arbitrary coordinates for semantic truth. Define whether pan is (1) local relative to the focused node and neighbor order, or (2) a stable global position derived from a deterministic, documented graph layout. Either has trade-offs. A spatial position should not encode cycle existence, centrality or task correctness directly.

For first experiments, propose **local neighbor panorama**: a consistent left-to-right ordering of selectable neighbor *slots*, with focus tone at center. This encodes order/separation, not graph distance. Log the ordering algorithm and audit whether it affords more information than intended. Keep a user-operable replay and a zero-pan control.

Important: stereo panning does not automatically provide front/back or distance; HRTF is a separate later experiment.

## Scheduling and safety

- Construct or resume AudioContext only after an explicit user gesture.
- Schedule via AudioContext time; avoid depending on JavaScript timers for precise tone onset.
- Smooth gain ramps to prevent clicks; constrain master gain and repeated-playback rate.
- All active voices and timers must cancel immediately on Stop, navigation invalidation and trial end.
- Never autoplay speech or earcons on loading a new page; warn before audio.
- Provide headphones check, comfortable volume, left/right swap test and mono-accessible alternatives.

## Speech coordination

Use semantic text for node/edge names; let NVDA read native controls when possible. A mode may enable Web Speech API, but avoid automatic duplicate announcements from both screen reader and browser TTS. Make text available independent of audio so participants can inspect what was conveyed.

## Audio mapping provenance

Version every mapping (ID, oscillator waveforms, pitch units, durations, pan function, ordering, normalization, gain). Save mapping ID with each trial. Any post-pilot change starts a new experiment configuration and needs new training. Retain reproducible generated audio-event traces for automated tests.

## Validation

Unit tests: same graph/navigation event -> same semantic event list; B/C identical non-pan parameters; deterministic order and pan; replay equality; cancellation; no answer-leaking structural classifications in trial event streams.

Manual tests: can participants distinguish event types, incoming vs outgoing, neighbor slots, and stereo laterality? Does NVDA speech mask the tones? Is navigation fatigue tolerable? Is the pan meaningful beyond decorative movement?

See [research questions](03-research-questions.md), [accessibility](07-accessibility.md), and Web Audio [R8].
