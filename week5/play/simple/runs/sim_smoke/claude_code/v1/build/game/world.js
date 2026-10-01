// Incense burner (lion-shaped censer) on a wooden table; smoke rises from vents in its head.
// Static camera; the only dynamic thing is the smoke, simulated as particles splatted to a density grid.
(function () {
  const VENTS = [[965, 365], [1075, 400]];
  const GRID = { origin: [560, 0], cell: 16, gw: 82, gh: 32 };   // covers x 560..1872, y 0..512
  const MAXP = 900;

  function emit(state, rng, rate, dt) {
    state.acc += rate * dt;
    while (state.acc >= 1) {
      state.acc -= 1;
      const v = VENTS[rng() < 0.6 ? 0 : 1];
      state.p.push({
        x: v[0] + (rng() - 0.5) * 14, y: v[1] + (rng() - 0.5) * 8,
        vx: (rng() - 0.5) * 20, vy: -60 - rng() * 40,
        age: 0, life: 4 + rng() * 3, ph: rng() * 6.283, m: 0.55 + rng() * 0.45
      });
    }
    if (state.p.length > MAXP) state.p.splice(0, state.p.length - MAXP);
  }

  window.World = {
    meta: { name: "censer smoke", source: [1920, 1080], fps: 25, dt: 1 / 60 },

    actions: [
      { id: "puff", kind: "hold", keys: [" "], description: "burst of extra smoke from the vents" },
      { id: "wind", kind: "continuous", keys: ["a", "d"], min: -1, max: 1, description: "air draft left / right" },
      { id: "gust", kind: "tap", keys: ["g"], description: "short sideways gust that swirls the plume" }
    ],

    init(rng) {
      const s = { t: 0, p: [], acc: 0, wind: 0.15, gust: 0, events: [] };
      // pre-warm: the plume is already rising at the start of the clip
      for (let i = 0; i < 300; i++) window.World.step(s, [], 1 / 60, rng);
      s.t = 0; s.events = [];
      return s;
    },

    step(state, acts, dt, rng) {
      let rate = 22, targetWind = 0.15;
      for (const a of acts) {
        if (a.id === "puff") rate = 70;
        if (a.id === "wind") targetWind = a.value === undefined ? 0 : a.value;
        if (a.id === "gust") { state.gust = 1; state.events.push({ type: "gust" }); }
      }
      state.wind += (targetWind - state.wind) * Math.min(1, dt * 1.5);
      state.gust = Math.max(0, state.gust - dt * 0.6);
      state.t += dt;
      emit(state, rng, rate, dt);
      const t = state.t, W = state.wind * 120 + state.gust * 260;
      for (const q of state.p) {
        q.age += dt;
        const h = Math.max(0, 400 - q.y) / 400;               // height above the vents, 0..1
        // buoyancy: accelerate up near the source, slow down higher up
        q.vy += (-50 * (1 - h) + 25 * h) * dt;
        q.vy = Math.max(-200, Math.min(-15, q.vy));
        // wispy sway grows with height; drift with the draft
        const sway = Math.sin(t * 1.3 + q.ph + q.y * 0.012) * (20 + 110 * h) + Math.sin(t * 0.7 + q.y * 0.004) * 40 * h;
        q.vx += ((W * h + sway) - q.vx) * Math.min(1, dt * 2);
        q.x += q.vx * dt; q.y += q.vy * dt;
      }
      state.p = state.p.filter(q => q.age < q.life && q.y > -40 && q.x > 500 && q.x < 1920);
    },

    proxy(state) {
      const { origin, cell, gw, gh } = GRID, d = new Array(gw * gh).fill(0);
      for (const q of state.p) {
        const fade = Math.min(1, q.age / 0.3) * (1 - q.age / q.life);
        const r = 0.8 + q.age * 0.6;                            // plume widens with age (cells)
        const cx = (q.x - origin[0]) / cell, cy = (q.y - origin[1]) / cell, a = 0.3 * q.m * fade / (r * 0.8);
        for (let j = Math.floor(cy - r); j <= Math.ceil(cy + r); j++) for (let i = Math.floor(cx - r); i <= Math.ceil(cx + r); i++) {
          if (i < 0 || j < 0 || i >= gw || j >= gh) continue;
          const w = 1 - Math.hypot(i - cx, j - cy) / r;
          if (w > 0) d[j * gw + i] += a * w;
        }
      }
      for (let k = 0; k < d.length; k++) d[k] = Math.min(1, d[k]);
      return {
        regions: [
          { cls: "wall", rect: [0, 0, 1920, 430] },
          { cls: "table", polygon: [[0, 420], [1920, 410], [1920, 1080], [0, 1080]] },
          // censer: static bronze sculpture (body, head, tail curl, feet)
          { cls: "structure", polygon: [[700, 760], [690, 640], [720, 560], [760, 520], [790, 430], [840, 360], [900, 320], [980, 315],
                                        [1060, 340], [1120, 380], [1150, 470], [1150, 540], [1200, 590], [1240, 660], [1245, 760],
                                        [1225, 830], [1200, 870], [1210, 890], [1160, 900], [1100, 930], [1090, 990], [1000, 995],
                                        [960, 940], [860, 920], [800, 905], [790, 920], [710, 910], [700, 860], [720, 820]] },
          { cls: "structure", polygon: [[700, 560], [670, 500], [680, 450], [710, 440], [730, 470], [720, 500], [745, 530]] }
        ],
        figures: [],
        boxes: [],
        media: [{ cls: "smoke", origin, cell, grid_size: [gw, gh], density: d }]
      };
    },

    // steady plume; the draft shifts right around 5.5-8 s (plume bends right and up), a gust at 5.5 s
    replay: {
      duration: 9.0,
      actions: [
        { t: 0.0, id: "wind", value: 0.1, until: 4.0 },
        { t: 1.0, id: "puff", until: 1.9 },
        { t: 4.0, id: "wind", value: 0.0, until: 5.4 },
        { t: 4.4, id: "puff", until: 4.9 },
        { t: 5.5, id: "gust" },
        { t: 5.4, id: "wind", value: 0.8, until: 8.0 },
        { t: 8.0, id: "wind", value: 0.3, until: 9.0 }
      ]
    }
  };
})();
