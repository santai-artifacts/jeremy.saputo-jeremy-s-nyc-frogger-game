/* =============================================================================
 * GOTHAM HOP — GAME ENGINE  (engine.js)
 * -----------------------------------------------------------------------------
 * Part of the GOVERNED CORE. Implements the universal rules: movement, hazard
 * motion, collision, drowning, scoring, lives, and the win condition. It is
 * data-driven — it knows nothing about any specific street, only the validated
 * shape defined in schema.js. Swap in any street and the same rules apply.
 * ===========================================================================*/

window.GOTHAM = window.GOTHAM || {};

GOTHAM.Game = class Game {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.R = GOTHAM.RULES;
    this.onState = opts.onState || (() => {});     // HUD callback
    this.onMessage = opts.onMessage || (() => {}); // banner callback

    this.streets = [];      // ordered playlist of validated streets
    this.streetIndex = 0;
    this.lanes = [];        // active lanes with live entities
    this.running = false;
    this.paused = false;
    this.locked = false;    // true during street/level transitions
    this.lastT = 0;
    this.popups = [];       // floating score texts {x, y, text, t, life}
    this.flashT = 0;        // red damage-flash timer
    this.grace = 0;         // post-respawn invulnerability timer

    this.setDifficulty(GOTHAM.DEFAULT_DIFFICULTY);
    this._bindInput();
  }

  // ---- Lifecycle ----------------------------------------------------------
  load(streets) {
    this.streets = streets.length ? streets : [GOTHAM.FALLBACK_STREET];
    this.streetIndex = 0;
    return this;
  }

  // The single global difficulty knob. Safe to call between runs.
  setDifficulty(key) {
    this.diffKey = GOTHAM.DIFFICULTY[key] ? key : GOTHAM.DEFAULT_DIFFICULTY;
    this.diff = GOTHAM.DIFFICULTY[this.diffKey];
    this.maxTime = this.diff.time;
    return this;
  }

  start() {
    this.score = 0;
    this.lives = this.diff.lives;
    this.streetIndex = 0;
    this.paused = false;
    this.popups = [];
    this.flashT = 0;
    this._loadStreet(0);
    this.running = true;
    this.lastT = performance.now();
    this._emit();
    requestAnimationFrame((t) => this._loop(t));
  }

  togglePause() {
    if (!this.running) return false;
    this.paused = !this.paused;
    if (this.paused) this.onMessage('Paused', 'Press Resume or P to continue.');
    else this.onMessage('', '');
    return this.paused;
  }

  // Build live lane state for a street, applying the difficulty ramp.
  _loadStreet(index) {
    this.streetIndex = index;
    const street = this.streets[index];
    this.street = street;
    this.avatar = street.avatar || this.R.DEFAULT_AVATAR;

    // Gentle per-street ramp (set by the chosen difficulty) times the global
    // difficulty speed scale. This is what makes "Easy" genuinely easier on
    // every street without re-authoring any of them.
    const ramp = Math.min(
      this.R.MAX_SPEED_MULTIPLIER,
      1 + index * this.diff.ramp
    );
    this.speedMult = ramp * this.diff.speed;

    this.lanes = street.rows.map((row) => this._buildLane(row, this.speedMult));
    this.filledSlots = new Set();
    this.maxRowReached = street.rows.length - 1;
    this._resetHopper();
    this.onMessage(`${street.name}`, street.description || '');
  }

  // Evenly place entities across a lane so wrapping is seamless.
  _buildLane(row, mult) {
    const lane = { type: row.type, entities: [] };
    if (row.type === 'goal') lane.slots = row.slots.slice();
    if (row.type === 'road' || row.type === 'water') {
      const sprite = GOTHAM.CATALOG[row.sprite];
      lane.sprite = row.sprite;
      lane.dir = row.dir;
      lane.speed = row.speed * mult;
      lane.len = sprite.len;
      lane.glyph = sprite.glyph;
      lane.color = sprite.color;
      // period = tiles between the start of one entity and the next.
      // The wrap span is an exact multiple of period so spacing stays perfectly
      // even across the seam; a buffer of `len` keeps entities scrolling in
      // off-screen instead of popping into view.
      const period = sprite.len + row.gap;
      const count = Math.max(1, Math.ceil((this.R.COLS + sprite.len) / period));
      const span = count * period;
      for (let i = 0; i < count; i++) {
        lane.entities.push({ x: i * period }); // x = left edge in tiles, in [0, span)
      }
      lane._span = span;
    }
    return lane;
  }

  _resetHopper() {
    this.hopper = {
      col: Math.floor(this.R.COLS / 2),
      row: this.street.rows.length - 1,
      // sub-tile pixel offset used while riding platforms
      px: 0,
      hopT: 0, fromCol: 0, fromRow: 0,
    };
    this.timeLeft = this.maxTime;
    this.maxRowReached = this.street.rows.length - 1;
    this.grace = this.R.RESPAWN_GRACE; // brief invulnerability so you can orient
    this.locked = false;
  }

  // ---- Input --------------------------------------------------------------
  _bindInput() {
    const keymap = {
      ArrowUp: [0, -1], KeyW: [0, -1],
      ArrowDown: [0, 1], KeyS: [0, 1],
      ArrowLeft: [-1, 0], KeyA: [-1, 0],
      ArrowRight: [1, 0], KeyD: [1, 0],
    };
    window.addEventListener('keydown', (e) => {
      const m = keymap[e.code];
      if (m) { e.preventDefault(); this.move(m[0], m[1]); }
    });

    // Touch / swipe
    let sx = 0, sy = 0;
    this.canvas.addEventListener('touchstart', (e) => {
      sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    }, { passive: true });
    this.canvas.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
      if (Math.abs(dx) > Math.abs(dy)) this.move(Math.sign(dx), 0);
      else this.move(0, Math.sign(dy));
    }, { passive: true });
  }

  move(dx, dy) {
    if (!this.running || this.hopper.hopT > 0) return;
    const h = this.hopper;
    const nc = Math.max(0, Math.min(this.R.COLS - 1, h.col + dx));
    const nr = Math.max(0, Math.min(this.street.rows.length - 1, h.row + dy));
    if (nc === h.col && nr === h.row) return;
    h.fromCol = h.col; h.fromRow = h.row;
    h.col = nc; h.row = nr; h.px = 0;
    h.hopT = this.R.HOP_MS;

    // Reward forward progress (toward row 0).
    if (nr < this.maxRowReached) {
      this.maxRowReached = nr;
      this.score += this.R.SCORE_FORWARD;
      this._emit();
    }
  }

  // ---- Main loop ----------------------------------------------------------
  _loop(t) {
    if (!this.running) return;
    const dt = Math.min(0.05, (t - this.lastT) / 1000);
    this.lastT = t;
    if (this.paused) {
      this._render();
      requestAnimationFrame((nt) => this._loop(nt));
      return;
    }
    this._update(dt);
    this._render();
    requestAnimationFrame((nt) => this._loop(nt));
  }

  _update(dt) {
    // Timers & juice that animate regardless of game state.
    if (this.flashT > 0) this.flashT = Math.max(0, this.flashT - dt);
    if (this.grace > 0) this.grace = Math.max(0, this.grace - dt);
    for (const p of this.popups) { p.t += dt; p.y -= dt * 26; }
    this.popups = this.popups.filter((p) => p.t < p.life);

    // Advance hazards.
    for (const lane of this.lanes) {
      if (!lane.dir) continue;
      for (const e of lane.entities) {
        e.x += lane.dir * lane.speed * dt;
        // wrap within [0, span); entities with x >= COLS sit off the right
        // edge waiting to scroll in, keeping the visible window evenly filled.
        if (e.x >= lane._span) e.x -= lane._span;
        if (e.x < 0) e.x += lane._span;
      }
    }

    const h = this.hopper;
    if (h.hopT > 0) { h.hopT = Math.max(0, h.hopT - dt * 1000); return; }
    if (this.locked) return; // frozen during a street transition

    const row = this.lanes[h.row];

    // WATER: must be riding a platform; ride along with it.
    if (row.type === 'water') {
      const carrier = this._entityUnder(row, h.col + h.px);
      if (!carrier) return this._die('Splash! Into the Hudson.');
      h.px += row.dir * row.speed * dt;
      // Snap visual column when we drift a full tile.
      while (h.px >= 0.5) { h.px -= 1; h.col += 1; }
      while (h.px <= -0.5) { h.px += 1; h.col -= 1; }
      if (h.col < 0 || h.col > this.R.COLS - 1) return this._die('Carried off the river!');
    } else {
      h.px = 0;
    }

    // ROAD: any vehicle overlapping our tile is fatal (unless just respawned).
    if (row.type === 'road' && this.grace <= 0 && this._entityUnder(row, h.col)) {
      return this._die('Flattened in traffic!');
    }

    // GOAL: landed on the top row.
    if (row.type === 'goal') this._tryScoreGoal(row);

    // Clock.
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) return this._die("Don't walk! Out of time.");
    this._emit();
  }

  // Is there an entity covering this fractional column? Returns it or null.
  _entityUnder(lane, col) {
    for (const e of lane.entities) {
      if (col + 1 > e.x && col < e.x + lane.len) return e;
    }
    return null;
  }

  _tryScoreGoal(row) {
    const open = row.slots.filter((c) => !this.filledSlots.has(c));

    // Nearest slot (open ones preferred) to where we landed.
    let best = -1, bestDist = 1e9;
    for (const c of (this.diff.snapGoal ? open : row.slots)) {
      const d = Math.abs(c - this.hopper.col);
      if (d < bestDist) { bestDist = d; best = c; }
    }

    if (this.diff.snapGoal) {
      // Forgiving: reaching the goal row always banks the nearest open stoop,
      // and the hopper visually slides onto it. No wall deaths.
      if (best < 0) { this._resetHopper(); return; }
      this.hopper.col = best;
    } else if (best < 0 || bestDist > 0.6 || this.filledSlots.has(best)) {
      // Precise (Hard): landing in the goal wall is fatal, classic-Frogger style.
      return this._die('No stoop there!');
    }

    const gained = this.R.SCORE_GOAL + Math.floor(this.timeLeft) * this.R.SCORE_TIME_BONUS;
    this.filledSlots.add(best);
    this.score += gained;
    this._popup(`+${gained}`, best, 0);

    if (this.filledSlots.size >= row.slots.length) {
      this.score += this.R.SCORE_STREET_CLEAR;
      this.locked = true; // freeze gameplay through the transition
      this._nextStreet();
    } else {
      this._resetHopper();
    }
    this._emit();
  }

  _nextStreet() {
    if (this.streetIndex + 1 < this.streets.length) {
      this.onMessage('Street cleared!', 'Onward to the next block…');
      setTimeout(() => this._loadStreet(this.streetIndex + 1), 900);
    } else {
      this.running = false;
      this.onMessage('YOU WON THE CITY 🗽', `Final score: ${this.score}`);
    }
  }

  _die(reason) {
    this.lives -= 1;
    this.flashT = 0.4;
    this._emit();
    if (this.lives <= 0) {
      this.running = false;
      this.onMessage('GAME OVER', `${reason}  Final score: ${this.score}`);
    } else {
      this.onMessage('Ouch!', `${reason}  ${this.lives} ${this.lives === 1 ? 'life' : 'lives'} left.`);
      this._resetHopper();
    }
  }

  _popup(text, col, rowIdx) {
    this.popups.push({
      x: col + 0.5, y: rowIdx + 0.5, text, t: 0, life: 1.1,
    });
  }

  _emit() {
    this.onState({
      score: this.score,
      lives: this.lives,
      time: Math.max(0, this.timeLeft),
      timeFrac: Math.max(0, this.timeLeft / this.maxTime),
      difficulty: this.diff.label,
      streetName: this.street ? this.street.name : '',
      streetNum: this.streetIndex + 1,
      streetTotal: this.streets.length,
      slots: this.filledSlots ? this.filledSlots.size : 0,
    });
  }

  // ---- Rendering ----------------------------------------------------------
  fit() {
    const R = this.R;
    const rows = this.street ? this.street.rows.length : 8;
    const dpr = window.devicePixelRatio || 1;
    this.W = R.COLS * R.TILE;
    this.H = rows * R.TILE;
    this.canvas.width = this.W * dpr;
    this.canvas.height = this.H * dpr;
    this.canvas.style.aspectRatio = `${this.W} / ${this.H}`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
  }

  _render() {
    const { ctx, R } = this;
    const T = R.TILE;
    if (!this._sized || this._sizedRows !== this.lanes.length) {
      this.fit(); this._sized = true; this._sizedRows = this.lanes.length;
    }

    this.lanes.forEach((lane, i) => {
      const y = i * T;
      this._drawLaneBg(lane, y, T);
      // entities
      if (lane.entities && lane.dir) {
        ctx.font = `${Math.floor(T * 0.8)}px serif`;
        for (const e of lane.entities) {
          const cx = (e.x + lane.len / 2) * T;
          // platforms read better as a bar with a glyph; vehicles as glyphs
          if (lane.type === 'water') {
            ctx.fillStyle = lane.color;
            this._roundRect(e.x * T + 3, y + T * 0.28, lane.len * T - 6, T * 0.44, 8);
            ctx.fill();
          }
          ctx.fillText(lane.glyph, cx, y + T / 2 + 1);
        }
      }
      if (lane.type === 'goal') this._drawGoals(lane, y, T);
    });

    this._drawHopper(T);
    this._drawPopups(T);
    this._drawTimeBar(T);
    if (this.flashT > 0) {
      ctx.fillStyle = `rgba(239,68,68,${(this.flashT / 0.4) * 0.4})`;
      ctx.fillRect(0, 0, this.W, this.H);
    }
  }

  _drawPopups(T) {
    const { ctx } = this;
    ctx.font = `800 ${Math.floor(T * 0.4)}px Inter, sans-serif`;
    for (const p of this.popups) {
      const a = 1 - p.t / p.life;
      ctx.globalAlpha = Math.max(0, a);
      ctx.fillStyle = '#fde047';
      ctx.fillText(p.text, p.x * T, p.y * T);
    }
    ctx.globalAlpha = 1;
  }

  _drawLaneBg(lane, y, T) {
    const { ctx } = this;
    const W = this.W;
    let base;
    switch (lane.type) {
      case 'start': base = '#3f3f46'; break;
      case 'safe': base = '#52525b'; break;
      case 'goal': base = '#14532d'; break;
      case 'water': base = '#0e3a5f'; break;
      default: base = '#27272a'; // road
    }
    ctx.fillStyle = base;
    ctx.fillRect(0, y, W, T);

    if (lane.type === 'road') {
      ctx.strokeStyle = 'rgba(250,204,21,0.55)';
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 12]);
      ctx.beginPath();
      ctx.moveTo(0, y + T / 2); ctx.lineTo(W, y + T / 2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (lane.type === 'water') {
      ctx.strokeStyle = 'rgba(125,211,252,0.18)';
      ctx.lineWidth = 1;
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.moveTo(0, y + T * (0.3 + k * 0.2));
        ctx.lineTo(W, y + T * (0.3 + k * 0.2));
        ctx.stroke();
      }
    } else if (lane.type === 'start' || lane.type === 'safe') {
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      for (let x = 0; x < W; x += 12) ctx.fillRect(x, y, 6, T);
    }
  }

  _drawGoals(lane, y, T) {
    const { ctx } = this;
    for (let c = 0; c < this.R.COLS; c++) {
      const isSlot = lane.slots.includes(c);
      const cx = c * T + T / 2;
      if (isSlot) {
        ctx.font = `${Math.floor(T * 0.7)}px serif`;
        if (this.filledSlots.has(c)) {
          ctx.fillText('🐸', cx, y + T / 2 + 1);
        } else {
          ctx.globalAlpha = 0.85;
          ctx.fillText('🗽', cx, y + T / 2 + 1);
          ctx.globalAlpha = 1;
        }
      } else {
        // hedge wall between stoops
        ctx.fillStyle = '#166534';
        ctx.fillRect(c * T + 2, y + 4, T - 4, T - 8);
      }
    }
  }

  _drawHopper(T) {
    const { ctx } = this;
    const h = this.hopper;
    // interpolate hop
    let col = h.col, row = h.row;
    if (h.hopT > 0) {
      const p = 1 - h.hopT / this.R.HOP_MS;
      col = h.fromCol + (h.col - h.fromCol) * p;
      row = h.fromRow + (h.row - h.fromRow) * p;
    }
    const cx = (col + h.px) * T + T / 2;
    const cy = row * T + T / 2;
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + T * 0.32, T * 0.28, T * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    const lift = h.hopT > 0 ? Math.sin((1 - h.hopT / this.R.HOP_MS) * Math.PI) * 6 : 0;
    // Blink while invulnerable just after a respawn.
    ctx.globalAlpha = this.grace > 0 && Math.floor(this.grace * 10) % 2 === 0 ? 0.45 : 1;
    ctx.font = `${Math.floor(T * 0.82)}px serif`;
    ctx.fillText(this.avatar, cx, cy - lift);
    ctx.globalAlpha = 1;
  }

  _drawTimeBar(T) {
    const { ctx } = this;
    const frac = Math.max(0, this.timeLeft / this.maxTime);
    const w = this.W * frac;
    ctx.fillStyle = frac > 0.3 ? '#22c55e' : '#ef4444';
    ctx.fillRect(0, this.H - 4, w, 4);
  }

  _roundRect(x, y, w, h, r) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
};
