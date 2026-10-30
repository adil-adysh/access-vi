# Research documentation index

**Project:** Access-VI / Auditory Graph Explorer  
**Last substantive review:** 2026-10-30  
**Evidence state:** concept and research plan; implementation and participant outcomes have not been independently verified here.

This directory is the source of truth for research intent, testable claims and constraints. Code must not quietly redefine the experiment.

## Reading order

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
11. [References](references.md): cited papers, standards and official APIs with links.

## Terminology

- **Graph:** abstract nodes and directed edges, not necessarily a visual rendering.
- **Node-link diagram:** visual representation of graph structure. Distinct from a numerical line graph/chart.
- **Sonification:** mapping data or structure to non-speech sound.
- **Spatialization:** varying perceived sound position, initially stereo left/center/right.
- **Mental model:** participant's inferred representation of the graph, operationalized through tasks such as edge reconstruction and transfer.
- **Baseline:** speech-only interactive access with the same graph semantics and navigation controls.

## Evidence labels used throughout

- **Prior research:** supported by a linked published source, with scope and limitations.
- **Conversation-derived:** design intent documented in research discussions, not experimental evidence.
- **Proposed:** an engineering or methodological decision awaiting validation.
- **Unknown:** not yet measured, verified or decided.
- **Observed locally:** requires date, environment, procedure, and a saved test artifact before claiming it.

## Research integrity

- Do not infer that auditory or spatial representations are better before data exists.
- Keep human-study results distinct from simulated tests and developer intuition.
- Do not reproduce copyrighted research papers in this repository; link and synthesize them.
- Preserve raw task results and versioned conditions; never silently change a mapping mid-study.
- Code changes affecting information exposure or timing require review of the experimental protocol.
