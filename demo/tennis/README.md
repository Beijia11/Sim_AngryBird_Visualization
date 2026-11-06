# Tennis demo — rally feedback update

## Goal and scope

2026-11-06: make rallies more forgiving, count tennis scores dynamically, composite characters behind the score box, follow serving rules, and use a distinct finish reaction instead of gameplay resting.

`index.html` retains the source-video / linked-state-graph section and embeds `game/`. The game has its own controller and UI, and reuses the week 10 RGBA assets, pose controllers, bank JSON and fixed court. No asset duplication, new model inference or dependency installation.

## Behavior

- Near-player lateral reach: 0.09 → **0.12 court widths**; depth tolerance: 0.14 → **0.17**. The receiving ring reflects the receiving area.
- A **0.18 s early / 0.14 s late** receiving window replaces the single arrival deadline. J/K is accepted only within 0.80 s of arrival, buffered for 0.50 s, and committed within 0.65 s. Contact checks the actual moving ball using an elliptical reach region, not just its planned target. A legal stroke still has to reach its contact pose; the late window is not a guarantee that every late keypress succeeds.
- During the grace interval the ball continues along the same ground line and descends. It does not stop or steer toward the player. Existing clip phases, legal pairs and locked same-input core loops are reused.
- **One tie-break set:** 0/15/30/40, deuce, advantage; first to six games by two, tie-break at 6–6 to seven by two. A miss awards one point exactly once; S preserves the score and starts the next point, R resets the match. Final scores are locked.
- The server alternates each game (not each point). Near serves the opening game; when far is server it starts subsequent points/second serves automatically after the reaction/delay. The controls explicitly show the current server. Deuce/ad sides alternate each point. Tie-break service follows 1 point, then 2 each. Both actors have an actual serve clip and start behind the appropriate baseline half. Service targets are authored inside the diagonal service box; returns require the bounce. Fault/second-serve/double-fault handling is implemented; normal automatic targeting deliberately produces legal serves.
- Score is drawn **last**, over the original broadcast-score location, so character sprites and skeletons stay underneath it. The original `court-01.jpg` broadcast panel is reused, including Djokovic/Federer names, navy row textures, pale point cells and location. Only score fields, service dot and contextual header are repainted. **User confirmed: start from 0, do not inherit recorded match scores.** One-set game counts occupy the first set column; unused future-set columns stay empty. The recorded BREAK POINT #2 is replaced with SET 1 / live BREAK POINT / TIE BREAK / MATCH COMPLETE.
- `point_over` / `match_over` use an explicit reaction layer. Winners use an existing raised-racket serve pose with a short hop/burst; losers use an existing relaxed stationary pose with a slight slump. These are repurposed poses with procedural display motion, **not newly generated celebration videos**. Gameplay loops stop during the reaction. The final screen remains until R.

The serving/scoring reference is [USTA's scoring guide](https://www.usta.com/en/home/improve/tips-and-instruction/national/tennis-scoring-rules.html) and [ITF service rules](https://itf.uberflip.com/i/623773-rules-of-tennis/11). This remains a fixed-camera demo: players keep their near/far ends, it does not model net-cord lets or a full line judge, and the foot check uses the character's court anchor rather than physical foot geometry.

## Files

- `game/engine.js`: demo-specific match layer, receiving window, serve placement, point settlement and end reactions; extends the existing week 10 match/controller.
- `game/score.js`: deterministic tennis scoring and serve order.
- `game/hud.js`: original-video scoreboard reuse and point/match result overlays.
- `game/app.js`, `index.html`, `style.css`: renderer, controls and embedded game.
- `tests/check_initial.py`: deuce/advantage, tie-break, score locking and ten-shot rally.
- `tests/check_rules.py`: old/new timing and position comparison, both serve sides/players, faults, end states, score compositing and mobile.
- `tests/check_balance.py`: valid/early/late/wide/no-swing outcomes, actual contact location, automatic far service after a game, and a 12-shot rally without a forced cap.
- `tests/check_scoreboard.py`: zero start, original name pixels, live 15–0 rendering and foreground composition.
- `tests/check_edges.py`: service boundaries, pause/resume, moving ball during grace and end poses; records validation hashes.
- `tests/check_embed.py`: real parent iframe under a Pages-style `/repo/` prefix, live serve→agent return→miss→score and responsive layout.
- `evidence/`: JSON results and screenshots; `validation.json` binds the final source hashes to the checks.

The game's HTML base is `../../../week10/atlas/generated-play/`; data and asset URLs retain their original base. Demo code imports use explicit relative paths back to the week 10 modules. Keep `week10/atlas/` available.

## Run and verify

From the repository root:

```bash
python3 week10/serve_week10.py --port 8510
# http://127.0.0.1:8510/demo/tennis/
# direct game: http://127.0.0.1:8510/demo/tennis/game/

/home/beijial2/envs/edenlive/bin/python demo/tennis/tests/check_initial.py
/home/beijial2/envs/edenlive/bin/python demo/tennis/tests/check_rules.py
/home/beijial2/envs/edenlive/bin/python demo/tennis/tests/check_embed.py
/home/beijial2/envs/edenlive/bin/python demo/tennis/tests/check_balance.py
/home/beijial2/envs/edenlive/bin/python demo/tennis/tests/check_scoreboard.py
/home/beijial2/envs/edenlive/bin/python demo/tennis/tests/check_edges.py
```

The first two checks use the existing 8510 preview. The embed check starts and stops its own ephemeral local server. Browser cancellation of a source-video range request can produce a harmless server connection-reset log.

## Status

Completed and approved for publication (2026-11-06): requested gameplay adjustments, subsequently tightened after feedback; automatic agent service on its service games; original-video scoreboard style with a fresh 0–0 score. Normal timing and a 0.08 lateral offset can return; a 0.14 offset, excessively early or late input, and no swing miss. Correct play can still reach 12 shots. Browser checks cover scoring, serve rotation, original scoreboard pixels/live score updates, end reactions, iframe paths and mobile overflow. See `evidence/` for results.

User approved this version for publication. Further subjective tuning can follow new playtesting feedback. This is not a claim that all possible sequences or gameplay routes have been visually reviewed. Assumption: one-set play is appropriate for the demo and its fixed near/far camera remains. No blocking questions. Release target: `main` → GitHub Pages at https://beijia11.github.io/Sim_AngryBird_Visualization/demo/tennis/.

Next: verify the GitHub Pages release, then collect feedback from the published demo.
