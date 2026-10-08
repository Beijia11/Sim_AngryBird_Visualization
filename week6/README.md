# Week 6: Agent Harness & Real-Time Video Gen

Page: `index.html` + `week6.css` + `week6.js`. Part B clips and chart data come from `build_realtime.py`.
Title and outline are the user's (2026-10-08). Keep their wording; do not add framing paragraphs.

## State (2026-10-08)

- **Part A (Agent Harness): one-step tennis comparison implemented.** Five versions, two per row on desktop and one per row on mobile:
  direct Astra Simple, v2 full-body IK (negative example), v3 preserved source motion,
  v4 physical racket contact, v5 incoming-ball interception. Each card contains
  a playable preview and source links, with a concise tool-to-role description underneath.
  Loop and shared-logic evidence remain placeholders.
- **Part B (Real-Time Video Gen): written.** User asked (2026-10-08): explain what each stage of
  `cosmos/cosmos_distillation` does with formulas and charts, and attach the videos.

User style rules for this page: icons over paragraphs, no long text blocks, English,
no dashes as sentence punctuation.

## Part A outline (from the user)

Following AHa-3D (https://github.com/KevinXu02/aha-3d): a standard agentic use.

1. **A good one step: tool calls.** What we need from the agent: Action Mechanism Fidelity,
   Physical Plausibility, Articulated Motion Naturalness & Consistency. Per case, the agent
   analyses what needs modelling:
   - Tennis: human (motion) and ball (physics).
   - Robot: "xx and xx", **user has not filled this in yet**. Shown as orange `xx` pills.
   - Game: "ordinary".
2. **Loop: which code each metric points to.**
3. **Multi-Video Shared Logic.**
4. **Some ideas:** distill the whole loop into one? And the user's open question (moved here from
   section 1 at the user's request, 2026-10-08): does the agent have to watch the video, or can it
   know human motion and ball physics by itself? (The video is for evaluation?)

## Part B content

Causal Forcing++ distillation of the seg-transfer Cosmos3-Edge into a frame-wise AR student.
One global case switcher (tennis / table tennis / badminton) drives every video row.

| Block | What it shows | Source (all read only) |
| --- | --- | --- |
| teacher to student strip, stage table | steps, attention, history, loss, s/clip, fg MAE, state | `cosmos_distillation/README.md`, `stage*/README.md` |
| 0 Starting point | GT, seg control, teacher | `experiments/racket_batch24_two_stage/validation/<case>/real_{gt,seg}.mp4`, teacher `experiments/racket_b6_two_stage_g45/evaluation/stage1_600/` |
| 1 Stage 1 | attention mask diagram (drawn by `week6.js`), loss, exposure-bias chart, 4 videos | `stage1/evaluation/stage1_250/`, `stage1/evaluation/exposure_bias_step250/` (curves + `gt_history/`) |
| 2 Stage 2 | consistency diagram on the real 48-point shift-5 grid, grid/teacher step/loss/EMA, chart, 4 videos | `stage2/cf_stage2_cd_model.py`, `stage2/evaluation/stage2_500_{4,2}step/`, curves from `stage3/evaluation/validate_iter250/metrics.json` |
| 3 Stage 3 | rollout + DMD diagram, rollout/DMD/critic formulas, chart (start, 250 EMA, 500 raw, 750 raw), raw vs EMA table, 8 videos (top EMA 250/500/750, bottom start + raw 250/500/750) | `stage3/evaluation/stage3_{250,500,750}_2step/`, `stage3/evaluation/raw_vs_ema/` (incl. `stage3_750_raw_2step`), numbers for 750 from `validate_iter750/metrics.json` |
| How close to real time | stat tiles, sampling-time bar chart | `stage2/evaluation/validate_step250/timing.json` (Stage 1), `stage3/evaluation/validate_iter250/timing.json` |

Formulas were checked against the code: the CD loss and teacher Euler step in
`stage2/cf_stage2_cd_model.py`, the VSD gradient `(fake - real) / mean|x - real|` in
`cosmos_framework/model/generator/distillation/common_loss.py`.

Rebuild clips and `rt_data.js` (never writes outside this folder):

```bash
python3 build_realtime.py     # 39 clips in clips/rt/<case>/, 480 wide, H.264, poster per clip
```

Formulas use KaTeX 0.16.11 from jsdelivr (auto-render). Do not put `\(...\)` inside SVG text;
the diagrams use Unicode instead. Write `<` in formulas as `&lt;`, or the browser reads `^{<i}` as an `<i>` tag.

Iteration 750 added 2026-10-08 at the user's request. Headline Stage 3 number is now raw 750
(fg MAE 20.71, last 30 frames 23.41, best late-frame score of any few-step model), following
`validate_iter750/README.md` ("use raw weights for this run"). Speed numbers stay at the iteration 250
measurement (8.7 s / clip): the 750 run measured 13.0 s only because GPU 6 was shared.
Chart palette: 4 slots, validated light and dark (adjacent pairs pass; light yellow/aqua need relief,
given by end-of-line labels and the table).

Not on the page yet: raw iteration 1000 (queued, `raw_vs_ema/queue_1000.sh`) and Stage 4 (export,
full-pipeline timing), shown as a "Next" slot.

## Where Part A content comes from

| Page part | Source | Status |
| --- | --- | --- |
| Tennis playable comparison and tool roles | Frozen programs listed below, `newnew_harness/ours/README.md`, archived case-study descriptions | Five exact snapshots; v2 failure and v5 net-clearance limitation explicitly labelled |
| "Mechanism" column ticked for every case | mechanism-first harness always starts from the Simple mechanism | my reading, check with user |
| Metric groups and metric names in section 2 | `new_harness/surpass/metrics/score.py`, as shown on the week 5 page | names real |
| Metric &rarr; code mapping in section 2 | written by me, labelled "draft" on the page | **needs user confirmation** |
| Section 3 numbers (10 to 20 clips, 2 to 5 unseen, `tennis_logic.py`, `params.json`) | `newnew_harness/README.md`, plan item 3 | plan, not run |

## Next

- User fills in the robot row and confirms the metric &rarr; code mapping.
- Fill the remaining "To place" slots: one loop round and a shared logic result.
- Part B: add iteration 1000 when its validation exists: add it to `SOURCES`, `maes()` and the
  stage3 curves in `build_realtime.py`, rerun, then add the video cells, table rows and chart series.
- Landing page `../index.html` already has the Week 6 row. Committed and pushed to `origin/main` on 2026-10-08 (GitHub Pages).

Icons are an inline SVG sprite at the top of `index.html` (line icons after Lucide, ISC, plus a few
hand drawn: `i-ball`, `i-racket`). Use them as `<svg class="i"><use href="#i-name"/></svg>`.

## Tennis comparison snapshots (2026-10-08)

`build_harness.py` copies only original program directories into `play/tennis/` and
records every copied file's SHA-256 in `play/tennis/manifest.json`. No generated
execution code is edited, no model generation or evaluation loop is run, and no
external workspace path is needed by the served page. Runtime libraries and their
licences are copied with each program. Sources relative to `newnew_harness/evaluation/`:

| Column | Frozen source |
| --- | --- |
| Agent directly generates | `case_studies/tennis_fullbody_ik_failure/simple_baseline/` |
| Harness v2 | `case_studies/tennis_fullbody_ik_failure/program/` |
| Harness v3 | `case_studies/tennis_preserve_simple_v3/program/` |
| Harness v4 | `case_studies/tennis_contact_v4/program/` (includes the historical boot packaging fix) |
| Harness v5 | `runs/clip_006/generations/adaptive_contact_v5/attempts/generate/20261008T152605-4b2563f2/program/` |

Preview PNGs show the actual initial canvas of each program. Clicking a preview
loads its own player in an iframe; full-size and `world.js` links are also provided.
The parent adds compact display styles inside the iframe, without editing saved
program files. The layout uses two cards per row, switching to one below 760px. Program
controls remain in each player. ReferenceMotion, ContactGeometry and InterceptMotion
are harness utilities, not pretrained models. The table reports known observations,
not new scores or proof of improvement across all inputs.

Re-copy exact programs from the workspace: `python3 build_harness.py` (existing
preview PNGs are retained). Preview locally from the repository root:

```bash
python3 -m http.server 8796 --bind 127.0.0.1
# http://localhost:8796/week6/#one-step
```

Validation: all five standalone and embedded programs loaded in local Chromium;
reset/move keyboard smoke checks produced no JavaScript errors, local asset requests
had no HTTP failures, and all copied program hashes match their frozen sources.
The earlier five-column layout has been replaced at the user’s request.
The two-column desktop and single-column mobile layout is checked for overflow.
Desktop and mobile screenshots were inspected. These are presentation/integration
checks, not new gameplay quality evaluations. Nothing has been committed or
published by this change.
