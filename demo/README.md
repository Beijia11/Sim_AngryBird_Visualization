# Playable Demos

A multi-section demo page; each section is one playable world. Started 2026-11-05 at the user's request.

| Path | What |
| --- | --- |
| `index.html`, `demo.css` | entry page, one card per section (weekly tokens + the hub card drawings, copied from `week10/week10.css`) |
| `tennis/index.html` | 01 Tennis: source analysis plus the rally game |
| `tennis/game/` | Demo-specific game, dynamic scoring and end reactions; reuses weekly RGBA assets |

## 01 Tennis (user's spec)

1. The "02 / ACTION & DYNAMIC — How the players move, how the ball changes." part of week 10: source video on the left
   (with player/ball overlay, source/rally selectors, frame stepping), linked player × ball × player graph on the right.
2. Below it, "Play with the new RGBA" with the link "Compare with 03 Composite ↗": the two-player game using the
   new RGBA assets.

No media assets are copied. `tennis/index.html` retains its base at `week10/atlas/tennis/` for the video/graph,
and embeds the demo-owned `tennis/game/` controller. The game reuses week 10 RGBA/pose assets through its own base URL.
Keep `week10/atlas/` available. See [Tennis README](tennis/README.md) for controls, rules, validation and limitations.
The shot-by-shot exchange/table that summary.js fills are present but hidden.

Preview: `python3 week10/serve_week10.py` from the repo root, open http://localhost:8510/demo/.

## Status (2026-11-05)

Done, checked in Chromium (local static server, 1440 and 390 px): demo index and Tennis load with no errors or 4xx
(except favicon); video seeks and syncs with the graph (12.00 s → frame 359, 672 graph dots); embedded game reaches
ready; links go to `demo/` and `week10/atlas/play/`; no horizontal overflow.

Eyebrow says "ICML 2027 / Demo" (user: not CVPR). Pushed to `main` at the user's request.
To confirm: the demo is not linked from the landing page; page title "Playable Demos" and the card text are mine.
Live: https://beijia11.github.io/Sim_AngryBird_Visualization/demo/

## Rally feedback update (2026-11-06)
Implemented locally: wider receiving area/timing window; dynamic tennis points/games/set score; scoreboard above character compositing; legal diagonal serves and server rotation; distinct point/match-end reactions. Real browser and Pages-prefix embed checks pass; details and evidence in [tennis/README.md](tennis/README.md). This version was approved for publication on 2026-11-06; the earlier “pushed” status describes the original version.

Follow-up: tightened receiving after playtesting, automated the far player’s service games, and restored the original broadcast scoreboard appearance (Djokovic / Federer), starting from 0 rather than recorded scores. Current checks are documented in the Tennis README; the user approved publishing this version to GitHub Pages on 2026-11-06.
