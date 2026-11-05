"""Step 3: build week10/atlas/ (static, English, relative paths) from the mirror and the compressed atlases.

  python3 mirror_atlas.py                                   # 1. fetch the four sections from the hub server
  /home/beijial2/envs/edenlive/bin/python compress_atlas.py  # 2. lossy WebP copies of the atlases
  python3 build_week10.py                                   # 3. this script -> STAGE, then sync into week10/atlas

The hub serves everything from absolute routes (/near/, /summary.js, /source/01 ...). GitHub Pages serves the repo
under /Sim_AngryBird_Visualization/, so every route becomes a path relative to the section pages, which all sit one
level below atlas/ (atlas/near/, atlas/summary/, atlas/play/, atlas/generated/, atlas/generated-play/).
The far-player page itself is not part of week 10; its atlases are copied because Composite and Visual Quality use them,
and links into it are shown as plain text (CSS in hub-nav.css).
"""
import json, os, re, shutil, subprocess, sys
from pathlib import Path
from i18n_week10 import CODE, DATA

HERE = Path(__file__).resolve().parent
RAW = Path('/home/beijial2/datasets/week10_atlas_raw')
WEBP = Path('/home/beijial2/datasets/week10_atlas_webp_q90')
STAGE = Path('/home/beijial2/datasets/week10_atlas_site')
CJK = re.compile(r'[　-〿一-鿿＀-￯]')
TEXT = {'.html', '.js', '.css', '.json'}

ROUTES = r'(?:near/|far/|summary/|play/|play-assets/|play-data\.json|generated/|generated-play/|source/|shared/ball|hub\.css|hub-nav\.css|hub-nav\.js|hub-data\.json|summary\.js|summary-graph|\$\{)'
CODE_ROUTE = re.compile(r'(["\'`(])/(' + ROUTES + ')')
DATA_ROUTE = re.compile(r'^/(?=' + ROUTES + ')')

# Exact edits after the route rewrite: /source/<id> is stored as source/<id>.mp4 (Pages needs an extension).
PATCHES = {
    'near/app.js': [("v.src='../source/'+id;", "v.src='../source/'+id+'.mp4';"),
                    ("v.src='../source/'+a.source_id;", "v.src='../source/'+a.source_id+'.mp4';"),
                    ('href="../source/${s.source_id}#t=', 'href="../source/${s.source_id}.mp4#t=')],
    'summary.js': [("v.src='../source/'+id;", "v.src='../source/'+id+'.mp4';"),
                   ("new URL(v.currentSrc||v.src,location.href).pathname!=='../source/'+source.source_id",
                    "!new URL(v.currentSrc||v.src,location.href).pathname.endsWith('/source/'+source.source_id+'.mp4')")],
    # Section names for week 10 (user: Character Modelling / Action & Dynamic / Composite / Visual Quality Improvement)
    'near/index.html': [('<small>02 / ALL STATES</small>', '<small>01 / CHARACTER MODELLING</small>')],
    'summary/index.html': [('03 / PLAYERS × BALL', '02 / ACTION &amp; DYNAMIC')],
    'play/index.html': [('04 / PLAY TOGETHER', '03 / COMPOSITE')],
    'generated/index.html': [('05 / MOTION VIDEO LIBRARY', '04 / VISUAL QUALITY IMPROVEMENT')],
    'generated-play/index.html': [('05 / GENERATED RGBA', '04 / GENERATED RGBA')],
}

HUB_NAV = r"""// Week 10 copy of the hub navigation: four sections, relative links, home = the week 10 page.
const parts=location.pathname.split('/').filter(Boolean),seg=parts.at(-1)==='index.html'?parts.at(-2):parts.at(-1);
const role=document.body.dataset.section||seg,links=[['near','Character Modelling'],['summary','Action &amp; Dynamic'],['play','Composite'],['generated','Visual Quality']];
const nav=document.createElement('nav');nav.className='atlas-sections';nav.setAttribute('aria-label','Week 10 sections');nav.innerHTML=`<a class="atlas-home" href="../../">&larr; <span>WEEK 10</span></a><div>${links.map(([id,label],i)=>`<a href="../${id}/" ${id===role?'aria-current="page"':''}><small>0${i+1}</small> ${label}</a>`).join('')}</div>`;document.body.prepend(nav);document.body.classList.add('with-atlas-sections');
// Context links from Action & Dynamic open the near-player viewer at a source time / sequence (unchanged logic).
async function context(){const q=new URLSearchParams(location.search);if(!q.has('source')&&!q.has('sequence'))return;for(let n=0;n<200&&!window.motionAtlas?.ready;n++)await new Promise(r=>setTimeout(r,50));if(!window.motionAtlas?.ready)return;const select=document.querySelector('#source-select'),v=document.querySelector('#source-video');if(q.has('source')&&[...select.options].some(o=>o.value===q.get('source'))){const t=Number(q.get('time')||0);v.addEventListener('loadedmetadata',()=>{v.currentTime=Math.max(0,Math.min(t,v.duration-.01))},{once:true});select.value=q.get('source');select.dispatchEvent(new Event('change'));}if(q.has('sequence')&&motionAtlas.seqs.has(q.get('sequence')))motionAtlas.openSequence(q.get('sequence'));}
context();
"""
HUB_NAV_CSS = """
/* week 10: the far-player Atlas page is not included, so links into it read as plain text */
a[href*="../far/?"]{pointer-events:none;cursor:default;color:inherit;text-decoration:none}
/* week 10: the English section names are wider; let the bar wrap on phones instead of overflowing */
@media (max-width:640px){.atlas-sections>div{flex-wrap:wrap;justify-content:flex-start;row-gap:0}.atlas-sections>div>a{padding:10px 6px}}
"""

