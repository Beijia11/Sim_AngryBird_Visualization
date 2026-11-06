from pathlib import Path
from playwright.sync_api import sync_playwright
import json
R=Path('/shared/perception/personals/beijia/Sim_AngryBird_Visualization');E=R/'demo/tennis/evidence';out={'errors':[]}
with sync_playwright() as w:
 b=w.chromium.launch(executable_path='/home/beijial2/envs/playwright-browsers/chromium-1243/chrome-linux64/chrome',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':1440,'height':1000});p.on('pageerror',lambda e:out['errors'].append(str(e)));p.goto('http://127.0.0.1:8510/demo/tennis/game/');p.wait_for_function('window.matchDemo?.ready',timeout=60000)
 out['receiving']=p.evaluate('''async()=>{const {Match}=await import('/demo/tennis/game/engine.js'),base=matchDemo.game,rows=[];for(const [name,offset,side,press] of [['good',-.35,0,true],['near_edge',-.35,.08,true],['too_wide',-.35,.14,true],['too_early',-1.1,0,true],['late',.1,0,true],['no_swing',-.35,0,false]]){const g=new Match(base.players.near.bank,base.players.far.bank,base.data);g.serve();for(let i=0;i<1500&&g.flight?.receiver!=='near'&&!g.reaction;i++)g.tick();if(g.flight?.receiver!=='near')throw Error('failed setup '+g.message);const f=g.flight,n=g.count;g.position.near={u:f.target.u+side,v:f.target.v};while(g.flight===f&&f.age<f.duration+offset)g.tick();if(press&&g.flight===f)g.down('KeyJ');for(let i=0;i<200&&g.flight===f;i++)g.tick();rows.push({name,hit:g.count>n,score:g.score.totalPoints,message:g.message});}return rows;}''')
 print('Receiving',json.dumps(out['receiving']),flush=True)
 out['actual_contact']=p.evaluate('''async()=>{const {Match}=await import('/demo/tennis/game/engine.js'),b=matchDemo.game,g=new Match(b.players.near.bank,b.players.far.bank,b.data);g.flight={origin:{u:.2,v:0},target:{u:.5,v:1.035},progress:1.2};g.position.near={...g.flight.target};return {planned:g.reachable('near'),actual:g.reachable('near',true)};}''')
 out['serve_rotation']=p.evaluate('''()=>{const g=matchDemo.game;g.reset();const servers=[];for(let point=0;point<40&&g.score.games.near+g.score.games.far===0;point++){g.serve();for(let i=0;i<2000&&!g.reaction;i++)g.tick();if(!g.reaction)throw Error(g.message);servers.push(g.events.filter(e=>e.type==='hit'&&e.action==='serve').at(-1)?.actor);if(g.score.games.near+g.score.games.far===0)for(let i=0;i<45;i++)g.tick();}if(g.score.games.near+g.score.games.far!==1||g.score.server!=='far')throw Error('game did not rotate');const before=g.score.totalPoints;for(let i=0;i<200&&!g.flight;i++)g.tick();const result={servers,score:g.score.snapshot(),autoFarServe:g.flight?.hitter==='far'&&g.flight?.isServe,automaticStart:g.serving||!!g.flight};g.pause();matchDemo.render();return result;}''')
 p.screenshot(path=str(E/'balanced-server.png'),full_page=True)
 out['no_cap']=p.evaluate('''async()=>{const {Match}=await import('/demo/tennis/game/engine.js'),b=matchDemo.game,g=new Match(b.players.near.bank,b.players.far.bank,b.data);g.serve();for(let i=0;i<8000&&g.count<12&&!g.reaction;i++){const f=g.flight;if(f?.receiver==='near'){g.position.near={...f.target};if(f.duration-f.age<=.4&&!f.committed)g.down('KeyJ');}g.tick();}return {shots:g.count,status:g.status,reason:g.message};}''')
 assert [r['hit'] for r in out['receiving']]==[True,True,False,False,False,False]
 assert out['actual_contact']=={'planned':True,'actual':False}
 assert out['serve_rotation']['autoFarServe'] and out['serve_rotation']['automaticStart']
 assert out['no_cap']['shots']>=12
 assert not out['errors'];b.close()
(E/'balance-check.json').write_text(json.dumps(out,ensure_ascii=False,indent=2));print(json.dumps(out,ensure_ascii=False))
