# Governing rule: visual–auditory semantic parity and screen-reader ownership of text

**Decision date:** 2026-10-30  
**Status:** **Accepted, normative design requirement** for new and revised Access-VI representations.  
**Source:** Project-owner design decision, motivated by first-person feedback about unintended pitch-as-rank interpretation. This is a requirement, **not** a claim that controlled research has validated the mapping.  
**Implementation status:** **Not yet satisfied by the existing sonification implementation.** Existing research conditions remain versioned and unchanged until a deliberately revised study configuration is approved.

## 1. Governing statement

> **The visual representation must match the non-speech auditory representation in the distinctions it communicates. If two nodes have the same non-textual visual appearance, their intrinsic node sounds must be the same. If a visual encoding distinguishes two nodes (for example, circle versus rectangle), the auditory representation must consistently distinguish that same visual property. All graph text, including node labels and edge labels, must be exposed and announced through the screen reader—not translated into arbitrary non-speech tones.**

This rule governs the **faithful representation of the original graph**, not incidental sounds of keyboard actions or alerts. Under the accepted [research strategy](13-faithful-access-to-audio-first-research-strategy.md), this mapping is the mandatory **reference representation** for supported source features. Later, separately tested audio-first modes may include explicitly labeled wayfinding aids or derived cues not present visually, **provided the source mapping remains independently reachable, and aids cannot be mistaken for original diagram information**. Such aids must not silently change the intrinsic category sound used by the faithful reference.

**Semantic parity means matched informational distinctions, not physically identical sensations.** A circle need not “sound circular”; its sound category must be stable, distinguishable from a rectangle, and documented. No auditory cue may imply a rank, category, depth, importance, distance, or connection that is not encoded by the underlying visual diagram/graph semantics.

The authoritative data model must distinguish **graph properties**, **visual styling/layout**, and **text labels**. A designer must never infer semantic status from arbitrary node identifiers.

## 2. Modality ownership

**Text — screen reader only (symbolic precision):**
- Node IDs and node labels.
- Edge labels and named edge types, such as “depends on.”
- Titles, captions, descriptions, annotations, legends, and exact numeric/attribute values.
- Accessible names, instructions, errors, and contextual information.
- The interface must expose text via semantic HTML/accessibility APIs so NVDA can read it on focus, inspection, and appropriate announcements. “Must be announced” **does not mean automatically reading all graph text at once** or speaking hidden study answers.
- Do not encode letters, words, or the *difference between labels* into oscillator frequency, timbre, or stereo placement. Do not independently synthesize graph labels using Web Speech API when the screen reader is responsible for speech; avoid duplicate speech.

**Non-text visual encodings — non-speech audio (perceptual structural cues):**
- Shape/category distinctions (circle vs rectangle, etc.) -> stable, different shape-category cue.
- Directed edge/arrowhead -> distinguishable direction/connection cue.
- Multiple direct edges -> enumerable connection events, preserving actual counts and source/target.
- Meaningful visual style distinctions (if present and explicitly mapped) -> corresponding, documented distinct auditory cues.
- Optional layout position/grouping -> only if visually encoded and intentionally selected for a separately specified mapping/study; do not invent geometry from graph IDs.
- For a color-only or otherwise nonperceivable visual distinction, provide both an audio analogue **and** an accessible textual description/legend. Never make sound the only way to know a graph attribute.

**Interaction feedback:** Focus, selection, traversal confirmation, stop, and boundary earcons can be common across nodes. These cues communicate the *action/state*, not a fabricated node property.

## 3. Mandatory equivalence examples

| Visual graph | Screen-reader text | Intrinsic node/relationship audio |
|---|---|---|
| A and B are identical circles with different text labels | Speak “A” and “B” respectively | **Identical node-category tone** for A and B. No unique pitch assigned from ID. |
| A is a circle; B is a rectangle | Speak A and B; optionally announce their shapes from accessible semantics | **Different stable category cues** for circle vs rectangle. |
| A and B share a rectangle shape and visual style, but have different outgoing-degree counts | Speak IDs; exact counts available in text | Same node-category sound; their **edge enumeration sequences** differ because graph connectivity differs. |
| A → B with an arrowhead | Speak “A to B,” plus edge label if any | Direction/connection event, separate from intrinsic sounds of A and B. |
| A → B has edge label “depends on” | Speak exact label “depends on” | Do not use a melodic spelling or label-derived frequency; any connection-type cue must correspond to an actual visual non-text distinction (e.g. edge style), not the words alone. |
| Nodes visually indistinguishable except one is named “Manager” | Speak “Manager” and the other label | **Do not** create a special high-status sound merely because of the word or node ID. |
| Node A is drawn higher than B for layout convenience | Exact names announced | Do not encode higher rank or importance; geometry-specific cues require explicit layout mode and provenance. |

**Critical distinction:** “Same node sound” means the node's **intrinsic** audible encoding is the same for equal visual encodings. It does *not* prohibit the sound of surrounding edges, selection, or navigation from differing according to actual graph structure/state.

## 4. Requirements for a mapping contract

A documented mapping should be driven by explicit non-text appearance and directed structure, not by names:

```ts
interface NodePresentation {
  shape: 'circle' | 'rectangle' | 'diamond' | 'other';
  visualStyleId?: string;        // only if visual differences are meaningful
}
interface GraphNodeWithPresentation {
  id: string;                    // screen-reader text identity
  label?: string;                // screen-reader text
  presentation: NodePresentation;// controls intrinsic non-speech category cue
}
```

