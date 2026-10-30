# Perceptual mapping: visual elements, auditory equivalents, and structural grouping

**Project:** Access-VI / Auditory Graph Explorer  
**Date:** 2026-10-30  
**Status:** Research synthesis + candidate design mappings; **not implemented, validated, or a new recorded-study condition**.  
**Authority:** The [governing visual–auditory parity rule](11-visual-auditory-parity-governing-rules.md) is normative. This document develops *possible implementations and tests* under that rule, but must not be taken as proof that any given cue works.

## 1. Objective and origin

We want blind users to recognize what kind of visual element they encounter, understand the graph's directed connections, group relationships into meaningful structures, and form an accurate mental model **without interpreting incidental audio features as unencoded rank, importance, or geometry**.

In discussions of the current prototype, a blind user reported:

1. Being able to recognize that outgoing connections exist, but not yet experiencing a clear overall graph structure from the tone sequences.
2. Interpreting higher-pitched node notes as higher rank or importance.
3. Wanting *identical-looking nodes to have the same intrinsic sound* and different-looking shapes to have different intrinsic sounds.
4. Wanting all textual content, especially node and edge labels, to be announced by the screen reader rather than encoded as non-speech sound.

These are **conversation-derived first-person formative observations and decisions**, not observations from a documented sample, usability study, or controlled comparison.

## 2. Separate four things before defining sounds

1. **Graph semantics:** The actual nodes, edges, direction, and declared attributes.
2. **Presentation semantics:** Which properties of the visual marks encode categories, order, magnitude, grouping, or layout, as defined by the diagram's styling/legend.
3. **Modality mapping:** Screen-reader text for symbolic labels; non-speech audio for non-text visual distinctions and structural events.
4. **Perceived meaning:** What a real listener takes the sounds to mean, which may differ from the intended mapping.

**The mapping goal is informational/semantic parity, not an assertion of sensory equivalence.** A circle need not have an inherently circular sound. A learned, tested and consistently applied sound *category* may correspond to it.

## 3. Visual perception and encoding: findings versus conventions

| Principle | Evidence-informed interpretation | Access-VI implication |
|---|---|---|
| **Identity/nominal variables** | Shape and color hue commonly distinguish qualitative categories without an intrinsic numerical order. [R17] | Use categorical sound cues (candidate: distinct timbres/rhythms) for *meaningful* shape/style distinctions. Avoid making one category inherently higher ranked. |
| **Ordered/magnitude variables** | Visual position, size and intensity may encode ordered or quantitative values when the chart defines them. [R17] | Map to a tested ordinal acoustic parameter only **if** that visual order is explicit. Do not turn arbitrary shape identity into height or magnitude. |
| **Similarity** | Repeated visual appearance supports grouping by category; auditory similarity also contributes to perceived stream grouping. [R18] | The same visual shape/style produces the same intrinsic node sound. A related auditory pattern can reinforce an explicitly defined group. |
| **Proximity** | Visual distance can encourage grouping; temporal/frequency closeness can encourage auditory grouping. [R18] | Temporal spacing or stable position may indicate grouping **only when the diagram encodes grouping/proximity**. Otherwise it risks inventing a relation. |
| **Connectedness** | Lines and arrowheads show graph topology/direction, independently of a node's visual category. | Use separate edge/direction events. Do **not** infer an edge merely because sounds are near in time, pitch, or stereo position. |
| **Continuity and common region** | Alignments or boundaries can visually organize elements. Auditory streams may be formed by acoustic continuity, similarity and temporal organization. [R18] | Candidate: path-trace sequences and group-boundary cues, but only if their meanings are supported by the displayed graph. Test for false grouping. |
| **Perceptual interaction** | Pitch and loudness can influence judgments of each other, distorting data impressions. [R19] | Changing pitch, loudness, timbre, or stereo is not perceptually neutral. Match levels; test mistaken rank/size inferences. |

**Scope of evidence:** The general visual/auditory perception findings above do **not** demonstrate that a particular shape-to-timbre mapping improves directed-graph reconstruction in blind users. The mapping table below is a proposal.

## 4. Governing cross-modal mapping matrix

**Symbolic content is screen-reader text.** All names, node IDs, edge labels, descriptions, exact numbers, legends, and annotations must be available in accessible markup and announced appropriately on focus/inspection or via concise live regions. Do not derive note sequences or oscillator parameters from spelling or labels.

