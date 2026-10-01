// Pac-Man style maze: pac moves along corridors, eats pellets; power pellet frightens the ghost.
(function () {
  const S = 1.3; // overlay work scale -> source pixels
  const R = (x0, x1, y0, y1) => [x0 * S, y0 * S, (x1 - x0) * S, (y1 - y0) * S];
  const BLOCKS = [
    R(86, 139, 61, 115), R(169, 222, 61, 115), R(252, 389, 61, 115), R(418, 472, 61, 115), R(501, 556, 61, 115),
    R(86, 139, 144, 170), R(169, 194, 144, 225), R(225, 416, 144, 225), R(446, 472, 144, 225), R(501, 556, 144, 170),
    R(86, 139, 199, 225), R(501, 556, 199, 225),
    R(86, 139, 255, 309), R(169, 222, 255, 309), R(252, 389, 255, 309), R(418, 472, 255, 309), R(501, 556, 255, 309),
  ];
  const IN = { x0: 55 * S, x1: 585 * S, y0: 31 * S, y1: 340 * S };
  const RAD = 18.5, PAC_V = 115, GHOST_V = 97, FRIGHT_V = 80;
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

  function free(x, y, r) {
    if (x - r < IN.x0 || x + r > IN.x1 || y - r < IN.y0 || y + r > IN.y1) return false;
    for (const b of BLOCKS) {
      if (x + r > b[0] && x - r < b[0] + b[2] && y + r > b[1] && y - r < b[1] + b[3]) return false;
    }
    return true;
  }

  function makePellets() {
    const p = [];
    const add = (x, y, power) => p.push({ x, y, power: !!power, eaten: false });
    for (let y = 340; y > 175; y -= 33) add(200, y);          // column x=200
    for (let x = 165; x > 100; x -= 33) add(x, 168);          // row y=168
    for (let y = 135; y > 75; y -= 33) add(92, y);            // column x=92
    add(92, 60, true);                                        // power pellet (corner)
    add(92, 429, true); add(740, 60, true); add(740, 429, true);
    for (let x = 200; x < 560; x += 36) add(x, 60);           // top row
    for (let x = 600; x < 740; x += 36) add(x, 60);
    return p;
  }

  window.World = {
    meta: { name: "maze chase", source: [832, 480], fps: 10, dt: 1 / 60 },
    actions: [
      { id: "up", kind: "hold", keys: ["ArrowUp", "w"], description: "turn up" },
      { id: "down", kind: "hold", keys: ["ArrowDown", "s"], description: "turn down" },
      { id: "left", kind: "hold", keys: ["ArrowLeft", "a"], description: "turn left" },
      { id: "right", kind: "hold", keys: ["ArrowRight", "d"], description: "turn right" },
    ],
    init(rng) {
      return {
        t: 0, events: [], score: 0,
        pac: { x: 200, y: 347, dir: "up", mouth: 0, alive: true },
        ghost: { x: 163, y: 60, vx: 1, fright: 0, eaten: false, home: [150, 310] },
        pellets: makePellets(),
      };
    },
    step(s, acts, dt, rng) {
      s.t += dt;
      const p = s.pac;
      let want = null;
      for (const a of acts) if (DIRS[a.id]) want = a.id;
      const stepLen = PAC_V * dt;
      // try turning into the wanted direction, allowing small alignment snap
      if (want && want !== p.dir) {
        const d = DIRS[want];
        for (const off of [0, -1, 1, -2, 2, -3, 3, -4, 4, -5, 5, -6, 6, -7, 7]) {
          const nx = p.x + (d[0] === 0 ? off : 0), ny = p.y + (d[1] === 0 ? off : 0);
          if (free(nx + d[0] * stepLen, ny + d[1] * stepLen, RAD)) { p.x = nx; p.y = ny; p.dir = want; break; }
        }
      }
      if (p.dir) {
        const d = DIRS[p.dir];
        const nx = p.x + d[0] * stepLen, ny = p.y + d[1] * stepLen;
        if (free(nx, ny, RAD)) { p.x = nx; p.y = ny; p.mouth += dt * 8; p.moving = true; }
        else p.moving = false;
      }
      // eat pellets
      for (const q of s.pellets) {
        if (!q.eaten && Math.abs(q.x - p.x) < 14 && Math.abs(q.y - p.y) < 14) {
          q.eaten = true; s.score += q.power ? 50 : 10;
          s.events.push({ type: q.power ? "power_pellet" : "pellet", by: "pac" });
          if (q.power) { s.ghost.fright = 7; s.ghost.vx = -s.ghost.vx; s.events.push({ type: "ghost_frightened" }); }
        }
      }
      // ghost: patrols top corridor; when frightened, flees away from pac
      const g = s.ghost;
      if (!g.eaten) {
        if (g.fright > 0) {
          g.fright -= dt;
          g.vx = g.x >= p.x ? 1 : -1;
          g.x += g.vx * FRIGHT_V * dt * 1.2;
          g.x = SimKit.util.clamp(g.x, IN.x0 + RAD, IN.x1 - RAD);
        } else {
          g.x += g.vx * GHOST_V * dt;
          if (g.x > g.home[1]) { g.x = g.home[1]; g.vx = -1; }
          if (g.x < g.home[0]) { g.x = g.home[0]; g.vx = 1; }
        }
        if (Math.abs(g.x - p.x) < 25 && Math.abs(g.y - p.y) < 25) {
          if (g.fright > 0) { g.eaten = true; s.events.push({ type: "ghost_eaten", by: "pac" }); }
          else if (p.alive) { p.alive = false; p.dir = null; s.events.push({ type: "pac_caught" }); }
        }
      }
    },
    proxy(s) {
      const regions = [{ cls: "floor", rect: [0, 0, 832, 480] }];
      const w = 3;
      regions.push({ cls: "wall", rect: [IN.x0 - w, IN.y0 - w, IN.x1 - IN.x0 + 2 * w, w] });
      regions.push({ cls: "wall", rect: [IN.x0 - w, IN.y1, IN.x1 - IN.x0 + 2 * w, w] });
      regions.push({ cls: "wall", rect: [IN.x0 - w, IN.y0, w, IN.y1 - IN.y0] });
      regions.push({ cls: "wall", rect: [IN.x1, IN.y0, w, IN.y1 - IN.y0] });
      for (const b of BLOCKS) regions.push({ cls: "wall", rect: b });
      const boxes = [];
      for (const q of s.pellets) if (!q.eaten) boxes.push({ cls: "prop", center: [q.x, q.y], size: q.power ? [14, 14] : [5, 5] });
      const p = s.pac;
      const ang = { up: -Math.PI / 2, down: Math.PI / 2, left: Math.PI, right: 0 }[p.dir || "right"] || 0;
      boxes.push({ cls: "object", center: [p.x, p.y], size: [40, 40], angle: ang });
      if (!s.ghost.eaten) boxes.push({ cls: "object", center: [s.ghost.x, s.ghost.y], size: [40, 40] });
      return { regions, figures: [], boxes, media: [] };
    },
    replay: {
      duration: 6.1,
      actions: [
        { t: 0.0, id: "up", until: 1.4 },
        { t: 1.45, id: "left", until: 2.2 },
        { t: 2.3, id: "up", until: 3.9 },
        { t: 3.95, id: "right", until: 5.5 },
        { t: 5.6, id: "down", until: 6.1 },
      ],
    },
  };
})();
