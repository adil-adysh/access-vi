# Spatial mental models and auditory graph geometry

**Project:** Access-VI / Auditory Graph Explorer  
**Date:** 2026-10-30  
**Status:** Research direction and proposed engineering work; **not** an implemented or validated outcome.  
**Relation to current study:** Supplementary future study. Do not silently modify the existing A/B/C conditions or previously collected data.

## Executive research aim

**Access-VI should help a blind person independently construct, remember, inspect, and reason about a coherent mental representation of a graph—not merely hear disconnected node labels.**

Sighted users can exploit the spatial organization of node-link diagrams to see relationships, follow paths, identify branching/convergence, and offload some memory demands onto a persistent visual layout. We want to investigate whether a *stable, navigable auditory representation of graph layout* can provide some comparable **functional** benefits for people who do not use visual diagrams.

This is **a hypothesis, not an established finding for Access-VI**. The design must measure where a stable spatial map improves, fails to improve, or harms comprehension. Our goal is functional access to relationships, not a literal conversion of pixels into sound or a claim of sensory equivalence.

## 1. Precise distinction: topology, layout, and mental model

- **Topology (ground truth):** Nodes, directed edges, in-/out-degree, branching, convergence, reachability, and cycles. For a graph with A→B, A→C, B→D, C→D, these relations remain true regardless of drawing.
- **Geometry (representation):** Positions of nodes in a particular drawing, arrow angles, lengths, bends, and crossings. Multiple layouts can be valid for the same topology. Unless imported geometry is meaningful in the source domain, an angle or distance is not an intrinsic graph fact.
- **Mental model (participant outcome):** The user's internal understanding of graph relationships and/or a consistent map of a chosen arrangement, assessed through independent tasks after exploration.
- **Route knowledge:** Knowing paths between nodes by sequential traversal.
- **Survey knowledge:** Understanding where nodes/regions are relative to one another, beyond one memorized route.

Success is **not** merely correctly repeating a spoken sequence. Success is being able to locate a previously visited node, reason across multiple routes, understand that two paths converge, reconstruct relationships, and accurately distinguish topology from optional layout.

## 2. What prior research supports

| Source | Study and observed finding | Applicability and boundary |
|---|---|---|
| [R1] Larkin & Simon (1987) | Theoretical account of why spatially organized diagrammatic representations may make some inferences easier than sentences. | Conceptual motivation; not evidence that audio recreates visual efficiency. |
| [R11] Purchase, Pilcher & Plimmer (2012) | In studies of graph drawing produced by people, avoidance of edge crossings was an important layout preference; grid alignment also mattered. | Sighted visual graph drawing. It supports caring about layout quality, not claiming that encoding geometry in stereo will help blind users. |
| [R2] Zhao et al., **TADA**, CHI 2024 | 15 formative interviews documented barriers and high memory/social costs of diagram access; a 25-participant evaluation supported interactive touch + musical tones + speech for multiple diagram perspectives, including overview and detail. | Closest node-link prior art. Its physical touch/proprioception, tablet interaction, and primarily non-directional links differ from our keyboard-first directed-graph study. It does not establish stereo superiority. |
| [R12] *Cognitive map formation supported by auditory, haptic, and multimodal information in persons with blindness* (2022 review) | Literature indicates blind and sighted people can form nonvisual route and survey representations, sometimes with different accuracy; training and available spatial information matter. | Synthesis of environmental-navigation evidence, not a direct test of auditory node-link diagrams. |
| [R13] Geronazzo et al. (2016) | In virtual-map exploration, interactive spatial sonification was studied with map reconstruction and goal-reaching tasks; reported advantages of 3D over 2D auditory feedback under studied conditions. | Encouraging but a different task/interface and spatial technique; not evidence of a universal advantage for stereo pan. |
| [R14] Robinson-Moore et al., CHI 2024 | Formative test with **5** blind/low-vision participants on histograms and scatterplots suggested spatial audio might assist trend identification **while skewing their mental representation**. | A warning that task benefit and map fidelity can diverge. These are numerical charts, not node-link networks. |
| [R15] Shafique et al. (2025) | **14** participants (7 blind, 7 blindfolded sighted) explored environments and reconstructed layouts using LEGO; **no statistically significant difference** between binaural and non-spatialized descriptive audio. | Direct caution against assuming extra spatial audio improves maps; environmental layouts, not directed graph topology. Small study, not proof of no possible benefit. |
| [R16] Chundury et al. (2023/2024), TactualPlot | Touch-based nonvisual scatterplot exploration uses finger location plus sound, supporting a spatial reference frame via proprioception. | Relevant interaction principle, but not evidence that a keyboard-only stereo interface provides the same frame. |

