A deterministic tennis-rally simulator composed from a clean court plate, two masked player motion libraries, retargetable footwork, racket swings, projected ball trajectories, and moving shadows.

Open play.html. Controls: arrows or WASD move, Space swings, click/drag positions the near player, Enter starts another serve. V plays the reference action sequence; P pauses; R resets.

Replay actions select local motion clips and positioning targets. Free play uses the same actor assets and motion state, with accelerated movement, gait cycles, swing contact windows, automatic opponent returns, and misses. Assets are local; no network or video playback is required.

Validation: headless Chromium replay captures at reference frames 30, 180 and 340, plus a 15-second alternating movement/swing free-play run. Side-by-side images are in evidence/compare_*.jpg. No browser or server is left running.

Remaining differences: spectators are static, transparent racket strings and fast blur are approximate, some pose masks have soft edges, and ball flight uses calibrated projected arcs rather than a full 3D spin/contact model. Free-play animation coverage is limited to motions visible in this rally.

Round 2: repaired costume and racket masks, separated ball pixels from the player atlas, measured missing ball arcs and near-contact exposures, and carried phase continuously between compatible motion clips. Final comparisons and validation are in evidence/round2/. Local checks are recorded in motion_metrics.json and mask_metrics.json; these do not predict the evaluator's scores.

Round 4: ball shutter blur now follows the current flight leg through bounces and hits. Both actors use pose-keyed measured shadow alpha masks. The accepted body assets, ball centers, contact timing, controls and free-play movement remain unchanged. Evidence: evidence/round4/compare_*.jpg, replay_after.mp4, exposure_comparison.json, shadow_comparison.json, state_check.json and validation.json.
