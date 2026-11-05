import {MultiPlayer,directions,shots,isHit,previewTimeline} from './player.js';
import {makeSequenceGraph} from './graph.js';
const $=s=>document.querySelector(s),NS='http://www.w3.org/2000/svg';
const names={stationary:'Stationary',left:'Left',right:'Right',forward:'Forward',back:'Back',forehand:'Forehand',backhand:'Backhand',serve:'Serve',unknown:'Unknown / not covered'};
const colors={stationary:'#8ba58d',left:'#447d9c',right:'#629378',forward:'#b2a151',back:'#8d82a9',forehand:'#db955b',backhand:'#be7969',serve:'#b8a34d',unknown:'#acb1aa'};
const pos={stationary:[280,55],left:[100,160],right:[460,160],forward:[210,165],back:[350,165],forehand:[130,330],backhand:[430,330],serve:[280,420]};
const fmt=(x,d=2)=>Number.isFinite(x)?x.toFixed(d):'n/a';const boneEdges=[[5,6],[5,7],[7,9],[6,8],[8,10],[5,11],[6,12],[11,12],[11,13],[13,15],[12,14],[14,16]];
let bank,seqs,edges,pairs,byRelation,obsGraph,relGraph,ctrlGraph,player,relation,currentPair,previewEdge,previewMode='mls',previewFrame=0,previewPlaying=false,previewAcc=0,sourceId,sourceActs,currentSequence;
let previewFrames=[];
const phaseNames={entry:'Entry / start',core:'Sustained core',exit:'Exit / settle',transition:'Cross-state transition',action:'Full stroke'};
const cache=new Map(),cacheLimit=72;
function getImage(url){
 if(!url)return null;
 if(cache.has(url)){const x=cache.get(url);cache.delete(url);cache.set(url,x);return x.ready?x.image:null;}
 const im=new Image(),record={image:im,ready:false};cache.set(url,record);im.onload=()=>{record.ready=true;};im.onerror=()=>{record.error=true;showError('Pixel atlas failed to load: '+url);};im.src=url;
 if(cache.size>cacheLimit){for(const [key,r] of cache){if(r.ready){cache.delete(key);break;}}}
 return null;
}
function showError(message){$('#error-banner').textContent=message;$('#error-banner').hidden=false;}
function asset(record,index,type){if(type==='seam')return {url:record.atlas,index,cols:record.cols||5};const p=record.atlas_parts.find(p=>p.start<=index&&index<p.start+p.count);return p?{url:p.url,index:index-p.start,cols:p.cols}:null;}
function drawPose(ctx,k){if(!k)return;ctx.strokeStyle='#287767';ctx.lineWidth=2;for(const [a,b] of boneEdges){if(k[a][2]>=.45&&k[b][2]>=.45){ctx.beginPath();ctx.moveTo(k[a][0],k[a][1]);ctx.lineTo(k[b][0],k[b][1]);ctx.stroke();}}ctx.fillStyle='#c57b4d';for(const [x,y,c] of k)if(c>=.45){ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill();}}
function drawSample(ctx,record,index,type,x=0,y=0,scale=1,mode='pixels'){
 const a=asset(record,index,type);if(!a)return false;const image=getImage(a.url);if(!image)return false;
 ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
 if(mode!=='pose')ctx.drawImage(image,(a.index%a.cols)*256,Math.floor(a.index/a.cols)*320,256,320,0,0,256,320);
 if(mode!=='pixels')drawPose(ctx,record.keys[index]);ctx.restore();return true;
}
function background(ctx,w,h){ctx.fillStyle='#e9ede3';ctx.fillRect(0,0,w,h);}
function setButtons(root,key,value){root.querySelectorAll('button').forEach(b=>{const on=b.dataset[key]===value;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});}

function makeGraph(root,onEdge,onNode){return makeSequenceGraph(root,bank,{onEdge,onNode,onPair:(id,original)=>{if(original){openSequence(id.split('--')[0]);return;}const p=pairs.get(id);if(!p)return;setRelation(p.relation);selectPair(id);if(root.id!=='transition-graph')$('#connections').scrollIntoView({behavior:'smooth'});}});}

