# Research Experiment Design & Methodology

## 1. Study Design

The experiment uses a **Within-Subject Repeated Measures** design comparing three conditions:

1. **Condition A (Speech-Only Baseline):** Sequential keyboard navigation with screen-reader style spoken announcements. No non-speech sound cues.
2. **Condition B (Non-Spatial Sonification):** Spoken announcements plus pitch-mapped node earcons, melodic transitions, and boundary cues (all centered).
3. **Condition C (Spatial Sonification):** Pitch-mapped sonification with stereo spatial separation (left for incoming, right for outgoing).

---

## 2. Counterbalancing & Latin Square Ordering

To prevent order effects and skill transfer confounds across conditions, participants are assigned to one of six balanced permutations:

1. $A \to B \to C$
2. $B \to C \to A$
3. $C \to A \to B$
4. $A \to C \to B$
5. $B \to A \to C$
6. $C \to B \to A$

Different, matched experimental graphs ($G_{\text{exp1}}, G_{\text{exp2}}, G_{\text{exp3}}$) are presented across blocks so participants never encounter identical graph topologies in multiple conditions.

---

## 3. Standard Research Task Battery

For each graph condition block, participants complete five standardized graph reasoning tasks:

1. **Branch Identification:** Identify which node possesses an out-degree $\ge 2$. (Evaluates divergent path detection).
2. **Convergence Identification:** Identify which node receives multiple incoming edges ($\text{in-degree} \ge 2$). (Evaluates confluence detection).
3. **Reachability Query:** Determine whether a path exists from Node $X$ to Node $Y$ following directed edges.
4. **Cycle Identification:** Determine whether the graph contains a directed cycle loop ($A \to B \to C \to A$).
5. **Mental Model Edge Reconstruction:** Enter the reconstructed set of directed edges discovered. Evaluated using Precision, Recall, and F1 Score against the ground truth.

---

## 4. Workload Assessment (NASA-TLX)

At the conclusion of each condition block, participants complete a standardized 6-dimension workload assessment (scale 1–10):

1. **Mental Demand:** How mentally demanding was the exploration?
2. **Physical Demand:** How physically demanding was the keyboard interaction?
3. **Temporal Demand:** How rushed was the pace?
4. **Performance:** Perceived success in understanding the graph.
5. **Effort:** How hard did you have to work to achieve your performance level?
6. **Frustration:** Insecurity, irritation, or stress level.
