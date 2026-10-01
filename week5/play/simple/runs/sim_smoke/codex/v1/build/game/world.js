(function () {
  'use strict';

  // A rigid incense vessel. All geometry is in the 1920 x 1080 source frame.
  // The moving detections in the measurements are pieces of smoke, not solids.
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const CEL = 8, GW = 178, GH = 88, OX = 496, OY = -24;
  const regions = [
    { cls: 'wall', rect: [0, 0, 1920, 432] },
    { cls: 'table', polygon: [[0, 428], [1920, 432], [1920, 1080], [0, 1080]] }
  ];
  const vessel = [
    // Rounded body approximated by one projected rigid volume.
    { cls: 'prop', z: 800, corners: [
      [704, 842], [1039, 931], [1230, 809], [907, 742],
      [689, 592], [1039, 669], [1215, 578], [893, 530]
    ] },
    { cls: 'prop', center: [962, 486], size: [347, 293], angle: -0.13, z: 840 },
    { cls: 'prop', center: [1102, 428], size: [129, 147], angle: -0.34, z: 850 },
    { cls: 'prop', center: [1119, 546], size: [126, 126], angle: -0.15, z: 851 },
    { cls: 'prop', center: [734, 871], size: [82, 102], angle: -0.13, z: 920 },
    { cls: 'prop', center: [1051, 936], size: [136, 109], angle: 0.08, z: 990 },
    { cls: 'prop', center: [1194, 858], size: [82, 67], angle: -0.22, z: 899 },
    { cls: 'prop', center: [685, 602], size: [48, 210], angle: 0.18, z: 750 },
    { cls: 'prop', center: [700, 477], size: [78, 43], angle: 0.23, z: 749 }
  ];

  function particle(x, y, vx, vy, radius, mass, age, phase, vent) {
    return { x, y, vx, vy, radius, mass, age, phase, vent };
  }

  function emit(s, vent, rng) {
    const phase = s.clock * 3.7;
    const wobble = Math.sin(phase) + 0.36 * Math.sin(phase * 2.31);
    let x, y, vx, vy, mass, radius;
    if (vent === 0) {
      x = 968 + 3 * wobble; y = 328;
      vx = -17; vy = -125; mass = 0.10; radius = 6.5;
    } else if (vent === 1) {
      x = 1092; y = 455 + 4 * Math.sin(phase * 0.7);
      vx = -100 + 35 * s.wind; vy = -35;
      mass = 0.16 * (0.75 + s.heat * 0.6); radius = 10;
    } else {
      x = 1090; y = 378;
      vx = 7; vy = -103 - 30 * s.heat;
      mass = 0.13; radius = 7.5;
    }
    s.smoke.push(particle(x + (rng() - 0.5) * 5, y + (rng() - 0.5) * 4,
      vx + (rng() - 0.5) * 7, vy, radius, mass, 0, rng() * 6.2831853, vent));
  }

  function advance(s, dt, rng) {
    s.clock += dt;
    s.wind += (s.windTarget - s.wind) * (1 - Math.exp(-dt * 3.5));
    s.heat += (s.heatTarget - s.heat) * (1 - Math.exp(-dt * 2.0));
    const pulse = 0.86 + 0.14 * Math.sin(s.clock * 4.1);
    const rates = [33 * clamp(1.0 - 0.58 * s.heat, 0.18, 1),
      54 * s.heat * pulse, 40 * s.heat];
    for (let k = 0; k < 3; k++) {
      s.carry[k] += rates[k] * dt;
      while (s.carry[k] >= 1) { emit(s, k, rng); s.carry[k]--; }
    }

    // Buoyancy and entrainment bend initially coherent streams into curls.
    // The draft is shared by the whole fluid, so detached wisps continue to move.
    const now = s.clock;
    for (const p of s.smoke) {
      p.age += dt;
      const high = clamp((460 - p.y) / 360, 0, 1);
      const openAir = clamp(p.age / 0.75, 0, 1);
      const curl = 31 + high * 43;
      let ux = s.wind * (145 + 72 * high) +
        curl * Math.sin(p.y / 74 + now * 1.27) +
        19 * Math.sin(p.x / 111 - now * 1.6);
      let uy = -99 - 57 * high - 20 * s.heat +
        34 * Math.sin(p.x / 85 + now * 1.07);

      // Two broad rotating eddies roll the warm plume after it clears the head.
      const eddies = [
        [1110 + 105 * Math.sin(now * 0.6), 230, 100, 78],
        [1385 + 55 * Math.sin(now * 0.9), 215, 165, -105]
      ];
      for (const e of eddies) {
        const dx = p.x - e[0], dy = p.y - e[1];
        const falloff = Math.exp(-(dx * dx + dy * dy) / (e[2] * e[2] * 2));
        ux += -dy / e[2] * e[3] * falloff;
        uy += dx / e[2] * e[3] * falloff;
      }
      // A cool, low filament is swept rightwards beneath the main rising plume.
      // It corresponds to the wisp measured at y=450..540, t=5.6..8.0.
      if (p.vent === 1 && s.wind > 0.45 && p.age < 3.3) {
        const low = clamp((p.y - 340) / 110, 0, 1);
        ux += 70 * low;
        uy = uy * (1 - low * 0.91) + 27 * low;
      }
      const entrain = (1 - Math.exp(-dt * (1.5 + openAir * 2.4)));
      p.vx += (ux - p.vx) * entrain;
      p.vy += (uy - p.vy) * entrain;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.radius += dt * (2.0 + high * 1.7);
      p.mass *= Math.exp(-dt * (0.10 + p.age * 0.018));
    }
    s.smoke = s.smoke.filter(p => p.age < 8 && p.mass > 0.012 &&
      p.y > -90 && p.y < 660 && p.x > 470 && p.x < 1980);
  }

  function density(s) {
    const grid = new Array(GW * GH).fill(0);
    for (const p of s.smoke) {
      const r = Math.min(34, p.radius);
      const cx = (p.x - OX) / CEL - 0.5, cy = (p.y - OY) / CEL - 0.5;
      const rr = r / CEL;
      const left = Math.max(0, Math.floor(cx - rr * 1.8));
      const right = Math.min(GW - 1, Math.ceil(cx + rr * 1.8));
      const top = Math.max(0, Math.floor(cy - rr * 1.8));
      const bottom = Math.min(GH - 1, Math.ceil(cy + rr * 1.8));
      const amount = p.mass * (8 / r);
      for (let y = top; y <= bottom; y++) {
        for (let x = left; x <= right; x++) {
          const d2 = ((x - cx) * (x - cx) + (y - cy) * (y - cy)) / (rr * rr);
          if (d2 < 3.24) grid[y * GW + x] += amount * Math.exp(-d2 * 1.65);
        }
      }
    }
    for (let i = 0; i < grid.length; i++) grid[i] = 1 - Math.exp(-grid[i]);
    return { cls: 'smoke', origin: [OX, OY], cell: CEL, grid_size: [GW, GH], density: grid };
  }

  window.World = {
    meta: { name: 'Incense and drifting smoke', source: [1920, 1080], fps: 25, dt: 1 / 60 },
    actions: [
      { id: 'draft', kind: 'continuous', keys: ['ArrowLeft', 'ArrowRight'], min: -1, max: 1,
        description: 'Change the air current' },
      { id: 'smolder', kind: 'continuous', keys: ['q', 'e'], min: 0.1, max: 1.2,
        description: 'Decrease or increase smoke emission' },
      { id: 'waft', kind: 'drag', description: 'Waft smoke in the direction of a drag' }
    ],
    init(rng) {
      const s = { clock: 0, t: 0, events: [], smoke: [], carry: [0, 0, 0],
        heat: 0.38, heatTarget: 0.38, wind: -0.20, windTarget: -0.20,
        vessel: vessel.map(b => JSON.parse(JSON.stringify(b))) };
      // The first video frame already contains an established thin upper plume.
      for (let i = 0; i < 134; i++) {
        const u = i / 133;
        const y = 328 - 390 * u;
        const x = 968 - 32 * u - 203 * u * u + 13 * Math.sin(u * 6.4);
        s.smoke.push(particle(x, y, -24 - 67 * u, -125,
          6.5 + 6 * u, 0.087 - 0.025 * u, 2.65 * u, rng() * 6.28, 0));
      }
      // Small wisps already escaping around the mouth at the beginning.
      for (let i = 0; i < 38; i++) {
        const u = i / 37;
        s.smoke.push(particle(1092 - 76 * u, 455 - 67 * u + 12 * Math.sin(u * 6),
          -80, -65, 9 + 4 * u, 0.06, u, rng() * 6.28, 1));
      }
      return s;
    },
    step(s, acts, dt, rng) {
      for (const a of acts) {
        if (a.id === 'draft') s.windTarget = clamp(Number(a.value) || 0, -1, 1);
        if (a.id === 'smolder') s.heatTarget = clamp(Number(a.value) || 0.1, 0.1, 1.2);
        if (a.id === 'waft' && a.value) {
          const dx = clamp(Number(a.value.dx) || 0, -500, 500);
          const dy = clamp(Number(a.value.dy) || 0, -400, 400);
          s.windTarget = clamp(dx / 250, -1, 1);
          for (const p of s.smoke) { p.vx += dx * 0.4; p.vy += dy * 0.4; }
          s.events.push({ type: 'waft', direction: [dx, dy] });
        }
      }
      let remaining = dt;
      while (remaining > 1e-8) {
        const h = Math.min(1 / 60, remaining);
        advance(s, h, rng); remaining -= h;
      }
    },
    proxy(s) {
      return { regions, figures: [], boxes: s.vessel, media: [density(s)] };
    },
    replay: {
      duration: 9,
      actions: [
        { t: 0, id: 'draft', value: -0.20 },
        { t: 0, id: 'smolder', value: 0.38 },
        { t: 1.04, id: 'draft', value: -0.72 },
        { t: 1.88, id: 'draft', value: -0.08 },
        { t: 2.80, id: 'smolder', value: 0.49 },
        { t: 3.12, id: 'draft', value: -0.20 },
        { t: 3.92, id: 'draft', value: -0.64 },
        { t: 3.92, id: 'smolder', value: 0.95 },
        { t: 4.44, id: 'draft', value: 0.14 },
        { t: 4.88, id: 'smolder', value: 1.16 },
        { t: 5.08, id: 'draft', value: 0.44 },
        { t: 5.60, id: 'draft', value: 0.97 },
        { t: 6.28, id: 'smolder', value: 0.68 },
        { t: 6.48, id: 'draft', value: 0.88 },
        { t: 7.32, id: 'draft', value: 0.53 },
        { t: 7.84, id: 'draft', value: 0.18 },
        { t: 7.84, id: 'smolder', value: 0.42 }
      ]
    }
  };
})();