function sequenceCard(s){return `<button class="seq-card" data-sequence="${s.id}"><div class="seq-picture"><img src="${s.poster}" alt="${s.id} ${s.label}" loading="lazy"><span class="seq-id">${s.id}</span><span class="duration">${fmt(s.duration)}s</span></div><div class="seq-meta"><b>Source ${s.source_id} · ${s.label}</b><small>${fmt(s.start)}–${fmt(s.end)}s</small><div class="issue">${s.controller_reachable?'Reachable by control':s.playback_exclusions?.[0]||s.control_exclusions[0]||'Not reachable in the current control graph'}</div></div></button>`;}
function library(){
 $('#state-library').innerHTML=bank.model.states.map(state=>{const ss=bank.sequences.filter(s=>s.action===state.id),n=ss.filter(s=>s.controller_reachable).length;return `<details class="state-folder" id="folder-${state.id}"><summary><strong>${state.name}</strong><span class="count">${ss.length} clips</span><span class="support">${n} reachable by control</span><span class="range">${ss[0].id} — ${ss.at(-1).id}</span></summary><div class="sequence-grid">${ss.map(sequenceCard).join('')}</div></details>`;}).join('');
}
function openSequence(id){
 const s=seqs.get(id);currentSequence=s;previewPlaying=false;if(player)player.pause('Viewing a source action: paused, input cleared');$('#source-video').pause();
 $('#sequence-title').textContent=`${s.id} / ${s.label}`;setButtons($('#sequence-modes'),'field','video');const v=$('#sequence-video');v.src=s.video;v.poster=s.poster;
 $('#sequence-info').innerHTML=`<dl><dt>Activation</dt><dd>${s.activation_id}</dd><dt>Source interval</dt><dd>${s.source_id} / ${fmt(s.start,3)}–${fmt(s.end,3)}s</dd><dt>Source frames</dt><dd>${s.frame_ids[0]}–${s.frame_ids.at(-1)}, ${s.frames} frames</dd><dt>Speed attribute</dt><dd>${s.attributes.reliable?fmt(s.attributes.medianSpeed,1)+' px/s':'not reliably measurable'}${s.band?' / '+s.band:''}</dd><dt>Asset</dt><dd>${s.reused_pixel_asset?'reuses existing full pixels':'exported from the old labels and skeleton'}</dd><dt>Reachable by control</dt><dd>${s.controller_reachable?'yes':'no'}</dd><dt>Missing poses</dt><dd>${s.missing_pose_frames} frames</dd></dl><p>${s.playback_notes||s.playback_exclusions?.join('; ')||'Original diagnosis kept; phase pairing decides whether it is usable.'}</p><p>${s.visual_notes||'Foreground and joints come from the existing 2D method; edges / racket / occlusions may be incomplete.'}</p><p><a href="../source/${s.source_id}.mp4#t=${s.start},${s.end}" target="_blank" rel="noopener">Open the full source video ↗</a></p><p><a href="${s.video}" download>Download source action MP4 ↗</a></p>`;
 $('#sequence-info').insertAdjacentHTML('afterbegin',`<div class="phase-strip">${phaseText(s)}</div><p>${s.rule_phase.basis}</p>`);$('#sequence-dialog').showModal();v.play().catch(()=>{});
}
function setSource(id,time=0){
 sourceId=id;sourceActs=bank.observations.filter(a=>a.source_id===id);$('#source-select').value=id;const v=$('#source-video');v.pause();v.src='../source/'+id+'.mp4';
 $('#activation-select').innerHTML=sourceActs.map(a=>`<option value="${a.activation_id}">${fmt(a.start)}–${fmt(a.end)} ${names[a.state_id]}</option>`).join('');
 const timeline=$('#source-timeline');timeline.innerHTML=sourceActs.map(a=>`<button style="flex-grow:${a.end-a.start};background:${colors[a.state_id]}" data-activation="${a.activation_id}" title="${names[a.state_id]} ${fmt(a.start)}–${fmt(a.end)}s"></button>`).join('');
 v.addEventListener('loadedmetadata',()=>{if(time>0)v.currentTime=time;observe();},{once:true});observe();
}
function observe(){
 if(!sourceActs)return;const t=$('#source-video').currentTime,a=sourceActs.find(a=>a.start<=t&&t<a.end)||sourceActs.at(-1);if(!a)return;
 const i=sourceActs.indexOf(a),prev=sourceActs[i-1];const linked=prev&&prev.state_id!=='unknown'&&a.state_id!=='unknown'&&a.continuity_id===prev.continuity_id&&Math.abs(a.start-prev.end)<.001?prev.state_id+'--'+a.state_id:null;const hot=linked&&t-a.start<.35;
 const sid=bank.sequences.find(s=>s.activation_id===a.activation_id)?.id, pid=bank.sequences.find(s=>s.activation_id===prev?.activation_id)?.id;
 obsGraph.update({connectionPair:linked&&pid&&sid?pid+'--'+sid:null,connectionStatus:'Observed in source',actual:a.state_id==='unknown'?null:a.state_id,focus:a.state_id==='unknown'?null:a.state_id,actualSequence:hot?pid:sid,targetSequence:hot?sid:null,hot,self:!hot&&!!sid&&!isHit(a.state_id)&&!!seqs.get(sid).rule_phase.core&&Math.round((t-seqs.get(sid).start)*bank.config.fps)>=seqs.get(sid).rule_phase.core[0]&&Math.round((t-seqs.get(sid).start)*bank.config.fps)<=seqs.get(sid).rule_phase.core[1]});
 $('#activation-select').value=a.activation_id;$('#source-time').textContent=`${sourceId} / ${fmt(t)}s`;$('#source-label').textContent=names[a.state_id];
 const phase=a.phases?.find(p=>p.start<=t&&t<p.end);$('#observation-meta').textContent=`${a.activation_id} · ${fmt(a.start)}–${fmt(a.end)}s · ${names[a.state_id]}${phase?' / '+phase.label:''}\nspeed ${a.attributes.reliable?fmt(a.attributes.medianSpeed,1)+' px/s':'not reliably measurable'} · boundary ±${a.boundary_error_s||.15}s · ${a.state_id==='unknown'?'not covered, not a controllable state':'original label'}`;
 $('#source-timeline').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.activation===a.activation_id));
}