**Research synthesis:** Spatial organization can be cognitively useful; nonvisual spatial representations are possible; interactive multi-level access matters. But **spatial sound does not automatically create a more accurate mental map**. Perceptual mapping, stable reference frames, user training, task type, presentation order, and redundancy all matter. No participant results for the proposed Access-VI geometry mode exist.

## 3. Current Access-VI baseline and identified gap

Current implementation:

- Graphology-backed `DirectedGraph` stores directed topology; graph node records do **not** define standardized x/y positions.
- `ExplorationController` supports current node, incoming/outgoing neighbors, selected neighbor, traversal, backtracking, direct inspection, and a separate start-node command.
- `SonificationStrategy` maps node IDs to pitches, connection direction to short rising/falling sweeps, and local neighbor **list order** to left/right pan in condition C.
- Conditions: A = speech/text only; B = same semantics with centered non-speech tones; C = local-neighbor stereo-pan representation.
- The current condition C is a **relative neighbor panorama**, not a persistent two-dimensional map. A node reached from two different parents can sound at different pan positions because its list index and direction differ.

**Identified research gap:** Can an optional *stable map representation*, with fixed node anchors and navigable overview/landmarks, improve global graph comprehension compared with local neighbor-order panning or nonspatial audio?

Separate technical debt: the present pitch scale wraps with overlapping semitone offsets, so some node IDs can share a frequency. Pitch identity uniqueness and recognition should be tested independently rather than assuming it is reliable.

## 4. Design goals and non-goals

**G1 — Stable anchors:** The chosen map location of a node must remain the same when it is reached from different routes, reselected, or replayed. Stable means stable within the graph/layout version, not fixed forever across unrelated layout algorithms.

**G2 — Preserve semantic distinctions:** Node identity, edge direction, edge existence, selected-neighbor order, and spatial position must be separately interpretable. Do not make high pitch simultaneously mean both node identity and greater depth/distance.

**G3 — Overview and detail:** Provide controllable overview, local neighborhood, path trace, landmark lookup, and precise speech/text inspection. Avoid compulsory long audio sequences.

**G4 — Topology remains authoritative:** A layout must not create false edges or cause users to interpret geometric closeness as connectivity. Directionality is encoded from directed edges, not from the slope of a drawn arrow.

**G5 — Accessibility first:** Keyboard/NVDA access, cancellation, replay, adjustable volume/speed, recoverable focus, mono fallback, and clear explicit labels are required. Do not force reliance on stereo hearing or specialized hardware.

**G6 — Research integrity:** Preserve existing A/B/C conditions and their locked mappings. Geometry-aware rendering is separately versioned and not activated during the current recorded protocol without redesign, new consent/protocol documentation, and revalidation.

**Non-goals for this phase:** Accurate 3D localization, HRTF personalization, physical-world navigation, interpreting arbitrary screenshots, reproducing the exact visual experience, or proving parity with sighted visual performance.

## 5. Proposed representation: topology plus optional layout

Keep the graph model independent of display geometry. Add an optional immutable, versioned layout snapshot:

