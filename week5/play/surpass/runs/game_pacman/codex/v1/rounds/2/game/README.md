# Monochrome Maze

A deterministic reconstruction of the reference maze game, composed from an extracted wall plate, collectible pellets, player mouth poses, and ghost sprites. Both actors move through the measured corridor graph.

Arrow keys or WASD steer. Direction continues until blocked; turns queue for the next valid intersection. V replays the clip, P pauses, and R resets.

The ghost intercepts an approaching player and pursues alternate routes through the maze. Power pellets trigger its frightened retreat. Collision recovery fades the player out and back in while the ghost continues moving; buffered controls survive recovery.

Round 2 validation: all 61 reference-time replay frames are pixel-identical to the accepted build. All three evaluator free-play schedules were rendered in Chromium, and their sampled actor positions passed wall-clearance checks. Comparison images and clips are under `/work/evidence/round2/`. No evaluator score improvement is claimed without another evaluation.

Known gaps: pursuit outside the recorded route, death/respawn, and powered contact are inferred game rules. Ghost eye/foot animation has fewer variants than the source. Rotated mouth crops have minor one-pixel differences.
