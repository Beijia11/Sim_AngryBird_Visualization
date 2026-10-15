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
    "reset"
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
    KeyR: "reset"
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

  // src/web/registry.ts
  var GAMES = { g1: createG1, g2: createG2, g3: createG3 };
  var FONT_TEXT = JSON.stringify(reference_dialogue_default) + "\u73A9\u5BB6\u5BF9\u624B\u5012\u4E0B\u4F60\u4E86\u6309\u91CD\u7F6E\u4EA4\u8C08E";

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
      const text = JSON.stringify({ game: game.id, build: "a2c6e805c15b", ticks: log.ticks, runs: log.runs });
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
    let start = "g1";
    try {
      const t = localStorage.getItem("sd-tab");
      if (t && GAMES2[t]) start = t;
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