function metricHTML(p){const labels={pose:'Pose diff',velocity:'Joint velocity diff',root_velocity:'Root motion diff'};return Object.entries(labels).map(([k,label])=>{const v=p.metrics?.[k],limit=bank.config.thresholds[k],ratio=Number.isFinite(v)?v/limit:0;return `<div class="metric"><span>${label}</span><span class="bar"><i class="${ratio>1?'bad':''}" style="width:${Math.min(ratio,1)*100}%"></i></span><span class="value">${fmt(v,3)} / ${fmt(limit,3)}</span></div>`;}).join('');}
function statusText(p){if(p.rule_allowed)return p.from_id===p.to_id?'Sustained core self-loop':'Passes phase rules';if(p.has_mls||p.natural)return 'Original pair possible; not executed by these rules';return {natural:'Naturally adjacent in source',compatible:'Has a valid MLS exit',rejected:'Over current tolerance',unknown:'Not enough data, undecided'}[p.status];}
function setRelation(id){
 relation=bank.relations.find(r=>r.id===id);$('#relation-select').value=id;$('#relation-title').textContent=`${names[relation.from_state]} → ${names[relation.to_state]}`;
 $('#relation-focus').value=relation.from_state;relGraph.update({selected:id,focus:relation.from_state});
 $('#relation-stats').innerHTML=[[relation.pairs,'all pairs'],[relation.rule_pairs,'pass new rules'],[relation.with_mls,'original pairs with MLS'],[relation.rule_controller_pairs,'controllable pairs']].map(([n,text])=>`<div><strong>${n}</strong><span>${text}</span></div>`).join('');
 $('#pair-filter').value='all';$('#pair-random').disabled=!relation.rule_pairs;relGraph.clearFocus();renderMatrix();renderPairList();
 const pp=byRelation.get(id),preferred=pp.find(p=>p.rule_controller_edges>0)||pp.find(p=>p.rule_allowed)||pp.find(p=>p.natural)||pp[0];selectPair(preferred.id);
}
function renderPairList(){
 const filter=$('#pair-filter').value;const all=byRelation.get(relation.id),list=all.filter(p=>filter==='legacy'?p.has_mls||p.natural:filter==='natural'?p.natural:filter==='control'?p.rule_controller_edges>0:p.rule_allowed);
 $('#pair-list-count').textContent=`${list.length} / ${all.length} pairs`;
 $('#pair-list').innerHTML=list.map(p=>`<button class="pair-card ${p.id===currentPair?.id?'active':''}" data-pair="${p.id}">${(p.rule_poster||p.poster)?`<img src="${p.rule_poster||p.poster}" alt="${p.id} offline seam frames" loading="lazy">`:`<div class="natural-placeholder">Continuous in source ${p.from_id} → ${p.to_id}</div>`}<div class="meta"><b>${p.from_id} → ${p.to_id}</b><small class="badge">${p.rule_allowed?(p.from_id===p.to_id?'Core loop of the current clip':p.rule_edges.length+' phase exits'):'Original pair possibility only'}${p.has_mls&&p.natural?' · ':''}${p.natural?'naturally adjacent':''}</small><small>${p.rule_controller_edges?'controllable':'observation only / research preview'}</small></div></button>`).join('')||'<p class="muted small">No transition for this relation matches the current filter. All pairs and reasons stay on the right.</p>';
}
function renderMatrix(){
 const aa=bank.sequences.filter(s=>s.action===relation.from_state),bb=bank.sequences.filter(s=>s.action===relation.to_state);const grid=$('#pair-matrix');grid.style.gridTemplateColumns=`38px repeat(${bb.length},23px)`;
 let html='<span class="axis">↓ / →</span>'+bb.map(s=>`<button class="axis" data-sequence="${s.id}" title="${s.id} ${s.label}">${s.id}</button>`).join('');
 for(const a of aa){html+=`<button class="axis" data-sequence="${a.id}">${a.id}</button>`;for(const b of bb){const p=pairs.get(a.id+'--'+b.id);html+=`<button class="cell ${p.rule_allowed?'compatible':p.status==='compatible'||p.status==='natural'?'rule-blocked':p.status}${p.rule_controller_edges?'':' no-control'}" data-cell="${p.id}" title="${p.from_id} → ${p.to_id}: ${statusText(p)}" aria-label="${p.from_id} to ${p.to_id}, ${statusText(p)}"></button>`;}}
 grid.innerHTML=html;
}
function selectPair(id){
 const p=pairs.get(id);if(!p)return;currentPair=p;previewPlaying=false;previewFrame=0;
 const ids=p.rule_edges,chosen=ids.find(id=>edges.get(id)?.controller_enabled)||ids[0];previewEdge=edges.get(chosen)||null;
 const a=seqs.get(p.from_id),b=seqs.get(p.to_id);
 previewFrames=p.rule_allowed?previewTimeline(bank,a,b,previewEdge):[];
 $('#pair-title').textContent=p.from_id+' → '+p.to_id;$('#pair-kind').textContent=statusText(p);
 $('#preview-modes [data-mode="mls"]').disabled=false;$('#preview-modes [data-mode="natural"]').disabled=!p.natural;
 $('#pair-exit-select').innerHTML=ids.length&&p.from_id!==p.to_id?`<label>Exits that pass phase rules <select id="exit-selector">${ids.map(id=>{const e=edges.get(id);return `<option value="${id}" ${id===chosen?'selected':''}>${e.exit_index+1}/${a.frames} frames · ${e.controller_enabled?'controllable':'research preview'}</option>`;}).join('')}</select></label>`:'';
 if($('#exit-selector'))$('#exit-selector').onchange=()=>{previewEdge=edges.get($('#exit-selector').value);previewFrames=previewTimeline(bank,a,b,previewEdge);previewFrame=0;previewPlaying=false;renderPreview();updatePairNotes();};
 $('#matrix-inspector').innerHTML=`<h4>${p.from_id} → ${p.to_id}</h4><p><b>${p.rule_reason}</b></p>${previewEdge?.admission==='phase-review-v1'?`<p>New phase transition: pose ${fmt(previewEdge.phase_metrics.pose,3)} / 0.60; legs ${fmt(previewEdge.phase_metrics.legs,3)} / 0.75; velocity ${fmt(previewEdge.phase_metrics.velocity,3)} / 0.25 (torso lengths / frame). The old judgement follows for comparison.</p>`:''}${metricHTML(p)}<p>Original pair: ${p.reasons.join('; ')}. Original values kept; phase rules further limit the playable exits.</p><p>${p.rule_controller_edges?'Usable for current control.':'Not on the current control path.'}</p><button data-sequence="${a.id}">View ${a.id} source</button> · <button data-sequence="${b.id}">View ${b.id} source</button>`;
 $('#pair-matrix').querySelectorAll('.cell').forEach(c=>c.classList.toggle('active',c.dataset.cell===id));$('#pair-list').querySelectorAll('.pair-card').forEach(c=>c.classList.toggle('active',c.dataset.pair===id));
 relGraph.update({selected:p.relation,focus:p.from_state,connectionPair:p.rule_allowed?id:null,pair:p.rule_allowed?id:null,actualSequence:a.id,targetSequence:b.id});
 setPreviewMode('mls');updatePairNotes();
}
function phaseText(s,edge=null){const p=s.rule_phase;if(p.kind==='one-shot')return `${s.id}: full stroke 0–${s.frames-1}`;if(!p.available)return `${s.id}: ${p.basis}`;return `${s.id}: entry ${p.entry?.join('–')||'already moving'} → core ${p.core.join('–')}${p.kind==='hold'?' (hold)':' (repeat)'} → ${edge?'this exit '+edge.exit_index+' → '+edge.to_id:'a legal exit is chosen on leaving'} (original tail ${p.exit?.join('–')||'none'} does not repeat)`;}
function updatePairNotes(){if(!currentPair)return;const p=currentPair,a=seqs.get(p.from_id),b=seqs.get(p.to_id);$('#pair-notes').innerHTML=`<p><b>${a.id}</b> source ${a.source_id} ${fmt(a.start)}–${fmt(a.end)}s → <b>${b.id}</b> source ${b.source_id} ${fmt(b.start)}–${fmt(b.end)}s</p><div class="phase-strip">${phaseText(a,a.id!==b.id?previewEdge:null)}${a.id!==b.id?'<br>'+phaseText(b):''}</div><p>${p.rule_allowed?'The preview stays on one clip, repeats its core, then leaves by a legal exit. Same phase boundaries and self-loop seams as 03.':p.rule_reason}</p><p class="warn">Split into playback windows inside existing assets; short stationary clips hold a stable frame. Compare with the source at any time; mattes and seams may still ghost.</p>`;}
function previewTotal(){return previewFrames.length;}
function previewSample(){const s=previewFrames[previewFrame];return s?{...s,label:s.type==='seam'?`${s.record.from_id} → ${s.record.to_id}`:s.record.id}:null;}
function renderPreview(){
 if(previewMode!=='mls'||!previewFrames.length)return false;const canvas=$('#pair-canvas'),ctx=canvas.getContext('2d'),s=previewSample();const assetInfo=asset(s.record,s.index,s.type);if(!getImage(assetInfo?.url))return false;
 background(ctx,512,320);drawSample(ctx,s.record,s.index,s.type,128,0,1,$('#pair-view').value);
 $('#pair-position').textContent=`${s.label} · ${phaseNames[s.phase]} · ${previewFrame+1}/${previewTotal()} frames · ${fmt(previewFrame/bank.config.fps)}s`;
 $('#pair-scrub').max=previewTotal()-1;$('#pair-scrub').value=previewFrame;
 const sid=s.type==='seam'?s.record.from_id:s.record.id,tid=s.type==='seam'?s.record.to_id:null;
 relGraph.update({connectionPair:currentPair.rule_allowed&&currentPair.from_id!==currentPair.to_id?currentPair.id:null,connectionStatus:'This preview',selected:currentPair.relation,focus:seqs.get(sid).action,actualSequence:sid,targetSequence:tid,hot:s.type==='seam',pair:s.type==='seam'?sid+'--'+tid:null,self:s.phase==='core'});return true;
}
function setPreviewMode(mode){
 previewMode=mode;previewPlaying=false;setButtons($('#preview-modes'),'mode',mode);$('#raw-a').pause();$('#raw-b').pause();$('#natural-video').pause();
 $('#pair-canvas').hidden=mode!=='mls'||!previewFrames.length;$('#raw-pair').hidden=mode!=='raw';$('#natural-video').hidden=mode!=='natural';$('#pair-empty').hidden=mode!=='mls'||!!previewFrames.length;
 if(!previewFrames.length){$('#pair-empty').textContent=currentPair.rule_reason;$('#pair-position').textContent='No preview passes the current rules; see the source reference.';}
 const a=seqs.get(currentPair.from_id),b=seqs.get(currentPair.to_id);
 if(mode==='mls'){renderPreview();$('#pair-play').textContent='▶ Play';}
 if(mode==='raw'){$('#raw-a').preload='auto';$('#raw-b').preload='auto';$('#raw-a').src=a.video;$('#raw-b').src=b.video;$('#raw-a').load();$('#raw-b').load();$('#raw-a-label').textContent=a.id+' / '+a.label;$('#raw-b-label').textContent=b.id+' / '+b.label;$('#pair-position').textContent='Full source reference; this is not a rule preview.';}
 if(mode==='natural'){const v=$('#natural-video');v.src='../source/'+a.source_id+'.mp4';v.addEventListener('loadedmetadata',()=>{v.currentTime=a.start;},{once:true});$('#pair-position').textContent=`Source ${a.source_id} is naturally continuous; reference only.`;}
 $('#pair-play').disabled=mode!=='mls'||!previewFrames.length;$('#pair-seam').disabled=mode!=='mls'||!previewFrames.length;$('#pair-scrub').disabled=mode!=='mls'||!previewFrames.length;
}

