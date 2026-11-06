from pathlib import Path
from playwright.sync_api import sync_playwright
import json
ROOT=Path('/shared/perception/personals/beijia/Sim_AngryBird_Visualization');out={'errors':[],'http_errors':[]}
with sync_playwright() as w:
 b=w.chromium.launch(executable_path='/home/beijial2/envs/playwright-browsers/chromium-1243/chrome-linux64/chrome',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':1500,'height':1100});p.on('pageerror',lambda e:out['errors'].append(str(e)));p.on('response',lambda r:out['http_errors'].append([r.status,r.url]) if r.status>=400 and 'favicon' not in r.url else None)
 p.goto('http://127.0.0.1:8510/demo/tennis/game/');p.wait_for_function('window.matchDemo?.ready',timeout=60000)
 out['initial']=p.evaluate('matchDemo.snapshot()')
 out['score_rules']=p.evaluate('''async()=>{const {TennisScore}=await import('/demo/tennis/game/score.js');let s=new TennisScore();const check=(b,m)=>{if(!b)throw Error(m)};for(let i=0;i<3;i++){s.award('near');s.award('far')}check(s.label==='Deuce','deuce');s.award('near');check(s.display('near')==='AD','advantage');s.award('far');check(s.label==='Deuce','back to deuce');s.award('near');s.award('near');check(s.games.near===1&&s.server==='far'&&s.points.near===0,'game/serve rotate');s=new TennisScore();for(let i=0;i<12;i++)for(let j=0;j<4;j++)s.award(i%2?'far':'near');check(s.tieBreak&&s.games.near===6&&s.games.far===6,'6–6 tie-break');const order=[];for(let i=0;i<6;i++){order.push(s.server);s.award(i%2?'far':'near')}check(order.join(',')==='near,far,far,near,near,far','tie serve order');while(!s.winner)s.award('near');check(s.games.near===7&&s.sets.near===1,'tie win');const points=s.totalPoints;s.award('far');check(s.totalPoints===points,'terminal score lock');s=new TennisScore();for(let i=0;i<24;i++)s.award('near');check(s.winner==='near'&&s.games.near===6,'6–0 match');return {deuce:true,advantage:true,game_rotation:true,tie_break:true,terminal_lock:true};}''')
 out['rally']=p.evaluate('''()=>{const g=matchDemo.game;g.reset();g.serve();let iterations=0;for(;iterations<6000;iterations++){const f=g.flight;if(f?.receiver==='near'){g.position.near={...f.target};if(!g.intent&&!f.committed)g.down('KeyJ');}g.tick();if(g.count>=10||g.status==='point_over'||g.status==='error')break;}g.pause();return {iterations,...g.snapshot()}}''')
 print(json.dumps(out,ensure_ascii=False),flush=True)
 assert out['rally']['count']>=10;assert not out['errors'] and not out['http_errors']
 p.screenshot(path=str(ROOT/'demo/tennis/evidence/initial-rally.png'),full_page=True);b.close()
(ROOT/'demo/tennis/evidence/initial-check.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
