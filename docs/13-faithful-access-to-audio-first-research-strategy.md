# Governing research strategy: faithful access first, audio-first optimization second

**Project:** Access-VI / Auditory Graph Explorer  
**Decision date:** 2026-10-30  
**Decision status:** **Accepted research direction (project-owner intent)**.  
**Implementation status:** Strategy and stage gates are documented here; compliance and outcome measurements have **not** been demonstrated.  
**Related mandatory rule:** [Visual–auditory semantic parity and screen-reader ownership of text](11-visual-auditory-parity-governing-rules.md).  
**Evidence distinction:** This is a research/product strategy and operational definition, not empirical proof of equal access.

## 1. Mission

> **First establish a faithful, complete, independently explorable nonvisual representation of the information communicated by an original visual graph. Validate that access. Only then investigate audio-first representations that improve comprehension, navigation, memory, or effort, adopting optimizations only when evidence supports them and without removing access to the original information.**

**Equal access is a capability goal, not a claim of sensory equivalence or identical performance.** It means users can independently access, inspect, verify, and reason about all meaningful original information. We do not require a literal audio rendering of every pixel; we do require an explicit account of which original distinctions matter, including diagram-specific geometry when it actually communicates information.

**Faithful mapping is the reference representation; audio-first optimization is a later, empirical research direction.** An optimized mode may add an explicitly designated navigation aid, but it must not present aid-generated or inferred information as an original graph attribute, silently discard source distinctions, or disable the ability to inspect the faithful representation.

## 2. Strict separation of information, presentation, and assistance

Use three distinct layers:

1. **Source/information layer (ground truth):** Graph nodes, directed edges, edge/node attributes, text, semantic groupings, and where relevant *source diagram* layout or styling that conveys meaning. Record provenance.
2. **Faithful reference layer:** Accessible screen-reader text for all text; documented non-speech mapping for meaningful non-text visual distinctions. Same visual node appearance → same intrinsic category cue. Shape, edge, relationship, and navigation sounds have separate meanings. An explicit legend and full-detail inspection support independent verification.
3. **Optimized interaction layer (later):** Optional auditory landmarks, summaries, grouping, tempo, overview, playback controls, spatial navigation, alternative representations. Every addition is **identified as an interaction/derived cue**, not misrepresented as source data. The faithful reference remains available.

When a rendered position, node size, edge curve, or color is decorative, do not fabricate underlying semantic importance or connectivity. When the source explicitly uses geometry or styling to convey information, make that information accessible and document the correspondence. If an imported diagram contains an unrecognized meaningful visual convention, disclose the limitation and preserve accessible source/legend details; do not silently claim full fidelity.

Do not conflate the **faithful reference** with the **legacy speech-only condition** or **legacy node-ID pitch condition**. These can be comparison controls but are not automatically comprehensive faithful representations.

## 3. Stage 1 — Establish faithful, complete access

**Goal:** Construct an independent, inspectable nonvisual representation of the original information before usability-oriented optimizations.

### Required capabilities

- Inventory all source information: nodes, IDs/labels, edges, source and destination, direction, multiplicity, self-loops, meaningful edge styles, node shapes, style/group membership, exact values, annotations, legends, and any *meaningful* layout relationships.
- Keep structured graph topology separate from drawing/layout and separate from inferred analyses.
- Expose all text by semantic HTML/accessibility APIs to the screen reader (NVDA target), with exact node and **edge** labels available on demand. No label-to-pitch encoding and no competing auto-narrator.
- Encode meaningful non-text visual categories consistently in sound. Identical intrinsic shape/style must yield identical intrinsic node sound regardless of ID/label; different encoded shapes/styles must be distinguishable. Keep source/target relation cues independent from shape cues.
- Provide complete keyboard navigation; allow traversal forward and backward, incoming/outgoing inspection, edge/property enumeration, revisiting, replay, cancellation, full-detail and legend access, and independent exploration of the whole graph.
- Distinguish source facts from navigation status and optional computed answers. Do not invent rank, geometry, or semantic relationships from incidental audio pitch/timing.
- Provide an explicit **information coverage matrix** for each supported graph/diagram format: source feature → faithful textual access → faithful non-speech distinction (if applicable) → interaction path → tests → known unsupported cases.
- If the original visual graph includes arbitrary styling without semantic meaning, preserve declared appearance categories as required by the governing parity rule; distinguish *appearance equivalence* from *data significance*.
- Ensure no feature is only available to sighted users, and that non-speech audio is not the sole path to exact data. Provide an understandable alternative/legend.

### Stage-1 acceptance gate

**Engineering proof (not user-outcome proof):**
- For every *supported source feature* in an audited fixture set, it is accessible and inspectable; coverage matrix has no silent omissions.
- Automated mapping invariants: equal shape/style → equal intrinsic cue; different declared categories → different assigned cues; changing label cannot change non-speech sound; changing node shape cannot silently change edge semantics.
- Graph topology and text are lossless through import/model/accessibility inspection for supported formats, including edge labels, parallel edges and self-loops where supported. Explicitly mark unsupported features; do not claim coverage.
- Repeatable manual NVDA/keyboard audits of the complete task journey are documented (including errors and limitations).
- An honest unsupported-format policy exists; accessibility is verified for supported scope, not asserted for every imaginable diagram.

