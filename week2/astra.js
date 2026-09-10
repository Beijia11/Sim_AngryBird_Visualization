'use strict';
document.querySelectorAll('.astra-case').forEach(card=>{
 const tabs=[...card.querySelectorAll('[role="tab"]')];
 function select(tab){for(const t of tabs){const active=t===tab;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;document.getElementById(t.getAttribute('aria-controls')).hidden=!active;}}
 tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>select(tab));tab.addEventListener('keydown',e=>{let n;if(e.key==='ArrowRight')n=(i+1)%tabs.length;if(e.key==='ArrowLeft')n=(i-1+tabs.length)%tabs.length;if(e.key==='Home')n=0;if(e.key==='End')n=tabs.length-1;if(n!==undefined){e.preventDefault();select(tabs[n]);tabs[n].focus();}});});
 const frame=card.querySelector('iframe'),launcher=card.querySelector('.astra-launcher'),start=card.querySelector('[data-start-game]'),stop=card.querySelector('[data-stop-game]'),status=card.querySelector('.astra-status');
 let timeout;
 start.addEventListener('click',()=>{launcher.hidden=true;launcher.style.display='none';frame.hidden=false;frame.style.pointerEvents='none';stop.hidden=false;status.textContent='Loading game…';frame.src=frame.dataset.src;clearTimeout(timeout);timeout=setTimeout(()=>{if(status.textContent==='Loading game…')status.textContent='If the game does not load here, use Open full game or download the HTML.';},8000);});
 stop.addEventListener('click',()=>{clearTimeout(timeout);frame.src='about:blank';frame.hidden=true;stop.hidden=true;launcher.hidden=false;launcher.style.display='';status.textContent='Game closed. You can start a fresh session at any time.';start.focus();});
 frame.addEventListener('load',()=>{if(frame.getAttribute('src')!=='about:blank'&&!frame.hidden){clearTimeout(timeout);frame.style.pointerEvents='';status.textContent='Click inside the game to control it. Close the game to stop the simulation.';}});
});
window.addEventListener('message',event=>{
 if(!event.data||event.data.type!=='astra-game-size')return;
 for(const frame of document.querySelectorAll('.astra-game-frame')){
  if(event.source===frame.contentWindow&&!frame.hidden&&Number.isFinite(event.data.height)){frame.style.height=`${Math.max(250,Math.min(2200,Math.ceil(event.data.height)))}px`;break;}
 }
});
