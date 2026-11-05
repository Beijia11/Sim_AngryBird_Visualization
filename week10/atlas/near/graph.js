const NS='http://www.w3.org/2000/svg';
// Deliberately fixed atlas regions: layout is visual grouping, not a motion-distance embedding.
const regions={
 stationary:{x:490,y:210,rx:163,ry:137,color:'#39a99a',label:[365,52]},
 forward:{x:150,y:164,rx:48,ry:43,color:'#c9a04e',label:[95,100]},
 back:{x:835,y:164,rx:78,ry:69,color:'#a586bf',label:[785,69]},
 left:{x:190,y:452,rx:128,ry:114,color:'#629fd3',label:[70,303]},
 right:{x:804,y:442,rx:139,ry:119,color:'#8da974',label:[803,288]},
 forehand:{x:170,y:710,rx:112,ry:89,color:'#d3a047',label:[63,592]},
 backhand:{x:510,y:703,rx:136,ry:96,color:'#d48c77',label:[400,577]},
 serve:{x:855,y:726,rx:82,ry:71,color:'#a8ad68',label:[820,623]},
};
export function makeSequenceGraph(root,bank,{onEdge,onNode,onPair,onSequence}={}){
 root.classList.add('atlas-graph');
 const marker='arrow-'+root.id;
 root.innerHTML=`<div class="atlas-shell"><div class="graph-tools"><span class="atlas-wordmark">TENNIS<small>${bank.model.states.length} STATES · ${bank.sequences.length} SEQUENCES</small></span><button type="button" data-labels aria-pressed="false">IDs</button><button type="button" data-zoom="1.25" aria-label="Zoom in">+</button><button type="button" data-zoom="0.8" aria-label="Zoom out">−</button><button type="button" data-zoom="reset">Reset</button><button type="button" data-expand aria-label="Expand graph">Expand ↗</button></div><div class="atlas-layout"><div class="graph-scroll" tabindex="0" aria-label="Zoomable, scrollable action graph"><svg class="atlas-overview" viewBox="0 0 1000 840" role="group" aria-label="Eight state clusters and every action-sequence dot"><defs><marker id="${marker}" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto-start-reverse"><path d="M0 0 L6 3 L0 6" fill="context-stroke"/></marker></defs><g class="halos"></g><g class="relations"></g><g class="active-relations"></g><g class="pair-lines"></g><g class="groups"></g><g class="small-nodes"></g></svg></div><details class="atlas-detail"><summary>Detail <span class="detail-count">choose a transition</span></summary><div class="detail-scroll"><svg class="detail-svg" role="group" aria-label="Legal candidates of the chosen source clip" viewBox="0 0 310 240"></svg></div><p class="detail-caption">Choose a transition to see its source clip and all legal candidates here.</p></details></div><div class="graph-key"><span><i class="key-dot"></i>colour = state · dot = sequence</span><span><i class="key-line"></i>state relation</span><span><i class="key-line candidate"></i>legal candidate</span><span><i class="key-line chosen"></i>actual transition</span><span>↻ current core self-loop</span></div><div class="graph-info"></div></div><dialog class="atlas-dialog" aria-label="Expanded action graph"></dialog>`;
 const shell=root.querySelector('.atlas-shell'),dialog=root.querySelector('dialog'),detail=root.querySelector('.atlas-detail');
 const svg=root.querySelector('.atlas-overview'),lineLayer=svg.querySelector('.pair-lines'),nodeLayer=svg.querySelector('.small-nodes');
 const nodes=new Map(),coords=new Map(),paths=[],groups=new Map(),sequences=new Map(bank.sequences.map(s=>[s.id,s])),outgoing=new Map();
 for(const p of bank.pairs){if(!outgoing.has(p.from_id))outgoing.set(p.from_id,[]);outgoing.get(p.from_id).push(p);}
 let nodeFocus=null,last='',current={},zoom=1,showLabels=false,detailWasOpen=false,visibleLabels=new Set();
 const el=(tag,attrs={},parent=svg)=>{const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);parent.append(e);return e;};
 const act=(e,fn,label)=>{e.setAttribute('tabindex','0');e.setAttribute('role','button');e.setAttribute('aria-label',label);e.onclick=fn;e.onkeydown=k=>{if(['Enter',' '].includes(k.key)){k.preventDefault();k.stopPropagation();fn();}};};
 const navigate=(fn,...args)=>{if(dialog.open&&root.id!=='transition-graph')dialog.close();fn?.(...args);};
 const haloLayer=svg.querySelector('.halos');
 for(const [si,s] of bank.model.states.entries()){
  const r=regions[s.id],gradient=el('radialGradient',{id:`halo-${root.id}-${s.id}`},svg.querySelector('defs'));
  el('stop',{offset:0,'stop-color':r.color,'stop-opacity':.16},gradient);el('stop',{offset:'.65','stop-color':r.color,'stop-opacity':.08},gradient);el('stop',{offset:1,'stop-color':r.color,'stop-opacity':0},gradient);
  el('ellipse',{cx:r.x,cy:r.y,rx:r.rx*1.2,ry:r.ry*1.22,fill:`url(#halo-${root.id}-${s.id})`},haloLayer);
  const g=el('g',{'class':'state-cluster','data-state':s.id,style:`--state-color:${r.color}`},svg.querySelector('.groups'));
  const title=el('text',{x:r.label[0],y:r.label[1],'class':'state-title'},g);title.textContent=s.name;act(title,()=>navigate(onNode,s.id),s.name+' all actions');
  const ss=bank.sequences.filter(q=>q.action===s.id);
  const count=el('text',{x:r.label[0]+2,y:r.label[1]+20,'class':'cluster-count'},g);count.textContent=ss.length+' SEQUENCE'+(ss.length===1?'':'S');groups.set(s.id,g);
  ss.forEach((q,i)=>{
   const theta=i*2.399963+si*.79,rr=ss.length===1?0:Math.sqrt((i+.55)/ss.length);
   const nx=r.x+Math.cos(theta)*rr*r.rx*.9*(1+.055*Math.sin(i*1.7)),ny=r.y+Math.sin(theta)*rr*r.ry*.9*(1+.07*Math.cos(i*2.3));
   coords.set(q.id,[nx,ny]);
   const n=el('g',{'class':'seq-node','data-node':q.id,transform:`translate(${nx.toFixed(2)},${ny.toFixed(2)})`,style:`--state-color:${r.color}`},nodeLayer);
   el('circle',{r:14,'class':'node-hit'},n);el('circle',{r:12,'class':'node-ring'},n);el('circle',{r:7.5,'class':'node-dot'},n);
   const label=el('text',{x:15,y:4,'class':'node-label'},n);label.textContent=q.id;
   const tip=el('title',{},n);tip.textContent=q.id+' / '+s.name+' / '+q.rule_phase.basis;
   act(n,()=>{nodeFocus=q.id;last='';update(current);onSequence?.(q.id);},q.id+' '+s.name);
   n.ondblclick=()=>{if(dialog.open)dialog.close();onPair?.(q.id+'--'+q.id,true);};nodes.set(q.id,n);
  });
 }
 // Choose a gentle static arc avoiding other clusters where possible. Opposite directions use distinct curves.
 const statePath=(from,to)=>{
  const a=regions[from],b=regions[to],dx=b.x-a.x,dy=b.y-a.y;
  const boundary=(r,c)=>{const x=c[0]-r.x,y=c[1]-r.y,k=1/Math.sqrt(x*x/(r.rx+12)**2+y*y/(r.ry+12)**2);return [r.x+x*k,r.y+y*k];};
  let best=null;
  for(const bend of [.16,.27,.4,.55,-.16,-.3,-.48]){
   const c=[(a.x+b.x)/2-dy*bend,(a.y+b.y)/2+dx*bend],p=boundary(a,c),q=boundary(b,c);let cost=Math.abs(bend)*8+(bend<0?1:0);
   for(let i=1;i<24;i++){const t=i/24,u=1-t,x=u*u*p[0]+2*u*t*c[0]+t*t*q[0],y=u*u*p[1]+2*u*t*c[1]+t*t*q[1];
    if(x<18||x>982||y<22||y>820)cost+=30;
    for(const [id,r] of Object.entries(regions))if(id!==from&&id!==to){const d=((x-r.x)/(r.rx+8))**2+((y-r.y)/(r.ry+8))**2;if(d<1)cost+=(1-d)*12;}
   }
   if(!best||cost<best.cost)best={cost,d:`M${p[0]} ${p[1]} Q${c[0]} ${c[1]} ${q[0]} ${q[1]}`};
  }return best.d;
 };
 for(const r of bank.model.relations){if(r.from===r.to)continue;const id=r.from+'--'+r.to,path=el('path',{d:statePath(r.from,r.to),'class':'possible-state','marker-end':`url(#${marker})`,'data-relation':id},svg.querySelector('.relations'));act(path,()=>navigate(onEdge,id),r.from+' → '+r.to);paths.push({r,id,path});}
 const pairPath=(a,b)=>{const [x,y]=coords.get(a),[u,v]=coords.get(b);if(a===b)return `M${x-8} ${y-8} C${x-38} ${y-40} ${x+35} ${y-42} ${x+9} ${y-9}`;const dx=u-x,dy=v-y,l=Math.hypot(dx,dy);return `M${x+dx/l*12} ${y+dy/l*12} Q${(x+u)/2-dy*.13} ${(y+v)/2+dx*.13-10} ${u-dx/l*13} ${v-dy/l*13}`;};
 // Greedy label placement never moves the data nodes; selected/candidate labels have priority.
 function placeLabels(){
  const ids=[...new Set([...visibleLabels,...(showLabels||zoom>=1.5?nodes.keys():[])])];
  const reserved=Object.values(regions).map(r=>[r.label[0]-3,r.label[1]-28,r.label[0]+83,r.label[1]+23]);
  const overlap=(a,b)=>Math.max(0,Math.min(a[2],b[2])-Math.max(a[0],b[0]))*Math.max(0,Math.min(a[3],b[3])-Math.max(a[1],b[1]));
  for(const [id,n] of nodes)n.classList.toggle('show-label',ids.includes(id));
  for(const id of ids){const n=nodes.get(id);if(!n)continue;const [x,y]=coords.get(id);let best=null;
   for(const [dx,dy,anchor] of [[15,4,'start'],[-15,4,'end'],[0,-17,'middle'],[0,25,'middle'],[15,-12,'start'],[-15,-12,'end'],[15,22,'start'],[-15,22,'end']]){
    const w=28,l=x+dx-(anchor==='end'?w:anchor==='middle'?w/2:0),box=[l-2,y+dy-12,l+w+2,y+dy+3];
    let score=reserved.reduce((sum,b)=>sum+overlap(box,b),0);
    for(const [nid,[u,v]] of coords)if(nid!==id)score+=overlap(box,[u-10,v-10,u+10,v+10])*2;
    if(!best||score<best.score)best={dx,dy,anchor,box,score};
   }
   reserved.push(best.box);const t=n.querySelector('.node-label');t.setAttribute('x',best.dx);t.setAttribute('y',best.dy);t.setAttribute('text-anchor',best.anchor);
  }
 }
 function drawDetail(source,destination,candidates,selfId,status){
  const ds=root.querySelector('.detail-svg');ds.replaceChildren();
  root.querySelector('.detail-count').textContent=source?source+' · '+candidates.length+' candidates':'choose a transition';
  if(!source){root.querySelector('.detail-caption').textContent='Choose a transition to see its source clip and all legal candidates.';return;}
  const ids=[...new Set(candidates.map(p=>p.to_id))];if(destination&&!ids.includes(destination))ids.push(destination);
  const h=Math.max(210,ids.length*35+58),sy=Math.min(h/2,200);ds.setAttribute('viewBox',`0 0 310 ${h}`);ds.style.height=h+'px';
  const circle=(id,x,y,chosen)=>{const n=el('g',{'class':'detail-node'+(chosen?' chosen':''),'data-detail-node':id,style:`--state-color:${regions[sequences.get(id).action].color}`},ds);el('circle',{cx:x,cy:y,r:chosen?12:9,'class':'detail-ring'},n);el('circle',{cx:x,cy:y,r:8,'class':'node-dot'},n);const t=el('text',{x:x+20,y:y+5},n);t.textContent=id;return n;};
  if(ids.length===1&&ids[0]===source){
   ds.setAttribute('viewBox','0 0 310 210');ds.style.height='210px';circle(source,142,112,true);
   const path=el('path',{d:'M134 102 C95 46 197 43 153 102','class':'actual-pair','marker-end':`url(#${marker})`,'data-detail-pair':source+'--'+source},ds);act(path,()=>navigate(onPair,source+'--'+source),source+' core self-loop');
   root.querySelector('.detail-caption').textContent=source+' → '+source+' · only the core of the same clip repeats; entry and exit are not looped';return;
  }
  ids.forEach((id,i)=>{const y=32+i*35,x=225+12*Math.sin(i*.65),chosen=id===destination,isCandidate=candidates.some(p=>p.to_id===id);
   const line=el('path',{d:`M54 ${sy} Q125 ${y} ${x-14} ${y}`,'class':chosen?'actual-pair':'possible-pair','marker-end':`url(#${marker})`,'data-detail-pair':source+'--'+id},ds);
   if(!isCandidate&&!chosen)line.remove();act(line,()=>navigate(onPair,source+'--'+id),source+' → '+id);
   const n=circle(id,x,y,chosen);act(n,()=>navigate(onPair,source+'--'+id),source+' → '+id);
   if(id===selfId)el('path',{d:`M${x+4} ${y-10} C${x+30} ${y-35} ${x+47} ${y+12} ${x+12} ${y+7}`,'class':'actual-pair','marker-end':`url(#${marker})`},ds);
  });
  const sourceNode=circle(source,42,sy,true);sourceNode.classList.add('source');const sourceLabel=sourceNode.querySelector('text');sourceLabel.setAttribute('x','42');sourceLabel.setAttribute('y',sy-19);sourceLabel.setAttribute('text-anchor','middle');root.querySelector('.detail-caption').textContent=destination?`${status}: ${source} → ${destination} · dashed = legal candidate, solid = this transition`:`${source} · a held input repeats only the current clip core`;
 }
 function update(v={}){
  current=v;const signature=JSON.stringify([v,nodeFocus]);if(signature===last)return;last=signature;
  const {actual,focus,selected,actualSequence,targetSequence,pair,connectionPair,hot,self,candidateScope='preview',connectionStatus='Selected'}=v;
  const activePair=pair||(hot&&actualSequence&&targetSequence?actualSequence+'--'+targetSequence:null)||(self&&actualSequence?actualSequence+'--'+actualSequence:null);
  const connection=connectionPair||(activePair&&activePair.split('--')[0]!==activePair.split('--')[1]?activePair:null);
  const [source,destination]=connection?.split('--')||[];
  const relation=source&&destination?sequences.get(source).action+'--'+sequences.get(destination).action:selected;
  const targetState=destination?sequences.get(destination).action:relation?.split('--')[1],focusId=source||nodeFocus||actualSequence;
  const candidates=(outgoing.get(focusId)||[]).filter(p=>p.to_state===(targetState||sequences.get(focusId)?.action)&&(candidateScope==='control'?p.rule_controller_edges>0||p.from_id===p.to_id&&p.rule_allowed:p.rule_allowed));
  const targets=new Set(candidates.map(p=>p.to_id));
  for(const [id,g] of groups)g.setAttribute('class','state-cluster'+(id===actual?' actual':'')+(id===focus?' focused':''));
  const activeLayer=svg.querySelector('.active-relations');activeLayer.replaceChildren();
  for(const {id,path} of paths){path.setAttribute('class','possible-state'+(id===relation?' selected':''));if(id===relation)el('path',{d:path.getAttribute('d'),'class':'active-state','marker-end':`url(#${marker})`,'data-active-relation':id},activeLayer);}
  for(const [id,n] of nodes)n.setAttribute('class','seq-node'+(targets.has(id)?' candidate':'')+(id===actualSequence?' actual':'')+(id===(destination||targetSequence)?' target':'')+(id===focusId?' focused':''));
  lineLayer.replaceChildren();
  for(const p of candidates){const path=el('path',{d:pairPath(p.from_id,p.to_id),'class':'possible-pair','marker-end':`url(#${marker})`,'data-pair-edge':p.id},lineLayer);act(path,()=>navigate(onPair,p.id),p.id+' legal candidate');}
  for(const id of new Set([connection,activePair].filter(Boolean))){const [a,b]=id.split('--');if(coords.has(a)&&coords.has(b)){const path=el('path',{d:pairPath(a,b),'class':'actual-pair'+(id===activePair&&(hot||self)?' playing':''),'marker-end':`url(#${marker})`,'data-active-pair':id},lineLayer);act(path,()=>navigate(onPair,id),id+' current transition');}}
  visibleLabels=new Set([focusId,destination,actualSequence,targetSequence,...targets].filter(Boolean));placeLabels();
  root.querySelector('.graph-info').textContent=connection?`${connectionStatus}: ${source} → ${destination} · legal candidates of ${source} in ${bank.model.states.find(s=>s.id===targetState)?.name||targetState}: ${[...targets].join(', ')||'none (transition observed in source)'}${self?' · current core self-loop: '+actualSequence:''}`:focusId?`${focusId} · ${candidates.length} legal candidates; a held input loops only the current clip core`:'All state relations are always shown; click an arc to see its pairs, double-click a dot to see the source.';
  drawDetail(focusId,destination,candidates,self?actualSequence:null,connectionStatus);
 }
 root.querySelectorAll('[data-zoom]').forEach(b=>b.onclick=()=>{zoom=b.dataset.zoom==='reset'?1:Math.max(1,Math.min(3,zoom*Number(b.dataset.zoom)));svg.style.width=(zoom*100)+'%';shell.classList.toggle('is-zoomed',zoom>1);if(zoom===1){root.querySelector('.graph-scroll').scrollTo(0,0);}placeLabels();});
 root.querySelector('[data-labels]').onclick=e=>{showLabels=!showLabels;e.currentTarget.setAttribute('aria-pressed',String(showLabels));placeLabels();};
 const expand=root.querySelector('[data-expand]');expand.onclick=()=>{if(dialog.open){dialog.close();return;}detailWasOpen=detail.open;detail.open=true;dialog.append(shell);expand.textContent='Collapse ↙';expand.setAttribute('aria-label','Collapse graph');dialog.showModal();};
 dialog.addEventListener('close',()=>{root.insertBefore(shell,dialog);detail.open=detailWasOpen;expand.textContent='Expand ↗';expand.setAttribute('aria-label','Expand graph');expand.focus({preventScroll:true});});
 update();return {update,svg,clearFocus(){nodeFocus=null;last='';}};
}
