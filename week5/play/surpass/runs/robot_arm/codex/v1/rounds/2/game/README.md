# Laboratory robot simulator

A photographic, composited simulation of the lab robot picking up and placing a marked carton. Three measured motion variants include the helper returning and reorienting the carton. The background, robot poses, human poses and free carton are separate local assets; no video or complete source frames are played by the simulator.

Controls:
- **Space / Enter:** command a transfer; a press during motion queues one transfer.
- **S:** smoothly hold the robot.
- **Q / E:** slow down / speed up the current transfer.
- **V:** replay the recorded commands.
- **P:** pause. **R:** reset.

The renderer and simulator are deterministic and self-contained. Grasp and placement events are exposed in state.events. Free play supports repeated transfers and timing/speed changes.

Known gaps: this is a measured image-space pose model, not a calibrated 3D robot or arbitrary inverse-kinematics solver. The measured small camera movement is restored after entity compositing. Fine cutout edges, table shadows and some brief human occlusions differ from the footage. Free play uses the three observed target orientations and work locations.

Round 2: the fixed simulation step now matches the measured source frame period (1/56.323 s), removing fractional pose-frame timing jitter. The renderer applies the measured inverse camera registration, and the three recovery segments now use their own robot poses. Free carton anchors match their extracted rigid sprites.

Validation: loaded in headless Chromium; replay/reference comparisons are under ../evidence/compare_*.jpg. A 30-second free-play sequence tested repeated transfer commands, holding and speed changes without browser errors. The temporary test server is shut down by the checker.

Round 2 validation and source/replay comparisons are in ../evidence/round2/. In a consistent local 320-pixel DIS-flow check, mean endpoint error fell from 0.1617 to 0.0821; mean pixel error fell from 8.35 to 3.48. These are local diagnostics, not a prediction of the evaluator score. All 536 replay frames and repeated free-play commands rendered without JavaScript errors.
