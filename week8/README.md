# Week 8: Agent Harness Design

Release (2026-10-22): the user removed the empty "Ref to Video" section (heading, contents entry, page title) and asked to
publish. Released with the landing-page entry via `origin/main`; earlier notes below mention Ref to Video historically.

Page: `index.html` + `week8.css`. Built from the user's outline (2026-10-21); English, numbered sections,
(1)(2)(3) lists, no icons, no invented content.

## Outline (from the user)

1. **Agent Harness Design**
   - The week 7 VideoPlay harness figure, copied verbatim (`week7/index.html` lines 243–518, `harness.css`, `videoplay/`).
   - **Character: how well should we reconstruct?** Show the Simple tennis example and say: motion is not
     continuous and does not fully follow the style. Then: we want to follow Vid2Player
     (https://arxiv.org/abs/2008.04524). For actions:
     (1) build a state machine: the :8000 page, only the part before "按状态整理的短视频" (source video + live state);
     (2) find the clips and make transitions (skeleton matching → fill in points → MLS): the :8079 `control/?v=2`
         page (now serving the curated v3 page), everything before the clip collections, plus a few states and transitions;
     (3) put them into the game: :8079 `/game/`, game **B** (user confirmed B, not A), compared with Simple · Astra.
2. **Ref to Video**: heading only, no content yet (user's instruction).

## Files

| Path | What | Source |
| --- | --- | --- |
| `index.html`, `week8.css` | page (hand-written; harness block spliced from week 7) | |
| `harness.css`, `videoplay/` | harness figure | `../week7/` |
| `simple/` | Simple · Astra tennis (input `human_tennis.mp4`) | `../week6/play/tennis/simple/` |
| `states/viewer.js` | viewer part of the :8000 page, English, scoped to `#state-viewer` (hand-written port of `app.js`) | `test_animation/tennis_state_machine/dist/app.js` |
| `states/model.json`, `source.mp4`, `exclusive-machine.js` | trimmed English state model, source video, unchanged state lookup | `…/tennis_state_machine/dist/assets/fsm.json`, `assets/source.mp4` |
| `control/` | keyboard control + live state/clip (iframe). `index.html` hand-written English; JS translated; collections filtered by `window.WEEK8_SHOW` | `…/tennis_state_machine/dist/control/` (curated v3) |
| `game/` | Simple world + v3 near player. `index.html` hand-written English; `?embed` shows only B and its controls | `test_animation/tennis_simple_v3/dist/` |
| `build_week8.py`, `i18n_en.py` | copy + translate script; stops if a key is missing or Chinese remains | |

Selected in (2): states Stationary, Left, Forehand, Backhand; transitions Stationary→Left, Left→Forehand,
Forehand→Stationary, Backhand→Left (all "observed in video" relations). Change them in `control/index.html`.

Not packaged: `sequences/` (raw library), `game-before-motion/` (its "Before / after" button is hidden), `control/offline*`.

Rebuild copied/translated files (hand-written files are untouched):

```bash
cd week8 && python3 build_week8.py
```

## Layout changes (2026-10-21, user)

- Simple · Astra example: input video (`simple/reference.mp4`, from `newnew_harness/evaluation/site/assets/human_tennis/`) on the left, the game on the right.
- (1) (2) (3) are step headings (larger display type).
- Control (2): selected state clips (02) and transitions (03) first; below them one row with "Press keys, and the motion
  carries on." on the left and 01 (live state machine, current clip) stacked on the right. Moved by a small script in
  `control/index.html`; "above" wording changed to "on the left" / "below".
- User asked whether "Ours" is the final v3: it is the current /game/ B (bank `curated-offline-v3`, with the 2026-10-20
  hip-trajectory movement revision); copied files match the source. The newer `/code-game/` (tennis_code_harness,
  program-driven skeleton) is a separate experiment and is not on this page.

## Harness figure for the new pipeline (2026-10-22, user)

User's reorganised harness: (1) Decompose the video into static (court, background), passive (ball, scoreboard
bottom left) and dynamic (near player) parts, fixed afterwards; (2) Mechanism for each: simplest flow for passive
parts, rough move for the player; (3) Action: states suited to keyboard play + attributes (e.g. run speed), then back
to (2) to refine Mechanism; (4) Character: action sequences (clips, transitions); (5) Scene: static parts, estimated
depth / layout ("Devs" in the dictated text is read as depth; to confirm). Evaluation drives fixes to Mechanism,
Action and Character, following AHa-3D.

- The user pointed at `week7/videoplay/`; the change is made in `week8/videoplay/` (week 7 is published and left as is).
- `videoplay/figure.html` is the single markup source; `build_week8.py` splices it into `index.html` and the
  standalone `videoplay/index.html`, and regenerates `harness.css` with `build_harness_css.py`.
- Character shows real curated v3 posters (left, forehand, left → forehand). Evaluation cards list candidate metrics
  (my proposal, illustrative); Intent card removed because the new flow starts from the video only.
- 2026-10-22 follow-up: Character card gains a simplified state machine (idle / move / forehand / backhand; node = clip,
  edge = transition, left move → forehand highlighted); the static-parts wire Decompose → Scene is removed.
- 2026-10-22 placement (user): the harness lede, scope line and figure now sit after the whole Character subsection
  (after the (3) game comparison), before 2 Ref to Video.
- Checked in Chromium at 1440 / 2100 px: 41 wire paths with valid coordinates, all images load, no errors.

## (4) Improve through validation (2026-10-22, user)

Added before the harness figure, as step (4) under Character. Source: `test_selfevolve/round_02` (Train = source 0–20 s)
and `test_selfevolve/round_02_validation` (Validation = 20–40 s, frozen round-02 code).
- Train: two synced rows (Simple, ours / v3), each source | proxy before | proxy after; then the list of round-02 changes
  (taken from round_02/README.md and its erratum: Simple root speed easing + input magnitude / main axis; ours vertical
  movement during transitions + depth scale; shared rebuilt relative-speed input; focus clears keys).
- Validation: the "play it yourself: before and after" text (translated) with the four keyboard players
  (`improve/play/`, round_02/interactive shell translated; ours world.js strings translated by build_week8.py), then four
  synced rows: Simple proxy, ours proxy, Simple render, ours render, each next to the 20–40 s source.
- Summary: the user's four points, translated; point 4 "（比如发球 没有" rendered as "(e.g. the serve is missing)" — to confirm.
- Media copied by build_week8.py into `improve/{train,validation}/` with first-frame posters (13 MB). `improve/rows.js`
  syncs each row on its first video. Checked: all 14 videos load, rows play in sync, the four players load, standalone
  keyboard test (move + forehand) works for ours_after and simple_after, no errors, no overflow at 1440 px.

Wording fix (user, 2026-10-22): no "Train" label. The first 20 s is the clip the initial code was improved against;
Validation is the improved, frozen code on the next 20 s not seen when improving it. Summary point 2 now reads: the pose
is not continuous enough, but this does not hurt the video generation quality much.

## Status (2026-10-21)

Done and checked locally in Chromium (Range-capable static server, 1440 and 390 px):
- no page errors, no 4xx, no horizontal overflow; four demo iframes auto-size to content;
- viewer: seeking to 3.8 / 28.3 / 29.0 s shows Forehand / Right / Backhand with the matching transitions;
- control: Left held → J → release goes Left → Forehand → Stationary through stored seams;
- game B embed: Start, Right + J plays transitions and registers a hit; Simple · Astra responds to keys.

Notes: the two games come from different input videos (labelled on the cards). The game embed keeps the original
control note "Both versions get the same input" (A runs hidden). Not committed or pushed yet.