```ts
interface GraphLayoutSnapshot {
  graphHash: string;
  layoutId: string;
  algorithm: string;          // e.g. imported, layered, force
  version: string;
  seed?: number;
  coordinateSystem: 'normalized-2d';
  positions: Record<string, { x: number; y: number }>;
}
```

Requirements:

1. A graph remains fully usable without any coordinates.
2. All nodes in a chosen layout have defined, finite, deterministic positions. Snapshot validation checks matching graph identity/hash.
3. Preserve supplied coordinates with provenance; otherwise generate a reproducible layout. Prefer layered arrangements for suitable DAGs; handle cyclic networks without silently imposing false ancestry.
4. Record layout algorithm, version, seed, parameters, and final positions for each geometric study stimulus.
5. Keep node ordering and position definitions deterministic across sessions and representations.
6. Never derive topology, cycle existence, or correctness directly from 2D closeness.

The user-facing mental *map* is an interface around a chosen layout. It must not be presented as an inherent property of an arbitrary graph.

## 6. Proposed auditory modes, from low risk to exploratory

**M0 — Existing local panorama (retain unchanged).** Current condition C. Neighbor slots are spread across left/right according to incoming/outgoing mode. This expresses a local list, not a global position.

**M1 — Stable one-dimensional map (first prototype).** Assign each node a fixed pan derived from the x-coordinate of one layout. The same node sounds from the same left/right location whenever revisited. Preserve familiar node-identity sounds and speech. Explain that *pan is only horizontal placement*, not full geometry. Reuse of positions across different routes may assist landmarking but may cause spatial collisions.

**M2 — Structured two-dimensional map (separate exploratory prototype).** Add a second explicitly labeled dimension through accessible spoken relative position (e.g. “upper-left,” “below B”), an optional distinct non-conflicting cue, or a separately tested spatial renderer. Do not imply ordinary stereo pan conveys height or physical distance. Avoid assigning arbitrary pitch to vertical position while pitch is used for node identity.

Candidate interactions:

- **Orient:** Announce current node, map region, reference origin, and a known landmark.
- **Locate:** Replay a named node at its stable anchor without silently traversing.
- **Trace edge:** Hear source and destination anchors sequentially, preserving the fact that the edge is directed.
- **Overview:** Replay a short, cancellable sequence of node anchors with region/group markers; permit selecting a region and zooming into details.
- **Return to anchor:** Jump to a previously visited node or chosen landmark, clearly distinguished from backtracking history.
- **Compare paths:** After following two paths, announce whether they end at the *same node identifier*, without providing automatic answers to trial-specific inference questions.

Important: In non-study free exploration, exact accessible inspection and adjacency information remain available. During experiments, information-exposure policy must make equivalent semantic content accessible across comparison conditions without leaking trial answers.

## 7. Falsifiable hypotheses and alternatives

These are **proposed hypotheses**, not findings:

- **H1 (stable recognition):** M1 reduces time/errors when returning to or locating a previously explored node compared with the current M0, given matched tasks and training.
- **H2 (topological mental model):** M1/M2 improves edge-reconstruction F1 and/or convergence/path recognition relative to M0; **alternative:** added cues do nothing or increase working-memory demands.
- **H3 (survey representation):** M2 improves relative-position or region-reconstruction accuracy compared with M1, but could introduce distortions.
- **H4 (workload):** Stable spatial maps reduce perceived navigation effort; **alternative:** more audio dimensions increase workload and fatigue.
- **H5 (generalization):** Any benefit survives changes of graph labels and unfamiliar layouts, rather than depending on memorized fixed stimuli.

No single metric substitutes for the others. Greater confidence/preference does not demonstrate better reconstruction, and a more accurate spatial layout does not necessarily imply better edge knowledge.

## 8. Proposed staged evaluation

### Stage 0 — Deterministic engineering and perceptual checks

