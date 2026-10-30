# Experimental protocol — draft for pilot and later study

**Not ethics-approved, preregistered or executed.** This document is a proposed protocol, not permission to begin a formal human-subjects study. Seek applicable research ethics review/consent procedures before recruitment or publication.

## Sequence of work

### Stage 0: engineering verification (no participants)

Validate graph truth oracles, logging, input timing, audio limits, accessibility and absence of answer leakage. Test with known fixtures and synthetic data. No human efficacy claims.

### Stage 1: formative usability pilot

With informed consent, invite a small diverse group of blind screen-reader users to evaluate controls, clarity, sound discrimination, fatigue and misunderstandings. A practical *planning estimate* is 3–5 pilot users, not a statistical sample-size prescription. Record findings, revise audio mapping, and assign a new mapping version. Do **not** treat pilot trial scores as confirmatory.

### Stage 2: controlled comparison (after pilot)

Within-subject three-condition study. Counterbalance orders across the six permutations ABC, ACB, BAC, BCA, CAB, CBA when feasible; assign different matched graph stimuli so identical graphs are not reused across conditions. Record participant and graph-level factors and condition order.

## Participant flow

1. Accessible study information and explicit consent; clearly explain risks (sound discomfort, fatigue), withdrawal, data policy and researcher contact.
2. Anonymous participant code; record relevant non-identifying factors only if justified (screen-reader proficiency, audio settings, hearing/sound-position discrimination).
3. Hardware check: headphones and left/right channel test, volume calibration to comfortable level, speech configuration, browser/OS/NVDA versions.
4. Practice with **non-study** graphs. Train keyboard controls and the sound legend separately for A, B and C with consistent competency criteria.
5. Condition block: present novel directed-graph tasks and collect answers without providing correctness feedback during scored trials.
6. Short break; workload questionnaire after each block.
7. Optional reconstruction, retention and transfer blocks; schedule identical delays.
8. Debrief and explain that spatial superiority is a hypothesis; request deletion/withdrawal if offered under the consent terms.

## Stimulus construction and stimulus confidentiality

- Begin with directed graphs of ~5–12 nodes for pilot feasibility, not as an assumed perceptual limit.
- Use predetermined seeds and exact JSON snapshots; never regenerate a trial graph between start and evaluation.
- Cover branching, convergence, reachability including negative cases, and directed cycles including acyclic cases.
- Balance task types and graph complexity features across conditions. Perform manual stimulus audit and, where feasible, blinded difficulty review.
- Keep graph IDs separate from study answers in participant-visible output.
- **Stimulus Isolation Architecture**:
  - Research study stimuli (`graph-training`, `graph-practice-cycle`, `graph-exp-1`, `graph-exp-2`, `graph-exp-3`, `graph-transfer`) are strictly segregated from free-exploration datasets.
  - Free-exploration datasets use non-study playground graphs (`free-sandbox-1`, `free-sandbox-2`, `free-sandbox-3`) with distinct topologies and labels.
  - The sample graph import modal exposes only the free-exploration sandboxes. Active or prospective research stimuli are never available in unrestricted import selectors.
  - Free exploration retains unrestricted textual representations and global cycle metrics, while recorded experimental trials enforce `InformationExposurePolicy` (neutral identifiers like "Study Graph 1", suppressed cycle badges, suppressed adjacency matrices, and on-demand local node inspection only).
- **Client-Side Confidentiality Boundaries**:
  - Hiding research stimuli and cycle algorithms in the web UI prevents inadvertent participant exposure and eliminates user-interface leakage.
  - However, in a client-side Single Page Application (SPA), stimulus files and client code are delivered to the browser runtime. This UI boundary is not a cryptographic defense against intentional source-code reverse engineering or browser DevTools inspection.
  - Confirmatory studies must be administered in supervised or proctored environments with blind participant protocols where DevTools inspection is precluded by procedure.

## Trial lifecycle, interruption, and restart policy