| Visual element or distinction | Screen-reader content | Proposed non-speech cue | Constraints |
|---|---|---|---|
| Two visually identical circle nodes A/B | Announces “A” and “B” separately | **Same intrinsic shape/category cue** | No ID-based pitch; contextual edge and selection cues may differ. |
| Circle vs rectangle | Announces exact labels, and shape if useful | **Different stable, recognizable category sounds** | Difference must track actual rendered/declared shape; no automatic rank. |
| Circle vs diamond | Announces exact labels, and shape if useful | Third shape-category cue | Test confusion with the other shape cues; limit categories if needed. |
| Same meaningful color category | Announces color meaning or legend when relevant | Consistent category cue or combination with shape | Only when color carries data; do not sonify decorative palette. Avoid unnecessary layers. |
| Visual size difference representing quantity | Announces measured value | Candidate calibrated magnitude cue | **Do not** encode decorative size changes; no fixed loudness/size equivalence assumed. |
| Directed edge from A to B | Announces “A to B” and optional actual edge label | Short connection cue with a *separate* directional mark | Must preserve actual source/target; distinct from node sound. |
| Several outgoing edges | Announces count and exact selected endpoints on demand | Repeated, count-preserving edge enumeration | Sequence order is stable; do not automatically announce trial answers. |
| Same edge style | Announces label if present | Same relationship-category cue | Edge labels stay spoken; only non-text style/type uses sound category. |
| Different meaningful line styles | Announces exact meaning from legend | Different relationship-category cue | Define a legend and verify distinguishability. |
| Node grouping in a visual enclosure | Announces group name, members on demand | Candidate group opening/closing marker or shared pattern | Must not imply membership absent from the visual/semantic representation. |
| Layout x-position when meaningful and enabled | Relative position text on demand | Stable horizontal stereo position | Stereo encodes **left/right only**, not inherently 2D or rank; explicit layout provenance. |
| Highlight/selection state | Announces selected/focused node | Uniform focus/selection earcon | Same across equal-state nodes: action/state, not node identity. |
| Purely decorative arrow angle, edge length, curvature | No semantic claim unless author defines one | **No additional cue** | Decorative geometry is not graph topology. |

**Intrinsic cue vs context:** A and B may have the same category sound, but their complete exploration sequences may differ because they have different *edges*. This is required to preserve topology, not a violation of visual–auditory parity.

## 5. Candidate sound vocabulary (prototypes, not standards)

Start with a very small, learnable set. Use *one reference pitch, one duration and matched perceived loudness* for shape identity; vary a categorical parameter such as timbre:

| Declared visual shape | Candidate intrinsic cue | Why only candidate? |
|---|---|---|
| Circle (default/untyped) | Sine tone | Clean sound, but no proven universal association with circles. |
| Rectangle | Triangle-wave tone | Different spectral character, but may be difficult to distinguish from sine at low levels. |
| Diamond | Softened square-wave tone | More distinct harmonics, but may feel louder/rougher and imply urgency. |

No evidence currently supports assigning these three waveforms as perceptually equal to the three geometric shapes. Evaluate **confusion matrices** and subjective impressions before fixing any mapping.

**Current prototype issue:** `getNodeFrequency(nodeId)` assigns pitch based on identifiers. This violates the governing rule when node shapes/styles are identical. Pitch sweeps that modify a neighbor's identity tone may also undermine intrinsic stability. A revised mapping must separate the shape cue, the edge/direction cue, and the focus cue. All graph labels remain spoken by NVDA.

Also, there is currently no standardized shape field and the main explorer is largely a textual/navigation UI rather than a rendered node-link canvas. A compliant implementation needs **one common presentation specification** used by a visual renderer (if present), audio renderer, imports and accessibility descriptions. The app must not merely assume that all rendered circles have different semantic meaning because their IDs differ.

## 6. Mapping visual Gestalt functions to auditory grouping: hypotheses

These are **functional analogues to investigate**, not guaranteed one-to-one sensory conversions.

| Visual organizing function | Auditory mechanism to explore | Failure to check |
|---|---|---|
| Recognize same-looking items as one category | Identical intrinsic category sound | Mistaking same-shaped nodes for the same **individual** node; screen reader labels must disambiguate. |
| Notice distinct visual categories | Clearly different timbres | Perceiving one category as more important due to brightness/loudness. |
| Notice a visibly enclosed group | Shared onset or group-boundary earcon | Incorrectly implying graph reachability or membership. |
| Follow an edge | Source-to-target structure separated by a direction cue | Mistaking simple temporal succession for a directed edge in all contexts. |
| Follow a longer path | Repeatable ordered traversal segments | Treating traversed sequence as a hierarchy even in cyclic/flat graphs. |
| Perceive repeated destination/convergence | Same *spoken node ID* upon revisit plus consistent visual-category and optional grounded spatial cues | Assuming two same-shape nodes must be the same node. |
| Maintain overview/landmarks | On-demand overview, stable navigation history and (later) mapped anchors | Excessive memory demands; map position conflicting with local neighbor pan. |

**Do not use arbitrary pitch gradients to represent node names or status.** The user's perception of higher pitch as higher rank is a direct reason to test erroneous rank judgments. If height or rank is actually encoded by a particular visual diagram, design and validate a separately specified ordered cue.

## 7. Engineering architecture and acceptance criteria

