import {MultiPlayer as NearPlayer,isHit,directions} from '../near/player.js';
import {MultiPlayer as FarPlayer} from '../far/player.js';
export const labels={stationary:'Stationary',left:'Left',right:'Right',forward:'Forward',back:'Back',forehand:'Forehand',backhand:'Backhand',serve:'Serve'};
const median=a=>{a.sort((x,y)=>x-y);return a[Math.floor(a.length/2)]};
const codes={forehand:'KeyJ',backhand:'KeyK',serve:'KeyS'};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function project(matrix,u,v){const w=matrix[2][0]*u+matrix[2][1]*v+matrix[2][2];return [(matrix[0][0]*u+matrix[0][1]*v+matrix[0][2])/w,(matrix[1][0]*u+matrix[1][1]*v+matrix[1][2])/w];}
// Fixed direction on the court plane; authored vertical height is independent of that direction.
// This is a closed-form animation, not a force/collision simulator or a homing trajectory.
export function ballGroundWorld(f,t){t=clamp(t,0,1);return {u:f.origin.u+(f.target.u-f.origin.u)*t,v:f.origin.v+(f.target.v-f.origin.v)*t};}
export function ballHeight(f,t){t=clamp(t,0,1);if(t<=f.bounceAt){const q=t/f.bounceAt;return f.startHeight*(1-q)+4*f.lift*q*(1-q);}const q=(t-f.bounceAt)/(1-f.bounceAt);return f.endHeight*q*(2-q);}
export function ballGroundPoint(f,t){const g=ballGroundWorld(f,t);return project(f.courtMatrix,g.u,g.v);}
export function directBall(f,t){const g=ballGroundWorld(f,t),p=project(f.courtMatrix,g.u,g.v);return [p[0],p[1]-ballHeight(f,t)*(.36+.50*g.v)];}
export function makeBallPath(matrix,origin,target,landingV,startHeight,endHeight=65){const bounceAt=(landingV-origin.v)/(target.v-origin.v);if(!(bounceAt>.05&&bounceAt<.95))throw Error('Landing must lie between the hit and receiving positions');const landing={u:origin.u+(target.u-origin.u)*bounceAt,v:landingV};const netQ=(.5-origin.v)/(landingV-origin.v),lift=netQ>0&&netQ<1?Math.max(48,(94-startHeight*(1-netQ))/(4*netQ*(1-netQ))):48;const path={courtMatrix:matrix,origin:{...origin},target:{...target},landing,bounceAt,startHeight,endHeight,lift};path.start=directBall(path,0);path.end=directBall(path,1);path.landingPoint=project(matrix,landing.u,landing.v);path.endWorld={...target,height:endHeight};return path;}
function clonePlayer(p){const q=Object.assign(Object.create(Object.getPrototypeOf(p)),p);for(const k of ['held','uses','lastChoice'])q[k]=new Map(p[k]);for(const k of ['visited','usedEdges'])q[k]=new Set(p[k]);q.history=[];q.active=p.active?{...p.active}:null;q.plan=p.plan?{...p.plan}:null;return q;}
// Read-only lookahead: prefetch the already determined legal route, without consuming real RNG.
export function previewSamples(player,ticks=100){const q=clonePlayer(player),samples=[],seen=new Set();q.paused=false;for(let n=0;n<ticks;n++){q.tick();if(q.paused)break;const s=q.sample(),key=s.type+':'+s.record.id;if(!seen.has(key)){seen.add(key);samples.push(s);if(samples.length>=6)break;}}return samples;}
export class Match{
 constructor(near,far,data){this.data=data;this.players={near:new NearPlayer(near),far:new FarPlayer(far)};this.fps=near.config.fps;this.anchors=Object.fromEntries(Object.entries(this.players).map(([r,p])=>[r,new Map([...p.seqs.values()].map(s=>[s.id,median(s.keys.filter(k=>k[15]?.[2]>.25&&k[16]?.[2]>.25).map(k=>Math.max(k[15][1],k[16][1])))||265]))]));this.reset();}
 reset(){for(const p of Object.values(this.players))p.reset();this.position={near:{u:.5,v:1.035},far:{u:.5,v:-.025}};this.paused=true;this.status='ready';this.time=0;this.flight=null;this.ballSpeed=this.ballSpeed||1;this.lastLanding=null;this.trail=[];this.intent=null;this.serving=false;this.events=[];this.count=0;this.seed=211;this.templateUses=new Map();this.contacts=new Set();this.agentNote='Waiting for your serve';this.message='Press S to serve; arrows move, J / K prepare forehand / backhand.';this.lastTemplate=null;this.lastBall=null;this.input=new Set();this.generation=(this.generation||0)+1;}
 random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
 event(type,note,extra={}){this.events.push({type,note,time:this.time,...extra});if(this.events.length>80)this.events.shift();}
 resume(){this.paused=false;for(const p of Object.values(this.players))p.resume();}
 pause(){this.paused=true;this.input.clear();for(const p of Object.values(this.players)){if(!(this.flight?.committed&&this.players[this.flight.receiver]===p))for(const k of [...p.held.keys()])if(directions[k])p.up(k);}this.event('pause','paused');}
 toggle(){this.paused?this.resume():this.pause();}
 serve(){if(this.status==='over'){const seed=this.seed,uses=this.templateUses,history=Object.fromEntries(Object.entries(this.players).map(([r,p])=>[r,{seed:p.seed,uses:p.uses,lastChoice:p.lastChoice}]));this.reset();this.seed=seed;this.templateUses=uses;for(const [r,h] of Object.entries(history))Object.assign(this.players[r],h);}if(this.flight||this.serving)return;this.resume();this.serving=true;this.message='Starting the serve…';}
 down(code,repeat=false){if(repeat)return;if(code==='Space'){this.toggle();return;}if(code==='KeyR'){this.reset();return;}if(code==='KeyS'){this.serve();return;}if(directions[code]){this.input.add(code);this.resume();if(!this.nearLocked())this.players.near.down(code);return;}if(code==='KeyJ'||code==='KeyK'){if(this.flight?.receiver!=='near'){this.message='Wait for the return before preparing J / K.';return;}if(this.flight.committed)return;this.intent=code==='KeyJ'?'forehand':'backhand';this.resume();this.message=`${labels[this.intent]} prepared; move near the receiving circle.`;}}
 nearLocked(){return this.flight?.receiver==='near'&&this.flight.committed;}
 syncNear(){if(this.nearLocked())return;const p=this.players.near;for(const k of [...p.held.keys()])if(directions[k]&&!this.input.has(k))p.up(k);for(const k of this.input)if(!p.held.has(k))p.down(k);}
 up(code){this.input.delete(code);if(!this.nearLocked()&&directions[code]&&this.players.near.held.has(code))this.players.near.up(code);}
 scale(role,pos=this.position[role]){return .36+.50*pos.v;}
 ground(role,pos=this.position[role]){return project(this.data.court_matrix,pos.u,pos.v);}
 contactFrame(role,clip){return this.data.contacts[role][clip.id]?.frame??Math.round(clip.frames*.45);}
 anchor(role,sample=this.players[role].sample()){if(sample.type==='sequence')return this.anchors[role].get(sample.record.id);const t=sample.index/Math.max(1,sample.record.frames-1);return (1-t)*this.anchors[role].get(sample.record.from_id)+t*this.anchors[role].get(sample.record.to_id);}
 contactPoint(role,sample=this.players[role].sample(),pos=this.position[role]){const ground=this.ground(role,pos),scale=this.scale(role,pos),keys=sample.record.keys?.[sample.index];const wrist=keys?.[10]?.[2]>.25?keys[10]:[155,180];return [ground[0]+(wrist[0]-128)*scale,ground[1]+(wrist[1]-this.anchor(role,sample))*scale];}
 forecast(role,action){const p=this.players[role];if(p.busyHit)return null;const q=clonePlayer(p);q.down(codes[action]);q.up(codes[action]);q.resume();for(let n=1;n<=240;n++){q.tick();if(q.paused)return null;if(!q.active&&q.state===action&&q.frame>=this.contactFrame(role,q.clip))return {ticks:n,sequence:q.clip.id,sample:q.sample()};}return null;}
 chooseTemplate(role,clip){let options=this.data.templates.filter(t=>t.actor===role&&t.action===clip.action);const exact=options.filter(t=>t.sequence_id===clip.id),tier=exact.length?'exact':'action';if(exact.length)options=exact;if(!options.length)return null;const least=Math.min(...options.map(t=>this.templateUses.get(t.id)||0));options=options.filter(t=>(this.templateUses.get(t.id)||0)===least);const t=options[Math.floor(this.random()*options.length)];this.templateUses.set(t.id,(this.templateUses.get(t.id)||0)+1);return {template:t,tier};}
 launch(role,startOverride=null,originOverride=null){const p=this.players[role],choice=this.chooseTemplate(role,p.clip);if(!choice){this.finish('No direction reference for the current action');return;}const {template:t,tier}=choice,receiver=role==='near'?'far':'near';
 // Observations supply lateral direction only. The landing is a deliberate demo target,
 // not a claim that an airborne reference point was a measured bounce.
 const u=clamp(.5+(t.target_u-.5)*.72,.18,.82),v=receiver==='near'?1.035:-.025,target={u,v};
 const serve=p.state==='serve',landingV=receiver==='near'?(serve?.66:.86):(serve?.34:.14);
 const start=startOverride||this.contactPoint(role),m=this.data.court_matrix,v0=this.position[role].v;
 // Resolve the ball's ground origin from its actual screen x at the hitter's depth.
 // Consecutive shots reuse the preceding ball endpoint, including its height, exactly.
 const u0=(start[0]*(m[2][1]*v0+m[2][2])-(m[0][1]*v0+m[0][2]))/(m[0][0]-start[0]*m[2][0]);
 const origin=originOverride?{u:originOverride.u,v:originOverride.v}:{u:u0,v:v0};
 const h0=originOverride?.height??Math.max(0,(project(m,origin.u,origin.v)[1]-start[1])/(.36+.50*origin.v));
 const path=makeBallPath(m,origin,target,landingV,h0),landing=path.landing;
 const duration=(serve?1.0:1.1)/(0.9*this.ballSpeed);
 this.flight={id:`${this.generation}-${this.count}`,template:t,tier,hitter:role,receiver,...path,duration,progress:0,rate:1/duration,committed:false,age:0};
 this.lastLanding={...landing,receiver,duration};this.lastTemplate={...choice,actor:role,sequence:p.clip.id};this.status='rally';this.count++;this.intent=null;this.serving=false;this.trail=[];this.lastBall=start;
 this.message=receiver==='near'?'Ball coming! Move to the receiving circle and press J / K.':'Agent receiving';
 this.event('hit',`${role==='near'?'You':'Agent'} · ${p.clip.id} ${labels[p.state]} → ${u<.4?'left':u>.6?'right':'centre'}`,{actor:role,sequence:p.clip.id,action:p.state,template:t.id,tier,source_id:t.source_id,source_time:t.source_interval[0],landing:{...landing},duration});}
 finish(reason){this.status='over';this.message=reason+' · press S for a new rally';this.event('miss',reason);this.flight=null;this.intent=null;this.serving=false;this.agentNote='Rally over';this.input.clear();for(const p of Object.values(this.players))for(const k of [...p.held.keys()])p.up(k);}
 reachable(role){const f=this.flight,pos=this.position[role];return f&&Math.abs(pos.u-f.target.u)<(role==='far'?.045:.09)&&Math.abs(pos.v-f.target.v)<.14;}
 commit(role,action){const f=this.flight;if(!f||f.receiver!==role||f.committed||!this.reachable(role))return false;
 const remaining=Math.ceil((1-f.progress)*f.duration*this.fps);if(remaining<2)return false;
 if(f.nextPrediction&&this.time<f.nextPrediction)return false;f.nextPrediction=this.time+1/this.fps;
 const prediction=this.forecast(role,action);if(!prediction||prediction.ticks>remaining*6)return false;
 // Wait if native animation is shorter. Otherwise accelerate legal animation, never the ball deadline.
 if(prediction.ticks<remaining-2)return false;
 const p=this.players[role];p.down(codes[action]);p.up(codes[action]);f.committed=true;f.committedAction=action;f.predictedSequence=prediction.sequence;f.predictedTicks=prediction.ticks;f.motionTicksRemaining=prediction.ticks;f.contactReady=false;
 this.event('prepare',`${role==='near'?'You':'Agent'} prepares ${labels[action]}`,{actor:role,sequence:prediction.sequence,ticks:prediction.ticks,ballDeadline:f.duration});return true;}
 agent(){const p=this.players.far,f=this.flight;if(!f||this.status!=='rally'){this.agentDirection(null);return;}if(f.receiver!=='far'){this.agentNote='Waiting for the return';this.agentDirection(null);return;}const delta=f.target.u-this.position.far.u;const moving=p.movement()?.[0];
 const code=Math.abs(delta)>(moving ? .02 : .035)?(delta<0?'ArrowLeft':'ArrowRight'):null;if(!f.committed)this.agentDirection(code);
 const action=['forehand','backhand'].includes(f.template.receiver_action)?f.template.receiver_action:(delta<0?'backhand':'forehand');this.agentNote=f.committed?`Preparing ${labels[f.committedAction]}`:code?(delta<0?'Moving left to receive':'Moving right to receive'):`Waiting to time ${labels[action]}`;
 if(this.reachable('far')&&!p.busyHit){if(this.commit('far',action))this.agentNote=`Preparing ${labels[action]}`;}}
 agentDirection(code){if(this.flight?.receiver==='far'&&this.flight.committed)return;const p=this.players.far;for(const key of [...p.held.keys()])if(directions[key]&&key!==code)p.up(key);if(code&&!p.held.has(code))p.down(code);}
 move(role){const p=this.players[role],pos=this.position[role],f=this.flight;if(f?.receiver===role&&f.committed)return;if(isHit(p.state))return;const action=p.active?p.active.edge.to_state:p.state;if(!Object.values(directions).includes(action))return;
 // Ground displacement follows the requested movement; legal exit poses still finish once.
 if(p.desired()!==action)return;let speed=clamp((p.clip.attributes?.medianSpeed||160)/350,.72,.95);if(role==='far')speed=1.25;const d=speed/this.fps;
 if(action==='left'||action==='right'){let u=pos.u+(action==='left'?-d:d);if(role==='far'&&f?.receiver===role){if(action==='left')u=Math.max(f.target.u,u);else u=Math.min(f.target.u,u);}pos.u=clamp(u,-.12,1.12);}else pos.v=clamp(pos.v+(action==='forward'?-d:d)*.6,role==='near'?.62:-.1,role==='near'?1.16:.37);}
 advance(role){const p=this.players[role],f=this.flight;let n=1;
 if(f?.receiver===role&&f.committed){const left=Math.max(1,Math.ceil((1-f.progress)*f.duration*this.fps-1e-8));n=Math.min(6,Math.ceil(f.motionTicksRemaining/left));}
 else if(f?.receiver===role&&Object.values(directions).includes(p.desired())){
  // Play legal entry/exit frames faster to respond to a fast incoming ball.
  const action=p.active?p.active.edge.to_state:p.state;n=action===p.desired()?2:6;
 }
 for(let i=0;i<n;i++){p.tick();if(f?.receiver===role&&f.committed){f.motionTicksRemaining--;if(f.motionTicksRemaining<=0){f.contactReady=!p.active&&isHit(p.state)&&p.frame>=this.contactFrame(role,p.clip);break;}}if(p.paused)break;}
 this.move(role);
 }
 tick(){if(this.paused)return;this.time+=1/this.fps;this.syncNear();const near=this.players.near;if(this.serving&&!this.flight&&!near.busyHit&&near.state==='stationary'&&!near.active&&!near.movement()){near.down('KeyS');near.up('KeyS');}
 this.agent();if(this.intent)this.commit('near',this.intent);
 for(const role of ['near','far']){this.advance(role);if(this.players[role].paused){this.finish(`${role==='near'?'Near':'Far'} action has no legal exit route; please restart`);this.pause();return;}}
 const f=this.flight;if(f){f.age+=1/this.fps;f.progress=f.age/f.duration;this.lastBall=directBall(f,f.progress);this.trail.push(this.lastBall);if(this.trail.length>4)this.trail.shift();
  if(f.progress>=1-1e-8){const p=this.players[f.receiver];if(f.committed&&f.contactReady&&this.reachable(f.receiver)&&p.clip.id===f.predictedSequence){this.contacts.add(`${f.receiver}/${p.clip.id}/${p.uses.get(p.clip.id)}`);this.launch(f.receiver,f.end,f.endWorld);}else this.finish(f.receiver==='near'?'You missed this ball':'The agent missed this ball');return;}}
 if(this.serving&&!this.flight&&!near.active&&near.state==='serve'&&near.frame>=this.contactFrame('near',near.clip)){const token=`near/${near.clip.id}/${near.uses.get(near.clip.id)}`;if(!this.contacts.has(token)){this.contacts.add(token);this.launch('near');}}
 }
 ballPoint(){return this.flight?directBall(this.flight,this.flight.progress):this.lastBall;}
 snapshot(){return {status:this.status,paused:this.paused,time:this.time,count:this.count,message:this.message,agent:this.agentNote,position:structuredClone(this.position),flight:this.flight?{receiver:this.flight.receiver,progress:this.flight.progress,committed:this.flight.committed,target:this.flight.target,landing:this.flight.landing,landingPoint:this.flight.landingPoint,origin:this.flight.origin,bounceAt:this.flight.bounceAt,duration:this.flight.duration,rate:this.flight.rate,contactReady:this.flight.contactReady,template:this.flight.template.id,predictedTicks:this.flight.predictedTicks}:null,players:Object.fromEntries(Object.entries(this.players).map(([r,p])=>[r,{state:p.state,sequence:p.clip.id,frame:p.frame,phase:p.phase,cycles:p.cycles,paused:p.paused,held:[...p.held.keys()]}])),events:this.events.slice(-12)};}
}