This is a **proposed interface sketch, not an implemented type**. Shape categories and styles must come from the same representation metadata as the actual diagram; the project currently has no standardized shape field. When shape is unspecified, use one neutral default shape and **one neutral intrinsic node sound**.

A canonical, versioned mapping table is required: `visual property → non-speech cue → alternative accessible textual description`. The same mapping must be used by the visual renderer and audio renderer (single source of truth). Custom and imported diagram styles require validation, an unknown-style fallback, and non-silent handling of unmapped meaningful differences.

## 5. Interaction and information parity

- The reader can query every node and edge label, directed relationship, and property needed for navigation. Surface labels with semantic markup and concise live-region announcements where appropriate; use polite announcements for routine changes and assertive announcements only for urgent errors.
- No visual information should be silently missing from the accessible representation. No fabricated non-speech semantics should be present only in audio.
- A non-speech structural cue may summarize a visible pattern (e.g. outgoing edges), but must have a documented correspondence to actual structure or visual marks, never an inferred answer shortcut.
- A shape cue is **not** an individual node identity. Two same-shape nodes may be distinguished precisely by their **screen-reader labels** and via context/navigation.
- Avoid requiring users to memorize arbitrary pitch-to-letter mappings. The purpose of non-speech audio is structural perception, not spelling labels.
- Provide on-demand inspection and replay. Do not turn all text into automatic long narration; never bypass study information-exposure rules.

## 6. Current implementation: conflict and remediation

As of 2026-10-30 in `src/audio/sonification/SonificationStrategy.ts`:

1. `getNodeFrequency(nodeId)` assigns musical frequencies based on node IDs (A, B, C...), even though the graph has no corresponding documented shape difference. **Nonconforming.**
2. The node-reference tones, neighbor tones and selected-neighbor tones all use those ID-derived frequencies. **Nonconforming under equal visual node styling.**
3. Neighbor pitch sweeps convey incoming/outgoing status; their edge-direction semantics can be kept **only if** separated from the node-category sound so each node's intrinsic cue stays stable.
4. `GraphNode` currently provides `id`, `label`, `category`, and generic metadata, not a standardized shape/style property. The planned correspondence therefore requires a shared presentation model, or a documented uniform default.
5. Accessible node names and degrees are present in the current explorer. Verify that **all imported node and edge labels**, graph descriptions, legends and annotations are conveyed through semantic screen-reader access; do not assume that exposing IDs covers edge labels.

**Priority:** Correct the concept and mapping before introducing 2D/3D geometry. Design a new sonification version that emits a uniform node cue for uniform shape, distinct stable cues for distinct shapes, independent edge/direction cues, and screen-reader text for labels. Preserve the old mapping only as an explicitly labeled legacy/experimental version.

## 7. Verification and acceptance tests

**Unit/property tests**
1. Two nodes with the **same shape/style**, different IDs/labels, produce identical intrinsic node tone parameters (frequency, timbre, envelope, duration, pan unless a separately enabled and visually grounded layout-position cue applies).
2. Two different configured shapes produce distinguishable, stable node-category cues, independent of IDs/labels.
3. Swapping node IDs/labels without changing shape/style or topology does not change intrinsic non-speech cues.
4. Edge-direction and edge-count cues depend on directed connections, not identifier spelling.
5. The semantic graph and audio renderer do not convert textual label content into non-speech encoded identities.
6. Missing/unsupported styles have an explicit safe mapping and textual fallback; no silent loss.
7. Diagram renderer and audio renderer resolve the same versioned presentation properties.

**NVDA/manual tests**
1. On node focus, NVDA announces the correct node ID/label.
2. On edge inspection, NVDA announces source, destination, and the **actual edge label**.
3. A circle A and circle B sound intrinsically identical while NVDA identifies each correctly.
4. A circle A and rectangle B sound different in their **shape** cue, consistently across revisits.
5. Distinct connection sequences remain intelligible and do not masquerade as node rank.
6. Screen-reader voice does not duplicate Web Speech API narration.
7. Keyboard navigation, audio cancellation, text inspection, and accessible legends work without stereo-only dependence.

**Research tests**
- Measure shape-category recognition, node-label comprehension, connection direction, actual edge reconstruction, workload, and mistaken importance/rank inferences.
- Compare existing legacy mapping to the newly versioned, parity-compliant mapping in an appropriately revised pilot. Record participant instructions and all mapping versions. No efficacy claim prior to evaluation.
- Freeze A/B/C protocol and datasets for any study wave; do not mix mappings or silently reinterpret old data.

## 8. Change control

This is a **governing product/research design rule**, not a previously proven experimental conclusion. When code, tests, visuals, imports or documentation conflict with it, the change must be identified and resolved by a versioned design/implementation decision. Do not silently alter ongoing or already recorded experiments.

The evidence-based candidate vocabulary, perceptual grouping risks, and first-person formative observations are documented in [perceptual mapping and auditory Gestalt](12-perceptual-mapping-and-auditory-gestalt.md). All candidate sound assignments remain subject to this governing rule.

Cross-references: [governing research strategy](13-faithful-access-to-audio-first-research-strategy.md), [sonification design](05-sonification-design.md), [accessibility](07-accessibility.md), [experiment protocol](04-experimental-protocol.md), [spatial mental models](10-spatial-mental-models-and-graph-geometry.md), and [research decisions](09-decisions-and-risks.md).
