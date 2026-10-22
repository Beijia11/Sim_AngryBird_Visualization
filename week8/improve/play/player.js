(() => {
  const names={simple_before:'Simple · before',simple_after:'Simple · after',ours_before:'ours / v3 · before',ours_after:'ours / v3 · after'};
  const version=new URLSearchParams(location.search).get('version');
  const status=document.querySelector('#status'),toggle=document.querySelector('#toggle'),reset=document.querySelector('#reset'),canvas=document.querySelector('canvas'),details=document.querySelector('#details');
  let running=false,ready=false,acc=0,last=0,lastInfo=0;const keys=new Set(),taps=[];
  function clear(){keys.clear();taps.length=0;acc=0;}
  function setRunning(value){if(!ready)return;running=value;clear();last=performance.now();toggle.textContent=value?'Pause':'Start control';status.textContent=value?'Playing · '+names[version]:'Paused · '+names[version];}
  function restart(){sim.reset(0);clear();updateDetails();}
  function actionsFor(key){return ready?World.actions.filter(a=>(a.keys||[]).some(k=>k.toLowerCase()===key)):[];}
  // Capture before the original SimKit handlers. Simulation stays in manual mode;
  // this adapter only supplies physical key events and fixed-timestep stepping.
  for(const type of ['keydown','keyup'])window.addEventListener(type,e=>{
    const key=e.key.toLowerCase(),actions=actionsFor(key);
    e.stopImmediatePropagation();
    if(actions.length||['p','r','v'].includes(key))e.preventDefault();
    if(!ready)return;
    if(type==='keyup'){keys.delete(key);return;}
    if(e.repeat)return;
    if(key==='p'){setRunning(!running);return;}
    if(key==='r'){restart();return;}
    if(!running)return;
    keys.add(key);for(const a of actions)if(a.kind==='tap')taps.push({id:a.id});
  },true);
  window.addEventListener('blur',()=>setRunning(false));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)setRunning(false);});
  toggle.onclick=()=>{setRunning(!running);canvas.focus();};
  reset.onclick=()=>{restart();canvas.focus();};
  canvas.addEventListener('pointerdown',()=>{canvas.focus();if(!running)setRunning(true);});
  function updateDetails(){
    const s=sim.state(),n=s.near,desc=World.describe?.(s);
    const root=n.root||[n.x,n.y];
    const pose=desc?.state||n.shot?.id||n.move||'ready';
    details.textContent=`Keys: ${[...keys].join(' + ')||'none'} · t=${s.t.toFixed(2)}s · position (${root.map(x=>x.toFixed(0)).join(', ')}) · ${pose}`+(desc?.note?' · '+desc.note:'')+(s.events?.length?' · '+JSON.stringify(s.events):'');
  }
  function frame(now){
    if(running){acc+=Math.min(.1,(now-last)/1000);const dt=World.meta.dt||1/60;
      while(acc>=dt){const actions=taps.splice(0),ids=new Set();for(const key of keys)for(const a of actionsFor(key))if(a.kind==='hold')ids.add(a.id);for(const id of ids)actions.push({id});sim.step(actions,dt);acc-=dt;}
    }
    last=now;if(now-lastInfo>100){updateDetails();lastInfo=now;}requestAnimationFrame(frame);
  }
  async function load(src){await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error('Failed to load: '+src));document.head.append(s);});}
  (async()=>{if(!names[version])throw new Error('Unknown version');document.title=names[version]+' · keyboard play';
    for(const file of ['proxy.js','world.js','draw.js','simkit.js'])await load(`versions/${version}/${file}`);
    sim.reset(0);ready=true;toggle.disabled=false;reset.disabled=false;setRunning(false);updateDetails();requestAnimationFrame(frame);
  })().catch(e=>{status.textContent=e.message;console.error(e);});
})();
