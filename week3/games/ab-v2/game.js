'use strict';
const {Engine,Bodies,Body,Composite,Events,Vector}=Matter;
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
const W=1280,H=720,GROUND=640,ANCHOR={x:185,y:535},MAX_PULL=104,LAUNCH_SCALE=.20;
let detailView=false, previewCache=null;
let engine,blocks=[],birds=[],target,bird,phase='ready',paused=false,dragging=false,pointerId=null,pull={...ANCHOR},score=0,used=0,flightTime=0,time=0,targetGone=false,victoryDelay=0,particles=[],popups=[],trail=[],pending=new Set(),settling=false,impacts=0;
const $=id=>document.getElementById(id);
function addBox(x,y,w,h,kind='wood',fixed=false){const b=Bodies.rectangle(x,y,w,h,{isStatic:fixed,density:kind==='glass'?.0011:.002,friction:.65,frictionStatic:1,restitution:.035,frictionAir:.002,label:kind});b.art={kind,w,h,hp:kind==='glass'?19:55,maxHp:kind==='glass'?19:55,seed:x+y,original:{x,y}};Composite.add(engine.world,b);if(!fixed)blocks.push(b);return b;}
function newBird(){bird=Bodies.circle(ANCHOR.x,ANCHOR.y,18,{density:.009,friction:.6,restitution:.18,frictionAir:0,label:'bird'});Body.setStatic(bird,true);birds.push(bird);Composite.add(engine.world,bird);pull={...ANCHOR};phase='ready';flightTime=0;trail=[];dragging=false;}
function reset(){previewCache=null;if(engine)Engine.clear(engine);engine=Engine.create({enableSleeping:true,positionIterations:10,velocityIterations:10});engine.gravity.y=.7;engine.timing.timeScale=.7;blocks=[];birds=[];score=0;used=0;time=0;targetGone=false;victoryDelay=0;particles=[];popups=[];trail=[];pending=new Set();paused=false;dragging=false;pointerId=null;impacts=0;
 addBox(640,670,1700,60,'ground',true);addBox(940,591,270,14,'platform',true);
 addBox(884,522,14,124);addBox(996,522,14,124);addBox(940,453,140,14);
 addBox(910,384,14,124);addBox(970,384,14,124);addBox(940,315,74,14);addBox(940,291,14,34);
 addBox(940,439,34,14);addBox(940,580,68,8);addBox(917,552,12,48,'glass');addBox(963,552,12,48,'glass');addBox(940,521,68,14);
 target=Bodies.circle(940,413,18,{density:.002,friction:.7,restitution:.1,label:'target'});target.hp=18;Composite.add(engine.world,target);
 Events.on(engine,'collisionStart',event=>{if(settling||used===0)return;for(const pair of event.pairs){const a=pair.bodyA,b=pair.bodyB;const va=a._impactVelocity||a.velocity,vb=b._impactVelocity||b.velocity;const speed=Math.hypot(va.x-vb.x,va.y-vb.y);if(speed<2.6)continue;impacts++;
 for(const body of [a,b]){if(body.label==='target'&&!targetGone){body.hp-=(speed-2)*9;if(body.hp<=0)pending.add(body);}if(body.art&&!body.isStatic){body.art.hp-=(speed-2.6)*9;if(body.art.hp<=0)pending.add(body);}}}});
 settling=true;for(let i=0;i<220;i++)Engine.update(engine,1000/120);settling=false;newBird();$('overlay').hidden=true;$('pause').textContent='Pause';syncUI();draw();}
