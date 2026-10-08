/* Week 6, Part B: formulas, the Stage 1 attention masks, the case switcher, synced
   video rows and the charts. Chart data comes from rt_data.js (build_realtime.py). */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const RT = window.RT || { curves: {}, mae: {} };
  const CASE_NAMES = {
    tennis__match116_000: 'tennis', tabletennis__match27_000: 'table tennis', badminton__match101_000: 'badminton',
  };

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function txt(parent, x, y, s, cls, anchor) {
    const t = el('text', { x, y, class: cls || '' }, parent);
    if (anchor) t.setAttribute('text-anchor', anchor);
    t.textContent = s;
    return t;
  }

  /* ---------------- formulas ---------------- */
  function renderMath() {
    if (window.renderMathInElement) {
      window.renderMathInElement(document.getElementById('realtime'), {
        delimiters: [{ left: '\\[', right: '\\]', display: true }, { left: '\\(', right: '\\)', display: false }],
        throwOnError: false,
      });
    }
  }

  /* ---------------- Stage 1 attention masks ---------------- */
  function drawMask(gid, x0, causal) {
    const g = document.getElementById(gid);
    if (!g) return;
    const sup = ['⁰', '¹', '²', '³', '⁴', '⁵'];
    const S = 26, C = 22, top = 68, tx = x0 + 6 * S + 12;
    txt(g, x0 + 3 * S - 2, 44, 'control', 'm', 'middle');
    txt(g, tx + 3 * S - 2, 44, 'target', 'm', 'middle');
    for (let j = 0; j < 6; j++) {
      txt(g, x0 + j * S + C / 2, 60, 'c' + sup[j], 'm', 'middle');
      txt(g, tx + j * S + C / 2, 60, 'x' + sup[j], 'm', 'middle');
    }
    for (let i = 1; i <= 5; i++) {
      const y = top + (i - 1) * S;
      txt(g, x0 - 10, y + 16, 'x' + sup[i], 'm', 'end');
      for (let j = 0; j < 6; j++) {
        el('rect', { x: x0 + j * S, y, width: C, height: C, rx: 4, class: !causal || j <= i ? 'on2' : 'off' }, g);
        let cls;
        if (!causal) cls = j === 0 ? 'on' : 'boxk';
        else cls = j < i ? 'on' : j === i ? 'boxk' : 'off';
        el('rect', { x: tx + j * S, y, width: C, height: C, rx: 4, class: cls }, g);
      }
    }
  }

  /* ---------------- videos ---------------- */
  let currentCase = 'tennis__match116_000';

  function setCase(c) {
    currentCase = c;
    document.querySelectorAll('.cases button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.case === c)));
    document.querySelectorAll('#realtime video[data-clip]').forEach(v => {
      const base = `clips/rt/${c}/${v.dataset.clip}`;
      v.poster = base + '.jpg';
      v.src = base + '.mp4';
    });
    document.querySelectorAll('#realtime [data-mae]').forEach(s => {
      const m = RT.mae[s.dataset.mae];
      s.textContent = m ? `fg MAE ${m[c].toFixed(1)} · mean ${m.mean.toFixed(2)}` : '';
    });
    document.querySelectorAll('#realtime .vrow').forEach(r => r._visible && r._play && r._play());
  }

  function wireRow(row) {
    const videos = Array.from(row.querySelectorAll('video'));
    if (!videos.length) return;
    const master = videos[0];
    const toggle = row.querySelector('[data-action="toggle"]');
    const again = row.querySelector('[data-action="restart"]');
    const play = () => { videos.forEach(v => v.play().catch(() => {})); if (toggle) toggle.textContent = 'Pause'; };
    const pause = () => { videos.forEach(v => v.pause()); if (toggle) toggle.textContent = 'Play'; };
    row._play = play;
    master.addEventListener('timeupdate', () => {
      videos.slice(1).forEach(v => { if (Math.abs(v.currentTime - master.currentTime) > 0.08) v.currentTime = master.currentTime; });
    });
    if (toggle) toggle.addEventListener('click', () => (master.paused ? play() : pause()));
    if (again) again.addEventListener('click', () => { videos.forEach(v => { v.currentTime = 0; }); play(); });
    new IntersectionObserver(es => es.forEach(e => {
      row._visible = e.isIntersecting;
      e.isIntersecting ? play() : pause();
    }), { threshold: 0.25 }).observe(row);
  }

  /* ---------------- line charts ---------------- */
  function lineChart(id, series) {
    const box = document.getElementById(id);
    if (!box) return;
    const W = 860, H = 260, L = 40, R = 150, T = 10, B = 32;
    const n = Math.max(...series.map(s => s.data.length));
    const vals = series.flatMap(s => s.data.filter(v => v != null));
    const ymax = Math.ceil(Math.max(...vals) / 10) * 10;
    const X = f => L + (f - 1) / (n - 2) * (W - L - R);
    const Y = v => T + (1 - v / ymax) * (H - T - B);

    const leg = box.querySelector('.legend');
    series.forEach(s => {
      const sp = document.createElement('span');
      const i = document.createElement('i');
      i.style.borderTopColor = s.color;
      if (s.ref) i.className = 'dash';
      sp.appendChild(i);
      sp.appendChild(document.createTextNode(s.label));
      leg.appendChild(sp);
    });

    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': box.querySelector('.ttl').textContent });
    box.querySelector('.plot').appendChild(svg);
    const grid = el('g', { class: 'grid' }, svg);
    for (let v = 0; v <= ymax; v += 10) {
      el('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v) }, grid);
      txt(svg, L - 8, Y(v) + 4, String(v), '', 'end');
    }
    for (let f = 20; f <= 120; f += 20) txt(svg, X(f), H - 10, String(f), '', 'middle');
    txt(svg, X(1), H - 10, 'frame 1', '', 'start');

    const ends = [];
    series.forEach(s => {
      const pts = s.data.map((v, f) => (v == null ? null : `${X(f).toFixed(1)},${Y(v).toFixed(1)}`)).filter(Boolean);
      const p = el('path', { d: 'M' + pts.join('L'), class: s.ref ? 'ref' : 'ln' }, svg);
      if (!s.ref) p.style.stroke = s.color;
      ends.push({ s, y: Y(mean(s.data.slice(-8))) });
    });
    // direct labels at the right end, pushed apart so they never overlap
    ends.sort((a, b) => a.y - b.y);
    for (let k = 1; k < ends.length; k++) if (ends[k].y - ends[k - 1].y < 15) ends[k].y = ends[k - 1].y + 15;
    ends.forEach(e => txt(svg, W - R + 8, e.y + 4, e.s.short || e.s.label, 'dl'));

    // crosshair + tooltip
    const xh = el('line', { class: 'xh', y1: T, y2: H - B, visibility: 'hidden' }, svg);
    const dots = series.map(s => {
      const d = el('circle', { r: 4.5, class: 'dot', visibility: 'hidden' }, svg);
      d.style.fill = s.ref ? 'var(--ink-3)' : s.color;
      return d;
    });
    const hit = el('rect', { x: L, y: T, width: W - L - R, height: H - T - B, fill: 'transparent' }, svg);
    const tip = document.createElement('div');
    tip.className = 'tip';
    tip.hidden = true;
    box.appendChild(tip);
    const move = ev => {
      const r = svg.getBoundingClientRect();
      const sx = (ev.clientX - r.left) * W / r.width;
      const f = Math.max(1, Math.min(n - 1, Math.round(1 + (sx - L) / (W - L - R) * (n - 2))));
      xh.setAttribute('x1', X(f)); xh.setAttribute('x2', X(f)); xh.setAttribute('visibility', 'visible');
      tip.replaceChildren();
      const t = document.createElement('div'); t.className = 't'; t.textContent = `frame ${f}`; tip.appendChild(t);
      series.map((s, k) => ({ s, k, v: s.data[f] })).filter(o => o.v != null).sort((a, b) => b.v - a.v).forEach(o => {
        dots[o.k].setAttribute('cx', X(f)); dots[o.k].setAttribute('cy', Y(o.v)); dots[o.k].setAttribute('visibility', 'visible');
        const row = document.createElement('div'); row.className = 'r';
        const i = document.createElement('i'); i.style.borderTopColor = o.s.ref ? 'var(--ink-3)' : o.s.color;
        const b = document.createElement('b'); b.textContent = o.v.toFixed(1);
        row.append(i, b, document.createTextNode(o.s.short || o.s.label));
        tip.appendChild(row);
      });
      tip.hidden = false;
      const bx = box.getBoundingClientRect();
      let left = ev.clientX - bx.left + 14;
      if (left + 190 > bx.width) left = ev.clientX - bx.left - 200;
      tip.style.left = left + 'px';
      tip.style.top = (ev.clientY - bx.top - 20) + 'px';
    };
    const leave = () => { tip.hidden = true; xh.setAttribute('visibility', 'hidden'); dots.forEach(d => d.setAttribute('visibility', 'hidden')); };
    hit.addEventListener('pointermove', move);
    hit.addEventListener('pointerleave', leave);
  }
  function mean(a) { const b = a.filter(v => v != null); return b.reduce((x, y) => x + y, 0) / b.length; }

  /* ---------------- speed bars ---------------- */
  function barChart(id, rows, realtime) {
    const box = document.getElementById(id);
    if (!box) return;
    const W = 860, L = 210, R = 60, rowH = 34, T = 8, H = T + rows.length * rowH + 30;
    const xmax = 120, X = v => L + v / xmax * (W - L - R);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Sampling time per clip' });
    box.querySelector('.plot').appendChild(svg);
    const grid = el('g', { class: 'grid' }, svg);
    for (let v = 0; v <= xmax; v += 20) {
      el('line', { x1: X(v), x2: X(v), y1: T, y2: H - 26 }, grid);
      txt(svg, X(v), H - 8, v + ' s', '', 'middle');
    }
    const tip = document.createElement('div');
    tip.className = 'tip';
    tip.hidden = true;
    box.appendChild(tip);
    rows.forEach((r, k) => {
      const y = T + k * rowH + 6, h = rowH - 12;
      txt(svg, L - 10, y + h / 2 + 5, r.label, 'bl', 'end');
      const w = Math.max(4, X(r.v) - L);
      const bar = el('path', { d: `M${L},${y}h${w - 4}a4,4 0 0 1 4,4v${h - 8}a4,4 0 0 1 -4,4h${-(w - 4)}z`, class: 'bar' + (r.slow ? ' slow' : '') }, svg);
      txt(svg, X(r.v) + 8, y + h / 2 + 5, r.v.toFixed(1) + ' s', 'bv');
      bar.addEventListener('pointermove', ev => {
        tip.replaceChildren();
        const t = document.createElement('div'); t.className = 't'; t.textContent = r.label; tip.appendChild(t);
        r.tip.forEach(([k2, v2]) => {
          const row = document.createElement('div'); row.className = 'r';
          const b = document.createElement('b'); b.textContent = v2;
          row.append(b, document.createTextNode(k2));
          tip.appendChild(row);
        });
        tip.hidden = false;
        const bx = box.getBoundingClientRect();
        tip.style.left = Math.min(ev.clientX - bx.left + 14, bx.width - 220) + 'px';
        tip.style.top = (ev.clientY - bx.top - 20) + 'px';
      });
      bar.addEventListener('pointerleave', () => { tip.hidden = true; });
    });
    el('line', { x1: X(realtime), x2: X(realtime), y1: T - 4, y2: H - 26, class: 'rt' }, svg);
    txt(svg, X(realtime) + 6, H - 30, `real time: the clip is ${realtime} s long`, 'rtl');
  }

  function init() {
    // Run a frozen program only when requested. These styles affect presentation,
    // not world.js, physics, input handling or the saved program files.
    document.querySelectorAll('.harness-launch').forEach(button => {
      button.addEventListener('click', () => {
        const frame = document.createElement('iframe');
        frame.title = button.getAttribute('aria-label');
        frame.addEventListener('load', () => {
          const style = frame.contentDocument.createElement('style');
          style.textContent = 'main{margin:0!important;padding:8px!important}h1{display:none}canvas{width:100%!important;height:auto!important}body{font-size:11px!important}#controls,#legend{font-size:10px!important;line-height:1.4!important}button{padding:6px 9px!important;margin:6px 3px!important}#error{white-space:pre-wrap}';
          frame.contentDocument.head.append(style);
          frame.contentWindow.focus();
        });
        frame.src = button.dataset.src;
        button.replaceWith(frame);
      });
    });
    renderMath();
    drawMask('mask-a', 110, false);
    drawMask('mask-b', 570, true);
    document.querySelectorAll('#realtime .vrow').forEach(wireRow);
    document.querySelectorAll('.cases button').forEach(b => b.addEventListener('click', () => setCase(b.dataset.case)));
    setCase(currentCase);

    const C = RT.curves;
    const S1 = 'var(--s1)', S2 = 'var(--s2)', S3 = 'var(--s3)';
    if (C.stage1) lineChart('ch-stage1', [
      { label: 'Teacher, bidirectional', short: 'teacher', data: C.stage1.teacher, ref: true },
      { label: 'Stage 1, own history', short: 'own history', data: C.stage1.free, color: S2 },
      { label: 'Stage 1, GT history', short: 'GT history', data: C.stage1.gthist, color: S1 },
    ]);
    if (C.stage2) lineChart('ch-stage2', [
      { label: 'Teacher, 35 × 2', short: 'teacher', data: C.stage2.teacher, ref: true },
      { label: 'Stage 2, 4 steps', short: '4 steps', data: C.stage2.s2_4step, color: S1 },
      { label: 'Stage 2, 2 steps', short: '2 steps', data: C.stage2.s2_2step, color: S2 },
    ]);
    if (C.stage3) lineChart('ch-stage3', [
      { label: 'Teacher, 35 × 2', short: 'teacher', data: C.stage3.teacher, ref: true },
      { label: 'Start: Stage 2 step 500', short: 'start', data: C.stage3.start, color: S2 },
      { label: 'Stage 3 iter 250, EMA', short: 'iter 250 EMA', data: C.stage3.s3_250_ema, color: S1 },
      { label: 'Stage 3 iter 500, raw', short: 'iter 500 raw', data: C.stage3.s3_500_raw, color: S3 },
      { label: 'Stage 3 iter 750, raw', short: 'iter 750 raw', data: C.stage3.s3_750_raw, color: 'var(--s4)' },
    ]);
    barChart('ch-speed', [
      { label: 'Teacher, bidirectional', v: 49.2, slow: true, tip: [['first new frame', '49.2 s']] },
      { label: 'Stage 1, AR 35 × 2', v: 114.4, slow: true, tip: [['first new frame', '4.6 s'], ['per latent frame', '3.79 s']] },
      { label: 'Stage 2, 4 steps', v: 11.4, tip: [['first new frame', '2.6 s'], ['per latent frame', '0.30 s']] },
      { label: 'Stage 2, 2 steps', v: 8.1, tip: [['first new frame', '2.5 s'], ['per latent frame', '0.19 s']] },
      { label: 'Stage 3, 2 steps', v: 8.7, tip: [['first new frame', '2.7 s'], ['per latent frame', '0.21 s']] },
    ], 4.84);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
