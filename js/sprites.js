/* =============================================================================
 * FROGGER IN NYC — SPRITE & DECOR DRAWINGS  (sprites.js)
 * -----------------------------------------------------------------------------
 * Part of the governed core's RENDER layer. Everything on the board is drawn
 * with vector shapes here — no emoji, no image assets. Each routine paints into
 * a tile-relative box so the same drawing scales with the global TILE size.
 *
 *   • SPRITES.draw(ctx, shape, x, y, w, h, color, dir) — hazards & platforms
 *   • SPRITES.frog(ctx, cx, cy, size)                  — the player
 *   • SPRITES.goalSlot(ctx, x, y, T, filled, theme)    — destination stoops
 *   • DECOR[theme]                                     — per-street backdrops
 * ===========================================================================*/

window.GOTHAM = window.GOTHAM || {};

(function () {
  // ---- tiny canvas helpers ------------------------------------------------
  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function dot(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.closePath(); }
  function shade(hex, f) {
    // lighten (f>0) / darken (f<0) a #rrggbb color
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const t = f < 0 ? 0 : 255, a = Math.abs(f);
    r = Math.round(r + (t - r) * a); g = Math.round(g + (t - g) * a); b = Math.round(b + (t - b) * a);
    return `rgb(${r},${g},${b})`;
  }
  const GLASS = 'rgba(186, 222, 255, 0.92)';
  const TIRE = '#1b1b1f';

  // Common car-like body. `roof` lets police add a light bar, etc.
  function carBody(ctx, x, y, w, h, color, dir, opts = {}) {
    const padX = w * 0.07;
    const bx = x + padX, bw = w - padX * 2;
    const bh = h * 0.34, by = y + h * 0.40;
    const wheelR = h * 0.115, wheelY = by + bh * 0.92;
    // wheels
    ctx.fillStyle = TIRE;
    dot(ctx, bx + bw * 0.24, wheelY, wheelR); ctx.fill();
    dot(ctx, bx + bw * 0.76, wheelY, wheelR); ctx.fill();
    ctx.fillStyle = '#52525b';
    dot(ctx, bx + bw * 0.24, wheelY, wheelR * 0.45); ctx.fill();
    dot(ctx, bx + bw * 0.76, wheelY, wheelR * 0.45); ctx.fill();
    // lower body
    ctx.fillStyle = color; rr(ctx, bx, by, bw, bh, h * 0.13); ctx.fill();
    ctx.fillStyle = shade(color, -0.18);
    rr(ctx, bx, by + bh * 0.55, bw, bh * 0.45, h * 0.10); ctx.fill();
    // cabin
    const cw = bw * 0.56, cx = bx + (dir > 0 ? bw * 0.16 : bw * 0.28);
    const cy = by - h * 0.20, ch = h * 0.24;
    ctx.fillStyle = color; rr(ctx, cx, cy, cw, ch + h * 0.05, h * 0.09); ctx.fill();
    // windshield (toward travel direction)
    ctx.fillStyle = GLASS;
    const glassW = cw * 0.42, gx = dir > 0 ? cx + cw - glassW - cw * 0.06 : cx + cw * 0.06;
    rr(ctx, gx, cy + ch * 0.12, glassW, ch * 0.66, h * 0.05); ctx.fill();
    // headlight
    ctx.fillStyle = '#fde68a';
    const hx = dir > 0 ? bx + bw - w * 0.05 : bx + w * 0.01;
    rr(ctx, hx, by + bh * 0.18, w * 0.04, bh * 0.3, 2); ctx.fill();
    return { bx, bw, by, bh, cx, cw, cy, ch };
  }

  const SPRITES = {
    // ---- ROAD hazards -----------------------------------------------------
    car(ctx, x, y, w, h, color, dir) { carBody(ctx, x, y, w, h, color, dir); },

    police(ctx, x, y, w, h, color, dir) {
      // NYPD-style: white body, blue stripe, roof light bar
      const b = carBody(ctx, x, y, w, h, '#f8fafc', dir);
      ctx.fillStyle = color; // blue accent
      rr(ctx, b.bx, b.by + b.bh * 0.42, b.bw, b.bh * 0.22, 2); ctx.fill();
      // light bar
      const lbw = b.cw * 0.7, lbx = b.cx + (b.cw - lbw) / 2, lby = b.cy - h * 0.12, lbh = h * 0.10;
      ctx.fillStyle = '#0b1220'; rr(ctx, lbx, lby, lbw, lbh, 2); ctx.fill();
      ctx.fillStyle = '#ef4444'; rr(ctx, lbx + 1, lby + 1, lbw / 2 - 2, lbh - 2, 1.5); ctx.fill();
      ctx.fillStyle = '#3b82f6'; rr(ctx, lbx + lbw / 2 + 1, lby + 1, lbw / 2 - 2, lbh - 2, 1.5); ctx.fill();
    },

    bus(ctx, x, y, w, h, color, dir) {
      const padX = w * 0.04, bx = x + padX, bw = w - padX * 2;
      const by = y + h * 0.20, bh = h * 0.52;
      const wheelR = h * 0.12, wheelY = by + bh + wheelR * 0.2;
      ctx.fillStyle = TIRE;
      dot(ctx, bx + bw * 0.16, wheelY, wheelR); ctx.fill();
      dot(ctx, bx + bw * 0.84, wheelY, wheelR); ctx.fill();
      ctx.fillStyle = color; rr(ctx, bx, by, bw, bh, h * 0.12); ctx.fill();
      ctx.fillStyle = shade(color, -0.16); rr(ctx, bx, by + bh * 0.62, bw, bh * 0.38, h * 0.08); ctx.fill();
      // window strip
      ctx.fillStyle = GLASS;
      const wy = by + bh * 0.16, wh = bh * 0.34, n = Math.max(3, Math.round(bw / (h * 0.55)));
      const gap = bw * 0.05, cellW = (bw - gap * (n + 1)) / n;
      for (let i = 0; i < n; i++) { rr(ctx, bx + gap + i * (cellW + gap), wy, cellW, wh, 2); ctx.fill(); }
      ctx.fillStyle = '#fde68a';
      const hx = dir > 0 ? bx + bw - w * 0.03 : bx + w * 0.005;
      rr(ctx, hx, by + bh * 0.5, w * 0.025, bh * 0.28, 2); ctx.fill();
    },

    truck(ctx, x, y, w, h, color, dir) {
      const padX = w * 0.04, bx = x + padX, bw = w - padX * 2;
      const by = y + h * 0.26, bh = h * 0.44;
      const wheelR = h * 0.12, wheelY = by + bh + wheelR * 0.1;
      ctx.fillStyle = TIRE;
      dot(ctx, bx + bw * 0.2, wheelY, wheelR); ctx.fill();
      dot(ctx, bx + bw * 0.62, wheelY, wheelR); ctx.fill();
      dot(ctx, bx + bw * 0.82, wheelY, wheelR); ctx.fill();
      // cargo box
      const cargoW = bw * 0.62, cargoX = dir > 0 ? bx : bx + bw - cargoW;
      ctx.fillStyle = shade(color, 0.25); rr(ctx, cargoX, by - h * 0.10, cargoW, bh + h * 0.10, h * 0.06); ctx.fill();
      ctx.strokeStyle = shade(color, -0.1); ctx.lineWidth = 1.5; ctx.stroke();
      // cab
      const cabW = bw * 0.34, cabX = dir > 0 ? bx + bw - cabW : bx;
      ctx.fillStyle = color; rr(ctx, cabX, by, cabW, bh, h * 0.08); ctx.fill();
      ctx.fillStyle = GLASS; rr(ctx, cabX + cabW * (dir > 0 ? 0.45 : 0.12), by + bh * 0.12, cabW * 0.42, bh * 0.4, 2); ctx.fill();
    },

    bike(ctx, x, y, w, h, color, dir) {
      const cx = x + w / 2, baseY = y + h * 0.66, wheelR = h * 0.18;
      const offset = w * 0.22;
      ctx.strokeStyle = '#3f3f46'; ctx.lineWidth = h * 0.05;
      ctx.beginPath(); ctx.arc(cx - offset, baseY, wheelR, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx + offset, baseY, wheelR, 0, Math.PI * 2); ctx.stroke();
      // frame
      ctx.strokeStyle = color; ctx.lineWidth = h * 0.045;
      ctx.beginPath();
      ctx.moveTo(cx - offset, baseY); ctx.lineTo(cx, baseY - h * 0.06);
      ctx.lineTo(cx + offset, baseY); ctx.moveTo(cx, baseY - h * 0.06); ctx.lineTo(cx + offset * 0.4, baseY - h * 0.30);
      ctx.stroke();
      // rider
      ctx.fillStyle = '#27272a';
      dot(ctx, cx - offset * 0.1, baseY - h * 0.40, h * 0.09); ctx.fill();
      ctx.strokeStyle = '#3f3f46'; ctx.lineWidth = h * 0.07;
      ctx.beginPath(); ctx.moveTo(cx - offset * 0.1, baseY - h * 0.34); ctx.lineTo(cx, baseY - h * 0.08); ctx.stroke();
    },

    cart(ctx, x, y, w, h, color, dir) {
      const padX = w * 0.12, bx = x + padX, bw = w - padX * 2;
      const by = y + h * 0.42, bh = h * 0.30;
      ctx.fillStyle = TIRE; dot(ctx, bx + bw * 0.2, by + bh, h * 0.09); ctx.fill();
      dot(ctx, bx + bw * 0.8, by + bh, h * 0.09); ctx.fill();
      ctx.fillStyle = '#d4d4d8'; rr(ctx, bx, by, bw, bh, 3); ctx.fill();
      // striped canopy
      const cy = y + h * 0.16, ch = h * 0.16;
      const stripes = 5, sw = bw / stripes;
      for (let i = 0; i < stripes; i++) { ctx.fillStyle = i % 2 ? '#dc2626' : '#fef2f2'; ctx.fillRect(bx + i * sw, cy, sw, ch); }
      ctx.fillStyle = '#a16207'; ctx.fillRect(bx + bw * 0.46, cy + ch, w * 0.03, by - (cy + ch));
    },

    // Pickpocket loot used as Canal St hazards
    wallet(ctx, x, y, w, h, color, dir) {
      const ww = w * 0.62, wh = h * 0.40, wx = x + (w - ww) / 2, wy = y + (h - wh) / 2;
      ctx.fillStyle = shade(color, -0.05); rr(ctx, wx, wy, ww, wh, h * 0.08); ctx.fill();
      ctx.fillStyle = shade(color, 0.12); rr(ctx, wx, wy, ww, wh * 0.5, h * 0.08); ctx.fill();
      // card peeking out
      ctx.fillStyle = '#e2e8f0'; rr(ctx, wx + ww * 0.55, wy - h * 0.05, ww * 0.4, wh * 0.34, 2); ctx.fill();
      ctx.fillStyle = '#38bdf8'; rr(ctx, wx + ww * 0.6, wy - h * 0.02, ww * 0.14, wh * 0.1, 1); ctx.fill();
      // stitch + clasp
      ctx.strokeStyle = shade(color, 0.3); ctx.lineWidth = 1; ctx.setLineDash([3, 2]);
      ctx.strokeRect(wx + 2, wy + 2, ww - 4, wh - 4); ctx.setLineDash([]);
      ctx.fillStyle = '#fbbf24'; dot(ctx, wx + ww / 2, wy + wh * 0.52, h * 0.04); ctx.fill();
    },

    purse(ctx, x, y, w, h, color, dir) {
      const pw = w * 0.56, ph = h * 0.40, px = x + (w - pw) / 2, py = y + h * 0.42;
      // handle
      ctx.strokeStyle = shade(color, -0.2); ctx.lineWidth = h * 0.05;
      ctx.beginPath(); ctx.arc(px + pw / 2, py, pw * 0.42, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
      // body
      ctx.fillStyle = color; rr(ctx, px, py, pw, ph, h * 0.10); ctx.fill();
      // flap
      ctx.fillStyle = shade(color, -0.12); rr(ctx, px, py, pw, ph * 0.5, h * 0.10); ctx.fill();
      // clasp
      ctx.fillStyle = '#fbbf24'; rr(ctx, px + pw / 2 - w * 0.03, py + ph * 0.42, w * 0.06, h * 0.08, 2); ctx.fill();
    },

    // ---- WATER platforms --------------------------------------------------
    ferry(ctx, x, y, w, h, color, dir) {
      hull(ctx, x, y, w, h, color, dir);
      const cw = w * 0.5, cx = x + (w - cw) / 2, cy = y + h * 0.18, ch = h * 0.26;
      ctx.fillStyle = '#fff7ed'; rr(ctx, cx, cy, cw, ch, 3); ctx.fill();
      ctx.fillStyle = GLASS;
      for (let i = 0; i < 3; i++) { rr(ctx, cx + cw * (0.12 + i * 0.28), cy + ch * 0.22, cw * 0.18, ch * 0.5, 2); ctx.fill(); }
      ctx.fillStyle = shade(color, -0.1); ctx.fillRect(cx + cw * 0.46, y + h * 0.05, w * 0.03, cy - y + h * 0.05);
    },
    barge(ctx, x, y, w, h, color, dir) {
      hull(ctx, x, y, w, h, color, dir);
      const cols = ['#ef4444', '#3b82f6', '#f59e0b'];
      const bw2 = w * 0.24, gap = w * 0.04, total = cols.length * bw2 + (cols.length - 1) * gap;
      let cx = x + (w - total) / 2;
      for (const c of cols) { ctx.fillStyle = c; rr(ctx, cx, y + h * 0.16, bw2, h * 0.26, 2); ctx.fill(); cx += bw2 + gap; }
    },
    raft(ctx, x, y, w, h, color, dir) {
      const logs = 4, lh = h * 0.5 / logs, ly = y + h * 0.28;
      for (let i = 0; i < logs; i++) {
        ctx.fillStyle = i % 2 ? shade(color, 0.12) : color;
        rr(ctx, x + w * 0.05, ly + i * lh, w * 0.9, lh * 0.92, lh * 0.4); ctx.fill();
      }
      ctx.strokeStyle = shade(color, -0.25); ctx.lineWidth = h * 0.03;
      ctx.beginPath(); ctx.moveTo(x + w * 0.2, ly - 2); ctx.lineTo(x + w * 0.2, ly + h * 0.5 + 2);
      ctx.moveTo(x + w * 0.8, ly - 2); ctx.lineTo(x + w * 0.8, ly + h * 0.5 + 2); ctx.stroke();
    },
    kayak(ctx, x, y, w, h, color, dir) {
      const kw = w * 0.86, kx = x + (w - kw) / 2, ky = y + h * 0.38, kh = h * 0.26;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.ellipse(kx + kw / 2, ky + kh / 2, kw / 2, kh / 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = shade(color, -0.25);
      ctx.beginPath(); ctx.ellipse(kx + kw / 2, ky + kh / 2, kw * 0.34, kh * 0.32, 0, 0, Math.PI * 2); ctx.fill();
      // paddle
      ctx.strokeStyle = '#3f3f46'; ctx.lineWidth = h * 0.04;
      ctx.beginPath(); ctx.moveTo(kx + kw * 0.3, ky - h * 0.08); ctx.lineTo(kx + kw * 0.7, ky + kh + h * 0.08); ctx.stroke();
    },

    // player avatar (also used for filled goal homes)
    frog(ctx, cx, cy, size) { drawFrog(ctx, cx, cy, size); },
  };

  function hull(ctx, x, y, w, h, color, dir) {
    const top = y + h * 0.42, bot = y + h * 0.84, inset = w * 0.06;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + inset, top);
    ctx.lineTo(x + w - inset, top);
    ctx.lineTo(x + w - inset * 2.2, bot);
    ctx.quadraticCurveTo(x + w / 2, bot + h * 0.10, x + inset * 2.2, bot);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = shade(color, 0.18);
    ctx.fillRect(x + inset, top, w - inset * 2, h * 0.06);
  }

  // Frog drawn from above, facing "up" (toward the goal row).
  function drawFrog(ctx, cx, cy, size) {
    const s = size;
    const G = '#43b14b', GD = '#2f8a39', GL = '#62c96a';
    // back legs
    ctx.fillStyle = GD;
    ctx.beginPath(); ctx.ellipse(cx - s * 0.42, cy + s * 0.34, s * 0.22, s * 0.16, -0.5, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + s * 0.42, cy + s * 0.34, s * 0.22, s * 0.16, 0.5, 0, 7); ctx.fill();
    // front feet
    ctx.beginPath(); ctx.ellipse(cx - s * 0.34, cy - s * 0.30, s * 0.12, s * 0.08, -0.4, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + s * 0.34, cy - s * 0.30, s * 0.12, s * 0.08, 0.4, 0, 7); ctx.fill();
    // body
    ctx.fillStyle = G;
    ctx.beginPath(); ctx.ellipse(cx, cy + s * 0.06, s * 0.42, s * 0.46, 0, 0, Math.PI * 2); ctx.fill();
    // belly highlight
    ctx.fillStyle = GL;
    ctx.beginPath(); ctx.ellipse(cx, cy + s * 0.16, s * 0.24, s * 0.30, 0, 0, Math.PI * 2); ctx.fill();
    // eyes
    ctx.fillStyle = G;
    dot(ctx, cx - s * 0.26, cy - s * 0.34, s * 0.22); ctx.fill();
    dot(ctx, cx + s * 0.26, cy - s * 0.34, s * 0.22); ctx.fill();
    ctx.fillStyle = '#fff';
    dot(ctx, cx - s * 0.26, cy - s * 0.36, s * 0.12); ctx.fill();
    dot(ctx, cx + s * 0.26, cy - s * 0.36, s * 0.12); ctx.fill();
    ctx.fillStyle = '#10240f';
    dot(ctx, cx - s * 0.24, cy - s * 0.36, s * 0.06); ctx.fill();
    dot(ctx, cx + s * 0.24, cy - s * 0.36, s * 0.06); ctx.fill();
    // smile
    ctx.strokeStyle = GD; ctx.lineWidth = Math.max(1, s * 0.06); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, cy + s * 0.02, s * 0.22, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  }

  SPRITES.draw = function (ctx, shape, x, y, w, h, color, dir) {
    (SPRITES[shape] || SPRITES.car)(ctx, x, y, w, h, color, dir);
  };

  // A destination stoop. Empty = an open, glowing doorway; filled = a frog home.
  SPRITES.goalSlot = function (ctx, x, y, T, filled, theme) {
    const isCt = theme === 'chinatown';
    const dx = x + T * 0.12, dw = T * 0.76, dy = y + T * 0.14, dh = T * 0.74;
    // doorway / stoop
    ctx.fillStyle = isCt ? '#7f1d1d' : '#1f2d24';
    rr(ctx, dx, dy, dw, dh, T * 0.16); ctx.fill();
    ctx.fillStyle = isCt ? '#b91c1c' : '#274033';
    rr(ctx, dx + dw * 0.12, dy + dh * 0.12, dw * 0.76, dh * 0.88, T * 0.1); ctx.fill();
    // gold/ warm trim arch
    ctx.strokeStyle = isCt ? '#fbbf24' : '#86efac';
    ctx.lineWidth = Math.max(1.5, T * 0.04);
    rr(ctx, dx + dw * 0.12, dy + dh * 0.12, dw * 0.76, dh * 0.88, T * 0.1); ctx.stroke();
    if (filled) {
      drawFrog(ctx, x + T / 2, y + T * 0.54, T * 0.34);
    } else {
      // soft "open slot" glow to invite landing
      ctx.fillStyle = isCt ? 'rgba(251,191,36,0.22)' : 'rgba(134,239,172,0.20)';
      rr(ctx, dx + dw * 0.2, dy + dh * 0.22, dw * 0.6, dh * 0.7, T * 0.08); ctx.fill();
    }
  };

  /* ---------------------------------------------------------------------------
   * THEMED BACKDROPS. Each theme gets a hook per lane type so streets can carry
   * a sense of place. Decor is painted on non-hazard lanes only, so it never
   * interferes with moving obstacles or collision.
   * -------------------------------------------------------------------------*/
  function lantern(ctx, cx, topY, size) {
    ctx.strokeStyle = '#7f1d1d'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx, topY); ctx.lineTo(cx, topY + size * 0.4); ctx.stroke();
    ctx.fillStyle = '#fbbf24'; ctx.fillRect(cx - size * 0.28, topY + size * 0.36, size * 0.56, size * 0.12);
    ctx.fillStyle = '#dc2626';
    ctx.beginPath(); ctx.ellipse(cx, topY + size * 0.78, size * 0.42, size * 0.34, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath(); ctx.ellipse(cx, topY + size * 0.78, size * 0.2, size * 0.34, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fbbf24'; ctx.fillRect(cx - size * 0.28, topY + size * 1.06, size * 0.56, size * 0.1);
    // tassel
    ctx.strokeStyle = '#fbbf24'; ctx.beginPath(); ctx.moveTo(cx, topY + size * 1.16); ctx.lineTo(cx, topY + size * 1.4); ctx.stroke();
  }

  const DECOR = {
    chinatown: {
      // warm tint applied over the base lane fills
      tint: { road: 'rgba(60,20,20,0.18)', water: null, safe: 'rgba(120,40,30,0.16)', start: 'rgba(120,40,30,0.16)', goal: null },
      lane(ctx, lane, y, T, W) {
        if (lane.type === 'goal') {
          // storefront band with gold signage behind the stoops
          ctx.fillStyle = '#5b1414'; ctx.fillRect(0, y, W, T * 0.16);
          const signs = 4, sw = W / signs;
          for (let i = 0; i < signs; i++) {
            ctx.fillStyle = i % 2 ? '#7f1d1d' : '#991b1b';
            rr(ctx, i * sw + 4, y + 2, sw - 8, T * 0.11, 3); ctx.fill();
            ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1.2;
            rr(ctx, i * sw + 4, y + 2, sw - 8, T * 0.11, 3); ctx.stroke();
          }
        } else if (lane.type === 'safe' || lane.type === 'start') {
          // string of lanterns hanging from the top of the lane
          const count = 5, step = W / count;
          for (let i = 0; i < count; i++) lantern(ctx, step * (i + 0.5), y + 1, T * 0.22);
        }
      },
    },
  };

  GOTHAM.SPRITES = SPRITES;
  GOTHAM.DECOR = DECOR;
})();