### Mapping contract

The mapping should be driven by an explicit, versioned visual/semantic presentation snapshot, rather than inferred node label:

```ts
type ShapeKind = 'circle' | 'rectangle' | 'diamond' | 'other';

interface NodeVisualEncoding {
  shape: ShapeKind;
  styleCategory?: string; // only meaningful if legend defines it
}
interface AccessibleGraphNode {
  id: string;              // exact text, screen reader
  label: string;           // exact text, screen reader
  visual: NodeVisualEncoding;
}
```

These interfaces are illustrative only. Production schema must support imported shapes, unknown visual styles, validation, and any diagram-specific legend.

### Tests

- **Equality:** Same non-text visual appearance + different IDs/labels → identical *intrinsic* audio signal parameters.
- **Difference:** Different visual shapes → distinguishable, consistent intrinsic sounds (test in software and by actual listeners).
- **Text separation:** Changing the spelling or label does not alter non-speech cues. NVDA must announce actual node and edge text; no duplicate Web Speech API voice.
- **Topology:** Changing edges changes relationship events, not intrinsic node shape sounds. Outgoing/incoming direction stays distinguishable.
- **No false attributes:** Uniform circles produce no audio hierarchy, rank, magnitude or artificial category distinctions.
- **Cross-view parity:** The declared/rendered shape and accessible shape description agree with the emitted category cue.
- **Study integrity:** Original A/B/C mappings and exports remain recoverable by version; a new perceptual mapping receives a new condition/configuration version rather than silently replacing recorded stimuli.
- **Accessibility:** Keyboard/NVDA workflows, on-demand inspection, replay/cancel, mono accessible fallback, and an understandable sound legend.

### Formative evaluation

First test one isolated variable at a time, then combinations:

1. Without graph traversal, identify whether successive *shape-category sounds* are same/different.
2. With NVDA, identify the exact labels of two visually same-shaped nodes without inferring a rank.
3. Distinguish incoming/outgoing edge events independent of node category.
4. Reconstruct a small graph with branching and convergence; record accuracy, replay, timing and perceived importance.
5. Test group/overview cues separately; ask which relationships were inferred but do not exist in the graph.

Retain all negative findings. Prefer **accuracy, reconstruction, retention and workload** over aesthetic preference alone.

## 8. Prioritization and open questions

**P0 — Correct category/label semantics:** Node and edge text belongs to NVDA, and intrinsic non-speech node cues derive only from meaningful shape/style. No node-ID frequency mapping.

**P1 — Independent directed relationship cues:** Node identity/category sound must remain stable while connections and traversal convey actual source, target and direction.

**P2 — Auditory grouping:** Test rhythm, onset, boundary and sequence design for local neighbors and paths without inventing topology.

**P3 — Geometry and overview:** Only later map *actual chosen visual layout* to spatial audio; the geometry work is described in [spatial mental models](10-spatial-mental-models-and-graph-geometry.md).

Open questions include whether simple timbre categories are sufficiently distinguishable; how to communicate compound meaningful visual styles without audio overload; whether group earcons work in NVDA speech contexts; and whether the whole category-first approach improves graph reconstruction versus the legacy ID-pitch mapping.

## 9. Sources and evidence labels

- **[R17]** Börner, Bueckle & Ginda (2019), *Data visualization literacy: Definitions, conceptual frameworks, exercises, and assessments.* Qualitative identity channels versus quantitative magnitude channels. https://doi.org/10.1073/pnas.1807180116
- **[R18]** Snyder & Alain (2007), *Toward a neurophysiological theory of auditory stream segregation.* General auditory grouping/segregation; does not validate a specific graph cue. https://doi.org/10.1037/0033-2909.133.5.780
- **[R19]** Neuhoff, Kramer & Wayand (2002), *Pitch and loudness interact in auditory displays: Can the data get lost in the map?* Demonstrates perceptual interactions that distort mapping. https://doi.org/10.1037/1076-898X.8.1.17
- **[R5]** Enge et al. (2024), *Open Your Ears and Take a Look.* Sonification–visualization mapping survey; discusses identity vs magnitude audio channels and communicative redundancy. https://doi.org/10.1111/cgf.15114
- **[R2]** Zhao et al. (2024), *TADA: Making Node-link Diagrams Accessible to Blind and Low-Vision People.* Closely related accessibility system but not proof of our proposed mapping. https://doi.org/10.1145/3613904.3642222

**Evidence status:** R17–R19 and R5/R2 support general perceptual principles; the matching rule is an **accepted project requirement**; the user's pitch-as-rank interpretation is **first-person formative feedback**; timbre/earcon/layout assignments and their cognitive benefits remain **untested design proposals**.

See the normative [governing design rule](11-visual-auditory-parity-governing-rules.md), existing [sonification design](05-sonification-design.md), and [experimental protocol](04-experimental-protocol.md).
