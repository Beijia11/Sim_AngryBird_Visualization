# Timber & Flight: reconstructing a game from a screen recording

**Input:** `Screen Recording 2026-09-10 at 10.12.32.mov` (1920×1080, 657 decoded frames, approximately 11.2 seconds).

**Output:** An English browser game with drag-and-release aiming, projectile flight, a destructible wooden tower, blue supports, one green target, three birds, scoring, and offline playback of the cropped reference video.

The supplied recording was the only source for game-specific observations. No original game code, dataset labels, existing recreation projects, or external gameplay guides were read. The video itself visibly identifies the original game, so this is not a claim of being unaware of its name. A generic physics library was used to implement the inferred interactions.

## What was observed

| Evidence in the video | Interpretation | Confidence |
| --- | --- | --- |
| The beginning shows a tall wooden frame, a green target, and two blue inner supports | A level assembled from separate structural pieces, with distinct visual materials | High for geometry and appearance; material properties remain unknown |
| The camera moves from the tower to the launcher | Screen coordinates are camera-dependent | High; zoom also changes apparent size |
| One red character is loaded and two more wait nearby | Three visible birds, likely sequential attempts | High for count; subsequent loading is not shown |
| The loaded character moves left and down while two bands stretch | Aim can be represented by a two-dimensional pull vector | High for motion; the underlying mouse, touch, or controller input is not visible |
| Release is followed by upward/rightward flight, an apex, then descent | A ballistic model with gravity is a useful approximation | High for qualitative motion; exact acceleration cannot be recovered from this recording |
| The character reaches the upper frame and the structure rotates and breaks | Rigid-body impacts, loss of support, and breakable materials | High qualitatively; masses, friction, and fracture thresholds are unidentified |
| The green target disappears and a green `5000` popup appears | Target removal contributes approximately 5,000 points | High for the visible popup and disappearance; exact collision criteria are unknown |
| The displayed score rises from 0 to 9560 during collapse | Scoring includes more than the target alone | High; individual damage and destruction rewards cannot be fully separated |
| The clip ends during the aftermath | Victory UI, failure rules, and later levels are not observed | High |

Approximate event times:

- **0.0–1.2 s:** initial tower view and camera movement toward the launcher.
- **1.8–4.4 s:** the loaded bird rests at the launcher, with two waiting birds visible.
- **4.5–6.86 s:** the bird is held behind/below the launcher, with small aiming adjustments.
- **6.9 s:** release; the bird starts free flight.
- **7.0–8.2 s:** flight with camera pan and zoom; the apex is visible near 8.0 s in screen coordinates.
- **8.25–8.4 s:** upper-frame impact, target removal, and scoring effects.
- **8.4–11.2 s:** structural collapse continues; no completion screen is shown.

These timestamps use decoded frame indices divided by nominal average FPS. The source is a screen recording; repeated imagery and frame timing make them approximate rather than exact input timestamps.

## Action representation

An interpretable action representation is:

```text
z = (phase, pull_dx, pull_dy)
phase ∈ {loaded, pulling, holding, released, passive_flight}
launch_velocity ≈ -k × pull_vector
```

The stable pre-release view shows the main red region moving roughly from `(427,377)` to `(271,457)` in the gameplay crop. This implies a pull of about `(-156,+80)` image pixels, or a launch direction about 27° above the rightward horizontal. These are segmented red-region centroids, not calibrated sprite centers or original control values.

The vector suggests direction; it does not identify the original spring constant. One observed pull cannot establish whether launch speed is linear, capped, nonlinear, or otherwise transformed. The reconstruction uses a capped linear mapping as a practical choice.

`evidence/action_latents.json` records this abstraction and its limitations. No neural network was trained and no original action labels were used.

## Video analysis

The fixed gameplay crop is `(x=60, y=239, width=1248, height=697)`, excluding the browser, recommendations, and emulator menu. The cropped reference is encoded as local WebM for browser playback.

`analyze_video.py` performs:

1. Sequential decoding of the supplied MOV.
2. Cropping the gameplay region and writing a reduced-resolution reference video.
3. Sampling approximately every six frames.
4. Extracting red connected components as candidate character regions.
5. Tracking image corners and taking median horizontal optical flow as a rough camera-motion estimate.
6. Saving measurements and an annotated event list in `evidence/inferred.json`.

The red candidates are not guaranteed character identities: waiting birds, beaks, effects, and fragments can also qualify. The camera estimate is unreliable during zoom, large pans, and scenes with too few matched points. It is diagnostic evidence, not an accurate world-coordinate trajectory. Physics parameters were therefore chosen for playability instead of being presented as fitted physical constants.

