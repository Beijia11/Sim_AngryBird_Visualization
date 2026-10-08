/* Harness-owned bridge: the generated file is World/world.js, as in new_harness.
 * Rendering is exclusively ProxyKit; Program is an internal evaluation adapter. */
(function(global){
 'use strict';
 const W=global.World;
 if(!W)throw Error('world.js must define window.World');
 function generator(state){return()=>{state.__rng=(state.__rng+0x6d2b79f5)|0;let t=state.__rng;t=Math.imul(t^(t>>>15),1|t);t^=t+Math.imul(t^(t>>>7),61|t);return((t^(t>>>14))>>>0)/4294967296}}
 global.Program={
   dt:W.meta.dt,actions:W.actions,
   reset(params,seed){global.RuntimeTools?.physics.disposeAll();const carrier={__rng:seed|0};const s=W.init(generator(carrier),params);s.__rng=carrier.__rng;return s},
   step(state,actions,dt){state.events=[];W.step(state,actions,dt,generator(state))},
   observe(state){return W.observe(state)},
   proxy(state){const scene=W.proxy(state),errors=ProxyKit.validate(scene);if(errors.length)throw Error(errors.join('; '));return scene},
   render(canvas,state){const scene=this.proxy(state);ProxyKit.draw(canvas.getContext('2d'),scene,{width:canvas.width,height:canvas.height,source:W.meta.source})}
 };
})(window);
