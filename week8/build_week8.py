#!/usr/bin/env python3
"""Copy the week 8 demos into this folder and make their text English.

Reads only; never writes outside week8/. Hand-written files are left alone:
index.html, week8.css, states/viewer.js, control/index.html, game/index.html.

    python3 build_week8.py
"""
import json
import re
import shutil
import subprocess
from pathlib import Path

from i18n_en import BANK, CODE, NOTE_FRAGMENTS, PHASES, REASONS, NAMES

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent                                   # Sim_AngryBird_Visualization
BEIJIA = ROOT.parent
SM = BEIJIA / 'test_animation/tennis_state_machine/dist'   # :8000 / :8079 state viewer + control
GAME = BEIJIA / 'test_animation/tennis_simple_v3/dist'     # :8079/game/
CJK = re.compile(r'[　-〿一-鿿＀-￯]')


def copy(src, dst):
    dst = HERE / dst
    dst.parent.mkdir(parents=True, exist_ok=True)
    if src.is_dir():
        shutil.copytree(src, dst, dirs_exist_ok=True)
    else:
        shutil.copy2(src, dst)


def write(dst, text):
    assert not CJK.search(text), f'Chinese left in {dst}: {CJK.findall(text)[:20]}'
    (HERE / dst).parent.mkdir(parents=True, exist_ok=True)
    (HERE / dst).write_text(text, encoding='utf-8')


def translate_code(dst, src):
    text = src.read_text(encoding='utf-8')
    for zh, en in sorted(CODE[dst].items(), key=lambda kv: -len(kv[0])):
        assert zh in text, f'{dst}: key not found: {zh[:60]}'
        text = text.replace(zh, en)
    write(dst, text)


def note(zh):
    en = zh
    for frag, tr in sorted(NOTE_FRAGMENTS.items(), key=lambda kv: -len(kv[0])):
        en = en.replace(frag, tr)
    return en


def bank_en(value):
    if isinstance(value, dict):
        return {k: bank_en(v) for k, v in value.items()}
    if isinstance(value, list):
        return [bank_en(v) for v in value]
    if isinstance(value, str) and CJK.search(value):
        return BANK[value]
    return value


# 1. Agent harness figure: week 8's own version (started from week 7's videoplay/, which stays unchanged).
#    videoplay/figure.html is the single source of the markup; it goes into this page and the standalone one.
FIGURE = re.compile(r'(<!-- FIGURE START[^\n]*-->\n).*?(<!-- FIGURE END -->)', re.S)
figure = (HERE / 'videoplay/figure.html').read_text(encoding='utf-8')
for page, fig in (('index.html', figure),
                  ('videoplay/index.html', figure.replace('videoplay/img/', 'img/').replace('control/curated/', '../control/curated/'))):
    text = (HERE / page).read_text(encoding='utf-8')
    assert FIGURE.search(text), f'no figure markers in {page}'
    write(page, FIGURE.sub(lambda m: m.group(1) + fig + m.group(2), text))
subprocess.run(['python3', str(HERE / 'build_harness_css.py')], check=True, stdout=subprocess.DEVNULL)

# 2. Simple · Astra tennis, as packaged in week 6, with its input video (H.264, no audio) and a poster.
copy(ROOT / 'week6/play/tennis/simple', 'simple')
copy(BEIJIA / 'newnew_harness/evaluation/site/assets/human_tennis/reference.mp4', 'simple/reference.mp4')
FFMPEG = shutil.which('ffmpeg') or '/home/beijial2/envs/cvm/bin/ffmpeg'
subprocess.run([FFMPEG, '-v', 'error', '-y', '-i', str(HERE / 'simple/reference.mp4'), '-frames:v', '1',
                '-vf', 'scale=960:-2', str(HERE / 'simple/reference.jpg')], check=True)

# 3. State viewer: source video + a trimmed English model of the labelled state machine.
copy(SM / 'assets/source.mp4', 'states/source.mp4')
copy(SM / 'exclusive-machine.js', 'states/exclusive-machine.js')
fsm = json.loads((SM / 'assets/fsm.json').read_text(encoding='utf-8'))
model = {
    'meta': {'duration': fsm['meta']['duration']},
    'behaviors': [{'id': b['id'], 'name': NAMES[b['name']], 'parent': b['parent']} for b in fsm['behaviors']],
    'phases': {k: PHASES[v] for k, v in fsm['phases'].items()},
    'primarySegments': [{k: s[k] for k in ('id', 'start', 'end', 'behavior', 'parent', 'phase', 'quality', 'tolerance')}
                        | {'note': note(s['note'])} for s in fsm['primarySegments']],
    'transitions': [{k: r[k] for k in ('time', 'fromState', 'toState', 'fromPhase', 'toPhase', 'toSegment')}
                    | {'reason': REASONS[r['reason']]} for r in fsm['transitions']],
}
write('states/model.json', json.dumps(model, ensure_ascii=False, separators=(',', ':')))

