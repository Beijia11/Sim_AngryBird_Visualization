// Badminton rally proxy: near player (controlled), far player (AI), shuttle with arc flights.
(function () {
  const P = {"nearIdle":{"nose":[620,360],"left_eye":[622,358],"right_eye":[620,358],"left_ear":[616,363],"right_ear":[627,361],"left_shoulder":[614,384],"right_shoulder":[641,377],"left_elbow":[605,405],"right_elbow":[651,399],"left_wrist":[593,419],"right_wrist":[645,406],"left_hip":[630,422],"right_hip":[646,419],"left_knee":[609,450],"right_knee":[643,434],"left_ankle":[610,484],"right_ankle":[648,458]},"farIdle":{"nose":[601,216],"left_eye":[602,214],"right_eye":[599,215],"left_ear":[606,214],"right_ear":[597,217],"left_shoulder":[614,220],"right_shoulder":[596,226],"left_elbow":[626,222],"right_elbow":[594,238],"left_wrist":[634,227],"right_wrist":[590,249],"left_hip":[609,250],"right_hip":[600,248],"left_knee":[599,267],"right_knee":[603,266],"left_ankle":[584,275],"right_ankle":[593,286]},"nearSwing":[[0.0,{"nose":[686,390],"left_eye":[688,386],"right_eye":[686,388],"left_ear":[678,391],"right_ear":[690,392],"left_shoulder":[674,402],"right_shoulder":[695,411],"left_elbow":[677,418],"right_elbow":[702,430],"left_wrist":[688,422],"right_wrist":[725,426],"left_hip":[664,448],"right_hip":[681,452],"left_knee":[652,476],"right_knee":[683,484],"left_ankle":[636,505],"right_ankle":[673,513]}],[0.08,{"nose":[700,388],"left_eye":[700,384],"right_eye":[700,386],"left_ear":[691,392],"right_ear":[698,392],"left_shoulder":[690,405],"right_shoulder":[700,411],"left_elbow":[693,424],"right_elbow":[702,430],"left_wrist":[710,420],"right_wrist":[722,420],"left_hip":[681,449],"right_hip":[695,452],"left_knee":[673,478],"right_knee":[694,484],"left_ankle":[649,509],"right_ankle":[687,514]}],[0.16,{"nose":[706,394],"left_eye":[704,392],"right_eye":[708,393],"left_ear":[698,395],"right_ear":[711,395],"left_shoulder":[698,409],"right_shoulder":[715,414],"left_elbow":[698,412],"right_elbow":[716,432],"left_wrist":[712,419],"right_wrist":[720,416],"left_hip":[694,455],"right_hip":[708,458],"left_knee":[683,482],"right_knee":[711,493],"left_ankle":[659,510],"right_ankle":[705,528]}],[0.24,{"nose":[715,406],"left_eye":[714,404],"right_eye":[717,405],"left_ear":[710,407],"right_ear":[720,406],"left_shoulder":[708,420],"right_shoulder":[728,425],"left_elbow":[712,415],"right_elbow":[744,424],"left_wrist":[728,399],"right_wrist":[739,414],"left_hip":[705,466],"right_hip":[721,469],"left_knee":[693,487],"right_knee":[729,505],"left_ankle":[669,516],"right_ankle":[726,544]}],[0.32,{"nose":[731,415],"left_eye":[730,413],"right_eye":[729,413],"left_ear":[722,418],"right_ear":[728,419],"left_shoulder":[717,432],"right_shoulder":[738,436],"left_elbow":[716,428],"right_elbow":[759,429],"left_wrist":[730,420],"right_wrist":[776,417],"left_hip":[718,478],"right_hip":[732,482],"left_knee":[707,498],"right_knee":[746,519],"left_ankle":[684,522],"right_ankle":[749,561]}],[0.4,{"nose":[735,436],"left_eye":[736,435],"right_eye":[737,435],"left_ear":[728,439],"right_ear":[739,439],"left_shoulder":[724,453],"right_shoulder":[747,456],"left_elbow":[724,455],"right_elbow":[776,457],"left_wrist":[740,448],"right_wrist":[794,445],"left_hip":[728,499],"right_hip":[743,502],"left_knee":[728,514],"right_knee":[762,540],"left_ankle":[703,532],"right_ankle":[771,582]}],[0.48,{"nose":[753,457],"left_eye":[753,455],"right_eye":[752,454],"left_ear":[746,460],"right_ear":[749,460],"left_shoulder":[736,473],"right_shoulder":[759,480],"left_elbow":[721,493],"right_elbow":[779,499],"left_wrist":[723,494],"right_wrist":[787,488],"left_hip":[736,517],"right_hip":[750,520],"left_knee":[752,541],"right_knee":[778,556],"left_ankle":[720,543],"right_ankle":[773,596]}],[0.56,{"nose":[758,463],"left_eye":[760,461],"right_eye":[759,461],"left_ear":[752,465],"right_ear":[761,466],"left_shoulder":[740,480],"right_shoulder":[766,492],"left_elbow":[730,502],"right_elbow":[768,516],"left_wrist":[723,522],"right_wrist":[766,512],"left_hip":[736,528],"right_hip":[751,530],"left_knee":[753,551],"right_knee":[781,557],"left_ankle":[728,548],"right_ankle":[774,594]}],[0.64,{"nose":[755,457],"left_eye":[756,453],"right_eye":[757,453],"left_ear":[749,459],"right_ear":[762,460],"left_shoulder":[738,475],"right_shoulder":[766,485],"left_elbow":[723,496],"right_elbow":[767,508],"left_wrist":[710,514],"right_wrist":[761,501],"left_hip":[731,524],"right_hip":[748,528],"left_knee":[736,532],"right_knee":[776,556],"left_ankle":[724,546],"right_ankle":[772,595]}]],"farSwing":[[0.0,{"nose":[727,231],"left_eye":[729,229],"right_eye":[726,229],"left_ear":[718,229],"right_ear":[721,229],"left_shoulder":[715,234],"right_shoulder":[716,242],"left_elbow":[720,245],"right_elbow":[721,256],"left_wrist":[727,253],"right_wrist":[731,268],"left_hip":[693,254],"right_hip":[696,257],"left_knee":[694,265],"right_knee":[713,271],"left_ankle":[681,267],"right_ankle":[725,287]}],[0.08,{"nose":[732,237],"left_eye":[733,235],"right_eye":[732,235],"left_ear":[722,234],"right_ear":[728,235],"left_shoulder":[719,237],"right_shoulder":[719,247],"left_elbow":[716,246],"right_elbow":[719,263],"left_wrist":[724,252],"right_wrist":[726,275],"left_hip":[700,257],"right_hip":[702,258],"left_knee":[703,273],"right_knee":[721,269],"left_ankle":[684,270],"right_ankle":[727,288]}],[0.16,{"nose":[732,236],"left_eye":[733,234],"right_eye":[731,235],"left_ear":[677,234],"right_ear":[727,234],"left_shoulder":[721,235],"right_shoulder":[717,246],"left_elbow":[718,249],"right_elbow":[711,262],"left_wrist":[719,258],"right_wrist":[712,278],"left_hip":[707,256],"right_hip":[702,257],"left_knee":[720,279],"right_knee":[720,269],"left_ankle":[693,271],"right_ankle":[726,272]}],[0.24,{"nose":[725,230],"left_eye":[726,228],"right_eye":[724,228],"left_ear":[709,308],"right_ear":[718,229],"left_shoulder":[722,233],"right_shoulder":[710,241],"left_elbow":[714,241],"right_elbow":[701,254],"left_wrist":[726,241],"right_wrist":[697,267],"left_hip":[710,253],"right_hip":[702,255],"left_knee":[716,273],"right_knee":[720,268],"left_ankle":[697,269],"right_ankle":[727,287]}],[0.32,{"nose":[715,220],"left_eye":[716,217],"right_eye":[713,217],"left_ear":[717,219],"right_ear":[708,219],"left_shoulder":[715,224],"right_shoulder":[699,230],"left_elbow":[718,230],"right_elbow":[689,242],"left_wrist":[727,236],"right_wrist":[686,259],"left_hip":[706,249],"right_hip":[698,252],"left_knee":[713,268],"right_knee":[717,268],"left_ankle":[695,271],"right_ankle":[727,287]}],[0.4,{"nose":[704,209],"left_eye":[706,206],"right_eye":[702,206],"left_ear":[707,208],"right_ear":[698,208],"left_shoulder":[707,216],"right_shoulder":[689,219],"left_elbow":[713,225],"right_elbow":[680,231],"left_wrist":[724,234],"right_wrist":[676,245],"left_hip":[700,242],"right_hip":[692,244],"left_knee":[706,261],"right_knee":[705,264],"left_ankle":[689,271],"right_ankle":[720,284]}],[0.48,{"nose":[696,202],"left_eye":[697,200],"right_eye":[694,200],"left_ear":[700,202],"right_ear":[690,201],"left_shoulder":[701,211],"right_shoulder":[682,212],"left_elbow":[708,221],"right_elbow":[673,225],"left_wrist":[718,231],"right_wrist":[669,239],"left_hip":[694,238],"right_hip":[684,239],"left_knee":[700,259],"right_knee":[696,258],"left_ankle":[686,273],"right_ankle":[706,280]}],[0.56,{"nose":[689,198],"left_eye":[691,196],"right_eye":[687,195],"left_ear":[693,197],"right_ear":[683,197],"left_shoulder":[695,207],"right_shoulder":[675,207],"left_elbow":[702,218],"right_elbow":[668,221],"left_wrist":[708,228],"right_wrist":[665,235],"left_hip":[686,234],"right_hip":[675,234],"left_knee":[692,254],"right_knee":[684,254],"left_ankle":[684,273],"right_ankle":[690,277]}]]};
  const FLIGHT = 1.05, HIT_WINDOW = 0.22, NEAR_SPEED = 420, FAR_SPEED = 260;
  // landing points (ground, source px) used in turn by each side
  const NEAR_TARGETS = [[705,540],[485,640],[575,482],[560,452],[470,628]];
  const FAR_TARGETS = [[700,284],[560,268],[590,300],[570,296],[612,266]];
  const U = () => SimKit.util;
  function startFlight(s, from, to, by, h0, h1, peak) {
    s.shuttle = { from: from.slice(), to: to.slice(), t: 0, T: FLIGHT, by, h0, h1, peak, landed: false };
    s.events.push({ type: "hit", by });
  }
  function shuttlePos(sh) {
    const u = Math.min(1, sh.t / sh.T);
    const g = U().lerp2(sh.from, sh.to, u);
    const h = sh.landed ? 0 : (1 - u) * sh.h0 + u * sh.h1 + 4 * sh.peak * u * (1 - u);
    return [g[0], g[1] - h];
  }
  window.World = {
    meta: { name: "badminton rally", source: [1280, 720], fps: 25, dt: 1 / 60 },
    actions: [
      { id: "move", kind: "drag", description: "run near player to pointer position" },
      { id: "hit", kind: "tap", keys: [" "], description: "swing racket (returns shuttle if it is arriving)" }
    ],
    init(rng) {
      return {
        time: 0, events: [],
        near: { pos: [629, 484], goal: [629, 484], swing: -1, hits: 0 },
        far: { pos: [600, 286], swing: -1, hits: 0 },
        shuttle: { from: [612, 210], to: [612, 210], t: 0, T: 1, by: "far", h0: 70, h1: 70, peak: 0, landed: false },
        serveAt: 0.2, served: false, over: false
      };
    },
    step(s, acts, dt, rng) {
      s.time += dt;
      for (const a of acts) {
        if (a.id === "move" && a.value) {
          const x = a.value.x !== undefined ? a.value.x : s.near.pos[0] + a.value.dx;
          const y = a.value.y !== undefined ? a.value.y : s.near.pos[1] + a.value.dy;
          s.near.goal = [U().clamp(x, 300, 1000), U().clamp(y, 330, 700)];
        }
        if (a.id === "hit") {
          s.near.swing = 0;
          const sh = s.shuttle;
          if (s.served && !s.over && sh.by === "far" && !sh.landed && sh.T - sh.t < HIT_WINDOW &&
              U().dist(sh.to, s.near.pos) < 140) {
            startFlight(s, s.near.pos, FAR_TARGETS[s.near.hits % FAR_TARGETS.length], "near", 190, 70, 260);
            s.near.hits++; s.far.swing = -1;
          }
        }
      }
      // near player runs toward its goal
      const n = s.near, d = U().dist(n.pos, n.goal);
      if (d > 1) { const k = Math.min(1, NEAR_SPEED * dt / d); n.pos = U().lerp2(n.pos, n.goal, k); }
      if (n.swing >= 0) { n.swing += dt; if (n.swing > 0.7) n.swing = -1; }
      // far player: serve, then chase incoming shuttle, else drift home
      const f = s.far, sh = s.shuttle;
      if (!s.served && s.time >= s.serveAt) {
        s.served = true; f.swing = 0;
        startFlight(s, [f.pos[0] + 10, f.pos[1]], NEAR_TARGETS[f.hits++ % NEAR_TARGETS.length], "far", 70, 190, 240);
      }
      const fgoal = (s.served && sh.by === "near" && !sh.landed) ? sh.to : [610, 280];
      const fd = U().dist(f.pos, fgoal);
      if (fd > 1) { const k = Math.min(1, FAR_SPEED * dt / fd); f.pos = U().lerp2(f.pos, fgoal, k); }
      if (f.swing >= 0) { f.swing += dt; if (f.swing > 0.7) f.swing = -1; }
      if (s.served && !sh.landed) {
        sh.t += dt;
        if (sh.by === "near" && sh.T - sh.t < 0.25 && f.swing < 0) f.swing = 0;
        if (sh.t >= sh.T) {
          if (sh.by === "near" && !s.over && U().dist(f.pos, sh.to) < 60) {
            startFlight(s, f.pos, NEAR_TARGETS[f.hits++ % NEAR_TARGETS.length], "far", 70, 190, 240);
          } else if (sh.t >= sh.T + 0.6) {
            sh.landed = true; s.over = true; s.events.push({ type: "land", side: sh.by === "far" ? "near" : "far" });
          }
        }
      }
    },
    proxy(s) {
      const pose = SimKit.pose;
      const fig = (idle, clip, sw, pos, flip) => {
        let p = sw >= 0 ? pose.sample(clip, sw) : idle;
        return pose.placeAt(p, pos);
      };
      const sh = s.shuttle;
      const sp = s.served && !sh.landed ? shuttlePos(Object.assign({}, sh, { t: Math.min(sh.t, sh.T) }))
               : (s.served ? sh.to : [612, 210]);
      if (s.served && !sh.landed && sh.t > sh.T) { // falling past the receiver
        const e = sh.t - sh.T; sp[1] = Math.min(sh.to[1], sp[1] + 300 * e);
      }
      return {
        regions: [
          { cls: "wall", rect: [0, 0, 1280, 720] },
          { cls: "wall", rect: [180, 70, 920, 120] },
          { cls: "floor", polygon: [[340, 190], [940, 190], [1110, 720], [170, 720]] },
          { cls: "court", polygon: [[476, 234], [790, 234], [974, 654], [310, 654]] },
          { cls: "line", polygon: [[631, 234], [635, 234], [645, 654], [639, 654]] },
          { cls: "line", polygon: [[440, 318], [840, 318], [842, 324], [438, 324]] },
          { cls: "structure", polygon: [[410, 262], [866, 262], [862, 318], [414, 318]] }
        ],
        figures: [
          { cls: "human", joints: fig(P.farIdle, P.farSwing, s.far.swing, s.far.pos) },
          { cls: "human", joints: fig(P.nearIdle, P.nearSwing, s.near.swing, s.near.pos) }
        ],
        boxes: [ { cls: "projectile", center: sp, size: [8, 8] } ],
        media: []
      };
    },
    replay: {
      duration: 10,
      actions: [
        { t: 0.00, id: "move", value: { dx: 0, dy: 0, x: 628, y: 484 } },
        { t: 0.48, id: "move", value: { dx: 0, dy: 0, x: 629, y: 488 } },
        { t: 0.96, id: "move", value: { dx: 0, dy: 0, x: 668, y: 514 } },
        { t: 1.44, id: "move", value: { dx: 0, dy: 0, x: 750, y: 594 } },
        { t: 1.92, id: "move", value: { dx: 0, dy: 0, x: 709, y: 530 } },
        { t: 2.40, id: "move", value: { dx: 0, dy: 0, x: 659, y: 511 } },
        { t: 2.88, id: "move", value: { dx: 0, dy: 0, x: 543, y: 563 } },
        { t: 3.36, id: "move", value: { dx: 0, dy: 0, x: 478, y: 642 } },
        { t: 3.84, id: "move", value: { dx: 0, dy: 0, x: 482, y: 598 } },
        { t: 4.32, id: "move", value: { dx: 0, dy: 0, x: 521, y: 518 } },
        { t: 4.80, id: "move", value: { dx: 0, dy: 0, x: 537, y: 482 } },
        { t: 5.28, id: "move", value: { dx: 0, dy: 0, x: 570, y: 477 } },
        { t: 5.76, id: "move", value: { dx: 0, dy: 0, x: 588, y: 483 } },
        { t: 6.24, id: "move", value: { dx: 0, dy: 0, x: 561, y: 440 } },
        { t: 6.72, id: "move", value: { dx: 0, dy: 0, x: 534, y: 429 } },
        { t: 7.20, id: "move", value: { dx: 0, dy: 0, x: 545, y: 442 } },
        { t: 7.68, id: "move", value: { dx: 0, dy: 0, x: 560, y: 449 } },
        { t: 8.16, id: "move", value: { dx: 0, dy: 0, x: 562, y: 500 } },
        { t: 8.64, id: "move", value: { dx: 0, dy: 0, x: 513, y: 585 } },
        { t: 9.12, id: "move", value: { dx: 0, dy: 0, x: 463, y: 654 } },
        { t: 9.60, id: "move", value: { dx: 0, dy: 0, x: 469, y: 626 } },
        { t: 1.18, id: "hit" }, { t: 3.28, id: "hit" }, { t: 5.38, id: "hit" },
        { t: 7.48, id: "hit" }, { t: 9.58, id: "hit" }
      ]
    }
  };
})();
