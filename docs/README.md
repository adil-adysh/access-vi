# Research documentation index

**Project:** Access-VI / Auditory Graph Explorer  
**Last substantive review:** 2026-10-30  
**Evidence state:** concept and research plan; implementation and participant outcomes have not been independently verified here.

This directory is the source of truth for research intent, testable claims and constraints. Code must not quietly redefine the experiment.

## Reading order

**Start here:** [13 — Governing research strategy: faithful access, validation, audio-first optimization](13-faithful-access-to-audio-first-research-strategy.md) sets priorities, evidence gates, and the distinction between source fidelity and later optimizations.

1. [00 — Research history and existing findings](00-research-history.md): where the idea came from; what is known versus proposed.
2. [01 — Problem statement and scope](01-problem-and-vision.md): research problem and MVP boundaries.
3. [02 — Research foundations](02-research-foundations.md): prior literature, what it demonstrates, and potential contribution.
4. [03 — Questions and hypotheses](03-research-questions.md): falsifiable questions and operational definitions.
5. [04 — Experimental protocol](04-experimental-protocol.md): conditions, tasks, counterbalancing, measurements, ethics.
6. [05 — Sonification design](05-sonification-design.md): semantic audio events, mappings, calibration, comparison integrity.
7. [06 — Technical architecture](06-technical-architecture.md): TypeScript component boundaries and data flow.
8. [07 — Accessibility](07-accessibility.md): NVDA/keyboard/speech behavior and manual verification.
9. [08 — Roadmap and acceptance](08-implementation-roadmap.md): staged delivery and tests.
10. [09 — Decision log and uncertainties](09-decisions-and-risks.md): trade-offs, threats to validity and unresolved choices.
11. [10 — Spatial mental models and auditory graph geometry](10-spatial-mental-models-and-graph-geometry.md): research evidence, stable auditory maps, hypotheses, and staged evaluation.
12. [11 — Governing visual–auditory parity and screen-reader text](11-visual-auditory-parity-governing-rules.md): mandatory rules for matching non-text visual distinctions with sounds and assigning all graph text to NVDA.
13. [12 — Perceptual mapping and auditory Gestalt](12-perceptual-mapping-and-auditory-gestalt.md): research-informed visual-to-sound mappings, first-person observations, testable hypotheses and verification criteria.
14. [13 — Governing research strategy](13-faithful-access-to-audio-first-research-strategy.md): full specification of program stages, acceptance gates and priorities.
15. [References](references.md): cited papers, standards and official APIs with links.

## Terminology

- **Graph:** abstract nodes and directed edges, not necessarily a visual rendering.
- **Node-link diagram:** visual representation of graph structure. Distinct from a numerical line graph/chart.
- **Sonification:** mapping data or structure to non-speech sound.
- **Spatialization:** varying perceived sound position, initially stereo left/center/right.
- **Mental model:** participant's inferred representation of the graph, operationalized through tasks such as edge reconstruction and transfer.
- **Baseline (legacy study):** speech-only interactive access with the same graph semantics and navigation controls.
- **Faithful reference (new program):** independently explorable, source-complete representation for explicitly supported source properties; not necessarily identical to speech-only.

## Evidence labels used throughout

- **Prior research:** supported by a linked published source, with scope and limitations.
- **Conversation-derived:** design intent documented in research discussions, not experimental evidence.
- **Proposed:** an engineering or methodological decision awaiting validation.
- **Unknown:** not yet measured, verified or decided.
- **Observed locally:** requires date, environment, procedure, and a saved test artifact before claiming it.

## Governing research strategy

**Accepted:** [Faithful access first, then evidence-led audio-first optimization](13-faithful-access-to-audio-first-research-strategy.md). Stage 1 builds complete, independently explorable access for the supported source features; Stage 2 validates fidelity and comprehension; Stage 3 tests optional audio-first enhancements while retaining the faithful reference. The stages are **not** the prototype's existing A/B/C experiment conditions. No complete-access or efficacy outcome is yet claimed.

## Governing design rules

**Accepted, mandatory:** [Visual–auditory semantic parity and screen-reader ownership of text](11-visual-auditory-parity-governing-rules.md). Same non-text node appearance means the same intrinsic node sound; distinct appearance means corresponding distinct sound. Graph text (especially node and edge labels) is conveyed via accessible text and the screen reader, not letter-derived tones. Current ID-to-pitch mapping is a documented nonconformance and must be replaced only with a new, versioned research mapping.

## Research integrity

- Do not infer that auditory or spatial representations are better before data exists.
- Keep human-study results distinct from simulated tests and developer intuition.
- Do not reproduce copyrighted research papers in this repository; link and synthesize them.
- Preserve raw task results and versioned conditions; never silently change a mapping mid-study.
- Code changes affecting information exposure or timing require review of the experimental protocol.
