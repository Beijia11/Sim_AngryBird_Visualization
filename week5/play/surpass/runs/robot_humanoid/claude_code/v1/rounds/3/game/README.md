# Robot stairs simulator (round 0)
Humanoid robot walks up a short wooden staircase, turns on top and walks down again; handheld camera.
- Controls: hold Right/D/W = walk forward along the route; hold Left/A/S = step back. Speed eases in/out.
- Robot rendered from sprites cut from the video (every 2nd frame, dark-pixel mask), cross-faded by motion phase.
- Background: frame 300 with the robot inpainted.
- Gaps: no camera motion, robot shadow on wall static, route is fixed (no free movement), masks rough.
- Round 1: fixed action parsing (acts is an array of {id}); robot now moves in replay/free play. camera.json transforms tried and rejected (misaligned bg).
- Round 3: camera estimated by ORB+RANSAC similarity registration of each frame to frame 300 (evidence/cam.json, ~10px pan); background warped per phase. Replay phase offset +2 frames to remove lag.
