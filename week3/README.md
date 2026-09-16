# Week 3 — Agent and video generation model

Open `index.html`, or visit
`https://beijia11.github.io/Sim_AngryBird_Visualization/week3/`.

The page asks two questions about link 1 of the pipeline
(`video clip → agent → video model → result`) and answers both with recorded
evidence:

1. **Can the agent self-evolve by watching?** No — five iterations across two
   games, each one opened by a human sentence. The page shows the game screen of
   each iteration and the one-line prompt that preceded it, and nothing else.
2. **Can the reference appearance be matched by the agent alone?** No — it is
   either imitated with hand-written drawing code, or copied in fragments out of
   the source video. Frame comparisons for both games.

## Layout

```
index.html            the page
week3.css             styling; same design tokens as week2
week3.js              lazy game loading and iframe auto-sizing
build_week3.py        regenerates games/ and figures/ from the source folders
source_manifest.json  SHA-256 of every copied runtime file
figures/              frame comparisons and launcher posters (generated)
games/
  _shared/            files byte-identical across iterations (data.js, motion_data.js)
  ab-v1/ ab-v2/       Angry Birds iterations 1 and 2
  tennis-v1/ -v2/ -v3/  tennis iterations 1 to 3
```

## Sources

The five iterations live outside this repository:

```text
../../angrybird_selfimprovement/after
../../angrybird_selfimprovement2/after
../../tennis_selfimprovement/after
../../tennis_selfimprovement2/after
../../tennis_selfimprovement3/after
```

Rerun `python3 build_week3.py` after changing any of them. It rewrites
`games/`, `figures/` and `source_manifest.json`; it never touches the source
folders, and it never touches `index.html`, which is maintained by hand.

## How the embedded games work

Each source `after/index.html` is a full magazine-style result page: masthead,
headline, explanatory cards, a `<details>` holding the reference video, a
footer. `build_week3.py` copies only the files the game actually *loads* —
leaving `REPORT.md`, `play.html`, the reference video and the `assets/`
provenance copies behind — then appends an override stylesheet that hides
everything except the canvas, its controls and the in-game HUD. The result is
written as `embed.html`. This is the same approach as `week2/sync_astra.py`.

Two consequences worth knowing:

- **Shared payloads are copied once.** `motion_data.js` is 13.8 MB of recorded
  player frames and is byte-identical between tennis 2 and 3, so it lives in
  `games/_shared/` and the generated `embed.html` has its `<script src>`
  rewritten to point there. The whole week is ~17 MB rather than ~31 MB.
- **Nothing loads until you press play.** Each game sits behind a poster image
  and a button; the iframe's `src` is `about:blank` until then. Closing a game
  sets it back, which stops its simulation loop.

Each `embed.html` measures itself and posts its height to the parent, which
sizes the iframe — so a game is never a scrollbox inside the page.

## The quoted prompts

The sentences between iterations are **one-sentence paraphrases**, not verbatim
transcripts. Each was reconstructed from the run's own record of what it knew
before editing — `evidence/observations_before_edit.json` and the "scope and
provenance" section of each `REPORT.md`, where every run states its own
non-blind status. For example, Angry Birds 2 records
`"Non-blind: prior user feedback mentioned physics and appearance"`, which is
the basis for the prompt shown above that iteration.

## Validation

```bash
/shared/perception/personals/beijia/browsertools/venv/bin/python validate_week3.py
```

Drives real Chrome (`/opt/google/chrome/chrome`) against a locally served copy of
the repository. For each of the five iterations it presses that iteration's play
button, waits for the game to report itself ready, and then checks that the
canvas is visible, that nothing from the surrounding report page leaked into the
embed, that the iframe was sized by the `postMessage` handler rather than left at
its 720 px default, and that **Close game** returns the frame to `about:blank`.
It also confirms every figure loads and that no frame fetches anything before
the button is pressed. Results and screenshots are written to `validation/`.

Two things this check caught, worth remembering if the build is changed:

- **A hidden `<video src>` is still fetched.** The first version hid the source
  video's `<details>` block in CSS, and every Angry Birds embed then 404'd on
  `reference.webm`. `build_week3.py` now deletes that block from the HTML.
- **`loading="lazy"` images never load during a Playwright full-page
  screenshot**, because it captures by resizing rather than scrolling. The check
  scrolls the document first, the way a reader does.

Playwright lives in a venv at `/shared/perception/personals/beijia/browsertools/`
and drives the system Chrome, so no browser download is needed.
