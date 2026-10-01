# Mario 1-1 simulator (round 0)
Simulated: Mario running/jumping across a stitched World 1-1 background plate (median of video frames along the measured camera pan), NES-style camera that scrolls forward only, HUD from frame 0.
Controls: Left/Right (A/D) run, Space/Up/W jump (hold for higher).
Known gaps: no block collisions, enemies, mushroom/power-up logic (Mario becomes big at t=5s), sprites are a few crops (no full run cycle), HUD timer static, replay inputs are fitted by a closed-loop controller to the measured Mario world-x track (evidence/target.json); no platform collisions so on-block heights are wrong.
