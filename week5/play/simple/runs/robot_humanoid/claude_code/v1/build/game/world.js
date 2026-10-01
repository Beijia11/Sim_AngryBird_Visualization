// Humanoid robot walks right, climbs three 16 cm steps, turns to face camera on the top, then walks back down.
(function () {
  const POSES = {"walk": [{"nose": [749.5, 294.3], "left_eye": [753.5, 284.1], "right_eye": [751.5, 288.2], "left_ear": [763.7, 290.2], "right_ear": [773.8, 294.3], "left_shoulder": [755.6, 348.9], "right_shoulder": [771.8, 344.8], "left_elbow": [737.4, 452.1], "right_elbow": [757.6, 452.1], "left_wrist": [727.2, 514.8], "right_wrist": [790.0, 524.9], "left_hip": [759.6, 535.1], "right_hip": [761.6, 537.1], "left_knee": [781.9, 646.3], "right_knee": [775.8, 644.3], "left_ankle": [850.7, 765.7], "right_ankle": [844.6, 765.7]}, {"nose": [750.2, 296.7], "left_eye": [754.1, 282.9], "right_eye": [760.0, 284.9], "left_ear": [767.9, 288.8], "right_ear": [773.8, 290.8], "left_shoulder": [760.0, 345.8], "right_shoulder": [777.7, 341.9], "left_elbow": [742.4, 434.3], "right_elbow": [775.8, 438.2], "left_wrist": [722.7, 501.1], "right_wrist": [746.3, 512.9], "left_hip": [764.0, 520.7], "right_hip": [773.8, 522.7], "left_knee": [789.5, 636.7], "right_knee": [787.6, 638.7], "left_ankle": [852.4, 766.4], "right_ankle": [852.4, 768.4]}, {"nose": [748.3, 296.5], "left_eye": [755.9, 281.3], "right_eye": [763.6, 285.1], "left_ear": [767.4, 287.0], "right_ear": [792.2, 287.0], "left_shoulder": [765.5, 349.9], "right_shoulder": [792.2, 348.0], "left_elbow": [746.4, 449.1], "right_elbow": [794.1, 443.4], "left_wrist": [721.6, 504.4], "right_wrist": [759.8, 504.4], "left_hip": [769.3, 533.0], "right_hip": [778.8, 533.0], "left_knee": [790.3, 641.7], "right_knee": [792.2, 643.7], "left_ankle": [855.1, 763.8], "right_ankle": [858.9, 760.0]}, {"nose": [754.3, 295.6], "left_eye": [762.0, 282.2], "right_eye": [767.7, 286.0], "left_ear": [777.3, 288.0], "right_ear": [796.5, 288.0], "left_shoulder": [771.6, 349.4], "right_shoulder": [796.5, 347.4], "left_elbow": [752.4, 447.2], "right_elbow": [794.6, 443.4], "left_wrist": [721.7, 495.2], "right_wrist": [752.4, 491.4], "left_hip": [773.5, 541.3], "right_hip": [783.1, 539.3], "left_knee": [796.5, 648.7], "right_knee": [796.5, 646.8], "left_ankle": [859.9, 765.8], "right_ankle": [873.3, 744.7]}, {"nose": [763.3, 297.0], "left_eye": [771.1, 283.4], "right_eye": [780.8, 287.3], "left_ear": [786.6, 287.3], "right_ear": [802.1, 291.2], "left_shoulder": [776.9, 347.4], "right_shoulder": [802.1, 345.5], "left_elbow": [757.5, 448.3], "right_elbow": [800.2, 446.4], "left_wrist": [728.4, 525.9], "right_wrist": [821.5, 527.9], "left_hip": [780.8, 535.6], "right_hip": [790.5, 533.7], "left_knee": [802.1, 652.0], "right_knee": [804.1, 640.4], "left_ankle": [860.3, 776.2], "right_ankle": [889.4, 733.5]}, {"nose": [786.1, 291.7], "left_eye": [788.0, 280.3], "right_eye": [795.6, 286.0], "left_ear": [793.7, 289.8], "right_ear": [807.0, 295.5], "left_shoulder": [776.6, 350.5], "right_shoulder": [803.2, 346.7], "left_elbow": [759.5, 454.8], "right_elbow": [801.3, 447.2], "left_wrist": [733.0, 526.8], "right_wrist": [841.1, 528.7], "left_hip": [786.1, 534.4], "right_hip": [799.4, 532.5], "left_knee": [805.1, 655.8], "right_knee": [808.8, 636.8], "left_ankle": [869.5, 775.2], "right_ankle": [901.8, 724.0]}, {"nose": [778.3, 286.0], "left_eye": [787.8, 276.5], "right_eye": [797.3, 282.2], "left_ear": [791.6, 287.9], "right_ear": [810.6, 293.6], "left_shoulder": [782.1, 343.0], "right_shoulder": [810.6, 341.1], "left_elbow": [759.3, 441.9], "right_elbow": [824.0, 430.5], "left_wrist": [744.1, 519.9], "right_wrist": [746.0, 523.7], "left_hip": [791.6, 521.8], "right_hip": [810.6, 521.8], "left_knee": [804.9, 649.2], "right_knee": [814.4, 626.4], "left_ankle": [869.6, 776.7], "right_ankle": [909.5, 727.2]}, {"nose": [774.0, 282.9], "left_eye": [789.1, 273.4], "right_eye": [794.8, 273.4], "left_ear": [794.8, 282.9], "right_ear": [811.8, 286.6], "left_shoulder": [787.2, 345.2], "right_shoulder": [811.8, 337.6], "left_elbow": [766.5, 441.4], "right_elbow": [772.1, 418.8], "left_wrist": [755.1, 511.3], "right_wrist": [755.1, 518.8], "left_hip": [802.3, 530.1], "right_hip": [815.5, 528.3], "left_knee": [823.1, 654.7], "right_knee": [830.6, 624.5], "left_ankle": [868.4, 783.1], "right_ankle": [911.8, 724.6]}, {"nose": [781.5, 276.6], "left_eye": [792.7, 265.4], "right_eye": [798.4, 267.3], "left_ear": [804.0, 272.9], "right_ear": [815.3, 276.6], "left_shoulder": [798.4, 333.0], "right_shoulder": [820.9, 329.2], "left_elbow": [779.6, 423.1], "right_elbow": [819.0, 415.6], "left_wrist": [758.9, 502.0], "right_wrist": [757.1, 500.1], "left_hip": [809.7, 522.6], "right_hip": [820.9, 522.6], "left_knee": [830.3, 650.3], "right_knee": [839.7, 631.6], "left_ankle": [864.1, 776.2], "right_ankle": [911.1, 729.2]}, {"nose": [793.7, 268.8], "left_eye": [801.3, 259.3], "right_eye": [805.1, 259.3], "left_ear": [812.8, 265.0], "right_ear": [824.2, 268.8], "left_shoulder": [803.2, 322.2], "right_shoulder": [831.8, 320.3], "left_elbow": [782.2, 413.8], "right_elbow": [828.0, 411.9], "left_wrist": [755.5, 488.2], "right_wrist": [879.5, 497.7], "left_hip": [810.9, 511.1], "right_hip": [820.4, 511.1], "left_knee": [829.9, 635.0], "right_knee": [839.5, 614.1], "left_ankle": [868.1, 764.7], "right_ankle": [900.5, 728.5]}], "front": {"nose": [1245.0, 87.0], "left_eye": [1253.4, 80.8], "right_eye": [1240.9, 68.3], "left_ear": [1272.1, 87.0], "right_ear": [1230.5, 84.9], "left_shoulder": [1334.7, 141.2], "right_shoulder": [1207.5, 182.9], "left_elbow": [1386.8, 272.6], "right_elbow": [1228.4, 293.4], "left_wrist": [1326.4, 320.5], "right_wrist": [1167.9, 335.1], "left_hip": [1313.8, 387.2], "right_hip": [1245.0, 389.3], "left_knee": [1238.8, 491.5], "right_knee": [1174.2, 547.8], "left_ankle": [1315.9, 597.8], "right_ankle": [1222.1, 677.0]}, "side": {"nose": [1322.3, 100.0], "left_eye": [1324.3, 83.3], "right_eye": [1305.6, 79.2], "left_ear": [1324.3, 85.4], "right_ear": [1293.2, 85.4], "left_shoulder": [1330.6, 174.8], "right_shoulder": [1259.9, 141.5], "left_elbow": [1307.7, 282.8], "right_elbow": [1230.8, 262.1], "left_wrist": [1345.1, 328.6], "right_wrist": [1303.6, 311.9], "left_hip": [1332.7, 388.8], "right_hip": [1289.0, 388.8], "left_knee": [1436.6, 511.4], "right_knee": [1353.4, 540.5], "left_ankle": [1353.4, 621.6], "right_ankle": [1272.4, 683.9]}};
  const WALK = POSES.walk.map((p, i) => [i * 0.04, p]);
  const WALK_T = WALK[WALK.length - 1][0] + 0.04;
  // foot height lanes (source px) along x: floor, step 1, step 2, top platform
  function groundY(x) {
    if (x < 930) return 770;
    if (x < 1040) return 735;
    if (x < 1150) return 700;
    return 665;
  }
  const SPEED = 175, STEP_RATE = 260;

  window.World = {
    meta: { name: "robot stair climb", source: [1920, 1080], fps: 50, dt: 1 / 60 },
    actions: [
      { id: "left", kind: "hold", keys: ["ArrowLeft", "a"], description: "walk left" },
      { id: "right", kind: "hold", keys: ["ArrowRight", "d"], description: "walk right" },
      { id: "turn", kind: "tap", keys: [" "], description: "turn to face the camera" },
    ],
    init(rng) {
      return { t: 0, x: 765, y: 770, facing: 1, front: false, phase: 0, moving: false, events: [] };
    },
    step(s, acts, dt, rng) {
      s.t += dt;
      let dir = 0;
      for (const a of acts) {
        if (a.id === "left") dir -= 1;
        if (a.id === "right") dir += 1;
        if (a.id === "turn") { s.front = !s.front; s.events.push({ type: "turn", front: s.front }); }
      }
      s.moving = dir !== 0;
      if (s.moving) {
        s.front = false;
        s.facing = dir;
        s.x = SimKit.util.clamp(s.x + dir * SPEED * dt, 100, 1600);
        s.phase = (s.phase + dt) % WALK_T;
      }
      const gy = groundY(s.x);
      if (Math.abs(gy - s.y) > 1) {
        const prev = s.y;
        s.y += Math.sign(gy - s.y) * Math.min(Math.abs(gy - s.y), STEP_RATE * dt);
        if (Math.abs(gy - s.y) <= 1 && Math.abs(gy - prev) > 1) s.events.push({ type: "step", y: gy });
      }
    },
    proxy(s) {
      const P = SimKit.pose;
      let pose;
      if (s.front) pose = POSES.front;
      else if (s.moving) pose = P.sample(WALK, s.phase);
      else pose = POSES.side;
      if (!s.front && s.facing < 0) pose = P.mirror(pose, P.root(pose)[0]);
      const joints = P.placeAt(pose, [s.x, s.y]);
      return {
        regions: [
          { cls: "wall", rect: [0, 0, 1920, 830] },
          { cls: "floor", polygon: [[0, 830], [1920, 800], [1920, 1080], [0, 1080]] },
          { cls: "structure", rect: [290, 300, 200, 250] },
          // stairs: three steps up to a long top platform
          { cls: "structure", polygon: [[810, 880], [900, 870], [900, 1060], [960, 1060], [810, 1000]] },
          { cls: "structure", polygon: [[900, 800], [1000, 790], [1000, 1060], [900, 1060]] },
          { cls: "structure", polygon: [[990, 740], [1100, 730], [1100, 1060], [990, 1060]] },
          { cls: "platform", polygon: [[1090, 690], [1400, 680], [1650, 700], [1650, 1020], [1560, 1050], [1090, 1060]] },
        ],
        figures: [{ cls: "robot", joints, thickness: 22 }],
        boxes: [],
        media: [],
      };
    },
    replay: {
      duration: 9.5,
      actions: [
        { t: 0.0, id: "right", until: 3.35 },
        { t: 5.6, id: "turn" },
        { t: 6.8, id: "left", until: 9.5 },
      ],
    },
  };
})();
