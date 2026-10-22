(function(){
 'use strict';
 const $=s=>document.querySelector(s),frames={A:$('#gameA'),B:$('#gameB')};
 const names={stationary:'Stationary',left:'Left',right:'Right',forward:'Forward',back:'Back',forehand:'Forehand',backhand:'Backhand',serve:'Serve'};
 const actionFor={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',KeyJ:'forehand',KeyK:'backhand',KeyS:'serve',KeyN:'feed'};
 const labels={ArrowLeft:'←',ArrowRight:'→',ArrowUp:'↑',ArrowDown:'↓',KeyJ:'J',KeyK:'K',KeyS:'S',KeyN:'N'};
 const held=new Map(),states={},ready=new Set(),events=[],taps=[];let paused=true,last=0,acc=0,replay=null,sequence=0,comparison='simple';
 const send=(mode,data)=>frames[mode].contentWindow.postMessage({channel:'tennis-simple-v3',...data},location.origin);
 const both=data=>Object.keys(frames).forEach(k=>send(k,data));
 function usable(){return ready.size===2;}
 function controls(){for(const id of ['pause','start','reset','replay'])$('#'+id).disabled=!usable();$('#pause').textContent=paused?'Start / resume':'Pause (Space)';$('#start').textContent='Start playing';$('#start-overlay').hidden=!paused||(states.B?.time||0)>0;}
 function cancel(){held.clear();taps.length=0;both({type:'cancel'});inputUI();}
 function pause(reason='Paused'){paused=true;acc=0;replay=null;cancel();$('#guidance').textContent=reason;controls();}
 function resume(){if(!usable())return;$('#reference').pause();$('#recorded').pause();paused=false;controls();}
 function reset(){paused=true;replay=null;acc=0;cancel();events.length=0;both({type:'reset',seed:0});$('#events').replaceChildren();controls();$('#guidance').textContent='Reset. After Start, both versions receive the same input.';}
 function down(code,repeat=false){
  if(repeat||!usable())return;
  if(code==='Space'||code==='KeyP'){paused?resume():pause();return;}
  if(code==='KeyR'){reset();return;}if(code==='KeyV'){startReplay();return;}
  if(!actionFor[code]||held.has(code))return;
  if(replay){replay=null;held.clear();}
  held.set(code,++sequence);if(!code.startsWith('Arrow'))taps.push({id:actionFor[code]});resume();inputUI();
 }
 function up(code){held.delete(code);inputUI();}
 function inputUI(){const text=[...held.keys()].map(k=>labels[k]).filter(Boolean).join(' ');$('#inputs').textContent=text||'no keys';document.querySelectorAll('[data-code]').forEach(b=>b.classList.toggle('down',held.has(b.dataset.code)));}
 const codes=new Set([...Object.keys(actionFor),'Space','KeyP','KeyR','KeyV']);
 addEventListener('keydown',e=>{if(!codes.has(e.code)||['INPUT','SELECT','TEXTAREA','VIDEO'].includes(e.target.tagName))return;e.preventDefault();down(e.code,e.repeat);});
 addEventListener('keyup',e=>{if(codes.has(e.code)){e.preventDefault();up(e.code);}});
 addEventListener('blur',()=>{if(document.activeElement?.tagName!=='IFRAME')pause('Window lost focus: inputs cleared, game paused.');});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause('Page hidden: game paused.');});
 for(const b of document.querySelectorAll('[data-code]')){b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);down(b.dataset.code);});for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,()=>up(b.dataset.code));}
 $('#start').onclick=resume;$('#pause').onclick=()=>paused?resume():pause();$('#reset').onclick=reset;$('#feed').onclick=()=>{down('KeyN');up('KeyN');};$('#replay').onclick=startReplay;
 function chooseView(id){for(const name of ['solo','compare','motion-compare'])$('#'+name).classList.toggle('selected',name===id);$('#games').classList.toggle('solo',id==='solo');}
 function compareWith(kind){chooseView(kind==='motion'?'motion-compare':'compare');if(kind===comparison)return;
  pause('Comparison switched: both sides reset; after Start they receive the same input.');comparison=kind;ready.delete('A');delete states.A;events.length=0;send('B',{type:'reset',seed:0});
  $('#left-label').textContent=kind==='motion'?'Before · v3 near player':'This video · Simple baseline';$('#left-method').textContent=kind==='motion'?'Constant shift / stops on continuation':'Direct action entry / in-clip sampling';$('#stateA').textContent='Preparing comparison…';
  frames.A.title=kind==='motion'?'A v3 movement before the change':'A this video, Simple baseline';$('#events').replaceChildren();frames.A.src=kind==='motion'?'integrated/previous.html':'baseline/play.html';controls();
 }
 $('#solo').onclick=()=>chooseView('solo');$('#compare').onclick=()=>compareWith('simple');$('#motion-compare').onclick=()=>compareWith('motion');
 $('#reference').addEventListener('play',()=>{if(!$('#reference').paused)pause('Watching the source video; game paused.');});
 $('#recorded').addEventListener('play',()=>{if(!$('#recorded').paused){$('#reference').pause();pause('Watching the fixed-input replay; game paused.');}});
 for(const b of document.querySelectorAll('[data-time]'))b.onclick=()=>{pause('Seeking the source video');$('#reference').currentTime=+b.dataset.time;$('#reference').play().catch(()=>{});};
 function startReplay(){if(!usable())return;reset();replay={t:0,fired:new Set(),schedule:frames.A.contentWindow.World.replay.actions};resume();}
 function scheduleAt(t){const a=[];replay.schedule.forEach((r,i)=>{if(r.until!==undefined){if(t>=r.t&&t<r.until)a.push({id:r.id});}else if(!replay.fired.has(i)&&t>=r.t){replay.fired.add(i);a.push({id:r.id});}});return a;}
 function record(mode,list){if(mode!=='B')return;for(const e of list){events.push(e);if(events.length>1000)events.shift();}if(list.length)drawEvents();}
 function eventText(e){switch(e.type){case 'request':return `Accepted ${names[e.kind]} request → waiting for offline exit`;case 'reject':return `Rejected ${names[e.kind]}: ${e.reason}`;case 'transition':return `${names[e.from]} → ${names[e.to]} · stored seam · exit #${e.fromFrame}`;case 'transition_end':return `Seam done → target #${e.resumeFrame}`;case 'action_frame':return `Action event frame #${e.frame} · source ${e.sourceTime.toFixed(2)}s`;case 'swing_event':return `${names[e.kind]} reached its swing event → hit-range check on`;case 'hit':return e.by==='near'?`Near hit · ${names[e.kind]||'swing'}${e.distance!==undefined?' · distance '+e.distance+'px':''}`:'Far player: simplified return';case 'miss':return `Miss: ${e.reason}`;case 'point':return `${e.winner==='near'?'Near':'Far'} scores · ${e.reason}`;case 'feed':return `New point · ball target x=${Math.round(e.target)}`;case 'boundary':return e.reason;case 'game_reject':return e.reason;default:return e.type;}}
 function drawEvents(){const el=$('#events');const meaningful=events.filter(e=>{if(e.type==='transition'&&e.from===e.to)return false;if(e.type==='transition_end'){const m=e.edge.match(/^curated-(.+)--(.+)-x\d+$/);if(m&&m[1]===m[2])return false;}return true;});el.replaceChildren(...meaningful.slice(-8).reverse().map(e=>{const li=document.createElement('li');if(['reject','miss','game_reject'].includes(e.type))li.className='reject';const time=document.createElement('time');time.textContent=e.t.toFixed(2)+'s';li.append(time,document.createTextNode(eventText(e)));return li;}));}
 addEventListener('message',e=>{
  if(e.origin!==location.origin||e.data?.channel!=='tennis-simple-v3')return;
  const m=e.data;if(!frames[m.mode]||e.source!==frames[m.mode].contentWindow)return;
  if(m.type==='key'){m.down?down(m.code,m.repeat):up(m.code);return;}
  if(m.type==='release'){held.clear();inputUI();return;}
  if(m.type==='error'){$('#error').hidden=false;$('#error').textContent=m.mode+': '+m.message;pause('Runtime error; paused');return;}
  if(m.state){states[m.mode]=m.state;ready.add(m.mode);record(m.mode,m.state.events||[]);update(m.mode,m.state);if(m.mode==='B')$('#start-overlay').hidden=!paused||m.state.time>0;if(usable()&&$('#start').disabled){controls();$('#guidance').textContent='Ready. Press an arrow key or J / K to start.';}}
 });
 for(const mode of Object.keys(frames))frames[mode].addEventListener('load',()=>send(mode,{type:'snapshot'}));
 function update(mode,s){const i=s.info;$('#state'+mode).textContent=(mode==='B'?'v3 · ':comparison==='motion'?'Before · ':'Simple · ')+names[i.state]+(i.transition?` · transition ${i.transition.index+1}/${i.transition.count}`:'');$('#score'+mode).textContent=`Near ${s.score.near} : ${s.score.far} Far`;
  if(mode!=='B')return;drawGraph(i);drawPose(i);drawSource(i);
  if(!paused){$('#guidance').textContent=replay?'Label replay · not an exact re-enactment of the match':i.note;}
  if(s.ball.live&&s.ball.toward==='near'){
   const eta=Math.max(0,s.ball.T-s.ball.age);$('#ball-hint').textContent=`Ball arrives in ${eta.toFixed(1)}s · lateral offset ${Math.round(s.ball.to[0]-s.near.x)}px · request the swing about 0.8s early; a hit still depends on position.`;
  }else $('#ball-hint').textContent=s.ball.live?'The ball is heading to the far side. Move early for the next one.':`Point over · next ball in ${Math.max(0,s.wait).toFixed(1)}s, or press S while stationary to serve.`;
 }
 const coords={stationary:[300,80],left:[80,80],right:[520,80],forward:[190,80],back:[410,80],forehand:[160,235],backhand:[300,235],serve:[440,235]};
 const graph=$('#graph');graph.innerHTML='<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0 0L7 3L0 6Z" fill="#bd713b"/></marker></defs><text class="group" x="23" y="31">NON-HITTING</text><text class="group" x="23" y="188">HITTING</text><path id="edge" fill="none" stroke="#bd713b" stroke-width="2.5" marker-end="url(#arrow)"/>';
 for(const [id,[x,y]]of Object.entries(coords)){const g=document.createElementNS('http://www.w3.org/2000/svg','g');g.id='node-'+id;g.setAttribute('class','node');g.innerHTML=`<rect x="${x-41}" y="${y-21}" width="82" height="42" rx="8"/><text x="${x}" y="${y+5}" text-anchor="middle">${names[id]}</text>`;graph.append(g);}
 function drawGraph(i){for(const id of Object.keys(coords))$('#node-'+id).setAttribute('class','node'+(id===i.state?' active':'')+(i.transition?.from===id?' from':''));
  const e=i.transition,p=$('#edge');if(!e){p.setAttribute('d','');$('#graph-phase').textContent='State clip';$('#transition-detail').textContent='Requests wait for a stored exit; the game acts only once the skeleton has entered the target motion.';return;}
  const [x,y]=coords[e.from],[u,v]=coords[e.to];p.setAttribute('d',e.from===e.to?`M${x+30} ${y-21} C${x+85} ${y-80} ${x-85} ${y-80} ${x-30} ${y-23}`:y===v?`M${x} ${y+23} Q${(x+u)/2} ${y+100} ${u} ${v+23}`:`M${x} ${y+(v>y?23:-23)} L${u} ${v+(v>y?-23:23)}`);$('#graph-phase').textContent=`Offline transition ${e.index+1}/${e.count}`;$('#transition-detail').textContent=`${names[e.from]} → ${names[e.to]} · source #${e.fromFrame} → target #${e.toFrame} → resume #${e.resumeFrame}`;
 }
 function drawPose(i){if(!i.keys)return;const canvas=$('#pose'),c=canvas.getContext('2d'),k=i.keys;c.fillStyle='#eff2e7';c.fillRect(0,0,260,320);c.strokeStyle='#d5decc';c.lineWidth=1;c.beginPath();c.moveTo(130,10);c.lineTo(130,310);c.moveTo(15,181);c.lineTo(245,181);c.stroke();c.save();c.translate(34,28);c.strokeStyle=i.transition?'#bc7940':'#2b6951';c.lineWidth=3;c.lineCap='round';for(const [a,b]of [[5,6],[5,7],[7,9],[6,8],[8,10],[5,11],[6,12],[11,12],[11,13],[13,15],[12,14],[14,16]])if(Math.min(k[a][2],k[b][2])>=.45){c.beginPath();c.moveTo(k[a][0],k[a][1]);c.lineTo(k[b][0],k[b][1]);c.stroke();}if(k[0][2]>=.3){c.beginPath();c.ellipse(k[0][0],k[0][1],7,9,0,0,Math.PI*2);c.stroke();}c.restore();}
 function drawSource(i){const items=i.transition?[['Playing',i.transition.id],['Stored seam frame',`${i.transition.index+1} / ${i.transition.count}`],['Source / target',`${i.transition.sourceTime.toFixed(3)}s → ${i.transition.targetTime.toFixed(3)}s`],['Skeleton','Offline synthesized guide; not re-estimated']]:[['Source clip',i.originalClip||i.clip],['Frame',`#${i.frame} · ${i.sourceTime.toFixed(3)}s`],['Source interval',i.source.map(v=>v.toFixed(3)+'s').join(' – ')],['Skeleton','Detected from the source video']];if(i.locomotion)items.push(['Horizontal shift',Math.round(i.locomotion.velocityX)+' px/s · '+({source:'source trajectory',continuation:'same-direction continuation',start:'start',stop:'stop',reverse:'reverse',locked:'locked',other:'other state'}[i.locomotion.kind]||i.locomotion.kind)]);const dl=$('#source-info');dl.replaceChildren(...items.flatMap(([a,b])=>{const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=a;dd.textContent=b;return[dt,dd];}));$('#source-tag').textContent=i.transition?'Stored guide frame':'Stored source frame';const t=i.transition;$('#clip-link').href=t?`../control/curated/videos/transition-${t.from}--${t.to}.mp4`:`../control/curated/videos/state-${i.state}.mp4`;$('#clip-link').textContent=t?'Representative video of this connection ↗':'Pixel / skeleton video of this state ↗';}
 $('#download-log').onclick=()=>{const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify({source:'nad_fed_usopen.mp4',baseline:'simple local adaptation',near:'curated-offline-v3',runtimeMLS:false,events},null,2)],{type:'application/json'}));a.href=url;a.download='simple-v3-session.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 function loop(now){if(!last)last=now;const elapsed=Math.min((now-last)/1000,.08);last=now;
  if(!paused&&usable()){
   acc+=elapsed;let count=Math.min(4,Math.floor((acc+1e-9)*60));if(count){acc-=count/60;
    if(replay){for(let j=0;j<count;j++){const acts=scheduleAt(replay.t);both({type:'step',count:1,acts,holds:[]});replay.t+=1/60;if(replay.t>=18.8){pause('Label replay finished. Press an action key to continue.');break;}}}
    else{const holds=[...held.keys()].filter(k=>k.startsWith('Arrow')).map(k=>({id:actionFor[k]}));both({type:'step',count,acts:[...taps.splice(0),...holds],holds});}
   }
  }else acc=0;requestAnimationFrame(loop);
 }
 requestAnimationFrame(loop);
 window.lab={states,events,down,up,pause,resume,reset,startReplay,send,both,get paused(){return paused},get ready(){return usable()},get replay(){return replay}};
})();
