# Humanoid stair traversal

A deterministic, input-driven reconstruction of the robot climbing, turning on, and descending the test staircase. It composites a reconstructed room, isolated robot poses, articulated cast shadows, slight camera motion, and video annotations. It does not display complete video frames.

Controls:
- Right / D: walk uphill.
- Left / A: walk downhill; turn first if needed.
- Space: turn around.
- Up / W: take one step in the facing direction.
- V: reference replay. P: pause. R: reset.

The replay lasts 9.5 seconds. The gait phase advances with intent, so interrupted or reordered inputs produce different motion. Early turns preserve the current root position and blend between action clips. Motion is kinematic, based on observed poses, rather than a torque-driven robot dynamics model.

Known gaps: arbitrary turns midway through a riser can have imperfect foot support; the finite motion library stops at its endpoints; tiny metallic highlights and contact-shadow boundaries are approximate. The reconstructed background and text have small texture and typography differences. No unseen viewpoints or actions are invented.

Validation: loaded the actual play.html in headless Chromium, rolled out the scheduled actions at 50 Hz, and saved reference/render comparisons under evidence/compare_*.jpg. The browser reported no JavaScript errors. Source measurement notes and labelled mechanism decisions are in evidence/.

Round 1 motion refinement: native 50 Hz pose/shadow samples, a matching fixed simulation step, subpixel affine background camera calibration, continuous shadow transmission across fixtures, and measured annotation fade timing. Local DIS flow error fell from 0.13767 to 0.05222; this is a local comparison, not an official evaluator score. The three supplied free-play schedules were rerun twice each to check determinism and finite state.

Round 3: restored the cropped supporting shin and foot around source frames 76–83. The correction affects only the lower sprite edge and blends into neighboring poses (73–87). Expanded drawing bounds are separate from the accepted locomotion roots, preserving the original control-state trajectories. Broader mask edits were discarded. Official post-change naturalness and pose scores remain pending.
