# Paris badminton rally

A deterministic, composed simulator of the ten-second reference rally. The court is a reconstructed clean plate; both players are separate pose sprites with measured motion clips. The shuttle has independent flight/contact state. The source broadcast panels animate separately.

Open `play.html`. Press **V** for the reference replay, **P** to pause, **R** to reset.

- **Arrows / WASD**: move around the near court. Drag toward a court position to move there.
- **Space**: backward footwork and overhead clear.
- **Z**: left rear-court jump smash; **X**: forecourt pickup; **C**: drive/preparation.
- **B**: right defensive return; **Shift**: rush forward and lift.
- **Q**: recover; **E**: split step; **F**: ready/serve.

The opponent responds automatically. Stroke clips can be used in new orders and combined with movement. Shuttle returns require reaching its contact window; a miss settles and is followed by a practice feed.

Known differences: most audience motion is frozen, while four seated official/camera-crew layers animate; the unseen portion of the final high shuttle flight is inferred; fine racket edges and caption-hidden legs are approximate. Free-play poses are drawn from the observed repertoire, so extreme relocations and rapid interruptions can reveal foot sliding or imperfect transitions. This is a projected rally simulator rather than a complete badminton scoring game.

Validation: headless Chromium replay checks at source frames 0, 80 and 200, saved beside the references in `../evidence/compare_*.jpg`; a 30-second mixed-input free-play run checks stable state and rendering. Round 1 adds a full replay flow comparison and calibrated presentation checks in `../evidence/round1/`. Asset generation and validation scripts are retained in `../evidence/`.

Round 1: corrected shuttle trajectories/contact reversals and exposure blur, restored racket-head detail, reproduced the panels’ vertical entry bounce and exits, and compensated the measured two-frame presentation delay. Waiting-stance height changes now blend smoothly.

Round 2: synchronized actor roots, shuttle positions, and broadcast transforms to their photographed exposure; removed duplicate shuttle fragments from actor sprites; restored thin racket pixels and partial off-screen caption movement. The physics still advances continuously. Per-player pose audits and trajectory comparisons are under `../evidence/round2/`.

Round 4: restored faint racket strings during the forward and net pickups, using localized source-derived colour/alpha matting. Accepted motion and controls are unchanged. Local racket-crop error improved by about 9%; replay and 30-second free-play browser checks passed. Paired details and diagnostics are in `../evidence/round4/`.

Round 5: made the opening preparation continuous, aligned shuttle exposures with the middle of each physics step, and refined feather colour and transparency. Later player motion and exposure sampling are preserved. The supplied free-play schedules retain identical physical states and responses. Diagnostics and paired frames are in `../evidence/round5/`.
