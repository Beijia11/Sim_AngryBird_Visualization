# Slingshot tower simulator (round 0)
Simulated: camera intro on the tower, pan to the slingshot, pull-and-release launch of the red bird (ballistic, g=483 px/s^2 world, launch 6.93 s), camera pan and follow driven by keyframes measured from camera.json, impact knocks tower blocks (simple per-block gravity/ground physics, no block-block collisions), pig pop +5000, score counter.
Controls: drag on the picture (pull back from slingshot, release) or Space for a default shot. V replays the clip.
Assets: plate.png (panorama median of the clip, tower inpainted), block textures cut from frame 0, bird/pig sprites keyed from frames.
Gaps: no block-block collisions, no feathers/debris particles, no trajectory dots, pull is animated after release, pano seams, blurry inpainted area behind tower.
