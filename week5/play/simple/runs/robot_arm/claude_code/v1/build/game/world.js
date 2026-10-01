// Robot arm (top-down-ish side view) picking and placing a small box on a white table.
(function () {
  const HOME = [600, 680];
  const BASE = [1000, 600], SHOULDER = [1000, 400];
  const L1 = 420, L2 = 380, WRIST_DROP = 140;
  const SPEED = 900;
  function ik(tip) {
    const w = [tip[0], tip[1] - WRIST_DROP];
    const dx = w[0] - SHOULDER[0], dy = w[1] - SHOULDER[1];
    let d = Math.hypot(dx, dy); d = SimKit.util.clamp(d, 60, L1 + L2 - 1);
    const a = Math.atan2(dy, dx);
    const c = (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d);
    const b = Math.acos(SimKit.util.clamp(c, -1, 1));
    const ang = a + b; // elbow up
    const e = [SHOULDER[0] + L1 * Math.cos(ang), SHOULDER[1] + L1 * Math.sin(ang)];
    return { elbow: e, wrist: w };
  }
  window.World = {
    meta: { name: "robot arm pick and place", source: [1920, 1080], fps: 56.32, dt: 1 / 60 },
    actions: [
      { id: "moveto", kind: "drag", description: "move gripper to pointer position" },
      { id: "left", kind: "hold", keys: ["ArrowLeft", "a"], description: "move gripper left" },
      { id: "right", kind: "hold", keys: ["ArrowRight", "d"], description: "move gripper right" },
      { id: "up", kind: "hold", keys: ["ArrowUp", "w"], description: "move gripper up" },
      { id: "down", kind: "hold", keys: ["ArrowDown", "s"], description: "move gripper down" },
      { id: "grasp", kind: "tap", keys: [" "], description: "close / open gripper" },
    ],
    init(rng) {
      return { t: 0, tip: HOME.slice(), target: HOME.slice(), closed: false, open: 1,
        box: { x: 1240, y: 930, held: false, vy: 0 }, events: [] };
    },
    step(s, acts, dt, rng) {
      s.t += dt;
      for (const a of acts) {
        if (a.id === "moveto" && a.value) s.target = [a.value.x, a.value.y];
        if (a.id === "left") s.target[0] -= SPEED * dt;
        if (a.id === "right") s.target[0] += SPEED * dt;
        if (a.id === "up") s.target[1] -= SPEED * dt;
        if (a.id === "down") s.target[1] += SPEED * dt;
        if (a.id === "grasp") {
          s.closed = !s.closed;
          const b = s.box;
          if (s.closed && Math.hypot(b.x - s.tip[0], b.y - s.tip[1] - 30) < 90) { b.held = true; s.events.push({ type: "grasp" }); }
          if (!s.closed && b.held) { b.held = false; s.events.push({ type: "release" }); }
        }
      }
      s.target[0] = SimKit.util.clamp(s.target[0], 300, 1500);
      s.target[1] = SimKit.util.clamp(s.target[1], 450, 1000);
      const dx = s.target[0] - s.tip[0], dy = s.target[1] - s.tip[1], d = Math.hypot(dx, dy);
      const m = Math.min(d, SPEED * dt);
      if (d > 0) { s.tip[0] += dx / d * m; s.tip[1] += dy / d * m; }
      s.open += ((s.closed ? 0 : 1) - s.open) * Math.min(1, dt * 10);
      const b = s.box;
      if (b.held) { b.x = s.tip[0]; b.y = s.tip[1] + 30; b.vy = 0; }
      else { // drop to table surface (y depends on depth; keep at current or settle)
        const floorY = Math.max(860, Math.min(1060, b.y));
        if (b.y < floorY) { b.vy += 2000 * dt; b.y = Math.min(floorY, b.y + b.vy * dt); } else b.vy = 0;
      }
    },
    proxy(s) {
      const { elbow, wrist } = ik(s.tip);
      const g = 22 + 22 * s.open, tip = s.tip;
      return {
        regions: [
          { cls: "wall", rect: [0, 0, 1920, 760] },
          { cls: "screen", rect: [900, 0, 680, 290] },
          { cls: "floor", rect: [0, 760, 1920, 320] },
          { cls: "table", polygon: [[330, 650], [1440, 650], [1500, 1080], [250, 1080]] },
          { cls: "table", polygon: [[0, 560], [480, 560], [330, 900], [0, 900]] },
          { cls: "structure", rect: [80, 760, 140, 320] },
        ],
        figures: [{ cls: "robot", thickness: 70,
          chain: [BASE, SHOULDER, elbow, wrist, [tip[0], tip[1] - 40]],
          fingers: [[[tip[0] - 20, tip[1] - 40], [tip[0] - g, tip[1] + 30]], [[tip[0] + 20, tip[1] - 40], [tip[0] + g, tip[1] + 30]]] }],
        boxes: [{ cls: "object", center: [s.box.x, s.box.y], size: [90, 70], angle: 0 },
                { cls: "static", center: [130, 470], size: [120, 140] }],
        media: [],
      };
    },
    replay: { duration: 9.52, actions: [] },
  };
  // pick-and-place cycles: home -> above box -> grasp -> carry -> release -> home
  const R = window.World.replay.actions;
  const mv = (t, x, y) => R.push({ t, id: "moveto", value: { dx: 0, dy: 0, x, y } });
  function cycle(t0, from, to) {
    mv(t0, from[0], from[1] - 60); mv(t0 + 0.75, from[0], from[1] - 30);
    R.push({ t: t0 + 0.85, id: "grasp" });
    mv(t0 + 0.95, to[0], to[1] - 30);
    R.push({ t: t0 + 1.75, id: "grasp" });
    mv(t0 + 1.85, HOME[0], HOME[1]);
  }
  cycle(0.2, [1240, 930], [620, 900]);
  cycle(2.6, [620, 900], [1240, 960]);
  cycle(4.6, [1240, 960], [1240, 1020]);
  cycle(6.9, [1240, 1020], [1240, 1060]);
})();
