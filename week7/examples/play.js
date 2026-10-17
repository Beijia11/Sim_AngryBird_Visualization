"use strict";
(() => {
  // src/core/types.ts
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
    "reset",
    "jump"
  ];
  var TICK_HZ = 60;
  var VIEW_W = 960;
  var VIEW_H = 540;

  // src/core/input.ts
  var KEYMAP = {
    KeyW: "move_up",
    KeyS: "move_down",
    KeyA: "move_left",
    KeyD: "move_right",
    KeyJ: "shoot",
    KeyE: "interact",
    ArrowUp: "select_up",
    ArrowDown: "select_down",
    Escape: "cancel",
    KeyR: "reset",
    Space: "jump",
    KeyK: "jump"
  };
  var ORDER = new Map(ACTIONS.map((a, i) => [a, i]));
  var norm = (s) => [...new Set(s)].sort((a, b) => ORDER.get(a) - ORDER.get(b));
  function makeFrame(held = [], pressed = [], released = []) {
    return { held: norm(held), pressed: norm(pressed), released: norm(released) };
  }
  var isHeld = (f, a) => f.held.includes(a);
  var isPressed = (f, a) => f.pressed.includes(a);
  var InputSampler = class {
    down = /* @__PURE__ */ new Set();
    pressedSince = /* @__PURE__ */ new Set();
    releasedSince = /* @__PURE__ */ new Set();
    keyDown(code, repeat) {
      const a = KEYMAP[code];
      if (!a) return false;
      if (!repeat && !this.down.has(a)) this.pressedSince.add(a);
      this.down.add(a);
      return true;
    }
    keyUp(code) {
      const a = KEYMAP[code];
      if (!a) return false;
      if (this.down.delete(a)) this.releasedSince.add(a);
      return true;
    }
    /** Release everything (window blur). */
    clear() {
      for (const a of this.down) this.releasedSince.add(a);
      this.down.clear();
    }
    sample() {
      const f = makeFrame(this.down, this.pressedSince, this.releasedSince);
      this.pressedSince.clear();
      this.releasedSince.clear();
      return f;
    }
  };

  // src/core/draw.ts
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

  // src/core/compose.ts
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
    const initial2 = snapshot();
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
        initial_state: initial2,
        seed
      })
    };
  }

  // src/shooter/config.ts
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

  // src/shooter/render.ts
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

  // src/shooter/state.ts
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

  // src/core/physics.ts
  var overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  var centerBox = (cx, cy, w, h) => ({ x: cx - w / 2, y: cy - h / 2, w, h });
  function moveBody(cx, cy, w, h, dx, dy, solids2) {
    let x = cx, y = cy;
    if (dx !== 0) {
      x += dx;
      for (const s of solids2) {
        if (!overlap(centerBox(x, y, w, h), s)) continue;
        x = dx > 0 ? s.x - w / 2 : s.x + s.w + w / 2;
      }
    }
    if (dy !== 0) {
      y += dy;
      for (const s of solids2) {
        if (!overlap(centerBox(x, y, w, h), s)) continue;
        y = dy > 0 ? s.y - h / 2 : s.y + s.h + h / 2;
      }
    }
    return [x, y];
  }

  // src/shooter/collision.ts
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

  // src/shooter/step.ts
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
    const solids2 = staticSolids(cfg);
    if (p.alive) {
      const sx = (isHeld(frame, "move_right") ? 1 : 0) - (isHeld(frame, "move_left") ? 1 : 0);
      const sy = (isHeld(frame, "move_down") ? 1 : 0) - (isHeld(frame, "move_up") ? 1 : 0);
      if (sx || sy) {
        const k = sx && sy ? Math.SQRT1_2 : 1;
        const blockers = e.alive ? [...solids2, fighterBox(e, cfg)] : solids2;
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
      if (solids2.some((w) => overlap(bb, w))) continue;
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

  // src/shooter/host.ts
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

  // src/games/g1_shooter.ts
  var createG1 = () => composeGame("g1_shooter", createShooterHost(), []);

  // src/dialogue/state.ts
  var initialDialogueState = () => ({
    phase: "CLOSED",
    node_id: null,
    visible_count: 0,
    char_timer: 0,
    selected_index: 0,
    target: null,
    ui_tick: 0
  });
  var chars = (s) => Array.from(s);
  function dialoguePublic(d, content) {
    const node = d.node_id ? content.nodes[d.node_id] : null;
    const text = node ? chars(node.text) : [];
    return {
      active: d.phase !== "CLOSED",
      phase: d.phase,
      speaker: d.phase !== "CLOSED" ? content.speaker : null,
      target: d.target,
      node_id: d.node_id,
      visible_text: text.slice(0, d.visible_count).join(""),
      visible_count: d.visible_count,
      choices: d.phase === "CHOOSING" && node?.choices ? node.choices.map((c) => c.label) : [],
      selected_index: d.selected_index
    };
  }

  // src/dialogue/step.ts
  function enter(d, node_id) {
    d.phase = "TYPING";
    d.node_id = node_id;
    d.visible_count = 0;
    d.char_timer = 0;
    d.selected_index = 0;
  }
  function close(d, reason, emit) {
    emit({ type: "dialogue_close", target: d.target, node: d.node_id, reason });
    d.phase = "CLOSED";
    d.node_id = null;
    d.visible_count = 0;
    d.char_timer = 0;
    d.selected_index = 0;
    d.target = null;
  }
  function openDialogue(d, content, target, emit) {
    enter(d, content.start);
    d.target = target;
    d.ui_tick = 0;
    emit({ type: "dialogue_open", target, node: d.node_id });
  }
  function stepDialogue(d, frame, content, cfg, emit) {
    if (d.phase === "CLOSED") return;
    d.ui_tick++;
    if (isPressed(frame, "cancel")) {
      close(d, "cancel", emit);
      return;
    }
    const node = content.nodes[d.node_id];
    const len = chars(node.text).length;
    const e = isPressed(frame, "interact");
    switch (d.phase) {
      case "TYPING":
        if (e) {
          d.visible_count = len;
          d.phase = "READY";
          emit({ type: "text_complete", node: d.node_id, by: "skip" });
          return;
        }
        if (++d.char_timer >= cfg.ticks_per_char) {
          d.char_timer = 0;
          d.visible_count++;
        }
        if (d.visible_count >= len) {
          d.visible_count = len;
          d.phase = "READY";
          emit({ type: "text_complete", node: d.node_id, by: "timer" });
        }
        return;
      case "READY":
        if (!e) return;
        if (node.choices?.length) {
          d.phase = "CHOOSING";
          d.selected_index = 0;
        } else if (node.next) enter(d, node.next);
        else close(d, "end", emit);
        return;
      case "CHOOSING": {
        const n = node.choices.length;
        const prev = d.selected_index;
        if (isPressed(frame, "select_up")) d.selected_index = Math.max(0, d.selected_index - 1);
        if (isPressed(frame, "select_down")) d.selected_index = Math.min(n - 1, d.selected_index + 1);
        if (d.selected_index !== prev) emit({ type: "choice_change", node: d.node_id, index: d.selected_index });
        if (e) {
          const c = node.choices[d.selected_index];
          emit({ type: "choice_confirm", node: d.node_id, index: d.selected_index, label: c.label, next: c.next });
          enter(d, c.next);
        }
        return;
      }
    }
  }

  // src/dialogue/view.ts
  function frameBox(ctx, x, y, w, h, c) {
    rect(ctx, x, y, w, h, c.outer);
    rect(ctx, x + 4, y + 4, w - 8, h - 8, c.inner);
    rect(ctx, x + 8, y + 8, w - 16, h - 16, c.outer);
    rect(ctx, x + 10, y + 10, w - 20, h - 20, c.fill);
  }
  function downArrow(ctx, x, y, color, s = 3) {
    for (let r = 0; r < 4; r++) rect(ctx, x + r * s, y + r * s, (7 - 2 * r) * s, s, color);
  }
  function rightArrow(ctx, x, y, color, s = 3) {
    for (let c = 0; c < 4; c++) rect(ctx, x + c * s, y + c * s, s, (7 - 2 * c) * s, color);
  }
  function wrap(text, n) {
    const out = [];
    for (let i = 0; i < text.length; i += n) out.push(text.slice(i, i + n).join(""));
    return out;
  }
  function renderDialogue(ctx, d, content, cfg) {
    if (d.phase === "CLOSED" || !d.node_id) return;
    const node = content.nodes[d.node_id];
    const { box, speaker_tab: tab, text: t, colors: c } = cfg;
    const nameW = chars(content.speaker).length * t.size * t.scale + tab.pad_x * 2;
    frameBox(ctx, tab.x, tab.y, nameW, tab.h, c);
    pixelText(ctx, content.speaker, tab.x + tab.pad_x, tab.y + tab.h / 2 + 1, { size: t.size, scale: t.scale, color: c.speaker });
    frameBox(ctx, box.x, box.y, box.w, box.h, c);
    const shown = chars(node.text).slice(0, d.visible_count);
    wrap(shown, t.line_chars).forEach((line, i) => pixelText(ctx, line, box.x + box.pad_x, box.first_line_y + i * t.line_h, { size: t.size, scale: t.scale, color: t.color }));
    if (d.phase === "READY" && Math.floor(d.ui_tick / cfg.blink_period) % 2 === 0) {
      downArrow(ctx, box.x + box.w - 60, box.y + box.h - 40, c.cursor);
    }
    if (d.phase === "CHOOSING" && node.choices) {
      const ch = cfg.choices;
      const h = ch.pad_top * 2 + node.choices.length * ch.row_h;
      const y0 = box.y - h - 8;
      frameBox(ctx, ch.x, y0, ch.w, h, c);
      node.choices.forEach((opt, i) => {
        const cy = y0 + ch.pad_top + i * ch.row_h + ch.row_h / 2;
        if (i === d.selected_index) rightArrow(ctx, ch.x + ch.cursor_x, cy - 10, c.cursor);
        pixelText(ctx, opt.label, ch.x + ch.label_x, cy, { size: t.size, scale: t.scale, color: t.color });
      });
    }
  }
  function renderTalkPrompt(ctx, x, y, cfg) {
    const c = cfg.colors, w = 104, h = 36;
    const bx = Math.round(x - w / 2), by = Math.round(y + cfg.prompt.dy - h);
    rect(ctx, bx, by, w, h, c.outer);
    rect(ctx, bx + 3, by + 3, w - 6, h - 6, c.fill);
    for (let r = 0; r < 4; r++) rect(ctx, x - 9 + r * 3, by + h + r * 3 - 3, 18 - r * 6, 3, c.outer);
    rect(ctx, bx + 9, by + 7, 22, 22, c.outer);
    pixelText(ctx, cfg.prompt.key, bx + 20, by + 18, { size: 12, scale: 2, color: "#ffffff", align: "center" });
    pixelText(ctx, cfg.prompt.label, bx + 38, by + 18, { size: 12, scale: 2, color: c.outer });
  }

  // src/adapters/dialogue_binding.ts
  function createDialogueBinding(content, dcfg, bcfg) {
    let d = initialDialogueState();
    let blocked = /* @__PURE__ */ new Set();
    let host = null;
    const talkables = (h) => h.entities().filter((e) => e.kind === bcfg.talkable_kind && e.alive);
    const controlled = (h) => h.entities().find((e) => e.tags.includes("controlled"));
    function promptTarget(h) {
      const me = controlled(h);
      if (!me || !me.alive) return null;
      let best = null, bestD = Infinity;
      for (const t of talkables(h)) {
        const dist = Math.hypot(t.x - me.x, t.y - me.y);
        if (dist <= bcfg.interact_radius && dist < bestD) {
          best = t;
          bestD = dist;
        }
      }
      return best;
    }
    const latchHeld = (f) => {
      for (const a of bcfg.gameplay_actions) if (isHeld(f, a)) blocked.add(a);
    };
    return {
      id: "dialogue",
      config: { binding: bcfg, dialogue: dcfg, content },
      reset(h) {
        d = initialDialogueState();
        blocked = /* @__PURE__ */ new Set();
        host = h;
      },
      route(frame, h, emit) {
        host = h;
        if (d.phase !== "CLOSED") {
          stepDialogue(d, frame, content, dcfg, emit);
          latchHeld(frame);
          return { occupied: true, frame };
        }
        const t = promptTarget(h);
        if (t && isPressed(frame, "interact")) {
          openDialogue(d, content, t.id, emit);
          latchHeld(frame);
          return { occupied: true, frame };
        }
        for (const a of [...blocked]) if (!isHeld(frame, a)) blocked.delete(a);
        if (!blocked.size) return { occupied: false, frame };
        const keep = (a) => !blocked.has(a);
        return { occupied: false, frame: makeFrame(frame.held.filter(keep), frame.pressed.filter(keep), frame.released) };
      },
      render(ctx, h) {
        if (d.phase === "CLOSED") {
          const t = promptTarget(h);
          if (t) renderTalkPrompt(ctx, t.x, t.y, dcfg);
        }
        renderDialogue(ctx, d, content, dcfg);
      },
      snapshot() {
        const t = host && d.phase === "CLOSED" ? promptTarget(host) : null;
        return {
          ...dialoguePublic(d, content),
          talkable: host ? talkables(host).map((e) => e.id) : [],
          prompt_target: t ? t.id : null,
          blocked_actions: [...blocked].sort(),
          char_timer: d.char_timer,
          ui_tick: d.ui_tick
        };
      }
    };
  }

  // src/content/reference_dialogue.json
  var reference_dialogue_default = {
    speaker: "\u5B88\u536B",
    start: "start",
    nodes: {
      start: { text: "\u7B49\u7B49\uFF0C\u5148\u804A\u4E24\u53E5\uFF1F", next: "question" },
      question: { text: "\u4F60\u60F3\u95EE\u4EC0\u4E48\uFF1F", choices: [
        { label: "\u4F60\u5728\u8FD9\u91CC\u505A\u4EC0\u4E48\uFF1F", next: "about" },
        { label: "\u518D\u89C1\u3002", next: "goodbye" }
      ] },
      about: { text: "\u5B88\u7740\u8FD9\u4E2A\u5C0F\u623F\u95F4\u3002\u804A\u5B8C\u6211\u4EEC\u7EE7\u7EED\u3002", end: true },
      goodbye: { text: "\u597D\uFF0C\u56DE\u5934\u89C1\u3002", end: true }
    }
  };

  // src/dialogue/reference_config.ts
  var DIALOGUE_CONFIG = {
    ticks_per_char: 5,
    // 60 Hz -> 12 chars/s
    blink_period: 30,
    // continue marker on/off, UI ticks
    text: { size: 16, scale: 2, color: "#202830", line_chars: 22, line_h: 40 },
    box: { x: 24, y: 372, w: 912, h: 144, pad_x: 40, first_line_y: 422 },
    speaker_tab: { x: 40, y: 326, h: 54, pad_x: 22 },
    choices: { x: 548, y: 164, w: 388, row_h: 56, pad_top: 20, cursor_x: 30, label_x: 60 },
    colors: { outer: "#22324a", inner: "#8aa6c8", fill: "#f8f8f0", cursor: "#22324a", speaker: "#22324a" },
    prompt: { label: "\u4EA4\u8C08", key: "E", dy: -66 }
  };

  // src/room/config.ts
  var ROOM_CONFIG = {
    floor: { x: 96, y: 168, w: 768, h: 348 },
    // walkable interior (top-left + size)
    wall_face_h: 96,
    // wall drawn above the floor
    body: { w: 28, h: 44 },
    player: { x: 300, y: 420, facing: [0, -1], speed: 2.5 },
    // 150 px/s
    npc: { id: "npc", x: 600, y: 270, facing: [0, 1] },
    furniture: [
      { id: "table", x: 168, y: 216, w: 120, h: 60 },
      { id: "shelf", x: 672, y: 168, w: 144, h: 36 },
      { id: "plant", x: 792, y: 444, w: 40, h: 44 }
    ],
    rug: { x: 384, y: 330, w: 200, h: 120 }
  };

  // src/room/host.ts
  var NPC_PAL = { H: "#7a4a1a", S: "#f0c49a", K: "#1a1a2a", M: "#b0604a", C: "#3f9a5a", L: "#9ae0a8", P: "#4a4030", F: "#3a2a1a" };
  var initial = (cfg) => ({
    gameplay_tick: 0,
    player: { x: cfg.player.x, y: cfg.player.y, facing: [...cfg.player.facing] },
    npc: { id: cfg.npc.id, x: cfg.npc.x, y: cfg.npc.y, facing: [...cfg.npc.facing] }
  });
  function solids(cfg, s) {
    const f = cfg.floor, t = 48;
    return [
      { x: f.x, y: f.y - t, w: f.w, h: t },
      { x: f.x, y: f.y + f.h, w: f.w, h: t },
      { x: f.x - t, y: f.y, w: t, h: f.h },
      { x: f.x + f.w, y: f.y, w: t, h: f.h },
      ...cfg.furniture,
      centerBox(s.npc.x, s.npc.y, cfg.body.w, cfg.body.h)
    ];
  }
  function drawRoom(ctx, cfg) {
    const f = cfg.floor;
    rect(ctx, 0, 0, 960, 540, "#1c1a24");
    const wy = f.y - cfg.wall_face_h;
    rect(ctx, f.x, wy, f.w, cfg.wall_face_h, "#d8c8a8");
    for (let x = f.x; x < f.x + f.w; x += 32) rect(ctx, x, wy, 2, cfg.wall_face_h, "#cbb994");
    rect(ctx, f.x, f.y - 10, f.w, 10, "#8a6a48");
    rect(ctx, 420, wy + 16, 120, 60, "#5a4a3a");
    rect(ctx, 426, wy + 22, 108, 48, "#9fd4f0");
    rect(ctx, 478, wy + 22, 4, 48, "#5a4a3a");
    rect(ctx, 426, wy + 44, 108, 4, "#5a4a3a");
    for (let j = 0; j * 24 < f.h; j++) {
      for (let i = 0; (i - 1) * 64 < f.w; i++) {
        const x = f.x + i * 64 - j % 2 * 32, y = f.y + j * 24;
        const shade = ["#b07a4a", "#a8734a", "#b88250"][Math.floor(tileHash(i, j) * 3)];
        const x0 = Math.max(x, f.x), x1 = Math.min(x + 64, f.x + f.w);
        if (x1 > x0) {
          rect(ctx, x0, y, x1 - x0, 24, shade);
          rect(ctx, x0, y + 22, x1 - x0, 2, "#8a5a34");
          rect(ctx, x0, y, 2, 24, "#8a5a34");
        }
      }
    }
    const r = cfg.rug;
    rect(ctx, r.x, r.y, r.w, r.h, "#7a2e3e");
    rect(ctx, r.x + 8, r.y + 8, r.w - 16, r.h - 16, "#a8445a");
    rect(ctx, r.x + 20, r.y + 20, r.w - 40, r.h - 40, "#7a2e3e");
    rect(ctx, 448, f.y + f.h - 4, 64, 28, "#3a2a1e");
    for (const o of cfg.furniture) {
      if (o.id === "table") {
        rect(ctx, o.x, o.y + 8, o.w, o.h - 8, "#6a4424");
        rect(ctx, o.x, o.y, o.w, o.h - 16, "#9a6a3a");
        rect(ctx, o.x + 16, o.y + 8, 20, 12, "#e8e0d0");
        rect(ctx, o.x + 80, o.y + 6, 12, 16, "#5a8ac8");
      } else if (o.id === "shelf") {
        rect(ctx, o.x, o.y - 60, o.w, o.h + 60, "#5a3a20");
        rect(ctx, o.x + 6, o.y - 54, o.w - 12, 40, "#3a2414");
        const cols = ["#c84a3a", "#3a7ac8", "#e8c040", "#4aa86a", "#9a5ac8"];
        for (let k = 0; k < 9; k++) rect(ctx, o.x + 10 + k * 14, o.y - 50 + k % 3 * 4, 10, 32 - k % 3 * 4, cols[k % 5]);
        rect(ctx, o.x + 6, o.y - 10, o.w - 12, 4, "#7a5030");
      } else {
        rect(ctx, o.x + 8, o.y + 22, o.w - 16, o.h - 22, "#b05a30");
        rect(ctx, o.x + 4, o.y, o.w - 8, 26, "#3a8a4a");
        rect(ctx, o.x + 12, o.y - 10, o.w - 24, 14, "#4aa85a");
      }
    }
  }
  function createRoomHost(cfg = ROOM_CONFIG) {
    let s = initial(cfg);
    const ent = (id, kind, tags, o) => ({ id, kind, tags, x: o.x, y: o.y, w: cfg.body.w, h: cfg.body.h, alive: true, facing: [o.facing[0], o.facing[1]] });
    return {
      config: cfg,
      reset() {
        s = initial(cfg);
      },
      step(frame) {
        const sx = (isHeld(frame, "move_right") ? 1 : 0) - (isHeld(frame, "move_left") ? 1 : 0);
        const sy = (isHeld(frame, "move_down") ? 1 : 0) - (isHeld(frame, "move_up") ? 1 : 0);
        if (sx || sy) {
          const k = sx && sy ? Math.SQRT1_2 : 1, v = cfg.player.speed * k;
          [s.player.x, s.player.y] = moveBody(s.player.x, s.player.y, cfg.body.w, cfg.body.h, sx * v, sy * v, solids(cfg, s));
          s.player.facing = [sx, sy];
        }
        s.gameplay_tick++;
      },
      snapshot: () => structuredClone(s),
      render(ctx) {
        drawRoom(ctx, cfg);
        const people = [
          { o: s.player, pal: HERO_PAL },
          { o: s.npc, pal: NPC_PAL }
        ].sort((a, b) => a.o.y - b.o.y);
        for (const { o, pal } of people) {
          rect(ctx, o.x - 16, o.y + 21, 32, 6, "rgba(0,0,0,0.22)");
          drawSprite(ctx, HUMANOID, pal, o.x, o.y, { flip: o.facing[0] < 0 });
        }
      },
      api: () => ({
        entities: () => [ent("player", "player", ["controlled"], s.player), ent(s.npc.id, "npc", [], s.npc)],
        gameplayTick: () => s.gameplay_tick
      })
    };
  }

  // src/games/g2_dialogue.ts
  var G2_BINDING = {
    talkable_kind: "npc",
    interact_radius: 72,
    gameplay_actions: ["move_up", "move_down", "move_left", "move_right"]
  };
  var createG2 = () => composeGame("g2_dialogue", createRoomHost(), [
    createDialogueBinding(reference_dialogue_default, DIALOGUE_CONFIG, { ...G2_BINDING, gameplay_actions: [...G2_BINDING.gameplay_actions] })
  ]);

  // src/adapters/shooter_dialogue_binding.ts
  var SHOOTER_DIALOGUE_BINDING = {
    talkable_kind: "opponent",
    interact_radius: 72,
    gameplay_actions: ["move_up", "move_down", "move_left", "move_right", "shoot"]
  };

  // src/games/g3_combined.ts
  var createG3 = () => composeGame("g3_combined", createShooterHost(), [
    createDialogueBinding(reference_dialogue_default, DIALOGUE_CONFIG, SHOOTER_DIALOGUE_BINDING)
  ]);

  // src/platform/components/motion.ts
  function catmull(P, u) {
    const n = P.length;
    const i = Math.floor(u), t = u - i;
    const p0 = P[(i - 1 + n) % n], p1 = P[i % n], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
    const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
    return [f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])];
  }
  var smootherstep = (x) => x * x * x * (x * (6 * x - 15) + 10);
  function param(cfg, leg, t) {
    const L = cfg.legs[leg], n = cfg.path.length;
    const to = L.to > L.from ? L.to : L.to + n;
    return L.from + (to - L.from) * smootherstep(Math.min(1, t / L.ticks));
  }
  function createPlatformMotion(cfg) {
    return {
      id: "motion",
      config: cfg,
      init(s) {
        s.comp.motion = { leg: 0, t: 0, dwell: cfg.legs.at(-1).dwell };
        const q = s.platforms.find((p) => p.id === cfg.platform);
        [q.x, q.y] = catmull(cfg.path, cfg.legs[0].from);
        q.prev_top = q.y - q.h / 2 + q.surface;
      },
      motion(s, { emit }) {
        const m = s.comp.motion;
        const q = s.platforms.find((p) => p.id === cfg.platform);
        if (m.dwell > 0) {
          m.dwell--;
          if (m.dwell === 0) emit({ type: "platform_depart", leg: m.leg });
          return;
        }
        m.t++;
        const [x, y] = catmull(cfg.path, param(cfg, m.leg, m.t));
        q.vx = x - q.x;
        q.vy = y - q.y;
        q.x = x;
        q.y = y;
        if (m.t >= cfg.legs[m.leg].ticks) {
          m.dwell = cfg.legs[m.leg].dwell;
          emit({ type: "platform_arrive", leg: m.leg });
          m.leg = (m.leg + 1) % cfg.legs.length;
          m.t = 0;
        }
      }
    };
  }

  // src/platform/levels.ts
  var WALLS = [
    { id: "wall_l", x: -40, y: -400, w: 40, h: 1e3 },
    { id: "wall_r", x: 960, y: -400, w: 40, h: 1e3 }
  ];
  var P1_LEVEL = {
    id: "p1",
    start: [80, 420],
    solids: [
      ...WALLS,
      { id: "ground_l", x: 0, y: 440, w: 250, h: 100 },
      { id: "ground_r", x: 710, y: 440, w: 250, h: 100 }
    ],
    platforms: [{ id: "mover", x: 305, y: 420, w: 110, h: 16, tags: [] }],
    goals: [{ id: "flag", x: 868, y: 360, w: 30, h: 80 }]
  };
  var MOTION = {
    platform: "mover",
    path: [[305, 420], [390, 330], [520, 262], [650, 330], [655, 420], [520, 486]],
    legs: [
      { from: 0, to: 4, ticks: 180, dwell: 40 },
      { from: 4, to: 0, ticks: 130, dwell: 40 }
    ]
  };

  // src/platform/config.ts
  var PLAYER = {
    body: { w: 24, h: 40 },
    gravity: 0.5,
    max_fall: 12,
    run_speed: 3.2,
    ground_accel: 0.8,
    ground_friction: 0.6,
    // vx multiplier per tick with no input on the ground
    air_accel: 0.35,
    // no air friction: momentum is kept unless the player steers
    jump_speed: 10.5,
    // ~110 px jump height
    fall_limit: 620
    // below this y the player respawns at the start
  };

  // src/platform/state.ts
  var topOf = (p) => p.y - p.h / 2 + p.surface;
  function initialWorld(level) {
    return {
      tick: 0,
      player: { x: level.start[0], y: level.start[1], vx: 0, vy: 0, grounded: false, on: null, locked: false, facing: 1 },
      platforms: level.platforms.map((p) => ({ id: p.id, tags: [...p.tags], x: p.x, y: p.y, w: p.w, h: p.h, vx: 0, vy: 0, surface: 0, prev_top: p.y - p.h / 2 })),
      reached: [],
      comp: {}
    };
  }
  var PLAYER_H = PLAYER.body.h;

  // src/platform/camera.ts
  function cameraFor(level, s) {
    const zoom = level.camera?.zoom ?? 1;
    const [W, H] = level.size ?? [960, 540];
    const vw = 960 / zoom, vh = 540 / zoom;
    if (!level.camera?.follow) return { zoom, x: 0, y: 0 };
    const clamp2 = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    return { zoom, x: clamp2(s.player.x - vw * 0.45, 0, Math.max(0, W - vw)), y: clamp2(s.player.y - vh * 0.6, 0, Math.max(0, H - vh)) };
  }
  function inWorld(ctx, cam, draw) {
    ctx.save();
    ctx.scale(cam.zoom, cam.zoom);
    ctx.translate(-Math.round(cam.x * cam.zoom) / cam.zoom, -Math.round(cam.y * cam.zoom) / cam.zoom);
    draw();
    ctx.restore();
  }

  // src/platform/render_pixel.ts
  var SKY = ["#4fb8ea", "#5ec2ee", "#6ccbf1", "#7bd3f3", "#8bdbf5", "#9be2f7", "#ace8f8", "#bdeefa"];
  function background(ctx, camX) {
    SKY.forEach((c, i) => rect(ctx, 0, i * 68, 960, 68, c));
    const cloud = (x, y) => {
      rect(ctx, x + 12, y, 48, 12, "#ffffff");
      rect(ctx, x, y + 12, 84, 12, "#ffffff");
      rect(ctx, x + 6, y + 24, 72, 6, "#e3f4fb");
    };
    const par = Math.round(camX * 0.3);
    for (const [x, y] of [[90, 70], [420, 40], [700, 96], [1100, 60]]) cloud(((x - par * 0.5) % 1200 + 1200) % 1200 - 120, y);
    for (let i = -1; i < 42; i++) {
      const k = i + Math.floor(par / 24);
      const h = 60 + Math.floor(tileHash(k, 3) * 4) * 18;
      rect(ctx, i * 24 - par % 24, 440 - h, 24, h + 100, k % 2 ? "#7cc576" : "#74bd6e");
    }
  }
  function water(ctx, y, w) {
    rect(ctx, -40, y, w + 80, 400, "#1d3a5c");
    for (let x = 0; x < w; x += 24) rect(ctx, x + (x / 24 % 2 ? 12 : 0), y + 58, 12, 3, "#3e6a96");
    rect(ctx, -40, y + 66, w + 80, 400, "#16304e");
  }
  function solid(ctx, b) {
    for (let y = b.y; y < b.y + b.h; y += 24) {
      for (let x = b.x; x < b.x + b.w; x += 24) {
        const w = Math.min(24, b.x + b.w - x), h = Math.min(24, b.y + b.h - y);
        rect(ctx, x, y, w, h, tileHash(x, y) > 0.5 ? "#9a6234" : "#925c30");
        if (tileHash(y, x) > 0.7) rect(ctx, x + 9, y + 9, 6, 6, "#7a4a24");
      }
    }
    rect(ctx, b.x, b.y, b.w, 9, "#5cbf3a");
    for (let x = b.x; x < b.x + b.w; x += 12) rect(ctx, x + 3, b.y, 6, 3, "#86dc5c");
    rect(ctx, b.x, b.y + 9, b.w, 3, "#3f8f2a");
  }
  function drawPixelPlatform(ctx, q) {
    const left = Math.round(q.x - q.w / 2), top = Math.round(topOf(q));
    rect(ctx, left, top, q.w, 8, "#6b6f80");
    rect(ctx, left, top, q.w, 3, "#a3a7b8");
    for (let x = left + 6; x < left + q.w - 4; x += 18) rect(ctx, x, top + 4, 3, 3, "#454856");
    if (q.h > 12) rect(ctx, left + 6, top + 8, q.w - 12, q.h - 8, "#4b4f5e");
  }
  function flag(ctx, g, done) {
    rect(ctx, g.x + 4, g.y, 4, g.h, "#e8e8f0");
    const c = done ? "#ffd23e" : "#e84a4a";
    for (let r = 0; r < 6; r++) rect(ctx, g.x + 8, g.y + 3 + r * 3, 24 - r * 4, 3, c);
  }
  function makePixelRenderer(extras = {}) {
    return (ctx, s, level) => {
      ctx.imageSmoothingEnabled = false;
      const cam = cameraFor(level, s);
      background(ctx, cam.x);
      inWorld(ctx, cam, () => {
        water(ctx, level.water ?? 440, (level.size ?? [960, 540])[0]);
        for (const b of level.solids) if (!b.id.startsWith("wall")) solid(ctx, b);
        for (const q of s.platforms) if (!extras.platform?.(ctx, q, s)) drawPixelPlatform(ctx, q);
        for (const g of level.goals) if (!extras.goal?.(ctx, g, s)) flag(ctx, g, s.reached.includes(g.id));
        const p = s.player;
        drawSprite(ctx, HUMANOID, HERO_PAL, p.x, p.y - 4, { flip: p.facing < 0 });
      });
      if (s.reached.length) pixelText(ctx, `\u5230\u8FBE ${s.reached.join("\u3001")}`, 24, 24, { size: 12, color: "#ffffff", shadow: "#205070" });
    };
  }
  var renderPixel = makePixelRenderer();

  // src/platform/physics.ts
  var approach = (v, target, step) => v < target ? Math.min(target, v + step) : Math.max(target, v - step);
  function steerPlayer(s, frame, cfg, speedScale = 1) {
    const p = s.player;
    const dir = (isHeld(frame, "move_right") ? 1 : 0) - (isHeld(frame, "move_left") ? 1 : 0);
    if (dir) p.facing = dir;
    if (p.grounded) {
      if (dir) p.vx = approach(p.vx, dir * cfg.run_speed * speedScale, cfg.ground_accel);
      else {
        p.vx *= cfg.ground_friction;
        if (Math.abs(p.vx) < 0.05) p.vx = 0;
      }
    } else if (dir) {
      const target = dir * Math.max(cfg.run_speed * speedScale, dir * p.vx);
      p.vx = approach(p.vx, target, cfg.air_accel);
    }
  }
  function controlPlayer(s, frame, cfg, emit) {
    const p = s.player;
    steerPlayer(s, frame, cfg);
    if (p.grounded && (isPressed(frame, "jump") || isPressed(frame, "move_up"))) {
      p.vy = -cfg.jump_speed;
      const from = p.on;
      p.grounded = false;
      p.on = null;
      emit({ type: "jump", x: p.x, y: p.y, from });
    }
  }
  function integratePlayer(s, level, cfg, emit, gravity = cfg.gravity, maxFall = cfg.max_fall) {
    const p = s.player;
    const { w, h } = cfg.body;
    const wasGrounded = p.grounded, wasOn = p.on;
    p.vy = Math.min(maxFall, p.vy + gravity);
    p.x += p.vx;
    for (const b of level.solids) {
      if (!overlap(centerBox(p.x, p.y, w, h), b)) continue;
      p.x = p.vx > 0 ? b.x - w / 2 : b.x + b.w + w / 2;
      p.vx = 0;
    }
    const prevBottom = p.y + h / 2;
    const impact = p.vy;
    p.y += p.vy;
    p.grounded = false;
    p.on = null;
    for (const b of level.solids) {
      if (!overlap(centerBox(p.x, p.y, w, h), b)) continue;
      if (p.vy > 0) {
        p.y = b.y - h / 2;
        p.grounded = true;
        p.on = b.id;
      } else p.y = b.y + b.h + h / 2;
      p.vy = 0;
    }
    if (p.vy >= 0) {
      const bottom = p.y + h / 2;
      for (const q of s.platforms) {
        const top = topOf(q);
        const xOverlap = p.x + w / 2 > q.x - q.w / 2 && p.x - w / 2 < q.x + q.w / 2;
        if (!xOverlap || bottom < top) continue;
        const riding = wasOn === q.id;
        const crossing = prevBottom <= q.prev_top + 1;
        if (riding || crossing) {
          p.y = top - h / 2;
          p.vy = 0;
          p.grounded = true;
          p.on = q.id;
          break;
        }
      }
    }
    if (p.grounded && !wasGrounded) emit({ type: "land", on: p.on, x: p.x, y: p.y, impact });
  }

  // src/platform/world.ts
  function stepWorld(s, frame, level, comps, emit, events) {
    const P = level.player ?? PLAYER;
    const ctx = { level, player: P, emit, events, frame };
    s.tick++;
    for (const q of s.platforms) {
      q.prev_top = topOf(q);
      q.vx = 0;
      q.vy = 0;
    }
    for (const c of comps) c.motion?.(s, ctx);
    const p = s.player;
    const ride = p.on ? s.platforms.find((q) => q.id === p.on) : void 0;
    if (ride) {
      p.x += ride.vx;
      p.y = topOf(ride) - P.body.h / 2;
    }
    if (!p.locked) {
      let handled = false;
      for (const c of comps) if (c.control?.(s, ctx)) handled = true;
      if (!handled) controlPlayer(s, frame, P, emit);
      for (const c of comps) c.postControl?.(s, ctx);
      let g;
      for (const c of comps) {
        g = c.gravity?.(s, ctx);
        if (g) break;
      }
      integratePlayer(s, level, P, emit, g?.gravity ?? P.gravity, g?.max_fall ?? P.max_fall);
    }
    for (const c of comps) c.trigger?.(s, ctx);
    for (const g of level.goals) {
      if (!s.reached.includes(g.id) && overlap(centerBox(p.x, p.y, P.body.w, P.body.h), g)) {
        s.reached.push(g.id);
        emit({ type: "goal", id: g.id });
      }
    }
    if (p.y > (level.size ? level.size[1] + 80 : P.fall_limit)) {
      Object.assign(p, { x: level.start[0], y: level.start[1], vx: 0, vy: 0, grounded: false, on: null, locked: false, facing: 1 });
      emit({ type: "fall" });
    }
  }
  function createPlatformGame(id, level, comps, render) {
    let s;
    let events = [];
    const emit = (e) => {
      events.push(e);
    };
    const reset = () => {
      s = initialWorld(level);
      for (const c of comps) c.init?.(s, level);
    };
    reset();
    const snapshot = () => structuredClone(s);
    const initial2 = snapshot();
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
        stepWorld(s, frame, level, comps, emit, events);
      },
      snapshot,
      render(ctx) {
        render(ctx, s, level);
      },
      getEvents: () => events,
      describe: () => ({ config: { level, player: level.player ?? PLAYER, components: Object.fromEntries(comps.map((c) => [c.id, c.config])) }, initial_state: initial2, seed: 0 })
    };
  }

  // src/games/p1_moving.ts
  var createP1 = () => createPlatformGame("p1_moving", P1_LEVEL, [createPlatformMotion(MOTION)], renderPixel);

  // src/platform/components/bounce.ts
  var clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  var lin = ([base, k, lo, hi], x) => clamp(base + k * x, lo, hi);
  var easeOut = (x) => 1 - (1 - x) * (1 - x);
  function surfaceOffset(cfg, phase, t, depth = cfg.depth) {
    switch (phase) {
      case "COMPRESS":
        return depth * easeOut(Math.min(1, t / cfg.compress_ticks));
      case "CHARGE":
        return depth;
      case "LAUNCH":
        return depth - (depth + cfg.overshoot) * Math.min(1, t / cfg.launch_ticks);
      case "RECOVER": {
        const x = Math.min(1, t / cfg.recover_ticks);
        return -cfg.overshoot * Math.cos(x * Math.PI * 2.5) * (1 - x);
      }
      default:
        return 0;
    }
  }
  function createBounce(cfg) {
    return {
      id: "bounce",
      config: cfg,
      init(s) {
        s.comp.bounce = Object.fromEntries(s.platforms.filter((q) => q.tags.includes("bouncy")).map((q) => [q.id, { phase: "READY", t: 0 }]));
      },
      // the surface follows the phase clock; the held player is carried by the world's rider step
      motion(s, { emit, frame }) {
        const p = s.player;
        if (cfg.drag && s.comp.bounce_drag > 0) {
          if (p.grounded || p.locked) s.comp.bounce_drag = 0;
          else {
            p.vx *= cfg.drag.factor;
            s.comp.bounce_drag--;
          }
        }
        for (const q of s.platforms) {
          const b = s.comp.bounce[q.id];
          if (!b) continue;
          if (b.phase !== "READY") b.t++;
          if (b.phase === "COMPRESS" && b.t >= cfg.compress_ticks) {
            b.phase = "CHARGE";
            b.t = 0;
          } else if (b.phase === "CHARGE" && b.t >= cfg.charge_ticks) {
            b.phase = "LAUNCH";
            b.t = 0;
            if (p.locked && p.on === q.id) {
              const D = cfg.dynamic;
              const boost = D && (isHeld(frame, "jump") || isHeld(frame, "move_up")) ? D.hold_boost : 0;
              const speed = (D ? b.speed : cfg.launch_speed) + boost;
              const a = (cfg.angle_deg ?? 0) * Math.PI / 180;
              p.locked = false;
              p.on = null;
              p.grounded = false;
              p.vx = speed * Math.sin(a) + (D ? D.offset_vx * b.offset : 0) + q.vx * cfg.inherit;
              p.vy = -speed * Math.cos(a) + q.vy * cfg.inherit;
              if (cfg.drag) s.comp.bounce_drag = cfg.drag.ticks;
              emit({ type: "bounce_launch", platform: q.id, vx: p.vx, vy: p.vy, x: p.x, y: p.y });
            }
          } else if (b.phase === "LAUNCH" && b.t >= cfg.launch_ticks) {
            b.phase = "RECOVER";
            b.t = 0;
          } else if (b.phase === "RECOVER" && b.t >= cfg.recover_ticks) {
            b.phase = "READY";
            b.t = 0;
            emit({ type: "bounce_ready", platform: q.id });
          }
          q.surface = surfaceOffset(cfg, b.phase, b.t, b.depth ?? cfg.depth);
        }
      },
      // contact: a landing on a READY bouncy platform starts the compression and holds the player
      trigger(s, { events, emit }) {
        const p = s.player;
        for (const e of events) {
          if (e.type !== "land") continue;
          const b = s.comp.bounce[e.on];
          if (!b || b.phase !== "READY") continue;
          b.phase = "COMPRESS";
          b.t = 0;
          const q = s.platforms.find((x) => x.id === e.on);
          if (cfg.dynamic) {
            const impact = Math.max(0, e.impact ?? 0);
            b.depth = lin(cfg.dynamic.depth, impact);
            b.speed = lin(cfg.dynamic.speed, impact);
            b.offset = clamp((p.x - q.x) / (q.w / 2), -1, 1);
          }
          p.locked = true;
          p.vx = 0;
          p.vy = 0;
          emit({ type: "bounce_contact", platform: e.on });
        }
      }
    };
  }

  // src/platform/levels_p2.ts
  var P2_LEVEL = {
    id: "p2",
    start: [120, 440],
    solids: [
      ...WALLS,
      { id: "ground_l", x: 0, y: 460, w: 415, h: 80 },
      { id: "pit", x: 415, y: 500, w: 110, h: 40 },
      { id: "ground_r", x: 525, y: 460, w: 75, h: 80 },
      { id: "ledge", x: 600, y: 230, w: 360, h: 310 }
    ],
    platforms: [{ id: "pad", x: 470, y: 468, w: 110, h: 16, tags: ["bouncy"] }],
    goals: [{ id: "flag", x: 860, y: 150, w: 30, h: 80 }]
  };
  var BOUNCE = {
    compress_ticks: 12,
    depth: 22,
    charge_ticks: 18,
    launch_speed: 17,
    launch_ticks: 4,
    overshoot: 10,
    recover_ticks: 36,
    inherit: 1
  };

  // src/platform/render_real.ts
  function sky(ctx, camX) {
    const g = ctx.createLinearGradient(0, 0, 0, 540);
    g.addColorStop(0, "#5d8fc4");
    g.addColorStop(0.55, "#a9c9e2");
    g.addColorStop(1, "#e9e2d4");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 960, 540);
    const sun = ctx.createRadialGradient(780, 90, 4, 780, 90, 160);
    sun.addColorStop(0, "rgba(255,250,230,0.95)");
    sun.addColorStop(0.15, "rgba(255,240,200,0.6)");
    sun.addColorStop(1, "rgba(255,240,200,0)");
    ctx.fillStyle = sun;
    ctx.fillRect(560, 0, 400, 300);
    for (const [x, y, r] of [[160, 90, 70], [230, 80, 55], [480, 120, 80], [560, 110, 50]]) {
      const c = ctx.createRadialGradient(x, y, 0, x, y, r);
      c.addColorStop(0, "rgba(255,255,255,0.75)");
      c.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(x, y, r * 1.6, r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    const ridge = (base, amp, col, phase) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(0, 540);
      const off = camX * (phase < 1 ? 0.15 : 0.3);
      for (let x = 0; x <= 960; x += 8) ctx.lineTo(x, base - amp * (0.6 * Math.sin((x + off) / 140 + phase) + 0.4 * Math.sin((x + off) / 57 + phase * 2)));
      ctx.lineTo(960, 540);
      ctx.closePath();
      ctx.fill();
    };
    ridge(330, 60, "rgba(110,135,160,0.55)", 0.3);
    ridge(390, 40, "rgba(90,115,95,0.75)", 1.7);
  }
  function ground(ctx, b) {
    if (b.id === "pit") {
      const g2 = ctx.createLinearGradient(0, b.y - 40, 0, b.y + 40);
      g2.addColorStop(0, "#2a241e");
      g2.addColorStop(1, "#14100c");
      ctx.fillStyle = g2;
      ctx.fillRect(b.x, b.y - 40, b.w, 80);
      return;
    }
    if (b.id === "ledge") {
      const g2 = ctx.createLinearGradient(b.x, 0, b.x + 60, 0);
      g2.addColorStop(0, "#8d8a84");
      g2.addColorStop(1, "#b4b0a8");
      ctx.fillStyle = g2;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = "rgba(60,55,50,0.35)";
      ctx.lineWidth = 1;
      for (let y = b.y + 38; y < b.y + b.h; y += 38) {
        ctx.beginPath();
        ctx.moveTo(b.x, y);
        ctx.lineTo(b.x + b.w, y);
        ctx.stroke();
      }
      const lip = ctx.createLinearGradient(0, b.y, 0, b.y + 10);
      lip.addColorStop(0, "#d8d4cc");
      lip.addColorStop(1, "#9d998f");
      ctx.fillStyle = lip;
      ctx.fillRect(b.x, b.y, b.w, 10);
      return;
    }
    const g = ctx.createLinearGradient(0, b.y, 0, b.y + b.h);
    g.addColorStop(0, "#6b4f36");
    g.addColorStop(1, "#3e2c1d");
    ctx.fillStyle = g;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    const grass = ctx.createLinearGradient(0, b.y - 6, 0, b.y + 12);
    grass.addColorStop(0, "#8fbf5a");
    grass.addColorStop(1, "#4d7d2c");
    ctx.fillStyle = grass;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y + 12);
    for (let x = b.x; x <= b.x + b.w; x += 6) ctx.lineTo(x, b.y - 2 - 3 * Math.abs(Math.sin(x * 0.37)));
    ctx.lineTo(b.x + b.w, b.y + 12);
    ctx.closePath();
    ctx.fill();
  }
  function pad(ctx, q, floor2) {
    const left = q.x - q.w / 2, top = topOf(q);
    for (const cx of [left + 22, q.x, left + q.w - 22]) {
      const n = 6, y0 = top + 10, h = floor2 - y0;
      ctx.lineWidth = 3.2;
      ctx.lineCap = "round";
      const g = ctx.createLinearGradient(cx - 10, 0, cx + 10, 0);
      g.addColorStop(0, "#6f757d");
      g.addColorStop(0.5, "#e4e8ec");
      g.addColorStop(1, "#5d636b");
      ctx.strokeStyle = g;
      ctx.beginPath();
      for (let k = 0; k <= 60; k++) {
        const t = k / 60;
        const y = y0 + t * h, x = cx + 10 * Math.sin(t * n * Math.PI * 2);
        k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    const plate = ctx.createLinearGradient(0, top, 0, top + 12);
    plate.addColorStop(0, "#f2f4f6");
    plate.addColorStop(0.35, "#b9bfc6");
    plate.addColorStop(1, "#6d737b");
    ctx.fillStyle = plate;
    ctx.beginPath();
    ctx.roundRect(left, top, q.w, 12, 4);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "rgba(255,190,40,0.9)";
    for (let x = left + 8; x < left + q.w - 8; x += 22) {
      ctx.beginPath();
      ctx.moveTo(x, top + 3);
      ctx.lineTo(x + 10, top + 3);
      ctx.lineTo(x + 6, top + 9);
      ctx.lineTo(x - 4, top + 9);
      ctx.closePath();
      ctx.fill();
    }
  }
  function flag2(ctx, g, tick, done) {
    const pole = ctx.createLinearGradient(g.x + 3, 0, g.x + 9, 0);
    pole.addColorStop(0, "#9aa0a8");
    pole.addColorStop(0.5, "#f4f6f8");
    pole.addColorStop(1, "#80868e");
    ctx.fillStyle = pole;
    ctx.fillRect(g.x + 3, g.y - 6, 6, g.h + 6);
    ctx.fillStyle = done ? "#f0c030" : "#c8302a";
    ctx.beginPath();
    ctx.moveTo(g.x + 9, g.y);
    for (let k = 0; k <= 10; k++) {
      const x = g.x + 9 + k * 3.4;
      ctx.lineTo(x, g.y + 3 * Math.sin(k * 0.7 - tick * 0.12));
    }
    for (let k = 10; k >= 0; k--) {
      const x = g.x + 9 + k * 3.4;
      ctx.lineTo(x, g.y + 24 + 3 * Math.sin(k * 0.7 - tick * 0.12));
    }
    ctx.closePath();
    ctx.fill();
  }
  function groundBelow(s, level, x, y) {
    let best = 540;
    for (const b of level.solids) if (x >= b.x && x <= b.x + b.w && b.y >= y - 1 && b.y < best) best = b.y;
    for (const q of s.platforms) {
      const t = topOf(q);
      if (Math.abs(x - q.x) <= q.w / 2 && t >= y - 1 && t < best) best = t;
    }
    return best;
  }
  function figure(ctx, s, level) {
    const p = s.player, h = PLAYER.body.h;
    const feet = p.y + h / 2;
    const gy = groundBelow(s, level, p.x, feet);
    const sh = Math.max(0.3, 1 - (gy - feet) / 220);
    const sg = ctx.createRadialGradient(p.x, gy, 0, p.x, gy, 18 * sh);
    sg.addColorStop(0, "rgba(0,0,0,0.35)");
    sg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.ellipse(p.x, gy, 20 * sh, 5 * sh, 0, 0, Math.PI * 2);
    ctx.fill();
    const squash = p.locked ? 0.9 : 1;
    const phase = p.grounded && Math.abs(p.vx) > 0.3 ? Math.sin(p.x * 0.18) : 0;
    const air = !p.grounded && !p.locked;
    ctx.save();
    ctx.translate(p.x, feet);
    ctx.scale(p.facing, squash);
    ctx.lineCap = "round";
    const limb = (x0, y0, x1, y1, x2, y2, w, col) => {
      ctx.strokeStyle = col;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    };
    const step = air ? 0.5 : phase;
    limb(0, -20, -5 * step + (air ? 4 : 0), -10 + (air ? -2 : 0), -8 * step + (air ? 2 : 0), 0 + (air ? -6 : 0), 6, "#2c3e5c");
    limb(0, -20, 5 * step + (air ? 6 : 0), -10 + (air ? -4 : 0), 8 * step + (air ? 8 : 0), 0 + (air ? -2 : 0), 6, "#34496b");
    const torso = ctx.createLinearGradient(-8, -38, 8, -18);
    torso.addColorStop(0, "#d0583a");
    torso.addColorStop(1, "#8c2f1e");
    ctx.fillStyle = torso;
    ctx.beginPath();
    ctx.roundRect(-8, -38, 16, 20, 6);
    ctx.fill();
    limb(0, -34, 6 * -step + 3, -26, 8 * -step + 6, -18 + (air ? -12 : 0), 4.5, "#b84a30");
    const head = ctx.createRadialGradient(-2, -46, 1, 0, -44, 8);
    head.addColorStop(0, "#f6d2b0");
    head.addColorStop(1, "#c48a62");
    ctx.fillStyle = head;
    ctx.beginPath();
    ctx.arc(0, -44, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3a2618";
    ctx.beginPath();
    ctx.arc(-1, -46.5, 6.6, Math.PI * 1.05, Math.PI * 2.05);
    ctx.fill();
    ctx.restore();
  }
  function renderReal(ctx, s, level) {
    ctx.imageSmoothingEnabled = true;
    const cam = cameraFor(level, s);
    sky(ctx, cam.x);
    const floor2 = level.solids.find((b) => b.id === "pit")?.y ?? 500;
    inWorld(ctx, cam, () => {
      for (const b of level.solids) if (!b.id.startsWith("wall")) ground(ctx, b);
      for (const q of s.platforms) pad(ctx, q, floor2);
      for (const g of level.goals) flag2(ctx, g, s.tick, s.reached.includes(g.id));
      figure(ctx, s, level);
    });
    if (s.reached.length) {
      ctx.font = '600 18px "Noto Sans SC", system-ui, sans-serif';
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 4;
      ctx.fillText("\u5230\u8FBE\u7EC8\u70B9", 24, 34);
      ctx.shadowBlur = 0;
    }
  }

  // src/games/p2_bounce.ts
  var createP2 = () => createPlatformGame("p2_bounce", P2_LEVEL, [createBounce(BOUNCE)], renderReal);

  // src/platform/levels_p3.ts
  var P3_LEVEL = {
    ...P1_LEVEL,
    id: "p3",
    platforms: [
      { ...P1_LEVEL.platforms[0], tags: ["bouncy"] },
      { id: "sky", x: 880, y: 160, w: 150, h: 12, tags: [] }
    ],
    goals: [...P1_LEVEL.goals, { id: "star", x: 866, y: 114, w: 28, h: 40 }]
  };

  // src/platform/render_pixel_p3.ts
  var renderPixelP3 = makePixelRenderer({
    platform(ctx, q) {
      if (!q.tags.includes("bouncy")) return false;
      const left = Math.round(q.x - q.w / 2), top = Math.round(topOf(q));
      const base = Math.round(q.y + q.h / 2);
      const gap = Math.max(3, base - (top + 8));
      for (const sx of [left + 18, left + q.w - 30]) {
        for (let k = 0; k < gap; k += 3) rect(ctx, sx + (k / 3 % 2 ? 6 : 0), top + 8 + k, 6, 3, "#c9ccd6");
      }
      rect(ctx, left + 6, base, q.w - 12, 6, "#4b4f5e");
      rect(ctx, left, top, q.w, 8, "#6b6f80");
      rect(ctx, left, top, q.w, 3, "#a3a7b8");
      for (let x = left + 6; x < left + q.w - 4; x += 18) rect(ctx, x, top + 4, 3, 3, "#454856");
      return true;
    },
    goal(ctx, g, s) {
      if (g.id !== "star") return false;
      const rows = ["...Y...", "...Y...", "..YYY..", "YYYYYYY", ".YYYYY.", "..YYY..", ".YY.YY.", "YY...YY"];
      const bob = Math.floor(s.tick / 15) % 2 ? 3 : 0;
      drawSprite(ctx, rows, { Y: s.reached.includes("star") ? "#ffffff" : "#ffd23e" }, g.x + 14, g.y + 20 + bob, { scale: 4 });
      return true;
    }
  });

  // src/games/p3_combined.ts
  var createP3 = () => createPlatformGame("p3_combined", P3_LEVEL, [createPlatformMotion(MOTION), createBounce(BOUNCE)], renderPixelP3);

  // src/platform/walls.ts
  var walls = (w) => [
    { id: "wall_l", x: -40, y: -400, w: 40, h: 1200 },
    { id: "wall_r", x: w, y: -400, w: 40, h: 1200 }
  ];

  // src/platform/levels_v2.ts
  var P0_PLAYER = { ...PLAYER, gravity: 0.45, max_fall: 11, run_speed: 3, ground_accel: 0.7, air_accel: 0.3, jump_speed: 10.2 };
  var P0_LEVEL = {
    id: "v2_p0",
    player: P0_PLAYER,
    start: [70, 420],
    solids: [
      ...walls(960),
      { id: "ground_l", x: 0, y: 440, w: 220, h: 100 },
      { id: "ground_r", x: 790, y: 376, w: 170, h: 164 }
    ],
    platforms: [{ id: "mover", x: 275, y: 430, w: 110, h: 16, tags: [] }],
    goals: [{ id: "flag", x: 900, y: 296, w: 30, h: 80 }]
  };

  // src/platform/render_flat.ts
  var C = {
    sky: "#e9eef4",
    sun: "#f6d6a8",
    hill: "#d3dde8",
    ground: "#3d5a80",
    top: "#98c1d9",
    water: "#9fc7dd",
    wave: "#c5dfec",
    plat: "#ee6c4d",
    platEdge: "#c4503a",
    body: "#293241",
    head: "#f2cc8f",
    flag: "#e07a5f",
    pole: "#3d405b"
  };
  function roundRect(ctx, x, y, w, h, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
  }
  function drawFlatPlatform(ctx, q) {
    const top = topOf(q);
    roundRect(ctx, q.x - q.w / 2, top, q.w, Math.max(10, q.h), 6, C.platEdge);
    roundRect(ctx, q.x - q.w / 2, top, q.w, Math.max(10, q.h) - 4, 6, C.plat);
  }
  function character(ctx, s, level) {
    const p = s.player, P = level.player ?? PLAYER;
    const { w, h } = P.body;
    const squash = p.locked ? 0.85 : 1;
    const bh = (h - 14) * squash;
    roundRect(ctx, p.x - w / 2, p.y + h / 2 - bh, w, bh, 10, C.body);
    ctx.fillStyle = C.head;
    ctx.beginPath();
    ctx.arc(p.x, p.y + h / 2 - bh - 7, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.body;
    ctx.beginPath();
    ctx.arc(p.x + p.facing * 3.5, p.y + h / 2 - bh - 8, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  function flag3(ctx, g, done) {
    ctx.fillStyle = C.pole;
    ctx.fillRect(g.x + 4, g.y, 4, g.h);
    ctx.fillStyle = done ? "#81b29a" : C.flag;
    ctx.beginPath();
    ctx.moveTo(g.x + 8, g.y);
    ctx.lineTo(g.x + 34, g.y + 11);
    ctx.lineTo(g.x + 8, g.y + 22);
    ctx.closePath();
    ctx.fill();
  }
  function makeFlatRenderer(extras = {}) {
    return (ctx, s, level) => {
      ctx.imageSmoothingEnabled = true;
      const cam = cameraFor(level, s);
      const [W] = level.size ?? [960, 540];
      ctx.fillStyle = C.sky;
      ctx.fillRect(0, 0, 960, 540);
      ctx.fillStyle = C.sun;
      ctx.beginPath();
      ctx.arc(760, 110, 46, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.hill;
      for (const [x, r] of [[120, 160], [430, 220], [820, 180]]) {
        ctx.beginPath();
        ctx.arc(x - cam.x * 0.2, 470, r, Math.PI, 0);
        ctx.fill();
      }
      inWorld(ctx, cam, () => {
        ctx.fillStyle = C.water;
        ctx.fillRect(-40, level.water ?? 470, W + 80, 400);
        ctx.fillStyle = C.wave;
        for (let x = 0; x < W; x += 40) {
          ctx.beginPath();
          ctx.ellipse(x + 20, (level.water ?? 470) + 6, 14, 3, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        for (const b of level.solids) {
          if (b.id.startsWith("wall")) continue;
          roundRect(ctx, b.x, b.y, b.w, b.h, 4, C.ground);
          roundRect(ctx, b.x, b.y, b.w, 8, 4, C.top);
        }
        for (const q of s.platforms) if (!extras.platform?.(ctx, q, s)) drawFlatPlatform(ctx, q);
        for (const g of level.goals) if (!extras.goal?.(ctx, g, s)) flag3(ctx, g, s.reached.includes(g.id));
        character(ctx, s, level);
      });
      if (s.reached.length) {
        ctx.font = '600 16px "Noto Sans SC", system-ui, sans-serif';
        ctx.fillStyle = C.body;
        ctx.fillText(`\u5230\u8FBE ${s.reached.join("\u3001")}`, 20, 30);
      }
    };
  }
  var renderFlat = makeFlatRenderer();

  // src/games/v2_p0.ts
  var createV2P0 = () => createPlatformGame("v2_p0_base", P0_LEVEL, [], renderFlat);

  // src/platform/components/ride_motion.ts
  function catmullOpen(P, u) {
    const n = P.length, i = Math.min(n - 2, Math.floor(u)), t = u - i;
    const g = (k) => P[Math.max(0, Math.min(n - 1, k))];
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
    return [f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])];
  }
  function buildPath(cfg, per = 120) {
    const n = cfg.path.length, xs = [], ys = [], ss = [];
    let s = 0, sMid = 0;
    for (let k = 0; k <= (n - 1) * per; k++) {
      const [x, y] = catmullOpen(cfg.path, k / per);
      if (k) s += Math.hypot(x - xs[k - 1], y - ys[k - 1]);
      xs.push(x);
      ys.push(y);
      ss.push(s);
      if (k === cfg.mid * per) sMid = s;
    }
    return { xs, ys, ss, len: s, sMid };
  }
  function at(T, s) {
    let lo = 0, hi = T.ss.length - 1;
    while (hi - lo > 1) {
      const m = lo + hi >> 1;
      if (T.ss[m] <= s) lo = m;
      else hi = m;
    }
    const f = T.ss[hi] > T.ss[lo] ? (s - T.ss[lo]) / (T.ss[hi] - T.ss[lo]) : 0;
    return [T.xs[lo] + f * (T.xs[hi] - T.xs[lo]), T.ys[lo] + f * (T.ys[hi] - T.ys[lo])];
  }
  function createRideMotion(cfg) {
    const T = buildPath(cfg);
    return {
      id: "ride",
      config: cfg,
      init(s) {
        const q = s.platforms.find((p) => p.id === cfg.platform);
        s.comp.ride = { mode: "HOME", s: 0, v: 0, t: 0, passed_mid: false, home: [q.x, q.y] };
      },
      motion(s, { emit }) {
        const m = s.comp.ride, q = s.platforms.find((p) => p.id === cfg.platform);
        const rider = s.player.on === q.id;
        const place = () => {
          const [dx, dy] = at(T, m.s);
          const x = m.home[0] + dx, y = m.home[1] + dy;
          q.vx = x - q.x;
          q.vy = y - q.y;
          q.x = x;
          q.y = y;
        };
        switch (m.mode) {
          case "HOME":
            if (rider) {
              m.mode = "ARMING";
              m.t = 0;
            }
            return;
          case "ARMING":
            if (!rider) {
              m.mode = "HOME";
              return;
            }
            if (++m.t >= cfg.arm_ticks) {
              m.mode = "OUT";
              m.passed_mid = false;
              m.v = 0;
              emit({ type: "platform_start" });
            }
            return;
          case "PAUSE":
          case "END":
          case "WAIT":
            if (--m.t > 0) return;
            if (m.mode === "PAUSE") {
              m.mode = m.resume;
              return;
            }
            if (m.mode === "END" && !rider) {
              m.mode = "WAIT";
              m.t = cfg.empty_wait;
              return;
            }
            m.mode = "BACK";
            m.passed_mid = false;
            m.v = 0;
            return;
          case "OUT":
          case "BACK": {
            const out = m.mode === "OUT";
            const target = !m.passed_mid ? T.sMid : out ? T.len : 0;
            const remaining = Math.abs(target - m.s);
            const vmax = rider ? cfg.v_loaded : out ? cfg.v_empty : cfg.v_back_empty;
            let v = m.v > vmax ? Math.max(vmax, m.v - cfg.decel) : Math.min(vmax, m.v + cfg.accel);
            v = Math.min(v, Math.sqrt(2 * cfg.decel * remaining));
            const step = Math.min(v, remaining);
            m.s += out ? step : -step;
            m.v = v;
            place();
            if (remaining - step < 1e-9) {
              m.s = target;
              m.v = 0;
              if (!m.passed_mid) {
                m.passed_mid = true;
                m.resume = m.mode;
                m.mode = "PAUSE";
                m.t = cfg.mid_pause;
                emit({ type: "platform_stop", at: "mid" });
              } else if (out) {
                m.mode = "END";
                m.t = cfg.end_dwell;
                emit({ type: "platform_stop", at: "end" });
              } else {
                m.mode = "HOME";
                emit({ type: "platform_stop", at: "home" });
              }
            }
            return;
          }
        }
      }
    };
  }

  // src/platform/levels_v2_p1.ts
  var P1V2_PLAYER = { ...PLAYER, gravity: 0.62, max_fall: 13, run_speed: 3.8, ground_accel: 0.9, ground_friction: 0.55, air_accel: 0.4, jump_speed: 12 };
  var RIDE = {
    platform: "mover",
    path: [[0, 0], [90, -70], [230, -150], [360, -140], [460, -62]],
    mid: 2,
    arm_ticks: 20,
    accel: 0.06,
    decel: 0.08,
    v_loaded: 2.1,
    v_empty: 3,
    v_back_empty: 4.2,
    mid_pause: 30,
    end_dwell: 40,
    empty_wait: 60
  };
  var P1V2_LEVEL = {
    id: "v2_p1",
    size: [1300, 600],
    player: P1V2_PLAYER,
    camera: { zoom: 1.3, follow: true },
    water: 560,
    start: [100, 480],
    solids: [
      ...walls(1300),
      { id: "ground_l", x: 0, y: 500, w: 300, h: 100 },
      { id: "island", x: 610, y: 430, w: 60, h: 170 },
      { id: "ground_r", x: 870, y: 436, w: 430, h: 164 }
    ],
    platforms: [{ id: "mover", x: 355, y: 490, w: 110, h: 16, tags: [] }],
    goals: [{ id: "flag", x: 1200, y: 356, w: 30, h: 80 }]
  };

  // src/games/v2_p1.ts
  var createV2P1 = () => createPlatformGame("v2_p1_ride", P1V2_LEVEL, [createRideMotion(RIDE)], renderPixel);

  // src/platform/levels_v2_p2.ts
  var P2V2_PLAYER = { ...PLAYER, gravity: 0.38, max_fall: 12, run_speed: 2.7, ground_accel: 0.6, ground_friction: 0.65, air_accel: 0.28, jump_speed: 8.8 };
  var BOUNCE2 = {
    compress_ticks: 12,
    depth: 22,
    charge_ticks: 18,
    launch_speed: 17,
    launch_ticks: 4,
    overshoot: 10,
    recover_ticks: 36,
    inherit: 1,
    dynamic: { depth: [4, 2.2, 8, 30], speed: [8, 1, 11, 19], offset_vx: 3.5, hold_boost: 3.5 }
  };
  var P2V2_LEVEL = {
    id: "v2_p2",
    size: [1400, 600],
    player: P2V2_PLAYER,
    camera: { zoom: 0.85, follow: true },
    start: [120, 500],
    solids: [
      ...walls(1400),
      { id: "ground_l", x: 0, y: 520, w: 645, h: 80 },
      { id: "step", x: 560, y: 506, w: 85, h: 14 },
      { id: "pit", x: 645, y: 560, w: 110, h: 40 },
      { id: "ground_r", x: 755, y: 520, w: 75, h: 80 },
      { id: "ledge", x: 830, y: 250, w: 570, h: 350 }
    ],
    platforms: [{ id: "pad", x: 700, y: 528, w: 110, h: 16, tags: ["bouncy"] }],
    goals: [{ id: "flag", x: 1250, y: 170, w: 30, h: 80 }]
  };

  // src/games/v2_p2.ts
  var createV2P2 = () => createPlatformGame("v2_p2_spring", P2V2_LEVEL, [createBounce(BOUNCE2)], renderReal);

  // src/platform/levels_v2_p3.ts
  var P3V2_LEVEL = {
    ...P0_LEVEL,
    id: "v2_p3",
    platforms: [
      { ...P0_LEVEL.platforms[0], tags: ["bouncy"] },
      { id: "sky", x: 880, y: 150, w: 150, h: 12, tags: [] }
    ],
    goals: [...P0_LEVEL.goals, { id: "star", x: 866, y: 104, w: 28, h: 40 }]
  };

  // src/platform/render_flat_p3.ts
  var renderFlatP3 = makeFlatRenderer({
    platform(ctx, q) {
      if (!q.tags.includes("bouncy")) return false;
      const left = q.x - q.w / 2, top = topOf(q), base = q.y + q.h / 2 + 6;
      ctx.strokeStyle = "#3d405b";
      ctx.lineWidth = 3;
      ctx.lineJoin = "round";
      for (const sx of [left + 26, left + q.w - 26]) {
        ctx.beginPath();
        ctx.moveTo(sx, top + 8);
        const n = 6;
        for (let k = 1; k <= n; k++) ctx.lineTo(sx + (k % 2 ? 7 : -7), top + 8 + (base - top - 8) * (k / n));
        ctx.stroke();
      }
      ctx.fillStyle = "#3d405b";
      ctx.beginPath();
      ctx.roundRect(left + 10, base, q.w - 20, 5, 2);
      ctx.fill();
      ctx.fillStyle = "#c4503a";
      ctx.beginPath();
      ctx.roundRect(left, top, q.w, 10, 5);
      ctx.fill();
      ctx.fillStyle = "#ee6c4d";
      ctx.beginPath();
      ctx.roundRect(left, top, q.w, 7, 5);
      ctx.fill();
      return true;
    },
    goal(ctx, g, s) {
      if (g.id !== "star") return false;
      const cx = g.x + g.w / 2, cy = g.y + 16 + (Math.floor(s.tick / 20) % 2 ? 2 : 0), R = 13, r = 6;
      ctx.fillStyle = s.reached.includes("star") ? "#81b29a" : "#f2a541";
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r : R;
        ctx.lineTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a));
      }
      ctx.closePath();
      ctx.fill();
      return true;
    }
  });

  // src/games/v2_p3.ts
  var createV2P3 = () => createPlatformGame("v2_p3_combined", P3V2_LEVEL, [createRideMotion(RIDE), createBounce(BOUNCE2)], renderFlatP3);

  // src/platform/components/charged_jump.ts
  var jumpHeld = (f) => f.held.includes("jump") || f.held.includes("move_up");
  function createChargedJump(cfg) {
    return {
      id: "cjump",
      config: cfg,
      init(s) {
        s.comp.cjump = { phase: "GROUND", t: 0, charge: 0 };
      },
      control(s, { frame, player, emit }) {
        const c = s.comp.cjump, p = s.player;
        if (!p.grounded && (c.phase === "GROUND" || c.phase === "RECOVER" || c.phase === "CUSHION" || c.phase === "CROUCH")) {
          c.phase = "FALL";
          c.t = 0;
        }
        switch (c.phase) {
          case "GROUND":
          case "RECOVER": {
            steerPlayer(s, frame, player, c.phase === "RECOVER" ? cfg.recover_speed : 1);
            if (c.phase === "RECOVER" && ++c.t >= cfg.recover_ticks) {
              c.phase = "GROUND";
              c.t = 0;
            }
            if (isPressed(frame, "jump") || isPressed(frame, "move_up")) {
              c.phase = "CROUCH";
              c.t = 0;
              c.charge = 0;
              emit({ type: "crouch" });
            }
            return true;
          }
          case "CROUCH": {
            p.vx *= cfg.crouch_slide;
            if (Math.abs(p.vx) < 0.05) p.vx = 0;
            c.t++;
            if (jumpHeld(frame)) c.charge = c.t;
            const release = !jumpHeld(frame) && c.t >= cfg.crouch_min || c.t >= cfg.charge_max;
            if (release) {
              const k = (Math.max(cfg.crouch_min, Math.min(cfg.charge_max, c.charge)) - cfg.crouch_min) / (cfg.charge_max - cfg.crouch_min);
              const from = p.on;
              p.vy = -(cfg.v_min + (cfg.v_max - cfg.v_min) * k);
              p.grounded = false;
              p.on = null;
              c.phase = "UP";
              c.t = 0;
              emit({ type: "jump", x: p.x, y: p.y, from, charge: c.charge });
            }
            return true;
          }
          case "CUSHION": {
            p.vx *= cfg.crouch_slide;
            if (Math.abs(p.vx) < 0.05) p.vx = 0;
            if (--c.t <= 0) {
              c.phase = "RECOVER";
              c.t = 0;
            }
            return true;
          }
          default:
            steerPlayer(s, frame, player);
            if (c.phase === "UP" && p.vy >= 0) {
              c.phase = "HOVER";
              c.t = cfg.hover_ticks;
              p.vy = 0;
              emit({ type: "hover" });
            } else if (c.phase === "HOVER") {
              p.vy = 0;
              if (--c.t <= 0) {
                c.phase = "FALL";
                c.t = 0;
              }
            }
            return true;
        }
      },
      gravity(s) {
        const ph = s.comp.cjump.phase;
        if (ph === "UP") return { gravity: cfg.g_up, max_fall: cfg.max_fall };
        if (ph === "HOVER") return { gravity: 0, max_fall: cfg.max_fall };
        return { gravity: cfg.g_down, max_fall: cfg.max_fall };
      },
      trigger(s, { events, emit }) {
        const c = s.comp.cjump;
        for (const e of events) {
          if (e.type !== "land") continue;
          const impact = Math.max(0, e.impact);
          if (impact >= cfg.cushion_min_impact) {
            c.phase = "CUSHION";
            c.t = Math.round(cfg.cushion_base + cfg.cushion_per_speed * impact);
            emit({ type: "cushion", ticks: c.t });
          } else {
            c.phase = "GROUND";
            c.t = 0;
          }
        }
      }
    };
  }

  // src/platform/components/transfer.ts
  function createTransfer(cfg) {
    return {
      id: "transfer",
      config: cfg,
      init(s) {
        s.comp.transfer = { prev_on: null };
      },
      postControl(s, { events, emit }) {
        const q = s.platforms.find((x) => x.id === cfg.platform);
        for (const e of events) {
          if (e.type === "jump" && e.from === q.id) {
            s.player.vx += q.vx * cfg.factor;
            s.player.vy += q.vy * cfg.factor;
            emit({ type: "transfer", vx: q.vx * cfg.factor, vy: q.vy * cfg.factor, by: "jump" });
            s.comp.transfer.prev_on = null;
          }
        }
      },
      trigger(s, { events, emit }) {
        const t = s.comp.transfer, p = s.player, q = s.platforms.find((x) => x.id === cfg.platform);
        const jumped = events.some((e) => e.type === "jump");
        if (t.prev_on === q.id && p.on !== q.id && !p.locked && !jumped) {
          p.vx += q.vx * cfg.factor;
          p.vy += q.vy * cfg.factor;
          emit({ type: "transfer", vx: q.vx * cfg.factor, vy: q.vy * cfg.factor, by: "leave" });
        }
        t.prev_on = p.on;
      }
    };
  }

  // src/platform/levels_e1.ts
  var E1A_LEVEL = {
    id: "e1a",
    start: [80, 420],
    solids: [...walls(960), { id: "ground_l", x: 0, y: 440, w: 200, h: 100 }, { id: "ground_r", x: 760, y: 440, w: 200, h: 100 }],
    platforms: [{ id: "mover", x: 255, y: 425, w: 110, h: 16, tags: ["moving"] }],
    goals: [{ id: "flag", x: 880, y: 360, w: 30, h: 80 }]
  };
  var E1_MOTION = {
    platform: "mover",
    path: [[255, 425], [360, 330], [470, 370], [590, 250], [705, 330], [705, 425], [560, 470], [400, 470]],
    legs: [
      { from: 0, to: 3, ticks: 150, dwell: 25 },
      { from: 3, to: 5, ticks: 90, dwell: 45 },
      { from: 5, to: 0, ticks: 160, dwell: 35 }
    ]
  };
  var E1_TRANSFER = { platform: "mover", factor: 1 };

  // src/platform/levels_e1_b.ts
  var E1B_LEVEL = {
    id: "e1b",
    start: [80, 440],
    solids: [
      ...walls(960),
      { id: "ground", x: 0, y: 460, w: 960, h: 80 },
      { id: "block1", x: 300, y: 400, w: 120, h: 60 },
      { id: "block2", x: 560, y: 310, w: 140, h: 150 },
      { id: "ledge", x: 780, y: 230, w: 180, h: 230 }
    ],
    platforms: [],
    goals: [{ id: "flag", x: 900, y: 150, w: 30, h: 80 }]
  };
  var E1_JUMP = {
    crouch_min: 6,
    charge_max: 30,
    v_min: 8,
    v_max: 14,
    g_up: 0.55,
    hover_ticks: 16,
    g_down: 0.8,
    max_fall: 13,
    cushion_base: 4,
    cushion_per_speed: 1,
    cushion_min_impact: 4,
    recover_ticks: 10,
    recover_speed: 0.5,
    crouch_slide: 0.6
  };

  // src/platform/levels_e1_c.ts
  var E1C_LEVEL = {
    ...E1A_LEVEL,
    id: "e1c",
    platforms: [...E1A_LEVEL.platforms, { id: "sky", x: 300, y: 104, w: 120, h: 12, tags: [] }],
    goals: [...E1A_LEVEL.goals, { id: "star", x: 286, y: 60, w: 28, h: 36 }]
  };

  // src/games/e1.ts
  var createE1A = () => createPlatformGame("e1a_platform", E1A_LEVEL, [createPlatformMotion(E1_MOTION), createTransfer(E1_TRANSFER)], renderPixel);
  var createE1B = () => createPlatformGame("e1b_jump", E1B_LEVEL, [createChargedJump(E1_JUMP)], renderReal);
  var createE1C = () => createPlatformGame(
    "e1c_combined",
    E1C_LEVEL,
    [createPlatformMotion(E1_MOTION), createChargedJump(E1_JUMP), createTransfer(E1_TRANSFER)],
    renderPixelP3
  );

  // src/platform/components/portal.ts
  var dot = (a, b) => a[0] * b[0] + a[1] * b[1];
  var tangent = (n) => [-n[1], n[0]];
  function createPortal(cfg) {
    return {
      id: "portal",
      config: cfg,
      init(s) {
        s.comp.portal = { prev: [s.player.x, s.player.y], cool: 0 };
      },
      motion(s) {
        const c = s.comp.portal;
        c.prev = [s.player.x, s.player.y];
        if (c.cool > 0) c.cool--;
      },
      trigger(s, { emit, player }) {
        const c = s.comp.portal, p = s.player;
        if (c.cool > 0 || p.locked) return;
        for (const [E, F] of [[cfg.a, cfg.b], [cfg.b, cfg.a]]) {
          const before = dot([c.prev[0] - E.x, c.prev[1] - E.y], E.normal);
          const now = dot([p.x - E.x, p.y - E.y], E.normal);
          if (!(before > 0 && now <= 0)) continue;
          const f = before / (before - now);
          const cx = c.prev[0] + (p.x - c.prev[0]) * f, cy = c.prev[1] + (p.y - c.prev[1]) * f;
          const tE = tangent(E.normal), off = dot([cx - E.x, cy - E.y], tE);
          if (Math.abs(off) > E.len / 2) continue;
          const v = [p.vx, p.vy];
          const vin = -dot(v, E.normal), vt = dot(v, tE);
          if (vin < cfg.min_in) continue;
          const tF = tangent(F.normal);
          const clear = Math.abs(F.normal[0]) * player.body.w / 2 + Math.abs(F.normal[1]) * player.body.h / 2 + 1;
          p.x = F.x + tF[0] * -off + F.normal[0] * clear;
          p.y = F.y + tF[1] * -off + F.normal[1] * clear;
          let vx = (F.normal[0] * vin - tF[0] * vt) * cfg.scale, vy = (F.normal[1] * vin - tF[1] * vt) * cfg.scale;
          const sp = Math.hypot(vx, vy);
          if (sp > cfg.max_speed) {
            vx *= cfg.max_speed / sp;
            vy *= cfg.max_speed / sp;
          }
          p.vx = vx;
          p.vy = vy;
          p.grounded = false;
          p.on = null;
          c.cool = cfg.cooldown;
          c.prev = [p.x, p.y];
          emit({ type: "portal", from: E.id, to: F.id, speed_in: Math.hypot(v[0], v[1]), speed_out: Math.hypot(vx, vy) });
          return;
        }
      }
    };
  }

  // src/platform/levels_e2.ts
  var E2A_LEVEL = {
    id: "e2a",
    start: [60, 130],
    solids: [
      ...walls(960),
      { id: "high", x: 0, y: 150, w: 230, h: 390 },
      { id: "ground1", x: 230, y: 470, w: 100, h: 70 },
      { id: "pocket", x: 330, y: 530, w: 80, h: 10 },
      { id: "ground2", x: 410, y: 470, w: 550, h: 70 },
      { id: "wall_up", x: 470, y: 200, w: 30, h: 100 },
      { id: "wall_lo", x: 470, y: 380, w: 30, h: 90 }
    ],
    platforms: [],
    goals: [{ id: "flag", x: 900, y: 390, w: 30, h: 80 }]
  };
  var E2_PORTAL_A = {
    a: { id: "floor", x: 370, y: 470, len: 80, normal: [0, -1] },
    b: { id: "wall", x: 500, y: 340, len: 80, normal: [1, 0] },
    scale: 1.5,
    max_speed: 22,
    min_in: 1,
    cooldown: 10
  };

  // src/platform/render_neon.ts
  function glow(ctx, color, blur, draw) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    draw();
    ctx.restore();
  }
  function portal(ctx, E, color, tick) {
    const t = [-E.normal[1], E.normal[0]];
    const ax = E.x + t[0] * E.len / 2, ay = E.y + t[1] * E.len / 2, bx = E.x - t[0] * E.len / 2, by = E.y - t[1] * E.len / 2;
    glow(ctx, color, 18, () => {
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
      ctx.globalAlpha = 0.25 + 0.15 * Math.sin(tick * 0.15);
      ctx.beginPath();
      ctx.ellipse(E.x + E.normal[0] * 8, E.y + E.normal[1] * 8, E.normal[0] ? 10 : E.len / 2, E.normal[0] ? E.len / 2 : 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(E.x, E.y);
      ctx.lineTo(E.x + E.normal[0] * 22, E.y + E.normal[1] * 22);
      ctx.stroke();
    });
  }
  function flag4(ctx, g, done, tick) {
    const c = done ? "#7dffb0" : "#ffe14d";
    glow(ctx, c, 14, () => {
      ctx.lineWidth = 2;
      if (g.id === "star") {
        const cx = g.x + g.w / 2, cy = g.y + 18 + Math.sin(tick * 0.1) * 2;
        ctx.beginPath();
        for (let k = 0; k < 10; k++) {
          const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 6 : 13;
          ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
        }
        ctx.closePath();
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(g.x + 6, g.y + g.h);
        ctx.lineTo(g.x + 6, g.y);
        ctx.lineTo(g.x + 30, g.y + 10);
        ctx.lineTo(g.x + 6, g.y + 20);
        ctx.stroke();
      }
    });
  }
  function drawNeonPlatform(ctx, q) {
    glow(ctx, "#56f0ff", 10, () => {
      ctx.lineWidth = 2;
      ctx.strokeRect(q.x - q.w / 2, topOf(q), q.w, q.h);
    });
  }
  function makeNeonRenderer(extras = {}) {
    return (ctx, s, level) => {
      ctx.imageSmoothingEnabled = true;
      ctx.fillStyle = "#0b0b1a";
      ctx.fillRect(0, 0, 960, 540);
      ctx.strokeStyle = "rgba(120,90,255,0.12)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= 960; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 540);
        ctx.stroke();
      }
      for (let y = 0; y <= 540; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(960, y);
        ctx.stroke();
      }
      for (const b of level.solids) {
        if (b.id.startsWith("wall_") && (b.x < 0 || b.x >= 960)) continue;
        ctx.fillStyle = "rgba(86,240,255,0.06)";
        ctx.fillRect(b.x, b.y, b.w, b.h);
        glow(ctx, "#56f0ff", 12, () => {
          ctx.lineWidth = 2;
          ctx.strokeRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);
        });
      }
      for (const q of s.platforms) if (!extras.platform?.(ctx, q, s)) drawNeonPlatform(ctx, q);
      if (extras.portals) {
        portal(ctx, extras.portals.a, "#ff9a3c", s.tick);
        portal(ctx, extras.portals.b, "#4ea8ff", s.tick);
      }
      for (const g of level.goals) flag4(ctx, g, s.reached.includes(g.id), s.tick);
      const p = s.player, P = level.player ?? PLAYER;
      glow(ctx, "#ff4fd8", 16, () => {
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(p.x - P.body.w / 2, p.y - P.body.h / 2 + 10, P.body.w, P.body.h - 10, 8);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(p.x, p.y - P.body.h / 2 + 5, 6, 0, Math.PI * 2);
        ctx.stroke();
      });
      if (s.reached.length) glow(ctx, "#ffe14d", 8, () => {
        ctx.font = '600 16px "Noto Sans SC", system-ui, sans-serif';
        ctx.fillText(`\u5230\u8FBE ${s.reached.join("\u3001")}`, 20, 30);
      });
    };
  }

  // src/games/e2a.ts
  var createE2A = () => createPlatformGame("e2a_portal", E2A_LEVEL, [createPortal(E2_PORTAL_A)], makeNeonRenderer({ portals: E2_PORTAL_A }));

  // src/platform/levels_e2_b.ts
  var E2B_LEVEL = {
    id: "e2b",
    start: [60, 150],
    solids: [
      ...walls(960),
      { id: "tall", x: 0, y: 170, w: 150, h: 370 },
      { id: "low", x: 150, y: 350, w: 80, h: 190 },
      { id: "ground", x: 230, y: 470, w: 390, h: 70 },
      { id: "pedestal", x: 245, y: 456, w: 110, h: 14 },
      { id: "ledge", x: 620, y: 250, w: 340, h: 290 }
    ],
    platforms: [{ id: "pad", x: 300, y: 438, w: 110, h: 16, tags: ["bouncy"] }],
    // top 430, sinks at most to 454
    goals: [{ id: "flag", x: 880, y: 170, w: 30, h: 80 }]
  };
  var E2_BOUNCE = {
    compress_ticks: 10,
    depth: 18,
    charge_ticks: 14,
    launch_speed: 14,
    launch_ticks: 4,
    overshoot: 8,
    recover_ticks: 30,
    inherit: 1,
    dynamic: { depth: [4, 1.6, 8, 24], speed: [7, 1, 10, 19], offset_vx: 0, hold_boost: 0 },
    angle_deg: 35,
    drag: { ticks: 20, factor: 0.99 }
  };

  // src/games/e2b.ts
  var flatPad = makeFlatRenderer({
    platform(ctx, q) {
      if (!q.tags.includes("bouncy")) return false;
      const left = q.x - q.w / 2, top = topOf(q), base = q.y + q.h / 2 + 2;
      ctx.strokeStyle = "#3d405b";
      ctx.lineWidth = 3;
      for (const sx of [left + 24, left + q.w - 24]) {
        ctx.beginPath();
        ctx.moveTo(sx, top + 8);
        for (let k = 1; k <= 5; k++) ctx.lineTo(sx + (k % 2 ? 6 : -6), top + 8 + (base - top - 8) * (k / 5));
        ctx.stroke();
      }
      ctx.fillStyle = "#c4503a";
      ctx.beginPath();
      ctx.roundRect(left, top, q.w, 10, 5);
      ctx.fill();
      const a = (E2_BOUNCE.angle_deg ?? 0) * Math.PI / 180;
      ctx.strokeStyle = "#f4f1de";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(q.x, top + 5);
      ctx.lineTo(q.x + Math.sin(a) * 26, top + 5 - Math.cos(a) * 26);
      ctx.stroke();
      return true;
    }
  });
  var createE2B = () => createPlatformGame("e2b_bounce", E2B_LEVEL, [createBounce(E2_BOUNCE)], flatPad);

  // src/platform/levels_e2_c.ts
  var E2C_LEVEL = {
    id: "e2c",
    start: [60, 100],
    solids: [
      ...walls(960),
      { id: "high", x: 0, y: 120, w: 160, h: 420 },
      { id: "ground_b", x: 160, y: 470, w: 800, h: 70 },
      { id: "pedestal", x: 200, y: 456, w: 110, h: 14 },
      { id: "wall_up", x: 620, y: 40, w: 30, h: 120 },
      { id: "wall_lo", x: 620, y: 240, w: 30, h: 230 },
      { id: "tower_l", x: 720, y: 330, w: 40, h: 140 },
      { id: "pocket", x: 760, y: 390, w: 80, h: 80 },
      { id: "tower_r", x: 840, y: 330, w: 120, h: 140 }
    ],
    platforms: [
      { id: "pad", x: 255, y: 438, w: 110, h: 16, tags: ["bouncy"] },
      { id: "top", x: 880, y: 170, w: 140, h: 12, tags: [] }
    ],
    goals: [{ id: "star", x: 866, y: 124, w: 28, h: 40 }]
  };
  var E2_PORTAL_C = {
    a: { id: "wall", x: 620, y: 200, len: 80, normal: [-1, 0] },
    b: { id: "floor", x: 800, y: 330, len: 80, normal: [0, -1] },
    scale: 1.5,
    max_speed: 22,
    min_in: 1,
    cooldown: 10
  };

  // src/games/e2c.ts
  var neonPad = (ctx, q) => {
    if (!q.tags.includes("bouncy")) return false;
    const top = topOf(q);
    ctx.save();
    ctx.shadowColor = "#7dffb0";
    ctx.shadowBlur = 12;
    ctx.strokeStyle = "#7dffb0";
    ctx.lineWidth = 2;
    ctx.strokeRect(q.x - q.w / 2, top, q.w, 8);
    for (const sx of [q.x - 30, q.x + 30]) {
      ctx.beginPath();
      ctx.moveTo(sx, top + 8);
      for (let k = 1; k <= 4; k++) ctx.lineTo(sx + (k % 2 ? 6 : -6), top + 8 + (q.y + q.h / 2 + 2 - top - 8) * (k / 4));
      ctx.stroke();
    }
    ctx.restore();
    return true;
  };
  var createE2C = () => createPlatformGame(
    "e2c_combined",
    E2C_LEVEL,
    [createPortal(E2_PORTAL_C), createBounce(E2_BOUNCE)],
    makeNeonRenderer({ portals: E2_PORTAL_C, platform: neonPad })
  );

  // src/arena/world.ts
  var ARENA = {
    player: { size: 24, speed: 2.6, hp: 5, bullet_speed: 8, cooldown: 14 },
    enemy_size: 28,
    bullet_size: 6,
    hurt_ticks: 8,
    view: [960, 540]
  };
  var bodyBox = (b, size) => centerBox(b.x, b.y, size, size);
  function inputDir(f) {
    const x = (isHeld(f, "move_right") ? 1 : 0) - (isHeld(f, "move_left") ? 1 : 0);
    const y = (isHeld(f, "move_down") ? 1 : 0) - (isHeld(f, "move_up") ? 1 : 0);
    return [x, y];
  }
  function fire2(s, owner, x, y, dx, dy, speed, emit) {
    const n = Math.hypot(dx, dy) || 1;
    const b = { id: s.next_bullet++, owner, x, y, vx: dx / n * speed, vy: dy / n * speed };
    s.bullets.push(b);
    emit({ type: "shot", by: owner, bullet: b.id, vx: b.vx, vy: b.vy });
    return b;
  }
  function initialArena(level) {
    return {
      tick: 0,
      player: { x: level.start[0], y: level.start[1], vx: 0, vy: 0, hp: ARENA.player.hp, alive: true, hurt: 0, facing: [1, 0], cooldown: 0 },
      enemy: null,
      bullets: [],
      next_bullet: 1,
      comp: {}
    };
  }
  function stepArena(s, frame, level, comps, emit, events) {
    const solids2 = () => [...level.walls, ...comps.flatMap((c) => c.solids?.(s) ?? [])];
    const ctx = { level, emit, events, frame, solids: solids2 };
    s.tick++;
    const p = s.player, P = ARENA.player;
    for (const c of comps) c.prePlayer?.(s, ctx);
    if (p.alive) {
      const [dx, dy] = inputDir(frame);
      const k = dx && dy ? Math.SQRT1_2 : 1;
      p.vx = dx * P.speed * k;
      p.vy = dy * P.speed * k;
      if (dx || dy) p.facing = [dx, dy];
      const blockers = [...solids2(), ...s.enemy?.alive ? [bodyBox(s.enemy, ARENA.enemy_size)] : []];
      const [nx, ny] = moveBody(p.x, p.y, P.size, P.size, p.vx, p.vy, blockers);
      p.vx = nx - p.x;
      p.vy = ny - p.y;
      p.x = nx;
      p.y = ny;
      if (p.cooldown > 0) p.cooldown--;
      if (p.cooldown === 0 && (isHeld(frame, "shoot") || isPressed(frame, "shoot"))) {
        const [fx, fy] = p.facing, n = Math.hypot(fx, fy);
        fire2(s, "player", p.x + fx / n * 18, p.y + fy / n * 18, fx, fy, P.bullet_speed, emit);
        p.cooldown = P.cooldown;
      }
    }
    for (const c of comps) c.act?.(s, ctx);
    const walls2 = level.walls;
    const kept = [];
    for (const b of s.bullets) {
      b.x += b.vx;
      b.y += b.vy;
      const bb = centerBox(b.x, b.y, ARENA.bullet_size, ARENA.bullet_size);
      if (walls2.some((w) => overlap(bb, w))) {
        emit({ type: "bullet_wall", bullet: b.id });
        continue;
      }
      let removed = false;
      for (const c of comps) if (c.bullet && c.bullet(s, b, ctx) === "remove") {
        removed = true;
        break;
      }
      if (removed) continue;
      const bb2 = centerBox(b.x, b.y, ARENA.bullet_size, ARENA.bullet_size);
      const bodies = [["player", p, P.size], ...s.enemy ? [["enemy", s.enemy, ARENA.enemy_size]] : []];
      const hit = bodies.find(([id, t, size]) => b.owner !== id && t.alive && overlap(bb2, bodyBox(t, size)));
      if (hit) {
        const [id, t] = hit;
        t.hp = Math.max(0, t.hp - 1);
        t.hurt = ARENA.hurt_ticks;
        if (t.hp === 0) {
          t.alive = false;
          emit({ type: "death", target: id });
        }
        emit({ type: "hit", target: id, bullet: b.id, by: b.owner });
        continue;
      }
      kept.push(b);
    }
    s.bullets = kept;
    for (const t of [p, s.enemy]) if (t && t.hurt > 0) t.hurt--;
  }
  function createArenaGame(id, level, comps, render) {
    let s;
    let events = [];
    const emit = (e) => {
      events.push(e);
    };
    const reset = () => {
      s = initialArena(level);
      for (const c of comps) c.init?.(s, level);
    };
    reset();
    const initial2 = structuredClone(s);
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
        stepArena(s, frame, level, comps, emit, events);
      },
      snapshot: () => structuredClone(s),
      render(ctx) {
        render(ctx, s, level);
      },
      getEvents: () => events,
      describe: () => ({ config: { level, arena: ARENA, components: Object.fromEntries(comps.map((c) => [c.id, c.config])) }, initial_state: initial2, seed: 0 })
    };
  }

  // src/arena/components/enemy.ts
  function createEnemy(cfg) {
    return {
      id: "enemy",
      config: cfg,
      init(s) {
        s.enemy = { x: cfg.start[0], y: cfg.start[1], vx: 0, vy: 0, hp: cfg.hp, alive: true, hurt: 0, facing: [-1, 0] };
        s.comp.enemy = { phase: "APPROACH", t: 0, strafe: 1, shots: 0, cycle: 0 };
      },
      act(s, { emit, solids: solids2 }) {
        const e = s.enemy, m = s.comp.enemy, p = s.player;
        e.vx = 0;
        e.vy = 0;
        if (!e.alive || !p.alive) return;
        const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
        const ux = dx / d, uy = dy / d;
        e.facing = [ux, uy];
        const move = (vx, vy) => {
          const blockers = [...solids2(), bodyBox(p, ARENA.player.size)];
          const want = Math.hypot(vx, vy);
          const tryMove = (mx, my) => moveBody(e.x, e.y, ARENA.enemy_size, ARENA.enemy_size, mx, my, blockers);
          let [nx, ny] = tryMove(vx, vy);
          if (want > 0 && Math.hypot(nx - e.x, ny - e.y) < want * 0.5) {
            for (const side of [m.strafe, -m.strafe]) {
              const [sx, sy] = tryMove(-vy * side, vx * side);
              if (Math.hypot(sx - e.x, sy - e.y) >= want * 0.5) {
                [nx, ny] = [sx, sy];
                emit({ type: "enemy_avoid" });
                break;
              }
            }
          }
          e.vx = nx - e.x;
          e.vy = ny - e.y;
          e.x = nx;
          e.y = ny;
        };
        const radial = d > cfg.keep_max ? 1 : d < cfg.keep_min ? -1 : 0;
        switch (m.phase) {
          case "APPROACH":
            if (radial === 0) {
              m.phase = "KEEP";
              m.t = 0;
              emit({ type: "enemy_keep" });
              break;
            }
            move(ux * cfg.speed * radial, uy * cfg.speed * radial);
            break;
          case "KEEP": {
            if (d > cfg.keep_max + 60) {
              m.phase = "APPROACH";
              break;
            }
            const tx = -uy * m.strafe, ty = ux * m.strafe;
            move(ux * cfg.speed * radial + tx * cfg.strafe, uy * cfg.speed * radial + ty * cfg.strafe);
            if (++m.t >= cfg.keep_ticks) {
              m.phase = "CHARGE";
              m.t = 0;
              emit({ type: "enemy_charge" });
            }
            break;
          }
          case "CHARGE":
            if (++m.t >= cfg.charge_ticks) {
              m.phase = "FIRE";
              m.t = 0;
              m.shots = cfg.burst;
            }
            break;
          case "FIRE":
            if (m.t-- <= 0) {
              const lead = d / cfg.bullet_speed;
              const ax = p.x + p.vx * lead - e.x, ay = p.y + p.vy * lead - e.y;
              fire2(s, "enemy", e.x + ux * 20, e.y + uy * 20, ax, ay, cfg.bullet_speed, emit);
              m.t = cfg.burst_gap - 1;
              if (--m.shots <= 0) {
                m.phase = "RECOVER";
                m.t = 0;
                emit({ type: "enemy_recover" });
              }
            }
            break;
          case "RECOVER":
            move(-ux * cfg.recover_speed, -uy * cfg.recover_speed);
            if (++m.t >= cfg.recover_ticks) {
              m.phase = "APPROACH";
              m.t = 0;
              m.strafe *= -1;
              m.cycle++;
            }
            break;
        }
      }
    };
  }

  // src/arena/levels_e3.ts
  var border = (w = 960, h = 540, t = 24) => [
    { id: "wall_t", x: 0, y: 0, w, h: t },
    { id: "wall_b", x: 0, y: h - t, w, h: t },
    { id: "wall_l", x: 0, y: 0, w: t, h },
    { id: "wall_r", x: w - t, y: 0, w: t, h }
  ];
  var E3A_LEVEL = {
    id: "e3a",
    start: [180, 270],
    walls: [
      ...border(),
      { id: "pillar_t", x: 440, y: 110, w: 80, h: 50 },
      { id: "pillar_m", x: 460, y: 245, w: 40, h: 50 },
      { id: "pillar_b", x: 440, y: 380, w: 80, h: 50 }
    ]
  };
  var E3_ENEMY = {
    start: [780, 270],
    hp: 6,
    speed: 1.6,
    keep_min: 150,
    keep_max: 250,
    strafe: 1.2,
    keep_ticks: 50,
    charge_ticks: 36,
    burst: 3,
    burst_gap: 8,
    bullet_speed: 5.5,
    recover_ticks: 50,
    recover_speed: 0.8
  };

  // src/arena/render_pixel.ts
  var PX = 3;
  function blob(ctx, x, y, body, rim, facing, size) {
    const r = Math.round(size / 2 / PX);
    for (let j = -r; j < r; j++) for (let i = -r; i < r; i++) {
      const d = Math.hypot(i + 0.5, j + 0.5);
      if (d > r) continue;
      rect(ctx, Math.round(x) + i * PX, Math.round(y) + j * PX, PX, PX, d > r - 1.2 ? rim : body);
    }
    const n = Math.hypot(facing[0], facing[1]) || 1;
    for (let k = 2; k < 8; k++) rect(ctx, Math.round(x + facing[0] / n * k * PX) - 2, Math.round(y + facing[1] / n * k * PX) - 2, 5, 5, "#22222a");
  }
  function makeArenaPixel(extras = {}) {
    return (ctx, s, level) => {
      ctx.imageSmoothingEnabled = false;
      for (let y = 0; y < 540; y += 30) for (let x = 0; x < 960; x += 30) {
        rect(ctx, x, y, 30, 30, tileHash(x, y) > 0.5 ? "#3b3f4a" : "#363a44");
        rect(ctx, x, y, 30, 3, "#30333c");
        if (tileHash(y, x) > 0.85) rect(ctx, x + 12, y + 12, 6, 3, "#454a56");
      }
      for (const w of level.walls) {
        rect(ctx, w.x, w.y, w.w, w.h, "#6b4a3a");
        for (let y = w.y; y < w.y + w.h; y += 12) for (let x = w.x + (y / 12 % 2 ? 0 : 12); x < w.x + w.w; x += 24) rect(ctx, x, y, 2, 12, "#4a3328");
        for (let y = w.y; y < w.y + w.h; y += 12) rect(ctx, w.x, y, w.w, 2, "#4a3328");
      }
      extras.under?.(ctx, s);
      const p = s.player, e = s.enemy;
      if (p.alive) blob(ctx, p.x, p.y, p.hurt % 4 >= 2 ? "#ffffff" : "#3a6fd8", "#1e3a8a", p.facing, ARENA.player.size);
      if (e) {
        const charging = s.comp.enemy?.phase === "CHARGE" && s.tick % 6 < 3;
        if (e.alive) blob(ctx, e.x, e.y, e.hurt % 4 >= 2 ? "#ffffff" : "#c8382e", charging ? "#ffd23e" : "#7a1010", e.facing, ARENA.enemy_size);
        else rect(ctx, e.x - 12, e.y - 3, 24, 6, "#5a3030");
      }
      for (const b of s.bullets) {
        const c = b.owner === "player" ? "#9fd0ff" : b.owner === "enemy" ? "#ffb070" : "#e8f8ff";
        rect(ctx, Math.round(b.x) - 4, Math.round(b.y) - 4, 8, 8, "#111");
        rect(ctx, Math.round(b.x) - 3, Math.round(b.y) - 3, 6, 6, c);
      }
      const hp = (label, v, max, x) => {
        pixelText(ctx, label, x, 12, { size: 10, color: "#f0f0f0" });
        for (let i = 0; i < max; i++) rect(ctx, x + 44 + i * 12, 7, 9, 9, i < v ? "#e83a3a" : "#5a3030");
      };
      hp("\u73A9\u5BB6", p.hp, ARENA.player.hp, 30);
      if (e) hp("\u654C\u4EBA", e.hp, s.comp.enemy && 6 || 6, 760);
    };
  }
  var renderArenaPixel = makeArenaPixel();

  // src/games/e3a.ts
  var createE3A = () => createArenaGame("e3a_enemy", E3A_LEVEL, [createEnemy(E3_ENEMY)], renderArenaPixel);

  // src/arena/components/boxes.ts
  var rectOf = (b) => ({ x: b.x - b.size / 2, y: b.y - b.size / 2, w: b.size, h: b.size });
  function createBoxes(cfg) {
    return {
      id: "boxes",
      config: cfg,
      init(s) {
        s.comp.boxes = { list: cfg.boxes.map((b) => ({ ...b })), push: { box: null, axis: null, t: 0 } };
      },
      solids(s) {
        return s.comp.boxes.list.map(rectOf);
      },
      prePlayer(s, { frame, emit, solids: solids2 }) {
        const st = s.comp.boxes, p = s.player;
        if (!p.alive) {
          st.push = { box: null, axis: null, t: 0 };
          return;
        }
        const [dx, dy] = inputDir(frame);
        const pr = bodyBox(p, ARENA.player.size);
        let found = null;
        for (const [ax, dir] of [["x", dx], ["y", dy]]) {
          if (!dir || found) continue;
          const probe = { ...pr, x: pr.x + (ax === "x" ? dir : 0), y: pr.y + (ax === "y" ? dir : 0) };
          const box = st.list.find((b2) => {
            const r = rectOf(b2);
            if (!overlap(probe, r)) return false;
            const side = ax === "x" ? Math.min(pr.y + pr.h, r.y + r.h) - Math.max(pr.y, r.y) : Math.min(pr.x + pr.w, r.x + r.w) - Math.max(pr.x, r.x);
            return side >= 8;
          });
          if (box) found = { box, ax, dir };
        }
        if (!found) {
          st.push = { box: null, axis: null, t: 0 };
          return;
        }
        const key = `${found.ax}${found.dir}`;
        if (st.push.box !== found.box.id || st.push.axis !== key) st.push = { box: found.box.id, axis: key, t: 0 };
        if (++st.push.t <= cfg.push_delay) return;
        const b = found.box, mx = found.ax === "x" ? found.dir * cfg.push_speed : 0, my = found.ax === "y" ? found.dir * cfg.push_speed : 0;
        const next = rectOf({ x: b.x + mx, y: b.y + my, size: b.size });
        const own = rectOf(b);
        const blockers = [
          ...solids2().filter((r) => !(r.x === own.x && r.y === own.y && r.w === own.w)),
          ...s.enemy?.alive ? [bodyBox(s.enemy, ARENA.enemy_size)] : []
        ];
        if (blockers.some((r) => overlap(next, r))) return;
        if (st.push.t === cfg.push_delay + 1) emit({ type: "box_push", box: b.id, axis: key });
        b.x += mx;
        b.y += my;
      },
      bullet(s, bl, { emit }) {
        const bb = centerBox(bl.x, bl.y, ARENA.bullet_size, ARENA.bullet_size);
        const box = s.comp.boxes.list.find((b) => overlap(bb, rectOf(b)));
        if (!box) return "keep";
        const done = bl.reflections ?? 0;
        if (box.kind === "crate" || done >= cfg.max_reflections) {
          emit({ type: "bullet_blocked", bullet: bl.id, box: box.id });
          return "remove";
        }
        const [vx, vy] = box.diag === "/" ? [-bl.vy, -bl.vx] : [bl.vy, bl.vx];
        bl.vx = vx * cfg.reflect_scale;
        bl.vy = vy * cfg.reflect_scale;
        const n = Math.hypot(bl.vx, bl.vy) || 1;
        bl.x = box.x + bl.vx / n * (box.size / 2 + ARENA.bullet_size);
        bl.y = box.y + bl.vy / n * (box.size / 2 + ARENA.bullet_size);
        bl.reflections = done + 1;
        bl.owner = "reflected";
        emit({ type: "bullet_reflect", bullet: bl.id, box: box.id, vx: bl.vx, vy: bl.vy });
        return "keep";
      }
    };
  }

  // src/arena/components/targets.ts
  function createTargets(cfg) {
    const box = (d) => centerBox(d.x, d.y, cfg.size, cfg.size);
    return {
      id: "targets",
      config: cfg,
      init(s) {
        s.comp.targets = { list: cfg.list.map((d) => ({ ...d, hits: 0 })) };
      },
      solids: (s) => s.comp.targets.list.map(box),
      bullet(s, b, { emit }) {
        const d = s.comp.targets.list.find((t) => overlap(centerBox(b.x, b.y, ARENA.bullet_size, ARENA.bullet_size), box(t)));
        if (!d) return "keep";
        d.hits++;
        emit({ type: "hit", target: d.id, bullet: b.id, by: b.owner });
        return "remove";
      }
    };
  }

  // src/arena/levels_e3_b.ts
  var E3B_LEVEL = {
    id: "e3b",
    start: [120, 270],
    walls: border()
  };
  var E3B_TARGETS = { size: 26, list: [{ id: "dummy_a", x: 600, y: 80 }, { id: "dummy_b", x: 840, y: 420 }] };
  var E3B_BOXES = {
    boxes: [
      { id: "crate_1", x: 300, y: 200, size: 40, kind: "crate" },
      { id: "crate_2", x: 300, y: 340, size: 40, kind: "crate" },
      { id: "crate_3", x: 520, y: 150, size: 40, kind: "crate" },
      { id: "mirror_1", x: 600, y: 270, size: 40, kind: "mirror", diag: "/" },
      { id: "mirror_2", x: 450, y: 420, size: 40, kind: "mirror", diag: "\\" }
    ],
    push_delay: 8,
    push_speed: 1.5,
    reflect_scale: 1.25,
    max_reflections: 2
  };

  // src/arena/render_real.ts
  function floor(ctx) {
    const g = ctx.createRadialGradient(480, 270, 60, 480, 270, 620);
    g.addColorStop(0, "#9b978f");
    g.addColorStop(1, "#6f6b64");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 960, 540);
    for (let i = 0; i < 900; i++) {
      const x = tileHash(i, 1) * 960, y = tileHash(i, 2) * 540;
      ctx.fillStyle = `rgba(${tileHash(i, 3) > 0.5 ? "255,255,255" : "0,0,0"},0.06)`;
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.strokeStyle = "rgba(40,38,34,0.25)";
    ctx.lineWidth = 1;
    for (let x = 120; x < 960; x += 240) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 540);
      ctx.stroke();
    }
    for (let y = 135; y < 540; y += 270) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(960, y);
      ctx.stroke();
    }
  }
  function shadowed(ctx, draw, blur = 10, dy = 5) {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = blur;
    ctx.shadowOffsetY = dy;
    ctx.shadowOffsetX = 3;
    draw();
    ctx.restore();
  }
  function crate(ctx, b) {
    const x = b.x - b.size / 2, y = b.y - b.size / 2, n = b.size;
    shadowed(ctx, () => {
      const g = ctx.createLinearGradient(x, y, x + n, y + n);
      g.addColorStop(0, "#c8955a");
      g.addColorStop(1, "#8a5a2c");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(x, y, n, n, 3);
      ctx.fill();
    });
    ctx.strokeStyle = "rgba(70,40,15,0.6)";
    ctx.lineWidth = 1;
    for (let k = 1; k < 4; k++) {
      ctx.beginPath();
      ctx.moveTo(x + 3, y + n * k / 4);
      ctx.lineTo(x + n - 3, y + n * k / 4);
      ctx.stroke();
    }
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#6e4420";
    ctx.strokeRect(x + 2, y + 2, n - 4, n - 4);
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 4);
    ctx.lineTo(x + n - 4, y + n - 4);
    ctx.stroke();
  }
  function mirror(ctx, b) {
    const x = b.x - b.size / 2, y = b.y - b.size / 2, n = b.size;
    shadowed(ctx, () => {
      const g = ctx.createLinearGradient(x, y, x + n, y);
      g.addColorStop(0, "#7d8794");
      g.addColorStop(0.5, "#d8dee6");
      g.addColorStop(1, "#6c7480");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(x, y, n, n, 4);
      ctx.fill();
    });
    const glass = ctx.createLinearGradient(x, y, x + n, y + n);
    glass.addColorStop(0, "rgba(160,220,255,0.9)");
    glass.addColorStop(1, "rgba(60,110,160,0.9)");
    ctx.fillStyle = glass;
    ctx.fillRect(x + 5, y + 5, n - 10, n - 10);
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (b.diag === "/") {
      ctx.moveTo(x + 6, y + n - 6);
      ctx.lineTo(x + n - 6, y + 6);
    } else {
      ctx.moveTo(x + 6, y + 6);
      ctx.lineTo(x + n - 6, y + n - 6);
    }
    ctx.stroke();
  }
  function soldier(ctx, x, y, facing, hurt) {
    const a = Math.atan2(facing[1], facing[0]);
    shadowed(ctx, () => {
      ctx.fillStyle = "#3e4a36";
      ctx.beginPath();
      ctx.ellipse(x, y, 14, 11, a + Math.PI / 2, 0, Math.PI * 2);
      ctx.fill();
    }, 8, 4);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.fillStyle = "#1e1f22";
    ctx.fillRect(4, -2.5, 20, 5);
    const h = ctx.createRadialGradient(-2, -3, 1, 0, 0, 10);
    h.addColorStop(0, hurt ? "#ffffff" : "#7f8f6a");
    h.addColorStop(1, hurt ? "#dddddd" : "#45523a");
    ctx.fillStyle = h;
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  function renderArenaReal(ctx, s, level) {
    ctx.imageSmoothingEnabled = true;
    floor(ctx);
    for (const w of level.walls) {
      shadowed(ctx, () => {
        ctx.fillStyle = "#4b4843";
        ctx.fillRect(w.x, w.y, w.w, w.h);
      }, 14, 6);
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(w.x, w.y, w.w, 3);
    }
    for (const b of s.comp.boxes?.list ?? []) (b.kind === "crate" ? crate : mirror)(ctx, b);
    for (const d of s.comp.targets?.list ?? []) {
      shadowed(ctx, () => {
        ctx.fillStyle = "#f2efe6";
        ctx.beginPath();
        ctx.arc(d.x, d.y, 13, 0, Math.PI * 2);
        ctx.fill();
      });
      for (const [r, c] of [[10, "#c8302a"], [6.5, "#f2efe6"], [3, "#c8302a"]]) {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.font = '600 13px "Noto Sans SC", system-ui, sans-serif';
      ctx.fillStyle = "#20201c";
      ctx.fillText(`\xD7 ${d.hits}`, d.x + 16, d.y + 5);
    }
    const p = s.player;
    if (p.alive) soldier(ctx, p.x, p.y, p.facing, p.hurt % 4 >= 2);
    for (const b of s.bullets) {
      const n = Math.hypot(b.vx, b.vy) || 1;
      const g = ctx.createLinearGradient(b.x - b.vx / n * 22, b.y - b.vy / n * 22, b.x, b.y);
      g.addColorStop(0, "rgba(255,220,140,0)");
      g.addColorStop(1, b.owner === "reflected" ? "rgba(190,240,255,1)" : "rgba(255,230,160,1)");
      ctx.strokeStyle = g;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(b.x - b.vx / n * 22, b.y - b.vy / n * 22);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.font = '600 15px "Noto Sans SC", system-ui, sans-serif';
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText(`\u9776\u5B50\u547D\u4E2D ${(s.comp.targets?.list ?? []).map((d) => d.hits).join(" / ")}`, 34, 50);
  }

  // src/games/e3b.ts
  var createE3B = () => createArenaGame("e3b_boxes", E3B_LEVEL, [createBoxes(E3B_BOXES), createTargets(E3B_TARGETS)], renderArenaReal);

  // src/arena/levels_e3_c.ts
  var E3C_BOXES = {
    ...E3B_BOXES,
    boxes: [
      { id: "crate_1", x: 330, y: 200, size: 40, kind: "crate" },
      { id: "crate_2", x: 330, y: 350, size: 40, kind: "crate" },
      { id: "crate_3", x: 640, y: 110, size: 40, kind: "crate" },
      { id: "mirror_1", x: 600, y: 270, size: 40, kind: "mirror", diag: "/" },
      { id: "mirror_2", x: 480, y: 450, size: 40, kind: "mirror", diag: "\\" }
    ]
  };

  // src/arena/render_pixel_c.ts
  var renderArenaPixelC = makeArenaPixel({
    under(ctx, s) {
      for (const b of s.comp.boxes?.list ?? []) {
        const x = Math.round(b.x - b.size / 2), y = Math.round(b.y - b.size / 2), n = b.size;
        if (b.kind === "crate") {
          rect(ctx, x, y, n, n, "#5e3e1e");
          rect(ctx, x + 3, y + 3, n - 6, n - 6, "#9a6a3a");
          for (let k = 0; k < n - 6; k += 3) {
            rect(ctx, x + 3 + k, y + 3 + k, 3, 3, "#7a522c");
            rect(ctx, x + n - 6 - k, y + 3 + k, 3, 3, "#7a522c");
          }
        } else {
          rect(ctx, x, y, n, n, "#8a93a6");
          rect(ctx, x + 3, y + 3, n - 6, n - 6, "#25303f");
          for (let k = 0; k < n - 6; k += 3) rect(ctx, b.diag === "/" ? x + 3 + k : x + 3 + k, b.diag === "/" ? y + n - 6 - k : y + 3 + k, 3, 3, "#7fe0ff");
        }
      }
    }
  });

  // src/games/e3c.ts
  var createE3C = () => createArenaGame("e3c_combined", E3A_LEVEL, [createEnemy(E3_ENEMY), createBoxes(E3C_BOXES)], renderArenaPixelC);

  // src/web/registry.ts
  var GAMES = {
    g1: createG1,
    g2: createG2,
    g3: createG3,
    p1: createP1,
    p2: createP2,
    p3: createP3,
    v2p0: createV2P0,
    v2p1: createV2P1,
    v2p2: createV2P2,
    v2p3: createV2P3,
    e1a: createE1A,
    e1b: createE1B,
    e1c: createE1C,
    e2a: createE2A,
    e2b: createE2B,
    e2c: createE2C,
    e3a: createE3A,
    e3b: createE3B,
    e3c: createE3C
  };
  var FONT_TEXT = JSON.stringify(reference_dialogue_default) + "\u73A9\u5BB6\u5BF9\u624B\u5012\u4E0B\u4F60\u4E86\u6309\u91CD\u7F6E\u4EA4\u8C08E\u7EC8\u70B9\u2605\u9AD8\u5904\u5230\u8FBE\u654C\u4EBA\u9776\u5B50\u547D\u4E2D";

  // src/web/main.ts
  var GAMES2 = { ...GAMES, ...window.EXTRA_GAMES ?? {} };
  var ActionLog = class {
    runs = [];
    push(f) {
      const last = this.runs.at(-1);
      if (last && !f.pressed.length && !f.released.length && !last[2].length && !last[3].length && last[1].join() === f.held.join()) {
        last[0]++;
        return;
      }
      this.runs.push([1, [...f.held], [...f.pressed], [...f.released]]);
    }
    get ticks() {
      return this.runs.reduce((n, r) => n + r[0], 0);
    }
  };
  var $ = (id) => document.getElementById(id);
  function boot() {
    const canvas = $("screen");
    canvas.width = VIEW_W;
    canvas.height = VIEW_H;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    const stage = $("stage");
    const readout = $("readout");
    const tickEl = $("tick");
    const sampler = new InputSampler();
    let gameId = "g1";
    let game = GAMES2[gameId]();
    let log = new ActionLog();
    let focused = false;
    let acc = 0, lastTs = 0, frameNo = 0;
    const TICK_MS = 1e3 / TICK_HZ;
    function select(id) {
      gameId = id;
      game = GAMES2[id]();
      log = new ActionLog();
      acc = 0;
      document.querySelectorAll("[data-game]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.game === id)));
      document.querySelectorAll("[data-help]").forEach((el) => {
        el.hidden = !el.dataset.help.split(" ").includes(id);
      });
      try {
        localStorage.setItem("sd-tab", id);
      } catch {
      }
      canvas.focus();
    }
    window.addEventListener("keydown", (e) => {
      if (!focused) return;
      if (sampler.keyDown(e.code, e.repeat)) e.preventDefault();
    });
    window.addEventListener("keyup", (e) => {
      if (sampler.keyUp(e.code)) e.preventDefault();
    });
    canvas.addEventListener("focus", () => {
      focused = true;
      stage.dataset.focused = "true";
    });
    canvas.addEventListener("blur", () => {
      focused = false;
      stage.dataset.focused = "false";
      sampler.clear();
    });
    stage.addEventListener("pointerdown", () => canvas.focus());
    document.querySelectorAll("[data-game]").forEach((b) => {
      if (!GAMES2[b.dataset.game]) b.disabled = true;
      b.addEventListener("click", () => select(b.dataset.game));
    });
    $("restart").addEventListener("click", () => select(gameId));
    $("copy").addEventListener("click", async () => {
      const text = JSON.stringify({ game: game.id, build: "93fff2e892b1", ticks: log.ticks, runs: log.runs });
      const status = $("copy-status");
      try {
        await navigator.clipboard.writeText(text);
        status.textContent = `\u5DF2\u590D\u5236 ${log.ticks} tick`;
      } catch {
        const ta = $("copy-fallback");
        ta.hidden = false;
        ta.value = text;
        ta.select();
        status.textContent = "\u526A\u8D34\u677F\u4E0D\u53EF\u7528\uFF0C\u5DF2\u5728\u4E0B\u65B9\u9009\u4E2D\u6587\u672C";
      }
    });
    function summary(s) {
      const lines = [];
      if (s.platforms) {
        const p = s.player, f = (v) => v.toFixed(1);
        lines.push(`\u73A9\u5BB6  (${f(p.x)}, ${f(p.y)})  v (${f(p.vx)}, ${f(p.vy)})  \u7AD9\u5728 ${p.on ?? "\u7A7A\u4E2D"}${p.locked ? "  locked" : ""}`);
        for (const q of s.platforms) lines.push(`\u5E73\u53F0 ${q.id}  (${f(q.x)}, ${f(q.y)})  v (${f(q.vx)}, ${f(q.vy)})  \u8868\u9762\u504F\u79FB ${f(q.surface)}`);
        for (const [id, c] of Object.entries(s.comp ?? {})) lines.push(`\u7EC4\u4EF6 ${id}  ${JSON.stringify(c)}`);
        lines.push(`tick ${s.tick}  \u5230\u8FBE ${s.reached.join(", ") || "\u2014"}`);
        return lines.join("\n");
      }
      if ("next_bullet" in s) {
        const f = (v) => v.toFixed(1), p = s.player;
        lines.push(`\u73A9\u5BB6  (${f(p.x)}, ${f(p.y)})  v (${f(p.vx)}, ${f(p.vy)})  hp ${p.hp}`);
        if (s.enemy) lines.push(`\u654C\u4EBA  (${f(s.enemy.x)}, ${f(s.enemy.y)})  hp ${s.enemy.hp}`);
        for (const [id, c] of Object.entries(s.comp ?? {})) lines.push(`\u7EC4\u4EF6 ${id}  ${JSON.stringify(c, (k, v) => typeof v === "number" ? Math.round(v * 10) / 10 : v)}`);
        lines.push(`\u5B50\u5F39 ${s.bullets.length}   tick ${s.tick}`);
        return lines.join("\n");
      }
      if (s.player && "hp" in s.player) {
        const f = (x) => `(${x.x.toFixed(0)}, ${x.y.toFixed(0)}) hp ${x.hp}${x.alive ? "" : " \u2715"}`;
        lines.push(
          `\u73A9\u5BB6  ${f(s.player)}  \u51B7\u5374 ${s.player.cooldown}`,
          `\u5BF9\u624B  ${f(s.enemy)}  \u5F00\u706B\u5012\u8BA1\u65F6 ${s.enemy.cooldown}`,
          `\u5B50\u5F39  ${s.bullets.length}   gameplay_tick ${s.gameplay_tick}`
        );
      } else if (s.player) {
        lines.push(`\u73A9\u5BB6  (${s.player.x.toFixed(0)}, ${s.player.y.toFixed(0)})   gameplay_tick ${s.gameplay_tick}`);
      }
      for (const [k, v] of Object.entries(s)) {
        if (["player", "enemy", "bullets", "gameplay_tick", "next_bullet_id"].includes(k) || v?.x !== void 0) continue;
        if (v && typeof v === "object") {
          const parts = Object.entries(v).map(([kk, vv]) => `${kk}=${JSON.stringify(vv)}`);
          lines.push(`${k}  ${parts.join("  ")}`);
        } else lines.push(`${k}  ${JSON.stringify(v)}`);
      }
      return lines.join("\n");
    }
    function loop(ts) {
      const dt = lastTs ? Math.min(ts - lastTs, 250) : 0;
      lastTs = ts;
      if (focused) {
        acc += dt;
        while (acc >= TICK_MS) {
          const f = sampler.sample();
          game.step(f);
          log.push(f);
          acc -= TICK_MS;
        }
      }
      game.render(ctx);
      if (++frameNo % 6 === 0) {
        readout.textContent = summary(game.snapshot());
        tickEl.textContent = String(log.ticks);
      }
      requestAnimationFrame(loop);
    }
    const onPage = Array.from(document.querySelectorAll("[data-game]")).map((b) => b.dataset.game).filter((id) => GAMES2[id]);
    let start = onPage[0] ?? "g1";
    try {
      const t = localStorage.getItem("sd-tab");
      if (t && onPage.includes(t)) start = t;
    } catch {
    }
    select(start);
    canvas.blur();
    requestAnimationFrame(loop);
  }
  Promise.race([
    document.fonts.load(`500 16px ${FONT_FAMILY}`, FONT_TEXT),
    new Promise((r) => setTimeout(r, 3e3))
  ]).finally(boot);
})();
