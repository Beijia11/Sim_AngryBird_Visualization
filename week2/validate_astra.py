"""Check local summary links, inline documents, and both interactive game embeds."""
from pathlib import Path
from urllib.parse import urlsplit,unquote
from html.parser import HTMLParser
import json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent
class Links(HTMLParser):
    def __init__(self):super().__init__();self.values=[]
    def handle_starttag(self,tag,attrs):
        for k,v in attrs:
            if k in ['href','src','poster','data-src'] and v:self.values.append(v)
checks=[]
for name in ['index.html','astra/pacman/index.html','astra/pacman/embed.html','astra/angry-birds/index.html','astra/angry-birds/embed.html']:
    p=ROOT/name;parser=Links();parser.feed(p.read_text())
    for url in parser.values:
        u=urlsplit(url)
        if u.scheme or not u.path:continue
        assert (p.parent/unquote(u.path)).exists(),(name,url)
checks.append('Every local link, script, poster, video, and embed target exists')
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/google/chrome/chrome',headless=True,args=['--no-sandbox','--disable-gpu'],timeout=30000,env={'XDG_CONFIG_HOME':'/tmp/summary-chrome-config','XDG_CACHE_HOME':'/tmp/summary-chrome-cache'})
    context=b.new_context(viewport={'width':1440,'height':1000},offline=True)
    print('Browser launched',flush=True);page=context.new_page();errors=[];page.on('pageerror',lambda e:(errors.append(str(e)),print('JS ERROR:',e,flush=True)));page.goto((ROOT/'index.html').as_uri());page.locator('a[href="#astra"]').first.click()
    assert page.locator('#spatial-map video').count()==4 and page.locator('#action video').count()==8
    assert page.locator('#astra .astra-case').count()==2
    assert page.locator('.astra-game-frame[src="about:blank"]').count()==2
    checks.append('Existing 12 experiment videos remain; two Astra cases are initially unloaded')
    for cid in ['pacman','angry-birds']:
        card=page.locator('#astra-'+cid)
        card.locator('.astra-report summary').click();assert card.locator('.astra-document table').count()>0
        assert card.locator('.astra-document').inner_text().strip()
        card.locator('.astra-report summary').click()
        card.locator('.astra-source summary').click()
        tabs=card.locator('[role=tab]')
        for i in range(tabs.count()):
            tabs.nth(i).click();panel=card.locator('[role=tabpanel]:visible');assert panel.count()==1 and len(panel.inner_text())>100
        tabs.first.focus();page.keyboard.press('ArrowRight');assert tabs.nth(1).get_attribute('aria-selected')=='true'
        card.locator('.astra-source summary').click()
        card.locator('video').evaluate('(v)=>{v.preload="metadata";v.load()}')
        page.wait_for_function('(id)=>document.querySelector(id+" video").readyState>=1',arg='#astra-'+cid,timeout=15000)
    checks.append('Both reports render as readable HTML; source tabs, keyboard navigation, and reference decoding work')
    assert 'data.js' not in page.locator('#astra-angry-birds [role=tablist]').text_content()
    assert 'data.js' in page.locator('#astra-pacman [role=tablist]').text_content()
    page.locator('#astra').screenshot(path=str(ROOT/'validation/astra-overview.png'))
    pac=page.locator('#astra-pacman');pac.locator('[data-start-game]').click();pf=page.frame_locator('#astra-pacman iframe');pf.locator('#start').click();pf.locator('#game').focus();page.keyboard.press('ArrowUp');page.wait_for_timeout(350)
    pframe=next(f for f in page.frames if f.url.endswith('/pacman/embed.html'));s=pframe.evaluate('maze.snapshot()');assert s['player']['y']<8,s
    page.wait_for_timeout(100);assert int(pac.locator('iframe').evaluate('(f)=>f.getBoundingClientRect().height'))<1500
    assert not pframe.evaluate('document.documentElement.scrollWidth>innerWidth')
    pac.screenshot(path=str(ROOT/'validation/pacman-embedded.png'))
    pac.locator('[data-stop-game]').click();assert pac.locator('iframe').get_attribute('src')=='about:blank'
    checks.append('Embedded Pac-Man receives keyboard input, resizes, and unloads on close')
    angry=page.locator('#astra-angry-birds');angry.locator('[data-start-game]').click();af=page.frame_locator('#astra-angry-birds iframe');af.locator('#demo').wait_for(state='visible')
    aframe=next(f for f in page.frames if f.url.endswith('/angry-birds/embed.html'))
    aframe.wait_for_function('typeof reconstruction!=="undefined"',timeout=15000);af.locator('#demo').click()
    aframe.wait_for_function('reconstruction.snapshot().targetGone',timeout=15000)
    assert af.locator('#angle').is_visible() and af.locator('#launch').is_visible()
    page.wait_for_timeout(100);assert not aframe.evaluate('document.documentElement.scrollWidth>innerWidth')
    angry.screenshot(path=str(ROOT/'validation/angry-birds-embedded.png'))
    angry.locator('[data-stop-game]').click()
    checks.append('Embedded Angry Birds executes a physical shot and retains the angle/strength controls')
    page.set_viewport_size({'width':390,'height':844});page.locator('#astra-pacman').scroll_into_view_if_needed();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    pac.locator('[data-start-game]').click();pf=page.frame_locator('#astra-pacman iframe');pf.locator('#start').click();pf.locator('[data-dir="up"]').dispatch_event('pointerdown');page.wait_for_timeout(100)
    pframe=next(f for f in page.frames if f.url.endswith('/pacman/embed.html'));assert pframe.evaluate('maze.snapshot().player.y')<8
    assert not pframe.evaluate('document.documentElement.scrollWidth>innerWidth');pac.screenshot(path=str(ROOT/'validation/mobile-embedded.png'));pac.locator('[data-stop-game]').click()
    angry.locator('[data-start-game]').click();af=page.frame_locator('#astra-angry-birds iframe');af.locator('#angle').wait_for(state='visible');aframe=next(f for f in page.frames if f.url.endswith('/angry-birds/embed.html'));assert not aframe.evaluate('document.documentElement.scrollWidth>innerWidth');assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    checks.append('390px mobile layout fits; embedded touch buttons and launch sliders remain usable')
    assert not errors,errors;checks.append('No JavaScript errors; local file use works with networking disabled')
    result={'status':'PASS','checks':checks};(ROOT/'validation/results.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2));b.close()
