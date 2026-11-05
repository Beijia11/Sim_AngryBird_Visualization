# Week 10: Tennis: From Match Video to Game

Static, English copy of four sections of the tennis Motion Atlas site
(`test_world_demo/tennis_motion_hub_v1`, served by its `scripts/serve.py`), for GitHub Pages.

## What the user asked (2026-11-05)

Keep the weekly-page style for week 10 and, like the Motion Atlas home page, give it entries to the sections.
Everything in English. Copy every needed file into the repo (the user uploads it to GitHub).

| Week 10 entry | Motion Atlas section | Path here |
| --- | --- | --- |
| 01 Character Modelling | whole near-player page (`/near/`) | `atlas/near/` |
| 02 Action & Dynamic | players × ball summary (`/summary/`) | `atlas/summary/` |
| 03 Composite | two-player rally (`/play/`) | `atlas/play/` |
| 04 Visual Quality Improvement | motion video comparison (`/generated/`, with its `/generated-play/` game) | `atlas/generated/` |

Not included: the far-player page (`/far/`). Its atlases are copied because Composite and Visual Quality use them;
links into the far-player page (from Action & Dynamic and the Composite "direction reference") show as plain text.

## Files

| Path | What |
| --- | --- |
| `index.html`, `week10.css` | week page: header + four entry cards (hand-written, weekly tokens) |
| `atlas/` | generated copy of the site, one folder per hub route (`near/`, `far/`, `summary/`, `play/`, `generated/`, `generated-play/`, `play-assets/`, `shared/`, `source/`, root JSON/JS/CSS) |
| `mirror_atlas.py` | 1. fetches every URL the four sections use from the running hub server (byte for byte) |
| `compress_atlas.py` | 2. lossy WebP copies of the atlases (see Size) |
| `build_week10.py`, `i18n_week10.py` | 3. relative paths, English text, section names; stops if any Chinese or a translation key is missing |
| `check_week10.py` | browser check (Pages-like sub-path, Range server) |
| `serve_week10.py` | local preview: `python3 week10/serve_week10.py` from the repo root, open http://localhost:8510/week10/ |

The copy is assembled on local disk first (`/home/beijial2/datasets/week10_atlas_{raw,webp_q90,site}`), because tens of
thousands of small writes to the /shared NFS can stall, then copied into `atlas/` in one pass.

## Rebuild

```bash
# hub server must be running (python3 test_world_demo/tennis_motion_hub_v1/scripts/serve.py --port 8137)
cd week10
python3 mirror_atlas.py --server http://127.0.0.1:8137
OPENBLAS_NUM_THREADS=1 /home/beijial2/envs/edenlive/bin/python compress_atlas.py
python3 build_week10.py
rsync -a --delete /home/beijial2/datasets/week10_atlas_site/ atlas/      # -L not needed: hard links are copied as files
```

## How the copy differs from the live site

- Routes: the hub uses absolute routes (`/near/...`, `/summary.js`, `/source/01`); every one is rewritten to a path
  relative to the section pages, which all sit one level below `atlas/`. `/source/<id>` is stored as `source/<id>.mp4`.
- Navigation: `hub-nav.js` is replaced by a four-entry English bar (Character Modelling / Action & Dynamic / Composite /
  Visual Quality) whose home link goes back to this week page. Page eyebrows renamed 01–04 accordingly.
- Text: all UI strings and the Chinese strings in the JSON data (reasons, notes, labels) translated in `i18n_week10.py`.
  Motion logic, data values, IDs, assets and controllers are unchanged.
- Images: atlases re-encoded (Size). Videos, JSON and JPEG unchanged.

## Size (decision to confirm with the user)

All atlases on the live site are lossless WebP; the faithful mirror is 2.1 GB / 33,679 files, over GitHub Pages' 1 GB
published-site limit. `compress_atlas.py` re-encodes them as lossy WebP quality 90 with lossless alpha (sample of 60:
~3.1x smaller, median RGB PSNR 38.7 dB, min 35.7 dB inside the person mask). Final size: see Status.

## Status (2026-11-05)

Done:
- Mirror of the four sections from the hub on :8137: 33,694 URLs fetched; 15 returned 404 on the live site too
  (filesystem paths and `evidence/` images named inside the data, never loaded by a page).
- Atlases: 19,986 WebP, 1871 MB → 688 MB. Whole `atlas/`: **939 MB, 33,679 files**, largest file < 50 MB.
  Side-by-side check of an original vs q90 tile at 2x: no visible difference.
- English: build stops on any remaining Chinese; all JSON templates and code snippets matched.
- Browser check (`check_week10.py`, Chromium, Pages-like sub-path with HTTP Range, 1440 and 390 px):
  four entries link correctly; Character Modelling loads, opens a sequence, plans transitions under keyboard control;
  Action & Dynamic syncs the video (12.00 s → frame 359) with the 672-dot linked graph; Composite serves and rallies with 0
  asset failures; Visual Quality loads 222/222 actions and 8941/8941 transitions and its embedded game is ready.
  No JS errors, no 4xx except the week page favicon, no Chinese on screen, no horizontal overflow.
  `ERR_ABORTED` on `source/*.mp4` is the browser cancelling range requests while seeking (video readyState 4).
- Phone width: the English nav labels overflowed at 390 px; `HUB_NAV_CSS` now lets the bar wrap. Rechecked: all four
  sections have no horizontal overflow at 390 and 1440 px.
- Repo copy `atlas/` verified against the build (same 33,679 paths and sizes, spot `cmp`) and re-run through the browser
  check from the repo.
- Landing page: Week 10 row added. Card drawings copied from the hub home page (`.art` in week10.css), at the user's request.
- Released 2026-11-05 at the user's request: commit `da72c9e` on `main` (made in a clone on local disk to avoid
  33k small object writes on NFS, then this repo fetched and `git reset origin/main`). GitHub Pages deploy succeeded;
  `check_week10.py` against https://beijia11.github.io/Sim_AngryBird_Visualization/week10/ passes for all four sections.

To confirm with the user:
- **Size.** (Deploy succeeded anyway; keep watching.) With week 10 the published site is about 1.5 GB (weeks 2–8 ≈ 545 MB + 939 MB), above GitHub Pages' documented
  1 GB site limit; a single push of ~1 GB is near GitHub's push limits. Options: accept and try; drop or shrink a section
  (e.g. Visual Quality's new RGBA transitions are 392 MB); host the large media elsewhere.
- Name (2026-11-05, user): not "Motion Atlas"; a tennis name instead. Week page / landing row: "Tennis: From Match Video to Game"
  (my wording, can be changed); sub-pages: brand "TENNIS", tab titles "<section> | Tennis" (`BRAND` in build_week10.py).
  The card descriptions are taken from the hub home page (translated); the user only gave the four entry names.
- "Action & Dynamic" was dictated as "Action & Dynamic 结合"; read as the name "Action & Dynamic".

Assumptions: the far-player page is not wanted (only four entries were named); its links show as plain text.
