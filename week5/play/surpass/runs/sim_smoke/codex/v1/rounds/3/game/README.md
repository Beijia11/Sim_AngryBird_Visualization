# Incense — a study in smoke

A deterministic simulator of a bronze incense burner and its drifting smoke. The full-resolution fixed scene is reconstructed from the clip; transparent smoke materials move and deform independently under simulated airflow. Replay uses the same actions as free play.

- **V:** replay the nine-second reference sequence.
- **Left / Right:** cross breeze.
- **F (hold):** increase smoke around the mouth.
- **Space:** release a curling billow.
- **Drag:** sweep a local gust through the smoke.
- **E:** extinguish or relight the incense.
- **P / R:** pause / reset.

Validated in headless Chromium using replay captures and a 20-second alternative action sequence. Comparison images and visual/mechanism notes are in `evidence/`.

Known gaps: the smoke uses a reduced two-dimensional flow model and deformable density materials. Small eddies, dispersion, and the exact early thin-plume trajectory differ from the footage. The burner is deliberately stationary, as observed.

Round 1 refines the motion: the billow now separates into three measured material strands with independent curvature and local dissipation. Fine smoke moves through a spatially varying ambient flow field. Wind and gust controls perturb both. Density compositing prevents bright seams where strand geometry overlaps. The photographic scene and existing controls are preserved.

Local round-1 validation reduced mean DIS flow error from 0.0648 to 0.0520 pixels at 320-pixel width (about 20%). The appearance sanity check also improved, with SSIM 0.964 to 0.980. These are local comparisons, not new official evaluator scores. Determinism and the 20-second alternate-input check passed.

Round 3 retains the accepted free-play model and adds a small upper-curl transport correction only when a puff follows sustained feeding. The lower strand and density materials are unchanged. The three supplied free-play schedules were pixel-identical in 60 sampled comparisons. Local curl-centroid and optical-flow checks are recorded in `evidence/round3_motion_validation.json`; official event/trajectory scores remain pending.
