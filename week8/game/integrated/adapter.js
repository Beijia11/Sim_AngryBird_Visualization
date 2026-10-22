/* v3 playback semantics in serializable fixed-step World state.
 * Frames and all transitions are read verbatim from V3_DATA. No pose synthesis.
 */
(function(){
 'use strict';
 const Base=window.BASELINE_WORLD,D=window.V3_DATA,C=Base.core;
 const L=window.V3_LOCOMOTION;
 if(!L)throw Error('Missing offline stride calibration data');
 const byId=new Map(D.clips.map(c=>[c.id,c])),shots=new Set(['forehand','backhand','serve']);
 const dirOf={left:'left',right:'right',up:'forward',down:'back'};
 const routes=new Map();for(const e of D.transitions){const k=e.fromClip+'|'+e.to;if(!routes.has(k))routes.set(k,[]);routes.get(k).push(e);}
 for(const es of routes.values())es.sort((a,b)=>a.fromFrame-b.fromFrame||a.score-b.score);
 const edgeMap=new Map(D.transitions.map(e=>[e.id,e]));
 const COCO=['nose','left_eye','right_eye','left_ear','right_ear','left_shoulder','right_shoulder','left_elbow','right_elbow','left_wrist','right_wrist','left_hip','right_hip','left_knee','right_knee','left_ankle','right_ankle'];
 const scale=2.0,groundOffset=54.7876; // fixed median idle ankle offset, never per-frame renormalization
 function state(a){return a.edge?edgeMap.get(a.edge).to:byId.get(a.clip).behavior;}
 function keys(a){return a.edge?edgeMap.get(a.edge).keys[a.index]:byId.get(a.clip).keys[a.frame];}
 function log(s,type,extra){C.event(s,type,extra);s.anim.note=extra?.reason||s.anim.note;}
 function hitAt(s,clip,frame){const a=s.anim,m=window.V3_HIT_EVENTS[clip];if(m&&!a.fired&&frame>=m.frame){a.fired=true;C.swing(s,byId.get(clip).behavior);log(s,'action_frame',{clip,frame,sourceTime:m.sourceTime});}}
 function tick(s){
  const a=s.anim;
  if(a.edge){
   const e=edgeMap.get(a.edge);
   if(a.index<e.count-1){a.index++;hitAt(s,e.toClip,e.toFrame+a.index);return;}
   a.clip=e.toClip;a.frame=e.resumeFrame;a.edge=null;a.index=0;a.note='Seam done; continuing the target clip';hitAt(s,a.clip,a.frame);log(s,'transition_end',{edge:e.id,resumeFrame:a.frame});return;
  }
  const clip=byId.get(a.clip),shot=shots.has(clip.behavior);
  if(shot&&a.frame<clip.count-1){a.frame++;hitAt(s,a.clip,a.frame);return;}
  const target=shot?a.move:(a.pending||a.move);
  if(!shot&&target===clip.behavior&&a.frame<clip.count-1){a.frame++;return;}
  const e=(routes.get(clip.id+'|'+target)||[]).find(e=>e.fromFrame>=a.frame);
  if(!e){a.error=`Missing offline connection ${clip.behavior} → ${target}`;throw Error(a.error);}
  if(a.frame<e.fromFrame){a.frame++;a.note=`Waiting for stored exit #${e.fromFrame}`;return;}
  if(e.fromFrame!==a.frame)throw Error('Exit mismatch');
  a.edge=e.id;a.index=0;a.pending=null;a.fired=false;a.note='Playing stored transition';a.lastEdge=e.id;
  log(s,'transition',{edge:e.id,from:e.from,to:e.to,fromFrame:e.fromFrame,toFrame:e.toFrame});hitAt(s,e.toClip,e.toFrame);
 }
 function integrateRoot(s,dt){
  const a=s.anim;let dx=0;
  if(a.edge){
   const profile=L.transitions[a.edge];
   if(profile){const v=profile.velocityBoundariesX,j=a.index;
    // Analytic integration within one stored seam interval. Only root position
    // changes between samples; all skeleton points stay exactly as stored.
    const f0=a.acc*D.fps,f1=(a.acc+dt)*D.fps;
    dx=(v[j]+(v[j+1]-v[j])*(f0+f1)/2)*dt;
   }
  }else{
   const p=L.profiles[a.clip];
   if(p)dx=p.velocityX[a.frame]*dt;
   else if(!shots.has(state(a)))C.move(s,state(a),dt);
  }
  if(dx)s.near.x=Math.max(200,Math.min(1740,s.near.x+dx));
 }
 function advanceAnimation(s,dt){
  const a=s.anim,interval=1/D.fps;let remaining=dt;
  // Split at source-frame boundaries: displacement and pose index cannot drift
  // when the game is stepped at 60/30/120 Hz.
  while(remaining>1e-10){
   const part=Math.min(remaining,Math.max(0,interval-a.acc));
   integrateRoot(s,part);a.acc+=part;remaining-=part;
   if(a.acc>=interval-1e-10){a.acc=Math.max(0,a.acc-interval);tick(s);}
  }
 }
 window.World={...Base,
  meta:{...Base.meta,name:'This video · Simple + v3 near player'},
  init(rng){const s=Base.init(rng);s.anim={clip:D.clips.find(c=>c.behavior==='stationary').id,frame:0,edge:null,index:0,acc:0,pending:null,move:'stationary',held:[],fired:false,note:'v3 offline clips ready · left/right shift calibrated from the source trajectory',lastEdge:null,worldVelocityX:0,boundaryBlocked:null};return s;},
  step(s,acts,dt){
   const a=s.anim;
   const active=acts.filter(x=>dirOf[x.id]).map(x=>x.id);
   // Preserve actual hold onset order; releasing the newest returns to the previous held key.
   a.held=a.held.filter(x=>active.includes(x));for(const id of active)if(!a.held.includes(id))a.held.push(id);
   a.move=a.held.length?dirOf[a.held.at(-1)]:'stationary';
   const blocked=(a.move==='left'&&s.near.x<=200+1e-7)||(a.move==='right'&&s.near.x>=1740-1e-7);
   if(blocked){if(a.boundaryBlocked!==a.move)log(s,'boundary',{reason:'Reached the court boundary; stepping stops',direction:a.move});a.boundaryBlocked=a.move;a.move='stationary';}else a.boundaryBlocked=null;
   for(const action of acts){
    if(action.id==='feed'){C.feed(s);continue;}
    if(!shots.has(action.id))continue;
    const kind=action.id;
    if(shots.has(state(a))||a.pending){log(s,'reject',{kind,reason:'Stroke not finished or already queued; cannot restart or change type'});continue;}
    if(kind==='serve'&&(state(a)!=='stationary'||a.move!=='stationary'||a.edge)){log(s,'reject',{kind,reason:'Serve requires stationary with no movement / transition'});continue;}
    if(kind==='serve'&&s.ball.live){log(s,'reject',{kind,reason:'Ball in play; serve between points'});continue;}
    a.pending=kind;a.note='Accepted; waiting for the offline exit';log(s,'request',{kind,accepted:true});
   }
   const beforeX=s.near.x;advanceAnimation(s,dt);a.worldVelocityX=(s.near.x-beforeX)/dt;
   s.near.direction=state(a);C.advance(s,dt);
  },
  proxy(s){const scene=Base.proxy(s),k=keys(s.anim);const joints={};
   for(let i=0;i<17;i++){if(i>0&&i<5)continue;if(k[i][2]<(i===0?.3:.45))continue;joints[COCO[i]]=[s.near.x+(k[i][0]-D.root[0])*scale,s.near.y+(k[i][1]-D.root[1]-groundOffset)*scale];}
   scene.figures[1]={cls:'human',joints,thickness:8};return scene;
  },
  describe(s){const a=s.anim,c=byId.get(a.clip),e=a.edge?edgeMap.get(a.edge):null;return {mode:'B',state:state(a),clip:c.id,originalClip:c.originalClip,frame:a.frame,transition:e?{id:e.id,from:e.from,to:e.to,index:a.index,count:e.count,fromClip:e.fromClip,fromFrame:e.fromFrame,toClip:e.toClip,toFrame:e.toFrame,resumeFrame:e.resumeFrame,sourceTime:e.sourceTime,targetTime:e.targetTime}:null,note:a.note,pending:a.pending,move:a.move,source:[c.start,c.end],sourceTime:c.start+a.frame/D.fps,keys:keys(a),root:D.root,worldScale:scale,groundOffset,locomotion:{version:L.version,velocityX:a.worldVelocityX,kind:e?(L.transitions[e.id]?.kind||'locked'):(L.profiles[c.id]?'source':'other'),sourceSpanDistanceX:L.profiles[c.id]?.observedSpanDisplacementX??null}};},
  cancelInputs(s){s.anim.held=[];s.anim.move='stationary';s.anim.pending=null;}
 };
 window.V3_PLAYBACK={tick,keys,state,routes,byId,edgeMap,advanceAnimation,integrateRoot};
})();
