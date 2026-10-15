"use strict";
var __hat_astra = (() => {
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

  // runs/codex/r1/work/src/games/g3_combined.ts
  var g3_combined_exports = {};
  __export(g3_combined_exports, {
    createG3: () => createG3
  });

  // runs/codex/r1/work/src/core/types.ts
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
  var VIEW_W = 960;
  var VIEW_H = 540;

  // runs/codex/r1/work/src/core/input.ts
  var ORDER = new Map(ACTIONS.map((a, i) => [a, i]));
  var isHeld = (f, a) => f.held.includes(a);
  var isPressed = (f, a) => f.pressed.includes(a);

  // runs/codex/r1/work/src/core/compose.ts
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

  // runs/codex/r1/work/src/dialogue/config.ts
  var DIALOGUE_CONFIG = {
    interaction_radius: 72,
    character_ticks: 5,
    blink_ticks: 30
  };
  var SPEAKER = "\u5B88\u536B";
  var LINES = {
    greeting: "\u7B49\u7B49\uFF0C\u5148\u804A\u4E24\u53E5\uFF1F",
    question: "\u4F60\u60F3\u95EE\u4EC0\u4E48\uFF1F",
    answer: "\u5B88\u7740\u8FD9\u4E2A\u5C0F\u623F\u95F4\u3002\u804A\u5B8C\u6211\u4EEC\u7EE7\u7EED\u3002",
    goodbye: "\u597D\uFF0C\u56DE\u5934\u89C1\u3002"
  };
  var CHOICES = ["\u4F60\u5728\u8FD9\u91CC\u505A\u4EC0\u4E48\uFF1F", "\u518D\u89C1\u3002"];

  // runs/codex/r1/work/src/core/draw.ts
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

  // runs/codex/r1/work/src/dialogue/render.ts
  var INK = "#20304a";
  var EDGE = "#8aa6c6";
  var PAPER = "#f7f8ee";
  function panel(ctx, x, y, w, h) {
    rect(ctx, x, y, w, h, INK);
    rect(ctx, x + 4, y + 4, w - 8, h - 8, EDGE);
    rect(ctx, x + 8, y + 8, w - 16, h - 16, INK);
    rect(ctx, x + 10, y + 10, w - 20, h - 20, PAPER);
  }
  function renderPrompt(ctx, opponent) {
    const x = Math.round(opponent.x) - 52;
    const y = Math.round(opponent.y) - 102;
    rect(ctx, x, y, 104, 36, INK);
    rect(ctx, x + 3, y + 3, 98, 30, PAPER);
    rect(ctx, x + 8, y + 6, 24, 24, "#ffffff");
    rect(ctx, x + 9, y + 7, 22, 22, INK);
    pixelText(ctx, "E", x + 10, y + 18, { size: 12, color: "#ffffff" });
    pixelText(ctx, "\u4EA4\u8C08", x + 38, y + 18, { size: 12, color: INK });
    rect(ctx, x + 46, y + 36, 12, 3, INK);
    rect(ctx, x + 49, y + 39, 6, 3, INK);
  }
  function renderDialogue(ctx, view, continueVisible) {
    const x = 24, y = VIEW_H - 168, w = VIEW_W - 48;
    panel(ctx, x + 16, y - 46, 108, 54);
    pixelText(ctx, view.speaker, x + 38, y - 18, { size: 16, color: INK });
    panel(ctx, x, y, w, 144);
    pixelText(ctx, view.visible_text, x + 40, y + 50, { size: 16 });
    if (view.choices.length) {
      const cx = VIEW_W - 412, cy = y - 160;
      panel(ctx, cx, cy, 388, 152);
      view.choices.forEach((label, i) => {
        const rowY = cy + 48 + i * 56;
        pixelText(ctx, label, cx + 60, rowY, { size: 16 });
        if (i === view.selected_index) {
          [1, 2, 3, 4, 3, 2, 1].forEach((width, row) => rect(ctx, cx + 30, rowY - 10 + row * 3, width * 3, 3, INK));
        }
      });
    } else if (continueVisible) {
      [7, 5, 3, 1].forEach((width, row) => rect(ctx, VIEW_W - 84 + row * 3, y + 104 + row * 3, width * 3, 3, INK));
    }
  }

  // runs/codex/r1/work/src/dialogue/extension.ts
  var GAMEPLAY_ACTIONS = ["move_up", "move_down", "move_left", "move_right", "shoot"];
  function createDialogueExtension(config = DIALOGUE_CONFIG) {
    const cfg = { ...config };
    let active = false;
    let line = "greeting";
    let visible = 0;
    let characterTick = 0;
    let uiTick = 0;
    let choosing = false;
    let selected = 0;
    const blocked = /* @__PURE__ */ new Set();
    function nearbyOpponent(host) {
      const entities = host.entities();
      const player = entities.find((e) => e.kind === "player" && e.tags.includes("controlled"));
      if (!player?.alive) return;
      return entities.find((e) => e.kind === "opponent" && e.alive && Math.hypot(e.x - player.x, e.y - player.y) <= cfg.interaction_radius);
    }
    function startLine(next) {
      line = next;
      visible = 0;
      characterTick = 0;
      choosing = false;
    }
    function close() {
      active = false;
      startLine("greeting");
      selected = 0;
      uiTick = 0;
    }
    function snapshot() {
      return {
        active,
        speaker: active ? SPEAKER : null,
        visible_text: active ? LINES[line].slice(0, visible) : "",
        choices: active && choosing ? [...CHOICES] : [],
        selected_index: selected
      };
    }
    function captureHeld(frame) {
      for (const action of GAMEPLAY_ACTIONS) if (frame.held.includes(action)) blocked.add(action);
    }
    return {
      id: "dialogue",
      config: { ...cfg, speaker: SPEAKER, lines: LINES, choices: CHOICES },
      reset() {
        close();
        blocked.clear();
      },
      route(frame, host) {
        for (const action of blocked) {
          if (frame.released.includes(action) || !frame.held.includes(action)) blocked.delete(action);
        }
        if (!active) {
          if (isPressed(frame, "interact") && nearbyOpponent(host)) {
            active = true;
            startLine("greeting");
            selected = 0;
            uiTick = 0;
            captureHeld(frame);
            return { occupied: true, frame };
          }
          if (!blocked.size) return { occupied: false, frame };
          const filter = (actions) => actions.filter((a) => !blocked.has(a));
          return { occupied: false, frame: {
            held: filter(frame.held),
            pressed: filter(frame.pressed),
            released: filter(frame.released)
          } };
        }
        captureHeld(frame);
        uiTick++;
        if (isPressed(frame, "cancel")) {
          close();
        } else if (choosing) {
          if (isPressed(frame, "select_up")) selected = (selected + CHOICES.length - 1) % CHOICES.length;
          if (isPressed(frame, "select_down")) selected = (selected + 1) % CHOICES.length;
          if (isPressed(frame, "interact")) startLine(selected === 0 ? "answer" : "goodbye");
        } else if (isPressed(frame, "interact")) {
          if (visible < LINES[line].length) {
            visible = LINES[line].length;
          } else if (line === "greeting") {
            startLine("question");
          } else if (line === "question") {
            choosing = true;
            selected = 0;
          } else {
            close();
          }
        } else if (visible < LINES[line].length) {
          if (++characterTick === cfg.character_ticks) {
            visible++;
            characterTick = 0;
          }
        }
        return { occupied: true, frame };
      },
      snapshot: () => ({ ...snapshot() }),
      render(ctx, host) {
        if (active) {
          const complete = !choosing && visible === LINES[line].length;
          renderDialogue(ctx, snapshot(), complete && Math.floor(uiTick / cfg.blink_ticks) % 2 === 0);
        } else {
          const opponent = nearbyOpponent(host);
          if (opponent) renderPrompt(ctx, opponent);
        }
      }
    };
  }

  // runs/codex/r1/work/src/shooter/config.ts
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

  // runs/codex/r1/work/src/shooter/render.ts
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

  // runs/codex/r1/work/src/shooter/state.ts
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

  // runs/codex/r1/work/src/core/physics.ts
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

  // runs/codex/r1/work/src/shooter/collision.ts
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

  // runs/codex/r1/work/src/shooter/step.ts
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

  // runs/codex/r1/work/src/shooter/host.ts
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

  // runs/codex/r1/work/src/games/g3_combined.ts
  var createG3 = () => composeGame("g3_combined", createShooterHost(), [createDialogueExtension()]);
  return __toCommonJS(g3_combined_exports);
})();
window.EXTRA_GAMES=Object.assign(window.EXTRA_GAMES||{},{g3_astra:__hat_astra.createG3});
