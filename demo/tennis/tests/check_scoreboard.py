"""Verify source scoreboard reuse, live score changes and foreground composition."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
R=Path(__file__).resolve().parents[3];E=R/'demo/tennis/evidence';out={'errors':[]}
with sync_playwright() as w:
 b=w.chromium.launch(executable_path='/home/beijial2/envs/playwright-browsers/chromium-1243/chrome-linux64/chrome',headless=True,args=['--no-sandbox'])
 p=b.new_page(viewport={'width':1500,'height':1000});p.on('pageerror',lambda e:out['errors'].append(str(e)))
 p.goto('http://127.0.0.1:8510/demo/tennis/game/');p.wait_for_function('window.matchDemo?.ready',timeout=60000)
 out['zero']=p.evaluate('''()=>{const g=matchDemo.game;g.reset();g.pause();matchDemo.render();return g.score.snapshot();}''')
 assert out['zero']['display']=={'near':'0','far':'0'} and out['zero']['games']=={'near':0,'far':0}
 p.locator('#court').screenshot(path=str(E/'broadcast-score-zero.png'))
 out['rendering']=p.evaluate('''async()=>{
 const {drawScore}=await import('/demo/tennis/game/hud.js');const im=new Image();im.src='/week10/atlas/play-assets/court-01.jpg';await im.decode();
 const c=document.createElement('canvas');c.width=1280;c.height=720;const ctx=c.getContext('2d');const calls=[];const fill=ctx.fillText.bind(ctx);ctx.fillText=(...args)=>{calls.push(args);fill(...args)};
 const source=document.createElement('canvas');source.width=1280;source.height=720;const sc=source.getContext('2d');sc.drawImage(im,0,0);
 const pixels=(context,x,y,w,h)=>Array.from(context.getImageData(x,y,w,h).data).join(',');
 const g=matchDemo.game;ctx.fillStyle='#ff00ff';ctx.fillRect(0,0,1280,720);drawScore(ctx,g,im);
 const zero=pixels(ctx,395,593,27,27);const namesMatch=pixels(ctx,130,600,155,18)===pixels(sc,130,600,155,18);
 g.score.award('near');drawScore(ctx,g,im);const changed=zero!==pixels(ctx,395,593,27,27);matchDemo.render();
 const liveCalls=calls.filter(a=>a[0]==='15'&&a[1]===408);return {namesMatch,pointPixelsChanged:changed,livePointText:liveCalls.length>0,score:g.score.snapshot()};
 }''')
 assert all(out['rendering'][k] for k in ['namesMatch','pointPixelsChanged','livePointText'])
 assert out['rendering']['score']['display']=={'near':'15','far':'0'}
 p.locator('#court').screenshot(path=str(E/'broadcast-score-point.png'))
 assert not out['errors'];b.close()
(E/'scoreboard-check.json').write_text(json.dumps(out,indent=2));print(json.dumps(out))