- Create simple directed 4–8-node graphs with branching, convergence, and cycles; include pairs of topologically identical graphs with different layouts.
- Validate layout snapshots and stable node anchors under all traversal orders.
- Verify fixed node IDs, edge direction, equal audio-event content and explicit mapping versions.
- Check pan separation, headphones, volume normalization, perceived location, and pitch confusion. Test mono fallback, stop/replay behavior, NVDA reading, and keyboard-only orientation.
- Add negative tests: identical map positions for two distinct nodes, missing coordinates, unstable generation, and misleading inference that “closer” means “connected.”

### Stage 1 — Formative, accessibility-centered pilot

Conduct moderated, consented, small-sample sessions including blind participants familiar with screen readers. Treat the sample as formative, **not** powered efficacy evidence. Measure:

- Can participants explain what pan communicates and what it does *not* communicate?
- Can they recognize the same node from different routes?
- Can they trace a path and locate the endpoint again?
- Do overview and landmark features reduce confusion or overload?
- Can users of mono audio or those with limited spatial hearing accomplish core tasks with equivalent textual access?

Record misunderstandings, headphone configuration, training time, and qualitative strategies. Refine the cues before freezing the protocol.

### Stage 2 — Controlled comparison, only after pilot

Keep the existing A/B/C experiment intact. Design a **new, separately versioned** comparison such as M0 vs M1 and, later, M1 vs M2.

- Predefine whether the comparison tests *spatial position only* or a complete *interface package* (overview, landmarks, and extra layout information). Do not call a package effect a pure pan effect.
- Counterbalance condition order and independently assign matched but unfamiliar graphs; avoid practice and carryover leakage.
- Match accessibility, labels, available information, speech policy, exposure time, timing, playback speed, and training as far as feasible.
- Consider a no-geometry/non-spatial control. Record actual layout/mapping snapshot per trial.
- Separate topology tasks (edge reconstruction, branching, convergence, reachability, cycles) from geometry tasks (relative position, regional clustering, layout reconstruction).
- Report completion time, errors, topology reconstruction precision/recall/F1, positional reconstruction error or rank-order relation accuracy, replay/inspection usage, workload, and retention.
- Predefine primary endpoints, exclusions/interruption handling, statistical plan, and sample-size rationale before confirmatory claims; provide ethics/privacy review appropriate to recruitment.

### Stage 3 — Transfer and generalization

Test unfamiliar shapes, more nodes, arbitrary labels, cyclic vs acyclic structures, different layout seeds, and cases where visual proximity *does not* imply an edge. Evaluate whether users learn a reusable strategy or merely memorize sounds.

## 9. Threats to validity and mitigation

| Threat | Proposed mitigation |
|---|---|
| A visually pleasing layout is arbitrary, not “the graph” | Store layout provenance; make topology/layout distinction explicit; vary layout while fixing topology. |
| Stable pan conveys only left/right | Label horizontal scope honestly; test vertical information separately. |
| Extra layout cues leak correct answers | Condition-specific information-exposure audit, independent blinded scoring, task-by-task leakage tests. |
| Stereo positions change subjective loudness or are inaudible | Volume/calibration checks, actual waveform/settings snapshots, mono-accessible alternatives. |
| Listening effort increases with node count | Brief on-demand overview, replay, progressive disclosure, measure fatigue and workload. |
| Musical pitch identities collide | Fix and independently validate recognizability and pitch range, with versioned mappings. |
| Different graph structure or layout complexity | Matched difficulty distributions, independent stimuli, reproducible assignment. |
| Sighted visual findings overgeneralized to blindness | Treat visual-layout work as motivation; test outcomes with intended blind users. |
| Touch/proprioception findings incorrectly transferred to keyboard stereo | State hardware differences and test keyboard-specific reference frames. |
| Interruption/refresh or unstable audio changes measured timings | Durable session recording, interrupted-trial policy, monotonic active time, immutable settings. |

## 10. Implementation boundaries and milestone acceptance

