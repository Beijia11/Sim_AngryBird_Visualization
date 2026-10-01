// First-person aim-down-sights simulator: hip-fire view <-> scoped view, with look controls.
(function () {
  const W = 700, H = 480;
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;
  window.World = {
    meta: { name: "scoped rifle ADS", source: [W, H], fps: 16, dt: 1 / 60 },
    actions: [
      { id: "aim", kind: "hold", keys: ["Shift", "z", "x"], description: "aim down sights (hold)" },
      { id: "left", kind: "hold", keys: ["ArrowLeft", "a"], description: "look left" },
      { id: "right", kind: "hold", keys: ["ArrowRight", "d"], description: "look right" },
      { id: "up", kind: "hold", keys: ["ArrowUp", "w"], description: "look up" },
      { id: "down", kind: "hold", keys: ["ArrowDown", "s"], description: "look down" },
      { id: "tilt", kind: "continuous", keys: ["q", "e"], min: -1, max: 1, description: "fine look up/down (analog)" },
    ],
    assets: { plate: "assets/plate.jpg", gun: "assets/gun.png", scope: "assets/scope.png", scopeview: "assets/scopeview.jpg" },
    init(rng) {
      return { t: 0, aim: 0, aimV: 0, yaw: 0, pitch: 0, vyaw: 0, vpitch: 0, sway: 0, yaw0: 0, pitch0: 0, events: [], aiming: false };
    },
    step(s, acts, dt, rng) {
      const has = (id) => acts.some((a) => a.id === id);
      const want = has("aim");
      if (want !== s.aiming) { if (want) { s.yaw0 = s.yaw; s.pitch0 = s.pitch; } s.events.push({ type: want ? "aim_start" : "aim_end", t: s.t }); s.aiming = want; }
      // critically damped spring toward target aim (~0.35 s transition as in clip)
      const target = want ? 1 : 0, w = want ? 16 : 20, z = want ? 1 : 0.55;
      s.aimV += (w * w * (target - s.aim) - 2 * z * w * s.aimV) * dt;
      s.aim += s.aimV * dt;
      s.aim = Math.min(1.02, Math.max(-0.4, s.aim));
      const sens = lerp(260, 80, s.aim);
      const ty = (has("right") ? 1 : 0) - (has("left") ? 1 : 0);
      let tp = (has("down") ? 1 : 0) - (has("up") ? 1 : 0);
      acts.forEach((x) => { if (x.id === "tilt") tp += x.value || 0; });
      const k = 1 - Math.exp(-dt * 10);
      s.vyaw += (ty * sens - s.vyaw) * k;
      s.vpitch += (tp * sens - s.vpitch) * k;
      s.yaw = Math.max(-300, Math.min(300, s.yaw + s.vyaw * dt));
      s.pitch = Math.max(-50, Math.min(50, s.pitch + s.vpitch * dt));
      s.t += 0; s.sway += dt;
    },
    render(ctx, s, img) {
      const a = Math.min(1, Math.max(0, s.aim)), drop = Math.max(0, -s.aim) * 420;
      const zoom = lerp(1.08, 4.2, sm(0.15, 0.85, a));
      const cx = 360, cy = 290; // aim point in plate
      const swx = Math.sin(s.sway * 1.3) * 3, swy = Math.sin(s.sway * 2.1) * 2;
      // world view: plate drawn around look offset with zoom
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(zoom, zoom);
      const ox = -cx - s.yaw * 0.6 / 1 + (cx - W / 2) * (1 - sm(0.15, 0.85, a));
      const oy = -cy - s.pitch * 0.6 + (cy - H / 2) * (1 - sm(0.15, 0.85, a));
      // tile horizontally by mirroring so large yaw never reveals edges
      for (let i = -1; i <= 1; i++) {
        ctx.save();
        if (i !== 0) { ctx.translate(i < 0 ? ox : ox + 2 * W, oy); ctx.scale(-1, 1); ctx.drawImage(img.plate, 0, 0); }
        else ctx.drawImage(img.plate, ox, oy);
        ctx.restore();
      }
      ctx.restore();
      // motion blur-ish wash during transition
      const tr = Math.sin(Math.PI * a);
      // scope tint
      const k = sm(0.45, 0.95, a);
      if (k > 0) {
        ctx.save();
        ctx.globalAlpha = 0.55 * k; ctx.globalCompositeOperation = "multiply";
        ctx.fillStyle = "rgb(200,255,215)"; ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = "screen"; ctx.globalAlpha = 0.35 * k;
        ctx.fillStyle = "rgb(150,190,150)"; ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
      // hip gun
      const g = 1 - sm(0.35, 0.7, a);
      if (g > 0) {
        const sc = lerp(1, 2.2, sm(0, 0.7, a));
        const bob = Math.sin(s.sway * 2.4) * 2 + s.vpitch * 0.02 + drop;
        const gx = lerp(371, 120, sm(0, 0.7, a)) + swx - s.vyaw * 0.03, gy = lerp(246, 120, sm(0, 0.7, a)) + bob;
        ctx.save(); ctx.globalAlpha = g;
        ctx.drawImage(img.gun, gx, gy, img.gun.width * sc, img.gun.height * sc);
        ctx.restore();
      }
      if (k > 0) {
        ctx.save(); ctx.globalAlpha = sm(0.6, 1, a);
        const vx = Math.max(-70, Math.min(70, -(s.yaw - s.yaw0) * 1.2)), vy = Math.max(-70, Math.min(70, -(s.pitch - s.pitch0) * 1.2));
        ctx.drawImage(img.scopeview, -80 + swx + vx, -80 + swy + vy, W + 160, H + 160);
        ctx.drawImage(img.scopeview, swx + vx, swy + vy, W, H);
        ctx.restore();
        const sc = lerp(1.8, 1, k);
        const px = W / 2 + swx * 0.5, py = lerp(H * 1.1, H / 2, k) + swy * 0.5;
        ctx.save(); ctx.globalAlpha = Math.min(1, k * 1.5);
        ctx.translate(px, py); ctx.scale(sc, sc);
        ctx.drawImage(img.scope, -W / 2, -H / 2, W, H);
        ctx.restore();
        // reticle
        ctx.save(); ctx.globalAlpha = 0.6 * k; ctx.fillStyle = "#e8fff0";
        ctx.fillRect(W / 2 - 6, 268, 12, 1); ctx.fillRect(W / 2, 262, 1, 12); ctx.restore();
      } else {
        // hip crosshair
        ctx.save(); ctx.fillStyle = "rgba(90,200,220,0.8)";
        ctx.fillRect(325, 288, 12, 1); ctx.fillRect(385, 288, 12, 1); ctx.fillRect(360, 262, 1, 6); ctx.fillRect(360, 310, 1, 6);
        ctx.restore();
      }
      if (tr > 0.05) { ctx.save(); ctx.globalAlpha = 0.12 * tr; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    },
    replay: { duration: 5.06, actions: [
      { t: 0.84, id: "aim", until: 3.6 },
      { t: 1.94, id: "tilt", value: 0.67, until: 2.125 },
      { t: 2.25, id: "tilt", value: -1.0, until: 2.375 },
      { t: 2.44, id: "tilt", value: -0.9, until: 2.5 },
      { t: 2.56, id: "tilt", value: 0.8, until: 2.625 },
      { t: 2.69, id: "tilt", value: 2.0, until: 2.81 },
    ] },
  };
})();
