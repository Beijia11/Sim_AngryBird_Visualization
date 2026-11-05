"""Step 1: mirror the four Motion Atlas sections from the running hub server into a local staging dir.

The hub server (tennis_motion_hub_v1/scripts/serve.py) resolves its routes from several modules and /tmp caches,
so the simplest faithful copy is to fetch every URL the four pages use, byte for byte, keeping the route as the path.
Usage: python3 mirror_atlas.py [--server http://127.0.0.1:8137] [--out /home/beijial2/datasets/week10_atlas_raw]
Writes to local disk on purpose: thousands of small writes to the /shared NFS can stall (see repo README).
"""
import argparse, json, re, os, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ap = argparse.ArgumentParser()
ap.add_argument('--server', default='http://127.0.0.1:8137')
ap.add_argument('--out', default='/home/beijial2/datasets/week10_atlas_raw')
a = ap.parse_args(); S = a.server; OUT = Path(a.out)

def get(u): return urllib.request.urlopen(S + u, timeout=120).read()
def js(u): return json.loads(get(u))
MEDIA = re.compile(r'\.(?:webp|jpg|jpeg|png|mp4|json)(?:\?v=[0-9a-f]+)?$')
def strs(o, out):
    if isinstance(o, dict): [strs(v, out) for v in o.values()]
    elif isinstance(o, list): [strs(v, out) for v in o]
    elif isinstance(o, str) and MEDIA.search(o) and not o.startswith(('/shared/perception', '/tmp/', '/home/')): out.add(o.split('?')[0])
    return out
def res(base, p): return p if p.startswith('/') else base + p

urls = set()
# fixed page files (route -> stored path); '/x/' routes are stored as x/index.html
urls |= {'/near/', '/near/app.js', '/near/graph.js', '/near/player.js', '/near/style.css', '/near/manifest.json',
         '/far/player.js',
         '/hub.css', '/hub-nav.css', '/hub-nav.js',
         '/summary/', '/summary.js', '/summary-graph.js', '/summary-graph.css', '/summary-graph-data.json', '/hub-data.json', '/shared/ball.json',
         '/play/', '/play/app.js', '/play/asset-cache.js', '/play/banks.js', '/play/engine.js', '/play/style.css', '/play-data.json',
         '/generated/', '/generated/app.js', '/generated/player.js', '/generated/style.css', '/generated/catalog.json', '/generated/asset-map.json',
         '/generated-play/', '/generated-play/app.js', '/generated-play/asset-cache.js', '/generated-play/banks.js', '/generated-play/engine.js', '/generated-play/style.css'}
for sid in ['01', '05', '07', '08']: urls |= {f'/source/{sid}', f'/shared/ball-{sid}.mp4'}
# near Atlas: every media path in its manifest, relative to /near/
urls |= {res('/near/', p) for p in strs(js('/near/manifest.json'), set())}
# play: banks + poses + the atlases they name (relative to /near/ or /far/)
for page, pat in [('/play/banks.js', r'"(/play-assets/[^"]+)"'), ('/generated-play/banks.js', r'"(/generated-play/banks/[^"]+)"')]:
    for u, role in zip(re.findall(pat, get(page).decode()), ['near', 'far']):
        urls.add(u); urls |= {res(f'/{role}/', p) for p in strs(js(u), set())}
urls |= {res('/', p) for p in strs(js('/play-data.json'), set())}
# generated: catalog (original atlases relative to /near/ /far/, new RGBA absolute) + asset map
for role, b in js('/generated/catalog.json')['players'].items(): urls |= {res(f'/{role}/', p) for p in strs(b, set())}
urls |= strs(js('/generated/asset-map.json'), set())
for u in ['/hub-data.json', '/summary-graph-data.json', '/shared/ball.json']: urls |= {p for p in strs(js(u), set()) if p.startswith('/') and p.count('/') > 1}

def store(u):
    p = OUT / (u.lstrip('/') + ('index.html' if u.endswith('/') else ''))
    if u.startswith('/source/'): p = p.with_name(p.name + '.mp4')
    if p.exists(): return u, 'kept'
    try: blob = get(u)
    except Exception as e: return u, f'ERR {e}'
    p.parent.mkdir(parents=True, exist_ok=True); tmp = p.with_name(p.name + '.part'); tmp.write_bytes(blob); os.replace(tmp, p)
    return u, len(blob)
with ThreadPoolExecutor(16) as ex: out = dict(ex.map(store, sorted(urls)))
errs = {u: r for u, r in out.items() if isinstance(r, str) and r.startswith('ERR')}
(OUT / '_mirror.json').write_text(json.dumps({'server': S, 'count': len(out), 'errors': errs}, indent=1))
print(len(out), 'urls;', len(errs), 'errors'); [print(' ', u, r) for u, r in list(errs.items())[:20]]
