"""Copy everything the week 5 page links to into week5/play, so the repo is self-contained.

    python3 copy_play.py

The page used to reach into ../../new_harness, which only resolves when the server is
rooted above this repo, and never on GitHub Pages. This copies the linked files in.

Per run:
  one shot     build/game/              the whole build, about 50 KB each
  closed loop  rounds/<best>/game/      the best round's build, assets included
               report.html and every local file it references

Left out: `evidence/`, `.py`, `.log` and `.jsonl` scratch inside a build, which the page
never loads (108 MB). Videos the report loads are re-encoded to 480 wide, which takes the
report media from 1.2 GB to something a published site can hold; the originals stay where
they are. Nothing outside this folder is written.
"""
from pathlib import Path
import html
import json
import re
import shutil
import subprocess
import sys
import urllib.parse

ROOT = Path(__file__).resolve().parent
HARNESS = ROOT.parent.parent / "new_harness"
DEST = ROOT / "play"
FFMPEG = shutil.which("ffmpeg") or "/shared/perception/personals/beijia/miniconda3/bin/ffmpeg"
LINK = re.compile(r'(?:src|href)="([^"#?:]+)"')
SKIP_DIR = {"evidence", "__pycache__", "node_modules", ".git"}
SKIP_SUF = {".py", ".pyc", ".log"}
VIDEO_W = 480


def copy_file(src: Path, dst: Path) -> int:
    dst.parent.mkdir(parents=True, exist_ok=True)
    if not dst.exists() or dst.stat().st_size != src.stat().st_size:
        shutil.copy2(src, dst)
    return dst.stat().st_size


def shrink_video(src: Path, dst: Path) -> int:
    dst.parent.mkdir(parents=True, exist_ok=True)
    if not dst.exists():
        subprocess.run([FFMPEG, "-y", "-loglevel", "error", "-i", str(src),
                        "-vf", f"scale={VIDEO_W}:-2", "-an", "-c:v", "libx264",
                        "-preset", "veryfast", "-crf", "30", "-pix_fmt", "yuv420p",
                        "-movflags", "+faststart", str(dst)], check=True)
    return dst.stat().st_size


def copy_build(src: Path, dst: Path) -> int:
    total = 0
    for p in src.rglob("*"):
        if not p.is_file():
            continue
        rel = p.relative_to(src)
        if SKIP_DIR & set(rel.parts) or p.suffix in SKIP_SUF:
            continue
        total += copy_file(p, dst / rel)
    return total


def referenced(page: Path) -> list[Path]:
    """The local files a report page loads, resolved against its own folder."""
    out = set()
    for raw in LINK.findall(page.read_text(errors="replace")):
        rel = urllib.parse.unquote(html.unescape(raw))
        if rel.startswith(("http://", "https://", "//", "/", "..")):
            continue
        target = (page.parent / rel).resolve()
        if HARNESS.resolve() in target.parents and target.is_file():
            out.add(target)
    return sorted(out)


def main() -> None:
    if DEST.is_symlink():
        DEST.unlink()
    total = 0

    for rj in sorted((HARNESS / "simple/runs").glob("*/*/v1/run.json")):
        run = rj.parent
        total += copy_build(run / "build/game", DEST / run.relative_to(HARNESS) / "build/game")
    print(f"one-shot builds done, {total / 1e6:.1f} MB", flush=True)

    for rj in sorted((HARNESS / "surpass/runs").glob("*/*/v1/run.json")):
        run, meta = rj.parent, json.loads(rj.read_text())
        best, rel = meta.get("best_round"), rj.parent.relative_to(HARNESS)
        n = copy_build(run / f"rounds/{best}/game", DEST / rel / f"rounds/{best}/game")
        report = run / "report.html"
        if report.is_file():
            n += copy_file(report, DEST / rel / "report.html")
            for src in referenced(report):
                dst = DEST / src.relative_to(HARNESS)
                n += shrink_video(src, dst) if src.suffix == ".mp4" else copy_file(src, dst)
        total += n
        print(f"{rel.parent.parent.name}/{rel.parent.name}  best r{best}  {n / 1e6:6.1f} MB",
              flush=True)

    print(f"\n{total / 1e6:.0f} MB in week5/play", flush=True)
    page = (ROOT / "index.html").read_text()
    missing = [r for r in re.findall(r'(?:src|href)="(play/[^"]+)"', page)
               if not (ROOT / urllib.parse.unquote(r)).exists()]
    print("broken page links:", missing or "none", flush=True)
    sys.exit(1 if missing else 0)


if __name__ == "__main__":
    main()
