'use strict';
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d'),$=id=>document.getElementById(id),keys=new Set();
const W=1280,H=720,G=9.8,BASE=11.885,SINGLE=4.115;
let lastBounce=null,aiReaction=0;
let player,opponent,ball,phase,paused,points,games,server,rally,best=0,clock=0,timer=0,buffer=0,swingAnim=0,aiAnim=0,message='',last=0,acc=0,trail=[],reason='',shotSerial=0;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function project(x,y,z=0){
 const m=COURT_CALIBRATION.homography,d=m[2][0]*x+m[2][1]*y+m[2][2];
 const u=(m[0][0]*x+m[0][1]*y+m[0][2])/d,v=(m[1][0]*x+m[1][1]*y+m[1][2])/d;
 const scale=(m[0][0]-u*m[2][0])/d;
 return{x:u,y:v-z*scale*.96,s:scale};
}
function poly(pts,fill,stroke,width=2){ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke()}}
function worldLine(x1,y1,x2,y2,color='#f3f6ee',width=3){let a=project(x1,y1),b=project(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}
function announce(s){message=s;$('message').textContent=s}
function displayScore(p,q){if(p>=3&&q>=3)return p===q?'40':p>q?'AD':'40';return ['0','15','30','40'][Math.min(p,3)]}
function ui(){$('you').textContent=displayScore(points[0],points[1]);$('cpu').textContent=displayScore(points[1],points[0]);$('yg').textContent=games[0];$('cg').textContent=games[1];$('state').textContent=paused?'PAUSED':phase==='match'?'MATCH COMPLETE':phase==='serve'?(server===0?'YOUR SERVE':'CPU SERVE'):phase==='point'?'POINT OVER':'LIVE RALLY';$('rally').textContent=`Rally ${rally} · Best ${best}`}
function ready(){player={x:-1.7,y:10,step:0};opponent={x:1.7,y:-10,step:0};ball={x:server?opponent.x:player.x,y:server?-10:10,z:1.2,vx:0,vy:0,vz:0,last:server,bounces:0};trail=[];rally=0;buffer=0;phase='serve';timer=1.2;announce(server?'Opponent serving…':'Press Space or Serve to start.');ui()}
function reset(){keys.clear();lastBounce=null;points=[0,0];games=[0,0];server=0;paused=false;clock=0;shotSerial=0;swingAnim=aiAnim=0;$('pause').textContent='Pause';ready()}
function strike(who,aim){recordedStroke(who);const destination=who===0?-8.8:9.0;const duration=who===0?1.32:1.58;ball.vx=(aim-ball.x)/duration;ball.vy=(destination-ball.y)/duration;ball.vz=(.5*G*duration*duration-ball.z)/duration;ball.last=who;ball.bounces=0;aiReaction=who===0?.3:0;rally++;best=Math.max(best,rally);shotSerial++;if(who===0)swingAnim=.3;else aiAnim=.3;buffer=0;announce(who===0?'Return sent. Recover for the next ball.':'Incoming! Swing when the ball reaches you.');ui()}
function serve(){phase='rally';ball.x=server?opponent.x:player.x;ball.y=server?opponent.y:player.y;ball.z=2.3;strike(server,server===0?1.4:-1.8)}
function canHit(){return phase==='rally'&&ball.last===1&&ball.y>0&&Math.hypot(ball.x-player.x,(ball.y-player.y)*.85)<1.25&&ball.z>.12&&ball.z<2.4}
function swing(){if(paused)return;if(phase==='match'){reset();return}if(phase==='serve'&&server===0){serve();return}if(phase!=='rally')return;buffer=.22;swingAnim=.22;if(canHit())returnBall();else{recordedWhiff();announce('Get close to the ball — time your swing.');}}
function returnBall(){const aim=keys.has('KeyA')?-3.45:keys.has('KeyD')?3.45:clamp(-opponent.x*.75,-2.4,2.4);strike(0,aim)}
function point(winner,why){if(phase!=='rally')return;points[winner]++;reason=why;phase='point';timer=2;announce(`${winner===0?'Your':'CPU'} point · ${why}`);if(points[winner]>=4&&points[winner]-points[1-winner]>=2){games[winner]++;points=[0,0];server=1-server;announce(`${winner===0?'You win':'CPU wins'} the game!`);if(games[winner]>=2){phase='match';announce(`${winner===0?'You win the match!':'CPU wins the match.'} Press New match to play again.`)}}ui()}
function landing(){let t=(ball.vz+Math.sqrt(ball.vz*ball.vz+2*G*Math.max(0,ball.z)))/G;return{x:ball.x+ball.vx*t,y:ball.y+ball.vy*t}}
function move(p,x,y,speed,dt){let dx=x-p.x,dy=y-p.y,d=Math.hypot(dx,dy);if(d>.03){const scale=Math.min(1,speed*dt/d);p.x+=dx*scale;p.y+=dy*scale;p.step+=dt*12;p.travel=(p.travel||0)+d*scale;p.moveDx=dx;p.moveDy=dy;p.lastMoved=clock}else p.step*=.9;}
function step(dt){if(paused||!playerSpritesReady)return;clock+=dt;buffer=Math.max(0,buffer-dt);swingAnim=Math.max(0,swingAnim-dt);aiAnim=Math.max(0,aiAnim-dt);if(phase==='match')return;
 const dx=(keys.has('ArrowRight')?1:0)-(keys.has('ArrowLeft')?1:0),dy=(keys.has('ArrowDown')?1:0)-(keys.has('ArrowUp')?1:0);
 if(dx||dy)move(player,clamp(player.x+dx,-5.8,5.8),clamp(player.y+dy,2,13),7,dt);
 else if($('assist').checked&&phase==='rally'&&ball.last===1){const target=landing();move(player,clamp(target.x,-5.3,5.3),clamp(target.y+.75,6.5,11),6.3,dt)}
 if(phase==='serve'){ball.x=server?opponent.x:player.x;ball.y=server?opponent.y:player.y;if(server&&(timer-=dt)<=0)serve();return}
 if(phase==='point'){if((timer-=dt)<=0)ready();return}
 const target=landing();aiReaction=Math.max(0,aiReaction-dt);if(ball.last!==0||aiReaction===0)move(opponent,ball.last===0?clamp(target.x,-5,5):0,-9.5,2.1,dt);
 const old={...ball};
 ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;ball.z+=ball.vz*dt-.5*G*dt*dt;ball.vz-=G*dt;
 const cross=old.y*ball.y<=0&&Math.abs(old.vy)>1e-9;
 const netTime=cross?-old.y/old.vy:0;
 const netX=old.x+old.vx*netTime,netZ=old.z+old.vz*netTime-.5*G*netTime*netTime;
 if(cross&&Math.abs(netX)<5.5&&netZ<.94){ball.x=netX;ball.y=0;ball.z=Math.max(0,netZ);point(1-ball.last,'net');return}
 if(ball.z<=0){
  const impact=clamp((old.vz+Math.sqrt(old.vz*old.vz+2*G*Math.max(0,old.z)))/G,0,dt),remaining=dt-impact;
  ball.x=old.x+old.vx*impact;ball.y=old.y+old.vy*impact;ball.z=0;
  lastBounce={x:ball.x,y:ball.y};
  const correctSide=ball.last===0?ball.y<0:ball.y>0;
  if(ball.bounces===0&&(!correctSide||Math.abs(ball.x)>SINGLE||Math.abs(ball.y)>BASE)){point(1-ball.last,'out');return}
  if(++ball.bounces>=2){point(ball.last,'second bounce');return}
  ball.vz=Math.abs(old.vz-G*impact)*.72;ball.vx*=.94;ball.vy*=.94;
  ball.x+=ball.vx*remaining;ball.y+=ball.vy*remaining;ball.z=ball.vz*remaining-.5*G*remaining*remaining;ball.vz-=G*remaining;
 }
 if(buffer>0&&canHit())returnBall();
 if(ball.last===0&&ball.y< -6.5&&Math.hypot(ball.x-opponent.x,(ball.y-opponent.y)*.85)<1.25&&ball.z>.2&&ball.z<2.4){const aim=Math.sin(shotSerial*2.17)*3.5;strike(1,aim)}
 if(Math.abs(ball.y)>17||Math.abs(ball.x)>10)point(ball.bounces?ball.last:1-ball.last,'ball past the baseline');
 trail.push({x:ball.x,y:ball.y,z:ball.z});if(trail.length>12)trail.shift();}
function athlete(p,color,anim,far){drawRecordedPlayer(p,far?1:0);}
function drawNet(){
 // The same photographed net is composited above far-side objects.
 // Partial opacity preserves visibility through the original mesh.
 ctx.save();ctx.globalAlpha=.65;ctx.drawImage(COURT_PHOTO,547,357,824,97,547*2/3,357*2/3,824*2/3,97*2/3);ctx.restore();
}

function draw(){if(!playerSpritesReady){ctx.fillStyle='#10222b';ctx.fillRect(0,0,W,H);ctx.fillStyle='#e1eacc';ctx.font='24px sans-serif';ctx.textAlign='center';ctx.fillText(spriteLoadError?'Player assets could not load. Reload this page.':'Loading recorded player motions…',640,360);return}ctx.drawImage(COURT_PHOTO,0,0,W,H);
 athlete(opponent,'#777e73',aiAnim,true);if(ball.y<0)drawBall();drawNet();
 if(phase==='rally'){const l=landing(),p=project(l.x,l.y);ctx.strokeStyle='#ddeb78aa';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y,12,5,0,0,7);ctx.stroke()}
 const p=project(player.x,player.y);ctx.strokeStyle=canHit()?'#e7fb9a':'#eef4d950';ctx.lineWidth=2;ctx.setLineDash([5,5]);ctx.beginPath();for(let i=0;i<=48;i++){const a=i/48*Math.PI*2,q=project(player.x+1.25*Math.cos(a),player.y+1.25/.85*Math.sin(a));if(i===0)ctx.moveTo(q.x,q.y);else ctx.lineTo(q.x,q.y)};ctx.stroke();ctx.setLineDash([]);athlete(player,'#a347a8',swingAnim,false);
 if(ball.y>=0)drawBall();
 if(paused||phase==='match'||phase==='point'){ctx.fillStyle='#0c1c2788';ctx.fillRect(0,35,W,70);ctx.textAlign='center';ctx.fillStyle='#fff';ctx.font='28px Georgia';ctx.fillText(paused?'Paused':phase==='match'?(games[0]>games[1]?'You win the match':'Match complete'):(reason==='net'?'Into the net':message),640,80)}
 ctx.fillStyle='#ffffffbb';ctx.font='12px system-ui';ctx.textAlign='left';ctx.fillText('YOU / NEAR COURT',30,695);ctx.textAlign='right';drawBroadcastScore();ctx.fillText(canHit()?'SWING NOW':keys.has('KeyA')?'AIM: LEFT':keys.has('KeyD')?'AIM: RIGHT':'AIM: OPEN COURT',1250,695);}
