/* SurpassKit: everything around the world, so the agent writes world.js (and assets/).
 *
 * world.js defines window.World = {
 *   meta:    { name, source: [w, h], fps, dt },      // source = reference video pixel size; render in these pixels
 *   actions: [{ id, kind: "hold"|"tap"|"continuous"|"drag", keys: [...], description, min?, max? }],
 *   assets:  { name: "assets/file.png", ... },      // images loaded before start; passed to render as `img`
 *   init(rng)                  -> state
 *   step(state, acts, dt, rng)                       // mutate state; acts = [{id, value?}]; push to state.events
 *   render(ctx, state, img)                          // draw the full-appearance frame in source pixels
 *   replay:  { duration, actions: [{t, id, value?, until?}] }   // reproduces the reference clip from init (seed 0)
 * }
 *
 * The kit exposes window.sim (meta, actionSpace, replay, reset, play, step, state, render)
 * and window.simReady (resolves when assets are loaded), runs a fixed-step loop, maps keys
 * and pointer drags to actions, plays the replay on V, pauses on P, resets on R.
 * Helpers: SurpassKit.util, SurpassKit.pose (same as the simple track), SurpassKit.mulberry32.
 */
(function (global) {
  "use strict";
  function mulberry32(seed) {
    let a = (seed >>> 0) || 1;
    return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const util = {
    clamp: (x, a, b) => Math.max(a, Math.min(b, x)), lerp: (a, b, t) => a + (b - a) * t,
    lerp2: (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t], dist: (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]),
    smoothstep: (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); },
    track(keys, t) {
      if (!keys.length) return null; if (t <= keys[0][0]) return keys[0][1];
      for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const [t0, v0] = keys[i - 1], [t1, v1] = keys[i], u = (t - t0) / Math.max(1e-9, t1 - t0); return Array.isArray(v0) ? [v0[0] + (v1[0] - v0[0]) * u, v0[1] + (v1[1] - v0[1]) * u] : v0 + (v1 - v0) * u; }
      return keys[keys.length - 1][1];
    }
  };
  const pose = {
    translate: (p, dx, dy) => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, [v[0] + dx, v[1] + dy]])),
    lerp: (a, b, t) => Object.fromEntries(Object.keys(a).filter((k) => b[k]).map((k) => [k, [a[k][0] + (b[k][0] - a[k][0]) * t, a[k][1] + (b[k][1] - a[k][1]) * t]])),
    root: (p) => (p.left_ankle && p.right_ankle) ? [(p.left_ankle[0] + p.right_ankle[0]) / 2, Math.max(p.left_ankle[1], p.right_ankle[1])] : Object.values(p).reduce((a, v) => (v[1] > a[1] ? v : a), [0, -1e9]),
    placeAt: (p, at) => { const r = pose.root(p); return pose.translate(p, at[0] - r[0], at[1] - r[1]); },
    sample(clip, t) {
      if (!clip.length) return null; if (t <= clip[0][0]) return clip[0][1];
      for (let i = 1; i < clip.length; i++) if (t <= clip[i][0]) { const u = (t - clip[i - 1][0]) / Math.max(1e-9, clip[i][0] - clip[i - 1][0]); return pose.lerp(clip[i - 1][1], clip[i][1], u); }
      return clip[clip.length - 1][1];
    }
  };
  function activeAt(schedule, time, fired) {
    const acts = [];
    schedule.forEach((a, i) => {
      if (a.until === undefined) { if (!fired.has(i) && time + 1e-9 >= a.t) { fired.add(i); acts.push({ id: a.id, value: a.value }); } }
      else if (time + 1e-9 >= a.t && time < a.until) acts.push({ id: a.id, value: a.value });
    });
    return acts;
  }
  function loadImages(map) {
    const out = {};
    return Promise.all(Object.entries(map || {}).map(([k, src]) => new Promise((res) => {
      const im = new Image(); im.onload = () => { out[k] = im; res(); }; im.onerror = () => { console.error("asset failed to load: " + src); res(); }; im.src = src;
    }))).then(() => out);
  }
  function boot() {
    const W = global.World;
    if (!W) { document.body.insertAdjacentHTML("beforeend", "<p style='color:#f66'>world.js did not define window.World</p>"); return; }
    const src = W.meta.source, dt = W.meta.dt || 1 / 60;
    const canvas = document.getElementById("view");
    canvas.width = src[0]; canvas.height = src[1];
    const ctx = canvas.getContext("2d");
    let img = {}, rng = mulberry32(0), state = null, manual = false, paused = false, replaying = null;
    const sim = {
      meta: W.meta, actionSpace: () => W.actions, replay: W.replay, canvas,
      reset(seed) { rng = mulberry32(seed || 0); state = W.init(rng); manual = true; replaying = null; },
      play() { manual = false; },
      step(acts, d) { state.events = []; W.step(state, acts, d, rng); state.t = (state.t || 0) + d; },
      state: () => JSON.parse(JSON.stringify(state)),
      render() { ctx.setTransform(1, 0, 0, 1, 0, 0); W.render(ctx, state, img); }
    };
    global.simReady = loadImages(W.assets).then((m) => { img = m; state = W.init(rng); global.sim = sim; start(); });
    const legend = document.getElementById("legend");
    if (legend) legend.innerHTML = W.actions.map((a) => `<b>${(a.keys || []).join(" / ") || (a.kind === "drag" ? "drag on the picture" : "")}</b> ${a.description || a.id}`).join(" · ") + " · <b>V</b> play the clip's actions · <b>P</b> pause · <b>R</b> reset";
    const held = new Set(), taps = [];
    const keyAction = (key) => W.actions.filter((a) => (a.keys || []).some((k) => k.toLowerCase() === key.toLowerCase()));
    addEventListener("keydown", (e) => {
      if (e.repeat) return;
      if (e.key === "p" || e.key === "P") { paused = !paused; return; }
      if (e.key === "r" || e.key === "R") { rng = mulberry32(0); state = W.init(rng); replaying = null; return; }
      if (e.key === "v" || e.key === "V") { rng = mulberry32(0); state = W.init(rng); replaying = { t: 0, fired: new Set() }; return; }
      keyAction(e.key).forEach((a) => { if (a.kind === "tap") taps.push({ id: a.id }); else if (a.kind === "continuous") held.add(a.id + "|" + ((a.keys || []).indexOf(e.key) === 0 ? "neg" : "pos")); else held.add(a.id); });
      if (keyAction(e.key).length) e.preventDefault();
    });
    addEventListener("keyup", (e) => keyAction(e.key).forEach((a) => { held.delete(a.id); held.delete(a.id + "|neg"); held.delete(a.id + "|pos"); }));
    const drag = W.actions.find((a) => a.kind === "drag");
    let down = null;
    const toSrc = (e) => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * src[0], (e.clientY - r.top) / r.height * src[1]]; };
    canvas.addEventListener("pointerdown", (e) => { if (drag) down = toSrc(e); });
    canvas.addEventListener("pointerup", (e) => { if (drag && down) { const p = toSrc(e); taps.push({ id: drag.id, value: { dx: p[0] - down[0], dy: p[1] - down[1], x: down[0], y: down[1] } }); down = null; } });
    function start() {
      let last = performance.now(), acc = 0;
      (function frame(now) {
        if (!manual && !paused) {
          acc += Math.min(0.1, (now - last) / 1000);
          while (acc >= dt) {
            let acts;
            if (replaying) { acts = activeAt(W.replay.actions || [], replaying.t, replaying.fired); replaying.t += dt; if (replaying.t > (W.replay.duration || 1e9)) replaying = null; }
            else {
              acts = taps.splice(0);
              held.forEach((h) => { const [id, dir] = h.split("|"); const a = W.actions.find((x) => x.id === id); if (a && a.kind === "continuous") acts.push({ id, value: dir === "neg" ? (a.min ?? -1) : (a.max ?? 1) }); else acts.push({ id }); });
            }
            sim.step(acts, dt); acc -= dt;
          }
        }
        last = now;
        if (!manual) sim.render();
        requestAnimationFrame(frame);
      })(last);
    }
  }
  global.SurpassKit = { util, pose, mulberry32, activeAt, boot };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})(window);
