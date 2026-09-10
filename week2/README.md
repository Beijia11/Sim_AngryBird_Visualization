# Project summary page

Open `index.html` in a browser. The top navigation includes **Astra: playable games**, which jumps to the two reconstruction results below the existing Cosmos experiments.

Each Astra result includes:

- The original request translated into English, with inherited context explained for the follow-up request.
- A local reference video: the original Pac-Man clip, or the gameplay-only Angry Birds recording crop.
- The full `REPORT.md`, rendered inline and available for download.
- Source-file tabs and downloads. Pac-Man includes `game.js`, `data.js`, `inferred.json`, and `analyze_video.py`. Angry Birds includes `game.js`, `inferred.json`, `action_latents.json`, and `analyze_video.py`; it has no `data.js`.
- **Play here** to load the game inside the summary, **Close game** to unload it, **Open full game** for the original interface, and **Download offline HTML** for a standalone copy.

The embedded layouts preserve the game logic while removing duplicate headers and reports. Pac-Man touch buttons and Angry Birds angle/strength controls remain visible. Each iframe reports its content height so the summary can size it automatically. Games load only when requested.

## Source and synchronization

The source result folders are:

```text
../../Sim_AngryBird/pacman_altas_build/
../../Sim_AngryBird/angrybird_atlas_build/
```

These source folders live outside the visualization repository. The published page uses only the copied local assets.

Run this command after updating those result folders:

```bash
python3 sync_astra.py
```

This regenerates the marked Astra section from the script and will replace direct edits inside that section. To publish an already reviewed summary, copy that summary instead of regenerating it.

This copies result assets into `astra/pacman/` and `astra/angry-birds/`, regenerates the presentation adapters, and refreshes the marked Astra section in `index.html`. It leaves the original result folders and existing Cosmos result content untouched. It copies the source `play.html` as supplied; rebuild that source standalone file first if you changed its game code.

`astra.css` and `astra.js` implement the summary presentation, file tabs, iframe loading, and resizing. Reports and source text are generated directly into the page, so no runtime fetch or Markdown CDN is needed. All game and video paths are local and relative. The original summary's optional Google Fonts links remain; system fonts are used offline.

## Validation

`validate_astra.py` checks local asset links, the original experiment-video count, both reports and source tab sets, reference decoding, keyboard control of embedded Pac-Man, an actual Angry Birds shot, iframe resizing and unloading, and mobile controls. It uses Playwright and Chrome with network access disabled.

Results and screenshots are stored in `validation/`. These checks verify the presentation and embedded behavior, not fidelity to the original games.

## Local meeting notes

Click the round **+** at the bottom-right, choose a section or video under **Which part?**, write a note, and press **Place note**. The editor closes and a persistent speech-bubble card appears beside the selected area. Desktop cards occupy the right margin and scroll with the document. On narrower screens, cards appear directly after the corresponding heading or video in the page flow. Multiple cards are stacked without overlapping.

Each card has **Edit** and **Delete** controls; the deletion message offers **Undo**. Markdown and JSON export buttons are available inside the + editor. Closing the editor retains the draft; Cancel clears it.

Notes and drafts still use `week2-meeting-notes-v1` in localStorage, so notes from the previous sidebar version remain available. Storage is local to the current browser profile and origin. Local files, localhost, and GitHub Pages do not necessarily share notes. Other viewers cannot see them. Clearing browser/site data may remove them, so export after meetings. If storage is blocked or full, notes remain visible in memory and an explicit warning advises exporting before closing.

`notes.js` and `notes.css` implement the feature without a server. `validate_notes.py` verifies card placement, persistence, editing, deletion/undo, draft restoration, exports, responsive layout, and unavailable-storage behavior. Results and screenshots are in `validation/notes-*`.