function controllerSetup(){
 player=new MultiPlayer(bank);const root=$('#control-root'),canvas=$('#control-canvas');
 const focus=()=>{canvas.focus();$('#source-video').pause();previewPlaying=false;};
 canvas.onclick=()=>{focus();player.resume();};
 $('#control-play').onclick=()=>{focus();player.paused?player.resume():player.pause();};$('#control-reset').onclick=()=>{player.reset();focus();};
 root.addEventListener('keydown',e=>{if(directions[e.code]||shots[e.code]||['Space','KeyR'].includes(e.code)){e.preventDefault();player.down(e.code,e.repeat);}});
 root.addEventListener('keyup',e=>{if(directions[e.code]||shots[e.code]){e.preventDefault();player.up(e.code);}});
 root.addEventListener('focusout',e=>{if(!root.contains(e.relatedTarget))player.pause('Player lost focus: input cleared, paused');});
 for(const [code,label] of [['ArrowLeft','←'],['ArrowRight','→'],['ArrowUp','↑'],['ArrowDown','↓'],['KeyJ','J forehand'],['KeyK','K backhand'],['KeyS','S serve']]){const b=document.createElement('button');b.textContent=label;b.dataset.code=code;b.onpointerdown=e=>{e.preventDefault();focus();b.setPointerCapture(e.pointerId);player.down(code);};b.onpointerup=()=>player.up(code);b.onpointercancel=()=>player.up(code);$('#keypad').append(b);}
 window.addEventListener('blur',()=>player.pause('Window lost focus: input cleared, paused'));document.addEventListener('visibilitychange',()=>{if(document.hidden)player.pause('Page hidden: input cleared, paused');});
 $('#export-log').onclick=()=>{const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify({history:player.history,uses:Object.fromEntries(player.uses)},null,2)],{type:'application/json'}));a.href=url;a.download='motion-atlas-control-log.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 $('#control-coverage').innerHTML='<table><tr><th>State</th><th>All sequences</th><th>Reachable with a return path</th></tr>'+bank.model.states.map(s=>`<tr><td>${s.name}</td><td>${bank.sequences.filter(x=>x.action===s.id).length}</td><td>${bank.sequences.filter(x=>x.action===s.id&&x.controller_reachable).length}</td></tr>`).join('')+'</table>';
}
let lastHistory=-1,controlConnection=null,controlHistory=null;
function drawControl(){
 if(!player)return false;const sample=player.sample(),canvas=$('#control-canvas'),ctx=canvas.getContext('2d'),a=asset(sample.record,sample.index,sample.type);
 const ready=!!getImage(a?.url);
 if(ready){background(ctx,512,400);ctx.strokeStyle='#d3dccb';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(45,350);ctx.lineTo(467,350);ctx.stroke();drawSample(ctx,sample.record,sample.index,sample.type,128,35,1,$('#control-view').value);}
 if(player.plan){getImage(player.plan.edge.atlas);getImage(asset(seqs.get(player.plan.edge.to_id),0,'sequence')?.url);}
 if(player.active)getImage(asset(seqs.get(player.active.edge.to_id),0,'sequence')?.url);
 $('#control-stage-status').textContent=player.paused?'PAUSED':ready?'PLAYING':'LOADING ASSET';
 $('#control-label').textContent=player.active?names[player.active.edge.from_state]+' → '+names[player.active.edge.to_state]:names[player.state];
 $('#control-sequence').textContent=player.active?`${player.active.edge.from_id} → ${player.active.edge.to_id}`:`${player.clip.id} / ${player.frame+1}–${player.clip.frames}`;
 if(controlHistory!==player.history){controlHistory=player.history;controlConnection=null;}
 const crossing=player.active?.edge.rule_kind!=='self'?player.active?.edge:null;
 if(crossing)controlConnection=crossing;
 const connection=player.plan?.edge||crossing||controlConnection;
 ctrlGraph.update({connectionPair:connection?connection.from_id+'--'+connection.to_id:null,candidateScope:'control',connectionStatus:player.plan?'Chosen, waiting for exit':crossing?'Transitioning':'Last used',actual:player.state,focus:player.state,actualSequence:player.clip.id,targetSequence:player.active?.edge.to_id,hot:!!player.active,self:player.phase==='core'});
 $('#control-note').textContent=`Request: ${names[player.desired()]} · ${player.active?'seam cannot be interrupted':isHit(player.state)?'full stroke playing':phaseNames[player.phase]}\n${player.note}${player.lastSelection?'\nCandidates: '+player.lastSelection.candidates.join(', ')+'; chosen '+player.lastSelection.selected:''}${player.plan?'\nPlan: '+player.plan.edge.from_id+' → '+player.plan.edge.to_id+', exit at frame '+(player.plan.edge.exit_index+1):''}`;
 $('#visited-count').textContent=player.visited.size;$('#edge-count').textContent=player.usedEdges.size;$('#state-count').textContent=new Set([...player.visited].map(id=>seqs.get(id).action)).size;
 $('#keypad').querySelectorAll('button').forEach(b=>b.classList.toggle('pressed',player.held.has(b.dataset.code)));
 if(lastHistory!==player.history.length){const entries=player.history.filter(e=>e.type==='entered').slice(-22);$('#play-trace').innerHTML=entries.map(e=>`<button class="trace-token" data-sequence="${e.clip}">${e.clip}<small>${names[seqs.get(e.clip).action]} · ${fmt(e.time,1)}s</small></button>`).join('')||'<span class="muted small">Once you play, every action sequence actually entered is listed here.</span>';lastHistory=player.history.length;}
 return ready;
}
let last=performance.now(),controlAcc=0;
function animate(now){const dt=Math.min(.1,(now-last)/1000);last=now;
 if(bank){const ready=renderPreview();if(previewPlaying&&previewMode==='mls'&&ready){previewAcc+=dt*Number($('#pair-speed').value);while(previewAcc>=1/bank.config.fps){previewAcc-=1/bank.config.fps;if(previewFrame<previewTotal()-1)previewFrame++;else {previewPlaying=false;$('#pair-play').textContent='↺ Replay';break;}}}
  const cReady=drawControl();if(player&&!player.paused&&cReady){controlAcc+=dt;let limit=0;while(controlAcc>=1/bank.config.fps&&limit++<3){player.tick();controlAcc-=1/bank.config.fps;const s=player.sample(),a=asset(s.record,s.index,s.type);if(!getImage(a?.url))break;}}else controlAcc=0;
 }requestAnimationFrame(animate);
}

