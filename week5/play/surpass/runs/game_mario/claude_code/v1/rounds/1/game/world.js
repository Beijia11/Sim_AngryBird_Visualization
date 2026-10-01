// Super-Mario-style side scroller rebuilt from the reference clip.
(function () {
  const GROUND = 642, LEVEL_W = 4055, SKY = "#4a83ff";
  window.World = {
    meta: { name: "mario 1-1", source: [1280, 720], fps: 59.94, dt: 1 / 60 },
    actions: [
      { id: "left", kind: "hold", keys: ["ArrowLeft", "a"], description: "run left" },
      { id: "right", kind: "hold", keys: ["ArrowRight", "d"], description: "run right" },
      { id: "jump", kind: "hold", keys: [" ", "ArrowUp", "w"], description: "jump (hold for higher)" }
    ],
    assets: { level: "assets/level.png", hud: "assets/hud.png", s_run: "assets/s_run.png", s_jump: "assets/s_jump.png",
      s_stand: "assets/s_stand.png", b_run: "assets/b_run.png", b_jump: "assets/b_jump.png", b_stand: "assets/b_stand.png" },
    init() { return { t: 0, x: 461.3, y: 495, vx: 60, vy: 0, ground: false, cam: 0, face: 1, big: false, anim: 0, jumpHeld: false, timer: 397, events: [] }; },
    step(s, acts, dt) {
      const has = (id) => acts.some((a) => a.id === id);
      const dir = (has("right") ? 1 : 0) - (has("left") ? 1 : 0);
      const acc = 1500, maxv = 750;
      if (dir) { s.vx += dir * acc * dt; s.face = dir; } else { s.vx -= Math.sign(s.vx) * Math.min(Math.abs(s.vx), 1400 * dt); }
      s.vx = Math.max(-maxv, Math.min(maxv, s.vx));
      const j = has("jump");
      if (j && !s.jumpHeld && s.ground) { s.vy = -1300; s.ground = false; s.events.push({ type: "jump" }); }
      s.jumpHeld = j;
      const g = (j && s.vy < 0) ? 3000 : 6000;
      s.vy += g * dt; s.y += s.vy * dt; s.x += s.vx * dt;
      if (s.y >= GROUND) { if (!s.ground) s.events.push({ type: "land" }); s.y = GROUND; s.vy = 0; s.ground = true; }
      s.x = Math.max(s.cam + 20, Math.min(LEVEL_W - 60, s.x));
      const target = s.x - 590; if (target > s.cam) s.cam = Math.min(target, LEVEL_W - 1280);
      s.anim += Math.abs(s.vx) * dt;
      if (s.t > 5.2) s.big = true;
      s.timer = 397 - Math.floor(s.t * 2.5);
    },
    render(ctx, s, img) {
      ctx.fillStyle = SKY; ctx.fillRect(0, 0, 1280, 720);
      const c = Math.round(s.cam);
      if (img.level) ctx.drawImage(img.level, c, 0, 1280, 720, 0, 0, 1280, 720);
      if (img.hud) ctx.drawImage(img.hud, 0, 0);
      let sp;
      if (!s.ground) sp = s.big ? img.b_jump : img.s_jump;
      else if (Math.abs(s.vx) > 20) sp = s.big ? img.b_run : img.s_run;
      else sp = s.big ? img.b_stand : img.s_stand;
      if (!sp) return;
      const w = Math.min(sp.width, 90), h = sp.height;
      const sx = s.x - c, bob = s.ground && Math.abs(s.vx) > 20 ? (Math.floor(s.anim / 40) % 2) * 3 : 0;
      ctx.save(); ctx.translate(sx, s.y - h - bob);
      if (s.face < 0) { ctx.scale(-1, 1); }
      ctx.drawImage(sp, 0, 0, w, h, -w / 2, 0, w, h);
      ctx.restore();
    },
    replay: { duration: 10.21, actions: [{"t": 0, "id": "right", "until": 0.5917}, {"t": 0.7583, "id": "right", "until": 0.7917}, {"t": 0.825, "id": "right", "until": 0.9417}, {"t": 0.9583, "id": "right", "until": 1.225}, {"t": 1.6917, "id": "right", "until": 1.8917}, {"t": 1.9083, "id": "right", "until": 1.925}, {"t": 1.9583, "id": "right", "until": 1.975}, {"t": 1.9917, "id": "right", "until": 2.0083}, {"t": 2.0417, "id": "right", "until": 2.0583}, {"t": 2.075, "id": "right", "until": 2.0917}, {"t": 2.1083, "id": "right", "until": 2.125}, {"t": 2.1417, "id": "right", "until": 2.1583}, {"t": 2.175, "id": "right", "until": 2.1917}, {"t": 2.475, "id": "right", "until": 2.975}, {"t": 3.7917, "id": "right", "until": 4.2083}, {"t": 4.3583, "id": "right", "until": 4.3917}, {"t": 4.425, "id": "right", "until": 4.8917}, {"t": 5.225, "id": "right", "until": 5.375}, {"t": 5.425, "id": "right", "until": 5.4417}, {"t": 5.4583, "id": "right", "until": 5.575}, {"t": 6.075, "id": "right", "until": 6.2583}, {"t": 6.4417, "id": "right", "until": 6.4583}, {"t": 6.725, "id": "right", "until": 6.8417}, {"t": 6.8583, "id": "right", "until": 6.875}, {"t": 6.8917, "id": "right", "until": 6.9417}, {"t": 6.9583, "id": "right", "until": 6.975}, {"t": 6.9917, "id": "right", "until": 7.0417}, {"t": 7.0583, "id": "right", "until": 7.175}, {"t": 7.1917, "id": "right", "until": 7.2083}, {"t": 7.225, "id": "right", "until": 7.2417}, {"t": 7.525, "id": "right", "until": 7.575}, {"t": 7.6083, "id": "right", "until": 7.925}, {"t": 7.9417, "id": "right", "until": 8.1083}, {"t": 8.125, "id": "right", "until": 8.8417}, {"t": 9.5583, "id": "right", "until": 10.175}, {"t": 0.5917, "id": "left", "until": 0.7583}, {"t": 0.7917, "id": "left", "until": 0.825}, {"t": 1.225, "id": "left", "until": 1.6917}, {"t": 1.925, "id": "left", "until": 1.9417}, {"t": 2.0083, "id": "left", "until": 2.025}, {"t": 2.1917, "id": "left", "until": 2.475}, {"t": 2.975, "id": "left", "until": 3.7917}, {"t": 4.2083, "id": "left", "until": 4.2583}, {"t": 4.275, "id": "left", "until": 4.325}, {"t": 4.3417, "id": "left", "until": 4.3583}, {"t": 4.4083, "id": "left", "until": 4.425}, {"t": 4.8917, "id": "left", "until": 5.225}, {"t": 5.375, "id": "left", "until": 5.3917}, {"t": 5.4083, "id": "left", "until": 5.425}, {"t": 5.4417, "id": "left", "until": 5.4583}, {"t": 5.575, "id": "left", "until": 6.0583}, {"t": 6.2583, "id": "left", "until": 6.275}, {"t": 6.8417, "id": "left", "until": 6.8583}, {"t": 6.875, "id": "left", "until": 6.8917}, {"t": 6.9417, "id": "left", "until": 6.9583}, {"t": 7.175, "id": "left", "until": 7.1917}, {"t": 7.2083, "id": "left", "until": 7.225}, {"t": 7.2417, "id": "left", "until": 7.275}, {"t": 7.2917, "id": "left", "until": 7.525}, {"t": 7.925, "id": "left", "until": 7.9417}, {"t": 8.8417, "id": "left", "until": 9.5583}, {"t": 0.225, "id": "jump", "until": 0.2417}, {"t": 0.375, "id": "jump", "until": 0.5083}, {"t": 1.0417, "id": "jump", "until": 1.0583}, {"t": 1.3083, "id": "jump", "until": 1.325}, {"t": 2.2417, "id": "jump", "until": 2.2583}, {"t": 2.5417, "id": "jump", "until": 2.6083}, {"t": 2.9583, "id": "jump", "until": 2.9917}, {"t": 3.4083, "id": "jump", "until": 3.5917}, {"t": 4.025, "id": "jump", "until": 4.1417}, {"t": 4.5083, "id": "jump", "until": 4.525}, {"t": 4.8083, "id": "jump", "until": 4.8583}, {"t": 5.025, "id": "jump", "until": 5.0583}, {"t": 5.375, "id": "jump", "until": 5.3917}, {"t": 5.625, "id": "jump", "until": 5.7583}, {"t": 6.7083, "id": "jump", "until": 6.825}, {"t": 7.2417, "id": "jump", "until": 7.425}, {"t": 9.125, "id": "jump", "until": 9.1583}, {"t": 9.175, "id": "jump", "until": 9.3083}, {"t": 9.7083, "id": "jump", "until": 10.1417}] }
  };
})();
