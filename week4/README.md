# Week 4 — Finetune with Pair Data

Open `index.html`, or visit
`https://beijia11.github.io/Sim_AngryBird_Visualization/week4/`.

Sections follow the outline given for this week: Dataset, Pair Data Curation,
Training strategy, Result (1) on test set and (2) on game engine, then the same
question on a small model.

## Layout

```
index.html            the page
week4.css             styling; same design tokens as weeks 2 and 3
week4.js              keeps the clips of a row in step, pauses offscreen rows
build_week4.py        re-encodes clips/ from the training and inference folders
source_manifest.json  SHA-256, size and frame count of every source and clip
clips/
  dataset/            one raw clip per sport
  curation/           one training source as original, light and medium
  training/           the same source: guidance, proxy, anchor, target
  test/<case>/        gt, guidance, depth, semantic, cwm, ours, anchor.png
  game/               game, guidance, cwm, ours
  cosmos/stage1/      guidance, gt, base, tuned
  cosmos/stage2/      guidance, gt, stage1, stage2
```

Six clips per test case, two per row, as separate players rather than one tiled
video. Four clips for the game row. All clips are 672x384 at 24 fps: 124 frames
for the test cases, 214 for the game. Total 4.1 MB.

## Sources

Never modified by this folder:

```text
../../data_dynamic_pairs/cwm_train_full_v1/
    inference_step2750_newprompt/validation/<case>/
        target.mp4, guidance.mp4, generated_cwm.mp4, generated_step2750.mp4, anchor.png
    inference_step2750/validation/<case>/
        condition_depth.mp4, condition_semantic.mp4      (same conditions, rendered as video)
../../selfevolve-agent/tennis_cwm_proxy/out/proxy2/
    game_render.mp4, proxy_video.mp4,
    output_newprompt.mp4, generated_step2750_newprompt.mp4
../../cosmos/experiments/
    racket_real_stage1/    real_seg.mp4, real_gt.mp4, evaluation/{base,step400}/.../vision.mp4
    racket_rough_stage2/   rough_seg.mp4, evaluation/{stage1,stage2}/.../vision.mp4
```

Sections 1 to 3 use clips from the training split; the three cases in section 4
and the two in section 5 are held out. The Cosmos-Edge clips are 121 frames at
25 fps and 1.733:1, the aspect that model generates, so the condition and the
ground truth beside them are centre-cropped to match.

The three test cases are `tennis__match116_000_light`,
`tennis__match131_000_medium` and `badminton__match101_000_light`, all held out
from training. Both the test-set and the game clips come from runs whose caption
was encoded with the non-chat presentation, which is the text path this project
uses.

Rebuild with `python3 build_week4.py`, which needs ffmpeg and nothing else.

## State

- The checkpoint shown is step 2750, where training was stopped.
- The comparison is visual. No metric has been computed.

## Next

- Regenerate the same rows from a later checkpoint if training resumes.
- Decide on a metric before claiming anything about motion quality.
