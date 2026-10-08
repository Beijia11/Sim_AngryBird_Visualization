window.__toolsReady=(async()=>{
const script=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(Error('Cannot load '+src));document.head.append(s)});
window.RAPIER=(await import('./vendor/rapier.mjs')).default;await RAPIER.init();
await script('./contact_geometry.js');
await script('./reference_motion.js');
await script('./intercept_motion.js');
await script('./runtime_tools.js');
})();
