# References and source audit

**Checked during documentation preparation: 2026-10-30.** These links point to publisher, author, official organization or authoritative documentation where possible. This bibliography is selective, not a systematic review.

## Core papers

**[R1]** Larkin, J. H., & Simon, H. A. (1987). *Why a Diagram is (Sometimes) Worth Ten Thousand Words.* Cognitive Science, 11(1), 65–100. DOI: https://doi.org/10.1016/S0364-0213(87)80026-5  
**Use:** conceptual distinction between diagrammatic and sentential representations. Does not validate auditory graph efficacy.

**[R2]** Zhao, Y., Nacenta, M. A., Sukhai, M. A., & Somanath, S. (2024). *TADA: Making Node-link Diagrams Accessible to Blind and Low-Vision People.* CHI 2024. DOI: https://doi.org/10.1145/3613904.3642222  
Author-hosted paper: https://celab.cs.uvic.ca/files/Zhao_TADA.pdf  
**Use:** direct node-link prior art, 15-person formative interviews, 25-person evaluation, touch+sound+speech, multiple exploration methods. Paper notes its implemented links are non-directional. Review full methods before claiming superiority or novelty.

**[R3]** Chundury, P., Jordan, J. B., Reyazuddin, Y., Elmqvist, N., & Lazar, J. (2026). *Sound, Touch, or the Full Monty? A Comparative Study of Accessible Data Exploration Systems for Blind Users.* ACM Transactions on Accessible Computing, 19, 1–41. DOI: https://doi.org/10.1145/3798100  
Accessible author manuscript: https://pmc.ncbi.nlm.nih.gov/articles/PMC13227614/  
**Use:** measured accuracy, time, workload in chart exploration on three devices with 10 blind participants. **Not** directly a directed node-link graph evaluation.

**[R4]** Walker, B. N., & Lowey, M. E. (2004). *Sonification Sandbox: A Graphical Toolkit for Auditory Graphs.* RESNA conference. https://www.resna.org/sites/default/files/legacy/conference/proceedings/2004/Papers/Research/TCS/Sonification.html  
**Use:** earlier systematic sound parameter mapping; note “auditory graph” here refers primarily to data plots.

**[R5]** Enge et al. (2024). *Open Your Ears and Take a Look: A State-of-the-Art Report on the Integration of Sonification and Visualization.* Computer Graphics Forum. DOI: https://doi.org/10.1111/cgf.15114  
**Use:** position the design within broader sonification/visualization work; not proof of efficacy in our setting.

## Measurement, technology and accessibility

**[R6]** NASA. *NASA Task Load Index (TLX).* https://www.nasa.gov/human-systems-integration-division/nasa-task-load-index-tlx/  
**Use:** validated multidimensional subjective workload instrument; choose and document original weighted or raw variant before study.

**[R7]** W3C WAI. *ARIA Authoring Practices: Developing a Keyboard Interface.* https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/  
**Use:** predictable keyboard and focus behavior.

**[R8]** MDN. *Web Audio API* and *StereoPannerNode.* https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API and https://developer.mozilla.org/en-US/docs/Web/API/StereoPannerNode  
**Use:** implementation capabilities, not evidence of auditory cognition.

**[R9]** W3C. *Web Content Accessibility Guidelines (WCAG) 2.2.* https://www.w3.org/TR/wcag/  
**Use:** keyboard operability, no keyboard trap, focus, audio control and accessibility requirements.

**[R10]** W3C. *WAI-ARIA 1.2* (application role). https://www.w3.org/TR/wai-aria/  
**Use:** caution that application role alters screen-reader interaction; test with NVDA, do not place globally.


## Spatial mental models and geometry

**[R11]** Purchase, H. C., Pilcher, C., & Plimmer, B. (2012). *Graph Drawing Aesthetics—Created by Users, Not Algorithms.* IEEE Transactions on Visualization and Computer Graphics, 18(1), 81–92. DOI: https://doi.org/10.1109/TVCG.2010.269  
**Use:** human graph layout preferences (including edge crossings and grid alignment); evidence about sighted visual graph drawing, not auditory maps.

**[R12]** *Cognitive map formation supported by auditory, haptic, and multimodal information in persons with blindness* (2022). Review. PubMed: https://pubmed.ncbi.nlm.nih.gov/35902045/  
**Use:** synthesis of nonvisual route and survey map research, including variability, spatial information and training; not a node-link audio experiment.

**[R13]** Geronazzo, M., Bedin, A., Brayda, L., Campus, C., & Avanzini, F. (2016). *Interactive spatial sonification for non-visual exploration of virtual maps.* International Journal of Human-Computer Studies, 85, 4–15. DOI: https://doi.org/10.1016/j.ijhcs.2015.08.004  
**Use:** modality and virtual-map reconstruction evidence; does not demonstrate the performance of current Access-VI panning.

**[R14]** Robinson-Moore, W. J., Kalal, M., Tennison, J. L., Giudice, N. A., & Gorlewicz, J. L. (2024). *Spatial audio-enhanced multimodal graph rendering for efficient data trend learning on touchscreen devices.* CHI 2024. DOI: https://doi.org/10.1145/3613904.3641959  
Author lab: https://umaine.edu/vemi/publication/spatial-audio-enhanced-multimodal-graph-rendering-for-efficient-data-trend-learning-on-touchscreen-devices/  
**Use:** five-person formative chart study indicating potential trend-recognition benefit but also distorted mental representations. The “graphs” here are statistical charts.

**[R15]** Shafique, S., Zanchi, S., Setti, W., Gori, M., & Picinali, L. (2025). *Does spatialized audio enhance the creation of mental representations?* Frontiers in Neuroscience. DOI: https://doi.org/10.3389/fnins.2025.1660373  
Full text: https://pmc.ncbi.nlm.nih.gov/articles/PMC12574556/  
**Use:** fourteen-participant environmental layout reconstruction comparison with no statistically significant binaural vs non-spatialized difference. This is not proof of equivalence or a directed-graph study.

**[R16]** Chundury, P., Reyazuddin, Y., Jordan, J. B., Lazar, J., & Elmqvist, N. (2023). *TactualPlot: Spatializing Data as Sound using Sensory Substitution for Touchscreen Accessibility.* IEEE Transactions on Visualization and Computer Graphics. DOI: https://doi.org/10.1109/TVCG.2023.3326937  
**Use:** embodied/touch reference frame combined with sound; not validation of keyboard-only stereo mapping.

## Evidence-use policy

When citing prior studies, report sample size, tasks, hardware and study limitations. Do not generalize chart results to node-link graph reasoning without new evidence. Do not reproduce figures or full text from copyrighted works. Update this list with full relevant prior-art systems (e.g. TeDUB, GSK, PLUMB) before any formal novelty statement.
