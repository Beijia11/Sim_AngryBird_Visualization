(function(){
'use strict';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),mix=(a,b,u)=>a+(b-a)*u,smooth=u=>{u=clamp(u,0,1);return u*u*(3-2*u)};
const BBOX=[[277,188,115,14],[278,200,14,112],[376,200,14,112],[306,296,58,13],[306,227,58,14],[306,240,16,56],[347,240,15,56],[303,77,15,112],[355,77,14,112],[306,65,59,13],[331,37,15,30],[321,175,30,13]];
const sling={x:-400,y:230};
function interp(keys,t){if(t<=keys[0][0])return keys[0].slice(1);for(let i=1;i<keys.length;i++){if(t<keys[i][0]){let u=(t-keys[i-1][0])/(keys[i][0]-keys[i-1][0]);return keys[i].slice(1).map((x,j)=>mix(keys[i-1][j+1],x,u))}}return keys[keys.length-1].slice(1)}
const CAMINTRO=[[0,1,0,0],[.854,1,0,0],[1.024,.989,-156,9.6],[1.195,.959,-306,23.5],[1.366,.898,-480,44.8],[1.537,.8475,-587.7,62.6]];
const CAMFLIGHT=[[0,.8475,-587.7,62.6],[.2,.9285,-507.5,42],[.54,1.075,-316.6,.55],[.88,1.0425,-141,-2.5],[1.22,1.017,-57,-1],[1.55,1,-14,0],[1.85,1,0,0]];
function burst(s,x,y,n,rng,red){for(let i=0;i<n;i++)s.particles.push({x,y,vx:(rng()-.45)*210,vy:-rng()*200-20,life:1+rng()*1.5,a:rng()*6,w:2+rng()*7,h:2+rng()*3,red});}
function hit(s,rng){s.hit=s.age;s.events.push({type:'impact',x:s.bird.x,y:s.bird.y});s.score=5700;s.pig=false;s.bird.vx=35;s.bird.vy=-40;burst(s,310,145,45,rng,true);burst(s,312,145,20,rng,false);s.floaters.push({x:335,y:160,text:'5000',life:1.2,color:'#60d927'});for(let i of [7,8,9,10,11]){let b=s.beams[i];b.free=true;b.vx=i===8?115:(rng()-.25)*150;b.vy=i===8?-45:-80-rng()*120;b.va=i===8?1.8:(rng()-.5)*5;}}
function shoot(s,dx,dy){if(s.mode==='flight'&&s.age-s.shot<3)return;dx=clamp(dx,-125,-10);dy=clamp(dy,-100,100);s.pull={dx,dy};s.bird.x=sling.x+dx*.8475;s.bird.y=sling.y+dy*.8475;s.bird.vx=-dx*6.9;s.bird.vy=-dy*7.1;s.mode='flight';s.shot=s.age;s.trail=[];s.events.push({type:'launch'});}
const assets={landscape:'assets/landscape.png',launchPlate:'assets/launchPlate.png',targetPlate:'assets/targetPlate.png',bird:'assets/bird.png',waiting:'assets/waiting.png',pig:'assets/pig.png',scoreZero:'assets/scoreZero.png'};BBOX.forEach((_,i)=>assets['beam'+i]='assets/beam'+i+'.png');
for(let n of [5700,6320,6560,6700,7070,7370,7610,9020,9040])assets['score'+n]='assets/score'+n+'.png';
window.World={meta:{name:'Woodland slingshot',source:[960,536],fps:29.287,dt:1/60},assets,
actions:[{id:'draw',kind:'hold',keys:['ArrowLeft','a'],description:'pull back'},{id:'aimUp',kind:'hold',keys:['ArrowUp','w'],description:'raise shot'},{id:'aimDown',kind:'hold',keys:['ArrowDown','s'],description:'lower shot'},{id:'fire',kind:'tap',keys:[' '],description:'release bird'},{id:'pull',kind:'drag',description:'drag back and release'}],
init(){return {t:0,age:0,mode:'ready',pull:{dx:0,dy:0},bird:{x:sling.x,y:sling.y,vx:0,vy:0,a:0},beams:BBOX.map((b,i)=>({i,x:b[0]+b[2]/2,y:b[1]+b[3]/2,w:b[2],h:b[3],a:0,vx:0,vy:0,va:0})),pig:true,hit:null,shot:null,score:0,particles:[],floaters:[],trail:[],events:[]}},
step(s,acts,dt,rng){s.age+=dt;for(const a of acts){if(a.id==='pull'){let v=a.value||{};shoot(s,v.dx||-80,v.dy===undefined?35:v.dy)}if(a.id==='draw'&&s.mode!=='flight'){s.mode='aim';s.pull.dx=Math.max(-80,s.pull.dx-450*dt);s.pull.dy=mix(s.pull.dy,37,Math.min(1,dt*12))}if(a.id==='aimUp'&&s.mode!=='flight')s.pull.dy=clamp(s.pull.dy+40*dt,-70,95);if(a.id==='aimDown'&&s.mode!=='flight')s.pull.dy=clamp(s.pull.dy-40*dt,-70,95);if(a.id==='fire')shoot(s,s.pull.dx||-80,s.pull.dy||37)}
if(s.mode!=='flight'){s.bird.x=sling.x+s.pull.dx*.8475;s.bird.y=sling.y+s.pull.dy*.8475;}else{let b=s.bird;b.vy+=240*dt;b.x+=(b.vx+(s.age-s.shot<.085?300:0))*dt;b.y+=b.vy*dt;b.a=clamp(Math.atan2(b.vy,b.vx)*.35,-.4,.9);if(s.hit===null&&b.x>291&&b.x<395&&b.y>65&&b.y<309)hit(s,rng);if(b.y>331){b.y=331;b.vy=-Math.abs(b.vy)*.28;b.vx*=.95;b.a+=b.vx*dt*.015;}if(s.hit===null&&s.age-s.shot>5){s.mode='ready';s.pull={dx:0,dy:0}}if(s.hit===null&&Math.floor((s.age-s.shot)*14)>s.trail.length)s.trail.push([b.x,b.y]);}
if(s.hit!==null){let u=s.age-s.hit,th=1.13*smooth((u-.23)/1.8);s.score=u<.2?5700:u<.5?6320:u<.85?6560:u<1.15?6700:u<1.5?7070:u<1.8?7370:u<2.1?7610:u<2.4?9020:9040;
for(let i of [1,2,5,6]){let b=s.beams[i],orig=BBOX[i],bottom=orig[1]+orig[3],px=orig[0]+orig[2]/2;b.a=th;b.x=px+Math.sin(th)*orig[3]/2;b.y=bottom-Math.cos(th)*orig[3]/2;}
for(let i of [0,4]){let b=s.beams[i],orig=BBOX[i];let pivotY=i===0?312:296,L=pivotY-(orig[1]+orig[3]/2);b.x=orig[0]+orig[2]/2+Math.sin(th)*L;b.y=pivotY-Math.cos(th)*L;b.a=-th*.23;}
for(let b of s.beams)if(b.free){b.vy+=220*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.a+=b.va*dt;let ext=Math.abs(Math.sin(b.a))*b.w/2+Math.abs(Math.cos(b.a))*b.h/2;if(b.y+ext>343){b.y=343-ext;b.vy=-Math.abs(b.vy)*.25;b.vx*=.95;b.va*=.88;} }
if(u>.45 && s.bird.y>=s.beams[0].y-22){s.bird.y=s.beams[0].y-22;s.bird.x=mix(s.bird.x,s.beams[0].x-24,Math.min(1,dt*9));s.bird.vy=0;s.bird.vx=12;s.bird.a=-.15;}if(u>2&&s.particles.length<12&&u<2.2)burst(s,430,250,18,rng,true);
}
for(let p of s.particles){p.vy+=230*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.a+=3*dt;p.life-=dt;if(p.y>344){p.y=344;p.vy*=-.2;p.vx*=.8;}}s.particles=s.particles.filter(p=>p.life>0);for(let f of s.floaters){f.y-=25*dt;f.life-=dt}s.floaters=s.floaters.filter(f=>f.life>0);
},
render(c,s,img){c.save();c.scale(1.5,536/357);let cam=s.shot===null?interp(CAMINTRO,s.age):interp(CAMFLIGHT,s.age-s.shot+.035*smooth((s.age-s.shot)/.2));let [z,tx,ty]=cam;c.fillStyle='#e8f2fa';c.fillRect(0,0,640,357);c.save();c.scale(1/z,1/z);c.translate(-tx,-ty);c.drawImage(img.landscape,-650,0);
// Endpoint plates retain the original fine foliage and clouds at measured camera poses.
if(s.shot===null&&s.age>1.54)c.drawImage(img.launchPlate,-587.7,62.6,640*.8475,357*.8475);
if(tx>-1&&z===1)c.drawImage(img.targetPlate,0,0);
for(let b of s.beams){if(s.hit!==null&&b.i===7)continue;c.save();c.translate(b.x,b.y);c.rotate(b.a);c.drawImage(img['beam'+b.i],-b.w/2,-b.h/2,b.w,b.h);c.restore();}
if(s.pig)c.drawImage(img.pig,319,139,36,36);
for(let j=0;j<s.trail.length;j++){let p=s.trail[j];c.fillStyle='rgba(255,255,255,.72)';c.beginPath();c.arc(p[0],p[1],2.1,0,7);c.fill();c.fillStyle='rgba(127,158,173,.22)';c.fillRect(p[0]-1,p[1]+2,3,1);}
if(s.mode!=='flight'){c.lineCap='round';for(let anchor of [[-417,228],[-388,232]]){c.strokeStyle='#3b180d';c.lineWidth=4.5;c.beginPath();c.moveTo(anchor[0],anchor[1]);c.lineTo(s.bird.x,s.bird.y+4);c.stroke();} }
if(s.mode==='flight'||s.mode==='aim'||s.mode==='ready'){let b=s.bird;c.save();c.translate(b.x,b.y);c.rotate(b.a);c.drawImage(img.bird,-16,-17,32,28);c.restore();}
for(let p of s.particles){c.save();c.globalAlpha=clamp(p.life*2,0,1);c.translate(p.x,p.y);c.rotate(p.a);c.fillStyle=p.red?'#bd0926':'#c78c39';if(p.red){c.beginPath();c.moveTo(-p.w,0);c.quadraticCurveTo(0,-p.h*2,p.w,0);c.quadraticCurveTo(0,p.h,-p.w,0);c.fill()}else c.fillRect(-p.w/2,-p.h/2,p.w,p.h);c.restore();}
if(s.hit!==null){let u=s.age-s.hit;let q=u<.6?u:(u>2?u-2:-1);if(q>=0&&q<.7){c.save();c.globalAlpha=.75*(1-q/.7);c.fillStyle='white';for(let i=0;i<9;i++){let a=i*2.4;c.beginPath();c.arc(s.bird.x+Math.cos(a)*(12+q*23),s.bird.y+Math.sin(a)*(9+q*20),5+q*9,0,7);c.fill()}c.restore();}}
for(let f of s.floaters){c.font='bold 38px Arial';c.textAlign='center';c.lineWidth=4;c.strokeStyle='#396224';c.strokeText(f.text,f.x,f.y);c.fillStyle=f.color;c.fillText(f.text,f.x,f.y);}
c.restore();if(!s.score)c.drawImage(img.scoreZero,533,0,107,33);else if(img['score'+s.score]){c.drawImage(img['score'+s.score],480,0,160,34)}else{c.font='bold 25px Arial';c.textAlign='right';c.lineWidth=3;c.strokeStyle='#465760';c.strokeText('Score: '+s.score,634,28);c.fillStyle='#fff';c.fillText('Score: '+s.score,634,28);}c.restore();},
replay:{duration:10.892,actions:[{t:4.39,id:'draw',until:4.75},{t:6.97,id:'fire'}]}
};})();
