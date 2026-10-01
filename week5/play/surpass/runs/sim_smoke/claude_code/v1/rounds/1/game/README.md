# Incense smoke simulator
Clean plate of the burner + particle smoke from its mouth, slow camera push-in like the clip.
Controls: A/D = air drift left/right (continuous), Space = puff of smoke. V replay, R reset, P pause.
Known gaps: smoke is soft gradient particles, not real thin filament wisps; plume is shorter and denser near the head than the video; the glow inside the mouth is baked into the plate.
Round 1: smoke is advected by the clip's measured mean flow field (embedded in world.js) for 0-9 s; emission follows measured smoke density over time.