1. **Design document accepted:** terminology, proposed conditions, hypotheses, and non-goals agreed; existing research protocol unchanged.
2. **Layout model prototype:** deterministic optional coordinates, explicit provenance/hash and tests, no audio changes.
3. **M1 prototype in free exploration:** fixed 1D pan for nodes, orientation/locate/replay controls, accessible fallback; current A/B/C unchanged.
4. **Usability gate:** manual NVDA/Edge results, perceptual confusion tests, user feedback; no claims of efficacy.
5. **Study gate:** stimuli, protocol, counterbalancing, logging, participant consent, pilot evidence and preregistered analysis are complete before formal evaluation.

The central question we should answer is:

> **Does a consistent auditory reference frame help a blind user build a more accurate, usable mental model of both graph relationships and a chosen spatial arrangement than the existing local-neighbor auditory representation?**

**Possible outcomes:** improves topology, improves orientation only, trades accuracy for speed, increases workload, or produces no measurable benefit. Each is a valid research finding if the study is designed and reported rigorously.

## References

These are selective sources, not a systematic review. Identifiers R1/R2 are from [the existing bibliography](references.md); R11–R16 extend it.

- **[R1]** Larkin, J. H., & Simon, H. A. (1987). *Why a Diagram is (Sometimes) Worth Ten Thousand Words.* Cognitive Science. https://doi.org/10.1016/S0364-0213(87)80026-5 — Theory, not auditory outcome evidence.
- **[R2]** Zhao, Y., Nacenta, M. A., Sukhai, M. A., & Somanath, S. (2024). *TADA: Making Node-link Diagrams Accessible to Blind and Low-Vision People.* CHI. https://doi.org/10.1145/3613904.3642222 — Direct diagram-access prior art.
- **[R11]** Purchase, H. C., Pilcher, C., & Plimmer, B. (2012). *Graph Drawing Aesthetics—Created by Users, Not Algorithms.* IEEE TVCG. https://doi.org/10.1109/TVCG.2010.269 — Sighted layout creation and aesthetics.
- **[R12]** *Cognitive map formation supported by auditory, haptic, and multimodal information in persons with blindness* (2022). Review. https://pubmed.ncbi.nlm.nih.gov/35902045/ — Nonvisual route/survey representations.
- **[R13]** Geronazzo, M., Bedin, A., Brayda, L., Campus, C., & Avanzini, F. (2016). *Interactive spatial sonification for non-visual exploration of virtual maps.* International Journal of Human-Computer Studies. https://doi.org/10.1016/j.ijhcs.2015.08.004 — Spatial audio in virtual maps.
- **[R14]** Robinson-Moore, W. J., Kalal, M., Tennison, J. L., Giudice, N. A., & Gorlewicz, J. L. (2024). *Spatial audio-enhanced multimodal graph rendering for efficient data trend learning on touchscreen devices.* CHI. https://doi.org/10.1145/3613904.3641959 — Small formative chart study; potential trend benefit and mental-map distortion.
- **[R15]** Shafique, S., Zanchi, S., Setti, W., Gori, M., & Picinali, L. (2025). *Does spatialized audio enhance the creation of mental representations?* Frontiers in Neuroscience. https://doi.org/10.3389/fnins.2025.1660373 — No significant binaural advantage in studied environmental-reconstruction task.
- **[R16]** Chundury, P., Reyazuddin, Y., Jordan, J. B., Lazar, J., & Elmqvist, N. (2023). *TactualPlot: Spatializing Data as Sound using Sensory Substitution for Touchscreen Accessibility.* IEEE TVCG. https://doi.org/10.1109/TVCG.2023.3326937 — Touch/proprioception plus sound for numerical plots.

For the existing project baseline and study protections, also read [research foundations](02-research-foundations.md), [research questions](03-research-questions.md), [experimental protocol](04-experimental-protocol.md), [sonification design](05-sonification-design.md), and [decisions and risks](09-decisions-and-risks.md).