function burst(x,y,color,count=16){for(let i=0;i<count;i++){const a=i*2.39996;particles.push({x,y,vx:Math.cos(a)*(40+(i%5)*30),vy:Math.sin(a)*(40+(i%7)*25)-70,life:.65+(i%4)*.15,max:1.1,size:2+i%5,color,rotation:a});}}
function destroy(b){if(b===target){if(targetGone)return;targetGone=true;score+=5000;burst(b.position.x,b.position.y,'#89b744',26);popups.push({x:b.position.x,y:b.position.y-25,text:'+5,000',life:1.8,color:'#547d25'});victoryDelay=2.5;}else{const i=blocks.indexOf(b);if(i<0)return;blocks.splice(i,1);score+=b.art.kind==='glass'?300:150;burst(b.position.x,b.position.y,b.art.kind==='glass'?'#8dd4e3':'#c58b42');popups.push({x:b.position.x,y:b.position.y,text:b.art.kind==='glass'?'+300':'+150',life:1,color:'#8f6e36'});}Composite.remove(engine.world,b);
 // Removing a support invalidates the resting state of bodies above it.
 // This level is small: wake every remaining dynamic body after removal.
 for(const remaining of Composite.allBodies(engine.world)){
  if(!remaining.isStatic)Matter.Sleeping.set(remaining,false);
 }
}
function setPull(x,y){let dx=x-ANCHOR.x,dy=y-ANCHOR.y;const len=Math.hypot(dx,dy);if(len>MAX_PULL){dx*=MAX_PULL/len;dy*=MAX_PULL/len;}pull={x:ANCHOR.x+dx,y:ANCHOR.y+dy};Body.setPosition(bird,pull);}
function launch(){if(paused||!['ready','aiming'].includes(phase))return;const dx=ANCHOR.x-pull.x,dy=ANCHOR.y-pull.y;if(Math.hypot(dx,dy)<8){setPull(ANCHOR.x,ANCHOR.y);phase='ready';dragging=false;pointerId=null;return;}Body.setStatic(bird,false);Body.setVelocity(bird,{x:dx*LAUNCH_SCALE,y:dy*LAUNCH_SCALE});Body.setAngularVelocity(bird,-.035);phase='flying';used++;flightTime=0;dragging=false;pointerId=null;syncUI();}
function settingsShot(){if(paused||phase!=='ready')return;const a=Number($('angle').value)*Math.PI/180,r=MAX_PULL*Number($('power').value)/100;setPull(ANCHOR.x-Math.cos(a)*r,ANCHOR.y+Math.sin(a)*r);launch();}
function nextBird(){if(paused||phase!=='flying'||flightTime<1||targetGone)return;if(used<3)newBird();else if(flightTime>7)finish(false);syncUI();}
function finish(win){phase=win?'won':'lost';$('resultTitle').textContent=win?'A beautiful chain reaction.':'One more angle?';$('resultText').textContent=win?`Target cleared. ${score.toLocaleString()} points from ${used} ${used===1?'bird':'birds'}.`:'The target is still standing. Reset the tower and try a different pull.';$('again').textContent=win?'Play again ↗':'Try again ↗';$('overlay').hidden=false;syncUI();}
function step(dt){if(paused)return;time+=dt;
 if(used>0){if(phase==='flying')flightTime+=dt;for(const b of Composite.allBodies(engine.world))b._impactVelocity=Body.getVelocity(b);Engine.update(engine,dt*1000);for(const b of pending)destroy(b);pending.clear();if(!targetGone&&(target.position.y>GROUND+30||target.position.x>W+100||target.position.x< -100))destroy(target);
 if(phase==='flying'){if(Math.floor(flightTime*20)>trail.length&&trail.length<200)trail.push({...bird.position});if(!targetGone&&(flightTime>9||(flightTime>2&&(bird.position.x>W+100||bird.position.x< -100)))){if(used<3)newBird();else finish(false);}}
 if(targetGone&&!['won','lost'].includes(phase)){victoryDelay-=dt;if(victoryDelay<=0)finish(true);}}
 for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=350*dt;p.rotation+=dt*3;}particles=particles.filter(p=>p.life>0);for(const p of popups){p.life-=dt;p.y-=dt*25;}popups=popups.filter(p=>p.life>0);syncUI();}
