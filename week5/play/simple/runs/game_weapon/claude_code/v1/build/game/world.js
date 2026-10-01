// First-person shooter in a concrete canal: the player looks around and raises a scoped rifle
// (aim down sights), which zooms the view ~3.5x and fills the frame with the scope, then lowers it.
window.World = {
  meta: { name: "fps scope aim", source: [700, 480], fps: 16, dt: 1 / 60 },

  actions: [
    { id: "aim", kind: "hold", keys: ["Shift", "m"], description: "aim down sights (scope zoom)" },
    { id: "left", kind: "hold", keys: ["ArrowLeft", "a"], description: "look left" },
    { id: "right", kind: "hold", keys: ["ArrowRight", "d"], description: "look right" },
    { id: "up", kind: "hold", keys: ["ArrowUp", "w"], description: "look up" },
    { id: "down", kind: "hold", keys: ["ArrowDown", "s"], description: "look down" },
    { id: "fire", kind: "tap", keys: [" "], description: "fire" }
  ],

  init(rng) {
    return { t: 0, yaw: 0, pitch: 0, ads: 0, recoil: 0, bob: 0, shots: [], events: [] };
  },

  step(s, acts, dt, rng) {
    const U = SimKit.util;
    const on = id => acts.some(a => a.id === id);
    s.t += dt;
    const look = 60; // px/s of view pan at hip
    const lk = look / (1 + 2.5 * s.ads);
    if (on("left")) s.yaw -= lk * dt;
    if (on("right")) s.yaw += lk * dt;
    if (on("up")) s.pitch -= lk * dt;
    if (on("down")) s.pitch += lk * dt;
    const prev = s.ads;
    // raising the scope takes ~0.25 s, lowering ~0.3 s
    s.ads = U.clamp(s.ads + (on("aim") ? dt / 0.25 : -dt / 0.3), 0, 1);
    if (prev < 1 && s.ads === 1) s.events.push({ type: "scoped_in" });
    if (prev > 0 && s.ads === 0) s.events.push({ type: "scoped_out" });
    if (on("fire")) {
      s.recoil = 1;
      s.shots.push({ x: 350, y: 240, life: 0.15 });
      s.events.push({ type: "fire" });
    }
    s.recoil = Math.max(0, s.recoil - dt / 0.2);
    s.bob += dt;
    for (const p of s.shots) p.life -= dt;
    s.shots = s.shots.filter(p => p.life > 0);
  },

  proxy(s) {
    const U = SimKit.util;
    const e = U.smoothstep(0, 1, s.ads);
    const z = 1 + 2.5 * e; // view zoom
    const cx = 350, cy = 240;
    const T = ([x, y]) => [cx + (x - cx - s.yaw) * z, cy + (y - cy - s.pitch) * z];
    const P = pts => pts.map(T);
    const regions = [
      { cls: "sky", rect: [0, 0, 700, 480] },
      // distant city/skyline behind the canal wall
      { cls: "structure", polygon: P([[-400, 140], [0, 120], [180, 70], [420, 0], [1100, 0], [1100, 140]]) },
      // sloped concrete canal wall, top edge rising to the right
      { cls: "wall", polygon: P([[-400, 300], [0, 270], [300, 160], [700, 30], [1100, -60], [1100, 330], [700, 330], [0, 300]]) },
      // railing/fence along the wall top
      { cls: "structure", polygon: P([[0, 120], [180, 70], [420, 0], [700, -40], [700, -10], [420, 30], [180, 95], [0, 140]]) },
      // canal floor
      { cls: "ground", polygon: P([[-400, 300], [0, 290], [700, 320], [1100, 330], [1100, 900], [-400, 900]]) }
    ];
    const boxes = [];
    // rifle: held low right at hip, moves to centre and fills frame when scoped
    const sway = 3 * Math.sin(s.bob * 2.2) * (1 - e);
    const rec = 12 * s.recoil;
    const gx = U.lerp(520, 350, e), gy = U.lerp(360, 250, e) + sway + rec;
    const gw = U.lerp(220, 900, e), gh = U.lerp(170, 560, e);
    if (e < 0.85) {
      boxes.push({ cls: "tool", center: [gx, gy], size: [gw, gh], angle: U.lerp(-0.25, 0, e) });
      // scope lens on the rifle
      boxes.push({ cls: "prop", center: [gx + 30 * (1 - e), gy - 20 * (1 - e)], size: [gw * 0.5, gh * 0.4], angle: U.lerp(-0.25, 0, e) });
    } else {
      // scope housing framing the view: top arc, bottom rim, sides
      boxes.push({ cls: "tool", center: [350, 25 + rec], size: [720, 70] });
      boxes.push({ cls: "tool", center: [350, 470 + rec], size: [500, 40] });
      boxes.push({ cls: "tool", center: [15, 240], size: [40, 480] });
      boxes.push({ cls: "tool", center: [685, 240], size: [40, 480] });
      // reticle stem at the bottom centre
      boxes.push({ cls: "prop", center: [350, 440 + rec], size: [90, 40] });
    }
    for (const p of s.shots) boxes.push({ cls: "projectile", center: [p.x, p.y], size: [6, 6] });
    return { regions, figures: [], boxes, media: [] };
  },

  replay: {
    duration: 5.06,
    actions: [
      { t: 0.0, id: "right", until: 0.75 },
      { t: 0.0, id: "up", until: 0.4 },
      { t: 0.7, id: "aim", until: 3.45 },
      { t: 3.6, id: "right", until: 4.3 },
      { t: 3.6, id: "down", until: 4.0 }
    ]
  }
};