NUM = re.compile(r'\d+(?:\.\d+)?')
missing = set()
def data_en(s):
    if not CJK.search(s): return s
    key = NUM.sub('#', s)
    if key not in DATA: missing.add(key); return s
    nums = iter(NUM.findall(s)); return re.sub('#', lambda _: next(nums), DATA[key])

def walk(o):
    if isinstance(o, dict): return {data_en(k): walk(v) for k, v in o.items()}
    if isinstance(o, list): return [walk(v) for v in o]
    if isinstance(o, str): return DATA_ROUTE.sub('../', data_en(o))
    return o

# User (2026-11-05): do not call it "Motion Atlas"; use a tennis name. Applied last to every page file.
BRAND = [('<b class="mark">m↗</b>MOTION ATLAS', '<b class="mark">t↗</b>TENNIS'), ('MOTION ATLAS', 'TENNIS'),
         ('Motion Atlas expanded graph', 'Expanded action graph'), (' | Motion Atlas</title>', ' | Tennis</title>')]

CODE_SORTED = sorted(CODE, key=lambda kv: -len(kv[0]))
used = set()
def code_en(rel, text):
    text = CODE_ROUTE.sub(r'\1../\2', text)
    for zh, en in PATCHES.get(rel, []):
        assert zh in text, f'{rel}: patch target not found: {zh[:70]}'
        text = text.replace(zh, en)
    for zh, en in CODE_SORTED:
        if zh in text: used.add(zh); text = text.replace(zh, en)
    for old, new in BRAND: text = text.replace(old, new)
    return text.replace('lang="zh-CN"', 'lang="en"')

def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True); tmp = path.with_name(path.name + '.part')
    (tmp.write_text(data, encoding='utf-8') if isinstance(data, str) else tmp.write_bytes(data)); os.replace(tmp, path)

def main():
    if STAGE.exists(): shutil.rmtree(STAGE)
    left = {}; n = 0
    for src in sorted(RAW.rglob('*')):
        if not src.is_file() or src.name.startswith('_'): continue
        rel = src.relative_to(RAW).as_posix(); dst = STAGE / rel; n += 1
        if rel == 'hub-nav.js': out = HUB_NAV
        elif src.suffix == '.json':
            out = json.dumps(walk(json.loads(src.read_text(encoding='utf-8'))), ensure_ascii=False, separators=(',', ':'))
        elif src.suffix in TEXT:
            out = code_en(rel, src.read_text(encoding='utf-8'))
            if rel == 'hub-nav.css': out += HUB_NAV_CSS
        else:
            alt = WEBP / rel
            dst.parent.mkdir(parents=True, exist_ok=True)
            os.link(alt if src.suffix == '.webp' and alt.exists() else src, dst)  # same local disk: hard link, no copy
            continue
        if CJK.search(out): left[rel] = sorted(set(CJK.findall(out)))[:40]
        write(dst, out)
    assert not missing, f'DATA templates missing ({len(missing)}): ' + ' | '.join(sorted(missing)[:30])
    assert not left, 'Chinese left: ' + json.dumps(left, ensure_ascii=False)[:3000]
    unused = [zh for zh, _ in CODE if zh not in used]
    if unused: print('note: unused CODE keys:', len(unused), [u[:40] for u in unused[:20]])
    print(f'{n} files -> {STAGE}')
    print(subprocess.run(['du', '-shL', str(STAGE)], capture_output=True, text=True).stdout.strip())

if __name__ == '__main__':
    main()
