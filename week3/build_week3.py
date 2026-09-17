"""Assemble the week 3 page from the five self-improvement result folders.

Copies only what a browser needs to *run* each iteration (no reports, no source
tabs, no reference video), writes a stripped `embed.html` per iteration, rebuilds
the figure images, and regenerates `index.html`.

    python3 build_week3.py

Source folders are never modified. Standard library plus ffmpeg only.
"""
from pathlib import Path
import shutil, subprocess, html, json, re

ROOT = Path(__file__).resolve().parent            # .../Sim_AngryBird_Visualization/week3
WORK = ROOT.parent.parent                          # .../personals/beijia
GAMES = ROOT / "games"
SHARED = GAMES / "_shared"
FIGS = ROOT / "figures"

# --------------------------------------------------------------------------
# The five iterations, in the order they happened.
#
# `runtime` lists the files the game actually loads. Anything else in the source
# `after/` folder (REPORT.md, play.html, reference video, assets/ provenance
# copies, build.py) is deliberately left behind: this page shows the game only.
# `shared` files are byte-identical across iterations and are copied once.
# --------------------------------------------------------------------------
ITERATIONS = [
    dict(
        id="ab-v1", track="angry-birds", n=1,
        source="angrybird_selfimprovement/after",
        runtime=["game.js", "vendor/matter.min.js", "vendor/LICENSE-matter.txt"],
        shared=[],
        poster=("angrybird_selfimprovement/evidence/after_3.1s.png", "ab-v1-poster.jpg"),
        look_for="The tower now collapses when its supports are shot away.",
    ),
    dict(
        id="ab-v2", track="angry-birds", n=2,
        source="angrybird_selfimprovement2/after",
        runtime=["game.js", "vendor/matter.min.js", "vendor/LICENSE-matter.txt"],
        shared=[],
        poster=("angrybird_selfimprovement2/evidence/after_initial.png", "ab-v2-poster.jpg"),
        look_for="Repainted sky, trees, grass and characters, plus an "
                 "engine-accurate aim preview and an <em>Inspect tower</em> view.",
    ),
    dict(
        id="tennis-v1", track="tennis", n=1,
        source="tennis_selfimprovement/after",
        runtime=["game.js"],
        shared=["data.js"],
        poster=("tennis_selfimprovement/evidence/after_initial.png", "tennis-v1-poster.jpg"),
        look_for="Court geometry calibrated to the broadcast frame; ball, net "
                 "depth and racket reach corrected. Players are still drawings.",
    ),
    dict(
        id="tennis-v2", track="tennis", n=2,
        source="tennis_selfimprovement2/after",
        runtime=["game.js", "actors.js"],
        shared=["data.js", "motion_data.js"],
        poster=("tennis_selfimprovement2/evidence/after_initial.png", "tennis-v2-poster.jpg"),
        look_for="Both players are now cut-out pixels from the video, animated "
                 "by replaying recorded frame ranges.",
    ),
    dict(
        id="tennis-v3", track="tennis", n=3,
        source="tennis_selfimprovement3/after",
        runtime=["game.js", "actors.js", "background.js"],
        shared=["data.js", "motion_data.js"],
        poster=("tennis_selfimprovement3/evidence/after_initial.png", "tennis-v3-poster.jpg"),
        look_for="The whole stadium is now the video's own first frame, with the "
                 "players painted out; clip changes crossfade instead of cutting.",
    ),
]

# Figures for the appearance section: (source path, output name, target width)
FIGURES = [
    ("angrybird_selfimprovement2/evidence/reference_initial.png", "ab-reference.jpg", 1248),
    ("angrybird_selfimprovement2/evidence/after_initial.png",     "ab-game.jpg",      1086),
    ("angrybird_selfimprovement2/evidence/after_tower.png",       "ab-game-tower.jpg", 1086),
    # improvement 3 only: the same key press replays one recorded clip each time
    ("tennis_selfimprovement3/evidence/input_fix/swing_left.png",  "tennis-swing-a.jpg", 996),
    ("tennis_selfimprovement3/evidence/input_fix/swing_right.png", "tennis-swing-d.jpg", 996),
]

# --------------------------------------------------------------------------
# Q3 clips: one recorded tennis rally at each stage of the pipeline.
#
# proxy_preview.mp4 is the Semantic-ID map stacked on top of the metric depth
# map, 336x192 each, so the two conditions are cropped back out of it rather
# than re-rendered: this keeps the builder on the standard library plus ffmpeg.
# --------------------------------------------------------------------------
CWM = WORK / "tennis_cwm_proxy" / "out" / "20260917-033836"
ABM = WORK / "angrybird_cwm_proxy" / "out" / "opening124"
CLIP_JOBS = [
    (CWM / "game_render.mp4", "tennis-play.mp4", "scale=860:-2"),
    (CWM / "proxy_preview.mp4", "tennis-depth.mp4", "crop=336:192:0:192,scale=860:-2:flags=neighbor"),
    (CWM / "proxy_preview.mp4", "tennis-semantic.mp4", "crop=336:192:0:0,scale=860:-2:flags=neighbor"),
    (CWM / "output.mp4", "tennis-generated.mp4", "scale=860:-2"),
    (ABM / "game_render.mp4", "ab-play.mp4", "scale=860:-2"),
    (ABM / "proxy_preview.mp4", "ab-depth.mp4", "crop=336:192:0:192,scale=860:-2:flags=neighbor"),
    (ABM / "proxy_preview.mp4", "ab-semantic.mp4", "crop=336:192:0:0,scale=860:-2:flags=neighbor"),
    (ABM / "output.mp4", "ab-generated.mp4", "scale=860:-2"),
]
CLIPS = ROOT / "clips"


