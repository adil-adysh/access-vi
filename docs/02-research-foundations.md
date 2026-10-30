# Research foundations and literature review

**Review date: 2026-10-30.** This is a focused starting review, not a systematic survey. Direct links and bibliographic details are in [references](references.md).

## Theoretical framing

**Larkin & Simon (1987) [R1]** analyzed why diagrammatic and sentential representations can differ computationally even when they carry equivalent information. Their framework motivates *testing*, not presuming, whether a nonvisual alternative permits efficient access to relations. The transfer from visual diagrams to auditory graph exploration is **our inference**, not a finding established by the paper.

## Closely related node-link accessibility work

**TADA — Zhao et al., CHI 2024 [R2].** This is essential prior art. The paper describes a tablet interface using touch, musical tones, and speech to access node-link diagrams. Its formative interview study involved **15** blind/low-vision participants; an evaluative study involved **25**. It supports navigation, searching and filtering as well as open-ended exploration. The reported evaluation provides evidence that the approaches are usable for several diagram tasks. It does **not** establish that our proposed stereo approach improves reasoning.

TADA reports that its implemented links are **non-directional** and emphasizes touch location/proprioception. The paper also discusses earlier keyboard/joystick node-link systems (e.g. TeDUB and GSK), so keyboard navigation alone is **not novel**. Our design should compare against this established space rather than claim to invent auditory diagram navigation.

**Distinct opportunity:** directed edges; keyboard and screen-reader-centric operation; a controlled contrast isolating sound representation and stereo cues, rather than a tablet gesture technique.

## Broader sonification and accessible data exploration

**Sonification Sandbox — Walker & Lowey (2004) [R4].** An earlier toolkit for mapping data into pitch, timbre, volume and pan. Important precedent for audio encoding, though its “auditory graphs” mostly concern data plots rather than directed node-link topology.

**Chundury et al., 2026 [R3].** Compared screen-reader-based chart description (Olli), audio/touch interaction (TactualPlot) and tactile display (Monarch) in a within-subject study with **10 blind participants**. Across bar, pie, line and scatter charts, accuracy did not significantly differ, but speed and perceived workload differed. Those are **charts**, not our directed node-link task domain. The finding cautions against assuming that a new sensory modality automatically improves accuracy; interaction costs and hardware matter.

**Enge et al. (2024) [R5].** A state-of-the-art report on sonification and visualization. Helps situate design options and avoids presenting sonification as a new field.

## What this literature supports—and what it does not

| Evidence | Reasonable interpretation | Not justified |
|---|---|---|
| TADA formative/evaluative work | Multiple perspectives and interaction modes matter for diagram access | Stereo panning is superior |
| Auditory graph/sonification toolkits | Systematic sound mapping is feasible | Any given pitch/timbre mapping is intuitive |
| 2026 chart comparison | Task time and workload may vary even if accuracy does not | Same effect size for directed graphs |
| Theory of diagrams | Representation can alter computational work | Auditory scenes inherently recreate visual parallelism |

## Gaps to investigate before a paper

1. Find and review full methods and limitations of TeDUB, GSK, PLUMB and later related systems.
2. Search for studies that directly compare keyboard vs touch and stereo vs non-stereo **node-link** graph exploration.
3. Identify prior work on mental-model reconstruction and recall, not just usability.
4. Evaluate hearing variability, headphone orientation, prior musical/audio training and screen-reader experience as covariates.
5. Determine whether stable global sound positions or navigation-relative spatialization are interpretable without physical pointing.
6. Predefine which exploratory findings are not confirmatory; avoid post-hoc novelty claims.

## Design implications taken forward

- Use speech for exact labels and sound for exploration, but prevent speech duplication.
- Offer overview, local, path and precise inspection modes, excluding explicit answer cues during scored trials.
- Keep training explicit, with sound mapping taught before measured trials.
- Compare performance and workload, not only subjective preference.
- Consider a non-spatial control so a positive result cannot automatically be attributed to stereo.

Sources: [R1], [R2], [R3], [R4], [R5] in [references](references.md).
