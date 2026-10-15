"use strict";
var __hat_opus = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // runs/claude/r1/work/src/games/g3_combined.ts
  var g3_combined_exports = {};
  __export(g3_combined_exports, {
    DIALOGUE_CONFIG: () => DIALOGUE_CONFIG,
    createDialogue: () => createDialogue,
    createG3: () => createG3
  });

  // runs/claude/r1/work/src/core/types.ts
  var ACTIONS = [
    "move_up",
    "move_down",
    "move_left",
    "move_right",
    "shoot",
    "interact",
    "select_up",
    "select_down",
    "cancel",
    "reset"
  ];

  // runs/claude/r1/work/src/core/input.ts
  var ORDER = new Map(ACTIONS.map((a, i) => [a, i]));
  var norm = (s) => [...new Set(s)].sort((a, b) => ORDER.get(a) - ORDER.get(b));
  function makeFrame(held = [], pressed = [], released = []) {
    return { held: norm(held), pressed: norm(pressed), released: norm(released) };
  }
  var isHeld = (f, a) => f.held.includes(a);
  var isPressed = (f, a) => f.pressed.includes(a);

  // runs/claude/r1/work/src/core/compose.ts
  function composeGame(id, host, extensions = []) {
    let seed = 0;
    let events = [];
    let occupied = false;
    const emit = (e) => {
      events.push(e);
    };
    const reset = (s = seed) => {
      seed = s;
      host.reset(seed);
      for (const x of extensions) x.reset(host.api());
      occupied = false;
    };
    reset(0);
    const snapshot = () => {
      const s = { ...host.snapshot(), input_occupied: occupied };
      for (const x of extensions) s[x.id] = x.snapshot();
      return s;
    };
    const initial = snapshot();
    return {
      id,
      reset,
      step(frame) {
        events = [];
        if (isPressed(frame, "reset")) {
          reset();
          emit({ type: "reset" });
          return;
        }
        occupied = false;
        let f = frame;
        for (const x of extensions) {
          const r = x.route(f, host.api(), emit);
          if (r.occupied) occupied = true;
          f = r.frame;
        }
        if (!occupied) host.step(f, emit);
      },
      snapshot,
      render(ctx) {
        host.render(ctx);
        for (const x of extensions) x.render(ctx, host.api());
      },
      getEvents: () => events,
      describe: () => ({
        config: { host: host.config, extensions: Object.fromEntries(extensions.map((x) => [x.id, x.config])) },
        initial_state: initial,
        seed
      })
    };
  }

  // runs/claude/r1/work/src/core/draw.ts
  var FONT_FAMILY = '"Noto Sans SC", "Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", sans-serif';
  var PIXEL = 3;
  var HUMANOID = [
    "....HHHH....",
    "...HHHHHH...",
    "..HHSSSSHH..",
    "...SKSSKS...",
    "...SSSSSS...",
    "....SMMS....",
    "..CCCCCCCC..",
    ".SCCCCCCCCS.",
    ".SCCCLLCCCS.",
    ".S.CCCCCC.S.",
    "...CCCCCC...",
    "...PPPPPP...",
    "...PP..PP...",
    "...PP..PP...",
    "...PP..PP...",
    "..FFF..FFF.."
  ];
  var HERO_PAL = { H: "#3a2a1e", S: "#f2c79a", K: "#1a1a2a", M: "#c0705a", C: "#3a6fd8", L: "#8fb4ff", P: "#2a3350", F: "#5a3a22" };
  function drawSprite(ctx, rows, pal, cx, cy, opts = {}) {
    const s = opts.scale ?? PIXEL;
    const h = rows.length, w = rows[0].length;
    ctx.save();
    ctx.translate(Math.round(cx), Math.round(cy));
    if (opts.rotate90) ctx.rotate(Math.PI / 2);
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        const k = rows[r][c];
        if (k === ".") continue;
        ctx.fillStyle = opts.tint ?? pal[k] ?? "#f0f";
        const cc = opts.flip ? w - 1 - c : c;
        ctx.fillRect((cc - w / 2) * s, (r - h / 2) * s, s, s);
      }
    }
    ctx.restore();
  }
  function rect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
  var textCache = /* @__PURE__ */ new Map();
  function glyphCanvas(text, size, color) {
    const key = `${size}|${color}|${text}`;
    const hit = textCache.get(key);
    if (hit) return hit;
    const probe = document.createElement("canvas").getContext("2d");
    probe.font = `500 ${size}px ${FONT_FAMILY}`;
    const w = Math.max(1, Math.ceil(probe.measureText(text).width) + 2);
    const h = Math.ceil(size * 1.4);
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    const g = cv.getContext("2d", { willReadFrequently: true });
    g.font = probe.font;
    g.textBaseline = "middle";
    g.fillStyle = "#000";
    g.fillText(text, 1, h / 2);
    const img = g.getImageData(0, 0, w, h);
    const [r, gg, b] = hexRgb(color);
    for (let i = 0; i < img.data.length; i += 4) {
      const on = img.data[i + 3] > 110;
      img.data[i] = r;
      img.data[i + 1] = gg;
      img.data[i + 2] = b;
      img.data[i + 3] = on ? 255 : 0;
    }
    g.putImageData(img, 0, 0);
    if (textCache.size > 2e3) textCache.clear();
    textCache.set(key, cv);
    return cv;
  }
  function hexRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255];
  }
  function pixelText(ctx, text, x, y, opts = {}) {
    if (!text) return 0;
    const size = opts.size ?? 16, scale = opts.scale ?? 2;
    const cv = glyphCanvas(text, size, opts.color ?? "#202830");
    const w = cv.width * scale, h = cv.height * scale;
    let left = x;
    if (opts.align === "center") left = x - w / 2;
    else if (opts.align === "right") left = x - w;
    ctx.imageSmoothingEnabled = false;
    if (opts.shadow) {
      const sh = glyphCanvas(text, size, opts.shadow);
      ctx.drawImage(sh, Math.round(left) + scale, Math.round(y - h / 2) + scale, w, h);
    }
    ctx.drawImage(cv, Math.round(left), Math.round(y - h / 2), w, h);
    return w;
  }
  function tileHash(i, j) {
    let h = i * 374761393 + j * 668265263 | 0;
    h = (h ^ h >>> 13) * 1274126177;
    return ((h ^ h >>> 16) >>> 0) / 4294967296;
  }

  // runs/claude/r1/work/src/shooter/config.ts
  var SHOOTER_CONFIG = {
    arena: { w: 960, h: 540, wall: 24 },
    /** Cover blocks; bullets stop on them, characters cannot walk through them. */
    crates: [
      { x: 432, y: 120, w: 96, h: 48 },
      { x: 432, y: 372, w: 96, h: 48 }
    ],
    body: { w: 28, h: 44 },
    // character hitbox
    bullet: { size: 8 },
    hurt_flash_ticks: 8,
    player: {
      x: 200,
      y: 270,
      facing: [1, 0],
      hp: 5,
      speed: 3,
      // 180 px/s
      fire_cooldown: 15,
      // 0.25 s between shots while J is held
      bullet_speed: 8
      // 480 px/s, along the 8-way facing
    },
    enemy: {
      x: 760,
      y: 270,
      facing: [-1, 0],
      hp: 5,
      first_fire_delay: 60,
      // 1.0 s after reset
      fire_interval: 72,
      // 1.2 s
      bullet_speed: 5
      // 300 px/s, horizontal toward the player's side
    }
  };

  // runs/claude/r1/work/src/shooter/render.ts
  var ENEMY_PAL = { H: "#1e1e24", S: "#e8b88a", K: "#1a1a2a", M: "#a0503a", C: "#c8382e", L: "#ff8a7a", P: "#3a2a2a", F: "#222222" };
  var DEAD_PAL = { H: "#55555c", S: "#9a9aa0", K: "#3a3a40", M: "#6a6a70", C: "#707078", L: "#8a8a92", P: "#4a4a52", F: "#3a3a40" };
  var TILE = 48;
  function drawArena(ctx, cfg) {
    const { w, h, wall } = cfg.arena;
    const shades = ["#c9b48a", "#c4af85", "#cebb92"];
    for (let j = 0; j * TILE < h; j++) {
      for (let i = 0; i * TILE < w; i++) {
        rect(ctx, i * TILE, j * TILE, TILE, TILE, shades[Math.floor(tileHash(i, j) * 3)]);
        if (tileHash(j, i) > 0.82) rect(ctx, i * TILE + 18, j * TILE + 24, 6, 3, "#b39f76");
      }
    }
    rect(ctx, 0, 0, w, wall, "#4a4038");
    rect(ctx, 0, h - wall, w, wall, "#4a4038");
    rect(ctx, 0, 0, wall, h, "#4a4038");
    rect(ctx, w - wall, 0, wall, h, "#4a4038");
    rect(ctx, wall, wall - 4, w - 2 * wall, 4, "#6a5c50");
    for (const c of cfg.crates) {
      rect(ctx, c.x, c.y, c.w, c.h, "#5e3e1e");
      rect(ctx, c.x + 3, c.y + 3, c.w - 6, c.h - 6, "#9a6a3a");
      for (let x = c.x + 3; x < c.x + c.w - 3; x += 24) rect(ctx, x, c.y + 3, 3, c.h - 6, "#7a522c");
      rect(ctx, c.x + 3, c.y + c.h / 2 - 2, c.w - 6, 3, "#7a522c");
      rect(ctx, c.x, c.y + c.h, c.w, 6, "rgba(0,0,0,0.18)");
    }
  }
  function drawFighter(ctx, f, pal, cfg) {
    rect(ctx, f.x - 16, f.y + 21, 32, 6, "rgba(0,0,0,0.22)");
    if (!f.alive) {
      drawSprite(ctx, HUMANOID, DEAD_PAL, f.x, f.y + 12, { rotate90: true });
      return;
    }
    const flash = f.hurt > 0 && f.hurt % 4 < 2;
    drawSprite(ctx, HUMANOID, pal, f.x, f.y, { flip: f.facing[0] < 0, tint: flash ? "#ffffff" : void 0 });
    const n = Math.hypot(f.facing[0], f.facing[1]) || 1;
    const gx = f.x + f.facing[0] / n * 18, gy = f.y + 4 + f.facing[1] / n * 14;
    rect(ctx, gx - 5, gy - 3, 10, 6, "#2a2a30");
    rect(ctx, gx - 2, gy - 2, 4, 3, "#5a5a66");
    const max = f.id === "player" ? cfg.player.hp : cfg.enemy.hp;
    const x0 = f.x - max * 8 / 2;
    for (let i = 0; i < max; i++) rect(ctx, x0 + i * 8, f.y - 36, 6, 5, i < f.hp ? "#e83a3a" : "#5a3030");
  }
  var HEART = [".HH.HH.", "HHHHHHH", "HHHHHHH", ".HHHHH.", "..HHH..", "...H..."];
  function hud(ctx, s, cfg) {
    const row = (label, f, max, x, alignRight) => {
      const w = 64 + max * 26;
      const left = alignRight ? x - w : x;
      rect(ctx, left, 30, w, 34, "rgba(20,20,28,0.55)");
      pixelText(ctx, label, left + 8, 47, { size: 12, color: "#f0f0f0" });
      for (let i = 0; i < max; i++) {
        drawSprite(ctx, HEART, { H: i < f.hp ? "#ff4a4a" : "#5a3a3a" }, left + 72 + i * 26, 47);
      }
    };
    row("\u73A9\u5BB6", s.player, cfg.player.hp, 32, false);
    row("\u5BF9\u624B", s.enemy, cfg.enemy.hp, 928, true);
  }
  function renderShooter(ctx, s, cfg) {
    drawArena(ctx, cfg);
    const order = [s.player, s.enemy].sort((a, b) => a.y - b.y);
    for (const f of order) drawFighter(ctx, f, f.id === "player" ? HERO_PAL : ENEMY_PAL, cfg);
    for (const b of s.bullets) {
      const c = b.owner === "player" ? ["#1e3a8a", "#9fd0ff"] : ["#7a1010", "#ffb070"];
      rect(ctx, b.x - 5, b.y - 5, 10, 10, c[0]);
      rect(ctx, b.x - 3, b.y - 3, 6, 6, c[1]);
    }
    hud(ctx, s, cfg);
    if (!s.player.alive || !s.enemy.alive) {
      rect(ctx, 280, 230, 400, 80, "rgba(20,20,28,0.78)");
      pixelText(ctx, s.player.alive ? "\u5BF9\u624B\u5012\u4E0B" : "\u4F60\u5012\u4E0B\u4E86", 480, 256, { size: 16, color: "#ffffff", align: "center" });
      pixelText(ctx, "\u6309 R \u91CD\u7F6E", 480, 290, { size: 12, color: "#c8c8d0", align: "center" });
    }
  }

  // runs/claude/r1/work/src/shooter/state.ts
  function initialShooterState(cfg) {
    const p = cfg.player, e = cfg.enemy;
    return {
      gameplay_tick: 0,
      player: { id: "player", x: p.x, y: p.y, facing: [...p.facing], hp: p.hp, alive: true, cooldown: 0, hurt: 0 },
      enemy: { id: "enemy", x: e.x, y: e.y, facing: [...e.facing], hp: e.hp, alive: true, cooldown: e.first_fire_delay, hurt: 0 },
      bullets: [],
      next_bullet_id: 1
    };
  }

  // runs/claude/r1/work/src/core/physics.ts
  var overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  var centerBox = (cx, cy, w, h) => ({ x: cx - w / 2, y: cy - h / 2, w, h });
  function moveBody(cx, cy, w, h, dx, dy, solids) {
    let x = cx, y = cy;
    if (dx !== 0) {
      x += dx;
      for (const s of solids) {
        if (!overlap(centerBox(x, y, w, h), s)) continue;
        x = dx > 0 ? s.x - w / 2 : s.x + s.w + w / 2;
      }
    }
    if (dy !== 0) {
      y += dy;
      for (const s of solids) {
        if (!overlap(centerBox(x, y, w, h), s)) continue;
        y = dy > 0 ? s.y - h / 2 : s.y + s.h + h / 2;
      }
    }
    return [x, y];
  }

  // runs/claude/r1/work/src/shooter/collision.ts
  function staticSolids(cfg) {
    const { w, h, wall } = cfg.arena;
    return [
      { x: 0, y: 0, w, h: wall },
      { x: 0, y: h - wall, w, h: wall },
      { x: 0, y: 0, w: wall, h },
      { x: w - wall, y: 0, w: wall, h },
      ...cfg.crates
    ];
  }
  var fighterBox = (f, cfg) => centerBox(f.x, f.y, cfg.body.w, cfg.body.h);
  var bulletBox = (b, cfg) => centerBox(b.x, b.y, cfg.bullet.size, cfg.bullet.size);

  // runs/claude/r1/work/src/shooter/step.ts
  var MUZZLE = 22;
  function fire(s, f, dir, speed, emit) {
    const n = Math.hypot(dir[0], dir[1]) || 1;
    const ux = dir[0] / n, uy = dir[1] / n;
    const b = { id: s.next_bullet_id++, owner: f.id, x: f.x + ux * MUZZLE, y: f.y + uy * MUZZLE, vx: ux * speed, vy: uy * speed };
    s.bullets.push(b);
    emit({ type: "shot", by: f.id, bullet: b.id, x: b.x, y: b.y, vx: b.vx, vy: b.vy });
  }
  function stepShooter(s, frame, cfg, emit) {
    const { player: p, enemy: e } = s;
    const solids = staticSolids(cfg);
    if (p.alive) {
      const sx = (isHeld(frame, "move_right") ? 1 : 0) - (isHeld(frame, "move_left") ? 1 : 0);
      const sy = (isHeld(frame, "move_down") ? 1 : 0) - (isHeld(frame, "move_up") ? 1 : 0);
      if (sx || sy) {
        const k = sx && sy ? Math.SQRT1_2 : 1;
        const blockers = e.alive ? [...solids, fighterBox(e, cfg)] : solids;
        [p.x, p.y] = moveBody(p.x, p.y, cfg.body.w, cfg.body.h, sx * cfg.player.speed * k, sy * cfg.player.speed * k, blockers);
        p.facing = [sx, sy];
      }
    }
    if (p.cooldown > 0) p.cooldown--;
    if (p.alive && p.cooldown === 0 && (isHeld(frame, "shoot") || isPressed(frame, "shoot"))) {
      fire(s, p, p.facing, cfg.player.bullet_speed, emit);
      p.cooldown = cfg.player.fire_cooldown;
    }
    if (e.alive) {
      if (p.x !== e.x) e.facing = [p.x < e.x ? -1 : 1, 0];
      if (e.cooldown > 0) e.cooldown--;
      if (e.cooldown === 0 && p.alive) {
        fire(s, e, e.facing, cfg.enemy.bullet_speed, emit);
        e.cooldown = cfg.enemy.fire_interval;
      }
    }
    const kept = [];
    for (const b of s.bullets) {
      b.x += b.vx;
      b.y += b.vy;
      const bb = bulletBox(b, cfg);
      if (solids.some((w) => overlap(bb, w))) continue;
      const target = [p, e].find((f) => f.id !== b.owner && f.alive && overlap(bb, fighterBox(f, cfg)));
      if (target) {
        target.hp = Math.max(0, target.hp - 1);
        target.hurt = cfg.hurt_flash_ticks;
        emit({ type: "hit", target: target.id, by: b.owner, bullet: b.id, hp: target.hp });
        if (target.hp === 0) {
          target.alive = false;
          emit({ type: "death", target: target.id });
        }
        continue;
      }
      kept.push(b);
    }
    s.bullets = kept;
    for (const f of [p, e]) if (f.hurt > 0) f.hurt--;
    s.gameplay_tick++;
  }

  // runs/claude/r1/work/src/shooter/host.ts
  var KIND = { player: "player", enemy: "opponent" };
  function createShooterHost(cfg = SHOOTER_CONFIG) {
    let s = initialShooterState(cfg);
    const view = (f) => ({
      id: f.id,
      kind: KIND[f.id],
      tags: f.id === "player" ? ["controlled"] : [],
      x: f.x,
      y: f.y,
      w: cfg.body.w,
      h: cfg.body.h,
      alive: f.alive,
      facing: [f.facing[0], f.facing[1]]
    });
    return {
      config: cfg,
      reset() {
        s = initialShooterState(cfg);
      },
      step(frame, emit) {
        stepShooter(s, frame, cfg, emit);
      },
      snapshot: () => structuredClone(s),
      render(ctx) {
        renderShooter(ctx, s, cfg);
      },
      api: () => ({ entities: () => [view(s.player), view(s.enemy)], gameplayTick: () => s.gameplay_tick }),
      state: () => s
    };
  }

  // runs/claude/r1/work/src/games/g3_combined.ts
  var SPEAKER = "\u5B88\u536B";
  var SCRIPT = [
    { text: "\u7B49\u7B49\uFF0C\u5148\u804A\u4E24\u53E5?" },
    {
      text: "\u4F60\u60F3\u95EE\u4EC0\u4E48?",
      choices: [
        { label: "\u4F60\u5728\u8FD9\u91CC\u505A\u4EC0\u4E48?", next: [{ text: "\u5B88\u7740\u8FD9\u4E2A\u5C0F\u623F\u95F4\u3002\u804A\u5B8C\u6211\u4EEC\u7EE7\u7EED\u3002" }] },
        { label: "\u518D\u89C1\u3002", next: [{ text: "\u597D\uFF0C\u56DE\u5934\u89C1\u3002" }] }
      ]
    }
  ];
  var DIALOGUE_CONFIG = {
    interact_radius: 72,
    // px, center to center, inclusive
    ticks_per_char: 5,
    // typewriter speed
    blink_half_period: 30,
    // continue marker: 30 ticks on, 30 off (clock starts when the dialogue opens)
    speaker: SPEAKER,
    script: SCRIPT
  };
  var GAMEPLAY_KEYS = ["move_up", "move_down", "move_left", "move_right", "shoot"];
  var DARK = "#22304a";
  var LIGHT = "#89a5c7";
  var FILL = "#f5f6ee";
  var INK = "#22262c";
  function panel(ctx, x, y, w, h) {
    rect(ctx, x, y, w, h, DARK);
    rect(ctx, x + 4, y + 4, w - 8, h - 8, LIGHT);
    rect(ctx, x + 8, y + 8, w - 16, h - 16, DARK);
    rect(ctx, x + 10, y + 10, w - 20, h - 20, FILL);
  }
  function tri(ctx, x, y, rows, centered) {
    const max = Math.max(...rows);
    rows.forEach((n, i) => rect(ctx, x + (centered ? (max - n) / 2 * 3 : 0), y + i * 3, n * 3, 3, DARK));
  }
  function createDialogue(cfg = DIALOGUE_CONFIG) {
    let active = false;
    let lines = [];
    let lineIdx = 0;
    let chars = 0;
    let lineTicks = 0;
    let clock = 0;
    let choosing = false;
    let selected = 0;
    let closedThisTick = false;
    let blocked = /* @__PURE__ */ new Set();
    const line = () => lines[lineIdx];
    const lineDone = () => chars >= [...line().text].length;
    const find = (h) => {
      const es = h.entities();
      return { player: es.find((e) => e.kind === "player"), npc: es.find((e) => e.kind === "opponent") };
    };
    const inRange = (p, n) => p.alive && n.alive && Math.hypot(p.x - n.x, p.y - n.y) <= cfg.interact_radius;
    const startLines = (ls) => {
      lines = ls;
      lineIdx = 0;
      chars = 0;
      lineTicks = 0;
      choosing = false;
      selected = 0;
    };
    const reset = () => {
      active = false;
      lines = [];
      lineIdx = 0;
      chars = 0;
      lineTicks = 0;
      clock = 0;
      choosing = false;
      selected = 0;
      closedThisTick = false;
      blocked = /* @__PURE__ */ new Set();
    };
    const close = (frame) => {
      reset();
      closedThisTick = true;
      blocked = new Set(GAMEPLAY_KEYS.filter((a) => isHeld(frame, a)));
    };
    return {
      id: "dialogue",
      config: cfg,
      reset,
      route(frame, host) {
        closedThisTick = false;
        if (!active) {
          for (const a of [...blocked]) if (!isHeld(frame, a) || isPressed(frame, a)) blocked.delete(a);
          const { player, npc } = find(host);
          if (isPressed(frame, "interact") && inRange(player, npc)) {
            active = true;
            clock = 0;
            startLines(cfg.script);
            return { occupied: true, frame };
          }
          if (!blocked.size) return { occupied: false, frame };
          const keep = (xs) => xs.filter((a) => !blocked.has(a));
          return { occupied: false, frame: makeFrame(keep(frame.held), keep(frame.pressed), frame.released) };
        }
        clock++;
        lineTicks++;
        const len = [...line().text].length;
        if (!choosing && chars < len && lineTicks % cfg.ticks_per_char === 0) chars++;
        if (isPressed(frame, "cancel")) {
          close(frame);
          return { occupied: true, frame };
        }
        if (choosing) {
          const n = line().choices.length;
          if (isPressed(frame, "select_up")) selected = (selected + n - 1) % n;
          if (isPressed(frame, "select_down")) selected = (selected + 1) % n;
          if (isPressed(frame, "interact")) startLines(line().choices[selected].next);
        } else if (isPressed(frame, "interact")) {
          if (!lineDone()) chars = len;
          else if (line().choices) {
            choosing = true;
            selected = 0;
          } else if (lineIdx + 1 < lines.length) {
            lineIdx++;
            chars = 0;
            lineTicks = 0;
          } else close(frame);
        }
        return { occupied: true, frame };
      },
      render(ctx, host) {
        if (!active) {
          if (closedThisTick) return;
          const { player, npc } = find(host);
          if (!inRange(player, npc)) return;
          const x = Math.round(npc.x), y = Math.round(npc.y);
          rect(ctx, x - 52, y - 102, 104, 36, DARK);
          rect(ctx, x - 49, y - 99, 98, 30, FILL);
          rect(ctx, x - 6, y - 66, 12, 3, DARK);
          rect(ctx, x - 3, y - 63, 6, 3, DARK);
          rect(ctx, x - 43, y - 95, 22, 22, DARK);
          pixelText(ctx, "E", x - 32, y - 84, { size: 11, color: "#ffffff", align: "center" });
          pixelText(ctx, "\u4EA4\u8C08", x - 14, y - 84, { size: 11, color: DARK });
          return;
        }
        panel(ctx, 40, 326, 108, 56);
        pixelText(ctx, cfg.speaker, 62, 354, { size: 16, color: DARK });
        panel(ctx, 24, 372, 912, 144);
        pixelText(ctx, [...line().text].slice(0, chars).join(""), 64, 422, { size: 16, color: INK });
        if (choosing) {
          const cs = line().choices;
          panel(ctx, 548, 212, 388, 40 + 56 * cs.length);
          cs.forEach((c, i) => pixelText(ctx, c.label, 608, 260 + 56 * i, { size: 16, color: INK }));
          tri(ctx, 578, 250 + 56 * selected, [1, 2, 3, 4, 3, 2, 1], false);
        } else if (lineDone() && Math.floor(clock / cfg.blink_half_period) % 2 === 0) {
          tri(ctx, 876, 476, [7, 5, 3, 1], true);
        }
      },
      snapshot: () => ({
        active,
        speaker: active ? cfg.speaker : null,
        visible_text: active ? [...line().text].slice(0, chars).join("") : "",
        choices: active && choosing ? line().choices.map((c) => c.label) : [],
        selected_index: selected
      })
    };
  }
  var createG3 = () => composeGame("g3_combined", createShooterHost(), [createDialogue()]);
  return __toCommonJS(g3_combined_exports);
})();
window.EXTRA_GAMES=Object.assign(window.EXTRA_GAMES||{},{g3_opus:__hat_opus.createG3});
