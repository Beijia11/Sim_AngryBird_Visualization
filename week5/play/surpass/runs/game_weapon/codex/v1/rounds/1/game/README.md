# Canal optical sight simulator

A deterministic first-person reconstruction of the five-second reference clip. Static scenery is a stitched canal panorama; the rifle, metal sight, transmitted wall view, and moving internal element are separate assets. Aim transitions, camera perspective, recoil, and sway respond to state and input. Replay applies the same controls as free play.

Controls:
- **Shift**: hold to aim; release to lower the rifle.
- **Space**: fire/recoil.
- **A / D**: turn left/right.
- **Up / Down**: adjust view elevation.
- **W**: walk with weapon sway.
- **Drag**: turn the view.
- **V**: reference replay; **P**: pause; **R**: reset.

The view is bounded to the reconstructed canal sector. Hidden scenery is filled approximately, so larger turns and changes in elevation can reveal softened textures. The short aim transition uses aligned extracted poses with continuous transforms rather than a full 3D weapon mesh. Firing is inferred from the internal scope motion; no target, damage, or projectile model is established by the clip. Scope shimmer and subtle optical distortion are approximated.

Evidence and paired reference/render checks are in `/work/evidence/`. `play.html` and `kit.js` are unchanged. No network or persistent server is required.

Round 1: motion now uses separate rim, optical-wall, and internal-element tracks triggered by the fire action. Raising and lowering use distinct measured paths; interrupted lowering reverses smoothly. Local flow error improved from 7.19 to 3.26 pixels.
