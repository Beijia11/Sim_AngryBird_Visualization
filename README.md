# Sim_AngryBird_Visualization

Weekly visualisations of fine-tuning NVIDIA Cosmos3-Edge for controllable video
generation, using self-generated Pong and Pac-Man datasets as a world-model testbed.

**Live: https://beijia11.github.io/Sim_AngryBird_Visualization/**

Local update (2026-10-08): Week 6's one-step section now contains a playable tennis
comparison: direct Astra, archived full-body IK v2, and harness v3/v4/v5, followed
by concise tool responsibilities. Frozen execution files are copied unchanged;
known failures remain labelled. See [week6/README.md](week6/README.md) for sources,
rebuild and preview commands. Published 2026-10-08.

Week 7 release (2026-10-17): `week7/` contains the Decompose & Combine / AnyVideo2Game report,
playable composition examples, video + intent illustrations, the Harness diagram, and table-tennis training
with its analysis reference images. The landing page links to Week 7. The temporary `week7prepare/`
directory was removed at the user's request after its required assets were copied into `week7/`.
See [week7/README.md](week7/README.md) for provenance and validation.

Week 8 release (2026-10-22): `week8/` is Agent Harness Design: Character (Simple · Astra example, then state machine →
transitions → game B vs Simple · Astra → (4) improve through validation), then the reorganised VideoPlay harness figure.
The empty Ref to Video section was removed at the user's request. See [week8/README.md](week8/README.md).

Week 10 release (2026-11-05): `week10/` is a weekly-style page with four entries into an English, static copy
of the tennis demo site ("Tennis: From Match Video to Game": Character Modelling / Action & Dynamic / Composite / Visual Quality Improvement) under
`week10/atlas/` (939 MB, atlases re-encoded as WebP q90). The whole site is now ~1.5 GB, past GitHub Pages' documented 1 GB limit, but the deploy succeeded; see
[week10/README.md](week10/README.md) for the rebuild steps and the open size decision.

## Layout

```
index.html          landing page -- one row per week, links into each
week2/
  index.html        the week's page; all media paths are relative to this folder
  videos/           H.264 clips plus a poster frame for each
.nojekyll           serve the tree as committed, without Jekyll's path rules
```

Each week is a self-contained folder, so an old week never breaks when a new one
lands, and its URL stays valid: `.../Sim_AngryBird_Visualization/week2/`.

## Adding a week

```bash
cp -r week2 week3                 # start from the previous week's page
rm week3/videos/*                 # then drop in the new clips
# edit week3/index.html, and add a row for it in the root index.html
git add -A && git commit -m "Week 3 ..." && git push
```

Two things worth knowing before adding clips:

- **Encode to H.264.** Videos written by OpenCV's `VideoWriter` with the `mp4v`
  fourcc are MPEG-4 Part 2, which browsers do not decode -- the page shows a dead
  player. Re-encode with ffmpeg/imageio using `libx264` and `-pix_fmt yuv420p`.
- **Keep a poster frame** next to each clip (`<name>.jpg`, frame 0) so the page has
  something to show before anything is played.

## Method

Datasets, training configs, launch commands and evaluation live outside this repo,
in `cosmos/FINETUNE_ON_SPATIAL_MAP.md`.
