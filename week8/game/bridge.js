/* Host-driven deterministic steps; the original SimKit remains unchanged. */
(function(){
 const mode=document.body.dataset.mode;
 const originalInit=World.init;World.init=function(...args){const s=originalInit.apply(this,args);window.__liveState=s;return s;};
 function send(type,payload={}){parent.postMessage({channel:'tennis-simple-v3',mode,type,...payload},location.origin);}
 function snapshot(){const s=sim.state();return {time:s.t,near:s.near,ball:s.ball,score:s.score,wait:s.wait,returns:s.returns,info:World.describe(s),events:s.events};}
 const codes=new Set(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyJ','KeyK','KeyS','KeyN','KeyP','KeyR','KeyV','Space']);
 for(const type of ['keydown','keyup'])addEventListener(type,e=>{if(!codes.has(e.code))return;e.preventDefault();e.stopImmediatePropagation();send('key',{code:e.code,down:type==='keydown',repeat:e.repeat});},true);
 addEventListener('blur',()=>send('release'));
 addEventListener('message',e=>{
  if(e.source!==parent||e.origin!==location.origin||e.data?.channel!=='tennis-simple-v3')return;
  try{const m=e.data;
   if(m.type==='reset'){sim.reset(m.seed||0);send('state',{state:snapshot()});}
   if(m.type==='cancel'){World.cancelInputs?.(window.__liveState);send('state',{state:snapshot()});}
   if(m.type==='step'){
    const events=[];for(let i=0;i<m.count;i++){sim.step(i?m.holds:m.acts,1/60);events.push(...sim.state().events);}
    const state=snapshot();state.events=events;send('state',{state});
   }
   if(m.type==='snapshot')send('state',{state:snapshot()});
  }catch(error){send('error',{message:error.message});console.error(error);}
 });
 addEventListener('DOMContentLoaded',()=>{sim.reset(0);send('ready',{state:snapshot()});document.getElementById('legend').hidden=true;});
})();