**Not yet required:** audio efficiency, lower workload, superiority to text, identical experiences, or any particular perceptual outcome.

## 4. Stage 2 — Independently validate faithful access

**Goal:** Determine whether target users can discover and correctly interpret the same original information, including global relationships, without someone else explaining the diagram.

### Validation levels

**Level A: Source coverage audit.** Independently enumerate source facts, meaningful visual distinctions, and expected interaction paths. Tests confirm no omission/substitution/invention.

**Level B: Perceptual interpretation.** Blind screen-reader users hear isolated and combined category/edge/navigation cues. Assess same/different recognition, category confusions, mistaken rank/importance/distance, exact label access, and unwanted interactions with NVDA.

**Level C: Independent exploration.** Users find every node and edge (including direction and labels), choose paths, return to previously visited nodes, inspect groups and styles, and identify what remains unexplored. Measure missed features, help needed, errors, time, replays, and reported effort.

**Level D: Mental-model fidelity.** After exploration, ask users to reconstruct edges and identify branching, convergence, reachability, and cycles on novel graphs. For meaningful-layout tasks, measure geometry/region reconstruction separately from topology. Delayed recall and transfer are secondary.

### Interpret the evidence correctly

- **Complete information exposure is not the same as understanding**, and neither implies equal task speed with a sighted viewer.
- Evaluate fidelity to ground truth and task-specific comprehension separately; a person may use the interface correctly and still need more time.
- Begin with small formative pilots, record misunderstandings, iterate with versioned mapping changes. Claims of comparative efficacy require a separately planned controlled study.
- Avoid leaking study answers through automatically generated graph-analysis summaries. In free exploration, offer complete information and explicit computed-analysis features where appropriate, but record and equalize exposure when conducting inference experiments.
- Set task-specific measurement thresholds and stopping criteria *before confirmatory testing*, rather than claiming universal parity based on perfect unit tests or one user report.

### Stage-2 acceptance gate

Publish a reproducible **fidelity report** for a defined set of supported diagrams: coverage audit, NVDA usability findings, category/edge interpretation outcomes, directed-edge reconstruction, missed/incorrect inferences, known limitations, training and participant context. Stage 3 begins only after any source-information omissions or systematic misleading cues are resolved, or those limitations are explicitly scoped and declared.

A result of “some users cannot reconstruct this graph accurately” is a valid finding and triggers redesign, not evidence of completion.

## 5. Stage 3 — Optimize for hearing and interaction, while preserving Stage 1

**Goal:** Test whether auditory-first techniques make the already accessible information *easier to consume*.

Potential interventions:
- Auditory streaming/grouping, temporal phrasing and chunking.
- Stable optional landmarks, location cues, global overviews, and path traces.
- Adaptive pacing, replay granularity, interactive filtering, and on-demand summaries.
- Alternative sonification vocabulary or multimodal techniques.

### Optimization contract

1. **Never remove source access:** Full faithful detail and exact screen-reader text stay reachable, even if an optimized summary omits details in its first-pass presentation.
2. **Never present an aid as source truth:** Mark derived statistics, suggested groups, inferred hierarchy, wayfinding sounds, or audio-only bookmarks as **computed/interaction aids**.
3. **Source provenance and mappings remain inspectable:** Users can tell what belongs to the original diagram and what was added for consumption.
4. **No untested effectiveness claim:** Compare versions using prespecified unfamiliar graphs and outcomes. Track correct reconstruction/reasoning, time, replay, workload, retention, transfer, and misleading inferences.
5. **Use fair comparisons:** Same underlying graph, text and exact inspection availability, matched training opportunities, counterbalanced condition/task order where feasible, and versioned settings.
6. **An optimization may help one task and harm another:** Report accuracy–speed and workload trade-offs; do not claim universal superiority.

### Stage-3 decision gate

Promote a candidate audio-first feature only when it preserves audited information fidelity and produces a measured, practically useful outcome (or a clear user-preference/accessibility benefit) for a specified task/population, with acknowledged trade-offs. When evidence is inconclusive, keep the feature experimental and the faithful representation available.

## 6. Program research questions (separate from legacy A/B/C)

**PRQ1 — Information access / reference fidelity:** Can a blind user independently discover and verify every *supported* meaningful piece of information communicated by the source graph/diagram?

**PRQ2 — Perceptual/semantic correctness:** Do users interpret shape/category, edge, direction and any explicit layout cues as intended without fabricating rank, importance, or structure?

**PRQ3 — Mental model and independent reasoning:** Can users accurately construct, retain, reconstruct, and reason about the original topology (and layout when relevant)?

**PRQ4 — Auditory-first optimization:** Given a verified faithful reference, which alternative auditory techniques improve graph understanding, navigation, retention, and/or effort without removing complete source access?

