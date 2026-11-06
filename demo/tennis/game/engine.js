import {Match as OriginalMatch,labels as originalLabels,previewSamples,project,makeBallPath,ballHeight as originalHeight} from '../../../week10/atlas/generated-play/engine.js';
import {directions,isHit} from '../../../week10/atlas/near/player.js';
import {TennisScore,opponent} from './score.js';
export {previewSamples,project,makeBallPath,TennisScore};
export const labels={...originalLabels,celebrate:'Celebrating',disappointed:'Point lost',victory:'Match won',defeat:'Match lost'};
export const PLAY_RULES=Object.freeze({nearReach:.12,farReach:.085,depthReach:.17,earlyWindow:.18,lateWindow:.14,shotBuffer:.50,prepareLead:.65,queueLead:.80,agentServeDelay:1.10,reactionSeconds:1.25,maxMotionRate:6});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
// The grace interval extends the same straight path: the ball never stops to wait.
export function ballGroundWorld(f,t){t=Math.max(0,t);return {u:f.origin.u+(f.target.u-f.origin.u)*t,v:f.origin.v+(f.target.v-f.origin.v)*t};}
export function ballGroundPoint(f,t){const p=ballGroundWorld(f,t);return project(f.courtMatrix,p.u,p.v);}
export function ballHeight(f,t){return t<=1?originalHeight(f,t):Math.max(0,f.endHeight*(1-(t-1)*f.duration/(f.lateWindow||PLAY_RULES.lateWindow)));}
export function directBall(f,t){const p=ballGroundWorld(f,t),xy=project(f.courtMatrix,p.u,p.v);return [xy[0],xy[1]-ballHeight(f,t)*(.36+.5*p.v)];}
export function serviceBox(server,court){const right=(server==='near')===(court==='deuce');return {serverU:right?.68:.32,landingMinU:right?0:.5,landingMaxU:right?.5:1,minV:server==='near'?.2307:.5,maxV:server==='near'?.5:.7693};}
export function validService(server,court,feet,landing){const b=serviceBox(server,court);return feet.u>0&&feet.u<1&&(court==='deuce'?(server==='near'?feet.u>.5:feet.u<.5):(server==='near'?feet.u<.5:feet.u>.5))&&(server==='near'?feet.v>1:feet.v<0)&&landing.u>=b.landingMinU&&landing.u<=b.landingMaxU&&landing.v>=b.minV&&landing.v<=b.maxV&&(server==='near'?landing.v<.5:landing.v>.5);}
export class Match extends OriginalMatch {
 reset(){super.reset();this.score=new TennisScore();this.rules=PLAY_RULES;this.serveAttempt=1;this.reaction=null;this.pointResolved=false;this.bufferedShot=null;this.lastPoint=null;this.autoServeAt=null;this.lineUp();this.message='S starts the point. Move with arrows; press J / K early or as the ball arrives.';}
 lineUp(){const s=this.score.server,b=serviceBox(s,this.score.court);this.position={near:{u:s==='near'?b.serverU:1-b.serverU,v:1.035},far:{u:s==='far'?b.serverU:1-b.serverU,v:-.025}};this.agentNote=s==='far'?'Agent serves this game':'You serve this game';}
 resetPlayers(){for(const p of Object.values(this.players)){const h={seed:p.seed,uses:p.uses,lastChoice:p.lastChoice};p.reset();Object.assign(p,h);}this.input.clear();}
 serve(){if(this.status==='match_over'||this.status==='error')return;if(this.flight||this.serving)return;if(this.reaction&&this.time-this.reaction.started<PLAY_RULES.reactionSeconds)return;
  this.autoServeAt=null;this.resetPlayers();this.lineUp();this.reaction=null;this.pointResolved=false;this.lastBall=null;this.intent=null;this.bufferedShot=null;this.count=0;this.contacts.clear();this.trail=[];this.serving=true;this.status='serving';this.resume();this.message=`${this.score.server==='near'?'You':'Agent'} serving · ${this.score.court==='deuce'?'right / deuce':'left / ad'} court · ${this.serveAttempt===1?'first':'second'} serve`;
 }
 down(code,repeat=false){if(repeat)return;if(code==='KeyR'){this.reset();return;}if(code==='Space'){this.toggle();return;}if(code==='KeyS'){this.serve();return;}if(this.status==='match_over'||this.status==='point_over'||this.status==='error')return;
  if(code==='KeyJ'||code==='KeyK'){const f=this.flight;if(!f||f.receiver!=='near'){this.message='Wait for the ball to come back to you.';return;}if(f.committed)return;if(f.duration-f.age>PLAY_RULES.queueLead){this.message='Too early — press J / K when the ball is closer.';return;}this.bufferedShot={action:code==='KeyJ'?'forehand':'backhand',time:this.time};this.intent=this.bufferedShot.action;this.resume();this.message='Shot prepared — stay close to the receiving circle.';return;}
  if(this.serving)return;super.down(code,repeat);
 }
 launch(role,start=null,origin=null){const serving=this.serving&&role===this.score.server;super.launch(role,start,origin);const f=this.flight;if(!f)return;f.isServe=serving;f.lateWindow=PLAY_RULES.lateWindow;f.court=this.score.court;
  if(serving){const box=serviceBox(role,this.score.court),u=box.landingMinU+.18+.14*this.random(),lv=role==='near'?.34:.66,q=(lv-f.origin.v)/(f.target.v-f.origin.v),target={u:f.origin.u+(u-f.origin.u)/q,v:f.target.v};const path=makeBallPath(this.data.court_matrix,f.origin,target,lv,f.startHeight);Object.assign(f,path);this.lastLanding={...path.landing,receiver:f.receiver,duration:f.duration};const event=this.events[this.events.length-1];if(event?.type==='hit')Object.assign(event,{landing:{...path.landing},serveCourt:this.score.court,serveAttempt:this.serveAttempt});
   if(!validService(role,this.score.court,this.position[role],f.landing)){this.serviceFault('Serve outside the diagonal service box');return;}
  }
  if(role==='near')this.bufferedShot=null;
  this.intent=f.receiver==='near'&&this.bufferedShot&&this.time-this.bufferedShot.time<=PLAY_RULES.shotBuffer?this.bufferedShot.action:null;
 }
 reachable(role,contact=false){const f=this.flight,p=this.position[role];if(!f)return false;const target=contact?ballGroundWorld(f,f.progress):f.target,rx=role==='near'?PLAY_RULES.nearReach:PLAY_RULES.farReach;return ((p.u-target.u)/rx)**2+((p.v-target.v)/PLAY_RULES.depthReach)**2<=1;}
 commit(role,action){const f=this.flight;if(!f||f.receiver!==role||f.committed||!this.reachable(role))return false;
  if(role==='near'&&(!this.bufferedShot||this.time-this.bufferedShot.time>PLAY_RULES.shotBuffer||f.duration-f.age>PLAY_RULES.prepareLead))return false;
  const nominal=Math.max(1,Math.ceil((f.duration-f.age)*this.fps)),available=Math.ceil((f.duration+f.lateWindow-f.age)*this.fps);if(available<1)return false;
  if(f.nextPrediction&&this.time<f.nextPrediction)return false;f.nextPrediction=this.time+1/this.fps;const prediction=this.forecast(role,action);if(!prediction||prediction.ticks>available*PLAY_RULES.maxMotionRate)return false;
  if(prediction.ticks<nominal-2&&f.age<f.duration-PLAY_RULES.earlyWindow)return false;
  const p=this.players[role],code=action==='forehand'?'KeyJ':'KeyK';p.down(code);p.up(code);Object.assign(f,{committed:true,committedAction:action,predictedSequence:prediction.sequence,predictedTicks:prediction.ticks,motionTicksRemaining:prediction.ticks,contactReady:false,contactAt:f.age+Math.max(nominal,prediction.ticks/PLAY_RULES.maxMotionRate)/this.fps});
  if(role==='near'){this.intent=null;this.bufferedShot=null;}
  this.event('prepare',`${role==='near'?'You':'Agent'} prepares ${labels[action]}`,{actor:role,sequence:prediction.sequence,ticks:prediction.ticks,receiveWindow:[f.duration-PLAY_RULES.earlyWindow,f.duration+f.lateWindow]});return true;
 }
 advance(role){const p=this.players[role],f=this.flight;if(f?.receiver===role&&f.committed){if(f.contactReady)return;const left=Math.max(1,Math.ceil((f.contactAt-f.age)*this.fps)),n=Math.min(PLAY_RULES.maxMotionRate,Math.ceil(f.motionTicksRemaining/left));for(let i=0;i<n;i++){p.tick();f.motionTicksRemaining--;if(f.motionTicksRemaining<=0){f.contactReady=!p.active&&isHit(p.state)&&p.frame>=this.contactFrame(role,p.clip);break;}if(p.paused)break;}return;}super.advance(role);}
 serviceFault(reason){if(this.pointResolved)return;this.flight=null;this.serving=false;this.intent=null;this.bufferedShot=null;this.trail=[];this.event('fault',reason,{server:this.score.server,attempt:this.serveAttempt});
  if(this.serveAttempt===1){this.serveAttempt=2;this.status='ready';this.resetPlayers();this.lineUp();for(const p of Object.values(this.players))p.resume();this.autoServeAt=this.score.server==='far'?this.time+PLAY_RULES.agentServeDelay:null;this.message=this.score.server==='far'?'Agent fault — second serve shortly.':'Fault. Press S for the second serve.';return;}this.finish('Double fault',opponent(this.score.server));
 }
 finish(reason,winner=null){if(this.pointResolved||this.status==='match_over')return;if(!winner&&/No direction reference|no legal exit route/i.test(reason)){this.status='error';this.message=reason+' · R to restart';this.flight=null;this.serving=false;this.pause();return;}
  winner=winner||this.flight?.hitter;if(!winner)return;this.pointResolved=true;const point=this.score.award(winner);this.lastPoint=point;this.status=this.score.winner?'match_over':'point_over';this.flight=null;this.intent=null;this.bufferedShot=null;this.serving=false;this.input.clear();this.serveAttempt=1;
  this.reaction={started:this.time,winner,near:winner==='near'?'victory':'defeat',far:winner==='far'?'victory':'defeat',terminal:!!this.score.winner,frames:Object.fromEntries(['near','far'].map(role=>[role,this.endingFrame(role,role===winner)]))};for(const p of Object.values(this.players)){p.held.clear();p.pending=null;}
  this.message=this.score.winner?`${winner==='near'?'You win':'Agent wins'} the match! Press R to play again.`:`${winner==='near'?'Your':'Agent’s'} point${point.gameWon?' · game won':''}. ${reason}. Press S for the next point.`;this.autoServeAt=!this.score.winner&&this.score.server==='far'?this.time+PLAY_RULES.reactionSeconds+PLAY_RULES.agentServeDelay:null;if(this.autoServeAt!==null)this.message=`${winner==='near'?'Your':'Agent’s'} point. Agent serves next automatically.`;this.agentNote=this.score.winner?'Match complete':`${this.score.server==='near'?'Your':'Agent’s'} service game`;this.event('point',reason,{winner,score:this.score.snapshot()});
 }
 endingFrame(role,winner){const p=this.players[role];let best=null;for(const clip of p.seqs.values()){if(clip.action!==(winner?'serve':'stationary'))continue;for(let i=0;i<clip.keys.length;i++){const k=clip.keys[i];if(![5,6,9,10,11,12,15,16].every(j=>k[j]?.[2]>.25))continue;const shoulder=(k[5][1]+k[6][1])/2,hip=(k[11][1]+k[12][1])/2,torso=Math.max(10,hip-shoulder),hands=(k[9][1]+k[10][1])/2,spread=Math.abs(k[15][0]-k[16][0])/torso;const score=winner?(shoulder-hands)/torso:(hands-shoulder)/torso-spread*1.5;if(!best||score>best.score)best={id:clip.id,index:i,score};}}return best||{id:p.clip.id,index:p.frame};}
 reactionSample(role){if(!this.reaction)return null;const frame=this.reaction.frames[role];return {type:'sequence',record:this.players[role].seqs.get(frame.id),index:frame.index,phase:'reaction'};}
 reactionPose(role){if(!this.reaction)return null;const age=this.time-this.reaction.started,win=this.reaction.winner===role,progress=Math.min(1,age/PLAY_RULES.reactionSeconds);return {state:win?(this.reaction.terminal?'victory':'celebrate'):(this.reaction.terminal?'defeat':'disappointed'),winner:win,age,y:win?-16*Math.sin(Math.PI*progress)*Math.sin(Math.PI*progress):7*progress,angle:win?-.035*Math.sin(progress*Math.PI*2):.055*progress};}
 tick(){if(this.paused)return;this.time+=1/this.fps;if(this.autoServeAt!==null&&this.time>=this.autoServeAt&&!this.flight&&!this.serving&&!this.score.winner){this.autoServeAt=null;this.serve();}if(this.reaction){if(!this.reaction.terminal&&this.time-this.reaction.started>=PLAY_RULES.reactionSeconds)this.status='ready';return;}
  this.syncNear();const server=this.players[this.score.server];if(this.serving&&!this.flight&&!server.busyHit&&server.state==='stationary'&&!server.active&&!server.movement()){server.down('KeyS');server.up('KeyS');}
  this.agent();if(this.intent&&this.bufferedShot&&this.time-this.bufferedShot.time>PLAY_RULES.shotBuffer){this.intent=null;this.bufferedShot=null;this.message='Shot preparation expired — press J / K again.';}if(this.intent)this.commit('near',this.intent);for(const role of ['near','far']){this.advance(role);if(this.players[role].paused){this.finish(`${role} action has no legal exit route`);return;}}
  const f=this.flight;if(f){f.age+=1/this.fps;f.progress=f.age/f.duration;this.lastBall=directBall(f,f.progress);this.trail.push(this.lastBall);if(this.trail.length>4)this.trail.shift();
   const p=this.players[f.receiver],inside=f.age>=f.duration-PLAY_RULES.earlyWindow&&f.age<=f.duration+f.lateWindow&&(!f.isServe||f.progress>f.bounceAt);
   if(inside&&f.committed&&f.contactReady&&this.reachable(f.receiver,true)&&p.clip.id===f.predictedSequence){const ground=ballGroundWorld(f,f.progress),height=ballHeight(f,f.progress);this.contacts.add(`${f.receiver}/${p.clip.id}/${p.uses.get(p.clip.id)}`);this.launch(f.receiver,this.lastBall,{...ground,height});return;}
   if(f.age>f.duration+f.lateWindow){this.finish(f.receiver==='near'?'You missed this ball':'The agent missed this ball',f.hitter);return;}
  }
  if(this.serving&&!this.flight&&!server.active&&server.state==='serve'&&server.frame>=this.contactFrame(this.score.server,server.clip)){this.launch(this.score.server);}
 }
 ballPoint(){return this.flight?directBall(this.flight,this.flight.progress):this.lastBall;}
 snapshot(){const s=super.snapshot();return {...s,score:this.score.snapshot(),serveAttempt:this.serveAttempt,autoServeAt:this.autoServeAt,reaction:this.reaction?{...this.reaction}:null,receiveRules:{...PLAY_RULES}};}
}