function syncUI(){if(phase==='won')$('resultText').textContent=`Target cleared. ${score.toLocaleString()} points from ${used} ${used===1?'bird':'birds'}.`;$('score').textContent=String(score).padStart(5,'0');$('shots').textContent=`${3-used} ${3-used===1?'BIRD':'BIRDS'} LEFT`;$('used').textContent=`${used} / 3`;$('targets').textContent=targetGone?'0 / 1':'1 / 1';$('message').textContent=paused?'PAUSED':phase==='ready'?'PULL BACK & RELEASE':phase==='aiming'?'RELEASE TO LAUNCH':phase==='won'?'TARGET CLEARED':phase==='lost'?'OUT OF BIRDS':targetGone?'WATCH IT TUMBLE':flightTime>1?(used<3?'WATCH THE IMPACT · NEXT BIRD AVAILABLE':'FINAL BIRD IN FLIGHT'):'IN FLIGHT';$('next').disabled=paused||phase!=='flying'||flightTime<1||targetGone||used>=3;$('launch').disabled=paused||phase!=='ready';$('demo').disabled=paused||phase!=='ready';}
function path(points,fill,stroke,width=2){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
const backdrop=document.createElement('canvas');backdrop.width=W;backdrop.height=H;

function drawWood(b){const {w,h,kind,hp,maxHp}=b.art;ctx.save();ctx.translate(b.position.x,b.position.y);ctx.rotate(b.angle);if(kind==='glass'){ctx.fillStyle='#58caffb8';ctx.strokeStyle='#319ac8';ctx.lineWidth=2;ctx.fillRect(-w/2,-h/2,w,h);ctx.strokeRect(-w/2,-h/2,w,h);ctx.strokeStyle='#f4ffffc9';ctx.beginPath();ctx.moveTo(-w/2+3,h/2-5);ctx.lineTo(w/2-3,-h/2+5);ctx.stroke();}else{const g=ctx.createLinearGradient(-w/2,-h/2,w/2,h/2);g.addColorStop(0,'#f8b332');g.addColorStop(.4,'#df8b12');g.addColorStop(1,'#a95d09');ctx.fillStyle=g;ctx.fillRect(-w/2,-h/2,w,h);ctx.strokeStyle='#713900';ctx.lineWidth=2;ctx.strokeRect(-w/2,-h/2,w,h);ctx.strokeStyle='#f4ce86';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-w/2+3,h/2-3);ctx.lineTo(-w/2+3,-h/2+3);ctx.lineTo(w/2-3,-h/2+3);ctx.stroke();ctx.strokeStyle='#9f6c3577';ctx.lineWidth=1;for(let i=0;i<3;i++){ctx.beginPath();if(w>h){ctx.moveTo(-w/2+8,-h/2+4+i*3);ctx.bezierCurveTo(-w/4,3,w/8,-3,w/2-8,-h/2+4+i*3);}else{ctx.moveTo(-w/2+4+i*3,-h/2+8);ctx.bezierCurveTo(2,-h/4,-3,h/8,-w/2+4+i*3,h/2-8);}ctx.stroke();}}if(hp<maxHp*.65){ctx.strokeStyle=kind==='glass'?'#fff':'#79512f';ctx.beginPath();ctx.moveTo(-w*.3,-h*.25);ctx.lineTo(0,0);ctx.lineTo(-w*.2,h*.18);ctx.lineTo(w*.3,h*.3);ctx.stroke();}ctx.restore();}


function sling(back){ctx.lineCap='round';if(back){ctx.strokeStyle='#654a30';ctx.lineWidth=18;ctx.beginPath();ctx.moveTo(185,639);ctx.lineTo(186,582);ctx.quadraticCurveTo(166,565,169,520);ctx.stroke();ctx.strokeStyle='#bd965e';ctx.lineWidth=10;ctx.stroke();}else{ctx.strokeStyle='#654a30';ctx.lineWidth=17;ctx.beginPath();ctx.moveTo(186,583);ctx.quadraticCurveTo(207,564,207,523);ctx.stroke();ctx.strokeStyle='#c69c62';ctx.lineWidth=10;ctx.stroke();}const end=phase==='ready'||phase==='aiming'?pull:ANCHOR;ctx.strokeStyle='#654135';ctx.lineWidth=back?6:5;ctx.beginPath();ctx.moveTo(back?169:207,530);ctx.lineTo(end.x,end.y+3);ctx.stroke();}

