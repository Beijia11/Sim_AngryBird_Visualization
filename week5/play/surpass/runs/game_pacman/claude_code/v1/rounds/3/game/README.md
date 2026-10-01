# Maze chase (Pac-Man style) simulator
- Static camera, 832x480, 10 fps. 19x11 grid maze (cell 36 px, origin 91.8,59.8), wall plate extracted from frame 0.
- Pac-Man: white disc r=16 with animated mouth, 3.33 cells/s, grid movement; arrow keys/WASD queue a turn (taken at next cell center; reversal immediate).
- Dots/capsules eaten on arrival; capsule makes ghost scared (grey sprite) for 2.4 s and reverses it.
- Ghost: sprite cut from video, 2.5 cells/s (2.9 scared). Follows the replay script only while inputs match the replay schedule exactly; otherwise wanders to random targets in the lower maze, chases when Pac-Man is within 4 cells, flees when scared. Scared/normal look cross-fades over 0.4 s; respawned ghost fades in.
- Gaps: no score display, ghost frame-34 jump approximated, no death animation.
