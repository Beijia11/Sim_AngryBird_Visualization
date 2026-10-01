"""Collect the week 5 clips.

    python3 build_week5.py

Every clip is re-encoded from a source that is never modified, and every source
and output is hashed into `source_manifest.json`.

  recall/          week 4 in one row: rough guidance, groundtruth, CWM, ours
  bug/<case>/      the control-CFG darkening: control, GT, guidance 2, guidance 1
  sweep/           the same checkpoint and case at control guidance 1, 1.25, 1.5, 2
  real/<case>/     real seg control: control, GT, previous best, this run
  rough/<case>/    rough seg control: control, previous best, this run
  ckpt/            one case through the five checkpoints of this run
  agent/<video>/   the agent tracks: the video, both agents' one-shot proxy, both
                   agents' best closed-loop replay. Written with agent_runs.json,
                   which carries the times and the links the page needs.

Cosmos-Edge clips are 672x388 at 25 fps (the 1.7333:1 the model generates). The
1280x720 sources are centre-cropped to that aspect first, the way the model's own
loader crops them. The recall clips stay at the week 4 size, 672x384 at 24 fps.

Standard library plus ffmpeg only.
"""
from pathlib import Path
import hashlib
import os
import json
import shutil
import subprocess

ROOT = Path(__file__).resolve().parent
WORK = ROOT.parent.parent                       # .../personals/beijia
CLIPS = ROOT / "clips"
FFMPEG = shutil.which("ffmpeg") or "/shared/perception/personals/beijia/miniconda3/bin/ffmpeg"

SIZE = (672, 388)                               # 1.7333:1, what Cosmos-Edge generates
CROP = "trunc(in_h*1.7333/2)*2:in_h"            # 16:9 sources cropped to that aspect
FPS = 25

COSMOS = WORK / "cosmos/experiments"
B24 = COSMOS / "racket_batch24_two_stage"       # the batch 24 run: validation set, the CFG probes
VAL = B24 / "validation"                        # nine held-out conditions, shared by every run
PREV = B24 / "older_ckpt_c1/evaluation/stage2_fresh500_b4"   # previous best, re-scored at guidance 1
G45 = COSMOS / "racket_b6_two_stage_g45"        # this week's run
WEEK4 = ROOT.parent / "week4/clips"

CASES = {                                       # page id -> validation id
    "tennis-match116": "tennis__match116_000",
    "tabletennis-match27": "tabletennis__match27_000",
    "badminton-match101": "badminton__match101_000",
}
VARIANTS = ("light", "medium")
CKPTS = ("stage1_200", "stage1_400", "stage1_600", "stage2_200", "stage2_400")

# The darkening, shown on the stage 2 checkpoint under the rough control the agent would
# actually produce. page id -> (validation case, the case the groundtruth belongs to).
BUG_CKPT = "stage2_304"
BUG_CASES = {
    "tennis-match116-light": ("tennis__match116_000_light", "tennis__match116_000"),
    "tabletennis-match27-light": ("tabletennis__match27_000_light", "tabletennis__match27_000"),
    "badminton-match101-light": ("badminton__match101_000_light", "badminton__match101_000"),
}

RECALL = {                                      # already encoded for week 4
    "guidance": WEEK4 / "test/tennis-match116-light/guidance.mp4",
    "gt": WEEK4 / "test/tennis-match116-light/gt.mp4",
    "cwm": WEEK4 / "test/tennis-match116-light/cwm.mp4",
    "ours": WEEK4 / "test/tennis-match116-light/ours.mp4",
}


HARNESS = WORK / "new_harness"
AGENTS = (("claude_code", "claude"), ("codex", "astra"))
AGENT_WIDTH = 480                               # three across; the height follows the video


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def encode(source: Path, target: Path, *, crf=22, nearest=False, size=SIZE, crop=None, fps=FPS):
    target.parent.mkdir(parents=True, exist_ok=True)
    # size may be (w, h) or (w, -2), which keeps the source aspect at an even height.
    width, height = size
    scale = f"scale={width}:{height}" + (":flags=neighbor" if nearest else "")
    filters = ([f"crop={crop}"] if crop else []) + [scale] + ([f"fps={fps}"] if fps else [])
    subprocess.run([
        FFMPEG, "-y", "-loglevel", "error", "-i", str(source.resolve()),
        "-vf", ",".join(filters), "-an", "-c:v", "libx264", "-preset", "slow",
        "-crf", str(crf), "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(target),
    ], check=True)
    return target


def probe(path: Path):
    ffprobe = FFMPEG.replace("ffmpeg", "ffprobe")
    report = json.loads(subprocess.run(
        [ffprobe, "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width,height,nb_frames",
         "-show_entries", "format=duration", "-of", "json", str(path)],
        check=True, capture_output=True, text=True).stdout)
    stream = report["streams"][0]
    return {"size": f"{stream['width']}x{stream['height']}",
            "frames": int(stream["nb_frames"]),
            "seconds": round(float(report["format"]["duration"]), 3)}