function draw(){ctx.clearRect(0,0,W,H);ctx.save();if(detailView){ctx.translate(-920,-390);ctx.scale(1.7,1.7);}ctx.drawImage(backdrop,0,0);ellipse(940,640,145,8,'#3f583222');ctx.strokeStyle='#84653f';ctx.lineWidth=7;for(const x of [815,885,955,1065]){ctx.beginPath();ctx.moveTo(x,638);ctx.lineTo(x,598);ctx.stroke();}ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(816,633);ctx.lineTo(883,600);ctx.moveTo(886,633);ctx.lineTo(953,600);ctx.moveTo(957,633);ctx.lineTo(1063,600);ctx.moveTo(816,600);ctx.lineTo(883,633);ctx.moveTo(886,600);ctx.lineTo(953,633);ctx.moveTo(957,600);ctx.lineTo(1063,633);ctx.stroke();for(const x of [815,1065])drawWood({position:{x,y:575},angle:0,art:{w:14,h:25,kind:'wood',hp:1,maxHp:1}});drawWood({position:{x:940,y:591},angle:0,art:{w:270,h:14,kind:'wood',hp:1,maxHp:1}});
 for(let i=0;i<Math.max(0,3-used-(['ready','aiming'].includes(phase)?1:0));i++)drawBird(84-i*48,621,0,.8);sling(true);if(!detailView)trajectory();for(let i=0;i<trail.length;i+=3){const p=trail[i];ellipse(p.x,p.y,2,2,'#fff9');}for(const b of blocks)drawWood(b);drawTarget();for(const b of birds){if(b.position.y<H+50&&b.position.x<W+50)drawBird(b.position.x,b.position.y,b.angle);}sling(false);
 for(const p of particles){ctx.save();ctx.globalAlpha=Math.min(1,p.life/.35);ctx.translate(p.x,p.y);ctx.rotate(p.rotation);ctx.fillStyle=p.color;ctx.fillRect(-p.size,-p.size/2,p.size*2,p.size);ctx.restore();}drawPopups();ctx.restore();drawFlightIndicator();}
function localPoint(e){const r=canvas.getBoundingClientRect();const x=(e.clientX-r.left)*W/r.width,y=(e.clientY-r.top)*H/r.height;return detailView?{x:(x+920)/1.7,y:(y+390)/1.7}:{x,y};}
canvas.addEventListener('pointerdown',e=>{if(detailView)return;if(phase!=='ready'||paused||pointerId!==null)return;const p=localPoint(e);if(Math.hypot(p.x-bird.position.x,p.y-bird.position.y)>65)return;e.preventDefault();pointerId=e.pointerId;canvas.setPointerCapture(e.pointerId);dragging=true;phase='aiming';canvas.focus();setPull(p.x,p.y);});
canvas.addEventListener('pointermove',e=>{if(!dragging||e.pointerId!==pointerId||paused)return;const p=localPoint(e);setPull(p.x,p.y);});canvas.addEventListener('pointerup',e=>{if(dragging&&e.pointerId===pointerId)launch();});
function cancelDrag(){if(dragging){dragging=false;pointerId=null;setPull(ANCHOR.x,ANCHOR.y);phase='ready';}}
canvas.addEventListener('pointercancel',cancelDrag);canvas.addEventListener('lostpointercapture',cancelDrag);
function pause(){cancelDrag();paused=!paused;$('pause').textContent=paused?'Resume':'Pause';syncUI();}
$('pause').onclick=pause;$('restart').onclick=reset;$('again').onclick=reset;$('next').onclick=nextBird;$('launch').onclick=settingsShot;$('demo').onclick=()=>{if(phase==='ready'&&!paused){setPull(ANCHOR.x-86,ANCHOR.y+41);launch();}};
for(const id of ['angle','power'])$(id).addEventListener('input',()=>{$(id+'Value').textContent=$(id).value+(id==='angle'?'°':'%');});window.addEventListener('keydown',e=>{if(e.target.matches('input,video'))return;if(e.code==='Space'&&e.target.matches('button,summary,a'))return;if(e.code==='Space'){e.preventDefault();if(!e.repeat)pause();}if(e.key.toLowerCase()==='r')reset();if(e.key.toLowerCase()==='n')nextBird();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&!paused)pause();});
$('view').onclick=()=>{cancelDrag();detailView=!detailView;$('view').textContent=detailView?'Show full level':'Inspect tower';draw();};
makeBackdrop();reset();let last=0,acc=0;function frame(t){acc+=Math.min((t-last)/1000,.08);last=t;while(acc>=1/120){step(1/120);acc-=1/120;}draw();requestAnimationFrame(frame);}requestAnimationFrame(frame);
window.reconstruction={snapshot:()=>({phase,paused,score,used,targetGone,blocks:blocks.length,impacts,bird:{x:bird.position.x,y:bird.position.y,vx:Body.getVelocity(bird).x,vy:Body.getVelocity(bird).y},target:{x:target.position.x,y:target.position.y},flightTime}),settings:{width:W,height:H,anchor:ANCHOR,maxPull:MAX_PULL}};

