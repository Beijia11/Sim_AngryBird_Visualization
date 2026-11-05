# Playable Demos

A multi-section demo page; each section is one playable world. Started 2026-11-05 at the user's request.

| Path | What |
| --- | --- |
| `index.html`, `demo.css` | entry page, one card per section (weekly tokens + the hub card drawings, copied from `week10/week10.css`) |
| `tennis/index.html` | 01 Tennis |

## 01 Tennis (user's spec)

1. The "02 / ACTION & DYNAMIC — How the players move, how the ball changes." part of week 10: source video on the left
   (with player/ball overlay, source/rally selectors, frame stepping), linked player × ball × player graph on the right.
2. Below it, "Play with the new RGBA" with the link "Compare with 03 Composite ↗": the two-player game using the
   new RGBA assets.

No assets are copied. `tennis/index.html` sets `<base href="../../week10/atlas/tennis/">`, so the unchanged week 10
`summary.js`, data, videos and the `generated-play/` game resolve exactly as on the week 10 Action & Dynamic page.
Consequences: every relative URL in that page is written relative to `week10/atlas/tennis/`; the demo breaks if
`week10/atlas/` is moved or removed. The shot-by-shot exchange / table that `summary.js` also fills are present but
hidden. The game iframe's week 10 section bar is hidden by a small same-origin style injection.

Preview: `python3 week10/serve_week10.py` from the repo root, open http://localhost:8510/demo/.

## Status (2026-11-05)

Done, checked in Chromium (local static server, 1440 and 390 px): demo index and Tennis load with no errors or 4xx
(except favicon); video seeks and syncs with the graph (12.00 s → frame 359, 672 graph dots); embedded game reaches
ready; links go to `demo/` and `week10/atlas/play/`; no horizontal overflow.

Eyebrow says "ICML 2027 / Demo" (user: not CVPR). Pushed to `main` at the user's request.
To confirm: the demo is not linked from the landing page; page title "Playable Demos" and the card text are mine.
Live: https://beijia11.github.io/Sim_AngryBird_Visualization/demo/
