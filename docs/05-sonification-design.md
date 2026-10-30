# Sonification system design (version 0.1 proposal)

## Normative governing rule

**This document is subordinate to [visual–auditory semantic parity and screen-reader ownership of text](11-visual-auditory-parity-governing-rules.md).** For a given diagram, equal intrinsic non-text appearance requires equal intrinsic non-speech node cues; visually distinct shape/style categories require corresponding distinct auditory cues. Node and edge labels, graph titles/descriptions, annotations and other text are announced by the screen reader through semantic accessibility APIs, **not encoded into musical frequencies**. Differences in connectivity may change the edge enumeration without changing the intrinsic node sound. The legacy current implementation violates this because node IDs determine pitch; correct in a separately versioned mapping, without silently changing study conditions.

## Goal

Turn *graph semantics* into interpretable, repeatable auditory events while allowing users to discover connectivity through action. A special sound saying “this is a cycle” during a cycle-identification trial would invalidate the test.

## Perceptual mapping research

See [visual variables, auditory grouping, candidate shape cues, and test criteria](12-perceptual-mapping-and-auditory-gestalt.md). This research guide is subordinate to the normative parity rule. The existing ID-derived pitch mapping remains a **known nonconformance** rather than an accepted implementation of the new shape-to-sound vocabulary. Do not assume sine/triangle/square waveforms have naturally fixed shape meanings; validate the mapping before enabling it as a versioned study condition.

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

## Scheduling, Safety & Reliable Cancellation

- Construct or resume AudioContext only after an explicit user gesture.
- Schedule via AudioContext time; avoid depending on JavaScript timers for precise tone onset.
- **Immediate Cancellation**: Active audio handles stop immediately on user command (Escape, Stop Audio button, tab switch, graph load, or trial finish).
- **Promise Settling**: Cancelled scheduling promises resolve immediately via `settlePromise()`, preventing hanging asynchronous chains.
- **Node Disconnection**: Future scheduled oscillator and gain nodes are disconnected from the audio graph upon cancellation so stale notes cannot sound if the context advances.
- **Click-Free Gain Ramping**: All cancellations and note terminations apply an exponential gain ramp down to zero (e.g. over 0.01s - 0.03s) to eliminate harsh acoustic clicks or DC transients.
- Never autoplay speech or earcons on loading a new page; warn before audio.
- Provide headphones check, comfortable volume, left/right swap test and mono-accessible alternatives.

## Experimental Parity Verification

In automated test suite (`tests/unit/audio.test.ts`), complete audio-event traces are captured for Condition B and Condition C across all semantic event types (`NODE_FOCUS`, `TRAVERSE_OUTGOING`, `TRAVERSE_INCOMING`, `NEIGHBOR_LIST`, `EDGE_RETURN`, `AUDIO_FEEDBACK`). The suite verifies:
1. Identical tone counts per event.
2. Identical frequencies (Hz), duration (seconds), and relative time offsets.
3. Identical oscillator waveforms and gain envelope settings.
4. Variations exist exclusively in the stereo azimuth fields (`pan` and `endPan`), which are 0.0 in Condition B and spread across [-0.75, +0.75] in Condition C.

### Inherent Psychoacoustic Differences
Even with identical frequencies, gains, and timings in software:
- **Binaural Masking Level Difference (BMLD)**: Panned auditory signals in Condition C may be subjectively perceived as slightly louder or more distinct against ambient room noise than identical signals presented diotically (centered in both ears) in Condition B.
- **Auditory Fatigue & Spatial Segregation**: Spatial separation enables perceptual stream segregation (the "cocktail party effect"), which is the intended experimental hypothesis under evaluation, but must not be augmented by accidental pitch or amplitude cues.

## Speech coordination

**Graph text belongs to the screen reader.** Provide semantic accessible labels for nodes, directed edges, edge labels, titles, descriptions, exact counts and annotations. NVDA must announce text through focus, inspection and appropriate live regions. Do not turn words or identifiers into distinctive non-speech oscillator notes. Do not use Web Speech API as a second narrator of graph text. Keep announcements concise, on demand, and aligned with information-exposure policy; avoid automatically reading the entire graph.

## Audio mapping provenance

Version every mapping (ID, oscillator waveforms, pitch units, durations, pan function, ordering, normalization, gain). Save mapping ID with each trial. Any post-pilot change starts a new experiment configuration and needs new training. Retain reproducible generated audio-event traces for automated tests.

See [research questions](03-research-questions.md), [accessibility](07-accessibility.md), and Web Audio [R8].
