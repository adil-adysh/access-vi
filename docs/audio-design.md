# Audio Engine & Sonification Design

## 1. Research Rationale

Visual network diagrams present topological relationships (branching, cycles, hubs, bottlenecks) simultaneously through 2D space. Sequential screen readers, while accessible, require high working-memory overhead to integrate relationships across many discrete spoken sentences.

The auditory engine translates graph topology into **structured non-speech earcons and micro-sequences** to evaluate whether auditory representations allow mental model construction with reduced cognitive load.

---

## 2. Musical Frequency Mapping (Node Pitch Allocation)

Each graph node identifier is deterministically mapped to a specific musical frequency using an equal-tempered pentatonic scale spanning $C_4$ (261.63 Hz) to $C_6$ (1046.50 Hz):

$$\text{Scale Steps (semitones from } C_4): [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24]$$

$$f = f_0 \times 2^{\frac{s}{12}}$$

- **Node A:** $C_4$ (261.63 Hz)
- **Node B:** $D_4$ (293.66 Hz)
- **Node C:** $E_4$ (329.63 Hz)
- **Node D:** $G_4$ (392.00 Hz)
- **Node E:** $A_4$ (440.00 Hz)
- **Node F:** $C_5$ (523.25 Hz)
- **Node G:** $D_5$ (587.33 Hz)

Pentatonic intervals avoid minor second dissonance and provide intuitive pitch hierarchy.

---

## 3. Directional & Spatial Encoding

### Condition B: Non-Spatial Sonification
- All synthesized tones are centered in the stereo field ($\text{pan} = 0.0$).
- Directionality is conveyed temporally and melodi-cally:
  - **Outgoing sequence:** Root reference tone $\to$ upward sweeping transition tones for each outgoing neighbor.
  - **Incoming sequence:** Root reference tone $\to$ downward sweeping transition tones for each incoming neighbor.

### Condition C: Spatial Sonification
- Utilizes Web Audio `StereoPannerNode` with identical pitch, timbre, rhythm, and amplitude as Condition B:
  - **Outgoing connections:** Distributed across the center-right stereo field:
    $$\text{pan}_{\text{outgoing}} = 0.2 + \left(\frac{i}{N - 1}\right) \times 0.6 \quad (\text{range: } +0.2 \dots +0.8)$$
  - **Incoming connections:** Distributed across the left-center stereo field:
    $$\text{pan}_{\text{incoming}} = -0.8 + \left(\frac{i}{N - 1}\right) \times 0.6 \quad (\text{range: } -0.8 \dots 0.0)$$

---

## 4. Earcon Glossary

| Earcon Event | Acoustic Profile | Purpose |
| :--- | :--- | :--- |
| **Node Focus** | Pure sine tone at node's fundamental frequency (160ms) | Establishes the current local anchor |
| **Traversal Step** | Two-tone upward glissando leap (+4 semitones) | Confirms step transition into target node |
| **Backtrack** | Falling minor-third descending dyad (triangle wave) | Confirms undo/return to previous node in history |
| **Start Reset** | Harmonic major triad chord (Root + Major 3rd + 5th) | Signifies return to global starting node |
| **Boundary (Empty)** | Low muted tone ($C_3$ 130.8 Hz triangle wave, fast decay) | Signals dead-end (no connections in active direction) |
| **Direction Toggle** | Rising dyad for outgoing, falling dyad for incoming | Confirms connection direction switch |
