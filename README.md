# Sim_AngryBird_Visualization

Weekly visualisations of fine-tuning NVIDIA Cosmos3-Edge for controllable video
generation on self-generated Pong and Pac-Man datasets.

Live page: **https://beijia11.github.io/Sim_AngryBird_Visualization/**

- `index.html` — the page itself, self-contained apart from Google Fonts
- `videos/` — H.264 comparison clips plus a poster frame for each

Week 2 covers two kinds of condition guidance: the per-frame spatial map, and the
per-frame action vector. Every clip is 61 frames, 832x480, 10 fps; the test clips
hold out an entire visual style (`style_6`) and the last four episodes.
