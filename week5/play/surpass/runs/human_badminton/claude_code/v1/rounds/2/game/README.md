# Badminton rally simulator
Static broadcast camera, 1280x720 @25fps. Clean plate is the median of the clip's frames. Players are drawn from sprite sheets cut from the video (background-difference masks), scaled for perspective by depth.
- Near player (blue): controlled. Arrows/WASD move, Space swings (contact 0.4 s after the press; it returns the shuttle if the shuttle is within reach).
- Far player (red): AI. Moves to where the shuttle will land, returns it toward the near player, and serves again after a missed shuttle.
- Shuttle: parabolic flight in screen space (near→far 1.3 s, far→near 0.85 s) with a ground shadow.
Known gaps: sprite feet are slightly off the shadow; caption overlay is frozen; no pose blending; the far player's path is AI-driven, not the measured one.

Round 1: flight durations come from the measured hit times (far player hits at 1.16/3.68/5.56/8.16 s, near player at 0.4/2.3/4.4/6.56/9.0 s). The far player follows its measured path and moves to the landing spot. The near player's replay keys are generated closed-loop against the measured track. Idle sprites are picked by video time.

Round 2: fixed a double-clock bug (the kit already advances state.t; world.js now uses state.clock). The broadcast caption ("Play of the day" with "presented by", then the player names) is redrawn on its measured timeline over a caption-free plate. Replay keys are regenerated with evidence/tools/gen.js.