function pause(){paused=!paused;keys.clear();$('pause').textContent=paused?'Resume':'Pause';ui()}
$('swing').onclick=swing;$('reset').onclick=reset;$('pause').onclick=pause;
window.addEventListener('keydown',e=>{if(e.target.matches('input,video')||e.target.matches('button')&&e.code==='Space')return;if(['Space','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.repeat)return;if(e.code==='Space')swing();if(e.code==='KeyP')pause();if(e.code==='KeyR')reset()});window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();if(!paused&&phase==='rally')pause()});
for(const b of document.querySelectorAll('[data-key]')){b.addEventListener('pointerdown',e=>{e.preventDefault();keys.add(b.dataset.key);b.setPointerCapture(e.pointerId)});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>keys.delete(b.dataset.key))}
canvas.addEventListener('pointerdown',e=>{e.preventDefault();canvas.focus();swing()});
reset();function frame(t){acc+=Math.min((t-last)/1000,.08);last=t;while(acc>=1/120){step(1/120);acc-=1/120}draw();requestAnimationFrame(frame)}requestAnimationFrame(frame);
window.tennis={snapshot:()=>JSON.parse(JSON.stringify({phase,paused,points,games,server,rally,best,player,opponent,ball,message})),step,reset,swing,canHit};

function drawBall(){if(['rally','serve','point'].includes(phase)){const shadow=project(ball.x,ball.y);ctx.fillStyle='#18332966';ctx.beginPath();ctx.ellipse(shadow.x,shadow.y,6,3,0,0,7);ctx.fill();for(let i=0;i<trail.length;i++){let a=project(trail[i].x,trail[i].y,trail[i].z);ctx.fillStyle=`rgba(231,247,118,${i/trail.length*.3})`;ctx.beginPath();ctx.arc(a.x,a.y,2,0,7);ctx.fill()}const a=project(ball.x,ball.y,ball.z);ctx.fillStyle='#e5f65f';ctx.strokeStyle='#fcffe3';ctx.lineWidth=1;ctx.beginPath();ctx.arc(a.x,a.y,Math.max(3,a.s*.09),0,7);ctx.fill();ctx.stroke();}}

function drawBroadcastScore(){
 ctx.save();ctx.scale(2/3,2/3);ctx.fillStyle='#092b40';ctx.fillRect(402,890,94,43);ctx.fillRect(402,945,94,38);
 ctx.font='bold 25px Arial';ctx.fillStyle='#e8f1ee';ctx.textAlign='center';ctx.fillText(String(games[0]),427,922);ctx.fillText(displayScore(points[0],points[1]),474,922);ctx.fillText(String(games[1]),427,974);ctx.fillText(displayScore(points[1],points[0]),474,974);ctx.restore();
}
