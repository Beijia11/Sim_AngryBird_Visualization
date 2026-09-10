'use strict';
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d'),D=window.VIDEO_DATA;
const dirs={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
const polygons=[];
function rect(x,y,w,h){polygons.push([[x,y],[x+w,y],[x+w,y+h],[x,y+h]]);}
for(const y of [80,332]){for(const x of [112,220,544,652])rect(x,y,68,68);rect(328,y,176,68);}
for(const x of [112,652])for(const y of [188,260])rect(x,y,68,32);
for(const x of [220,580])rect(x,188,32,104);
polygons.push([[292,188],[396,188],[396,220],[328,220],[328,260],[504,260],[504,220],[436,220],[436,188],[540,188],[540,292],[292,292]]);
function inside(x,y,p){let hit=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!=(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
const open=(x,y)=>x>=0&&x<19&&y>=0&&y<11&&!polygons.some(p=>inside(92+x*36,60+y*36,p));
const key=(x,y)=>`${x},${y}`;
let player,enemy,pellets,score,power,elapsed,mode='ready',resumeMode='play',enemyWait=0;
function actor(x,y,dir){return {x,y,dir,target:null};}
function reset(){player=actor(3,8,'left');player.want=null;enemy=actor(2,0,'right');pellets=new Map(D.pellets.map(([x,y,big])=>[key(x,y),{x,y,big}]));score=0;power=0;elapsed=0;enemyWait=0;}
function overlay(title,subtitle,button){document.querySelector('#overlay').hidden=false;document.querySelector('#title').textContent=title;document.querySelector('#subtitle').textContent=subtitle;document.querySelector('#start').textContent=button;}
function begin(){reset();mode='play';document.querySelector('#overlay').hidden=true;canvas.focus();}
function pause(){if(mode==='play'||mode==='replay'){resumeMode=mode;mode='paused';overlay('Paused','Continue when you are ready.','Resume');}else if(mode==='paused'){mode=resumeMode;document.querySelector('#overlay').hidden=true;}}
function valid(a,d){const [dx,dy]=dirs[d];return open(Math.round(a.x)+dx,Math.round(a.y)+dy);}
function distances(x,y){const q=[[x,y]],dist=new Map([[key(x,y),0]]);for(let i=0;i<q.length;i++){const [a,b]=q[i];for(const [dx,dy] of Object.values(dirs)){const nx=a+dx,ny=b+dy,k=key(nx,ny);if(open(nx,ny)&&!dist.has(k)){dist.set(k,dist.get(key(a,b))+1);q.push([nx,ny]);}}}return dist;}
function chooseEnemy(){const dist=distances(Math.round(player.x),Math.round(player.y));const candidates=Object.keys(dirs).filter(d=>valid(enemy,d));candidates.sort((a,b)=>{function cost(d){const [dx,dy]=dirs[d];return dist.get(key(enemy.x+dx,enemy.y+dy))??999;}return (power>0?-1:1)*(cost(a)-cost(b))+(a===enemy.dir?-.05:b===enemy.dir?.05:0);});return candidates[0];}
function move(a,budget,choose,onArrival){while(budget>1e-8){if(!a.target){const d=choose();if(!d||!valid(a,d))break;a.dir=d;const [dx,dy]=dirs[d];a.target={x:Math.round(a.x)+dx,y:Math.round(a.y)+dy};}const t=a.target,dist=Math.hypot(t.x-a.x,t.y-a.y),step=Math.min(dist,budget);if(dist>0){a.x+=(t.x-a.x)/dist*step;a.y+=(t.y-a.y)/dist*step;}budget-=step;if(step>=dist-1e-8){a.x=t.x;a.y=t.y;a.target=null;if(onArrival)onArrival();}else break;}}
function consume(){for(const [k,p] of pellets){if(Math.hypot(player.x-p.x,player.y-p.y)<.16){pellets.delete(k);score+=p.big?50:10;if(p.big)power=2.4;}}if(!pellets.size){mode='won';overlay('All dots collected','You cleared the maze.','Play again');}}
function update(dt){if(mode!=='play'&&mode!=='replay')return;elapsed+=dt;
 if(mode==='replay'){const f=Math.min(60,Math.floor(elapsed*10)),r=D.trace[f];player.x=(r.player[0]-92)/36;player.y=(r.player[1]-60)/36;if(r.motion!=='stationary')player.dir=r.motion;enemy.x=(r.other[0]-92)/36;enemy.y=(r.other[1]-60)/36;power=r.other_gray<180?.1:0;consume();if(elapsed>=6.1){mode='replayDone';overlay('Observed path replay complete','Now try your own route.','Start game');}return;}
 power=Math.max(0,power-dt);move(player,120/36*dt,()=>player.want&&valid(player,player.want)?player.want:player.dir,consume);consume();if(mode!=='play')return;
 if(enemyWait>0)enemyWait-=dt;else move(enemy,90/36*dt,chooseEnemy);
 if(enemyWait<=0&&Math.hypot(player.x-enemy.x,player.y-enemy.y)<.65){if(power>0){score+=200;enemy=actor(9,5,'up');enemyWait=1;}else{mode='lost';overlay('The chaser caught you','Turn at junctions or find a power dot in a corner.','Try again');}}}
function circle(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
function draw(){ctx.fillStyle='#000';ctx.fillRect(0,0,832,480);ctx.lineWidth=4;ctx.strokeStyle='#fafbf7';ctx.strokeRect(74,41,686,400);for(const p of polygons){ctx.beginPath();p.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.stroke();}for(const p of pellets.values())circle(92+p.x*36,60+p.y*36,p.big?(elapsed%0.6<.3?9:7):3.3,'#fafbf7');
 const x=92+player.x*36,y=60+player.y*36,angle={right:0,down:Math.PI/2,left:Math.PI,up:-Math.PI/2}[player.dir],mouth=.08+.46*(.5+.5*Math.sin(elapsed*22));ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(x,y);ctx.arc(x,y,16,angle+mouth,angle+Math.PI*2-mouth);ctx.closePath();ctx.fill();
 const gx=92+enemy.x*36,gy=60+enemy.y*36;ctx.fillStyle=power>0?'#777':'#ebebeb';ctx.beginPath();ctx.arc(gx,gy,15,Math.PI,0);ctx.lineTo(gx+15,gy+13);ctx.lineTo(gx+8,gy+6);ctx.lineTo(gx,gy+15);ctx.lineTo(gx-8,gy+7);ctx.lineTo(gx-15,gy+15);ctx.closePath();ctx.fill();for(const offset of [-6,6]){circle(gx+offset,gy-5,4,'#fff');circle(gx+offset+1,gy-5,2.3,'#111');}
 document.querySelector('#score').textContent=String(score).padStart(4,'0');document.querySelector('#remaining').textContent=pellets.size;document.querySelector('#state').textContent=mode==='replay'?'Replaying':mode==='paused'?'Paused':mode==='ready'?'Ready':mode==='lost'?'Game over':mode==='won'?'Cleared':mode==='replayDone'?'Replay complete':power>0?`Power ${power.toFixed(1)}s`:'Exploring';}
function input(d){if(mode==='ready')begin();if(mode==='play'){player.want=d;if(player.target){const [dx,dy]=dirs[d],[ox,oy]=dirs[player.dir];if(dx===-ox&&dy===-oy){player.target={x:player.target.x-ox,y:player.target.y-oy};player.dir=d;}}}}
document.querySelector('#start').onclick=()=>mode==='paused'?pause():begin();document.querySelector('#pause').onclick=pause;document.querySelector('#restart').onclick=begin;document.querySelector('#replay').onclick=()=>{reset();mode='replay';document.querySelector('#overlay').hidden=true;};document.querySelectorAll('[data-dir]').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();input(b.dataset.dir);}));
window.addEventListener('keydown',e=>{const d={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'}[e.key]||{W:'up',S:'down',A:'left',D:'right'}[e.key];if(d){e.preventDefault();input(d);}if(e.code==='Space'){e.preventDefault();if(!e.repeat)pause();}if(e.key.toLowerCase()==='r')begin();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&(mode==='play'||mode==='replay'))pause();});let touchStart;canvas.addEventListener('pointerdown',e=>{touchStart=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointerup',e=>{if(!touchStart)return;const dx=e.clientX-touchStart[0],dy=e.clientY-touchStart[1];if(Math.hypot(dx,dy)>15)input(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up');touchStart=null;});
reset();let last=0,acc=0;function frame(t){acc+=Math.min((t-last)/1000,.1);last=t;while(acc>=1/120){update(1/120);acc-=1/120;}draw();requestAnimationFrame(frame);}requestAnimationFrame(frame);
// Read-only inspection surface for verifying geometry and state in a real browser.
window.maze={snapshot:()=>JSON.parse(JSON.stringify({player,enemy,score,power,mode,remaining:pellets.size})),open};
