"""Exercise the real demo iframe under a GitHub Pages-like path prefix."""
from pathlib import Path
from functools import partial
from threading import Thread
from http.server import ThreadingHTTPServer
import importlib.util,json
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[3];E=R/'demo/tennis/evidence'
spec=importlib.util.spec_from_file_location('preview',R/'week10/serve_week10.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class Prefix(module.Handler):
 def translate_path(self,path):return super().translate_path(path[5:] if path.startswith('/repo/') else path)
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Prefix,directory=str(R)));thread=Thread(target=server.serve_forever,daemon=True);thread.start();out={'errors':[],'http_errors':[]};url=f'http://127.0.0.1:{server.server_port}/repo/demo/tennis/'
try:
 with sync_playwright() as w:
  b=w.chromium.launch(executable_path='/home/beijial2/envs/playwright-browsers/chromium-1243/chrome-linux64/chrome',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':1440,'height':1000});p.on('pageerror',lambda e:out['errors'].append(str(e)));p.on('response',lambda r:out['http_errors'].append([r.status,r.url]) if r.status>=400 and 'favicon' not in r.url else None)
  p.goto(url);p.wait_for_function('window.atlasSummary?.current',timeout=60000);p.locator('#play-frame').scroll_into_view_if_needed();game=p.locator('#play-frame').element_handle().content_frame();game.wait_for_function('window.matchDemo?.ready',timeout=60000);out['iframe_url']=game.url;assert '/repo/demo/tennis/game/' in game.url
  game.locator('#serve').click();game.wait_for_function('matchDemo.game.count>=2',timeout=20000);out['live_serve_agent_return']=True
  game.wait_for_function('matchDemo.game.score.totalPoints>=1',timeout=20000);out['live_scored']=game.evaluate('matchDemo.game.score.snapshot()');assert out['live_scored']['totalPoints']==1
  game.locator('#pause').click();assert not game.evaluate('document.documentElement.scrollWidth>innerWidth+1');p.screenshot(path=str(E/'embed-desktop.png'))
  p.set_viewport_size({'width':390,'height':844});assert not p.evaluate('document.documentElement.scrollWidth>innerWidth+1');assert not game.evaluate('document.documentElement.scrollWidth>innerWidth+1');out['mobile_no_overflow']=True;p.screenshot(path=str(E/'embed-mobile.png'));assert not out['errors'];assert not out['http_errors'],out['http_errors'];b.close()
finally:server.shutdown();server.server_close()
(E/'embed-check.json').write_text(json.dumps(out,ensure_ascii=False,indent=2));print(json.dumps(out,ensure_ascii=False))
