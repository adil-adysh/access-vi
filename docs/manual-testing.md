# Manual Testing Protocol for Researchers & Evaluators

## 1. Quick Start

Ensure dependencies are installed and start the local development server:

```powershell
npm.cmd install
npm.cmd run dev
```

Open a browser (Google Chrome or Microsoft Edge) at `http://localhost:5173`.

---

## 2. Test Script 1: Free Graph Exploration

1. **Verify Default View:** Check that Graph Explorer loads with **Experiment Graph 1 (Branching & Convergence)**.
2. **Keyboard Traversal:**
   - Click the explorer panel or press <kbd>Tab</kbd> to focus it.
   - Press <kbd>ArrowDown</kbd> to select Node C.
   - Press <kbd>Enter</kbd> to traverse into Node C.
   - Press <kbd>I</kbd> to inspect Node C (verify outgoing connections to D).
   - Press <kbd>R</kbd> to replay the audio representation.
   - Press <kbd>Backspace</kbd> to backtrack to Node A.
   - Press <kbd>Home</kbd> to reset to the start node.
3. **Direction Switch:**
   - Press <kbd>D</kbd> to toggle to Incoming connections.
   - Verify that incoming neighbors are displayed and selectable.

---

## 3. Test Script 2: Graph Import

1. Click the **Import** button in the header.
2. Under *Load Standard Research Graph*, click **Experiment Graph 2 (Feedback Cycle Network)**.
3. Verify that Graph Explorer updates to show 7 nodes and indicates *Has Cycles*.
4. Switch import mode to *Custom Graph Import*, select *Graphviz DOT*, paste:
   ```dot
   digraph Test {
     "X" -> "Y";
     "Y" -> "Z";
     "Z" -> "X";
   }
   ```
5. Click **Load Graph** and verify that the 3-node cycle graph is loaded and navigable.

---

## 4. Test Script 3: Complete Research Experiment Session

1. Click the **Research Experiment** tab.
2. **Consent:** Read the study overview and click *I Understand & Acknowledge Consent*.
3. **Calibration:** Click *Test Centered Audio*, *Test Left Channel*, and *Test Right Channel*. Confirm stereo output.
4. **Practice Training:** Explore the 4-node practice graph. Click *I Am Ready to Begin Experimental Trials*.
5. **Experimental Trials:**
   - For each trial: Click *Start Graph Exploration*, explore the graph, click *Finish Exploration & Enter Response*.
   - Submit answers for Branch Identification, Convergence Identification, Reachability, Cycle Detection, and Mental Model Reconstruction.
6. **Workload Assessment:** Rate the 6 NASA-TLX dimensions (1–10) and click *Submit Workload Rating*.
7. **Complete Session:** Once all condition blocks finish, verify the *Results & Export* tab opens.
8. **Export Data:** Click **Export JSON** and **Export CSV** to verify downloads.
9. **Data Cleanup:** Click *Delete Participant Session Data* to verify IndexedDB deletion.
