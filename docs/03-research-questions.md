# Research questions, hypotheses and operational definitions

**Scope:** These are questions for the **existing legacy A/B/C comparison**. They do not supersede the accepted [program strategy](13-faithful-access-to-audio-first-research-strategy.md), which defines: (1) source information coverage/fidelity, (2) correct interpretation, (3) mental-model/reasoning fidelity, and (4) empirical benefit of optional audio-first optimization. A/B/C are experimental conditions, not program stages. Legacy trials and data must not be reinterpreted retroactively.

**Status:** preregistration **draft**, not a registered study. Hypotheses and analytic decisions must be locked *before* confirmatory recruitment.

## Conditions

- **A — Interactive speech-only:** keyboard navigation and on-demand spoken labels/edges/direction. No non-speech encoding of graph relations.
- **B — Non-spatial:** same graph and controls; additional structured non-speech audio, centered (pan=0).
- **C — Stereo-spatial:** same as B with panning/sweeps as specified by a **versioned** mapping.

Comparing **A/B** tests the package of added non-speech cues, not “pure modality” if availability or latency differs. Comparing **B/C** better isolates stereo positioning *only if* other audio parameters match. The exact information exposure and speech policy must be audited.

## Primary research question (RQ1)

Does representation condition affect **structural-reasoning answer accuracy** on novel directed graphs?

- **H1 (directional, provisional):** B improves mean trial-level accuracy over A.
- **H2 (directional, provisional):** C improves mean trial-level accuracy over B.
- **Null:** no detectable difference for each contrast.
- **Important:** these hypotheses may be false. The measurement remains valuable in either direction.

### Operational primary endpoint

Proportion of correctly solved, preregistered branching, convergence, reachability and cycle tasks on unfamiliar graphs, at a controlled exploration opportunity. Predefine whether partial credit is possible; recommend exact correctness for binary questions and a separate rubric for multi-edge answers. Avoid mixing reconstruction scores into a single undefined accuracy metric.

## Secondary research questions

- **RQ2—Speed:** differences in active completion time on correct and all trials; report timeout/censoring transparently.
- **RQ3—Workload:** differences in participant-rated mental effort; propose NASA-TLX [R6] after condition blocks, with accessible form and a fixed scoring choice.
- **RQ4—Mental models:** differences in edge reconstruction (precision, recall, F1) after graph access is removed.
- **RQ5—Retention:** ability to answer or reconstruct after a fixed delay, if feasible in the pilot.
- **RQ6—Transfer:** performance on unseen graph topology after learning the audio rules.
- **RQ7—Strategies:** replay counts, node visitation, backtracking, inspection requests and qualitative accounts as explanatory, not automatically causal, measures.

## Defining graph complexity

Represent each stimulus by node count, directed edge count, degree distributions, reachable pairs, directed-cycle count, candidate branching/convergence nodes and shortest-path distribution. Difficulty matching on these features is a *proxy* and does not guarantee equal cognitive difficulty.

## Defining failure and non-inferiority concerns

- No significant difference is not proof of equivalence; report uncertainty intervals.
- A faster condition with lower accuracy may be a trade-off, not an improvement.
- A condition unusable without audio hardware, incompatible with NVDA, or overly demanding in training is not automatically beneficial.
- A participant who requests exact node information is still exploring; distinguish that from an automatic answer-revealing summary.

## Analysis plan (to be finalized before study)

Predefine primary contrasts A–B and B–C, multiplicity handling, handling of incorrect/time-out trials, and participant/graph effects. For repeated trials, consider a mixed-effects logistic model for binary correctness with participant and stimulus variation; use an appropriate time model for skewed durations. Pilot results should be descriptive, not interpreted as confirmatory proof. Power/sample size must be justified after feasibility and expected variance are understood.

Never generate a significance claim in the app UI solely from a percent difference.
