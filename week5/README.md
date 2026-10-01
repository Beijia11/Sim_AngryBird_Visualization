# Week 5 — Fixing the Control, and Testing the Agent

Page: `index.html`. Two parts, built on the user's outline of 2026-10-01.

## What the page says

0. **Recall** — three points on week 4 and one Code World Model row.
1. **Cosmos — the bug in the control** — classifier-free guidance on the control branch. At
   `text_guidance 3` and `control_guidance 2` the sampler extrapolates six times along "with control
   minus without control"; a short fine-tune from plain Edge still answers a `seg` control by copying
   the black control map, so the extrapolation darkens every generated frame. The fix is to sample at
   `control_guidance 1.0`; training is untouched, because training never uses guidance.
   Three rows, one per sport, all on the **stage 2** checkpoint under **rough** control:
   video / rough guidance / control wrong (guidance 2) / control right (guidance 1).
2. **Agent — one shot to the minimal unit** — the first expectation: one pass, no feedback, a
   simulator whose state draws as the minimal unit, and the mechanism has to be right. A flowchart of
   the protocol (measurements → decide entities, actions, mechanism, poses → write `world.js` →
   write the replay), then ten rows of video / Claude / Astra with the writing time and links to
   play and to `world.js`.
3. **Agent — closed loop against the video model** — the second expectation: mechanism, physics,
   appearance and naturalness at once, in replay and in free play. The metric table (group, metric,
   what it is measured on, what it catches), then ten rows of video / Claude / Astra, each with the
   whole-loop wall clock, the rounds, the best round and links to play it and to its report.

## Sources

| Page part | Where it comes from |
| --- | --- |
| recall row | `week4/clips/test/tennis-match116-light/` (re-encoded, not re-generated) |
| part 1, before and after | `cosmos/experiments/racket_batch24_two_stage/`: `evaluation_c2_superseded/stage2_304/` is guidance 2, `evaluation/stage2_304/` is guidance 1 |
| part 1, control and video | `.../racket_batch24_two_stage/validation/<case>_light/rough_seg.mp4` and `<case>/real_gt.mp4` |
| the diagnosis itself | `racket_batch24_two_stage/README.md`, section "2026-09-27 结论", and `cfg_probe/README.md` |
| section 2 flowchart | `new_harness/simple/protocol/PROTOCOL.md`, condensed by hand |
| section 2 clips and times | `new_harness/simple/runs/<video>/<agent>/v1/`: `reference.mp4`, `build/eval/proxy.mp4`, `run.json` |
| section 3 metric table | `new_harness/surpass/metrics/score.py` (the `unit` string of each metric) |
| section 3 clips and times | `new_harness/surpass/runs/<video>/<agent>/v1/`: `run.json`, `rounds/<best>/eval/render/replay.mp4` |

Part 1's before/after pairs are the same checkpoint, case, seed and prompt; only `control_guidance`
differs. Foreground MAE, rough light: tennis 50.4 → 23.7, table tennis 58.7 → 31.7, badminton
62.8 → 24.3.

## Rebuilding

```bash
cd /shared/perception/personals/beijia/Sim_AngryBird_Visualization/week5
python3 build_week5.py        # the clips, and agent_runs.json
python3 make_agent_rows.py    # the 20 rows between the ROWS markers in index.html
python3 copy_play.py          # the playable builds and reports into play/
```

`build_week5.py` and `copy_play.py` never write outside this folder; the harness and experiment
trees are read only. Clips are H.264 (`libx264`, `yuv420p`): 672x388 at 25 fps for the Cosmos rows,
672x384 at 24 fps for the recall row, 480 wide at the source frame rate for the agent rows, where
the height follows each video's aspect so the three cells of a row line up.

`make_agent_rows.py` replaces only what sits between `<!-- ONESHOT ROWS START/END -->` and
`<!-- LOOP ROWS START/END -->`. Everything else on the page is hand-written.

## play/ — the playable builds, committed

`play/` holds real copies, not a symlink, so every **play**, **world.js** and **rounds** link works
from any server root and on GitHub Pages. `copy_play.py` writes it:

- the 20 one-shot builds whole, about 50 KB each;
- the best closed-loop build of each run, assets included, minus `evidence/`, `.py` and `.log`
  scratch that the page never loads;
- each run's `report.html` and every local file it references, with the per-round videos re-encoded
  to 480 wide so the published site stays under GitHub Pages' 1 GB limit. The originals are
  untouched.

Known gap: inside a report page, "Play round k" works for the best round only. Keeping every
round's build would add about 2.8 GB, because each round stores its own copy of the extracted
sprites.

## Clips built but not on the page

`clips/real/`, `clips/rough/` and `clips/ckpt/` (36 clips, about 10 MB) come from the retrained run
`racket_b6_two_stage_g45`. They were a validation section the user cut on 2026-10-01. Kept so the
section can come back without re-encoding. What it said: stage 1 improves to 600 steps and reaches
the best real-control score so far (16.94 mean foreground MAE against 17.59 for the previous best);
stage 2 does not help this time, 400 steps clearly worse, almost entirely a tennis-only brightening;
rough control stays at about 25 and no new checkpoint beats the old 24.44.

## State

- Checked in a browser 2026-10-01: all clips and links resolve, no page errors, rows stay in sync.
- Open question for the user: the week 4 page still shows the Cosmos numbers measured at
  `control_guidance 2`. It has not been edited.
