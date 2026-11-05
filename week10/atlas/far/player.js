export const directions={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'forward',ArrowDown:'back'};
export const shots={KeyJ:'forehand',KeyK:'backhand',KeyS:'serve'};
export const isHit=s=>['forehand','backhand','serve'].includes(s);
// Both the explorer and the live controller use these exact phase paths.
export function coreSamples(bank,clip,cycles=3){
 const p=clip.rule_phase,out=[];const seq=i=>({type:'sequence',record:clip,index:i,phase:i<p.core[0]?'entry':'core'});
 if(!p.available||p.kind==='one-shot')return out;
 for(let i=0;i<p.core[0];i++)out.push(seq(i));
 if(p.kind==='hold'){for(let i=0;i<cycles*30;i++)out.push(seq(p.core[0]));return out;}
 const edge=bank.loop_edges.find(e=>e.id===p.loop_edge);
 for(let n=0;n<cycles;n++){
  for(let i=n?p.core[0]+2:p.core[0];i<=edge.exit_index;i++)out.push(seq(i));
  for(let i=0;i<edge.frames;i++)out.push({type:'seam',record:edge,index:i,phase:'core'});
 }
 return out;
}
export function previewTimeline(bank,a,b,edge,cycles=3){
 const out=[];const add=(s,i,phase)=>out.push({type:'sequence',record:s,index:i,phase});
 if(a.id===b.id){out.push(...coreSamples(bank,a,cycles));return out;}
 if(a.rule_phase.kind==='one-shot')for(let i=0;i<=edge.exit_index;i++)add(a,i,'action');
 else {
  out.push(...coreSamples(bank,a,cycles));const p=a.rule_phase;
  // Finish the final running cycle, then play its exit tail only once.
  for(let i=p.kind==='hold'?p.core[0]+1:p.core[0]+2;i<=edge.exit_index;i++)add(a,i,'exit');
 }
 for(let i=0;i<edge.frames;i++)out.push({type:'seam',record:edge,index:i,phase:'transition'});
 if(b.rule_phase.kind==='one-shot')for(let i=edge.resume_index;i<b.frames;i++)add(b,i,'action');
 else {
  const entry=coreSamples(bank,b,cycles);out.push(...entry.filter((s,i)=>!(s.type==='sequence'&&s.index<edge.resume_index&&i<edge.resume_index)));
 }
 return out;
}
export class MultiPlayer{
 constructor(bank){this.bank=bank;this.seqs=new Map(bank.sequences.map(s=>[s.id,s]));this.loops=new Map(bank.loop_edges.map(e=>[e.from_id,e]));this.edges=bank.edges.filter(e=>e.controller_enabled);this.out=new Map();for(const e of this.edges){if(!this.out.has(e.from_id))this.out.set(e.from_id,[]);this.out.get(e.from_id).push(e);}this.reset();}
 reset(){this.clip=this.seqs.get(this.bank.controller.initial_sequence);this.frame=0;this.active=null;this.pending=null;this.held=new Map();this.serial=0;this.paused=true;this.time=0;this.history=[];this.uses=new Map([[this.clip.id,1]]);this.usedEdges=new Set();this.visited=new Set([this.clip.id]);this.plan=null;this.seed=41;this.cycles=0;this.generation=0;this.operationGeneration=0;this.lastChoice=new Map();this.lastSelection=null;this.event('reset','A held input locks one sequence; only its core loops');}
 random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
 get state(){return this.clip.action;}
 get busyHit(){return isHit(this.state)||isHit(this.active?.edge.to_state)||!!this.pending;}
 get phase(){if(this.plan)return 'exit';if(this.active)return this.active.edge.rule_kind==='self'?'core':'transition';const p=this.clip.rule_phase;if(p.kind==='one-shot')return 'action';return this.frame<p.core[0]?'entry':this.frame<=p.core[1]?'core':'exit';}
 event(type,note,extra={}){this.note=note;this.history.push({type,time:this.time,clip:this.clip.id,frame:this.frame,state:this.state,phase:this.phase,operation:this.generation,note,...extra});if(this.history.length>2000)this.history.shift();}
 pause(note='Paused; input cleared'){this.paused=true;this.held.clear();this.pending=null;this.plan=null;this.generation++;this.event('pause',note);}
 movement(){return [...this.held.entries()].filter(([k])=>directions[k]).sort((a,b)=>b[1]-a[1])[0];}
 desired(){return this.pending||directions[this.movement()?.[0]]||'stationary';}
 down(code,repeat=false){
  if(repeat||this.held.has(code))return;
  if(code==='Space'){this.paused?this.resume():this.pause();return;}if(code==='KeyR'){this.reset();return;}
  if(!directions[code]&&!shots[code])return;
  if(!this.bank.controller.reachable_states.includes(directions[code]||shots[code])){this.event('reject','No playable clip for this state in this batch');return;}
  if(shots[code]){if(this.busyHit){this.event('reject','A stroke is queued or playing');return;}if(code==='KeyS'&&(this.state!=='stationary'||this.active||this.movement())){this.event('reject','Serve starts only from Stationary');return;}this.pending=shots[code];}
  const before=this.desired();this.held.set(code,++this.serial);if(directions[code]&&before!==this.desired())this.generation++;
  this.plan=null;this.paused=false;this.event('request',`Request ${directions[code]||shots[code]}`);
 }
 up(code){const before=this.desired();this.held.delete(code);if(before!==this.desired())this.generation++;this.plan=null;this.event('release',`${code} released`);}
 resume(){this.paused=false;this.event('resume','Enter once, repeat the core, exit once');}
 distances(target){const d=new Map();for(const s of this.seqs.values())if(s.action===target&&s.controller_reachable&&s.controller_targetable)d.set(s.id,0);for(let n=0;n<10;n++){let change=false;for(const e of this.edges){if(d.has(e.to_id)&&(e.to_state===target||!isHit(e.to_state))){const k=d.get(e.to_id)+1;if(!d.has(e.from_id)||k<d.get(e.from_id)){d.set(e.from_id,k);change=true;}}}if(!change)break;}return d;}
 choose(target){
  const dist=this.distances(target),p=this.clip.rule_phase,earliest=p.kind==='one-shot'?this.frame:Math.max(this.frame,p.core[0]+(p.kind==='cycle'?2:0));
  let options=(this.out.get(this.clip.id)||[]).filter(e=>e.exit_index>=earliest&&dist.has(e.to_id)&&(e.to_state===target||!isHit(e.to_state)));
  if(!options.length)return null;
  const distance=Math.min(...options.map(e=>dist.get(e.to_id)));options=options.filter(e=>dist.get(e.to_id)===distance);
  // Randomize destination pairs, not exit counts: a pair with 3 exits gets no extra votes.
  let ids=[...new Set(options.map(e=>e.to_id))];const previous=this.lastChoice.get(target);if(ids.length>1&&ids.includes(previous))ids=ids.filter(id=>id!==previous);
  const allCandidates=[...ids];const least=Math.min(...ids.map(id=>this.uses.get(id)||0));ids=ids.filter(id=>(this.uses.get(id)||0)===least);
  const chosen=ids[Math.floor(this.random()*ids.length)],ee=options.filter(e=>e.to_id===chosen).sort((a,b)=>a.exit_index-b.exit_index||a.max_ratio-b.max_ratio);
  if(this.seqs.get(chosen).action===target){this.lastChoice.set(target,chosen);this.lastSelection={state:target,candidates:allCandidates,selected:chosen};this.event('selection','Chosen from usable pairs: '+chosen,{candidates:allCandidates,selected:chosen});}return ee[0];
 }
 startEdge(e){this.active={edge:e,index:0};this.usedEdges.add(e.id);this.event(e.rule_kind==='self'?'loop':'transition',`${e.from_id} → ${e.to_id}`,{edge:e.id,from:e.from_id,to:e.to_id,request:this.desired()});}
 tick(){
  if(this.paused)return;this.time+=1/this.bank.config.fps;
  if(this.active){if(this.active.index<this.active.edge.frames-1){this.active.index++;return;}const e=this.active.edge;this.frame=e.resume_index;this.active=null;
   if(e.rule_kind==='self'){this.cycles++;return;}
   this.clip=this.seqs.get(e.to_id);this.plan=null;this.operationGeneration=this.generation;this.uses.set(this.clip.id,(this.uses.get(this.clip.id)||0)+1);this.visited.add(this.clip.id);if(this.pending===this.state)this.pending=null;this.event('entered',`Entered ${this.clip.id}; locked for this held input`,{edge:e.id});return;
  }
  const p=this.clip.rule_phase,desired=this.desired(),same=desired===this.state&&!isHit(this.state);
  // Releasing/repressing before settling completes a return to idle first.
  const newOperation=same&&this.state!=='stationary'&&this.operationGeneration!==this.generation;
  if(this.plan?.request!==desired)this.plan=null;
  if((!same||newOperation)&&!this.plan){const target=newOperation?'stationary':desired,e=this.choose(target);if(e)this.plan={edge:e,request:desired};}
  if(this.plan){const e=this.plan.edge;if(this.frame<e.exit_index){this.frame++;return;}if(this.frame===e.exit_index){this.plan=null;this.startEdge(e);return;}}
  if(p.kind==='one-shot'){
   if(this.frame<this.clip.frames-1){this.frame++;return;}
   this.pause('No exit route in the pair graph; no hard cut');this.event('unreachable',this.note);return;
  }
  // No same-state selection: repeat only this sequence's extracted core.
  if(p.kind==='hold'){if(this.frame<p.core[0])this.frame++;return;}
  const e=this.loops.get(this.clip.id);
  if(this.frame<e.exit_index){this.frame++;return;}
  if(this.frame===e.exit_index){this.startEdge(e);return;}
  // If a requested exit was cancelled after leaving the core, finish to a legal idle.
  const fallback=this.choose('stationary');if(fallback){this.plan={edge:fallback,request:desired};return;}
  if(this.frame<this.clip.frames-1){this.frame++;return;}
  this.pause('No legal return route from the current tail; no jump back or clip switch');this.event('unreachable',this.note);
 }
 sample(){return this.active?{type:'seam',record:this.active.edge,index:this.active.index,phase:this.phase}:{type:'sequence',record:this.clip,index:this.frame,phase:this.phase};}
}
