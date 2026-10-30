# Research Limitations & Methodological Constraints

## 1. Primary Methodological Caveats

1. **Audio Pitch Discrimination Variability:** Not all users possess equal pitch resolution or musical training. The prototype mitigates this by using wide pentatonic intervals and providing redundant spoken node labels and textual inspection options.
2. **Headphone Dependency in Spatial Condition:** Condition C (Spatial Sonification) relies on stereo channel separation. If a user listens via a single mono speaker or smartphone loudspeaker, the spatial cues will collapse into non-spatial audio. An explicit audio calibration step is provided to detect mono setups.
3. **Graph Complexity Ceiling:** The current sonification strategy is optimized for small graphs (4 to 12 nodes). For massive networks ($>50$ nodes), sonification sequences could cause auditory fatigue and perceptual crowding.
4. **Synthetic Evaluator Oracles:** Automated task scoring operates on pure mathematical graph algorithms. While objective, task difficulty metrics (diameter, density) may not perfectly correlate with human cognitive load across all individual exploration paths.
5. **No Visual Rendering Coupling:** The system intentionally avoids visual 2D diagram layouts, focusing on topological understanding. Visual position should not be assumed to have semantic equivalence.

---

## 2. Ethical & Privacy Protections

- Data is collected exclusively client-side via IndexedDB.
- No personal identifying information (PII) is gathered.
- Participants can review, download, or permanently delete their local research records at any time.
