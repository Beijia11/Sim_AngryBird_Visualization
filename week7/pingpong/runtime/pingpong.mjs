import {loadGame} from './engine.mjs';
const $=s=>document.querySelector(s);
try {
  const base=new URL('../examples/pingpong/',import.meta.url),game=await loadGame(base);
  window.game=game;let running=false,last=performance.now(),acc=0,taps=[],held=new Map(),recent=[];
  function cue(s){
    if(s.status==='won')return 'Training complete! You made at least 3 valid returns.';
    if(s.status==='lost')return 'Try again: get into position, then time your swing.';
    if(s.phase==='countdown')return 'Get ready for the serve. Watch the incoming ball.';
    if(s.phase==='result')return s.lastResult==='valid_return'?'Valid return! Get ready for the next ball.':'Missed this one. Get ready for the next ball.';
    if(s.phase==='outgoing')return 'Ball returned. Waiting for it to land on the far side…';
    const dx=s.ball.x-s.player.x;
    if(Math.abs(dx)>.23)return dx<0?'Move left to line up with the target ←':'Move right to line up with the target →';
    if(s.ball.y<.27&&s.ball.y>-.08)return 'In position · Press Space to swing now!';
    return 'In position · Wait for the ball, then swing.';
  }
  function render(){
    game.render($('#court').getContext('2d'));const s=game.observe();
    $('#score').textContent=`${s.score} / 3`;
    $('#balls').innerHTML=Array.from({length:5},(_,i)=>`<span class="ball-dot ${s.results[i]?(s.results[i].success?'ok':'miss'):''}" title="Ball ${i+1}"></span>`).join('');
    $('#cue').textContent=cue(s);$('#state').textContent=JSON.stringify(s,null,2);
    $('#events').textContent=recent.slice(-6).join(' · ');
    if(s.status!=='playing'){
      running=false;$('#veil').classList.remove('hidden');$('#overlay-title').textContent=s.status==='won'?'Training complete':'Try again';
      $('#overlay-sub').textContent=`${s.score} valid returns from 5 balls`;$('#start').textContent='Play again';
    }
  }
  function reset(start=false){
    game.reset(0);running=start;taps=[];held.clear();recent=[];acc=0;
    $('#veil').classList.toggle('hidden',start);$('#overlay-title').textContent='Ready to return';$('#overlay-sub').textContent='← → Move · Space Swing';$('#start').textContent='Start training';$('#pause').textContent='Pause';render();
  }
  $('#start').onclick=()=>reset(true);$('#reset').onclick=()=>reset(false);
  $('#pause').onclick=()=>{if(game.observe().status!=='playing')return;running=!running;acc=0;$('#pause').textContent=running?'Pause':'Resume';if(running)$('#veil').classList.add('hidden');};
  function swing(){if(running)taps.push('racket_swing');}
  addEventListener('keydown',e=>{
    if(['ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();
    if(e.key.toLowerCase()==='r'){reset(false);return;}
    if(e.key===' '&&!e.repeat)swing();
    if(e.key==='ArrowLeft')held.set(e.key,'lateral_step_left');
    if(e.key==='ArrowRight')held.set(e.key,'lateral_step_right');
  });
  addEventListener('keyup',e=>held.delete(e.key));addEventListener('blur',()=>{held.clear();taps=[];});
  for(const [sel,id] of [['#left','lateral_step_left'],['#right','lateral_step_right']]){
    const b=$(sel);b.onpointerdown=e=>{b.setPointerCapture(e.pointerId);held.set(sel,id);};b.onpointerup=b.onpointercancel=()=>held.delete(sel);
  }
  $('#swing').onpointerdown=swing;
  $('#download').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(game.trace(),null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='pingpong_trace.json';a.click();URL.revokeObjectURL(url);};
  const eventNames={serve:'Serve',table_bounce:'Table bounce',racket_contact:'Racket contact',return_scored:'Valid return +1',miss:'Miss',session_end:'Session ended'};
  function tick(id){game.step(id);for(const ev of game.events())recent.push(eventNames[ev.type]||ev.type);}
  window.harnessPause=()=>{running=false;acc=0;};window.harnessRender=render;
  function frame(now){acc+=Math.min((now-last)/1000,.1);last=now;if(running){while(acc>=1/60){tick(taps.shift()||[...held.values()].at(-1)||null);acc-=1/60;}render();}else acc=0;requestAnimationFrame(frame);}
  reset();requestAnimationFrame(frame);
}catch(e){$('#cue').textContent='Loading failed: '+e.message;throw e;}
