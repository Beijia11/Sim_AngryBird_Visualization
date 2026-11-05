"""Browser check of week 10 served like GitHub Pages (sub-path, static files, HTTP Range).

Usage: /home/beijial2/envs/edenlive/bin/python check_week10.py http://127.0.0.1:8471/Sim_AngryBird_Visualization/week10/ OUT_DIR
Visits the week page and the four sections, exercises each one briefly, records console errors, failed requests,
remaining Chinese text and horizontal overflow, and saves screenshots. Writes OUT_DIR/check.json.
"""
import json, re, sys
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE, OUT = sys.argv[1], Path(sys.argv[2]); OUT.mkdir(parents=True, exist_ok=True)
CHROME = '/home/beijial2/envs/playwright-browsers/chromium-1243/chrome-linux64/chrome'
CJK = re.compile(r'[　-〿一-鿿＀-￯]')
report = {}

def visit(page, name, url, act, width=1440):
    errors, failed = [], []
    page.on('console', lambda m: m.type == 'error' and errors.append(m.text))
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('response', lambda r: r.status >= 400 and failed.append(f'{r.status} {r.url}'))
    page.on('requestfailed', lambda r: failed.append(f'FAILED {r.url} {r.failure}'))
    page.set_viewport_size({'width': width, 'height': 1000})
    page.goto(url, wait_until='load'); page.wait_for_timeout(2500)
    info = act(page) or {}
    page.wait_for_timeout(1500)
    text = page.evaluate('document.body.innerText')
    info.update(errors=errors[:20], failed=failed[:20], chinese=sorted(set(CJK.findall(text)))[:30],
                overflow=page.evaluate('document.documentElement.scrollWidth>innerWidth+1'))
    page.screenshot(path=str(OUT / f'{name}.png'), full_page=False)
    report[name] = info; print(name, json.dumps(info, ensure_ascii=False)[:600])

def home(p):
    return {'entries': p.eval_on_selector_all('.entry', 'a=>a.map(x=>x.getAttribute("href"))')}

def near(p):
    p.wait_for_function('window.motionAtlas?.ready', timeout=60000)
    p.click('.state-folder summary'); p.click('.seq-card'); p.wait_for_timeout(1500)
    dialog = p.inner_text('#sequence-info')[:200]; p.keyboard.press('Escape')
    p.click('#pair-random'); p.wait_for_timeout(2000)
    p.locator('#control').scroll_into_view_if_needed(); p.click('#control canvas', force=True)
    p.keyboard.down('ArrowLeft'); p.wait_for_timeout(1200); p.keyboard.up('ArrowLeft'); p.keyboard.press('KeyJ'); p.wait_for_timeout(1500)
    return {'dialog': dialog, 'control_note': p.inner_text('#control-note')[:200],
            'video_ready': p.evaluate('document.querySelector("#source-video").readyState')}

def summary(p):
    p.wait_for_function('window.atlasSummary?.ready', timeout=60000); p.wait_for_timeout(2000)
    p.evaluate('document.querySelector("#summary-video").currentTime=12'); p.wait_for_timeout(1500)
    return {'rows': p.inner_text('#row-count'), 'clock': p.inner_text('#video-clock'),
            'nodes': p.evaluate('document.querySelectorAll(".relation-svg circle").length'),
            'video_ready': p.evaluate('document.querySelector("#summary-video").readyState')}

def play(p):
    p.wait_for_function('window.matchDemo?.ready', timeout=90000)
    p.click('#court'); p.keyboard.press('KeyS'); p.wait_for_timeout(4000)
    return {'rally': p.inner_text('#rally'), 'message': p.inner_text('#message'),
            'failures': p.evaluate('window.matchDemo.assetFailures.length')}

def generated(p):
    p.wait_for_function('window.generatedAtlas?.data', timeout=60000)
    p.click('#together'); p.wait_for_timeout(1500)
    p.select_option('#kind', 'transition'); p.wait_for_timeout(800); p.click('#together'); p.wait_for_timeout(1500)
    p.click('[data-role="far"]'); p.wait_for_timeout(1500)
    fr = p.frame_locator('#play-frame')
    ok = p.evaluate('new Promise(r=>{const f=document.querySelector("#play-frame");let n=0;const t=setInterval(()=>{if(f.contentWindow?.matchDemo?.ready||++n>120){clearInterval(t);r(!!f.contentWindow?.matchDemo?.ready)}},500)})')
    return {'progress': p.inner_text('#progress'), 'title': p.inner_text('#item-title'), 'frame_info': p.inner_text('#frame-info'), 'play_frame_ready': ok}

with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=CHROME, args=['--autoplay-policy=no-user-gesture-required'])
    for name, path, act in [('week10', '', home), ('near', 'atlas/near/', near), ('summary', 'atlas/summary/', summary),
                            ('play', 'atlas/play/', play), ('generated', 'atlas/generated/', generated)]:
        visit(b.new_page(), name, BASE + path, act)
    visit(b.new_page(), 'week10-mobile', BASE, home, width=390)
    visit(b.new_page(), 'summary-mobile', BASE + 'atlas/summary/', summary, width=390)
    b.close()
(OUT / 'check.json').write_text(json.dumps(report, indent=1, ensure_ascii=False))
