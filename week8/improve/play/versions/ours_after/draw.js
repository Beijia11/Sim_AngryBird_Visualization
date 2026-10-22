/* Display-only user revision. No World/state/physics/pose/inputs are changed. */
(() => {
  const originalDraw = ProxyKit.draw;
  const isCircle = window.DISPLAY_CASE === '01_circle';
  function circles(figures) {
    const groups = [];
    for (const f of figures) {
      if (!f.chain?.length) continue;
      const xs=f.chain.map(p=>p[0]), ys=f.chain.map(p=>p[1]);
      const x=(Math.min(...xs)+Math.max(...xs))/2,y=(Math.min(...ys)+Math.max(...ys))/2;
      const radius=(Math.max(...xs)-Math.min(...xs))/2;
      let g=groups.find(g=>Math.hypot(g.x-x,g.y-y)<1e-5);
      if (!g) {g={x,y,radius,count:0};groups.push(g);}
      g.radius=Math.min(g.radius,radius);g.count++;
    }
    return groups;
  }
  ProxyKit.draw = function(ctx,scene,opts) {
    const balls=(scene.boxes||[]).filter(b=>b.cls==='projectile');
    originalDraw(ctx,{...scene,figures:isCircle?[]:scene.figures,
      boxes:(scene.boxes||[]).filter(b=>b.cls!=='projectile')},opts);
    const W=opts?.width||ctx.canvas.width,H=opts?.height||ctx.canvas.height,src=opts?.source||scene.source||[W,H];
    ctx.save();ctx.setTransform(W/src[0],0,0,H/src[1],0,0);
    if (isCircle) for(const g of circles(scene.figures||[])) {
      const radius=g.radius*.6; // Keep the original marker center; smaller visual radius only.
      ctx.fillStyle='#45b4ff';ctx.beginPath();ctx.arc(g.x,g.y,radius,0,2*Math.PI);ctx.fill();
      if(g.count>1){ // Original execute-only outer ring is the authoritative hit indicator.
        ctx.strokeStyle='#b5f8ff';ctx.lineWidth=5;
        ctx.beginPath();ctx.arc(g.x,g.y,radius+14,0,2*Math.PI);ctx.stroke();
      }
    }
    for(const b of balls){
      const [x,y]=b.center;ctx.fillStyle='#e0ff58';ctx.strokeStyle='#1b2410';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(x,y,14,0,2*Math.PI);ctx.fill();ctx.stroke();
      ctx.strokeStyle='#ffffff';ctx.lineWidth=1.7;ctx.beginPath();ctx.arc(x-9,y,12,-1.05,1.05);ctx.stroke();
    }
    ctx.restore();
  };
  window.DISPLAY_REVISION={version:2,ballDiameter:28,circleRadiusScale:.6,changesSimulation:false};
})();