document.addEventListener('click',e=>{
 const source=e.target.closest('[data-sequence]');if(source){openSequence(source.dataset.sequence);return;}
 const pair=e.target.closest('[data-pair]');if(pair){selectPair(pair.dataset.pair);return;}
 const cell=e.target.closest('[data-cell]');if(cell){selectPair(cell.dataset.cell);return;}
 const activation=e.target.closest('[data-activation]');if(activation){const a=sourceActs.find(a=>a.activation_id===activation.dataset.activation);$('#source-video').currentTime=a.start+.001;observe();}
});
$('#expand-all').onclick=()=>document.querySelectorAll('.state-folder').forEach(d=>d.open=true);$('#collapse-all').onclick=()=>document.querySelectorAll('.state-folder').forEach(d=>d.open=false);
$('#source-select').onchange=()=>setSource($('#source-select').value);$('#activation-select').onchange=()=>{$('#source-video').currentTime=sourceActs.find(a=>a.activation_id===$('#activation-select').value).start+.001;observe();};
$('#source-video').addEventListener('timeupdate',observe);$('#source-video').addEventListener('seeked',observe);$('#source-video').addEventListener('pause',observe);
$('#frame-prev').onclick=()=>{$('#source-video').pause();$('#source-video').currentTime=Math.max(0,$('#source-video').currentTime-1/bank.config.fps);};$('#frame-next').onclick=()=>{$('#source-video').pause();$('#source-video').currentTime=Math.min($('#source-video').duration,$('#source-video').currentTime+1/bank.config.fps);};
$('#relation-select').onchange=()=>setRelation($('#relation-select').value);$('#relation-focus').onchange=()=>relGraph.update({selected:relation.id,connectionPair:currentPair?.rule_allowed?currentPair.id:null,focus:$('#relation-focus').value||null});
$('#pair-random').onclick=()=>{let choices=byRelation.get(relation.id).filter(p=>p.rule_allowed);if(choices.length>1)choices=choices.filter(p=>p.id!==currentPair?.id);if(choices.length){selectPair(choices[Math.floor(Math.random()*choices.length)].id);previewPlaying=true;$('#pair-play').textContent='Ⅱ Pause';}};
$('#pair-filter').onchange=renderPairList;$('#preview-modes').onclick=e=>{const b=e.target.closest('button');if(b&&!b.disabled)setPreviewMode(b.dataset.mode);};
$('#pair-play').onclick=()=>{if(previewFrame>=previewTotal()-1)previewFrame=0;previewPlaying=!previewPlaying;$('#pair-play').textContent=previewPlaying?'Ⅱ Pause':'▶ Play';};$('#pair-seam').onclick=()=>{if(previewFrames.length){const cross=previewFrames.findIndex(s=>s.phase==='transition');previewFrame=Math.max(0,cross>=0?cross:previewFrames.findIndex(s=>s.type==='seam'));previewPlaying=false;renderPreview();}};
$('#pair-scrub').oninput=()=>{previewFrame=Number($('#pair-scrub').value);previewPlaying=false;renderPreview();};
$('#natural-video').ontimeupdate=()=>{if(currentPair?.natural&&$('#natural-video').currentTime>=currentPair.natural_end)$('#natural-video').pause();};
$('#dialog-close').onclick=()=>{$('#sequence-video').pause();$('#sequence-dialog').close();};$('#sequence-dialog').addEventListener('close',()=>$('#sequence-video').pause());
$('#sequence-modes').onclick=e=>{const b=e.target.closest('button');if(!b)return;setButtons($('#sequence-modes'),'field',b.dataset.field);const v=$('#sequence-video');v.src=currentSequence[b.dataset.field];v.play().catch(()=>{});};

