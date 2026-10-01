// Tennis rally, static broadcast camera. Near player is controlled; far player is a built-in opponent.
(function () {
  const POSES = {"nearIdle":{"nose":[-3.2,-168.3],"left_eye":[-4.2,-172.8],"right_eye":[0.2,-169.8],"left_ear":[-11.8,-167.3],"right_ear":[5.8,-164.8],"left_shoulder":[-22.8,-147.8],"right_shoulder":[10.2,-140.8],"left_elbow":[-31.3,-148.8],"right_elbow":[10.8,-105.2],"left_wrist":[-1.2,-119.7],"right_wrist":[27.8,-119.7],"left_hip":[-28.3,-84.1],"right_hip":[-1.2,-83.1],"left_knee":[-30.3,-50.6],"right_knee":[34.4,-52.6],"left_ankle":[-45.8,-7.5],"right_ankle":[45.9,0.0]},"nearSwing":[[0.0,{"nose":[76.0,-160.4],"left_eye":[77.5,-164.3],"right_eye":[75.5,-163.8],"left_ear":[66.6,-165.3],"right_ear":[75.5,-159.4],"left_shoulder":[48.9,-156.0],"right_shoulder":[55.3,-135.8],"left_elbow":[34.2,-155.5],"right_elbow":[52.4,-101.9],"left_wrist":[7.1,-154.0],"right_wrist":[61.7,-79.2],"left_hip":[10.1,-101.9],"right_hip":[25.3,-91.5],"left_knee":[32.7,-62.0],"right_knee":[42.5,-40.9],"left_ankle":[-10.1,-53.6],"right_ankle":[10.1,0.0]}],[0.067,{"nose":[72.1,-165.1],"left_eye":[73.7,-169.8],"right_eye":[73.7,-167.2],"left_ear":[60.7,-170.9],"right_ear":[72.7,-164.1],"left_shoulder":[39.3,-167.2],"right_shoulder":[62.3,-135.4],"left_elbow":[9.6,-155.7],"right_elbow":[64.3,-100.5],"left_wrist":[-13.3,-149.5],"right_wrist":[87.3,-76.6],"left_hip":[7.6,-104.7],"right_hip":[23.7,-93.2],"left_knee":[44.5,-67.7],"right_knee":[21.1,-34.9],"left_ankle":[18.0,-30.2],"right_ankle":[-18.0,0.0]}],[0.133,{"nose":[53.5,-157.1],"left_eye":[56.4,-160.5],"right_eye":[54.5,-159.5],"left_ear":[44.2,-163.9],"right_ear":[53.0,-157.6],"left_shoulder":[17.2,-155.1],"right_shoulder":[51.0,-138.4],"left_elbow":[-12.3,-142.3],"right_elbow":[57.9,-109.0],"left_wrist":[-20.6,-157.6],"right_wrist":[58.9,-109.5],"left_hip":[-3.5,-89.8],"right_hip":[12.3,-86.4],"left_knee":[42.7,-59.4],"right_knee":[-7.9,-31.9],"left_ankle":[53.5,-15.2],"right_ankle":[-53.5,0.0]}],[0.2,{"nose":[39.2,-140.5],"left_eye":[41.8,-143.6],"right_eye":[33.8,-145.4],"left_ear":[44.8,-139.9],"right_ear":[27.0,-143.6],"left_shoulder":[45.4,-123.3],"right_shoulder":[5.5,-129.5],"left_elbow":[51.5,-117.8],"right_elbow":[-22.8,-123.3],"left_wrist":[54.0,-149.7],"right_wrist":[-21.5,-149.1],"left_hip":[11.6,-70.6],"right_hip":[1.2,-71.8],"left_knee":[-19.1,-15.3],"right_knee":[44.1,-38.0],"left_ankle":[-69.4,-1.8],"right_ankle":[69.3,0.0]}],[0.267,{"nose":[22.6,-152.3],"left_eye":[24.3,-154.1],"right_eye":[19.6,-154.1],"left_ear":[24.3,-152.3],"right_ear":[16.7,-150.0],"left_shoulder":[-9.7,-135.9],"right_shoulder":[25.5,-131.8],"left_elbow":[-39.0,-131.8],"right_elbow":[27.8,-135.3],"left_wrist":[-31.9,-149.4],"right_wrist":[19.6,-180.5],"left_hip":[-11.4,-72.1],"right_hip":[5.0,-71.5],"left_knee":[-22.6,-21.7],"right_knee":[38.4,-38.1],"left_ankle":[-63.6,-30.5],"right_ankle":[63.6,0.0]}],[0.334,{"nose":[23.8,-148.8],"left_eye":[27.0,-152.4],"right_eye":[17.5,-152.4],"left_ear":[25.8,-145.1],"right_ear":[10.2,-145.1],"left_shoulder":[28.0,-128.9],"right_shoulder":[-8.7,-128.3],"left_elbow":[38.5,-158.2],"right_elbow":[-34.3,-120.0],"left_wrist":[-32.2,-139.9],"right_wrist":[-29.7,-140.9],"left_hip":[-14.0,-71.3],"right_hip":[-9.2,-72.3],"left_knee":[-1.3,-6.3],"right_knee":[41.0,-48.2],"left_ankle":[-40.0,-25.7],"right_ankle":[40.0,0.0]}],[0.4,{"nose":[18.7,-148.2],"left_eye":[19.7,-153.8],"right_eye":[19.2,-151.5],"left_ear":[1.1,-153.8],"right_ear":[15.5,-150.1],"left_shoulder":[-22.5,-135.2],"right_shoulder":[12.2,-132.5],"left_elbow":[-26.7,-140.3],"right_elbow":[38.2,-146.4],"left_wrist":[7.1,-146.8],"right_wrist":[21.0,-162.6],"left_hip":[-29.0,-70.9],"right_hip":[-9.1,-68.5],"left_knee":[22.0,-55.1],"right_knee":[23.8,-16.2],"left_ankle":[10.9,0.0],"right_ankle":[-10.9,-7.8]}],[0.467,{"nose":[2.5,-161.1],"left_eye":[3.5,-165.6],"right_eye":[2.5,-163.6],"left_ear":[-13.4,-163.6],"right_ear":[2.0,-161.6],"left_shoulder":[-27.8,-148.2],"right_shoulder":[1.5,-143.7],"left_elbow":[-25.3,-135.7],"right_elbow":[33.3,-136.7],"left_wrist":[-6.9,-155.6],"right_wrist":[35.3,-161.1],"left_hip":[-43.7,-88.5],"right_hip":[-18.9,-83.0],"left_knee":[-8.9,-64.1],"right_knee":[22.4,-48.7],"left_ankle":[-19.4,-29.3],"right_ankle":[19.4,0.0]}],[0.534,{"nose":[-21.5,-162.0],"left_eye":[-18.5,-164.0],"right_eye":[-19.0,-162.0],"left_ear":[-32.0,-162.0],"right_ear":[-11.7,-159.0],"left_shoulder":[-48.3,-148.1],"right_shoulder":[-11.2,-137.7],"left_elbow":[-46.3,-129.8],"right_elbow":[15.2,-115.9],"left_wrist":[-24.5,-132.3],"right_wrist":[39.3,-130.3],"left_hip":[-57.8,-86.2],"right_hip":[-27.0,-82.7],"left_knee":[-35.0,-64.9],"right_knee":[11.7,-41.1],"left_ankle":[-44.8,-34.2],"right_ankle":[44.8,0.0]}]],"farIdle":{"nose":[7.5,-68.4],"left_eye":[9.1,-70.6],"right_eye":[6.0,-70.6],"left_ear":[11.5,-68.2],"right_ear":[2.5,-68.6],"left_shoulder":[15.1,-58.5],"right_shoulder":[-1.4,-59.6],"left_elbow":[17.1,-46.7],"right_elbow":[-4.4,-49.1],"left_wrist":[12.0,-39.4],"right_wrist":[-0.1,-45.0],"left_hip":[12.0,-33.4],"right_hip":[1.6,-33.6],"left_knee":[8.5,-16.2],"right_knee":[-10.4,-17.7],"left_ankle":[16.6,0.0],"right_ankle":[-16.6,-3.9]},"farSwing":[[0.0,{"nose":[18.6,-62.4],"left_eye":[20.4,-65.5],"right_eye":[17.4,-64.3],"left_ear":[9.2,-64.5],"right_ear":[14.9,-63.6],"left_shoulder":[3.2,-57.0],"right_shoulder":[13.9,-55.3],"left_elbow":[-2.5,-44.2],"right_elbow":[17.0,-42.0],"left_wrist":[17.2,-39.9],"right_wrist":[19.8,-38.5],"left_hip":[-4.3,-32.2],"right_hip":[3.4,-31.6],"left_knee":[7.0,-17.0],"right_knee":[20.2,-17.8],"left_ankle":[-7.6,0.0],"right_ankle":[7.6,-0.6]}],[0.067,{"nose":[16.0,-65.0],"left_eye":[15.4,-66.7],"right_eye":[14.9,-65.9],"left_ear":[6.1,-65.5],"right_ear":[11.8,-64.8],"left_shoulder":[0.2,-56.8],"right_shoulder":[12.2,-54.7],"left_elbow":[-3.4,-43.9],"right_elbow":[13.0,-42.4],"left_wrist":[13.5,-37.8],"right_wrist":[17.9,-30.8],"left_hip":[-7.4,-31.9],"right_hip":[2.5,-31.7],"left_knee":[-3.0,-17.5],"right_knee":[21.1,-20.3],"left_ankle":[-19.5,-3.4],"right_ankle":[19.6,0.0]}],[0.133,{"nose":[18.5,-65.0],"left_eye":[18.5,-67.0],"right_eye":[17.4,-66.8],"left_ear":[12.6,-66.1],"right_ear":[13.5,-65.2],"left_shoulder":[2.4,-57.9],"right_shoulder":[14.0,-54.5],"left_elbow":[-2.6,-47.7],"right_elbow":[12.4,-42.9],"left_wrist":[7.9,-39.3],"right_wrist":[15.8,-31.8],"left_hip":[-5.6,-35.2],"right_hip":[3.1,-34.1],"left_knee":[-7.1,-17.2],"right_knee":[22.0,-21.6],"left_ankle":[-26.7,-6.3],"right_ankle":[26.7,0.0]}],[0.2,{"nose":[22.4,-62.7],"left_eye":[22.8,-64.9],"right_eye":[20.7,-64.7],"left_ear":[20.9,-64.4],"right_ear":[16.0,-64.2],"left_shoulder":[7.7,-55.5],"right_shoulder":[13.5,-55.1],"left_elbow":[16.0,-44.9],"right_elbow":[16.2,-44.1],"left_wrist":[22.2,-42.0],"right_wrist":[23.0,-41.7],"left_hip":[-0.7,-34.3],"right_hip":[6.9,-34.5],"left_knee":[-3.9,-15.7],"right_knee":[23.0,-22.9],"left_ankle":[-23.9,-11.0],"right_ankle":[23.9,0.0]}],[0.267,{"nose":[26.8,-60.4],"left_eye":[28.1,-62.3],"right_eye":[25.1,-62.8],"left_ear":[28.8,-62.0],"right_ear":[19.9,-63.2],"left_shoulder":[27.6,-57.8],"right_shoulder":[14.0,-56.9],"left_elbow":[33.3,-52.2],"right_elbow":[16.6,-44.2],"left_wrist":[36.8,-45.4],"right_wrist":[27.4,-43.0],"left_hip":[10.8,-36.2],"right_hip":[7.9,-36.4],"left_knee":[1.3,-16.7],"right_knee":[22.5,-25.4],"left_ankle":[-21.9,-16.7],"right_ankle":[21.8,0.0]}],[0.334,{"nose":[29.3,-62.4],"left_eye":[31.2,-63.7],"right_eye":[27.2,-64.1],"left_ear":[32.5,-63.7],"right_ear":[23.7,-64.7],"left_shoulder":[22.2,-60.7],"right_shoulder":[17.1,-60.4],"left_elbow":[33.6,-50.1],"right_elbow":[17.3,-48.0],"left_wrist":[33.4,-48.6],"right_wrist":[27.4,-46.7],"left_hip":[10.0,-41.7],"right_hip":[9.3,-42.4],"left_knee":[5.2,-18.7],"right_knee":[20.1,-24.5],"left_ankle":[-17.3,-21.8],"right_ankle":[17.3,0.0]}],[0.4,{"nose":[28.1,-61.0],"left_eye":[28.7,-62.4],"right_eye":[27.5,-62.4],"left_ear":[27.5,-64.0],"right_ear":[24.1,-63.4],"left_shoulder":[13.8,-61.6],"right_shoulder":[16.2,-60.4],"left_elbow":[12.4,-51.9],"right_elbow":[13.8,-49.7],"left_wrist":[17.7,-49.9],"right_wrist":[17.5,-46.9],"left_hip":[2.3,-40.8],"right_hip":[8.2,-40.6],"left_knee":[6.1,-20.0],"right_knee":[12.8,-20.4],"left_ankle":[-7.6,-22.6],"right_ankle":[7.6,0.0]}]]};
  const FPS = 29.97;
  const G = 900;              // screen-space gravity on the ball, px/s^2
  const NEAR_SPEED = 700, FAR_SPEED = 260;
  const FAR_REACH = 140, NEAR_REACH = 300, FAR_GIVEUP = 250;
  const U = () => SimKit.util;

  function launch(b, from, to, T) {
    b.x = from[0]; b.y = from[1];
    b.vx = (to[0] - from[0]) / T;
    b.vy = (to[1] - from[1] - 0.5 * G * T * T) / T;
    b.tx = to[0]; b.ty = to[1]; b.T = T; b.age = 0; b.live = true;
  }

  window.World = {
    meta: { name: "tennis rally", source: [1920, 1080], fps: FPS, dt: 1 / 60 },
    actions: [
      { id: "move", kind: "drag", description: "run toward a court position (x, y)" },
      { id: "swing", kind: "drag", description: "swing; drag direction aims the shot (dx, dy from ball), optional T flight time" },
      { id: "left", kind: "hold", keys: ["ArrowLeft", "a"], description: "move left" },
      { id: "right", kind: "hold", keys: ["ArrowRight", "d"], description: "move right" },
      { id: "up", kind: "hold", keys: ["ArrowUp", "w"], description: "move up" },
      { id: "down", kind: "hold", keys: ["ArrowDown", "s"], description: "move down" },
    ],

    init(rng) {
      const s = {
        t: 0, events: [],
        near: { x: 539, y: 832, goal: null, swingT: -1, mirror: false },
        far: { x: 1000, y: 215, goal: 1000, swingT: -1, mirror: false, chase: false },
        // opponent's built-in shot plan: where it aims its returns and how long they fly
        farPlan: [[[525, 790], 1.17], [[1420, 880], 1.87], [[845, 850], 1.03], [[1070, 740], 1.4]],
        farIdx: 0,
        ball: { x: 999, y: 92, vx: 0, vy: 0, tx: 0, ty: 0, T: 1, age: 0, live: true, toward: "near", dead: false },
      };
      launch(s.ball, [999, 92], [690, 680], 0.9);   // far player's serve
      s.far.swingT = 0;
      return s;
    },

    step(s, acts, dt, rng) {
      const n = s.near, f = s.far, b = s.ball;
      s.t += dt;
      let hx = 0, hy = 0;
      for (const a of acts) {
        if (a.id === "left") hx -= 1; if (a.id === "right") hx += 1;
        if (a.id === "up") hy -= 1; if (a.id === "down") hy += 1;
        if (a.id === "move" && a.value) n.goal = [a.value.x, a.value.y];
        if (a.id === "swing") {
          n.swingT = 0.2;
          const v = a.value || { dx: 960 - b.x, dy: 200 - b.y };
          n.mirror = b.x < n.x;
          const c = [n.x, n.y - 120];
          if (b.live && !b.dead && b.toward === "near" && U().dist([b.x, b.y], c) < NEAR_REACH) {
            const to = [U().clamp(b.x + v.dx, 600, 1320), U().clamp(b.y + v.dy, 150, 260)];
            const T = v.T || Math.max(0.8, U().dist([b.x, b.y], to) / 600);
            launch(b, [b.x, b.y], to, T); b.toward = "far";
            s.events.push({ type: "hit", by: "near_player" });
            f.chase = Math.abs(to[0] - f.x) <= FAR_GIVEUP;
            f.goal = f.chase ? to[0] : f.x;
          } else s.events.push({ type: "swing_miss", by: "near_player" });
        }
      }
      // near player motion
      if (hx || hy) { n.goal = null; n.x += hx * NEAR_SPEED * 0.6 * dt; n.y += hy * NEAR_SPEED * 0.4 * dt; }
      else if (n.goal) {
        const dx = n.goal[0] - n.x, dy = n.goal[1] - n.y, d = Math.hypot(dx, dy);
        const sp = Math.min(NEAR_SPEED, d * 4);
        if (d > 0.5) { n.x += dx / d * sp * dt; n.y += dy / d * sp * dt; }
      }
      n.x = U().clamp(n.x, 150, 1770); n.y = U().clamp(n.y, 640, 1075);
      // far player: chase the incoming ball's target, otherwise recover to the centre
      const fg = (b.toward === "far" && !b.dead) ? f.goal : 960;
      const fdx = fg - f.x;
      f.x += U().clamp(fdx, -FAR_SPEED * dt, FAR_SPEED * dt);
      if (n.swingT >= 0) n.swingT += dt;
      if (f.swingT >= 0) f.swingT += dt;
      // ball
      if (b.live) {
        b.age += dt;
        b.x += b.vx * dt; b.vy += G * dt; b.y += b.vy * dt;
        if (!b.dead && b.toward === "far" && b.age >= b.T) {
          if (f.chase && Math.abs(b.x - f.x) < FAR_REACH && s.farIdx < s.farPlan.length) {
            const [to, T] = s.farPlan[s.farIdx++];
            f.mirror = to[0] > f.x; f.swingT = 0;
            launch(b, [b.x, b.y], to, T); b.toward = "near";
            s.events.push({ type: "hit", by: "far_player" });
          } else { b.dead = true; s.events.push({ type: "point", winner: "near_player" }); }
        }
        if (!b.dead && b.toward === "near" && b.age > b.T + 0.6) { b.dead = true; s.events.push({ type: "point", winner: "far_player" }); }
        if (b.dead && (b.y < -50 || b.y > 1130 || b.age > b.T + 1.2)) b.live = false;
      }
    },

    proxy(s) {
      const P = SimKit.pose;
      const regions = [
        { cls: "ground", rect: [0, 0, 1920, 1080] },
        { cls: "wall", rect: [0, 0, 1920, 140] },
        { cls: "structure", polygon: [[0, 140], [300, 140], [120, 420], [0, 520]] },
        { cls: "structure", polygon: [[1540, 140], [1920, 140], [1920, 520], [1700, 300]] },
        { cls: "court", polygon: [[540, 234], [1380, 234], [1640, 870], [280, 870]] },
        // lines: baselines, sidelines, service lines, centre line
        { cls: "line", polygon: [[645, 231], [1278, 231], [1278, 237], [645, 237]] },
        { cls: "line", polygon: [[294, 852], [1623, 852], [1623, 858], [294, 858]] },
        { cls: "line", polygon: [[643, 234], [649, 234], [298, 855], [290, 855]] },
        { cls: "line", polygon: [[1274, 234], [1280, 234], [1627, 855], [1619, 855]] },
        { cls: "line", polygon: [[703, 234], [708, 234], [469, 855], [462, 855]] },
        { cls: "line", polygon: [[1210, 234], [1215, 234], [1452, 855], [1446, 855]] },
        { cls: "line", polygon: [[682, 314], [1240, 314], [1240, 319], [682, 319]] },
        { cls: "line", polygon: [[580, 615], [1340, 615], [1340, 621], [580, 621]] },
        { cls: "line", polygon: [[956, 314], [961, 314], [961, 618], [956, 618]] },
        { cls: "obstacle", polygon: [[555, 375], [1365, 375], [1365, 402], [555, 402]] },  // net
        { cls: "structure", rect: [360, 170, 60, 140] },   // umpire chair
      ];
      const fig = (who, idle, swing, h) => {
        let p = idle;
        if (who.swingT >= 0 && who.swingT < swing[swing.length - 1][0]) p = P.sample(swing, who.swingT);
        if (who.mirror) p = P.mirror(p, 0);
        return P.placeAt(P.translate(p, 0, 0), [who.x, who.y]);
      };
      const figures = [
        { cls: "human", joints: fig(s.far, POSES.farIdle, POSES.farSwing), thickness: 4 },
        { cls: "human", joints: fig(s.near, POSES.nearIdle, POSES.nearSwing), thickness: 9 },
      ];
      const boxes = [];
      if (s.ball.live) boxes.push({ cls: "projectile", center: [s.ball.x, s.ball.y], size: [12 + 8 * (s.ball.y / 1080), 12 + 8 * (s.ball.y / 1080)] });
      return { regions, figures, boxes, media: [] };
    },

    replay: { duration: 14.48, actions: [] },
  };

  // near player run targets read from the track every 15 frames
  const path = [[0,539,832],[15,568,827],[30,524,804],[45,540,811],[60,657,832],[75,659,853],[90,488,898],[105,519,882],[120,543,886],[135,629,896],[150,737,914],[165,932,917],[180,1203,950],[195,1476,960],[210,1510,945],[225,1332,940],[240,1131,962],[255,806,984],[270,615,1038],[285,596,1068],[300,742,1020],[315,802,1008],[330,1022,993],[345,1084,933],[360,1108,914],[375,1038,908],[390,999,903],[405,942,910],[420,886,910]];
  const acts = World.replay.actions;
  for (const [fr, x, y] of path) acts.push({ t: +(fr / FPS).toFixed(3), id: "move", value: { x, y } });
  const swings = [[27, 440, -480, 1.27], [100, 315, -610, 1.07], [188, -380, -685, 1.2], [255, 279, -676, 1.5], [342, -430, -550, 1.4]];
  for (const [fr, dx, dy, T] of swings) acts.push({ t: +(fr / FPS).toFixed(3), id: "swing", value: { dx, dy, T } });
  acts.sort((a, b) => a.t - b.t);
})();