These program questions are not the same as the existing [A/B/C experimental hypotheses](03-research-questions.md). Do **not** rename A/B/C conditions or reinterpret previous data.

## 7. Concrete evaluation matrix

| Feature | Faithful reference test | User task | Possible failure |
|---|---|---|---|
| Same-shape nodes A/B | Identical intrinsic sound; different spoken labels | Distinguish visual category from node identity | Same category mistaken for same individual |
| Circle vs rectangle | Different stable category sound and accessible legend | Identify shape difference | Unintended rank/timbre bias |
| A → B vs B → A | Direction cue and precise spoken endpoints | State source/target | Direction inverted or confused with stereo location |
| Different edge endpoint geometry | Same topology cue for the same semantic relation | Recognize relation preserved | Decorative angle treated as rank/direction change |
| Edge named “depends on” | NVDA announces label verbatim | Inspect relationship name | Label omitted or transformed into pitch |
| Branch and convergence | Full incoming/outgoing connectivity available | Reconstruct A→B, A→C, B→D, C→D | Separate paths mistaken as separate destinations |
| Meaningful grouping/styling | Group/legend exposed in audio and text | Identify members and group meaning | Group confused with connectivity |
| Explicit source layout | Stable, documented geometry mapping and accessible position text | Reconstruct relative positions | Arbitrary geometry mistaken for intrinsic topology |
| Optional audio-only landmark (Stage 3) | Source-vs-aid distinction explicit; full baseline retained | Find visited node faster | Landmark implies original hierarchy |

## 8. Implementation sequence and deliverables

**Now — scope and audit (no feature claims):**
- Inventory the current app's supported graph import/rendering properties, audio events, accessibility paths and experimental exposure rules.
- Produce source-feature coverage fixtures and identify gaps (especially shape metadata, edge labels, arbitrary ID pitch, meaningful layout, parallel edges).
- Maintain a compatibility table mapping older research mode names/configurations to new research-program stages.

**Milestone F1 — Faithful mapping:** Introduce a shared presentation model/legend and versioned intrinsic shape sounds, independent edge cues and NVDA graph-text access. Implement within a **separate free-exploration or laboratory mode**; legacy studies remain unchanged. Add equivalence/unit tests.

**Milestone F2 — Complete exploration:** Audit source property discovery and full keyboard reachability, then add missing inspection/overview mechanisms needed to retrieve *original* information, without auto-generating study answers. Add scripted accessibility and manual NVDA evidence.

**Milestone V — Fidelity evaluation:** Conduct formative tests with users; publish source coverage and misunderstanding/reconstruction findings. Record prototype versions and unresolved limitations.

**Milestone O — Audio-first experiments:** Only after fidelity is established for the supported scope, test one specific auditory optimization at a time against the faithful baseline, retain full access, and record comparative results. Start with local grouping or stable wayfinding rather than an elaborate audio vocabulary.

### Preserve research architecture

The existing speech-only/nonspatial/stereo study (legacy A/B/C) remains a separate, frozen/versioned line of investigation, not “Stage 1/2/3.” Its sound mapping is not retroactively corrected. Any new mode/study receives new identifiers, training materials, exposure policy, metrics, and export metadata. Never mix old and new trial results as if their representations were identical.

## 9. Non-goals and cautions

- No claim that blind and sighted users must have identical sensory experiences or task speed.
- No claim that visual geometry always encodes important meaning.
- No generality claim beyond *explicitly supported* diagram types, properties, and import fidelity.
- No automatic assumption that different waveforms correspond intuitively to circle/rectangle/diamond.
- No evidence-based optimization claim from a single first-person observation.
- No removal of semantic accessibility in the name of “audio-first.”
- No presentation of computed answers as source properties in scored reasoning tasks.

## 10. Research governance and priority order

**Order of authority:**
1. Original-information fidelity, independent access, and text through the screen reader.
2. Normative visual–auditory parity for the *faithful reference* ([11](11-visual-auditory-parity-governing-rules.md)).
3. Empirical validation of perceptual and structural understanding.
4. Optional, explicit and separately versioned audio-first interaction optimizations, evaluated without sacrificing (1).

This document governs the **overall research sequence and success definitions**. Document 11 governs the faithful mapping itself. Document 12 supplies candidate sound mappings and test questions, not validated solutions. The spatial proposal in document 10 is a possible later optimization, not a precondition of information access unless source layout meaning requires spatial information.

**Source of this decision:** Explicit project-owner clarification in research discussions on 2026-10-30: establish equal mapping and complete access to original information first; refine toward audio-first only when findings/optimizations support it. No formal participant outcomes are asserted.

See [problem and vision](01-problem-and-vision.md), [research questions](03-research-questions.md), [experimental protocol](04-experimental-protocol.md), [roadmap](08-implementation-roadmap.md), [parity rule](11-visual-auditory-parity-governing-rules.md), and [mapping hypotheses](12-perceptual-mapping-and-auditory-gestalt.md).