async function init(){try{
 const response=await fetch('manifest.json');if(!response.ok)throw Error('manifest '+response.status);bank=await response.json();seqs=new Map(bank.sequences.map(s=>[s.id,s]));edges=new Map([...bank.edges,...bank.loop_edges].map(e=>[e.id,e]));pairs=new Map(bank.pairs.map(p=>[p.id,p]));byRelation=new Map(bank.relations.map(r=>[r.id,bank.pairs.filter(p=>p.relation===r.id)]));
 obsGraph=makeGraph($('#observation-graph'),id=>{setRelation(id);$('#connections').scrollIntoView({behavior:'smooth'});},state=>{const d=$('#folder-'+state);d.open=true;d.scrollIntoView({behavior:'smooth',block:'start'});});
 relGraph=makeGraph($('#transition-graph'),setRelation,state=>{$('#relation-focus').value=state;relGraph.update({selected:relation.id,focus:state});});ctrlGraph=makeGraph($('#control-graph'),setRelation,null);
 $('#source-select').innerHTML=bank.sources.map(s=>`<option value="${s.source_id}">${s.source_id} / ${fmt(s.frame_count/s.fps)}s</option>`).join('');
 $('#relation-select').innerHTML=bank.relations.map(r=>`<option value="${r.id}">${names[r.from_state]} → ${names[r.to_state]} · ${r.rule_pairs} pairs pass rules</option>`).join('');
 $('#relation-focus').innerHTML='<option value="">All relations</option>'+bank.model.states.map(s=>`<option value="${s.id}">exits of ${s.name}</option>`).join('');
 $('#method-text').textContent=`v1 tolerances: pose ≤ ${fmt(bank.config.thresholds.pose,3)} torso lengths, joint velocity diff ≤ ${fmt(bank.config.thresholds.velocity,3)}, root velocity diff ≤ ${fmt(bank.config.thresholds.root_velocity,3)} torso lengths / s. Calibrated on 6 natural transitions; 2 of 3 held-out ones pass. Old pair values are unchanged; new phase transitions are also checked at pose ≤ 0.60 and legs ≤ 0.75 torso lengths and boundary velocity diff ≤ 0.25 torso lengths / frame; current control also checks pixel ghosting.`;
 library();setSource('01');setRelation('left--backhand');controllerSetup();
 window.motionAtlas={bank,seqs,edges,pairs,setRelation,selectPair,openSequence,MultiPlayer,player,previewTimeline,get previewFrames(){return previewFrames;},get previewFrame(){return previewFrame;},get previewEdge(){return previewEdge;},get previewTotal(){return previewTotal();},get previewMode(){return previewMode;},getImage,ready:true};
 requestAnimationFrame(animate);
}catch(error){console.error(error);showError('Page failed to initialise: '+error.message);}}
init();
