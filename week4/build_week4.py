"""Collect the week 4 clips.

    python3 build_week4.py

Every clip is re-encoded from a source that is never modified, and every source
and output is hashed into `source_manifest.json`.

  recall/        last week: reference, game, proxy, generated
  dataset/       one raw clip per sport
  curation/      one training source as original, light and medium
  training/      the same training source: guidance, proxy, anchor, target
  test/<case>/   gt, guidance, depth, semantic, cwm, ours   (124 frames)
  game/          game, guidance, cwm, ours                  (214 frames)
  cosmos/        the small model: two stages, 121 frames at 25 fps

All clips are 672x384 at 24 fps. The guidance clips are 10 s at 25 fps at the
source, so they are resampled and cut to the same window as everything else.

Standard library plus ffmpeg only.
"""
from pathlib import Path
import hashlib
import json
import shutil
import subprocess

ROOT = Path(__file__).resolve().parent
WORK = ROOT.parent.parent                       # .../personals/beijia
CLIPS = ROOT / "clips"
FFMPEG = shutil.which("ffmpeg") or "/shared/perception/personals/beijia/miniconda3/bin/ffmpeg"

WIDTH, HEIGHT, FPS, WINDOW = 672, 384, 24, 124

TRAIN = WORK / "data_dynamic_pairs/cwm_train_full_v1"
NEW = TRAIN / "inference_step2750_newprompt/validation"    # generated with the non-chat prompt
OLD = TRAIN / "inference_step2750/validation"              # same conditions, rendered as video
GAME = WORK / "selfevolve-agent/tennis_cwm_proxy/out/proxy2"
LIBRARY = WORK / "data_dynamic_pairs"
PAIRS = LIBRARY / "full_v1"

# All three are in the training split, so nothing outside section 4 shows a
# held-out clip.
WEEK3 = ROOT.parent / "week3/clips"
RECALL = {
    "reference": WEEK3 / "tennis-source.mp4",
    "game": WEEK3 / "tennis-play.mp4",
    "proxy": WEEK3 / "tennis-semantic.mp4",
    "generated": WEEK3 / "tennis-generated.mp4",
}

DATASET = {
    "tennis": LIBRARY / "tennis/videos/match100_000.mp4",
    "tabletennis": LIBRARY / "tabletennis/videos/match10_000.mp4",
    "badminton": LIBRARY / "badminton/videos/match100_000.mp4",
}
# tennis match100 is in the training split; the three result cases are held out,
# so no example outside section 4 comes from the test set.
EXAMPLE = "match100_000"
CURATION = {
    "original": PAIRS / f"tennis/clips/{EXAMPLE}/target.mp4",
    "light": PAIRS / f"tennis/clips/{EXAMPLE}/guidance_light.mp4",
    "medium": PAIRS / f"tennis/clips/{EXAMPLE}/guidance_medium.mp4",
}
TRAINING = {
    "guidance": PAIRS / f"tennis/clips/{EXAMPLE}/guidance_light.mp4",
    "proxy": TRAIN / f"data/tennis__{EXAMPLE}_light/proxy.mkv",
    "target": TRAIN / f"data/tennis__{EXAMPLE}_light/tennis__{EXAMPLE}_light.mp4",
}
TRAINING_ANCHOR = TRAIN / f"data/tennis__{EXAMPLE}_light/anchor.png"

CASES = [
    dict(id="tennis-match116-light", source="tennis__match116_000_light",
         title="tennis · match116 · light", seed=1235),
    dict(id="tennis-match131-medium", source="tennis__match131_000_medium",
         title="tennis · match131 · medium", seed=1236),
    dict(id="badminton-match101-light", source="badminton__match101_000_light",
         title="badminton · match101 · light", seed=1234),
]

# Cosmos-Edge. Its own loader centre-crops 1280x720 to 832x480, so the condition
# and the ground truth are cropped the same way before they are put next to a
# generated clip.
COSMOS = WORK / "cosmos/experiments"
COSMOS_SIZE = (672, 388)          # 1.733:1, the aspect the small model generates
COSMOS_CROP = "trunc(in_h*1.7333/2)*2:in_h"  # 16:9 sources cropped to that aspect
COSMOS_CASES = {
    "tennis-match116": "tennis__match116_000",
    "tabletennis-match27": "tabletennis__match27_000",
    "badminton-match101": "badminton__match101_000",
}
COSMOS_VARIANTS = ("light", "medium")