- Announce task and start trigger; wait for participant action before activating audio.
- Start a monotonic active timer at the **defined** beginning of the trial (e.g., explicit Start Exploration press). Do not use TTS completion as timing anchor.
- Log timestamped exploration events (node focus, neighbor query, traversal, back, replay, inspection) with offsets.
- Submit typed/selected answer; stop timer and lock further graph queries.
- **Monotonic Timing & Duration Partitioning**:
  - Trial exploration starts when the participant explicitly presses "Start Graph Exploration".
  - Exploration duration (`durationMs`) is measured using a monotonic clock (`performance.now()`).
  - Response duration (`responseDurationMs`) is separately measured from exploration completion to final answer submission.
- **Interruption and Backgrounding Handling**:
  - If the participant navigates away from the active trial (e.g. switches application tabs, minimizes the browser window, or triggers window blur via `visibilitychange`), the system automatically pauses active playback and immediately records an interruption with a timestamped reason.
  - Exploration state transitions from `trial_active` to `trial_interrupted`.
  - While interrupted, audio playback is cancelled, active duration accumulation halts, and application settings remain strictly locked.
- **Interruption Recovery Protocol**:
  - **Restart Trial (Recommended)**: For any non-trivial interruption or potential rehearsal, the participant/researcher should restart the trial. The interrupted attempt is logged as `status: 'interrupted'` with its elapsed duration and reason. A fresh exploration attempt on that trial begins.
  - **Resume Trial**: If the interruption was immediate, inadvertent, and involved no inspection or rehearsal, the trial may be resumed. The paused duration (`pausedDurationMs`) is recorded and excluded from the net exploration time, and `pauseCount` is incremented.
  - **Abandon Trial**: If the participant is fatigued or chooses to withdraw from the trial, it is finalized with `status: 'abandoned'`.
- **Primary Data Analysis Exclusions**:
  - Trials recorded with `status: 'interrupted'`, `'abandoned'`, or `'timeout'` are stored for transparency, attrition analysis, and data provenance.
  - **Only trials with `status: 'completed'` are included in confirmatory accuracy analyses and primary exploration duration statistics.** Incomplete or interrupted data is never silently mislabeled as completed.
- For reconstruction, remove graph access and provide a fully keyboard-accessible edge-entry UI; score directed edges against the ground truth.

## Outcomes and scoring

**Primary:** correctness on each prespecified structural task, plus a documented composite if chosen before study. For multiple valid branch or convergence answers, prompt should specify “select all,” or generator should enforce a unique correct answer.

**Secondary:** active time, timeouts, reconstruction precision/recall/F1, delayed recall, workload ratings, repeated actions and errors. Store raw answers and oracle versions so scores can be independently recalculated. Prefer NASA-TLX or explicitly state if a modified/raw TLX instrument is used [R6].

**Qualitative:** optional think-aloud or post-task interview; note that concurrent speech may interfere with sonification, so post-task interviewing may be preferable.

## Bias and confounding controls

- Learning/order effects: counterbalance and use distinct stimuli.
- Algorithm/answer leakage: no summary that identifies cycles, hubs or correct nodes during those tasks.
- Speech-versus-sound information: exact labels/edges remain accessible in all conditions; audit every extra cue.
- Encoding confound: B/C should be identical audio events except pan trajectory; loudness calibration and channel imbalance need checking.
- Familiarity effects: documented training and graph-naivety checks.
- Hardware and hearing: same headphones per participant and documented left/right discrimination; mono mode for usability but do not include incompatible sessions in a stereo-only inference without a predefined policy.
- Researcher expectancy: standardized instructions and blinded scoring where practical.

## Privacy and ethics

No names, email, precise location, audio recordings or diagnoses by default. Use local anonymized codes; explain IndexedDB storage and local JSON/CSV exports. Implement deletion, consent withdrawal policy, retention schedule, researcher-only ground truth, export confirmation, and explicit study data collection consent. Never upload records to a cloud by default.

## Before confirmatory recruitment

Finalize question wording, stimuli, exclusion rules, consent, data management, analysis method, multiple-comparison handling, sample size/power, handling of missing data, and study registration or ethics review as applicable. Freeze software, mapping and dataset versions for a study wave.
