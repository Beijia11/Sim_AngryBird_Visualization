/* New world for nad_fed_usopen.mp4. Implements the original simple World contract.
 * Not copied from the other-video human_tennis world. See provenance.json.
 * The whole non-near-player core below is shared, unchanged, by A and B.
 */
(function(){
 'use strict';
 const D=window.CURRENT_VIDEO_DATA, poses=D.poses, clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const shots=new Set(['forehand','backhand','serve']);
 function event(s,type,extra={}){s.events.push({type,t:s.t,...extra});}
 function launch(s,from,to,duration,toward){
  s.ball={live:true,from:from.slice(),to:to.slice(),x:from[0],y:from[1],age:0,T:duration,toward,arc:toward==='near'?150:190};
 }
 function feed(s){
  s.far.swingT=0;s.far.goal=s.far.x;
  const offsets=[0,-180,150,-90,220,-160];
  const x=clamp(s.near.x+offsets[s.round%offsets.length],380,1580);
  launch(s,[s.far.x,s.far.y-62],[x,s.near.y-115],D.design.nearFlightSeconds,'near');
  s.round++;s.wait=0;s.near.hitWindow=0;event(s,'feed',{target:x});
 }
 function point(s,winner,reason){if(!s.ball.live)return;s.ball.live=false;s.wait=2.8;s.score[winner]++;event(s,'point',{winner,reason});}
 function move(s,dir,dt){
  const vectors={left:[-1,0],right:[1,0],forward:[0,-1],back:[0,1]}; const v=vectors[dir];if(!v)return;
  s.near.x=clamp(s.near.x+v[0]*D.design.nearSpeed[0]*dt,200,1740);
  s.near.y=clamp(s.near.y+v[1]*D.design.nearSpeed[1]*dt,600,1040);
 }
 function tryHit(s,kind){
  const b=s.ball,n=s.near;if(!b.live||b.toward!=='near')return false;
  const distance=Math.hypot(b.x-n.x,b.y-(n.y-115));
  if(distance>D.design.hitReach)return false;
  const goals=[850,1120,730,1230,980];const target=[goals[s.returns%goals.length],s.far.y-45];
  launch(s,[b.x,b.y],target,D.design.farFlightSeconds,'far');s.far.goal=target[0];s.returns++;
  n.hitWindow=0;n.hitSuccess=true;event(s,'hit',{by:'near',kind,distance:Math.round(distance)});return true;
 }
 function swing(s,kind){
  event(s,'swing_event',{kind});
  if(kind==='serve'){
   if(s.ball.live){event(s,'game_reject',{reason:'Point in play: serve motion only, ball not reset',kind});return;}
   launch(s,[s.near.x,s.near.y-180],[960,s.far.y-45],D.design.farFlightSeconds,'far');s.far.goal=960;s.wait=0;event(s,'hit',{by:'near',kind:'serve'});return;
  }
  s.near.hitKind=kind;s.near.hitWindow=.30;s.near.hitSuccess=false;
  if(tryHit(s,kind))return;
 }
 function advance(s,dt){
  const f=s.far,b=s.ball,n=s.near;
  f.x+=clamp((b.live&&b.toward==='far'?f.goal:960)-f.x,-230*dt,230*dt);
  f.x=clamp(f.x,600,1320);if(f.swingT>=0)f.swingT+=dt;
  if(b.live){
   b.age+=dt;const u=clamp(b.age/b.T,0,1.15);
   b.x=b.from[0]+(b.to[0]-b.from[0])*u;b.y=b.from[1]+(b.to[1]-b.from[1])*u-4*b.arc*u*(1-u);
   if(n.hitWindow>0)tryHit(s,n.hitKind);
   if(s.ball===b&&b.toward==='far'&&b.age>=b.T){
    if(Math.abs(b.to[0]-f.x)<155){
     f.swingT=0;const offsets=[-170,140,-60,190,0];const target=[clamp(n.x+offsets[s.returns%5],380,1580),n.y-115];
     launch(s,[f.x,f.y-45],target,D.design.nearFlightSeconds,'near');event(s,'hit',{by:'far'});
    }else point(s,'near','Far player did not reach the simplified return range');
   }else if(s.ball===b&&b.toward==='near'&&b.age>b.T+.32)point(s,'far','Reached the receiving area but missed');
  }else if(s.wait>0){s.wait-=dt;if(s.wait<=0)feed(s);}
  if(n.hitWindow>0){n.hitWindow-=dt;if(n.hitWindow<=0&&!n.hitSuccess)event(s,'miss',{reason:'Ball outside the simplified hit range during the swing window',kind:n.hitKind});}
 }
 function place(p,x,y){return Object.fromEntries(Object.entries(p).map(([k,v])=>[k,[v[0]+x,v[1]+y]]));}
 function sample(c,t){return SimKit.pose.sample(c,t);}
 function environment(){return [
  {cls:'ground',rect:[0,0,1920,1080]},{cls:'wall',rect:[0,0,1920,140]},
  {cls:'structure',polygon:[[0,100],[330,100],[170,415],[0,550]]},
  {cls:'structure',polygon:[[1570,100],[1920,100],[1920,560],[1730,410]]},
  {cls:'court',polygon:[[620,238],[1290,238],[1622,854],[300,854]]},
  {cls:'line',polygon:[[620,235],[1290,235],[1293,241],[617,241]]},
  {cls:'line',polygon:[[298,851],[1622,851],[1625,857],[295,857]]},
  {cls:'line',polygon:[[620,238],[626,238],[305,854],[298,854]]},
  {cls:'line',polygon:[[1284,238],[1290,238],[1625,854],[1618,854]]},
  {cls:'line',polygon:[[706,238],[711,238],[474,854],[466,854]]},
  {cls:'line',polygon:[[1205,238],[1210,238],[1455,854],[1447,854]]},
  {cls:'line',polygon:[[665,316],[1242,316],[1244,321],[662,321]]},
  {cls:'line',polygon:[[554,618],[1340,618],[1343,624],[551,624]]},
  {cls:'line',rect:[956,316,5,307]},
  {cls:'obstacle',polygon:[[557,365],[1367,365],[1367,441],[557,441]]},
  {cls:'structure',rect:[350,195,55,112]}
 ];}
 window.World={
  meta:{name:'This video · Simple local adaptation baseline',source:[1920,1080],fps:30000/1001,dt:1/60},
  actions:[
   {id:'left',kind:'hold',keys:['ArrowLeft'],description:'move left'},{id:'right',kind:'hold',keys:['ArrowRight'],description:'move right'},
   {id:'up',kind:'hold',keys:['ArrowUp'],description:'move forward'},{id:'down',kind:'hold',keys:['ArrowDown'],description:'move back'},
   {id:'forehand',kind:'tap',keys:['j'],description:'forehand'},{id:'backhand',kind:'tap',keys:['k'],description:'backhand'},
   {id:'serve',kind:'tap',keys:['s'],description:'serve from stationary (no live ball)'},{id:'feed',kind:'tap',keys:['n'],description:'next ball'}
  ],
  init(){const s={t:0,events:[],near:{x:D.nearInitial[0],y:D.nearInitial[1],swingT:-1,shot:'forehand',hitWindow:0},far:{x:D.farInitial[0],y:D.farInitial[1],goal:960,swingT:-1},ball:{live:false},round:0,returns:0,score:{near:0,far:0},wait:0};feed(s);return s;},
  step(s,acts,dt){
   // SimKit owns s.t. Do not advance it a second time here.
   let dir='stationary';
   for(const a of acts){
    if(['left','right','up','down'].includes(a.id))dir=({up:'forward',down:'back'})[a.id]||a.id;
    if(shots.has(a.id)){s.near.shot=a.id;s.near.swingT=0;event(s,'request',{kind:a.id,accepted:true});swing(s,a.id);}
    if(a.id==='feed')feed(s);
   }
   s.near.direction=dir;move(s,dir,dt);if(s.near.swingT>=0)s.near.swingT+=dt;advance(s,dt);
  },
  proxy(s){
   let near=poses.nearIdle;const clip=poses[{forehand:'nearForehand',backhand:'nearBackhand',serve:'nearServe'}[s.near.shot]];
   if(s.near.swingT>=0&&s.near.swingT<clip.at(-1)[0])near=sample(clip,s.near.swingT);
   const far=s.far.swingT>=0&&s.far.swingT<poses.farSwing.at(-1)[0]?sample(poses.farSwing,s.far.swingT):poses.farIdle;
   return {regions:environment(),figures:[{cls:'human',joints:place(far,s.far.x,s.far.y),thickness:4},{cls:'human',joints:place(near,s.near.x,s.near.y),thickness:8}],boxes:s.ball.live?[{cls:'projectile',center:[s.ball.x,s.ball.y],size:[9,9]}]:[],media:[]};
  },
  replay:{duration:18.8,actions:D.inputReplay},
  core:{event,feed,move,swing,advance,place,environment},
  describe(s){const clip=poses[{forehand:'nearForehand',backhand:'nearBackhand',serve:'nearServe'}[s.near.shot]];const hitting=s.near.swingT>=0&&s.near.swingT<clip.at(-1)[0];return {state:hitting?s.near.shot:(s.near.direction||'stationary'),mode:'A',clip:hitting?'near'+s.near.shot:'nearIdle',frame:Math.max(0,Math.floor(s.near.swingT*30)),transition:null,note:'Native Simple style: movement shifts the idle pose, strokes sample the clip directly',source:hitting?D.poseSources[{forehand:'nearForehand',backhand:'nearBackhand',serve:'nearServe'}[s.near.shot]]:D.poseSources.nearIdle};}
 };
 window.BASELINE_WORLD=window.World;
})();
