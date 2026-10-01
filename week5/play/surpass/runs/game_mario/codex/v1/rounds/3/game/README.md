# Mushroom Kingdom simulator

A composed recreation of the reference platform-game excerpt. Local extracted scenery and sprites are driven by movement, relative jump clips, collision geometry, walking enemies, mushroom emergence and collection, growth animation, and a score/time display.

Controls: Left/Right arrows move, Space or Up jumps, Shift runs. V plays the reference input sequence, P pauses, R resets. Open play.html directly; no server is required.

Round 1 improves replay input integration, camera following, enemy speed and direction, stomp timing, separate brick and question-block contacts, mushroom emergence/travel, and growth poses. Jump profiles start from the current support in free play. Question blocks animate their native color cycle.

Validation: headless Chromium rendered matching reference/replay frames. The three supplied free-play schedules were rolled out with finite-state and displacement checks. Evidence and local before/after trajectory measurements are under /work/evidence/round1/. These local measurements are not new evaluator scores.

Remaining differences: some source compression and interpolation artifacts are not reproduced; character running pose cadence and a few late jump frames remain approximate. Enemy damage, terrain beyond the excerpt, and some collision edge cases are simplified.

Round 3: corrected the upward motion and lifetime of score popups, extracted a proper squashed-enemy pose, and kept that pose at the contact location. Corrected the final camera follow offset and fitted only the final four replay movement inputs. Accepted movement, jump clips, collision rules, and controls remain intact. The three supplied free-play schedules have identical physical trajectories before and after these changes. Local final-segment camera error fell from about 18 to 7 pixels; these are local measurements, not new evaluator scores. Chromium comparisons and regression results are under /work/evidence/round3/.
