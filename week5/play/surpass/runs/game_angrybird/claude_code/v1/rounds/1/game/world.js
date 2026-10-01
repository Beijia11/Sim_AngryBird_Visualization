(function(){
const X0=-900, SLING=[-603,348], GROUND=466, G=620;
const TOWER=[{x:0,y:0,s:1}], AIM={x:-881,y:93,s:0.847};
const BL=[[495,57,518,99],[462,99,548,117],[454,117,474,282],[532,117,552,282],[482,262,528,281],[415,280,588,300],
 [415,300,440,466],[562,300,588,466],[460,342,543,358],[462,358,478,443],[525,358,543,443],[460,443,543,466],[324,424,345,468],[652,424,674,468]];
// camera keyframes measured from camera.json: [time since phase start, x, y, scale]
const PAN=[[0,0,0,1],[0.02,-26,1,.9995],[0.09,-105,6,.997],[0.15,-234,14,.989],[0.22,-335,23,.978],[0.29,-409,30,.967],[0.36,-531,43,.9445],[0.43,-626,55,.9225],[0.5,-721,67,.898],[0.56,-814,81,.8716],[0.63,-882,93,.8473]];
const FOLLOW=[[0,-881,93,.848],[.14,-815,75,.898],[.27,-720,52,.955],[.41,-596,22,1.029],[.55,-515,7,1.064],[.68,-380,-7,1.082],[.82,-283,-6,1.064],[.96,-192,-3,1.038],[1.09,-133,-2,1.026],[1.23,-93,-1,1.018],[1.37,-64,0,1.007],[1.64,-34,9,.995],[1.91,-19,10,.984],[2.19,-20,11,.979],[2.46,-27,13,.977],[2.73,-37,20,.9696],[2.87,-38,21,.9687]];
function keyCam(K,t){if(t<=K[0][0])return {x:K[0][1],y:K[0][2],s:K[0][3]};for(let i=1;i<K.length;i++)if(t<K[i][0]){const a=K[i-1],b=K[i],k=(t-a[0])/(b[0]-a[0]);return {x:a[1]+(b[1]-a[1])*k,y:a[2]+(b[2]-a[2])*k,s:a[3]+(b[3]-a[3])*k};}const L=K[K.length-1];return {x:L[1],y:L[2],s:L[3]};}
function camLerp(a,b,k){k=Math.max(0,Math.min(1,k));k=k*k*(3-2*k);return {x:a.x+(b.x-a.x)*k,y:a.y+(b.y-a.y)*k,s:a.s+(b.s-a.s)*k};}
window.World={
 meta:{name:"slingshot tower",source:[960,536],fps:29.287,dt:1/60},
 actions:[{id:"pull",kind:"drag",description:"drag back from the slingshot and release to fire"},
          {id:"fire",kind:"tap",keys:[" "],description:"fire with the default pull"}],
 assets:{plate:"assets/plate.png",tower:"assets/tower.png",bird:"assets/bird.png",pig:"assets/pig.png"},
 init(rng){return {t:0,phase:"intro",pt:0,score:0,shown:0,
   bird:{x:SLING[0],y:SLING[1],vx:0,vy:0,a:0,alive:true},pull:{dx:0,dy:0},
   blocks:BL.map(b=>({sx:b[0],sy:b[1],w:b[2]-b[0],h:b[3]-b[1],x:(b[0]+b[2])/2,y:(b[1]+b[3])/2,vx:0,vy:0,a:0,va:0,dyn:false})),
   pig:{x:505,y:240,alive:true,pop:0},pops:[],cam:{x:0,y:0,s:1},events:[]};},
 step(s,acts,dt,rng){
  s.clk=(s.clk||0)+dt;s.pt+=dt;
  for(const a of acts){const v=a.value||{};
   if((a.id==="pull"||a.id==="fire")&&(s.phase==="aim"||s.phase==="intro")){
     let dx=a.id==="pull"?(v.dx||0)*s.cam.s:-85, dy=a.id==="pull"?(v.dy||0)*s.cam.s:30;
     const L=Math.hypot(dx,dy)||1, m=Math.min(L,95);dx=dx/L*m;dy=dy/L*m;
     s.pull={dx:dx,dy:dy};s.phase="pulling";s.pt=0;}}
  const b=s.bird;
  if(s.phase==="intro"&&s.clk>0.87){s.phase="pan";s.pt=0;}
  if(s.phase==="pan"&&s.pt>0.63){s.phase="aim";s.pt=0;}
  if(s.phase==="pulling"){const k=Math.min(1,s.pt/0.5);b.x=SLING[0]+s.pull.dx*k;b.y=SLING[1]+s.pull.dy*k;
    if(s.pt>0.7){const p=11.5;b.vx=-s.pull.dx*p;b.vy=-s.pull.dy*p;s.phase="flight";s.pt=0;s.events.push({t:s.t,type:"launch"});}}
  if(s.phase==="flight"||s.phase==="after"){
   if(b.alive){b.vy+=G*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.a+=b.vx*dt/22;
    if(b.y>GROUND-18){b.y=GROUND-18;b.vy*=-0.3;b.vx*=0.6;}
    for(const k of s.blocks){if(Math.abs(b.x-k.x)<k.w/2+16&&Math.abs(b.y-k.y)<k.h/2+16){
      if(Math.hypot(b.vx,b.vy)>150){s.events.push({t:s.t,type:"hit"});
       for(const q of s.blocks){const d=Math.hypot(q.x-b.x,q.y-b.y);if(d<260&&q.sy<450){q.dyn=true;q.vx+=b.vx*0.35*Math.max(0,1-d/260)+(rng()-0.5)*80;q.vy+=b.vy*0.2-(rng()*120);q.va+=(rng()-0.5)*4;}}
       b.vx*=-0.25;b.vy*=0.3;s.phase="after";s.pt=0;}}}
    const p=s.pig;if(p.alive&&Math.hypot(b.x-p.x,b.y-p.y)<34){p.alive=false;s.score+=5000;s.pops.push({x:p.x,y:p.y-30,t:0,txt:"5000"});s.events.push({t:s.t,type:"pig_pop"});}}
   if(s.phase==="after"&&s.pt>2.5)b.alive=false;
  }
  // blocks: falling, ground contact, unsupported blocks collapse
  for(const q of s.blocks){if(!q.dyn)continue;q.vy+=G*dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.a+=q.va*dt;
   const half=Math.abs(Math.sin(q.a))*q.w/2+Math.abs(Math.cos(q.a))*q.h/2;
   if(q.y+half>GROUND){q.y=GROUND-half;if(q.vy>60){s.score+=10;}q.vy*=-0.2;q.vx*=0.85;q.va*=0.7;
     const n=Math.round(q.a/(Math.PI/2))*Math.PI/2;q.a+=(n-q.a)*0.15;}}
  const p=s.pig;if(p.alive&&s.blocks[4].dyn){p.y+=s.blocks[4].vy*dt;p.x+=s.blocks[4].vx*dt;if(p.y>GROUND-30||Math.abs(s.blocks[4].vy)>200&&s.pt>0.3){p.alive=false;s.score+=5000;s.pops.push({x:p.x,y:p.y-30,t:0,txt:"5000"});}}
  for(const o of s.pops)o.t+=dt;s.pops=s.pops.filter(o=>o.t<1.5);
  s.shown+=Math.min(s.score-s.shown,Math.max(30,(s.score-s.shown)*4*dt));
  // camera
  let c;
  if(s.phase==="intro")c={x:0,y:0,s:1};
  else if(s.phase==="pan")c=keyCam(PAN,s.pt);
  else if(s.phase==="aim"||s.phase==="pulling")c=AIM;
  else {s.ft=(s.ft||0)+dt;c=keyCam(FOLLOW,s.ft);}
  s.cam.x=c.x;s.cam.y=c.y;s.cam.s=c.s;
 },
 render(ctx,s,img){
  const c=s.cam;ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle="#cfe3f5";ctx.fillRect(0,0,960,536);
  ctx.setTransform(1/c.s,0,0,1/c.s,-c.x/c.s,-c.y/c.s);
  ctx.drawImage(img.plate,X0,0);
  const b=s.bird;
  // slingshot bands
  const pulling=s.phase==="pulling";
  if(pulling||s.phase==="aim"||s.phase==="intro"||s.phase==="pan"){ctx.strokeStyle="#3a1d0c";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-582,335);ctx.lineTo(b.x-8,b.y);ctx.stroke();}
  for(const q of s.blocks){ctx.save();ctx.translate(q.x,q.y);ctx.rotate(q.a);ctx.drawImage(img.tower,q.sx,q.sy,q.w,q.h,-q.w/2,-q.h/2,q.w,q.h);ctx.restore();}
  if(s.pig.alive)ctx.drawImage(img.pig,s.pig.x-27,s.pig.y-28);
  if(b.alive){ctx.save();ctx.translate(b.x,b.y);ctx.rotate(s.phase==="flight"?Math.atan2(b.vy,b.vx)*0.3:0);ctx.drawImage(img.bird,-23,-22);ctx.restore();}
  if(pulling||s.phase==="aim"||s.phase==="intro"||s.phase==="pan"){ctx.strokeStyle="#3a1d0c";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(b.x-8,b.y);ctx.lineTo(-622,338);ctx.stroke();}
  for(const o of s.pops){ctx.font="bold 46px sans-serif";ctx.textAlign="center";ctx.lineWidth=5;ctx.strokeStyle="#1d5a10";ctx.fillStyle="#7fd84a";ctx.globalAlpha=Math.max(0,1-o.t/1.5);ctx.strokeText(o.txt,o.x,o.y-o.t*20);ctx.fillText(o.txt,o.x,o.y-o.t*20);ctx.globalAlpha=1;}
  ctx.setTransform(1,0,0,1,0,0);
  ctx.font="bold 30px sans-serif";ctx.textAlign="right";ctx.lineWidth=4;ctx.strokeStyle="#334";ctx.fillStyle="#fff";
  const tx="SCORE: "+Math.round(s.shown);ctx.strokeText(tx,950,36);ctx.fillText(tx,950,36);
 },
 replay:{duration:10.89,actions:[{t:6.23,id:"pull",value:{dx:-80,dy:50,x:130,y:300}}]}
};})();
