# Decisions, assumptions, risks and open questions

## Accepted research strategy (2026-10-30)

**Research order:** [Faithful access → independent fidelity validation → evidence-led audio-first optimization](13-faithful-access-to-audio-first-research-strategy.md). The faithful mapping is a **reference baseline**, not a permanent prohibition on optional, clearly designated auditory navigation aids. Full original information must remain accessible throughout any optimization. This is a project-owner decision; coverage, usability and comparative benefits remain unproven until tested. The existing A/B/C research conditions are not these stages.

## Accepted governing requirement (2026-10-30)

**Mandatory:** [Visual–auditory semantic parity and screen-reader ownership of text](11-visual-auditory-parity-governing-rules.md). Identical non-text node appearance requires identical intrinsic node sounds, distinctive shape/style must have correspondingly distinctive and stable non-speech cues, and **all text** (especially node and edge labels) must be conveyed through the screen reader. Arbitrary ID-to-pitch encoding is nonconforming. This is an accepted project-owner design constraint, not an empirically proven effectiveness claim. Correct with a separately versioned mapping and revised protocol; preserve legacy data.

## Current decisions (provisional unless marked)

| Topic | Decision | Reason | Revisit when |
|---|---|---|---|
| First domain | Directed graphs | Small, measurable structural reasoning tasks | After graph study |
| Platform | Local-first browser Svelte/TypeScript | Fast iteration, no specialized hardware | Inaccessible browser behavior |
| First spatial technique | Stereo panning | Test modest directional cues without HRTF | Pilot indicates inadequate perception |
| Baseline | Interactive speech-only | More fair than a static prerecorded paragraph | Study design review |
| Additional control | Non-spatial audio | Helps isolate contribution of stereo | If mappings cannot be equated |
| Input | Keyboard, with NVDA | Independent use and low hardware cost | Later touch/haptics work |
| Ground truth | Structured graph, not screenshot | Prevents computer vision errors from confounding experiment | Later vision-input study |
| Research scope | No AI-generated answers | Avoid leakage and nonrepeatable assistance | Separate research |
| Data | Local, anonymous, versioned | Privacy and reproducibility | Multi-site study demands server |

## Risks to validity

1. **Prior art / novelty:** TADA and older TeDUB/GSK systems overlap with auditory diagram access; review before publication.
2. **Information leakage:** explicit cycle/hub labels in UI/audio make task too easy without demonstrating reasoning.
3. **Experimental confounding:** C's stereo pan may alter perceived loudness; B/C may differ in duration or speech timing.
4. **Layout arbitrariness:** left/right mapping may teach a false “physical” relationship not present in the graph.
5. **Working-memory costs:** many discrete tones can be harder to follow than spoken labels.
6. **Accessibility:** keyboard focus conflict, NVDA/Windows speech overlap or terminal-like interaction can block trials.
7. **Learning and order:** participants improve with practice irrespective of condition.
8. **Hardware/hearing:** stereo perception varies; channel imbalance and headphones affect validity.
9. **Stimulus ambiguity:** multiple correct branches or convergence nodes without clear task wording.
10. **Small sample and selection bias:** small pilots and self-selected technical users do not prove population-wide utility.
11. **Data integrity:** browser blur, stale sessions and cached mappings could distort timing/scoring.
12. **Ethics/privacy:** participant tracking without informed consent and lifecycle policy is unacceptable.

## Open research decisions

- Relative neighbor slots versus stable global pan positions? Test as separate mapping versions, not silently during the same wave.
- Should participants hear all neighboring sounds simultaneously or sequentially? Risk of masking versus parallel pattern discovery.
- Is a **single** correct answer required for every task? For pilots, constrain prompts or allow explicit multi-select.
- How much exact inspection is permissible without reducing the experiment to an adjacency list? Keep equal across conditions, log usage.
- Is primary endpoint a task aggregate or task-specific performance? Fix before confirmatory study.
- How will correctness/time trade-offs be reported? Specify primary contrast, adjustment and thresholds.
- How will fatigue, headphone calibration and screen-reader knowledge be measured?
- What retention delay and graph sets are feasible without a large study burden?

## Decisions that require new evidence

Novelty claims: literature search and full-text evaluation. Perceptual clarity: user pilot. Accessibility: documented NVDA manual testing. Efficacy: controlled trial. Generalization: larger/different graphs and user cohorts. None can be established by passing unit tests alone.