def main():
    manifest = {"clips": {}, "sources": {}}

    def add(key, source, target, **kw):
        source = source.resolve()
        if not source.exists():
            raise SystemExit(f"missing source for {key}: {source}")
        out = encode(source, target, **kw)
        manifest["sources"][key] = {"path": str(source), "sha256": sha256(source)}
        manifest["clips"][key] = {"sha256": sha256(out), "bytes": out.stat().st_size, **probe(out)}
        print(f"{key:<46} {manifest['clips'][key]['frames']} frames")

    # A control map is nearest-neighbour scaled so its flat regions stay flat.
    control = dict(crop=CROP, nearest=True)
    source16 = dict(crop=CROP)                  # GT, 16:9
    generated = dict()                          # already 1.7333:1

    # 0  recall: week 4, one tennis case
    for role, src in RECALL.items():
        add(f"recall/{role}", src, CLIPS / "recall" / f"{role}.mp4",
            crf=24, size=(672, 384), fps=24, nearest=(role == "guidance"))

    # 1  the bug: one stage 2 checkpoint, rough control, control guidance 2 then 1
    for case, (name, base) in BUG_CASES.items():
        folder = CLIPS / "bug" / case
        add(f"bug/{case}/gt", VAL / base / "real_gt.mp4", folder / "gt.mp4", **source16)
        add(f"bug/{case}/guidance", VAL / name / "rough_seg.mp4", folder / "guidance.mp4", **control)
        add(f"bug/{case}/c2", B24 / f"evaluation_c2_superseded/{BUG_CKPT}/{name}/vision.mp4",
            folder / "c2.mp4", **generated)
        add(f"bug/{case}/c1", B24 / f"evaluation/{BUG_CKPT}/{name}/vision.mp4",
            folder / "c1.mp4", **generated)

    # 2  validation on real seg control
    for case, name in CASES.items():
        folder = CLIPS / "real" / case
        add(f"real/{case}/control", VAL / name / "real_seg.mp4", folder / "control.mp4", **control)
        add(f"real/{case}/gt", VAL / name / "real_gt.mp4", folder / "gt.mp4", **source16)
        add(f"real/{case}/prev", PREV / name / "vision.mp4", folder / "prev.mp4", **generated)
        add(f"real/{case}/new", G45 / f"evaluation/stage1_600/{name}/vision.mp4", folder / "new.mp4", **generated)

    # 3  validation on rough seg control; the groundtruth is the real clip of the same case
    for case, name in CASES.items():
        for variant in VARIANTS:
            cid, folder = f"{case}-{variant}", CLIPS / "rough" / f"{case}-{variant}"
            add(f"rough/{cid}/control", VAL / f"{name}_{variant}/rough_seg.mp4",
                folder / "control.mp4", **control)
            add(f"rough/{cid}/prev", PREV / f"{name}_{variant}/vision.mp4", folder / "prev.mp4", **generated)
            add(f"rough/{cid}/new", G45 / f"evaluation/stage1_600/{name}_{variant}/vision.mp4",
                folder / "new.mp4", **generated)

    # 4  one case through every checkpoint of this run
    for ckpt in CKPTS:
        add(f"ckpt/{ckpt}", G45 / f"evaluation/{ckpt}/{CASES['tennis-match116']}/vision.mp4",
            CLIPS / "ckpt" / f"{ckpt}.mp4", **generated)

    # 5  the agent tracks. Same video on both: one-shot proxy, then the closed loop.
    #    The playable builds are 499 MB in total, far too much for this repo, so the
    #    page links to them in place; serve the workspace root to follow those links.
    # Links go through week5/play, a symlink to new_harness, so they resolve whether the
    # server is rooted at the repo, at the workspace, or the page is opened as a file.
    runs, link = [], lambda p: "play/" + str(p.relative_to(HARNESS)).replace(os.sep, "/")
    for video in sorted(d.name for d in (HARNESS / "simple/runs").iterdir() if d.is_dir()):
        folder, row = CLIPS / "agent" / video, {"video": video, "simple": {}, "loop": {}}
        add(f"agent/{video}/ref", HARNESS / f"simple/runs/{video}/claude_code/v1/reference.mp4",
            folder / "ref.mp4", size=(AGENT_WIDTH, -2), fps=None)
        for agent, short in AGENTS:
            one = HARNESS / f"simple/runs/{video}/{agent}/v1"
            meta = json.loads((one / "run.json").read_text())
            add(f"agent/{video}/simple_{short}", one / "build/eval/proxy.mp4",
                folder / f"simple_{short}.mp4", size=(AGENT_WIDTH, -2), fps=None, nearest=True)
            row["simple"][short] = {"minutes": meta.get("agent_minutes"),
                                    "js_errors": meta.get("js_errors"),
                                    "play": link(one / "build/game/play.html"),
                                    "code": link(one / "build/game/world.js")}

            loop = HARNESS / f"surpass/runs/{video}/{agent}/v1"
            m = json.loads((loop / "run.json").read_text())
            rounds, best = m.get("rounds", []), m.get("best_round")
            br = next(r for r in rounds if r["round"] == best)
            add(f"agent/{video}/loop_{short}", loop / f"rounds/{best}/eval/render/replay.mp4",
                folder / f"loop_{short}.mp4", size=(AGENT_WIDTH, -2), fps=None)
            row["loop"][short] = {
                "minutes": round(sum((r.get("agent_minutes") or 0) + (r.get("eval_minutes") or 0)
                                     for r in rounds), 1),
                "rounds": len(rounds), "best_round": best, "overall": br.get("overall"),
                "groups": {g: br.get(g) for g in
                           ("A_appearance", "B_mechanism", "C_naturalness", "D_free_play", "E_judge")},
                "play": link(loop / f"rounds/{best}/game/play.html"),
                "report": link(loop / "report.html")}
        runs.append(row)
    (ROOT / "agent_runs.json").write_text(json.dumps(runs, indent=1) + "\n")

    (ROOT / "source_manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    total = sum(entry["bytes"] for entry in manifest["clips"].values())
    print(f"{len(manifest['clips'])} clips, {total / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