// Canvas art reconstructed from reference frames; no original game assets/code.
function makeBackdrop(){
 const c=backdrop.getContext('2d'), sky=c.createLinearGradient(0,0,0,640);
 sky.addColorStop(0,'#c9e8ff');sky.addColorStop(.6,'#e9f5ff');sky.addColorStop(1,'#fffaff');c.fillStyle=sky;c.fillRect(0,0,W,H);
 c.fillStyle='#ffffff88';c.beginPath();c.moveTo(0,85);c.bezierCurveTo(160,35,200,110,350,70);c.bezierCurveTo(530,25,580,100,710,70);c.bezierCurveTo(910,0,1020,80,1280,40);c.lineTo(1280,66);c.bezierCurveTo(990,120,950,50,710,98);c.bezierCurveTo(510,130,470,60,350,101);c.bezierCurveTo(150,153,120,65,0,115);c.fill();
 c.fillStyle='#dedffc';c.beginPath();c.moveTo(0,560);for(let x=0;x<=W;x+=20)c.lineTo(x,558+Math.sin(x/140)*19+Math.sin(x/60)*8);c.lineTo(W,640);c.lineTo(0,640);c.fill();
 for(const [x,y,s] of [[78,640,.5],[330,640,.85],[640,640,.46],[825,640,.75],[1210,640,1.35]]){
  c.save();c.translate(x,y);c.scale(s,s);c.fillStyle='#bec2f5';c.strokeStyle='#bec2f5';c.lineWidth=15;c.fillRect(-23,-220,46,220);
  for(const [dx,dy] of [[-67,-228],[63,-186]]){c.beginPath();c.moveTo(0,dy+40);c.quadraticCurveTo(dx,dy+75,dx,dy);c.stroke();c.save();c.translate(dx,dy);if(dx>0)c.scale(-.8,.8);c.beginPath();c.moveTo(0,15);c.bezierCurveTo(-34,13,-55,-12,-62,-36);c.lineTo(-36,-32);c.bezierCurveTo(-59,-62,-51,-86,-49,-91);c.lineTo(-25,-72);c.bezierCurveTo(-43,-122,-29,-157,-26,-163);c.bezierCurveTo(10,-145,38,-99,23,-69);c.lineTo(37,-84);c.bezierCurveTo(43,-33,29,0,0,15);c.fill();c.restore();}c.restore();
 }
 c.fillStyle='#234500';c.fillRect(0,640,W,80);
 for(let i=0;i<210;i++){const x=i*6.3+Math.sin(i*17.7)*4, h=9+(Math.sin(i*13.1)+1)*23, lean=Math.sin(i*9.3)*20;c.fillStyle=['#345f00','#528700','#8bc600'][i%3];c.beginPath();c.moveTo(x-4,642);c.quadraticCurveTo(x+lean*.3,642-h*.6,x+lean,642-h);c.quadraticCurveTo(x+lean*.6+5,642-h*.6,x+4,642);c.fill();}
 const grass=c.createLinearGradient(0,637,0,651);grass.addColorStop(0,'#b9ef08');grass.addColorStop(.3,'#83c900');grass.addColorStop(1,'#356400');c.fillStyle=grass;c.fillRect(0,638,W,14);
 for(let i=0;i<90;i++){c.fillStyle=i%2?'#355a07':'#172f08';c.fillRect(i*17,659+i*13%59,9+i%9,4);}
}
function drawBird(x,y,angle=0,scale=1){
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(scale,scale);
 path([[-15,3],[-29,-2],[-24,5],[-30,8],[-16,11]],'#171611','#171611');
 path([[-6,-16],[-10,-28],[-1,-24],[3,-28],[10,-15]],'#e62317','#241a12',1.8);
 ellipse(0,0,20,18,'#ee2819');ctx.strokeStyle='#221912';ctx.lineWidth=2.1;ctx.beginPath();ctx.ellipse(0,0,20,18,0,0,Math.PI*2);ctx.stroke();
 ellipse(1,11,13,6,'#f1d8b6');ellipse(6,-3,6,6,'#fff');ellipse(15,-3,5,6,'#fff');ellipse(8,-2,1.6,2.5,'#15130f');ellipse(16,-2,1.5,2.5,'#15130f');
 path([[9,4],[28,5],[13,12]],'#ffb900','#342211',1.5);path([[-1,-13],[12,-8],[12,-4],[-1,-9]],'#211610');path([[12,-8],[22,-13],[23,-8],[13,-4]],'#211610');ctx.restore();
}
function drawTarget(){if(targetGone)return;ctx.save();ctx.translate(target.position.x,target.position.y);ctx.rotate(target.angle);
 for(const x of [-8,8]){ellipse(x,-17,5,7,'#68c30b');ellipse(x,-18,2,3,'#346208');}
 ellipse(0,0,20,18,'#72cf0c');ctx.strokeStyle='#223914';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,20,18,0,0,Math.PI*2);ctx.stroke();ellipse(0,7,15,9,'#8ad91d');
 ellipse(-12,-3,4.5,5,'#fff');ellipse(12,-3,4.5,5,'#fff');ellipse(-11,-2,1.3,2,'#212411');ellipse(11,-2,1.3,2,'#212411');ellipse(0,4,9,7,'#b3e42c');ellipse(-3,4,2,2.8,'#4a870b');ellipse(4,4,1.6,2.4,'#4a870b');ctx.restore();
}
function prediction(){
 const a=Number($('angle').value)*Math.PI/180,r=MAX_PULL*Number($('power').value)/100;
 const start=phase==='aiming'?pull:{x:ANCHOR.x-Math.cos(a)*r,y:ANCHOR.y+Math.sin(a)*r};
 const key=JSON.stringify([start,blocks.map(b=>[b.position.x,b.position.y,b.angle]),targetGone]);if(previewCache?.key===key)return previewCache.points;
 const sim=Engine.create({positionIterations:10,velocityIterations:10});sim.gravity.y=engine.gravity.y;sim.timing.timeScale=engine.timing.timeScale;
 for(const b of Composite.allBodies(engine.world)){if(b.label==='bird')continue;let copy=b.circleRadius?Bodies.circle(b.position.x,b.position.y,b.circleRadius,{isStatic:true}):Bodies.fromVertices(b.position.x,b.position.y,[b.vertices.map(v=>({x:v.x,y:v.y}))],{isStatic:true});Composite.add(sim.world,copy);}
 const probe=Bodies.circle(start.x,start.y,18,{frictionAir:0});Composite.add(sim.world,probe);Body.setVelocity(probe,{x:(ANCHOR.x-start.x)*LAUNCH_SCALE,y:(ANCHOR.y-start.y)*LAUNCH_SCALE});let hit=false;Events.on(sim,'collisionStart',()=>hit=true);const points=[];
 for(let i=1;i<=420;i++){Engine.update(sim,1000/120);if(hit||probe.position.x<0||probe.position.x>W||probe.position.y>GROUND)break;if(i%8===0)points.push({x:probe.position.x,y:probe.position.y,step:i});}
 Engine.clear(sim);previewCache={key,points};return points;
}
function trajectory(){if(!['ready','aiming'].includes(phase))return;for(const p of prediction())ellipse(p.x,p.y,2.2,2.2,'#ffffffdd');}
function popupLayout(){
 const placed=[];ctx.font='bold 22px sans-serif';
 for(const p of [...popups].sort((a,b)=>b.life-a.life)){
  const w=ctx.measureText(p.text).width+12;let x=Math.max(w/2,Math.min(W-w/2,p.x)),y=Math.min(GROUND-20,p.y);
  while(placed.some(q=>Math.abs(x-q.x)<(w+q.w)/2&&Math.abs(y-q.y)<28))y-=29;
  placed.push({...p,x,y,w});
 }return placed;
}
function drawPopups(){for(const p of popupLayout()){ctx.save();ctx.globalAlpha=Math.min(1,p.life*2);ctx.font='bold 22px sans-serif';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#fff';ctx.strokeText(p.text,p.x,p.y);ctx.fillStyle=p.text==='+5,000'?'#348400':'#824900';ctx.fillText(p.text,p.x,p.y);ctx.restore();}}

function drawFlightIndicator(){
 if(detailView||phase!=='flying'||bird.position.y>=0)return;
 const x=Math.max(70,Math.min(W-70,bird.position.x));
 ctx.save();ctx.fillStyle='#fff';ctx.strokeStyle='#7b240e';ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(x,12);ctx.lineTo(x-9,28);ctx.lineTo(x+9,28);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.fillStyle='#7b240e';ctx.fillText('BIRD ABOVE',x,44);ctx.restore();
}
