// Pac-Man style maze simulator reconstructed from the reference clip.
(function () {
  const LEVEL = {"grid": ["...................", ".##.##.#####.##.##.", ".##.##.#####.##.##.", "...................", ".##.#.###.###.#.##.", "....#.#.....#.#....", ".##.#.#######.#.##.", "...................", ".##.##.#####.##.##.", ".##.##.#####.##.##.", "..................."], "dots": [[0, 0, 1], [0, 2, 0], [0, 3, 0], [0, 5, 0], [0, 6, 0], [0, 9, 0], [0, 10, 1], [1, 0, 0], [1, 3, 0], [1, 5, 0], [1, 7, 0], [1, 10, 0], [2, 3, 0], [2, 7, 0], [3, 0, 0], [3, 4, 0], [3, 5, 0], [3, 6, 0], [3, 7, 0], [3, 9, 0], [4, 0, 0], [4, 3, 0], [4, 7, 0], [4, 10, 0], [5, 0, 0], [5, 7, 0], [5, 10, 0], [6, 1, 0], [6, 2, 0], [6, 7, 0], [6, 9, 0], [6, 10, 0], [7, 0, 0], [7, 5, 0], [7, 10, 0], [8, 0, 0], [8, 7, 0], [8, 10, 0], [9, 0, 0], [9, 4, 0], [9, 7, 0], [9, 10, 0], [10, 0, 0], [10, 3, 0], [10, 5, 0], [11, 0, 0], [11, 10, 0], [12, 0, 0], [12, 1, 0], [12, 2, 0], [12, 3, 0], [12, 7, 0], [12, 9, 0], [12, 10, 0], [13, 0, 0], [13, 3, 0], [13, 4, 0], [13, 5, 0], [13, 6, 0], [13, 7, 0], [13, 10, 0], [14, 3, 0], [14, 10, 0], [15, 0, 0], [15, 2, 0], [15, 3, 0], [15, 4, 0], [15, 5, 0], [15, 6, 0], [15, 8, 0], [15, 9, 0], [15, 10, 0], [16, 0, 0], [16, 3, 0], [16, 5, 0], [16, 7, 0], [16, 10, 0], [17, 0, 0], [17, 5, 0], [17, 7, 0], [17, 10, 0], [18, 0, 1], [18, 1, 0], [18, 2, 0], [18, 5, 0], [18, 6, 0], [18, 7, 0], [18, 8, 0], [18, 10, 1]]};
  const X0 = 91.8, Y0 = 59.8, C = 36.0, GW = 19, GH = 11;
  const PAC_SPEED = 10 / 3, GHOST_SPEED = 2.5, GHOST_SCARED_SPEED = 2.9, SCARED_TIME = 2.4;
  const DIRS = { R: [1, 0], L: [-1, 0], U: [0, -1], D: [0, 1] };
  const OPP = { R: "L", L: "R", U: "D", D: "U" };
  const GHOST_SCRIPT = [[0, "R"], [1.55, "L"], [3.4, "R"]];
  const REPLAY_T = 6.1;
  function open(c, r) { return c >= 0 && c < GW && r >= 0 && r < GH && LEVEL.grid[r][c] === "."; }
  function canGo(e, d) { const v = DIRS[d]; return open(e.c + v[0], e.r + v[1]); }
  function pos(e) { const v = DIRS[e.dir] || [0, 0]; const p = e.moving ? e.prog : 0; return [X0 + C * (e.c + v[0] * p), Y0 + C * (e.r + v[1] * p)]; }
  function reverse(e) { if (e.moving && e.prog > 0) { const v = DIRS[e.dir]; e.c += v[0]; e.r += v[1]; e.prog = 1 - e.prog; } e.dir = OPP[e.dir]; }
  function ghostChoose(s, g, rng) {
    if (s.t < REPLAY_T && !s.offScript) {
      let d = "R"; for (const [t, dd] of GHOST_SCRIPT) if (s.t + 1e-6 >= t) d = dd;
      if (canGo(g, d)) return d;
    }
    const opts = Object.keys(DIRS).filter((d) => canGo(g, d) && d !== OPP[g.dir]);
    if (!opts.length) return OPP[g.dir];
    const p = s.pac; let best = null, bs = -1e9;
    const pd = Math.abs(g.c - p.c) + Math.abs(g.r - p.r);
    if (!s.gtarget || (s.gtarget[0] === g.c && s.gtarget[1] === g.r) || rng() < 0.08) {
      let tc, tr, k = 0;
      do { tc = Math.floor(rng() * GW); tr = 4 + Math.floor(rng() * (GH - 4)); k++; } while (!open(tc, tr) && k < 50);
      s.gtarget = [tc, tr];
    }
    const chase = s.scared <= 0 && pd <= 4;
    for (const d of opts) {
      const v = DIRS[d], nc = g.c + v[0], nr = g.r + v[1];
      const dp = Math.abs(nc - p.c) + Math.abs(nr - p.r);
      const dt_ = Math.abs(nc - s.gtarget[0]) + Math.abs(nr - s.gtarget[1]);
      const sc = (s.scared > 0 ? dp : chase ? -dp : -dt_) + rng() * 1.5;
      if (sc > bs) { bs = sc; best = d; }
    }
    return best;
  }
  function advance(e, speed, dt, onCenter) {
    let rem = speed * dt;
    for (let k = 0; k < 4 && rem > 1e-9; k++) {
      if (!e.moving || e.prog === 0) { onCenter(); if (!canGo(e, e.dir)) { e.moving = false; e.prog = 0; return; } e.moving = true; }
      const need = 1 - e.prog;
      if (rem < need) { e.prog += rem; e.dist += rem; rem = 0; }
      else { e.prog = 0; e.dist += need; rem -= need; const v = DIRS[e.dir]; e.c += v[0]; e.r += v[1]; e.arrived = true; }
    }
  }
  window.World = {
    meta: { name: "maze-chase", source: [832, 480], fps: 10, dt: 1 / 60 },
    actions: [
      { id: "up", kind: "tap", keys: ["ArrowUp", "w"], description: "turn up" },
      { id: "down", kind: "tap", keys: ["ArrowDown", "s"], description: "turn down" },
      { id: "left", kind: "tap", keys: ["ArrowLeft", "a"], description: "turn left" },
      { id: "right", kind: "tap", keys: ["ArrowRight", "d"], description: "turn right" },
    ],
    assets: { plate: "assets/plate.png", ghost: "assets/ghost.png", ghostScared: "assets/ghost_scared.png" },
    init(rng) {
      const dots = {}; for (const [c, r, cap] of LEVEL.dots) dots[c + "," + r] = cap ? 2 : 1;
      return {
        t: 0, events: [], dots, score: 0, scared: 0, offScript: false,
        pac: { c: 3, r: 8, dir: "R", want: null, prog: 0, moving: false, dist: 0, face: "R" },
        ghost: { c: 2, r: 0, dir: "R", prog: 0, moving: false, dist: 0 },
      };
    },
    step(s, acts, dt, rng) {
      s.t = s.t || 0;
      const map = { up: "U", down: "D", left: "L", right: "R" };
      const p = s.pac, g = s.ghost;
      const RA = window.World.replay.actions; s.ri = s.ri || 0;
      const wasOff = s.offScript;
      for (const a of acts) if (map[a.id]) {
        p.want = map[a.id];
        if (s.ri < RA.length && RA[s.ri].id === a.id && s.t >= RA[s.ri].t - 1e-6 && s.t < RA[s.ri].t + dt + 1e-6) s.ri++;
        else s.offScript = true;
      }
      if (s.ri < RA.length && s.t > RA[s.ri].t + dt + 1e-6) s.offScript = true;
      if (s.offScript && !wasOff && s.t < REPLAY_T && g.dir === "R") reverse(g);
      if (p.want && p.moving && p.want === OPP[p.dir]) { reverse(p); }
      advance(p, PAC_SPEED, dt, () => {
        if (p.want && canGo(p, p.want)) p.dir = p.want;
        if (canGo(p, p.dir)) p.face = p.dir;
      });
      if (p.prog === 0) {
        const near = [p.c, p.r];
        const key = near[0] + "," + near[1];
        if (s.dots[key]) {
          const cap = s.dots[key] === 2; delete s.dots[key];
          s.score += cap ? 50 : 10; s.events.push({ type: cap ? "capsule" : "eat", at: near });
          if (cap) { s.scared = SCARED_TIME; reverse(g); }
        }
      }
      if (s.scared > 0) s.scared = Math.max(0, s.scared - dt);
      if (g.fade != null && g.fade < 1) g.fade = Math.min(1, g.fade + dt / 0.5);
      advance(g, s.scared > 0 ? GHOST_SCARED_SPEED : GHOST_SPEED, dt, () => {
        const d = ghostChoose(s, g, rng);
        if (d) g.dir = d;
      });
      const pp = pos(p), gp = pos(g);
      if (Math.hypot(pp[0] - gp[0], pp[1] - gp[1]) < C * 0.6) {
        if (s.scared > 0) { s.events.push({ type: "eat_ghost" }); s.score += 200; s.ghost = { c: 2, r: 0, dir: "R", prog: 0, moving: false, dist: 0, fade: 0 }; s.scared = 0; s.offScript = true; }
        else { s.events.push({ type: "death" }); s.pac = { c: 3, r: 8, dir: "R", want: null, prog: 0, moving: false, dist: 0, face: "R" }; s.ghost = { c: 2, r: 0, dir: "R", prog: 0, moving: false, dist: 0 }; s.offScript = true; }
      }
    },
    render(ctx, s, img) {
      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, 832, 480);
      if (img.plate) ctx.drawImage(img.plate, 0, 0);
      ctx.fillStyle = "#fff";
      for (const k in s.dots) {
        const [c, r] = k.split(",").map(Number);
        ctx.beginPath(); ctx.arc(X0 + C * c, Y0 + C * r, s.dots[k] === 2 ? 9.5 : 3.4, 0, Math.PI * 2); ctx.fill();
      }
      const p = s.pac, pp = pos(p);
      const ang = { R: 0, D: Math.PI / 2, L: Math.PI, U: -Math.PI / 2 }[p.face];
      const m = 0.05 + 0.75 * Math.abs(Math.sin(Math.PI * p.dist * 1.0));
      ctx.beginPath(); ctx.moveTo(pp[0], pp[1]);
      ctx.arc(pp[0], pp[1], 16, ang + m / 2 + 0.0, ang - m / 2 + Math.PI * 2); ctx.closePath(); ctx.fill();
      const g = s.ghost, gp = pos(g);
      const w = s.scared > 0 ? Math.min(1, s.scared / 0.4) : 0;
      const gx = Math.round(gp[0] - 20), gy = Math.round(gp[1] - 20);
      ctx.save();
      if (img.ghost && w < 1) { ctx.globalAlpha = (1 - w) * (g.fade == null ? 1 : g.fade); ctx.drawImage(img.ghost, gx, gy); }
      if (img.ghostScared && w > 0) { ctx.globalAlpha = w * (g.fade == null ? 1 : g.fade); ctx.drawImage(img.ghostScared, gx, gy); }
      ctx.restore();
    },
    replay: {
      duration: 6.1,
      actions: [
        { t: 0.1, id: "up" }, { t: 1.55, id: "left" }, { t: 2.45, id: "up" },
        { t: 3.4, id: "down" }, { t: 3.7, id: "up" }, { t: 3.95, id: "right" }, { t: 5.8, id: "down" },
      ],
    },
  };
})();
