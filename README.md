# Auditory Graph Explorer — Research Prototype

An accessible, keyboard-first research instrument and prototype engineered to investigate whether interactive auditory representations and spatial sonification enable blind and low-vision individuals to independently construct accurate mental models of directed graphs.

---

## 🛠 Technology Stack

- **Framework:** Svelte 5 with TypeScript & Vite
- **Graph Engine:** Graphology with custom topological traversal, reachability, shortest-path, and cycle detection algorithms
- **Audio Synthesis:** Web Audio API with `OscillatorNode`, customizable ADSR `GainNode` envelopes, `DynamicsCompressorNode` limiter, and `StereoPannerNode` spatial positioning
- **Accessibility:** NVDA-tested, keyboard-first semantics, ARIA live-regions (`polite`/`assertive`), textual fallback tables
- **Storage:** Client-side IndexedDB for full privacy-preserving session logging
- **Export Formats:** Raw JSON and trial-level CSV with NASA-TLX workload integration
- **Testing:** Vitest (unit & integration), Playwright (end-to-end), Axe-core (automated accessibility)

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v20+ or v24+)
- npm

### Installation & Startup

```powershell
# Install dependencies
npm.cmd install

# Start local development server (http://localhost:5173)
npm.cmd run dev

# Run unit and integration tests
npm.cmd test

# Build production bundle
npm.cmd run build
```

---

## 🧪 Experimental Conditions

1. **Condition A (Speech-Only Baseline):** Sequential navigation using screen-reader spoken announcements without non-speech sonification.
2. **Condition B (Non-Spatial Sonification):** Pitch-mapped node tones, upward/downward melodic transition cues, and boundary earcons with centered panning ($\text{pan} = 0.0$).
3. **Condition C (Spatial Sonification):** Stereo-positioned sonification (left for incoming connections, right for outgoing connections) with identical timbre, rhythm, and amplitude as Condition B.

---

## ⌨ Keyboard Navigation Guide

| Key | Action |
| :--- | :--- |
| <kbd>ArrowDown</kbd> / <kbd>J</kbd> | Next Neighbor |
| <kbd>ArrowUp</kbd> / <kbd>K</kbd> | Previous Neighbor |
| <kbd>ArrowRight</kbd> / <kbd>Enter</kbd> | Traverse into selected neighbor |
| <kbd>ArrowLeft</kbd> / <kbd>Backspace</kbd> | Go back in history |
| <kbd>Home</kbd> / <kbd>H</kbd> | Return to start node |
| <kbd>D</kbd> | Toggle connection direction (Outgoing / Incoming) |
| <kbd>R</kbd> | Replay auditory sequence for current node |
| <kbd>I</kbd> | Inspect current node details |
| <kbd>Escape</kbd> | Cancel audio playback |
| <kbd>?</kbd> | Open Keyboard Shortcuts Help |

---

## 📚 Documentation

- [`docs/architecture.md`](docs/architecture.md): System architecture, state machine, and module decomposition
- [`docs/accessibility.md`](docs/accessibility.md): Accessibility principles and NVDA screen reader manual testing protocol
- [`docs/audio-design.md`](docs/audio-design.md): Musical pitch scales, ADSR envelopes, stereo spatialization, and earcon glossary
- [`docs/experiment-design.md`](docs/experiment-design.md): Latin Square counterbalancing, task battery, and NASA-TLX workload
- [`docs/data-schema.md`](docs/data-schema.md): Detailed JSON and CSV data schemas
- [`docs/research-limitations.md`](docs/research-limitations.md): Methodological limitations and research caveats
- [`docs/manual-testing.md`](docs/manual-testing.md): Step-by-step evaluator testing guide

---

## 📄 License

Research Prototype — Open Source MIT License.
