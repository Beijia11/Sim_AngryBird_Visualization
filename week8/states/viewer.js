// Week 8 copy of the :8000 state viewer (tennis_state_machine/dist/app.js), viewer part only, English.
// Source video on the left; the single active state of the near player on the right.
import {videoAt} from './exclusive-machine.js';
const $=s=>document.querySelector('#state-viewer '+s),fmt=t=>(+t).toFixed(2),esc=x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
try{
 const response=await fetch('states/model.json');if(!response.ok)throw Error('state model failed to load');
 const model=await response.json(),video=$('.sv-video'),names=Object.fromEntries(model.behaviors.map(b=>[b.id,b.name]));let stamp='',view=null;
 const nodes={stationary:[330,62],left:[100,130],right:[250,130],forward:[410,130],back:[560,130],serve:[120,325],forehand:[330,325],backhand:[540,325]};
 const parentNames={non_hitting:'Non-hitting',hitting:'Hitting'};
 function line(a,b){const dx=b[0]-a[0],dy=b[1]-a[1],k=1/Math.max(Math.abs(dx)/64,Math.abs(dy)/22);return `M${a[0]+dx*k},${a[1]+dy*k} L${b[0]-dx*k},${b[1]-dy*k}`;}
 let svg='<svg viewBox="0 0 660 375" role="img" aria-label="Non-hitting and hitting are mutually exclusive; one state is highlighted as the video plays"><defs><marker id="sv-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="context-stroke"/></marker></defs><rect class="map-region" data-parent="non_hitting" x="10" y="5" width="640" height="165" rx="12"/><rect class="map-region shot-region" data-parent="hitting" x="10" y="265" width="640" height="105" rx="12"/><text class="region-title" x="25" y="30">Non-hitting · move / stationary</text><text class="region-title" x="25" y="288">Hitting · take-back, swing and follow-through, recovery</text>';
 for(const id of ['left','right','forward','back'])svg+=`<path class="edge" d="${line(nodes.stationary,nodes[id])}" marker-start="url(#sv-arrow)" marker-end="url(#sv-arrow)"/>`;
 svg+='<path class="edge parent-link" d="M180 175 L180 257" marker-end="url(#sv-arrow)"/><text class="bridge-label" x="166" y="215" text-anchor="end">take-back / serve starts</text><path class="edge parent-link" d="M480 260 L480 178" marker-end="url(#sv-arrow)"/><text class="bridge-label" x="493" y="215">recovery ends</text><g class="last-edges"></g>';
 for(const [id,p]of Object.entries(nodes))svg+=`<g class="node" data-node="${id}" transform="translate(${p})"><rect x="-64" y="-22" width="128" height="44" rx="8"/><text y="6">${names[id]}</text></g>`;$('.sv-map').innerHTML=svg+'</svg>';
 const label=s=>s.quality==='unknown'?'Unconfirmed':s.quality==='outside'?'Out of range':names[s.behavior]||'Unconfirmed';
 const phase=s=>s.behavior==='serve'&&s.phase==='execute'?'Toss and upswing':model.phases[s.phase]||'';
 function render(){const t=Math.max(0,Math.min(video.currentTime||0,model.meta.duration-1e-6));view=videoAt(model,t);const s=view.state;$('.sv-time').textContent=fmt(t)+'s';$('.sv-state-time').textContent=fmt(t)+'s';$('.sv-seek').value=t;
  if(s.id!==stamp){stamp=s.id;
   $('.sv-cards').innerHTML=`<div class="state-card ${s.quality}"><div><small>${parentNames[s.parent]||'Observation gap · not a behaviour state'}</small><strong>${label(s)}</strong></div><div><div class="phase">${phase(s)||'Not forced into a class'}</div><small>${fmt(s.start)}–${fmt(s.end)}s</small></div></div>`;
   document.querySelectorAll('#state-viewer .node').forEach(n=>n.classList.toggle('active',s.quality==='known'&&n.dataset.node===s.behavior));
   document.querySelectorAll('#state-viewer [data-parent]').forEach(n=>n.classList.toggle('parent-active',n.dataset.parent===s.parent));
   $('.sv-evidence').innerHTML=`<p>${esc(s.note)}</p><p>Boundaries are hand-labelled, about ±${s.tolerance}s. ${s.parent==='hitting'?'The whole segment counts as hitting; body movement does not activate a movement state.':s.parent==='non_hitting'?'The stroke track is in its ready phase here; take-back, swing and recovery are excluded.':'Unconfirmed intervals are not collected into any state.'}</p>`;
   const r=view.transition||view.entryTransition;
   $('.sv-transition').textContent=r?`${r.fromState===r.toState?names[r.toState]+' · '+model.phases[r.fromPhase]+' → '+model.phases[r.toPhase]:names[r.fromState]+' → '+names[r.toState]} · ${fmt(r.time)}s · ${r.reason}`:s.quality==='known'?'Interval holds; each moment belongs to exactly one state.':'Not enough observation or out of range here; no transition is inferred across the gap.';
  }
  const r=view.entryTransition;
  $('.last-edges').innerHTML=r&&t-r.time<.8&&r.fromState!==r.toState&&nodes[r.fromState]&&nodes[r.toState]?`<path class="overlay-edge" d="${line(nodes[r.fromState],nodes[r.toState])}" marker-end="url(#sv-arrow)"/>`:'';
 }
 function seek(t){video.currentTime=Math.max(0,Math.min(t,model.meta.duration-.001));render();}
 $('.sv-seek').max=model.meta.duration;$('.sv-seek').oninput=e=>seek(+e.target.value);$('.sv-rate').onchange=e=>video.playbackRate=+e.target.value;$('.sv-toggle').onclick=()=>video.paused?video.play().catch(showError):video.pause();$('.sv-back').onclick=()=>{video.pause();seek(video.currentTime-.1)};$('.sv-next').onclick=()=>{video.pause();seek(video.currentTime+.1)};
 for(const event of ['timeupdate','seeking','seeked','pause','play','loadedmetadata','ended'])video.addEventListener(event,render);
 render();
 if('requestVideoFrameCallback' in video){const frame=()=>{render();video.requestVideoFrameCallback(frame);};video.requestVideoFrameCallback(frame);}else{const tick=()=>{if(!video.paused)render();requestAnimationFrame(tick);};requestAnimationFrame(tick);}
}catch(e){showError(e)}
function showError(e){const box=$('.sv-error');box.hidden=false;box.textContent='Failed to load: '+e.message;console.error(e);}
