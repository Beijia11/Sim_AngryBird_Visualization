const NS='http://www.w3.org/2000/svg';
const colors={stationary:'#39a99a',left:'#629fd3',right:'#8da974',forward:'#c9a04e',back:'#a586bf',forehand:'#d3a047',backhand:'#d48c77',serve:'#a8ad68'};
// Fixed regions retain the spatial arrangement and colors of the original two Atlases.
const layout={stationary:[220,166,73,65],forward:[75,140,26,25],back:[365,140,36,32],left:[88,334,59,53],right:[350,334,61,54],forehand:[78,513,53,44],backhand:[221,513,62,47],serve:[377,513,38,36]};
export const ballStates=[
 {id:'near_contact',name:'Near player hits',hint:'action-window association · contact not precisely labelled',y:145},
 {id:'to_far',name:'Flying to far',hint:'near → far',y:245},
 {id:'bounce',name:'Around the bounce',hint:'reviewed bounce candidates · estimate',y:345},
 {id:'far_contact',name:'Far player hits',hint:'action-window association · contact not precisely labelled',y:445},
 {id:'to_near',name:'Flying to near',hint:'far → near',y:545},
 {id:'unknown',name:'Unknown / not observed',hint:'missing frames do not borrow neighbour attributes',y:645}
];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const speed=s=>s?.speed?`${s.speed.label} ${s.speed.value} px/s · whole shot`:'speed unknown';
const landing=s=>s?.landing?.label||'landing zone unknown';
const within=(t,w)=>w&&t>=w[0]&&t<=w[1];
export function classifyBall(source,t,frame,shot,point){
 if(!shot||!point||point.shot_id!==shot.id)return 'unknown';
 if(within(frame,shot.landing?.frame_window)&&shot.landing?.status==='visually_reviewed_bounce_candidate')return 'bounce';
 if(within(t,shot.hitter?.window))return shot.hitter.actor+'_contact';
 if(within(t,shot.receiver?.window))return shot.receiver.actor+'_contact';
 return shot.target==='far'?'to_far':shot.target==='near'?'to_near':'unknown';
}
export function makeRelationGraph(root,graphData,bank,balls,{seek,togglePlayback}={}){
 root.innerHTML=`<div class="relation-heading"><div><div class="eyebrow">LINKED ATLAS / PLAYER × BALL × PLAYER</div><h2>Linked states of players and ball</h2></div><div class="relation-tools"><button data-rplay>Play source video</button><button data-rlabels aria-pressed="false">Show all IDs</button><button data-rexpand>Expand graph ↗</button></div></div><p class="hint">Lights up in sync with the source video. Click an action dot or ball state to see associated ball paths; click a window ID to seek the video.</p><p class="relation-mobile-hint">Swipe the graph sideways to see the ball in the middle and the far player on the right.</p><div class="relation-shell"><div class="relation-scroll" tabindex="0" aria-label="Scroll sideways through the linked graph of near player, ball and far player"><svg class="relation-svg" viewBox="0 0 1320 750" role="group" aria-label="Near-player state graph on the left, ball states and attributes in the middle, far-player state graph on the right"></svg></div><div class="relation-legend"><span><i class="r-dot"></i>action sequence</span><span><i class="r-dash"></i>existing state relation / legal candidate</span><span><i class="r-solid"></i>current observation</span><span><i class="r-association"></i>whole-shot action association (not exact contact)</span></div></div><div class="relation-live" role="status"></div><div class="relation-inspector"><p>Choose a dot to see the action, a ball state to see related windows. The same ID on both sides is still two separate nodes.</p></div><dialog class="relation-dialog" aria-label="Expanded player–ball graph"></dialog>`;
 root.querySelector('.relation-inspector').hidden=true;
 const svg=root.querySelector('svg'),shell=root.querySelector('.relation-shell'),dialog=root.querySelector('dialog');
 const el=(tag,attrs={},parent=svg)=>{const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);parent.append(e);return e;};
 const txt=(x,y,value,cls,parent=svg)=>{const e=el('text',{x,y,class:cls},parent);e.textContent=value;return e;};
 const act=(node,fn,label)=>{node.setAttribute('tabindex',0);node.setAttribute('role','button');node.setAttribute('aria-label',label);node.onclick=fn;node.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fn();}};};
 const defs=el('defs');const marker=el('marker',{id:'relation-arrow',markerWidth:6,markerHeight:6,refX:5,refY:3,orient:'auto-start-reverse'},defs);el('path',{d:'M0 0L6 3L0 6',fill:'context-stroke'},marker);
 const fixed=el('g',{class:'r-fixed'}),active=el('g',{class:'r-active-lines'}),clusters=el('g'),nodeLayer=el('g'),ballLayer=el('g');
 const coords=new Map(),nodes=new Map(),regions=new Map(),relationPaths=new Map(),cards=new Map(),sequences=new Map();let current=null,lastSignature='',focusKey=null;
 const line=(a,b,bend=.15)=>{const dx=b[0]-a[0],dy=b[1]-a[1];return `M${a[0]} ${a[1]} Q${(a[0]+b[0])/2-dy*bend} ${(a[1]+b[1])/2+dx*bend} ${b[0]} ${b[1]}`;};
 const route=(a,b)=>`M${a[0]} ${a[1]} C${(a[0]+b[0])/2} ${a[1]} ${(a[0]+b[0])/2} ${b[1]} ${b[0]} ${b[1]}`;
 const path=(d,cls,parent=active,attrs={})=>el('path',{d,class:cls,'marker-end':'url(#relation-arrow)',...attrs},parent);
 for(const [role,offset] of [['near',0],['far',870]]){
  const b=graphData.players[role];txt(offset+32,35,role==='near'?'NEAR PLAYER':'FAR PLAYER','r-role');txt(offset+32,58,`${b.states.length} STATES · ${b.sequences.length} SEQUENCES`,'r-count');
  for(const [si,state] of b.states.entries()){
   const [x,y,rx,ry]=layout[state.id],cx=x+offset;regions.set(role+':'+state.id,[cx,y,rx,ry]);
   const g=el('g',{'data-cluster':role+':'+state.id,class:'r-cluster',style:`--r-color:${colors[state.id]}`},clusters);
   el('ellipse',{cx,cy:y,rx:rx+13,ry:ry+19,class:'r-halo'},g);const title=txt(cx,y-ry-23,state.name,'r-state-title',g);act(title,()=>inspectState(role,state.id),`${role} ${state.name} associated windows`);
   const list=b.sequences.filter(s=>s.action===state.id);txt(cx,y+ry+26,`${list.length} sequences`,'r-cluster-count',g);
   list.forEach((s,i)=>{
    const theta=i*2.399963+si*.79,rr=Math.sqrt((i+.55)/list.length),point=[cx+Math.cos(theta)*rr*rx*.88,y+Math.sin(theta)*rr*ry*.88],key=role+':'+s.id;
    coords.set(key,point);sequences.set(key,s);const n=el('g',{class:'r-sequence','data-rnode':key,transform:`translate(${point[0]},${point[1]})`,style:`--r-color:${colors[state.id]}`},nodeLayer);
    el('circle',{r:9,class:'r-hit'},n);el('circle',{r:10,class:'r-ring'},n);el('circle',{r:4.5,class:'r-node'},n);txt(9,-7,s.id,'r-node-label',n);const tooltip=el('title',{},n);tooltip.textContent=`${role==='near'?'Near':'Far'} · ${s.id} · ${state.name} · video ${s.source_id}`;
    act(n,()=>{focusKey=key;for(const [k,v] of nodes)v.classList.toggle('inspected',k===key);inspectSequence(role,s);},tooltip.textContent);nodes.set(key,n);
   });
  }
  for(const r of b.relations){if(r.from===r.to)continue;const a=regions.get(role+':'+r.from),z=regions.get(role+':'+r.to);if(!a||!z)continue;
   const dx=z[0]-a[0],dy=z[1]-a[1],l=Math.hypot(dx,dy),start=[a[0]+dx/l*(Math.min(a[2],a[3])+12),a[1]+dy/l*(Math.min(a[2],a[3])+12)],end=[z[0]-dx/l*(Math.min(z[2],z[3])+12),z[1]-dy/l*(Math.min(z[2],z[3])+12)];
   const d=line(start,end,.13);path(d,'r-state-edge',fixed,{'data-rstate-edge':`${role}:${r.from}--${r.to}`});relationPaths.set(`${role}:${r.from}--${r.to}`,d);
  }
 }
 txt(660,35,'BALL','r-role r-centered');txt(660,58,'STATE + OBSERVED ATTRIBUTES','r-count r-centered');
 for(const s of ballStates){
  const g=el('g',{class:'r-ball-state','data-ball-state':s.id},ballLayer);el('rect',{x:535,y:s.y-30,width:250,height:84,rx:22,class:'r-ball-bg'},g);el('circle',{cx:554,cy:s.y-7,r:4,class:'r-ball-dot'},g);txt(660,s.y,s.name,'r-ball-title',g);el('rect',{x:551,y:s.y+11,width:218,height:17,rx:8,class:'r-tag-bg'},g);txt(660,s.y+23,'','r-ball-tag tag-one',g);txt(660,s.y+41,'','r-ball-tag tag-two',g);act(g,()=>inspectBall(s),s.name+' ball-path windows and attributes');cards.set(s.id,g);
 }
 // Permanent topology: these are display/association categories, not a physical simulator.
 for(const [a,b] of [['near_contact','to_far'],['to_far','far_contact'],['far_contact','to_near'],['to_near','near_contact'],['to_far','bounce'],['to_near','bounce']]){
  const y=ballStates.find(s=>s.id===a).y,z=ballStates.find(s=>s.id===b).y,x=a==='to_near'?805:515;
  path(`M${x===805?785:535} ${y+12} C${x} ${y+12} ${x} ${z+12} ${x===805?785:535} ${z+12}`,'r-ball-edge',fixed);
 }
 for(const role of ['near','far'])for(const state of ['forehand','backhand','serve']){
  const r=regions.get(role+':'+state),target=ballStates.find(s=>s.id===role+'_contact');path(route([r[0],r[1]],[role==='near'?535:785,target.y]),'r-association-edge',fixed);
 }
 function related(role,id,isState=false){return balls.sources.flatMap(src=>src.shots.filter(s=>[s.hitter,s.receiver].some(a=>a?.actor===role&&(isState?a.action===id:a.sequence_id===id))).map(s=>({source:src,shot:s})));}
 function windowsHTML(items){return items.length?`<div class="r-window-list">${items.map(({source:s,shot:q})=>`<button data-rseek="${esc(s.source_id)}:${esc(q.id)}">${esc(q.id)} <span>${q.start.toFixed(2)}s · ${esc(q.hitter.actor==='near'?'near':'far')}</span></button>`).join('')}</div>`:'<p class="hint">No ball-path window is directly associated with this action; you can still review the source action, and this does not mean there was no ball.</p>';}
 function inspect(html){root.querySelector('.relation-inspector').hidden=false;root.querySelector('.relation-inspector').innerHTML=html;for(const b of root.querySelectorAll('[data-rseek]'))b.onclick=()=>{const [id,sid]=b.dataset.rseek.split(':');const src=balls.sources.find(s=>s.source_id===id),shot=src.shots.find(s=>s.id===sid);seek(src.source_id,shot.start+.008);};for(const b of root.querySelectorAll('[data-rtime]'))b.onclick=()=>seek(b.dataset.rsource,Number(b.dataset.rtime));}
 function inspectSequence(role,s){const items=related(role,s.id),name=graphData.players[role].states.find(x=>x.id===s.action).name;inspect(`<div class="r-inspect-title"><strong>${role==='near'?'Near':'Far'} · ${esc(s.id)} · ${esc(name)}</strong><a href="../${role}/?source=${s.source_id}&time=${s.start}&sequence=${s.id}">Open this player’s Atlas ↗</a><button data-rsource="${s.source_id}" data-rtime="${s.start+.01}">Seek to source action</button></div><p class="hint">Video ${s.source_id} · ${s.start.toFixed(2)}–${s.end.toFixed(2)}s · ${items.length} action-interval associations, not confirmed contacts.</p>${windowsHTML(items)}`);}
 function inspectState(role,id){const name=graphData.players[role].states.find(s=>s.id===id).name;inspect(`<strong>${role==='near'?'Near':'Far'} · ${esc(name)} associated windows</strong>${windowsHTML(related(role,id,true))}`);}
 function inspectBall(s){const items=balls.sources.flatMap(src=>src.shots.filter(q=>s.id==='unknown'?src.frames.some((p,i)=>i/src.fps>=q.start&&i/src.fps<q.end&&!p):s.id==='bounce'?q.landing?.status==='visually_reviewed_bounce_candidate':s.id.startsWith('to_')?q.target===s.id.slice(3)&&q.points.length:[q.hitter,q.receiver].some(a=>a?.actor===s.id.split('_')[0])).map(q=>({source:src,shot:q})));inspect(`<strong>Ball · ${s.name}</strong><p class="hint">${s.hint}. Windows with this kind of evidence or association are listed below; after seeking, the current frame still shows what is actually observed. Speed labels summarise the whole shot.</p>${windowsHTML(items)}`);}
 function update({source,t,frame,shot,point,near,far}){
  current={source,t,frame,shot,point,near,far};const bid=classifyBall(source,t,frame,shot,point),sig=JSON.stringify([source.source_id,near?.id,far?.id,shot?.id,bid,point?.kind]);
  if(sig===lastSignature)return;lastSignature=sig;active.replaceChildren();
  for(const n of nodes.values()){n.classList.remove('current','linked','candidate');}
  for(const n of root.querySelectorAll('.r-cluster'))n.classList.remove('current');
  for(const role of ['near','far']){
   const now=role==='near'?near:far;if(!now)continue;nodes.get(role+':'+now.sequence_id)?.classList.add('current');root.querySelector(`[data-cluster="${role}:${now.state}"]`)?.classList.add('current');
   const obs=bank.players[role].observations.filter(o=>o.source_id===source.source_id),idx=obs.findIndex(o=>o.id===now.id),prev=obs[idx-1];
   if(prev&&Math.abs(prev.end-now.start)<.35&&prev.sequence_id&&now.sequence_id&&prev.sequence_id!==now.sequence_id){
    const a=coords.get(role+':'+prev.sequence_id),b=coords.get(role+':'+now.sequence_id);if(!a||!b)continue;
    const d=relationPaths.get(`${role}:${prev.state}--${now.state}`);if(d)path(d,'r-current-state');
    for(const id of graphData.players[role].candidates[prev.sequence_id]||[]){const seq=sequences.get(role+':'+id);if(seq?.action===now.state&&coords.has(role+':'+id)){nodes.get(role+':'+id).classList.add('candidate');path(line(a,coords.get(role+':'+id)),'r-candidate');}}
    path(line(a,b),'r-current-pair',active,{'data-observed-pair':role+':'+prev.sequence_id+'--'+now.sequence_id});
   }
  }
  for(const s of ballStates){const g=cards.get(s.id);g.classList.toggle('current',bid===s.id);g.querySelector('.tag-one').textContent='';g.querySelector('.tag-two').textContent='';}
  const card=cards.get(bid);if(bid==='unknown'){card.querySelector('.tag-one').textContent=shot?'not measured in this frame':'no ball path observed';}
  else{card.querySelector('.tag-one').textContent=bid==='bounce'?landing(shot):speed(shot);card.querySelector('.tag-two').textContent=bid==='bounce'?`frames ${shot.landing.frame_window.join('–')} · ${point.kind==='interpolated'?'interpolated':'detected'}`:landing(shot);}
  if(shot){for(const [a,kind] of [[shot.hitter,'hitter'],[shot.receiver,'receiver']]){
    if(!a?.sequence_id)continue;const key=a.actor+':'+a.sequence_id,p=coords.get(key);if(!p)continue;nodes.get(key).classList.add('linked');
    const center=ballStates.find(s=>s.id===bid),ballPoint=[a.actor==='near'?535:785,center.y+8];const d=kind==='hitter'?route(p,ballPoint):route(ballPoint,p);path(d,'r-shot-link',active,{'data-shot-link':key,'data-association-kind':kind});
  }}
  const names=role=>{const a=role==='near'?near:far;return a?`${graphData.players[role].states.find(s=>s.id===a.state)?.name||a.state} ${a.sequence_id||''}`:'Unknown / not covered';};
  root.querySelector('.relation-live').innerHTML=`<span>Near <b>${esc(names('near'))}</b></span><span class="r-live-ball">Ball <b>${ballStates.find(s=>s.id===bid).name}</b>${bid!=='unknown'?` <small>${point.kind==='interpolated'?'short-gap interpolation':'ball detected'}</small>`:''}</span><span>Far <b>${esc(names('far'))}</b></span>`;
  root.dataset.ballState=bid;root.dataset.source=source.source_id;
 }
 root.querySelector('[data-rplay]').onclick=()=>togglePlayback?.();
 root.querySelector('[data-rlabels]').onclick=e=>{const on=!shell.classList.contains('r-all-labels');shell.classList.toggle('r-all-labels',on);e.target.setAttribute('aria-pressed',String(on));};
 root.querySelector('[data-rexpand]').onclick=()=>{dialog.append(shell);dialog.showModal();};dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});dialog.addEventListener('close',()=>{root.insertBefore(shell,root.querySelector('.relation-live'));root.querySelector('[data-rexpand]').focus();});
 const close=document.createElement('button');close.textContent='Collapse graph ×';close.className='relation-close';close.onclick=()=>dialog.close();dialog.append(close);
 return {update,setPlaying(playing){root.querySelector('[data-rplay]').textContent=playing?'Pause source video':'Play source video';},clear(){lastSignature='';active.replaceChildren();root.dataset.ballState='loading';for(const n of nodes.values())n.classList.remove('current','linked','candidate');for(const s of ballStates){const g=cards.get(s.id);g.classList.remove('current');g.querySelector('.tag-one').textContent='';g.querySelector('.tag-two').textContent='';}for(const g of root.querySelectorAll('.r-cluster'))g.classList.remove('current');root.querySelector('.relation-live').textContent='Switching video, waiting for its data…';},get current(){return current},classifyBall};
}
