// Side-scrolling platformer, level 1-1 layout. World x in source px (tile 80 wide, 50 tall), screen = world - camX.
(function () {
  const TW = 80, TH = 50, GROUND = 640;
  const rowTop = (r) => GROUND - (13 - r) * TH;
  const BLOCKS = [ // [tx, row, kind, content]
    [16, 9, "q", "coin"], [20, 9, "b", null], [21, 9, "q", "mushroom"], [22, 9, "b", null],
    [23, 9, "q", "coin"], [24, 9, "b", null], [22, 5, "q", "coin"]];
  const PIPES = [[28, 2], [38, 3], [46, 4], [57, 4]];
  const GOOMBAS = [22, 40, 51, 52.5];
  const G = 2600, JUMP_V = 1150, RUN = 360, ACC = 1400;

  function solids(s) {
    const out = [];
    for (const b of s.blocks) out.push([b.x, b.y, TW, TH]);
    for (const p of PIPES) out.push([p[0] * TW + 5, GROUND - p[1] * TH, 2 * TW - 10, p[1] * TH]);
    return out;
  }
  function marioSize(m) { return m.big ? [70, 100] : [60, 50]; }

  function pose(m, t) {
    const [w, h] = marioSize(m), x = m.x, y = m.y;
    const ph = Math.sin(m.anim * 14), air = !m.ground;
    const sc = h / 100, f = m.face;
    const P = (dx, dy) => [x + dx * f * w / 60, y - dy * sc];
    const lk = air ? 18 : 10 * ph, rk = air ? -6 : -10 * ph;
    return {
      nose: P(8, 88), left_eye: P(6, 91), right_eye: P(10, 91), left_ear: P(-3, 90), right_ear: P(3, 90),
      left_shoulder: P(-8, 70), right_shoulder: P(8, 70),
      left_elbow: P(-14, 58 + (air ? 20 : 0)), right_elbow: P(14 + (air ? 4 : 0), 58 + (air ? 22 : 0)),
      left_wrist: P(-16 + 6 * ph, 48), right_wrist: P(18 - 6 * ph, air ? 92 : 48),
      left_hip: P(-6, 42), right_hip: P(6, 42),
      left_knee: P(-6 + lk, 20 + (air ? 8 : 0)), right_knee: P(6 + rk, 20),
      left_ankle: P(-8 + 1.6 * lk, 0 + (air ? 10 : 0)), right_ankle: P(8 + 1.6 * rk, 0)
    };
  }

  window.World = {
    meta: { name: "platformer 1-1", source: [1280, 720], fps: 59.94, dt: 1 / 60 },
    actions: [
      { id: "left", kind: "hold", keys: ["ArrowLeft", "a"], description: "walk left" },
      { id: "right", kind: "hold", keys: ["ArrowRight", "d"], description: "walk right" },
      { id: "jump", kind: "tap", keys: [" ", "ArrowUp", "w"], description: "jump" }
    ],
    init(rng) {
      return {
        t: 0, camX: 0, events: [],
        mario: { x: 460, y: 500, vx: 300, vy: 0, ground: false, big: false, face: 1, anim: 0, grow: 0 },
        blocks: BLOCKS.map(([tx, r, k, c]) => ({ x: tx * TW, y: rowTop(r), kind: k, content: c, used: false, bump: 0 })),
        goombas: GOOMBAS.map((tx) => ({ x: tx * TW, y: GROUND, vx: -150, alive: true, active: false, squash: 0 })),
        items: [], score: 0
      };
    },
    step(s, acts, dt, rng) {
      s.t += dt;
      const on = (id) => acts.some((a) => a.id === id);
      const m = s.mario;
      const dir = (on("right") ? 1 : 0) - (on("left") ? 1 : 0);
      if (dir) { m.vx = SimKit.util.clamp(m.vx + dir * ACC * dt, -RUN, RUN); m.face = dir; }
      else { const d = ACC * 1.2 * dt; m.vx = Math.abs(m.vx) < d ? 0 : m.vx - Math.sign(m.vx) * d; }
      if (on("jump") && m.ground) { m.vy = -JUMP_V; m.ground = false; s.events.push({ type: "jump" }); }
      m.vy += G * dt;
      const [w, h] = marioSize(m);
      const sol = solids(s);
      // horizontal
      m.x += m.vx * dt;
      for (const r of sol) {
        if (m.y > r[1] + 2 && m.y - h < r[1] + r[3] && m.x + w / 2 > r[0] && m.x - w / 2 < r[0] + r[2]) {
          m.x = m.vx > 0 ? r[0] - w / 2 : r[0] + r[2] + w / 2; m.vx = 0;
        }
      }
      if (m.x - w / 2 < s.camX) { m.x = s.camX + w / 2; m.vx = Math.max(0, m.vx); }
      // vertical
      const py = m.y; m.y += m.vy * dt; m.ground = false;
      for (const r of sol) {
        if (m.x + w / 2 - 6 > r[0] && m.x - w / 2 + 6 < r[0] + r[2]) {
          if (m.vy >= 0 && py <= r[1] + 1 && m.y >= r[1]) { m.y = r[1]; m.vy = 0; m.ground = true; }
          else if (m.vy < 0 && py - h >= r[1] + r[3] - 1 && m.y - h < r[1] + r[3]) {
            m.y = r[1] + r[3] + h; m.vy = 0;
            const b = s.blocks.find((b) => b.x === r[0] && b.y === r[1]);
            if (b) {
              b.bump = 0.15;
              if (b.kind === "q" && !b.used) {
                b.used = true; s.events.push({ type: "block_hit", content: b.content });
                if (b.content === "mushroom") s.items.push({ kind: "mushroom", x: b.x + TW / 2, y: b.y, vx: 0, vy: 0, rise: 0.6 });
                else s.items.push({ kind: "coin", x: b.x + TW / 2, y: b.y, vy: -900, life: 0.6 });
              }
            }
          }
        }
      }
      if (m.y >= GROUND) { m.y = GROUND; m.vy = 0; m.ground = true; }
      m.anim += Math.abs(m.vx) / RUN * dt;
      // camera: scroll right only, keep Mario at <= screen 600
      s.camX = Math.max(s.camX, m.x - 600);
      for (const b of s.blocks) b.bump = Math.max(0, b.bump - dt);
      // items
      for (const it of s.items) {
        if (it.kind === "coin") { it.vy += G * dt; it.y += it.vy * dt; it.life -= dt; continue; }
        if (it.rise > 0) { it.rise -= dt; it.y -= TH / 0.6 * dt; if (it.rise <= 0) it.vx = 200; continue; }
        it.vy += G * dt; it.x += it.vx * dt; it.y += it.vy * dt;
        for (const r of sol) if (it.x + 30 > r[0] && it.x - 30 < r[0] + r[2] && it.y >= r[1] && it.y - it.vy * dt <= r[1] + 1) { it.y = r[1]; it.vy = 0; }
        for (const r of sol) if (it.y > r[1] + 2 && it.y - 40 < r[1] + r[3] && it.x + 30 > r[0] && it.x - 30 < r[0] + r[2]) { it.vx = -it.vx; it.x += it.vx * dt * 2; }
        if (it.y >= GROUND) { it.y = GROUND; it.vy = 0; }
        if (!it.taken && Math.abs(it.x - m.x) < (w / 2 + 30) && it.y > m.y - h && it.y - 50 < m.y) {
          it.taken = true; m.big = true; s.score += 1000; s.events.push({ type: "power_up" });
        }
      }
      s.items = s.items.filter((it) => !it.taken && !(it.kind === "coin" && it.life <= 0));
      // goombas
      for (const g of s.goombas) {
        if (!g.alive) { g.squash -= dt; continue; }
        if (!g.active && g.x < s.camX + 1400) g.active = true;
        if (!g.active) continue;
        g.x += g.vx * dt;
        for (const p of PIPES) {
          const px = p[0] * TW;
          if (g.x + 30 > px && g.x - 30 < px + 2 * TW) { g.vx = -g.vx; g.x += g.vx * dt * 2; }
        }
        for (const o of s.goombas) if (o !== g && o.alive && o.active && Math.abs(o.x - g.x) < 60 && Math.sign(o.x - g.x) === Math.sign(g.vx)) g.vx = -g.vx;
        if (Math.abs(g.x - m.x) < w / 2 + 30 && m.y > g.y - 60 && m.y - h < g.y) {
          if (m.vy > 0 && m.y < g.y - 25) {
            g.alive = false; g.squash = 0.5; m.vy = -650; s.score += 100; s.events.push({ type: "stomp" });
          } else if (m.big) { m.big = false; s.events.push({ type: "shrink" }); g.vx = -g.vx; }
          else { m.vx = 0; s.events.push({ type: "hurt" }); g.vx = -g.vx; }
        }
      }
    },
    proxy(s) {
      const cx = s.camX, regions = [{ cls: "sky", rect: [0, 0, 1280, 720] }, { cls: "ground", rect: [0, GROUND, 1280, 80] }];
      for (const p of PIPES) {
        const x = p[0] * TW - cx, top = GROUND - p[1] * TH;
        if (x > 1300 || x + 2 * TW < -20) continue;
        regions.push({ cls: "structure", rect: [x + 5, top + 30, 2 * TW - 10, p[1] * TH - 30] });
        regions.push({ cls: "structure", rect: [x, top, 2 * TW, 30] });
      }
      const boxes = [];
      for (const b of s.blocks) {
        const x = b.x - cx; if (x < -100 || x > 1380) continue;
        boxes.push({ cls: b.kind === "q" && !b.used ? "prop" : "static", center: [x + TW / 2, b.y + TH / 2 - (b.bump > 0 ? 12 : 0)], size: [TW, TH] });
      }
      for (const g of s.goombas) {
        const x = g.x - cx; if (x < -60 || x > 1340 || (!g.alive && g.squash <= 0)) continue;
        boxes.push(g.alive ? { cls: "object", center: [x, g.y - 25], size: [56, 50] } : { cls: "object", center: [x, g.y - 10], size: [56, 20] });
      }
      for (const it of s.items) boxes.push(it.kind === "coin" ? { cls: "prop", center: [it.x - cx, it.y - 25], size: [30, 45] } : { cls: "object", center: [it.x - cx, it.y - 25], size: [56, 50] });
      const m = s.mario, j = pose(m, s.t);
      for (const k in j) j[k] = [j[k][0] - cx, j[k][1]];
      return { regions, figures: [{ cls: "character", joints: j, thickness: m.big ? 12 : 8 }], boxes, media: [] };
    },
    replay: {
      duration: 10.21,
      actions: [
        { t: 0, id: "right", until: 1.45 }, { t: 1.5, id: "right", until: 3.05 },
        { t: 2.05, id: "jump" }, { t: 3.3, id: "right", until: 3.9 }, { t: 3.35, id: "jump" },
        { t: 4.0, id: "jump" }, { t: 4.5, id: "right", until: 5.7 }, { t: 4.7, id: "jump" },
        { t: 5.9, id: "right", until: 7.35 }, { t: 6.4, id: "jump" }, { t: 7.57, id: "right", until: 8.9 },
        { t: 7.9, id: "jump" }, { t: 8.6, id: "jump" }, { t: 9.38, id: "right", until: 10.21 }, { t: 9.5, id: "jump" }
      ]
    }
  };
})();
