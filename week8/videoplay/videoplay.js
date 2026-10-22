// VideoPlay Harness figure, week 8: the wires between cards, fit-to-width scaling, and the small
// mock tennis game. Steps: 1 Decompose, 2 Mechanism, 3 Action (then back to 2), 4 Character, 5 Scene.
(() => {
  const fig = document.getElementById('fig');
  const wrap = document.getElementById('figWrap');

  // ---------------- poses for the mock game: one character, joints in a 40 x 60 box ----------------
  const POSES = {
    idle:    { hd:[20,8], n:[20,14], h:[20,32], eL:[14,21], hL:[13,29], eR:[26,21], hR:[28,28], r:[34,18], kL:[17,42], fL:[16,53], kR:[23,42], fR:[24,53] },
    move1:   { hd:[19,8], n:[19,14], h:[20,32], eL:[13,20], hL:[10,27], eR:[26,21], hR:[29,27], r:[35,18], kL:[15,41], fL:[10,51], kR:[25,42], fR:[29,52] },
    move2:   { hd:[21,8], n:[21,14], h:[20,32], eL:[15,21], hL:[15,29], eR:[27,20], hR:[30,26], r:[36,17], kL:[18,42], fL:[19,53], kR:[23,41], fR:[21,50] },
    prepare: { hd:[18,9], n:[19,15], h:[20,32], eL:[12,18], hL:[7,17],  eR:[27,21], hR:[32,25], r:[37,35], kL:[15,42], fL:[12,53], kR:[25,42], fR:[28,53] },
    hit:     { hd:[20,9], n:[20,15], h:[20,32], eL:[14,21], hL:[12,28], eR:[14,18], hR:[8,20],  r:[1,14],  kL:[16,42], fL:[13,53], kR:[24,42], fR:[27,53] },
    follow:  { hd:[21,9], n:[20,15], h:[20,32], eL:[15,22], hL:[16,29], eR:[14,14], hR:[13,8],  r:[23,1],  kL:[17,42], fL:[15,53], kR:[24,42], fR:[26,53] },
  };
  const SKIN = '#d9a07a', SHIRT = '#1d2a44', SHORTS = '#f4f4f4', HAIR = '#3a2a1e', RACKET = '#e8e8e8';

  // ---------------- wires ----------------
  const svg = document.getElementById('wires');
  const labels = document.getElementById('labels');
  const $ = id => document.getElementById(id);
  function box(el) {   // position inside the (unscaled) figure
    let x = 0, y = 0, e = el;
    while (e && e !== fig) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
    return { x, y, w: el.offsetWidth, h: el.offsetHeight, r: x + el.offsetWidth, b: y + el.offsetHeight };
  }
  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  function path(pts, cls, color, head = true) {
    const R = 9;
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x, y] = pts[i];
      if (i < pts.length - 1) {   // round the corner at pts[i]
        const [px, py] = pts[i - 1], [nx, ny] = pts[i + 1];
        const l1 = Math.hypot(x - px, y - py), l2 = Math.hypot(nx - x, ny - y);
        const r = Math.min(R, l1 / 2, l2 / 2);
        const ax = x - (x - px) / l1 * r, ay = y - (y - py) / l1 * r;
        const bx = x + (nx - x) / l2 * r, by = y + (ny - y) / l2 * r;
        d += ` L${ax} ${ay} Q${x} ${y} ${bx} ${by}`;
      } else d += ` L${x} ${y}`;
    }
    const col = color || css('--ink-2');
    let s = `<path d="${d}" class="${cls}" style="stroke:${col}"/>`;
    if (head) {
      const [x, y] = pts[pts.length - 1], [px, py] = pts[pts.length - 2];
      const a = Math.atan2(y - py, x - px), L = 8, W = 4.2;
      const p1 = [x - L * Math.cos(a) + W * Math.sin(a), y - L * Math.sin(a) - W * Math.cos(a)];
      const p2 = [x - L * Math.cos(a) - W * Math.sin(a), y - L * Math.sin(a) + W * Math.cos(a)];
      s += `<path d="M${x} ${y} L${p1[0]} ${p1[1]} L${p2[0]} ${p2[1]} Z" style="fill:${col};stroke:none"/>`;
    }
    return s;
  }
  const label = (x, y, html, cls = '') => `<div class="lbl ${cls}" style="left:${x}px;top:${y}px">${html}</div>`;

  function draw() {
    svg.setAttribute('viewBox', `0 0 ${fig.offsetWidth} ${fig.offsetHeight}`);
    const B = Object.fromEntries(['vid', 'decomp', 'mdraft', 'mfull', 'action', 'char', 'scene', 'agent', 'game',
      'ev-mech', 'ev-act', 'ev-char', 'evidence'].map(k => [k, box($(k))]));
    const gap = (a, b) => (B[a].r + B[b].x) / 2;      // x in the gutter between two cards
    const cx = (k, f = 0.5) => B[k].x + B[k].w * f;
    let s = '', L = '';

    // 1. Video -> Decompose
    const y1 = B.decomp.y + 70;
    s += path([[B.vid.r, y1], [B.decomp.x, y1]], 'gen');

    // Decompose -> Mechanism draft (passive + dynamic parts)
    const y2 = B.mdraft.y + B.mdraft.h * 0.5;
    s += path([[B.decomp.r, y2], [B.mdraft.x, y2]], 'gen');
    L += label(gap('decomp', 'mdraft'), y2 - 14, '<b>2</b>');

    // video evidence bus, lower lane: drops into Action, Character, Scene
    const yV = B.mdraft.y - 24;
    s += path([[cx('vid'), B.vid.y], [cx('vid'), yV], [cx('scene', 0.35), yV], [cx('scene', 0.35), B.scene.y]], 'bus', css('--ink-3'));
    s += path([[cx('action'), yV], [cx('action'), B.action.y]], 'bus', css('--ink-3'));
    s += path([[cx('char', 0.35), yV], [cx('char', 0.35), B.char.y]], 'bus', css('--ink-3'));
    L += label(cx('mdraft', 0.5), yV, 'video evidence');

    // 2 -> 3: what the player must be able to do; 3 -> 2: states + attributes refine the mechanism
    const y3 = B.mdraft.y + B.mdraft.h * 0.5;
    s += path([[B.mdraft.r, y3], [B.action.x, y3]], 'gen');
    L += label(gap('mdraft', 'action'), y3 - 14, '<b>3</b>');
    const y32 = B.mfull.y + B.mfull.h * 0.25;
    s += path([[B.action.x, y32], [B.mfull.r, y32]], 'gen', css('--act'));
    L += label(gap('mdraft', 'action'), y32 - 14, '↺<b>2</b>');

    // 3 -> 4: one clip per state + connections
    const y4 = B.action.y + B.action.h * 0.86;
    s += path([[B.action.r, y4], [B.char.x, y4]], 'gen');
    L += label(gap('action', 'char'), y4 - 14, '<b>4</b>');

    // specs from every module -> Coding Agent (through the gutter before column 7)
    const ySpec = Math.max(B.mfull.b, B.action.b, B.char.b, B.scene.b) + 30;
    for (const k of ['mfull', 'action', 'char', 'scene']) s += path([[cx(k, 0.35), B[k].b], [cx(k, 0.35), ySpec]], 'gen', null, false);
    const xg = gap('scene', 'agent'), yAg = B.agent.y + B.agent.h * 0.5;
    s += path([[cx('mfull', 0.35), ySpec], [xg, ySpec], [xg, yAg], [B.agent.x, yAg]], 'gen');
    L += label((cx('scene', 0.35) + xg) / 2, ySpec + 13, 'specs');

    // agent -> game -> run evidence -> every evaluation card
    s += path([[cx('agent'), B.agent.b], [cx('agent'), B.game.y]], 'gen');
    s += path([[cx('game'), B.game.b], [cx('game'), B.evidence.y]], 'gen');
    L += label(cx('game') + 34, (B.game.b + B.evidence.y) / 2, 'run');
    const evs = ['ev-mech', 'ev-act', 'ev-char'];
    const yEv = Math.max(...[...evs, 'evidence'].map(k => B[k].b)) + 20;
    s += path([[cx('evidence'), B.evidence.b], [cx('evidence'), yEv], [cx('ev-mech'), yEv]], 'gen', css('--ink-3'), false);
    for (const k of evs) s += path([[cx(k), yEv], [cx(k), B[k].b]], 'gen', css('--ink-3'));
    L += label((cx('ev-char') + cx('evidence')) / 2, yEv, 'same evidence feeds every check');

    // targeted fixes: each evaluation card back to the module it names
    for (const [e, m, c] of [['ev-mech', 'mfull', '--mech'], ['ev-act', 'action', '--act'], ['ev-char', 'char', '--chr']]) {
      const x = cx(m, 0.72);
      s += path([[x, B[e].y], [x, B[m].b]], 'fix', css(c));
      L += label(x + 22, (B[m].b + ySpec) / 2 - 2, 'fix', 'fixl');
    }

    svg.innerHTML = s;
    labels.innerHTML = L;
  }

  // ---------------- fit the fixed-width figure to the window ----------------
  let full = wrap.classList.contains('full');
  function fit() {
    const W = fig.offsetWidth, H = fig.offsetHeight, avail = wrap.clientWidth;
    if (full) { fig.style.transform = 'none'; fig.style.marginLeft = '0'; wrap.style.height = ''; return; }
    const sc = Math.min(1, avail / W);
    fig.style.transform = `scale(${sc})`;
    fig.style.marginLeft = `${Math.max(0, (avail - W * sc) / 2)}px`;
    wrap.style.height = `${H * sc + 32}px`;
  }
  $('zoom').addEventListener('click', e => {
    full = !full;
    wrap.classList.toggle('full', full);
    e.target.textContent = full ? 'Fit to width' : 'View at 100 %';
    fit();
  });
  const redraw = () => { draw(); fit(); };
  window.addEventListener('resize', redraw);
  // Keep SVG routes aligned when images, fonts or card layout change after loading.
  let redrawFrame;
  new ResizeObserver(() => {
    cancelAnimationFrame(redrawFrame);
    redrawFrame = requestAnimationFrame(redraw);
  }).observe(fig, { box: 'border-box' });
  window.addEventListener('load', redraw);
  if (document.fonts) document.fonts.ready.then(redraw);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', draw);
  redraw();

  // ---------------- mock game: move, swing, return the ball, +1 per return ----------------
  const cv = $('play'), g = cv.getContext('2d');
  const CW = cv.width, CH = cv.height;
  const court = { nearY: 272, farY: 40, nearL: 60, nearR: 440, farL: 165, farR: 335, netY: 128 };
  const xAt = (y, side) => {   // court edge x at height y (perspective trapezoid)
    const t = (y - court.farY) / (court.nearY - court.farY);
    return side < 0 ? court.farL + (court.nearL - court.farL) * t : court.farR + (court.nearR - court.farR) * t;
  };
  const S = { px: 250, py: 250, swing: -1, face: 1, score: 0, ball: null, msg: '', msgT: 0, keys: {}, lastKey: -1e9, tick: 0, moveT: 0 };
  function serve() {
    const x = 210 + Math.random() * 80;
    const tx = 120 + Math.random() * 260;
    S.ball = { x, y: 52, vx: (tx - x) / 95, vy: 2.2, returned: false, scored: false };
  }
  serve();
  const SW = { prep: 6, hit: 4, follow: 8 };
  const SW_LEN = SW.prep + SW.hit + SW.follow;
  function racketPt() { return { x: S.px - 24, y: S.py - 58 }; }
  function step() {
    S.tick++;
    const human = S.tick - S.lastKey < 240;
    let dx = 0, dy = 0, swingNow = false;
    if (human) {
      dx = (S.keys.ArrowRight ? 1 : 0) - (S.keys.ArrowLeft ? 1 : 0);
      dy = (S.keys.ArrowDown ? 1 : 0) - (S.keys.ArrowUp ? 1 : 0);
      swingNow = !!S.keys[' '];
    } else if (S.ball && !S.ball.returned) {   // demo player when nobody is playing
      const r = racketPt();
      const tx = S.ball.x + 24;
      if (Math.abs(tx - S.px) > 4) dx = Math.sign(tx - S.px);
      if (S.ball.y > r.y - 40 && S.ball.y < r.y - 14) swingNow = true;
    }
    if (S.swing >= 0) {                      // swing locks movement
      S.swing++;
      if (S.swing >= SW_LEN) S.swing = -1;
    } else {
      if (swingNow) S.swing = 0;
      const n = Math.hypot(dx, dy) || 1;
      S.px = Math.max(40, Math.min(460, S.px + dx / n * 4));
      S.py = Math.max(170, Math.min(292, S.py + dy / n * 4));
      if (dx || dy) S.moveT++; else S.moveT = 0;
    }
    const b = S.ball;
    if (!b) return;
    b.x += b.vx; b.y += b.vy;
    const inWin = S.swing >= SW.prep && S.swing < SW.prep + SW.hit;
    const r = racketPt();
    if (!b.returned && inWin && Math.hypot(b.x - r.x, b.y - r.y) < 34) {
      b.returned = true;
      const tx = 180 + Math.random() * 140;
      b.vy = -3.4; b.vx = (tx - b.x) / ((b.y - 60) / 3.4);
    }
    if (b.returned && b.y < 62) {
      const ok = b.x > xAt(b.y, -1) && b.x < xAt(b.y, 1);
      if (ok && !b.scored) { b.scored = true; S.score++; S.msg = '+1'; } else if (!ok) S.msg = 'out';
      S.msgT = 50; S.ball = null; setTimeout(serve, 700);
    } else if (!b.returned && b.y > CH + 10) {
      S.msg = 'miss: serve again'; S.msgT = 60; S.ball = null; setTimeout(serve, 700);
    }
  }
  function drawPose(p, x, y, sc, flip) {
    g.save(); g.translate(x, y); g.scale(sc * flip, sc); g.translate(-20, -55);
    const L = (a, b, c, w) => { g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); };
    L(p.h, p.kL, SKIN, 2.6); L(p.kL, p.fL, SKIN, 2.4); L(p.h, p.kR, SKIN, 2.6); L(p.kR, p.fR, SKIN, 2.4);
    g.fillStyle = SHORTS; g.fillRect(p.h[0] - 5, p.h[1] - 2, 10, 7);
    L(p.n, p.h, SHIRT, 8);
    L(p.n, p.eL, SKIN, 2.4); L(p.eL, p.hL, SKIN, 2.2); L(p.n, p.eR, SKIN, 2.4); L(p.eR, p.hR, SKIN, 2.2);
    L(p.hR, p.r, RACKET, 2);
    g.fillStyle = SKIN; g.beginPath(); g.arc(p.hd[0], p.hd[1], 4.6, 0, 7); g.fill();
    g.fillStyle = HAIR; g.beginPath(); g.arc(p.hd[0], p.hd[1] - 1, 4.6, Math.PI, 0); g.fill();
    g.restore();
  }
  function render() {
    g.fillStyle = '#c8643a'; g.fillRect(0, 0, CW, CH);
    g.strokeStyle = '#f5efe6'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(court.nearL, court.nearY); g.lineTo(court.nearR, court.nearY); g.lineTo(court.farR, court.farY); g.lineTo(court.farL, court.farY); g.closePath(); g.stroke();
    const sv = 196;
    g.beginPath(); g.moveTo(xAt(sv, -1) + 20, sv); g.lineTo(xAt(sv, 1) - 20, sv); g.moveTo(250, court.netY); g.lineTo(250, sv); g.stroke();
    g.strokeStyle = '#2b2b2b'; g.lineWidth = 4; g.beginPath(); g.moveTo(xAt(court.netY, -1) - 12, court.netY); g.lineTo(xAt(court.netY, 1) + 12, court.netY); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1; g.beginPath(); g.moveTo(xAt(court.netY, -1) - 12, court.netY - 2); g.lineTo(xAt(court.netY, 1) + 12, court.netY - 2); g.stroke();
    // opponent stand-in on the far side
    drawPose(POSES.idle, 250, 46, 0.5, 1);
    if (S.ball) {
      g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(S.ball.x + 3, S.ball.y + 6, 4, 2, 0, 0, 7); g.fill();
      g.fillStyle = '#e6ff3c'; g.beginPath(); g.arc(S.ball.x, S.ball.y, 4.2, 0, 7); g.fill();
    }
    let pose = POSES.idle;
    if (S.swing >= 0) pose = S.swing < SW.prep ? POSES.prepare : S.swing < SW.prep + SW.hit ? POSES.hit : POSES.follow;
    else if (S.moveT) pose = Math.floor(S.moveT / 8) % 2 ? POSES.move1 : POSES.move2;
    g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(S.px, S.py, 14, 4, 0, 0, 7); g.fill();
    drawPose(pose, S.px, S.py, 1.6, 1);
    g.fillStyle = 'rgba(15,17,22,.75)'; g.fillRect(10, CH - 40, 92, 30);   // scoreboard: bottom left, as in the video
    g.fillStyle = '#fff'; g.font = '600 15px "IBM Plex Mono", monospace'; g.fillText(`score ${S.score}`, 18, CH - 19);
    g.font = '11px "IBM Plex Mono", monospace'; g.fillStyle = 'rgba(255,255,255,.8)';
    g.fillText(S.tick - S.lastKey < 240 ? 'you' : 'demo', CW - 44, 22);
    if (S.msgT > 0) { S.msgT--; g.font = '600 18px "Source Sans 3", sans-serif'; g.fillStyle = '#fff'; g.fillText(S.msg, S.px - 14, S.py - 100); }
  }
  const KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '];
  cv.addEventListener('keydown', e => { if (KEYS.includes(e.key)) { e.preventDefault(); S.keys[e.key] = true; S.lastKey = S.tick; } });
  cv.addEventListener('keyup', e => { if (KEYS.includes(e.key)) S.keys[e.key] = false; });
  cv.addEventListener('blur', () => { S.keys = {}; });
  cv.addEventListener('click', () => cv.focus());
  (function loop() { step(); render(); requestAnimationFrame(loop); })();
})();
