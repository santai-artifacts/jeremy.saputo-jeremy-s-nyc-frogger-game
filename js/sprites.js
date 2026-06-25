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
  function star(ctx, cx, cy, r, color) {
    ctx.fillStyle = color; ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r * 0.45 : r;
      ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
    }
    ctx.closePath(); ctx.fill();
  }
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
      // NYPD-style: white body, bold navy door stripe, gold badge, big light bar
      const b = carBody(ctx, x, y, w, h, '#fbfdff', dir);
      // navy door stripe
      ctx.fillStyle = '#1e3a8a'; rr(ctx, b.bx, b.by + b.bh * 0.34, b.bw, b.bh * 0.34, 2); ctx.fill();
      ctx.fillStyle = '#2563eb'; rr(ctx, b.bx, b.by + b.bh * 0.30, b.bw, b.bh * 0.07, 1); ctx.fill();
      // gold badge on the door
      star(ctx, b.bx + b.bw * 0.5, b.by + b.bh * 0.51, h * 0.075, '#fcd34d');
      // prominent roof light bar that overhangs the cabin, with a colored glow
      const lbw = b.cw * 0.96, lbx = b.cx + (b.cw - lbw) / 2, lbh = h * 0.14, lby = b.cy - lbh * 0.95;
      ctx.fillStyle = 'rgba(239,68,68,0.4)'; dot(ctx, lbx + lbw * 0.26, lby + lbh / 2, lbh * 0.95); ctx.fill();
      ctx.fillStyle = 'rgba(59,130,246,0.4)'; dot(ctx, lbx + lbw * 0.74, lby + lbh / 2, lbh * 0.95); ctx.fill();
      ctx.fillStyle = '#0b1220'; rr(ctx, lbx, lby, lbw, lbh, 2); ctx.fill();
      ctx.fillStyle = '#ef4444'; rr(ctx, lbx + 1.5, lby + 1.5, lbw / 2 - 2.5, lbh - 3, 1.5); ctx.fill();
      ctx.fillStyle = '#3b82f6'; rr(ctx, lbx + lbw / 2 + 1, lby + 1.5, lbw / 2 - 2.5, lbh - 3, 1.5); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(lbx + lbw / 2 - 0.6, lby + 1.5, 1.2, lbh - 3);
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

    tourbus(ctx, x, y, w, h, color, dir) {
      const padX = w * 0.04, bx = x + padX, bw = w - padX * 2;
      const by = y + h * 0.12, bh = h * 0.60;
      const wheelR = h * 0.12, wheelY = by + bh + wheelR * 0.1;
      ctx.fillStyle = TIRE;
      dot(ctx, bx + bw * 0.18, wheelY, wheelR); ctx.fill();
      dot(ctx, bx + bw * 0.82, wheelY, wheelR); ctx.fill();
      // lower deck
      ctx.fillStyle = color; rr(ctx, bx, by + bh * 0.42, bw, bh * 0.58, h * 0.10); ctx.fill();
      // open upper deck
      ctx.fillStyle = shade(color, 0.12); rr(ctx, bx + bw * 0.03, by, bw * 0.94, bh * 0.5, h * 0.08); ctx.fill();
      ctx.fillStyle = '#fde68a'; rr(ctx, bx, by - h * 0.015, bw, h * 0.05, 2); ctx.fill(); // canopy band
      // tourists riding up top
      const heads = ['#fcd34d', '#f9a8d4', '#93c5fd', '#fca5a5', '#a7f3d0'];
      for (let i = 0; i < 5; i++) { ctx.fillStyle = heads[i % heads.length]; dot(ctx, bx + bw * (0.14 + i * 0.18), by + bh * 0.20, h * 0.055); ctx.fill(); }
      // lower windows
      ctx.fillStyle = GLASS;
      const n = 4, gap = bw * 0.045, cw = (bw - gap * (n + 1)) / n;
      for (let i = 0; i < n; i++) { rr(ctx, bx + gap + i * (cw + gap), by + bh * 0.54, cw, bh * 0.26, 2); ctx.fill(); }
      ctx.fillStyle = '#fde68a';
      const hx = dir > 0 ? bx + bw - w * 0.025 : bx + w * 0.005;
      rr(ctx, hx, by + bh * 0.72, w * 0.02, bh * 0.18, 2); ctx.fill();
    },

    carriage(ctx, x, y, w, h, color, dir) {
      ctx.save();
      if (dir < 0) { ctx.translate(x * 2 + w, 0); ctx.scale(-1, 1); } // horse leads, facing travel
      const ground = y + h * 0.80, wR = h * 0.17;
      // spoked wheels
      ctx.strokeStyle = '#3f3f46'; ctx.lineWidth = h * 0.035;
      for (const wx of [x + w * 0.16, x + w * 0.40]) {
        ctx.beginPath(); ctx.arc(wx, ground - wR * 0.1, wR, 0, 7); ctx.stroke();
        for (let a = 0; a < 4; a++) { ctx.beginPath(); ctx.moveTo(wx, ground - wR * 0.1); ctx.lineTo(wx + Math.cos(a * 1.57) * wR, ground - wR * 0.1 + Math.sin(a * 1.57) * wR); ctx.stroke(); }
      }
      // carriage body + canopy
      ctx.fillStyle = color; rr(ctx, x + w * 0.10, y + h * 0.34, w * 0.40, h * 0.28, h * 0.06); ctx.fill();
      ctx.fillStyle = shade(color, -0.22); rr(ctx, x + w * 0.12, y + h * 0.20, w * 0.36, h * 0.14, h * 0.05); ctx.fill();
      ctx.fillStyle = '#fde68a'; rr(ctx, x + w * 0.14, y + h * 0.42, w * 0.12, h * 0.14, 2); ctx.fill(); // seat lamp glow
      // horse
      ctx.fillStyle = '#6b4423';
      ctx.beginPath(); ctx.ellipse(x + w * 0.66, y + h * 0.52, w * 0.12, h * 0.15, 0, 0, 7); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + w * 0.74, y + h * 0.46); ctx.lineTo(x + w * 0.88, y + h * 0.30);
      ctx.lineTo(x + w * 0.94, y + h * 0.40); ctx.lineTo(x + w * 0.80, y + h * 0.56); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#4b2e15'; // mane
      ctx.beginPath(); ctx.moveTo(x + w * 0.80, y + h * 0.34); ctx.lineTo(x + w * 0.86, y + h * 0.30); ctx.lineTo(x + w * 0.82, y + h * 0.46); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#5a3a1e'; ctx.lineWidth = h * 0.05; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x + w * 0.60, y + h * 0.64); ctx.lineTo(x + w * 0.60, ground);
      ctx.moveTo(x + w * 0.72, y + h * 0.64); ctx.lineTo(x + w * 0.72, ground); ctx.stroke();
      ctx.restore();
    },

    pedicab(ctx, x, y, w, h, color, dir) {
      ctx.save();
      if (dir < 0) { ctx.translate(x * 2 + w, 0); ctx.scale(-1, 1); }
      const ground = y + h * 0.76, wR = h * 0.16;
      ctx.strokeStyle = '#3f3f46'; ctx.lineWidth = h * 0.045;
      ctx.beginPath(); ctx.arc(x + w * 0.28, ground, wR, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + w * 0.74, ground, wR * 0.82, 0, 7); ctx.stroke();
      // passenger canopy + seat
      ctx.fillStyle = color; rr(ctx, x + w * 0.10, y + h * 0.40, w * 0.38, h * 0.24, h * 0.05); ctx.fill();
      ctx.fillStyle = shade(color, -0.25); rr(ctx, x + w * 0.08, y + h * 0.24, w * 0.42, h * 0.12, h * 0.05); ctx.fill();
      ctx.fillStyle = '#fef3c7'; dot(ctx, x + w * 0.28, y + h * 0.44, h * 0.06); ctx.fill(); // a tourist
      // driver
      ctx.fillStyle = '#27272a'; dot(ctx, x + w * 0.66, y + h * 0.36, h * 0.07); ctx.fill();
      ctx.strokeStyle = '#3f3f46'; ctx.lineWidth = h * 0.05;
      ctx.beginPath(); ctx.moveTo(x + w * 0.66, y + h * 0.42); ctx.lineTo(x + w * 0.74, ground); ctx.stroke();
      ctx.restore();
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

    rowboat(ctx, x, y, w, h, color, dir) {
      hull(ctx, x, y, w, h, color, dir);
      ctx.fillStyle = shade(color, -0.22);
      rr(ctx, x + w * 0.30, y + h * 0.46, w * 0.10, h * 0.08, 1); ctx.fill();
      rr(ctx, x + w * 0.60, y + h * 0.46, w * 0.10, h * 0.08, 1); ctx.fill();
      // oars
      ctx.strokeStyle = '#7c5a32'; ctx.lineWidth = h * 0.04; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x + w * 0.42, y + h * 0.50); ctx.lineTo(x + w * 0.20, y + h * 0.32);
      ctx.moveTo(x + w * 0.58, y + h * 0.50); ctx.lineTo(x + w * 0.80, y + h * 0.32); ctx.stroke();
    },
    lilypad(ctx, x, y, w, h, color, dir) {
      const cx = x + w / 2, cy = y + h * 0.56, r = Math.min(w, h) * 0.40;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0.22 * Math.PI, 1.78 * Math.PI); ctx.lineTo(cx, cy); ctx.closePath(); ctx.fill();
      ctx.fillStyle = shade(color, -0.18);
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.62, 0.3 * Math.PI, 1.7 * Math.PI); ctx.lineTo(cx, cy); ctx.closePath(); ctx.fill();
      // little lotus flower
      ctx.fillStyle = '#f9a8d4';
      for (let i = -1; i <= 1; i++) { dot(ctx, cx + i * r * 0.22, cy - r * 0.5, r * 0.16); ctx.fill(); }
      ctx.fillStyle = '#fbbf24'; dot(ctx, cx, cy - r * 0.5, r * 0.12); ctx.fill();
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
  const GOAL_PALETTE = {
    chinatown:   { wall: '#7f1d1d', inner: '#b91c1c', trim: '#fbbf24', glow: 'rgba(251,191,36,0.22)' },
    centralpark: { wall: '#14532d', inner: '#166534', trim: '#86efac', glow: 'rgba(134,239,172,0.22)' },
    timessquare: { wall: '#312e81', inner: '#4338ca', trim: '#22d3ee', glow: 'rgba(34,211,238,0.28)' },
    default:     { wall: '#1f2d24', inner: '#274033', trim: '#86efac', glow: 'rgba(134,239,172,0.20)' },
  };
  SPRITES.goalSlot = function (ctx, x, y, T, filled, theme) {
    const p = GOAL_PALETTE[theme] || GOAL_PALETTE.default;
    const dx = x + T * 0.12, dw = T * 0.76, dy = y + T * 0.14, dh = T * 0.74;
    ctx.fillStyle = p.wall; rr(ctx, dx, dy, dw, dh, T * 0.16); ctx.fill();
    ctx.fillStyle = p.inner; rr(ctx, dx + dw * 0.12, dy + dh * 0.12, dw * 0.76, dh * 0.88, T * 0.1); ctx.fill();
    ctx.strokeStyle = p.trim; ctx.lineWidth = Math.max(1.5, T * 0.04);
    rr(ctx, dx + dw * 0.12, dy + dh * 0.12, dw * 0.76, dh * 0.88, T * 0.1); ctx.stroke();
    if (filled) {
      drawFrog(ctx, x + T / 2, y + T * 0.54, T * 0.34);
    } else {
      ctx.fillStyle = p.glow;
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

  // A leafy tree with a stout trunk, planted from its base point.
  function tree(ctx, cx, baseY, size) {
    ctx.fillStyle = '#5b3a1d';
    ctx.fillRect(cx - size * 0.08, baseY - size * 0.5, size * 0.16, size * 0.5);
    ctx.fillStyle = '#166534';
    dot(ctx, cx, baseY - size * 0.62, size * 0.42); ctx.fill();
    dot(ctx, cx - size * 0.34, baseY - size * 0.46, size * 0.30); ctx.fill();
    dot(ctx, cx + size * 0.34, baseY - size * 0.46, size * 0.30); ctx.fill();
    ctx.fillStyle = '#22c55e';
    dot(ctx, cx - size * 0.12, baseY - size * 0.78, size * 0.22); ctx.fill();
    dot(ctx, cx + size * 0.18, baseY - size * 0.66, size * 0.18); ctx.fill();
  }

  const DECOR = {
    // Central Park — a tree line behind the stoops, clipped hedges, and the
    // sun-dappled lake. Greens come through the per-lane base colors below.
    centralpark: {
      base: { safe: '#3f6212', start: '#3f6212', water: '#0e4a52' },
      tint: { road: 'rgba(22,42,14,0.16)', water: 'rgba(16,90,80,0.16)' },
      lane(ctx, lane, y, T, W) {
        if (lane.type === 'goal') {
          // a dense tree line rises behind the stoops along the green
          ctx.fillStyle = '#14361a'; ctx.fillRect(0, y, W, T * 0.20);
          for (let cx = 10; cx < W + 10; cx += 24) tree(ctx, cx, y + T * 0.30, T * 0.34);
        } else if (lane.type === 'safe' || lane.type === 'start') {
          // a low clipped hedge runs along the back of the path…
          for (let bx = 6; bx < W; bx += 26) {
            ctx.fillStyle = '#166534'; rr(ctx, bx, y + T * 0.04, T * 0.46, T * 0.20, 4); ctx.fill();
            ctx.fillStyle = '#22c55e'; rr(ctx, bx, y + T * 0.04, T * 0.46, T * 0.07, 4); ctx.fill();
          }
          // …with a few flowers dotted across the grass
          const cols = ['#f9a8d4', '#fde68a', '#fca5a5'];
          let i = 0;
          for (let fx = 14; fx < W; fx += 19) { ctx.fillStyle = cols[i++ % cols.length]; dot(ctx, fx, y + T * 0.82, 2); ctx.fill(); }
        } else if (lane.type === 'water') {
          // glints of sunlight skittering across the lake
          ctx.fillStyle = 'rgba(190,242,255,0.14)';
          for (let gx = 12; gx < W; gx += 27) { dot(ctx, gx, y + T * 0.6, 2.4); ctx.fill(); }
        }
      },
    },
    // Times Square — stacked neon billboards over a deep-night avenue.
    timessquare: {
      base: { safe: '#15132e', start: '#15132e' },
      tint: { road: 'rgba(8,8,28,0.24)', safe: 'rgba(16,16,44,0.28)', start: 'rgba(16,16,44,0.28)' },
      lane(ctx, lane, y, T, W) {
        const cols = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#ec4899', '#06b6d4'];
        if (lane.type === 'goal') {
          // a towering wall of stacked billboards crowned by a marquee of bulbs
          const n = 5, pw = W / n;
          for (let i = 0; i < n; i++) {
            const c = cols[i % cols.length];
            ctx.fillStyle = c; rr(ctx, i * pw + 3, y + 2, pw - 6, T * 0.20, 3); ctx.fill();
            // scrolling-text suggestion: bright bands across each board
            ctx.fillStyle = 'rgba(255,255,255,0.6)'; rr(ctx, i * pw + 6, y + 4, pw - 12, T * 0.05, 1); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.28)'; rr(ctx, i * pw + 6, y + T * 0.13, pw - 12, T * 0.04, 1); ctx.fill();
          }
          // marquee bulb strip running the full width
          ctx.fillStyle = '#1c1830'; ctx.fillRect(0, y + T * 0.22, W, T * 0.05);
          let k = 0;
          for (let bx = 7; bx < W; bx += 13) { ctx.fillStyle = k++ % 2 ? '#fde68a' : '#f9a8d4'; dot(ctx, bx, y + T * 0.245, 2); ctx.fill(); }
        } else if (lane.type === 'safe' || lane.type === 'start') {
          // a thinner neon ribbon on the medians, so the goal wall reads tallest
          const n = 6, pw = W / n;
          for (let i = 0; i < n; i++) {
            ctx.fillStyle = cols[i % cols.length];
            rr(ctx, i * pw + 3, y + 2, pw - 6, T * 0.13, 2); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.55)';
            rr(ctx, i * pw + 5, y + 3.5, pw - 10, T * 0.04, 1); ctx.fill();
          }
        }
      },
    },
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
