# Reconstructing White Line Maze from a 6.1-second video

The only inference input was the supplied `ep0000_style_1_classic_bw.mp4`. No game source code, action labels, spatial-state JSON, or dataset documentation was read. The input path contains the game name, so it would be inaccurate to claim the name was never seen. This implementation was based on video pixels; the name was not used to look up rules.

## Observations and inferred mechanics

The video contains 61 frames at 10 FPS and 832×480 resolution. The first and last samples are 6.0 seconds apart; playback lasts approximately 6.1 seconds.

| Observation | Inference | Confidence |
| --- | --- | --- |
| Walls remain fixed; corridor centers are 36 px apart | A static grid with 19 columns and 11 rows, starting at (92,60) | High; treating wall interiors as inaccessible still requires geometric inference |
| The circular character travels along horizontal and vertical corridors and turns at junctions | Movement can be represented by four classes: up, down, left, and right | High; actual input codes cannot be recovered |
| The player moves 12 px between most consecutive frames | Speed during motion is approximately 120 px/s, or 3⅓ cells/s | High |
| Small dots disappear after the player passes over them | Single-use collectibles | High; no score display appears in the video |
| The first frame contains 85 small dots and 4 large dots | 89 initially visible collectibles | High; objects hidden behind characters cannot be confirmed and were not invented |
| The second character moves independently and pauses roughly once every four frames | An autonomous entity averaging about 90 px/s in ordinary movement segments | Medium; this does not prove it always follows the player |
| The upper-left large dot disappears; the other character darkens from approximately 235 to 119 grayscale at 3.4 s and returns to normal at 5.8 s | A temporary state lasts about 2.4 seconds, possibly triggered by the large dot | High for the visible change; medium for causality, with only one event observed |

Wall outlines were traced as polygons from the first frame. Dots were extracted using connected components. Sprite positions were tracked using bounding boxes and snapped to observed 12 px substeps. Around 3.2 seconds, the large dot and player form a connected pixel region; the bounding box's lower edge was used to correct the estimated center. The corridor inside the central U-shaped wall is accessible.

## Action latents: observable movement classes

Let `z_t ∈ {up, down, left, right, stationary/unidentified}` represent movement between adjacent frames. Nonzero displacement is classified by axis and sign. A stationary frame cannot distinguish no input, wall blocking, repeated frames, or simulation timing.

Per-frame coordinates, timestamps, and motion classes are stored in `evidence/inferred.json`. The coarse player trajectory is shown below. Boundaries between adjacent samples have approximately one frame of uncertainty.

| Interval | Motion |
| --- | --- |
| 0.0–0.1 s | Stationary, cause unknown |
| 0.1–1.6 s | Up, from (200,348) to (200,168) |
| 1.6–2.5 s | Left, to (92,168) |
| 2.5–3.4 s | Up, to (92,60) |
| 3.4–3.7 s | Down, to (92,96) |
| 3.7–4.0 s | Up, back to (92,60) |
| 4.0–5.8 s | Right, to (308,60) |
| 5.8–6.0 s | Down, to (308,84) |

This is an interpretable discrete latent representation; no neural network was trained. Actual keys, control frequency, persistent actions, buffered turns, and an explicit idle action cannot be uniquely identified from this short clip.

A sufficient implementation state is `s=(player position, direction, other character position, remaining dots, temporary-state timer)`. Transitions combine corridor-constrained movement, dot removal on contact, and timed state changes. Rendering converts the state into wall outlines, dots, and two sprites.

## Rules added for playability

- Small dots award 10 points, large dots 50 points, and catching the other character while powered awards 200 points. These values were chosen, not observed.
- Ordinary contact ends the game. Powered contact sends the other character to the center with a one-second delay. The clip contains no collision evidence; these are added rules.
- Collecting all visible dots wins the game. Restart, pause, and touch controls are added features.
- At junctions, the other character approaches the player using shortest corridor distance. While darkened, it selects a direction away from the player. This is an approximate playable policy, not an identified original policy.
- The player continues in its current direction; unavailable turns are buffered until a legal junction. Reversing within a corridor is allowed. These are interaction design choices.
- The playable version moves smoothly. There is insufficient evidence to explain the other character's periodic pauses and its larger position jump from 3.3 to 3.4 seconds. The observed-path replay retains the measured positions.

This is an approximate reconstruction of the visuals and main interactions, not a unique or exact recovery of the original dynamics. Full policies, death animations, multiple levels, and longer-term state require more video or active experiments.

## Playing and reproducing the result

Open `play.html` in a browser for the standalone version. It embeds the code, data, source video, and this report and works offline. For development, open `index.html`, which loads the adjacent `game.js` and `data.js` files. Changes to those files do not automatically update `play.html`.

Use arrow keys or WASD to move, Space to pause, and R to restart. On mobile, use the direction buttons or swipe the maze. **Replay observed path** replays measured coordinates for comparison; it does not validate model predictions.

Alternatively, run this command from the project directory:

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

Then visit `http://127.0.0.1:8765` on the same machine. If the browser runs on another computer, download the game files to that computer or forward port 8765 over SSH.

## File guide

| File | Purpose |
| --- | --- |
| `index.html` | Development entry point, interface, and styles |
| `game.js` | Map geometry, movement, collection, enemy behavior, collisions, rendering, and controls |
| `data.js` | Video measurements used for initialization and observed-path replay |
| `play.html` | Standalone game with embedded assets and documentation |
| `reference.mp4` | Copy of the source video for comparison |
| `analyze_video.py` | Extracts dots, sprite coordinates, and motion classes from the supplied video |
| `test_browser.py` | Browser checks for controls, game behavior, replay, and mobile layout |
| `test_offline.py` | Verifies standalone gameplay with browser networking disabled |
| `REPORT.md` | Observations, inferred mechanics, assumptions, and usage instructions |
| `evidence/frame_*.png` | Source frames sampled every three frames; numbers identify frame indices |
| `evidence/contact_sheet.jpg` | Overview of sampled video frames |
| `evidence/inferred.json` | Structured measurements, including all 61 tracked frames and initial dot positions |
| `evidence/browser.png`, `evidence/mobile.png` | Desktop and mobile screenshots |
| `evidence/validation.txt` | Validation summary |

The analysis script requires OpenCV and NumPy. Browser tests require Playwright and Chrome. The game itself does not require those dependencies.

Validation covers keyboard movement, wall blocking, collection, pause, navigable trajectory coordinates, reachability of every initial dot, replay, power state, both collision outcomes, winning, restarting, and mobile layout and controls. Collision and win checks use controlled states to verify the added rules; they do not prove equivalence with the original game.
