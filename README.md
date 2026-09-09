# Sim_AngryBird_Visualization

Weekly visualisations of fine-tuning NVIDIA Cosmos3-Edge for controllable video
generation, using self-generated Pong and Pac-Man datasets as a world-model testbed.

**Live: https://beijia11.github.io/Sim_AngryBird_Visualization/**

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