def build_clips():
    """Re-encode the four pipeline stages as web-weight MP4s."""
    CLIPS.mkdir(exist_ok=True)
    for source, name, filters in CLIP_JOBS:
        if not source.exists():
            print(f"  SKIP {name}: missing {source}")
            continue
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(source), "-vf", filters,
             "-c:v", "libx264", "-preset", "slow", "-crf", "26", "-pix_fmt", "yuv420p",
             "-movflags", "+faststart", "-an", str(CLIPS / name)],
            check=True)
        size = (CLIPS / name).stat().st_size
        print(f"  {name:<24} {size / 1e6:.1f} MB")


# --------------------------------------------------------------------------
# Turning a result page into an embeddable game screen.
#
# Each `after/index.html` is a full magazine-style page: masthead, headline,
# explanatory cards, a <details> holding the reference video, a footer. The
# override sheet hides all of that and leaves the canvas, its controls and the
# in-game HUD, so the iframe shows the game and nothing else. The script reports
# the resulting height to the parent page.
# --------------------------------------------------------------------------
EMBED_CSS = """<style>
html,body{margin:0!important;min-height:0!important;height:auto!important}
main{max-width:none!important;margin:0!important;padding:12px!important}
main>header,main>footer,main>.intro,main>details,main>h1,main>p:not([class]),
.bottom-grid,.foot,.edition{display:none!important}
.layout>section>details{display:none!important}
.controls a,.toolbar a{display:none!important}
.layout{gap:16px!important}
.controls{margin:12px 0!important}
aside{margin:0!important}
@media(max-width:900px){.layout{grid-template-columns:1fr!important}}
</style>"""

EMBED_JS = """<script>
(()=>{const main=document.querySelector('main');let previous=0;
function send(){const h=Math.ceil(main.getBoundingClientRect().height)+2;
if(Math.abs(h-previous)>1){previous=h;parent.postMessage({type:'week3-game-size',height:h},'*');}}
new ResizeObserver(send).observe(main);window.addEventListener('load',send);send();})();
</script>"""


def copy_runtime():
    """Copy each iteration's runtime files and write its embed.html."""
    for it in ITERATIONS:
        source = WORK / it["source"]
        dest = GAMES / it["id"]
        dest.mkdir(parents=True, exist_ok=True)
        for name in it["runtime"]:
            target = dest / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source / name, target)
        for name in it["shared"]:
            SHARED.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source / name, SHARED / name)

        page = (source / "index.html").read_text()
        # Drop the <details> block holding the reference video outright. Hiding it
        # in CSS is not enough: a <video src> inside a display:none element is still
        # fetched, and the file is not copied here, so it would 404 on every load.
        page, dropped = re.subn(r"<details>(?:(?!</details>).)*?<video[^>]*>.*?</details>",
                                "", page, flags=re.S)
        assert dropped == 1, f"{it['id']}: expected one reference-video block, found {dropped}"
        page = page.replace("</style>", "</style>" + EMBED_CSS, 1)
        # shared scripts move one level up, into games/_shared/
        for name in it["shared"]:
            page = page.replace(f'src="{name}"', f'src="../_shared/{name}"')
        page += EMBED_JS
        (dest / "embed.html").write_text(page)
        print(f"  {it['id']:<10} embed.html + {len(it['runtime'])} runtime file(s)")


def build_figures():
    """Re-encode the evidence screenshots as page-weight JPEGs."""
    FIGS.mkdir(exist_ok=True)
    for source, name, width in FIGURES:
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(WORK / source),
             "-vf", f"scale={width}:-2", "-q:v", "3", str(FIGS / name)],
            check=True)
    for it in ITERATIONS:
        source, name = it["poster"]
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(WORK / source),
             "-vf", "scale=760:-2", "-q:v", "4", str(FIGS / name)],
            check=True)
    print(f"  {len(FIGURES) + len(ITERATIONS)} figures written to figures/")


def manifest():
    """Record where every copied byte came from."""
    import hashlib
    rows = []
    for it in ITERATIONS:
        for name in it["runtime"] + it["shared"]:
            p = WORK / it["source"] / name
            rows.append(dict(iteration=it["id"], file=name,
                             source=str(Path(it["source"]) / name),
                             sha256=hashlib.sha256(p.read_bytes()).hexdigest()))
    (ROOT / "source_manifest.json").write_text(json.dumps(rows, indent=1) + "\n")
    print(f"  source_manifest.json: {len(rows)} files")


if __name__ == "__main__":
    print("week 3 build")
    copy_runtime()
    build_figures()
    build_clips()
    manifest()
    print("done. index.html is maintained by hand; only assets are generated here.")
