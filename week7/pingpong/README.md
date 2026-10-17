# Week 7 table-tennis demo

Goal: reuse the earlier AnyVideo2Game table-tennis training game and show the actual analysis references in the Week 7 report. This is the ping-pong example the user clarified, not the Week 6 tennis simulation.

## Source and files

- Source project: `/shared/perception/personals/beijia/idea/anyvideo2game/`; read its README for implementation assumptions and previous validation.
- `runtime/`: game page, input / UI controller and shared engine.
- `examples/pingpong/`: four modules, configurations, game specification, background, character sprite sheet and asset provenance.
- `tasks/pingpong/`: original analysis, source metadata, contract, reference video and cached reference frames.
- `manifest.json`: SHA-256 of copied files and whether each matches its source. `runtime/pingpong.html` and `runtime/pingpong.mjs` are adapted for English UI text. Navigation returns to Week 7, and `?embed` hides surrounding documentation for a compact iframe. The engine, four game modules and assets are unchanged.

## Usage and constraints

Open `runtime/pingpong.html` through a static HTTP server; `runtime/pingpong.html?embed` is used by `../index.html`.
Arrow keys move left / right, Space swings, R resets; touch buttons are included. Return at least three of five balls onto the opposite table.

The report shows original frames 0, 48 and 120 (0.00, 1.92 and 4.80 seconds at 25 fps), with frame 48 as the character / scene reference. The original clip and generated pose sheet are available separately. Reference frames and generated assets must remain clearly distinguished. Five serves, the success threshold, ball timing and simplified physics are game design choices, not recovered video rules.

Current state: packaged locally and integrated after the report's full Harness figure and takeaway, before Conclusion. No new training, image generation or model experiment was run. Live-site verification remains pending publication.

Local browser validation passed: keyboard movement and swing contact, five valid returns via legal inputs, reset, mobile on-screen movement, embedded keyboard input, all three displayed reference images, and desktop/mobile sizing without overflow. No JavaScript or resource-request errors.