Tower geometry was manually transcribed from the first clear frame into 12 dynamic rectangular pieces: 10 wood pieces and 2 blue supports, plus one circular green target. A fixed deck and the ground support them. Relative structure proportions are preserved approximately; launcher-to-tower distance is estimated because the whole level is not shown at one fixed scale.

## Implementation choices and limits

- **World:** a 1280×720 canvas shows the whole level. The source pans and zooms; the recreation uses a fixed camera for aiming and touch accessibility.
- **Actions:** drag the bird backward and release. Angle/strength sliders offer an alternative. An aim preview, a sample shot, pause, restart, and a next-bird button are added conveniences.
- **Flight:** pull radius is capped at 104 canvas pixels. Initial velocity is proportional to the opposite pull vector. Gravity and playback speed are tuned constants, not measurements of the original game's internal settings.
- **Physics:** independent rigid bodies collide, rotate, settle, and lose support. The frame is not an animation triggered by a hit. Blue supports have lower durability than wood; this relative strength is an assumption.
- **Damage:** relative collision speed determines damage. Broken pieces are removed from the physics world and replaced with visual fragments. Fragment-by-fragment fracture physics is not reproduced.
- **Scores:** removing the green target gives 5,000 points, consistent with the observed popup. Wood gives 150 and blue supports 300 when destroyed; these individual rewards are chosen and do not reproduce the original final score of 9560.
- **Attempts:** three birds are available, matching the visible count. Reuse timing, clearing the target as the win condition, and failure after three missed attempts are added rules.
- **Artwork:** the bird, target, landscape, launcher, wood, and supports are redrawn using canvas paths. No art assets were extracted from external games. This is a visual approximation, not a pixel-perfect copy.
- **Audio and extra powers:** omitted because this analysis did not establish their mechanics. The source is available for visual comparison; the generated reference video contains no audio.

The physical response follows the general-purpose [Matter.js Body API](https://brm.io/matter-js/docs/classes/Body.html) and [Engine API](https://brm.io/matter-js/docs/classes/Engine.html). Matter.js 0.20.0 is vendored locally under its MIT license in `vendor/LICENSE-matter.txt`. Those references were used for implementation, not to infer the original game's rules.

## Run and edit

Download **`play.html`** to your own computer and open it with Chrome or Edge. The game, physics engine, cropped video, and report are embedded in one file. No server or network connection is required.

For development, open `index.html` alongside `game.js` and `vendor/matter.min.js`. Edit `game.js` to change physics or rendering and `index.html` to change the interface. Run `python3 build.py` afterward to regenerate the standalone file and ZIP archive.

Controls:

- Drag the loaded red bird left/down, then release to launch right/up.
- Alternatively set angle and strength and press **Launch with these settings**.
- **Try a sample shot** demonstrates a useful angle; it is not a replay of the measured source trajectory.
- **R:** reset. **Space:** pause/resume when focus is outside native controls. **N:** load the next bird once available.
- Native buttons, sliders, and video retain their normal keyboard behavior.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | English interface, layout, styles, and development entry point |
| `game.js` | Physics state, level geometry, rendering, input, damage, score, and attempt handling |
| `play.html` | Standalone offline game with embedded engine, source crop, and report |
| `reference.webm` | Gameplay-only crop of the supplied recording |
| `analyze_video.py` | Reproducible video analysis and crop export |
| `build.py` | Rebuilds the standalone page and distributable ZIP |
| `test_browser.py` | Browser checks for launch, physics, progression, controls, mobile layout, and offline use |
| `check_game.py` | Development diagnostic: state snapshots and rendered previews |
| `REPORT.md` | This evidence and implementation report |
| `vendor/matter.min.js` | Local generic physics engine |
| `vendor/LICENSE-matter.txt` | Engine license |
| `evidence/metadata.json` | Source resolution, frame count, average FPS, and duration |
| `evidence/inferred.json` | Red-region measurements, approximate camera flow, and events |
| `evidence/action_latents.json` | Interpretable action phases and approximate pull vector |
| `evidence/frame_*.png` | Sampled original recording frames |
| `evidence/crop_frame_*.png` | Selected gameplay-only screenshots |
| `evidence/contact_sheet.jpg` | Overview of the sampled recording |
| `evidence/browser.png`, `evidence/mobile.png`, `evidence/after_shot.png` | Recreation screenshots |
| `evidence/validation.json` | Browser validation results |

Analysis requires Python, OpenCV, and NumPy. Testing requires Python, Playwright, and Chrome. Building uses only the Python standard library. Playing requires only a browser.
