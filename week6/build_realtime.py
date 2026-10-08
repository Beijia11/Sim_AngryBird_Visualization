#!/usr/bin/env python3
"""Part B (Real-Time Video Gen) of the week 6 page: clips and chart data.

Reads the Causal Forcing++ evaluations in cosmos/cosmos_distillation (read only) and writes,
inside this folder only:
  clips/rt/<case>/<name>.mp4 + .jpg   H.264 480 wide, 25 fps, poster = frame 0
  rt_data.js                          window.RT: per-frame fg MAE curves (mean of the 3 cases)
                                      and the numbers the page shows
Run with any python3 that has no extra packages; ffmpeg from the workspace miniconda.
"""
import json
import subprocess
from pathlib import Path
from statistics import mean

HERE = Path(__file__).resolve().parent
COS = Path('/shared/perception/personals/beijia/cosmos')
CD = COS / 'cosmos_distillation'
FFMPEG = '/shared/perception/personals/beijia/miniconda3/bin/ffmpeg'
VAL = COS / 'experiments/racket_batch24_two_stage/validation'
CASES = ['tennis__match116_000', 'tabletennis__match27_000', 'badminton__match101_000']

# name on the page -> folder holding <case>/vision.mp4 (gt and control are special)
SOURCES = {
    'gt': None,
    'control': None,
    'teacher': COS / 'experiments/racket_b6_two_stage_g45/evaluation/stage1_600',
    's1_free': CD / 'stage1/evaluation/stage1_250',
    's1_gthist': CD / 'stage1/evaluation/exposure_bias_step250/gt_history',
    's2_4step': CD / 'stage2/evaluation/stage2_500_4step',
    's2_2step': CD / 'stage2/evaluation/stage2_500_2step',
    's3_250_ema': CD / 'stage3/evaluation/stage3_250_2step',
    's3_250_raw': CD / 'stage3/evaluation/raw_vs_ema/stage3_250_raw_2step',
    's3_500_ema': CD / 'stage3/evaluation/stage3_500_2step',
    's3_500_raw': CD / 'stage3/evaluation/raw_vs_ema/stage3_500_raw_2step',
    's3_750_ema': CD / 'stage3/evaluation/stage3_750_2step',
    's3_750_raw': CD / 'stage3/evaluation/raw_vs_ema/stage3_750_raw_2step',
}


def src(name, case):
    if name == 'gt':
        return VAL / case / 'real_gt.mp4'
    if name == 'control':
        return VAL / case / 'real_seg.mp4'
    return SOURCES[name] / case / 'vision.mp4'


def encode(inp, out):
    out.parent.mkdir(parents=True, exist_ok=True)
    if out.exists() and out.stat().st_mtime > inp.stat().st_mtime:
        return
    subprocess.run([FFMPEG, '-y', '-loglevel', 'error', '-i', str(inp), '-vf', 'scale=480:-2',
                    '-r', '25', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '24', '-preset', 'slow',
                    '-an', '-movflags', '+faststart', str(out)], check=True)
    subprocess.run([FFMPEG, '-y', '-loglevel', 'error', '-i', str(out), '-frames:v', '1',
                    '-q:v', '4', str(out.with_suffix('.jpg'))], check=True)


def curve(metrics_path, label):
    """Per-frame fg MAE averaged over the 3 cases; entry 0 (the GT anchor) is None."""
    models = json.loads(Path(metrics_path).read_text())['models'][label]
    per = [models[c]['fg_mae_per_frame'] for c in CASES]
    n = min(len(p) for p in per)
    return [None] + [round(mean(p[f] for p in per), 2) for f in range(1, n)]


def maes(e1, v250, raw, v750):
    """fg MAE per clip name and case, plus the 3-case mean, from the same metrics files."""
    pick = {
        'teacher': (v250, 'teacher (bidirectional, 35 steps x CFG)'),
        's1_free': (e1, 'step250 free-running AR'),
        's1_gthist': (e1, 'step250 AR with GT history'),
        's2_4step': (v250, 'Stage 2 CD step 500, 4 steps'),
        's2_2step': (v250, 'Stage 2 CD step 500, 2 steps'),
        's3_250_ema': (raw, 'Stage 3 iter 250 EMA'),
        's3_250_raw': (raw, 'Stage 3 iter 250 raw'),
        's3_500_ema': (raw, 'Stage 3 iter 500 EMA'),
        's3_500_raw': (raw, 'Stage 3 iter 500 raw'),
        's3_750_ema': (v750, 'Stage 3 DMD iter 750, 2 steps'),
        's3_750_raw': (v750, 'Stage 3 DMD iter 750 raw, 2 steps'),
    }
    out = {}
    for name, (path, label) in pick.items():
        d = json.loads(Path(path).read_text())
        row = {c: round(d['models'][label][c]['fg_mae'], 1) for c in CASES}
        row['mean'] = d['mean_fg_mae'][label]
        out[name] = row
    return out


def main():
    for case in CASES:
        for name in SOURCES:
            encode(src(name, case), HERE / 'clips/rt' / case / f'{name}.mp4')

    e1 = CD / 'stage1/evaluation/exposure_bias_step250/metrics.json'
    v250 = CD / 'stage3/evaluation/validate_iter250/metrics.json'
    raw = CD / 'stage3/evaluation/raw_vs_ema/metrics.json'
    v750 = CD / 'stage3/evaluation/validate_iter750/metrics.json'
    data = {
        'curves': {
            'stage1': {
                'teacher': curve(e1, 'teacher (bidirectional)'),
                'free': curve(e1, 'step250 free-running AR'),
                'gthist': curve(e1, 'step250 AR with GT history'),
            },
            'stage2': {
                'teacher': curve(v250, 'teacher (bidirectional, 35 steps x CFG)'),
                's2_4step': curve(v250, 'Stage 2 CD step 500, 4 steps'),
                's2_2step': curve(v250, 'Stage 2 CD step 500, 2 steps'),
            },
            'stage3': {
                'teacher': curve(v250, 'teacher (bidirectional, 35 steps x CFG)'),
                'start': curve(raw, 'Stage 2 step 500 (start), 2 steps'),
                's3_250_ema': curve(raw, 'Stage 3 iter 250 EMA'),
                's3_500_raw': curve(raw, 'Stage 3 iter 500 raw'),
                's3_750_raw': curve(v750, 'Stage 3 DMD iter 750 raw, 2 steps'),
            },
        },
        'mae': maes(e1, v250, raw, v750),
    }
    (HERE / 'rt_data.js').write_text('window.RT = ' + json.dumps(data, separators=(',', ':')) + ';\n')
    print('clips:', sum(1 for _ in (HERE / 'clips/rt').rglob('*.mp4')), 'rt_data.js written')


if __name__ == '__main__':
    main()
