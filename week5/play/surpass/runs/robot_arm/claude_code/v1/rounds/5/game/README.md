# Robot arm pick and place
Simulates a UR-style arm (2-link IK drawn procedurally over a median background plate) moving a black gripper that picks a marker box from the table, carries it left and drops it; a built-in "human" returns the box to its home spot after it rests.
Controls: Left/Right and Up/Down arrows (continuous mx/my) move gripper, Space toggles grip. V replays the clip (gripper path tracked per frame from the video).
Assets: full-res median plate, arm+gripper sprites (WebP) cut every 5 frames, keyed by gripper position, velocity and held state (nearest pose, translated, light blend with second nearest), box sprite from frame 0.
Known gaps: pose set is discrete (slight ghosting between poses); fingers do not animate separately; the hand that returns the box is one translated sprite (no full person).
