# Woodland slingshot simulator

A deterministic reconstruction of the reference game's launch, camera movement, ballistic flight, pig impact, and collapsing timber/glass tower. The scene is composed from cleaned landscape plates, extracted entity/material sprites, moving rigid pieces, and generated particles.

Controls:
- **A / Left:** pull back and hold the bird.
- **W / Up**, **S / Down:** adjust the shot elevation.
- **Space:** release.
- **Pointer drag:** drag left/down and release to shoot; the drag vector sets power and elevation.
- **V:** replay the reference inputs. **P:** pause. **R:** reset.

The replay pulls at 4.39 s and releases at 6.97 s. New shots use the same launch and contact rules. All motion uses fixed simulation steps and seeded randomness.

Validation: loaded `play.html` in headless Chromium, simulated the replay, checked six rendered times, saved three paired comparisons in `/work/evidence/compare_*.jpg`, and exercised an alternative drag shot. No server is required or left running.

Known differences: reconstructed scenery behind the tower is approximate; lower-frame collapse uses a fitted hinge mechanism; individual fragments, particle effects, and some camera interpolation differ from the recording. The waiting birds remain static.
