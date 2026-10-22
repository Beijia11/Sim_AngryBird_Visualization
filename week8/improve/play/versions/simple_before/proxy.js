/* Proxy renderer: the one place that decides what a proxy frame looks like.
 *
 * A proxy frame is drawn from a scene description in reference-video pixel
 * coordinates. Four kinds of primitives, nothing else:
 *   regions  flat-colour environment areas (sky, ground, court, table, water, ...)
 *   figures  thick single-colour stick figures for anything with a pose
 *            (people, animals, humanoid robots, robot arms as joint chains)
 *   boxes    red wireframe boxes for other moving or interactive objects
 *            (balls, blocks, vehicles, tools, props); tiny boxes are filled
 *   media    density fields for smoke, fire, dust, water spray
 *
 * The same file is copied into every agent workspace and injected by the
 * harness when it records the proxy video, so every build is drawn identically.
 * (Named ProxyKit, not Proxy: window.Proxy is a JavaScript built-in.)
 * Exposes window.ProxyKit = { PALETTE, REGION_CLASSES, FIGURE_CLASSES, MEDIA_CLASSES,
 *                          draw(ctx, scene, opts), validate(scene) }.
 */
(function (global) {
  "use strict";

  const REGION_CLASSES = {
    sky: "#6a8fdd", ground: "#000000", floor: "#2b2b33", wall: "#3a3f52", structure: "#4b5068",
    vegetation: "#3fa34d", water: "#2479c2", court: "#1d6b5a", line: "#e9e9e9", table: "#7a5230",
    platform: "#5c4a3a", obstacle: "#7d7d7d", road: "#303030", sand: "#b89b5e", snow: "#dfe6ee",
    screen: "#141414", other: "#555555"
  };
  const FIGURE_CLASSES = { human: "#38a8ff", animal: "#5fd0c8", robot: "#f2b632", character: "#38a8ff" };
  const BOX_CLASSES = { object: "#e8392c", projectile: "#e8392c", vehicle: "#e8392c", tool: "#e8392c", prop: "#e8392c", static: "#a8281f" };
  const MEDIA_CLASSES = { smoke: [176, 160, 205], fire: [255, 138, 32], dust: [190, 160, 120], spray: [170, 220, 255], gas: [150, 210, 150] };
  const PALETTE = { regions: REGION_CLASSES, figures: FIGURE_CLASSES, boxes: BOX_CLASSES, media: MEDIA_CLASSES, background: "#000000" };

  // COCO-17 order; a human figure may give any subset by name.
  const COCO = ["nose", "left_eye", "right_eye", "left_ear", "right_ear", "left_shoulder", "right_shoulder",
    "left_elbow", "right_elbow", "left_wrist", "right_wrist", "left_hip", "right_hip",
    "left_knee", "right_knee", "left_ankle", "right_ankle"];
  const LIMBS = [["left_shoulder", "left_elbow"], ["left_elbow", "left_wrist"], ["right_shoulder", "right_elbow"],
    ["right_elbow", "right_wrist"], ["left_hip", "left_knee"], ["left_knee", "left_ankle"],
    ["right_hip", "right_knee"], ["right_knee", "right_ankle"]];

  const finite = (p) => Array.isArray(p) && p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]);
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

  function line(ctx, a, b) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }

  function drawRegion(ctx, r) {
    ctx.fillStyle = REGION_CLASSES[r.cls] || REGION_CLASSES.other;
    if (r.rect) { const [x, y, w, h] = r.rect; ctx.fillRect(x, y, w, h); return; }
    if (!r.polygon || r.polygon.length < 3) return;
    ctx.beginPath(); ctx.moveTo(r.polygon[0][0], r.polygon[0][1]);
    for (let i = 1; i < r.polygon.length; i++) ctx.lineTo(r.polygon[i][0], r.polygon[i][1]);
    ctx.closePath(); ctx.fill();
  }

  function drawFigure(ctx, f) {
    const col = FIGURE_CLASSES[f.cls] || FIGURE_CLASSES.character;
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineCap = "round"; ctx.lineJoin = "round";
    if (f.chain) {                           // articulated chain: robot arm, tail, rope
      const t = f.thickness || 10; ctx.lineWidth = t;
      for (let i = 0; i + 1 < f.chain.length; i++) if (finite(f.chain[i]) && finite(f.chain[i + 1])) line(ctx, f.chain[i], f.chain[i + 1]);
      (f.fingers || []).forEach((seg) => { if (finite(seg[0]) && finite(seg[1])) { ctx.lineWidth = Math.max(3, t * 0.5); line(ctx, seg[0], seg[1]); } });
      return;
    }
    const j = f.joints || {};
    const P = (n) => (finite(j[n]) ? j[n] : null);
    const ls = P("left_shoulder"), rs = P("right_shoulder"), lh = P("left_hip"), rh = P("right_hip");
    const sh = ls && rs ? mid(ls, rs) : ls || rs, hip = lh && rh ? mid(lh, rh) : lh || rh;
    const torsoLen = sh && hip ? Math.hypot(sh[0] - hip[0], sh[1] - hip[1]) : 40;
    const t = f.thickness || Math.max(4, torsoLen * 0.28);
    ctx.lineWidth = t;
    LIMBS.forEach(([a, b]) => { const pa = P(a), pb = P(b); if (pa && pb) line(ctx, pa, pb); });
    if (ls && rs) line(ctx, ls, rs);
    if (lh && rh) line(ctx, lh, rh);
    if (sh && hip) { ctx.lineWidth = t * 1.5; line(ctx, sh, hip); }
    const head = P("nose") || (P("left_ear") && P("right_ear") ? mid(P("left_ear"), P("right_ear")) : null);
    const hc = head || (sh && hip ? [sh[0] + (sh[0] - hip[0]) * 0.45, sh[1] + (sh[1] - hip[1]) * 0.45] : null);
    if (hc) { ctx.beginPath(); ctx.arc(hc[0], hc[1], Math.max(t * 0.9, torsoLen * 0.2), 0, Math.PI * 2); ctx.fill(); }
    (f.extra || []).forEach((seg) => { if (finite(seg[0]) && finite(seg[1])) { ctx.lineWidth = Math.max(3, t * 0.5); line(ctx, seg[0], seg[1]); } });
  }

  function boxCorners2D(b) {
    const [cx, cy] = b.center, [w, h] = b.size, a = b.angle || 0, c = Math.cos(a), s = Math.sin(a);
    return [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([x, y]) => [cx + x * c - y * s, cy + x * s + y * c]);
  }
  const BOX_EDGES_3D = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];

  function drawBox(ctx, b) {
    ctx.strokeStyle = BOX_CLASSES[b.cls] || BOX_CLASSES.object; ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = b.lineWidth || 3; ctx.lineJoin = "round";
    if (b.corners && b.corners.length === 8) {           // projected 3D box, corners 0-3 bottom, 4-7 top
      BOX_EDGES_3D.forEach(([i, k]) => { if (finite(b.corners[i]) && finite(b.corners[k])) line(ctx, b.corners[i], b.corners[k]); });
      return;
    }
    if (!b.center || !b.size) return;
    if (Math.max(b.size[0], b.size[1]) < 10) {            // tiny objects (balls) stay visible as filled squares
      const r = Math.max(4, Math.max(b.size[0], b.size[1]) / 2);
      ctx.fillRect(b.center[0] - r, b.center[1] - r, 2 * r, 2 * r); return;
    }
    const p = boxCorners2D(b);
    ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]); for (let i = 1; i < 4; i++) ctx.lineTo(p[i][0], p[i][1]); ctx.closePath(); ctx.stroke();
  }

  function drawMedia(ctx, m) {
    const rgb = MEDIA_CLASSES[m.cls] || MEDIA_CLASSES.smoke;
    const [gw, gh] = m.grid_size, d = m.density, [ox, oy] = m.origin, cell = m.cell;
    if (!d || d.length !== gw * gh) return;
    const off = document.createElement("canvas"); off.width = gw; off.height = gh;
    const oc = off.getContext("2d"), img = oc.createImageData(gw, gh);
    for (let i = 0; i < gw * gh; i++) {
      const v = Math.max(0, Math.min(1, d[i]));
      img.data[4 * i] = rgb[0]; img.data[4 * i + 1] = rgb[1]; img.data[4 * i + 2] = rgb[2]; img.data[4 * i + 3] = Math.round(255 * v);
    }
    oc.putImageData(img, 0, 0);
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(off, ox, oy, gw * cell, gh * cell); ctx.restore();
  }

  /** Draw a scene. opts: {width, height} of the target canvas and {source:[w,h]} of the
   *  reference video; the scene is scaled from source pixels to the canvas. */
  function draw(ctx, scene, opts) {
    const W = (opts && opts.width) || ctx.canvas.width, H = (opts && opts.height) || ctx.canvas.height;
    const src = (opts && opts.source) || scene.source || [W, H];
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = PALETTE.background; ctx.fillRect(0, 0, W, H);
    ctx.scale(W / src[0], H / src[1]);
    (scene.regions || []).forEach((r) => drawRegion(ctx, r));
    const items = [];
    (scene.boxes || []).forEach((b) => items.push({ z: b.z ?? (b.center ? b.center[1] : 0), f: () => drawBox(ctx, b) }));
    (scene.figures || []).forEach((f) => {
      const pts = f.chain || Object.values(f.joints || {}).filter(finite);
      const zy = pts.length ? Math.max(...pts.map((p) => p[1])) : 0;
      items.push({ z: f.z ?? zy, f: () => drawFigure(ctx, f) });
    });
    items.sort((a, b) => a.z - b.z).forEach((it) => it.f());
    (scene.media || []).forEach((m) => drawMedia(ctx, m));
    ctx.restore();
  }

  /** Returns a list of problems; empty means the scene follows the spec. */
  function validate(scene) {
    const errs = [];
    if (!scene || typeof scene !== "object") return ["proxy() returned no object"];
    ["regions", "figures", "boxes", "media"].forEach((k) => { if (scene[k] !== undefined && !Array.isArray(scene[k])) errs.push(`${k} must be an array`); });
    (scene.regions || []).forEach((r, i) => {
      if (!(r.cls in REGION_CLASSES)) errs.push(`regions[${i}].cls "${r.cls}" not in REGION_CLASSES`);
      if (!r.rect && !(Array.isArray(r.polygon) && r.polygon.length >= 3 && r.polygon.every(finite))) errs.push(`regions[${i}] needs rect or a polygon of 3+ finite points`);
    });
    (scene.figures || []).forEach((f, i) => {
      if (!(f.cls in FIGURE_CLASSES)) errs.push(`figures[${i}].cls "${f.cls}" not in FIGURE_CLASSES`);
      if (!f.chain && !f.joints) errs.push(`figures[${i}] needs joints or chain`);
      if (f.joints) Object.keys(f.joints).forEach((n) => { if (!COCO.includes(n)) errs.push(`figures[${i}].joints has unknown name "${n}" (use COCO-17 names)`); });
    });
    (scene.boxes || []).forEach((b, i) => {
      if (!(b.cls in BOX_CLASSES)) errs.push(`boxes[${i}].cls "${b.cls}" not in BOX_CLASSES`);
      if (!(b.corners && b.corners.length === 8) && !(finite(b.center) && Array.isArray(b.size))) errs.push(`boxes[${i}] needs center+size or 8 corners`);
    });
    (scene.media || []).forEach((m, i) => {
      if (!(m.cls in MEDIA_CLASSES)) errs.push(`media[${i}].cls "${m.cls}" not in MEDIA_CLASSES`);
      if (!m.grid_size || !m.density || m.density.length !== m.grid_size[0] * m.grid_size[1]) errs.push(`media[${i}] density length must equal grid_size[0]*grid_size[1]`);
    });
    const n = (scene.figures || []).length + (scene.boxes || []).length + (scene.media || []).length;
    if (n === 0) errs.push("scene has no figures, boxes or media: nothing moves");
    return errs;
  }

  global.ProxyKit = { PALETTE, REGION_CLASSES, FIGURE_CLASSES, BOX_CLASSES, MEDIA_CLASSES, COCO, draw, validate };
})(typeof window !== "undefined" ? window : globalThis);
