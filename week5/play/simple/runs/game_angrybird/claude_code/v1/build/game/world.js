// Slingshot bird vs. wooden/glass tower with a pig on top. World x: tower view at camera 0; slingshot ~880 px left.
(function () {
  const GROUND = 492, PLAT_TOP = 470, PLAT_X0 = 330, PLAT_X1 = 680;
  const POUCH = [-550, 292], K = 4.7, G_BIRD = 270, G_BLOCK = 700;
  const CAM_SLING = -880, CAM_TOWER = -20;
  const blk = (id, x, y, w, h, mat) => ({ id, x, y, w, h, mat, a: 0, vx: 0, vy: 0, w0: 0, dyn: false, rest: false });

  function extents(b) {
    const c = Math.abs(Math.cos(b.a)), s = Math.abs(Math.sin(b.a));
    return [c * b.w / 2 + s * b.h / 2, s * b.w / 2 + c * b.h / 2];
  }
  function overlap(a, b, pad) {
    const ea = extents(a), eb = extents(b);
    return Math.abs(a.x - b.x) < ea[0] + eb[0] + (pad || 0) && Math.abs(a.y - b.y) < ea[1] + eb[1] + (pad || 0);
  }
  function emitDust(s, x, y, n, rng, spd) {
    for (let i = 0; i < n; i++) {
      const an = rng() * Math.PI * 2, v = (0.3 + rng()) * (spd || 120);
      s.dust.push({ x, y, vx: Math.cos(an) * v, vy: Math.sin(an) * v - 40, life: 0.8 + rng() * 0.6 });
    }
  }

  window.World = {
    meta: { name: "slingshot tower knockdown", source: [960, 536], fps: 29.287, dt: 1 / 60 },

    actions: [
      { id: "pull", kind: "drag", description: "pull the sling back (dx, dy from pouch) and release to launch" }
    ],

    init(rng) {
      return {
        t: 0, cam: 0, events: [],
        bird: { x: POUCH[0], y: POUCH[1], vx: 0, vy: 0, state: "loaded", aim: null, a: 0, hits: 0 },
        waiting: [[-260, 476], [-180, 476]],
        blocks: [
          blk("postL", 336, 448, 12, 44, "wood"), blk("postR", 664, 448, 12, 44, "wood"),
          blk("colL", 432, 380, 16, 180, "wood"), blk("colR", 572, 380, 16, 180, "wood"),
          blk("sill", 500, 463, 84, 12, "wood"), blk("glass", 500, 403, 60, 108, "glass"),
          blk("cap", 500, 343, 84, 12, "wood"), blk("beam", 502, 288, 190, 14, "wood"),
          blk("upL", 460, 198, 16, 166, "wood"), blk("upR", 543, 198, 16, 166, "wood"),
          blk("stand", 502, 271, 30, 20, "wood"),
          blk("top", 502, 109, 100, 12, "wood"), blk("spire", 504, 78, 12, 50, "wood")
        ],
        pig: { x: 502, y: 242, r: 19, alive: true },
        dust: [], score: 0
      };
    },

    step(s, acts, dt, rng) {
      const t = s.t, b = s.bird;
      const pull = acts.find((a) => a.id === "pull");

      // slingshot: aim while the pull is held, launch when it is released
      if (b.state === "loaded" || b.state === "aiming") {
        if (pull && pull.value) {
          const v = pull.value, m = Math.hypot(v.dx, v.dy), lim = 140, f = m > lim ? lim / m : 1;
          b.aim = [v.dx * f, v.dy * f]; b.state = "aiming";
          b.x = POUCH[0] + b.aim[0]; b.y = POUCH[1] + b.aim[1];
        } else if (b.state === "aiming") {
          b.state = "flying"; b.vx = -K * b.aim[0]; b.vy = -K * b.aim[1];
          s.events.push({ type: "launch", vx: b.vx, vy: b.vy });
        }
      } else if (b.state === "flying" || b.state === "tumbling") {
        b.vy += G_BIRD * dt * (b.state === "tumbling" ? 2.5 : 1);
        b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.vx * dt / 15;
        if (b.y > GROUND - 15) { b.y = GROUND - 15; b.vy *= -0.3; b.vx *= 0.7; b.state = "tumbling"; }
        // bird vs blocks
        for (const k of s.blocks) {
          const pb = { x: b.x, y: b.y, w: 30, h: 30, a: 0 };
          if (!overlap(pb, k) || Math.hypot(b.vx, b.vy) < 60) continue;
          const mk = k.mat === "glass" ? 0.6 : 1;
          k.dyn = true; k.rest = false;
          k.vx += b.vx * 0.55 / mk; k.vy += b.vy * 0.4 - 60;
          k.w0 += (b.vx > 0 ? 1 : -1) * (b.y < k.y ? 4 : -2);
          b.vx *= 0.55; b.vy = b.vy * 0.4 - 80; b.state = "tumbling"; b.hits++;
          emitDust(s, b.x, b.y, 10, rng, 160);
          s.score += 500; s.events.push({ type: "hit", block: k.id });
        }
        // bird vs pig
        if (s.pig.alive && Math.hypot(b.x - s.pig.x, b.y - s.pig.y) < s.pig.r + 15) {
          s.pig.alive = false; s.score += 5000; emitDust(s, s.pig.x, s.pig.y, 30, rng, 220);
          s.events.push({ type: "pig_popped" });
        }
      }

      // supports: a resting block without support starts falling
      for (const k of s.blocks) {
        if (k.dyn) continue;
        const bottom = k.y + extents(k)[1];
        if (bottom >= PLAT_TOP - 2) continue;
        const sup = s.blocks.some((o) => o !== k && !(o.dyn && !o.rest) && Math.abs(bottom - (o.y - extents(o)[1])) < 6 &&
          Math.abs(k.x - o.x) < extents(k)[0] + extents(o)[0] - 2);
        if (!sup) { k.dyn = true; k.w0 += (rng() - 0.5) * 1.5; }
      }
      // falling blocks
      for (const k of s.blocks) {
        if (!k.dyn || k.rest) continue;
        k.vy += G_BLOCK * dt; k.x += k.vx * dt; k.y += k.vy * dt; k.a += k.w0 * dt;
        const e = extents(k), bottom = k.y + e[1];
        let floor = (k.x > PLAT_X0 && k.x < PLAT_X1) ? PLAT_TOP : GROUND;
        for (const o of s.blocks) {
          if (o === k || (o.dyn && !o.rest)) continue;
          const eo = extents(o), top = o.y - eo[1];
          if (Math.abs(k.x - o.x) < e[0] + eo[0] - 4 && top >= k.y - 2 && top < floor) floor = top;
        }
        // knock other static blocks
        for (const o of s.blocks) {
          if (o === k || o.dyn || Math.hypot(k.vx, k.vy) < 150 || !overlap(k, o, -3)) continue;
          o.dyn = true; o.vx += k.vx * 0.4; o.w0 += (k.vx >= 0 ? 1.5 : -1.5);
          emitDust(s, (k.x + o.x) / 2, (k.y + o.y) / 2, 4, rng, 90);
          s.score += 100;
        }
        if (s.pig.alive && Math.hypot(k.x - s.pig.x, k.y - s.pig.y) < s.pig.r + Math.min(e[0], e[1]) + 4 && Math.hypot(k.vx, k.vy) > 120) {
          s.pig.alive = false; s.score += 5000; emitDust(s, s.pig.x, s.pig.y, 30, rng, 220);
          s.events.push({ type: "pig_popped" });
        }
        if (bottom > floor) {
          k.y -= bottom - floor;
          if (Math.abs(k.vy) > 80) emitDust(s, k.x, floor, 3, rng, 60);
          k.vy *= -0.15; k.vx *= 0.6; k.w0 *= 0.5;
          // tip over toward the nearest flat orientation
          const q = Math.round(k.a / (Math.PI / 2)) * (Math.PI / 2);
          k.a += (q - k.a) * Math.min(1, 6 * dt);
          if (Math.abs(k.vy) < 30 && Math.abs(k.vx) < 20 && Math.abs(k.w0) < 0.3) { k.rest = true; k.vx = k.vy = k.w0 = 0; }
        }
      }
      // pig falls if its stand is gone
      if (s.pig.alive) {
        const st = s.blocks.find((k) => k.id === "stand");
        if (st.dyn) { s.pig.y = st.y - st.h / 2 - s.pig.r; s.pig.x = st.x; }
      }
      // dust
      for (const d of s.dust) { d.x += d.vx * dt; d.y += d.vy * dt; d.vx *= 0.96; d.vy = d.vy * 0.96 + 20 * dt; d.life -= dt; }
      s.dust = s.dust.filter((d) => d.life > 0);

      // camera: survey tower, pan to sling, follow the bird to the tower
      let target;
      if (b.state === "loaded" || b.state === "aiming") target = t < 0.85 ? 0 : CAM_SLING;
      else target = SimKit.util.clamp(b.x - 330, CAM_SLING, CAM_TOWER);
      const rate = (b.state === "loaded" && t < 2) ? 5 : 4;
      s.cam += (target - s.cam) * Math.min(1, rate * dt);
    },

    proxy(s) {
      const c = s.cam, X = (x) => x - c, b = s.bird;
      const regions = [
        { cls: "sky", rect: [0, 0, 960, 536] },
        { cls: "vegetation", rect: [0, 462, 960, 30] },
        { cls: "ground", rect: [0, GROUND, 960, 536 - GROUND] },
        { cls: "platform", rect: [X(PLAT_X0), PLAT_TOP, PLAT_X1 - PLAT_X0, GROUND - PLAT_TOP] },
        // slingshot: trunk and two prongs
        { cls: "structure", polygon: [[X(-560), 490], [X(-540), 490], [X(-542), 360], [X(-555), 360]] },
        { cls: "structure", polygon: [[X(-555), 365], [X(-542), 360], [X(-570), 268], [X(-582), 272]] },
        { cls: "structure", polygon: [[X(-555), 365], [X(-542), 360], [X(-522), 266], [X(-510), 270]] }
      ];
      const boxes = [];
      for (const k of s.blocks) boxes.push({ cls: k.mat === "glass" ? "object" : "prop", center: [X(k.x), k.y], size: [k.w, k.h], angle: k.a });
      if (s.pig.alive) boxes.push({ cls: "object", center: [X(s.pig.x), s.pig.y], size: [s.pig.r * 2, s.pig.r * 2 - 4] });
      boxes.push({ cls: "projectile", center: [X(b.x), b.y], size: [30, 28], angle: b.a });
      for (const w of s.waiting) boxes.push({ cls: "projectile", center: [X(w[0]), w[1]], size: [28, 26] });
      // sling bands while the bird sits in the pouch
      if (b.state === "loaded" || b.state === "aiming") {
        for (const fx of [-576, -516]) {
          const p = [X(fx), 270], q = [X(b.x), b.y], dx = q[0] - p[0], dy = q[1] - p[1];
          boxes.push({ cls: "tool", center: [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], size: [Math.max(4, Math.hypot(dx, dy)), 6], angle: Math.atan2(dy, dx) });
        }
      }
      const media = [];
      if (s.dust.length) {
        const cell = 16, gw = 60, gh = 34, d = new Array(gw * gh).fill(0);
        for (const p of s.dust) {
          const i = Math.floor(X(p.x) / cell), j = Math.floor(p.y / cell);
          if (i < 0 || j < 0 || i >= gw || j >= gh) continue;
          d[j * gw + i] = Math.min(1, d[j * gw + i] + 0.35 * Math.min(1, p.life));
        }
        media.push({ cls: "dust", origin: [0, 0], cell, grid_size: [gw, gh], density: d });
      }
      return { regions, figures: [], boxes, media };
    },

    replay: {
      duration: 10.89,
      actions: [
        // bird drawn back from ~5.1 s, released at 6.83 s
        { t: 5.1, id: "pull", value: { dx: -60, dy: 35 }, until: 5.4 },
        { t: 5.4, id: "pull", value: { dx: -122, dy: 69 }, until: 6.83 }
      ]
    }
  };
})();
