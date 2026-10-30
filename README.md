# Access-VI — Auditory Graph Explorer

**Status:** research proposal and experimental prototype under development. No human-study results or demonstrated efficacy are claimed.

Access-VI investigates whether interactive nonvisual representations—beginning with a keyboard-first auditory explorer for **directed graphs**—can help blind people independently discover, remember, and reason about structure.

## Governing research direction

**Faithful access comes first.** Establish a complete, independently explorable nonvisual reference for the *supported information* communicated by the original graph, verify its fidelity and user comprehension, then experimentally optimize for auditory interaction without losing original-information access. See the [accepted three-stage research strategy](docs/13-faithful-access-to-audio-first-research-strategy.md) and [visual–auditory parity rule](docs/11-visual-auditory-parity-governing-rules.md). All graph text, including node and edge labels, belongs to the screen reader.

The existing prototype separately compares three **legacy study conditions**: **speech-only exploration**, **non-spatial sonification**, and **stereo-spatial sonification**. These are not the three stages of the research strategy. Their outcomes remain open; this is not a claim that spatial audio is superior.

## Documentation

Start at **[docs/README.md](docs/README.md)** for the complete indexed research plan, related literature, hypotheses, experimental protocol, accessibility requirements, architecture, and implementation roadmap.

## Intended MVP

- Svelte 5 + TypeScript + Vite, Web Audio API, Graphology.
- Accessible keyboard navigation with manual NVDA testing.
- Directed graphs (approximately 5–12 nodes for initial pilots).
- Controlled sound-mapping strategies with consistent semantic information.
- Task-based experiments, anonymous local event logging, and JSON/CSV export.
- No generative AI during recorded trials, no specialized hardware, and no backend initially.

**Important:** A working software prototype and an ethically conducted study are separate milestones. See [docs/04-experimental-protocol.md](docs/04-experimental-protocol.md) before collecting participant data.

## Prior art

The project builds on substantial research in diagram accessibility, including [TADA (CHI 2024)](https://doi.org/10.1145/3613904.3642222). Read [docs/02-research-foundations.md](docs/02-research-foundations.md) before making novelty claims.