GAME_CLIPS = {
    "game": GAME / "game_render.mp4",
    "guidance": GAME / "proxy_video.mp4",
    "cwm": GAME / "output_newprompt.mp4",
    "ours": GAME / "generated_step2750_newprompt.mp4",
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def encode(source: Path, target: Path, *, frames=None, crf=22, nearest=False,
           size=None, crop=None, fps=FPS):
    target.parent.mkdir(parents=True, exist_ok=True)
    width, height = size or (WIDTH, HEIGHT)
    scale = f"scale={width}:{height}" + (":flags=neighbor" if nearest else "")
    filters = ([f"crop={crop}"] if crop else []) + [scale, f"fps={fps}"]
    command = [
        FFMPEG, "-y", "-loglevel", "error", "-i", str(source.resolve()),
        "-vf", ",".join(filters), "-an", "-c:v", "libx264", "-preset", "slow",
        "-crf", str(crf), "-pix_fmt", "yuv420p", "-movflags", "+faststart",
    ]
    if frames is not None:
        command += ["-frames:v", str(frames)]
    subprocess.run(command + [str(target)], check=True)
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
        out = encode(source, target, **kw)
        manifest["sources"][key] = {"path": str(source), "sha256": sha256(source)}
        manifest["clips"][key] = {"sha256": sha256(out), "bytes": out.stat().st_size, **probe(out)}
        print(f"{key:<38} {manifest['clips'][key]['frames']} frames")

    for role, source in RECALL.items():
        add(f"recall/{role}", source, CLIPS / "recall" / f"{role}.mp4",
            crf=24, nearest=(role == "proxy"))

    for sport, source in DATASET.items():
        add(f"dataset/{sport}", source, CLIPS / "dataset" / f"{sport}.mp4", crf=24)

    for role, source in CURATION.items():
        add(f"curation/{role}", source, CLIPS / "curation" / f"{role}.mp4", crf=24)

    for role, source in TRAINING.items():
        add(f"training/{role}", source, CLIPS / "training" / f"{role}.mp4",
            frames=WINDOW, crf=24, nearest=(role == "proxy"))
    (CLIPS / "training").mkdir(parents=True, exist_ok=True)
    shutil.copyfile(TRAINING_ANCHOR.resolve(), CLIPS / "training" / "anchor.png")
    manifest["sources"]["training/anchor"] = {
        "path": str(TRAINING_ANCHOR.resolve()), "sha256": sha256(TRAINING_ANCHOR.resolve())}

    for case in CASES:
        name = case["source"]
        folder = CLIPS / "test" / case["id"]
        add(f"{case['id']}/gt", NEW / name / "target.mp4", folder / "gt.mp4")
        add(f"{case['id']}/guidance", NEW / name / "guidance.mp4", folder / "guidance.mp4", frames=WINDOW)
        add(f"{case['id']}/depth", OLD / name / "condition_depth.mp4", folder / "depth.mp4", nearest=True)
        add(f"{case['id']}/semantic", OLD / name / "condition_semantic.mp4", folder / "semantic.mp4", nearest=True)
        add(f"{case['id']}/cwm", NEW / name / "generated_cwm.mp4", folder / "cwm.mp4")
        add(f"{case['id']}/ours", NEW / name / "generated_step2750.mp4", folder / "ours.mp4")
        anchor = (NEW / name / "anchor.png").resolve()
        shutil.copyfile(anchor, folder / "anchor.png")
        manifest["sources"][f"{case['id']}/anchor"] = {"path": str(anchor), "sha256": sha256(anchor)}

    for role, source in GAME_CLIPS.items():
        add(f"game/{role}", source, CLIPS / "game" / f"{role}.mp4",
            crf=24, nearest=(role == "guidance"))

    def cosmos(key, source, target, crop):
        add(key, source, target, crf=22, fps=25, size=COSMOS_SIZE,
            crop=COSMOS_CROP if crop else None)

    for case, name in COSMOS_CASES.items():
        folder = CLIPS / "cosmos" / "stage1" / case
        cosmos(f"cosmos-stage1/{case}/guidance",
               COSMOS / f"racket_real_stage1/validation/{name}/real_seg.mp4", folder / "guidance.mp4", True)
        cosmos(f"cosmos-stage1/{case}/gt",
               COSMOS / f"racket_real_stage1/validation/{name}/real_gt.mp4", folder / "gt.mp4", True)
        cosmos(f"cosmos-stage1/{case}/base",
               COSMOS / f"racket_real_stage1/evaluation/base/{name}/vision.mp4", folder / "base.mp4", False)
        cosmos(f"cosmos-stage1/{case}/tuned",
               COSMOS / f"racket_real_stage1/evaluation/step400/{name}/vision.mp4", folder / "tuned.mp4", False)
        # the ground truth is the same clip for both rough variants of a case
        for variant in COSMOS_VARIANTS:
            rough = CLIPS / "cosmos" / "stage2" / f"{case}-{variant}"
            cosmos(f"cosmos-stage2/{case}-{variant}/guidance",
                   COSMOS / f"racket_rough_stage2/validation/{name}_{variant}/rough_seg.mp4",
                   rough / "guidance.mp4", True)
            cosmos(f"cosmos-stage2/{case}-{variant}/stage1",
                   COSMOS / f"racket_rough_stage2/evaluation/stage1/{name}_{variant}/vision.mp4",
                   rough / "stage1.mp4", False)
            cosmos(f"cosmos-stage2/{case}-{variant}/stage2",
                   COSMOS / f"racket_rough_stage2/evaluation/stage2/{name}_{variant}/vision.mp4",
                   rough / "stage2.mp4", False)

    (ROOT / "source_manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    total = sum(entry["bytes"] for entry in manifest["clips"].values())
    print(f"{len(manifest['clips'])} clips, {total / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
