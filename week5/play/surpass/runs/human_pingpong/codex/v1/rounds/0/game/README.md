# Table-tennis rally simulator

A deterministic canvas simulation of the five-second rally. The scene is composed from a cleaned court plate, masked athlete pose atlases, moving shadow layers, and a separately simulated bouncing ball. The opponent responds automatically. The reference action schedule is in `World.replay`.

Controls:
- Space: return; F: alternate return input.
- Arrows or WASD: lateral/depth movement.
- V: replay the reference action schedule.
- R: reset; P: pause.

Validation: loaded in headless Chromium; replay/reference pairs saved at frames 0, 60 and 120 in `/work/evidence/compare_*.jpg`. A 15-second sequence of repeated returns and lateral movement was also rendered.

Known gaps: the ball trajectory is an approximate screen-space model, some fast limb/racket boundaries remain imperfect, and pose blending is limited by the available camera view. Very different input timing can expose pose-transition or foot-contact artifacts. Officials and the score graphic are held static; no scoring event appears in the reference.