# 4. Keyboard control with curated v3 states and offline transitions.
bank = bank_en(json.loads((SM / 'control/curated/bank.json').read_text(encoding='utf-8')))
write('control/curated/bank.json', json.dumps(bank, ensure_ascii=False, separators=(',', ':')))
for sub in ('states', 'seams', 'videos', 'posters'):
    copy(SM / 'control/curated' / sub, f'control/curated/{sub}')
for name in ('style.css', 'curated-style.css'):
    copy(SM / 'control' / name, f'control/{name}')
for name in ('curated-app.js', 'curated-controller.js', 'curated-view.js', 'offline-bank.js'):
    translate_code(f'control/{name}', SM / 'control' / name)

# 5. Game: Simple world with the v3 near player (B). Same v3 bank, now English.
write('game/v3-data.js', 'window.V3_DATA=' + json.dumps(bank, ensure_ascii=False, separators=(',', ':')) + ';\n')
for name in ('lib', 'bridge.js', 'hit-events.js', 'world-data.js', 'locomotion-data.js',
             'style.css', 'replay-ab.mp4', 'source-overview.jpg'):
    copy(GAME / name, f'game/{name}')
for name in ('app.js', 'baseline/world.js', 'baseline/play.html', 'integrated/adapter.js', 'integrated/play.html'):
    translate_code(f'game/{name}', GAME / name)

# 6. (4) Improve through validation: round 02 of test_selfevolve. Train = source 0-20 s, Validation = 20-40 s.
SE = BEIJIA / 'test_selfevolve'
MEDIA = {
    'improve/train/source.mp4': SE / 'media/source20.mp4',
    'improve/train/simple_before_proxy.mp4': SE / 'media/A_proxy.mp4',
    'improve/train/simple_after_proxy.mp4': SE / 'round_02/cwm/02_simple/preview/control.mp4',
    'improve/train/ours_before_proxy.mp4': SE / 'media/B_proxy.mp4',
    'improve/train/ours_after_proxy.mp4': SE / 'round_02/cwm/03_ours/preview/control.mp4',
    'improve/validation/source.mp4': SE / 'round_02_validation/evidence/source20.mp4',
    'improve/validation/simple_proxy.mp4': SE / 'round_02_validation/cwm/02_simple/preview/control.mp4',
    'improve/validation/ours_proxy.mp4': SE / 'round_02_validation/cwm/03_ours/preview/control.mp4',
    'improve/validation/simple_render.mp4': SE / 'round_02_validation/cwm/02_simple/output-20s.mp4',
    'improve/validation/ours_render.mp4': SE / 'round_02_validation/cwm/03_ours/output-20s.mp4',
}
for dst, src in MEDIA.items():
    out = HERE / dst
    if not out.exists() or out.stat().st_size != src.stat().st_size:
        copy(src, dst)
    poster = out.with_suffix('.jpg')
    if not poster.exists():
        subprocess.run([FFMPEG, '-v', 'error', '-y', '-i', str(out), '-frames:v', '1', '-vf', 'scale=960:-2', str(poster)], check=True)
PLAY = SE / 'round_02/interactive'
for name in ('player.js', 'player.html'):
    translate_code(f'improve/play/{name}', PLAY / name)
SINGLE = {k[1:-1]: v[1:-1] for d in (CODE['game/baseline/world.js'], CODE['game/integrated/adapter.js']) for k, v in d.items()}
LITERAL = re.compile(r'(["\'`])([^"\'`\n]*[\u4e00-\u9fff][^"\'`\n]*)\1')
for version in ('simple_before', 'simple_after', 'ours_before', 'ours_after'):
    for name in ('proxy.js', 'draw.js', 'simkit.js'):
        copy(PLAY / 'versions' / version / name, f'improve/play/versions/{version}/{name}')
    text = (PLAY / 'versions' / version / 'world.js').read_text(encoding='utf-8')
    text = LITERAL.sub(lambda m: m[1] + ({**SINGLE, **BANK} if m[1] == '"' else {**BANK, **SINGLE})[m[2]] + m[1], text)
    write(f'improve/play/versions/{version}/world.js', text)

# Hand-written pages must be English too.
for page in ('index.html', 'states/viewer.js', 'control/index.html', 'game/index.html', 'improve/rows.js'):
    if (HERE / page).exists():
        assert not CJK.search((HERE / page).read_text(encoding='utf-8')), f'Chinese left in {page}'
print('week8 built')
