# Problem statement, vision and scope

## Problem

A graph is a relational data structure. A visual node-link diagram can put many relationships in view simultaneously. Screen-reader access to a textual adjacency list or prose is useful for exact information, but users may need to integrate sequential statements mentally to answer global questions.

This is **not** a claim that blind people cannot reason spatially or that all verbal interfaces are inadequate. It is a hypothesis about task-dependent cognitive costs, measurable within a specific interface and population.

We want to enable **independent structural discovery**—not merely automate the delivery of the answer. A participant should be able to determine whether a path or cycle exists by exploring relations, rather than hearing a generated summary saying “there is a cycle.”

## Research question

Can a keyboard-operated auditory representation of a directed graph support accurate and efficient reasoning about its structure, and does adding non-speech sound and then stereo positioning change outcomes relative to an interactive speech-only baseline?

## Design principle: informational versus computational equivalence

All conditions must expose the same underlying graph, direction, labels and traversal operations. That does not make their **effort** or **perceptual information** identical; we study those differences. A condition must not receive shortcuts or explicit graph-analysis answers unavailable to other conditions.

## Initial tasks

- Identify branching: one node has multiple outgoing edges.
- Identify convergence: one node receives multiple incoming edges.
- Reachability: determine whether a directed path exists between given nodes.
- Cycle detection: decide whether a directed cycle exists and optionally enumerate its edges.
- Reconstruction: reproduce edges after access is removed.
- Transfer: apply learned controls/audio rules to an unfamiliar graph.

## MVP boundaries

**In scope:** 5–12-node directed graphs, deterministic import/generation, semantic keyboard exploration, exact spoken inspection, sound-only sequence and stereo variants, research tasks, logging and export, repeatable local browser use.

**Out of scope initially:** automated extraction from screenshots, generative AI answers, HRTF as a required dependency, tactile hardware, voice-only controls, mobile-specific interaction, backend accounts, multimedia diagram rendering, and claims of validated user benefit.

A diagram may optionally be displayed visually to support sighted collaborators, but it must never be necessary to complete any task.

## Intended contribution, stated cautiously

Previous work already explores nonvisual node-link diagrams (particularly TADA [R2]). Our **candidate** contribution is a rigorous, keyboard-first comparison of speech, non-spatial sound and stereo sound for **directed graph** reasoning, while controlling graph semantics and task procedures. Novelty must be evaluated against the fuller bibliography before publication.

## Success and failure

- **Engineering success:** accessible controls, consistent semantic event mappings, valid tasks, reproducible logs, verified exports.
- **Research success:** trustworthy measurements and analysis, even if auditory/spatial conditions perform the same or worse.
- **Product success:** separate future goal, requiring broader evaluation beyond a prototype.

See [questions](03-research-questions.md), [protocol](04-experimental-protocol.md), and [research foundations](02-research-foundations.md).
