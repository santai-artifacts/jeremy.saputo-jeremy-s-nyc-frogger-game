/* =============================================================================
 * FROGGER IN NYC — SPRITE & DECOR DRAWINGS  (sprites.js)
 * Higher-resolution, NYC-realistic sprites and themed backdrops.
 * ===========================================================================*/

window.GOTHAM = window.GOTHAM || {};

(function () {
  // ---- helpers ---------------------------------------------------------------
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
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const t = f < 0 ? 0 : 255, a = Math.abs(f);
    r = Math.round(r + (t - r) * a); g = Math.round(g + (t - g) * a); b = Math.round(b + (t - b) * a);
    return `rgb(${r},${g},${b})`;
  }

  const GLASS = 'rgba(155,200,240,0.90)';
  const GLASS_DARK = 'rgba(110,165,215,0.80)';
  const TIRE = '#141414';

  // Realistic wheel with rim and spokes
  function wheel(ctx, cx, cy, r) {
    // Tire
    ctx.fillStyle = TIRE;
    dot(ctx, cx, cy, r); ctx.fill();
    // Sidewall highlight arc
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = r * 0.10;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.86, Math.PI * 0.65, Math.PI * 1.55);
    ctx.stroke();
    // Rim dish
    ctx.fillStyle = '#b0b0ba';
    dot(ctx, cx, cy, r * 0.66); ctx.fill();
    // Spokes
    ctx.strokeStyle = '#888898';
    ctx.lineWidth = r * 0.14;
    ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r * 0.18, cy + Math.sin(a) * r * 0.18);
      ctx.lineTo(cx + Math.cos(a) * r * 0.58, cy + Math.sin(a) * r * 0.58);
      ctx.stroke();
    }
    ctx.lineCap = 'butt';
    // Rim outer ring shadow
    ctx.strokeStyle = 'rgba(0,0,0,0.30)';
    ctx.lineWidth = r * 0.09;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2);
    ctx.stroke();
    // Center hub
    ctx.fillStyle = '#d0d0d8';
    dot(ctx, cx, cy, r * 0.19); ctx.fill();
    ctx.fillStyle = '#888898';
    dot(ctx, cx, cy, r * 0.09); ctx.fill();
  }

  // ---- Realistic car body (side profile) ------------------------------------
  function carBody(ctx, x, y, w, h, color, dir) {
    const padX = w * 0.04;
    const bx = x + padX, bw = w - padX * 2;

    const bodyY  = y + h * 0.44;
    const bodyH  = h * 0.30;
    const cabY   = bodyY - h * 0.26;
    const cabH   = h * 0.28;
    const wR     = h * 0.138;
    const axleY  = bodyY + bodyH * 0.82;
    const wFront = dir > 0 ? bx + bw * 0.76 : bx + bw * 0.24;
    const wRear  = dir > 0 ? bx + bw * 0.24 : bx + bw * 0.76;

    // Under-car shadow
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(bx + bw / 2, axleY + wR * 0.35, bw * 0.45, wR * 0.30, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wheel wells (dark arch)
    ctx.fillStyle = '#0e0e0e';
    dot(ctx, wFront, axleY, wR * 1.14); ctx.fill();
    dot(ctx, wRear,  axleY, wR * 1.14); ctx.fill();

    // Lower rocker / sill
    ctx.fillStyle = shade(color, -0.32);
    rr(ctx, bx, bodyY + bodyH * 0.62, bw, bodyH * 0.38, h * 0.03); ctx.fill();

    // Main body panel
    ctx.fillStyle = color;
    rr(ctx, bx, bodyY, bw, bodyH, h * 0.05); ctx.fill();

    // Top-edge gloss highlight
    ctx.fillStyle = 'rgba(255,255,255,0.20)';
    rr(ctx, bx + bw * 0.04, bodyY + 1, bw * 0.92, bodyH * 0.15, h * 0.03); ctx.fill();

    // Door crease lines
    ctx.strokeStyle = shade(color, -0.24);
    ctx.lineWidth = Math.max(0.7, h * 0.014);
    ctx.beginPath();
    ctx.moveTo(bx + bw * 0.10, bodyY + bodyH * 0.38);
    ctx.lineTo(bx + bw * 0.90, bodyY + bodyH * 0.38);
    ctx.stroke();
    // Vertical door seam
    ctx.beginPath();
    ctx.moveTo(bx + bw * 0.50, bodyY + bodyH * 0.12);
    ctx.lineTo(bx + bw * 0.50, bodyY + bodyH * 0.90);
    ctx.stroke();

    // Cabin — tapered roofline
    const cabSlope = h * 0.035;
    const cabInset = bw * 0.10;
    ctx.fillStyle = shade(color, 0.06);
    ctx.beginPath();
    ctx.moveTo(bx + (dir > 0 ? cabInset * 0.6 : cabInset * 1.0), bodyY);
    ctx.lineTo(bx + bw - (dir > 0 ? cabInset * 1.0 : cabInset * 0.6), bodyY);
    ctx.lineTo(bx + bw - (dir > 0 ? cabInset * 1.4 : cabInset * 0.2), cabY + cabSlope);
    ctx.lineTo(bx + (dir > 0 ? cabInset * 0.2 : cabInset * 1.4), cabY + cabSlope);
    ctx.closePath();
    ctx.fill();

    // Roof panel
    ctx.fillStyle = shade(color, 0.04);
    rr(ctx, bx + cabInset * 0.3, cabY, bw - cabInset * 0.6, cabH * 0.18, h * 0.02); ctx.fill();
    // Roof gloss
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    rr(ctx, bx + cabInset * 0.5, cabY + 1, bw - cabInset * 1.0, cabH * 0.10, h * 0.02); ctx.fill();

    // Windshield (toward travel direction)
    const fwX = dir > 0 ? bx + bw * 0.52 : bx + bw * 0.06;
    const fwW = bw * 0.38;
    ctx.fillStyle = GLASS;
    ctx.beginPath();
    ctx.moveTo(fwX + (dir > 0 ? fwW * 0.04 : 0),          bodyY - h * 0.01);
    ctx.lineTo(fwX + (dir > 0 ? fwW       : fwW * 0.96),  bodyY - h * 0.01);
    ctx.lineTo(fwX + fwW * (dir > 0 ? 0.84 : 0.20),       cabY + cabSlope + h * 0.012);
    ctx.lineTo(fwX + fwW * (dir > 0 ? 0.16 : 0.80),       cabY + cabSlope + h * 0.012);
    ctx.closePath();
    ctx.fill();
    // Glass glare
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.moveTo(fwX + fwW * (dir > 0 ? 0.16 : 0.64),  cabY + cabSlope + h * 0.012);
    ctx.lineTo(fwX + fwW * (dir > 0 ? 0.30 : 0.78),  cabY + cabSlope + h * 0.012);
    ctx.lineTo(fwX + fwW * (dir > 0 ? 0.16 : 0.64),  bodyY - h * 0.01);
    ctx.closePath();
    ctx.fill();

    // Rear window
    const rwX = dir > 0 ? bx + bw * 0.08 : bx + bw * 0.54;
    const rwW = bw * 0.36;
    ctx.fillStyle = GLASS_DARK;
    ctx.beginPath();
    ctx.moveTo(rwX,          bodyY - h * 0.01);
    ctx.lineTo(rwX + rwW,    bodyY - h * 0.01);
    ctx.lineTo(rwX + rwW * (dir > 0 ? 0.82 : 0.78), cabY + cabSlope + h * 0.012);
    ctx.lineTo(rwX + rwW * (dir > 0 ? 0.18 : 0.22), cabY + cabSlope + h * 0.012);
    ctx.closePath();
    ctx.fill();

    // A-pillar frame (front)
    ctx.strokeStyle = shade(color, -0.18);
    ctx.lineWidth = Math.max(1.0, h * 0.022);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(fwX + (dir > 0 ? 0 : fwW),             bodyY - h * 0.01);
    ctx.lineTo(fwX + fwW * (dir > 0 ? 0.16 : 0.84),   cabY + cabSlope + h * 0.012);
    ctx.stroke();
    // C-pillar (rear)
    ctx.beginPath();
    ctx.moveTo(rwX + (dir > 0 ? rwW : 0),             bodyY - h * 0.01);
    ctx.lineTo(rwX + rwW * (dir > 0 ? 0.82 : 0.18),   cabY + cabSlope + h * 0.012);
    ctx.stroke();
    ctx.lineCap = 'butt';

    // Headlights (front — toward travel)
    const hlX = dir > 0 ? bx + bw * 0.87 : bx;
    const hlW = bw * 0.12, hlH = bodyH * 0.32;
    ctx.fillStyle = '#2a2a30';
    rr(ctx, hlX, bodyY + bodyH * 0.08, hlW, hlH, h * 0.02); ctx.fill();
    ctx.fillStyle = '#fef8e0';
    rr(ctx, hlX + (dir > 0 ? hlW * 0.10 : hlW * 0.06), bodyY + bodyH * 0.12, hlW * 0.82, hlH * 0.50, h * 0.015); ctx.fill();
    // DRL accent strip
    ctx.strokeStyle = '#f0c864';
    ctx.lineWidth = h * 0.016;
    ctx.beginPath();
    ctx.moveTo(hlX + hlW * 0.08, bodyY + bodyH * 0.65);
    ctx.lineTo(hlX + hlW * 0.92, bodyY + bodyH * 0.65);
    ctx.stroke();

    // Taillights (rear)
    const tlX = dir > 0 ? bx : bx + bw * 0.88;
    const tlW = bw * 0.11;
    ctx.fillStyle = '#3a0000';
    rr(ctx, tlX, bodyY + bodyH * 0.08, tlW, hlH, h * 0.02); ctx.fill();
    ctx.fillStyle = '#cc1a1a';
    rr(ctx, tlX + (dir > 0 ? tlW * 0.08 : tlW * 0.08), bodyY + bodyH * 0.12, tlW * 0.82, hlH * 0.50, h * 0.015); ctx.fill();
    // Brake light strip
    ctx.strokeStyle = '#ff2222';
    ctx.lineWidth = h * 0.016;
    ctx.beginPath();
    ctx.moveTo(tlX + tlW * 0.08, bodyY + bodyH * 0.65);
    ctx.lineTo(tlX + tlW * 0.92, bodyY + bodyH * 0.65);
    ctx.stroke();

    // Front grille
    const grX = dir > 0 ? bx + bw * 0.88 : bx;
    const grW = bw * 0.11;
    ctx.fillStyle = shade(color, -0.42);
    rr(ctx, grX, bodyY + bodyH * 0.44, grW, bodyH * 0.44, h * 0.02); ctx.fill();
    // Grille mesh lines
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 0.7;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.moveTo(grX + grW * 0.06, bodyY + bodyH * (0.47 + k * 0.12));
      ctx.lineTo(grX + grW * 0.94, bodyY + bodyH * (0.47 + k * 0.12));
      ctx.stroke();
    }
    // Bumper
    ctx.fillStyle = shade(color, -0.10);
    rr(ctx, grX, bodyY + bodyH * 0.76, grW, bodyH * 0.24, h * 0.02); ctx.fill();

    // Side mirror
    ctx.fillStyle = shade(color, -0.12);
    const mX = dir > 0 ? bx + bw * 0.84 : bx + bw * 0.05;
    ctx.beginPath();
    ctx.ellipse(mX, cabY + cabH * 0.65 + cabSlope, bw * 0.038, h * 0.022, 0, 0, Math.PI * 2);
    ctx.fill();

    // License plate (rear)
    ctx.fillStyle = '#dce4f0';
    const lpX = dir > 0 ? bx + bw * 0.01 : bx + bw * 0.80;
    rr(ctx, lpX, bodyY + bodyH * 0.56, bw * 0.18, bodyH * 0.30, 1); ctx.fill();
    ctx.strokeStyle = '#aaa'; ctx.lineWidth = 0.5;
    rr(ctx, lpX, bodyY + bodyH * 0.56, bw * 0.18, bodyH * 0.30, 1); ctx.stroke();
    ctx.fillStyle = '#1c3a6e';
    ctx.font = `bold ${Math.max(5, h * 0.072)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NY', lpX + bw * 0.09, bodyY + bodyH * 0.72);

    // Wheels (on top of wheel wells)
    wheel(ctx, wFront, axleY, wR);
    wheel(ctx, wRear,  axleY, wR);

    return { bx, bw, bodyY, bodyH, cabX: bx + cabInset * 0.2, cabW: bw - cabInset * 0.4,
             cabY, cabH, axleY, wR, wFront, wRear,
             // legacy aliases
             by: bodyY, bh: bodyH, cx: bx + cabInset * 0.2, cw: bw - cabInset * 0.4,
             cy: cabY, ch: cabH };
  }

  const SPRITES = {
    // Generic sedan
    car(ctx, x, y, w, h, color, dir) { carBody(ctx, x, y, w, h, color, dir); },

    // NYC Yellow Cab
    taxi(ctx, x, y, w, h, color, dir) {
      const b = carBody(ctx, x, y, w, h, color, dir);

      // Checker band along lower body
      const ckY  = b.bodyY + b.bodyH * 0.28;
      const ckH  = b.bodyH * 0.26;
      const ckSz = ckH * 0.80;
      const n    = Math.max(1, Math.floor(b.bw / ckSz));
      const ckW  = b.bw / n;
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#111' : '#fff';
        ctx.fillRect(b.bx + i * ckW, ckY, ckW, ckH * 0.5);
        ctx.fillStyle = i % 2 === 0 ? '#fff' : '#111';
        ctx.fillRect(b.bx + i * ckW, ckY + ckH * 0.5, ckW, ckH * 0.5);
      }
      // Clip checker to body bounds
      ctx.fillStyle = color;
      ctx.fillRect(x, ckY, b.bx - x, ckH + 2);
      ctx.fillRect(b.bx + b.bw, ckY, w - (b.bx + b.bw - x), ckH + 2);

      // Taxi rooftop light ("T&LC" medallion sign)
      const tlW = b.cabW * 0.40, tlH = b.cabH * 0.28;
      const tlX = b.cabX + (b.cabW - tlW) / 2;
      const tlY = b.cabY - tlH * 0.95;
      ctx.fillStyle = '#f7c948';
      rr(ctx, tlX, tlY, tlW, tlH, h * 0.02); ctx.fill();
      ctx.fillStyle = '#000';
      ctx.font = `bold ${Math.max(4, tlH * 0.58)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TAXI', tlX + tlW / 2, tlY + tlH / 2 + 0.5);
      // Light housing border
      ctx.strokeStyle = '#c8a030';
      ctx.lineWidth = 0.8;
      rr(ctx, tlX, tlY, tlW, tlH, h * 0.02); ctx.stroke();
    },

    // NYPD Police Cruiser
    police(ctx, x, y, w, h, color, dir) {
      const b = carBody(ctx, x, y, w, h, '#f2f5fb', dir);

      // NYPD blue lower stripe
      ctx.fillStyle = '#1a3d80';
      rr(ctx, b.bx, b.bodyY + b.bodyH * 0.42, b.bw, b.bodyH * 0.38, h * 0.02); ctx.fill();

      // "POLICE" lettering
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(4, h * 0.095)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('POLICE', b.bx + b.bw / 2, b.bodyY + b.bodyH * 0.605);

      // NYPD gold shield badge
      star(ctx, b.bx + b.bw * (dir > 0 ? 0.28 : 0.72), b.bodyY + b.bodyH * 0.23, h * 0.062, '#fcd34d');

      // "NYPD" small text above stripe
      ctx.fillStyle = '#1a3d80';
      ctx.font = `bold ${Math.max(3, h * 0.072)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('NYPD', b.bx + b.bw / 2, b.bodyY + b.bodyH * 0.25);

      // Light bar on roof
      const lbW = b.cabW * 0.88, lbH = h * 0.115;
      const lbX = b.cabX + (b.cabW - lbW) / 2;
      const lbY = b.cabY - lbH * 0.96;
      // Glow halos
      ctx.fillStyle = 'rgba(239,68,68,0.25)';
      dot(ctx, lbX + lbW * 0.22, lbY + lbH / 2, lbH * 1.05); ctx.fill();
      ctx.fillStyle = 'rgba(59,130,246,0.25)';
      dot(ctx, lbX + lbW * 0.78, lbY + lbH / 2, lbH * 1.05); ctx.fill();
      // Bar housing
      ctx.fillStyle = '#080c18';
      rr(ctx, lbX, lbY, lbW, lbH, 2); ctx.fill();
      ctx.fillStyle = '#e53535';
      rr(ctx, lbX + 1,            lbY + 1, lbW * 0.47, lbH - 2, 1.5); ctx.fill();
      ctx.fillStyle = '#2c6ef5';
      rr(ctx, lbX + lbW * 0.53,  lbY + 1, lbW * 0.46, lbH - 2, 1.5); ctx.fill();
      // Divider
      ctx.fillStyle = '#080c18';
      ctx.fillRect(lbX + lbW * 0.50 - 0.7, lbY, 1.4, lbH);
      // Light reflections
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      rr(ctx, lbX + 2,            lbY + 1, lbW * 0.20, lbH * 0.38, 1); ctx.fill();
      rr(ctx, lbX + lbW * 0.55,  lbY + 1, lbW * 0.20, lbH * 0.38, 1); ctx.fill();
    },

    // MTA Bus
    bus(ctx, x, y, w, h, color, dir) {
      const padX = w * 0.02, bx = x + padX, bw = w - padX * 2;
      const byB  = y + h * 0.14, bhB = h * 0.60;
      const wR   = h * 0.128;
      const axleY = byB + bhB + wR * 0.12;
      const wF   = dir > 0 ? bx + bw * 0.80 : bx + bw * 0.20;
      const wRr  = dir > 0 ? bx + bw * 0.20 : bx + bw * 0.80;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath();
      ctx.ellipse(bx + bw / 2, axleY + wR * 0.36, bw * 0.44, wR * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wheel wells
      ctx.fillStyle = '#0e0e0e';
      dot(ctx, wF,  axleY, wR * 1.10); ctx.fill();
      dot(ctx, wRr, axleY, wR * 1.10); ctx.fill();

      // Body — MTA white
      ctx.fillStyle = '#f0f4f8';
      rr(ctx, bx, byB, bw, bhB, h * 0.07); ctx.fill();

      // MTA blue lower panel
      ctx.fillStyle = '#1a4e96';
      rr(ctx, bx, byB + bhB * 0.54, bw, bhB * 0.46, h * 0.06); ctx.fill();
      // Silver accent line
      ctx.fillStyle = '#c0ceda';
      ctx.fillRect(bx, byB + bhB * 0.52, bw, bhB * 0.036);
      // Yellow accent stripe
      ctx.fillStyle = '#f5a800';
      ctx.fillRect(bx, byB + bhB * 0.48, bw, bhB * 0.042);

      // Window strip (upper)
      const nWin = Math.max(3, Math.round(bw / (h * 0.52)));
      const wGap = bw * 0.04, cellW = (bw - wGap * (nWin + 1)) / nWin;
      ctx.fillStyle = GLASS;
      for (let i = 0; i < nWin; i++) {
        rr(ctx, bx + wGap + i * (cellW + wGap), byB + bhB * 0.10, cellW, bhB * 0.36, h * 0.025);
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 0.8;
      for (let i = 0; i < nWin; i++) {
        rr(ctx, bx + wGap + i * (cellW + wGap), byB + bhB * 0.10, cellW, bhB * 0.36, h * 0.025);
        ctx.stroke();
      }
      // Window mullion lines
      ctx.strokeStyle = '#c8d4e0'; ctx.lineWidth = 0.6;
      for (let i = 0; i < nWin; i++) {
        const mx = bx + wGap + i * (cellW + wGap) + cellW * 0.5;
        ctx.beginPath();
        ctx.moveTo(mx, byB + bhB * 0.10);
        ctx.lineTo(mx, byB + bhB * 0.46);
        ctx.stroke();
      }

      // Destination sign
      const dsX = dir > 0 ? bx + bw * 0.50 : bx + bw * 0.06;
      const dsW = bw * 0.43;
      ctx.fillStyle = '#111';
      rr(ctx, dsX, byB + h * 0.02, dsW, h * 0.085, 2); ctx.fill();
      ctx.fillStyle = '#f5a800';
      ctx.font = `bold ${Math.max(4, h * 0.062)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('M9  CANAL ST', dsX + dsW / 2, byB + h * 0.062);

      // Headlight
      ctx.fillStyle = '#fef3c7';
      const hlX = dir > 0 ? bx + bw * 0.89 : bx;
      rr(ctx, hlX, byB + bhB * 0.24, bw * 0.10, bhB * 0.22, h * 0.02); ctx.fill();
      ctx.fillStyle = '#fffbeb';
      rr(ctx, hlX + (dir > 0 ? bw * 0.01 : bw * 0.01), byB + bhB * 0.27, bw * 0.07, bhB * 0.15, h * 0.01); ctx.fill();

      // MTA logo badge on lower blue panel
      ctx.fillStyle = '#fff';
      rr(ctx, bx + bw * 0.42, byB + bhB * 0.62, bw * 0.16, bhB * 0.22, h * 0.02); ctx.fill();
      ctx.fillStyle = '#1a4e96';
      ctx.font = `bold ${Math.max(4, h * 0.085)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('MTA', bx + bw * 0.50, byB + bhB * 0.740);

      // Door outline (right side, visible depending on dir)
      ctx.strokeStyle = '#d0d8e4'; ctx.lineWidth = 0.8;
      const dX = dir > 0 ? bx + bw * 0.68 : bx + bw * 0.08;
      rr(ctx, dX, byB + bhB * 0.46, bw * 0.22, bhB * 0.50, h * 0.02); ctx.stroke();

      wheel(ctx, wF,  axleY, wR);
      wheel(ctx, wRr, axleY, wR);
    },

    // Delivery truck
    truck(ctx, x, y, w, h, color, dir) {
      const padX = w * 0.02, bx = x + padX, bw = w - padX * 2;
      const byT  = y + h * 0.22, bhT = h * 0.50;
      const wR   = h * 0.128;
      const axleY = byT + bhT + wR * 0.10;
      const wF   = dir > 0 ? bx + bw * 0.84 : bx + bw * 0.16;
      const wM   = dir > 0 ? bx + bw * 0.60 : bx + bw * 0.40;
      const wRr  = dir > 0 ? bx + bw * 0.16 : bx + bw * 0.84;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath();
      ctx.ellipse(bx + bw / 2, axleY + wR * 0.38, bw * 0.46, wR * 0.27, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wheel wells
      ctx.fillStyle = '#0e0e0e';
      dot(ctx, wF,  axleY, wR * 1.10); ctx.fill();
      dot(ctx, wM,  axleY, wR * 1.10); ctx.fill();
      dot(ctx, wRr, axleY, wR * 1.10); ctx.fill();

      // Cargo box
      const cargoW = bw * 0.60;
      const cargoX = dir > 0 ? bx : bx + bw - cargoW;
      ctx.fillStyle = shade(color, 0.15);
      rr(ctx, cargoX, byT - h * 0.06, cargoW, bhT + h * 0.06, h * 0.04); ctx.fill();
      // Cargo box shadow edge
      ctx.fillStyle = shade(color, -0.18);
      ctx.fillRect(dir > 0 ? cargoX : cargoX + cargoW - h * 0.025, byT, h * 0.025, bhT * 0.94);
      // Cargo panel lines (horizontal)
      ctx.strokeStyle = shade(color, -0.10); ctx.lineWidth = 0.8;
      for (let k = 1; k < 4; k++) {
        ctx.beginPath();
        ctx.moveTo(cargoX + cargoW * 0.04, byT + bhT * (k / 4) * 0.88);
        ctx.lineTo(cargoX + cargoW * 0.96, byT + bhT * (k / 4) * 0.88);
        ctx.stroke();
      }
      // Cargo label
      ctx.fillStyle = shade(color, -0.30);
      ctx.font = `bold ${Math.max(4, h * 0.075)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('DELIVERY', cargoX + cargoW / 2, byT + bhT * 0.38);
      ctx.font = `${Math.max(3, h * 0.057)}px sans-serif`;
      ctx.fillText('EXPRESS', cargoX + cargoW / 2, byT + bhT * 0.56);
      // Roll-up door line
      ctx.strokeStyle = shade(color, -0.15); ctx.lineWidth = 1.2;
      const rollX = dir > 0 ? cargoX : cargoX + cargoW - h * 0.02;
      ctx.beginPath();
      ctx.moveTo(rollX, byT + h * 0.02);
      ctx.lineTo(rollX, byT + bhT * 0.92);
      ctx.stroke();

      // Cab
      const cabW = bw * 0.36, cabX = dir > 0 ? bx + bw - cabW : bx;
      ctx.fillStyle = color;
      rr(ctx, cabX, byT, cabW, bhT, h * 0.06); ctx.fill();
      // Cab top gloss
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      rr(ctx, cabX + cabW * 0.05, byT + h * 0.01, cabW * 0.90, bhT * 0.12, h * 0.03); ctx.fill();
      // Cab window
      ctx.fillStyle = GLASS;
      const cWinX = cabX + cabW * (dir > 0 ? 0.10 : 0.30);
      rr(ctx, cWinX, byT + bhT * 0.10, cabW * 0.58, bhT * 0.42, h * 0.025); ctx.fill();
      ctx.strokeStyle = shade(color, -0.18); ctx.lineWidth = 0.8;
      rr(ctx, cWinX, byT + bhT * 0.10, cabW * 0.58, bhT * 0.42, h * 0.025); ctx.stroke();
      // Headlight
      ctx.fillStyle = '#fef3c7';
      const cHlX = dir > 0 ? cabX + cabW * 0.88 : cabX;
      rr(ctx, cHlX, byT + bhT * 0.20, cabW * 0.11, bhT * 0.26, h * 0.02); ctx.fill();
      // Step
      ctx.fillStyle = shade(color, -0.20);
      ctx.fillRect(dir > 0 ? cabX + cabW * 0.06 : cabX + cabW * 0.68, byT + bhT * 0.85, cabW * 0.26, bhT * 0.14);

      wheel(ctx, wF,  axleY, wR);
      wheel(ctx, wM,  axleY, wR);
      wheel(ctx, wRr, axleY, wR);
    },

    bike(ctx, x, y, w, h, color, dir) {
      const cx = x + w / 2, baseY = y + h * 0.66, wR = h * 0.175;
      const offset = w * 0.22;
      // Frame shadow
      ctx.strokeStyle = 'rgba(0,0,0,0.14)'; ctx.lineWidth = h * 0.05;
      ctx.beginPath();
      ctx.moveTo(cx - offset + 2, baseY + 3);
      ctx.lineTo(cx + 2, baseY - h * 0.05 + 3);
      ctx.lineTo(cx + offset + 2, baseY + 3); ctx.stroke();
      // Wheels
      wheel(ctx, cx - offset, baseY, wR);
      wheel(ctx, cx + offset, baseY, wR);
      // Frame
      ctx.strokeStyle = color; ctx.lineWidth = h * 0.042; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - offset, baseY);
      ctx.lineTo(cx, baseY - h * 0.06);
      ctx.lineTo(cx + offset, baseY);
      ctx.moveTo(cx, baseY - h * 0.06);
      ctx.lineTo(cx + offset * 0.4, baseY - h * 0.30); ctx.stroke();
      // Handlebar
      ctx.strokeStyle = '#52525b'; ctx.lineWidth = h * 0.028;
      ctx.beginPath();
      ctx.moveTo(cx + offset * 0.28, baseY - h * 0.30);
      ctx.lineTo(cx + offset * 0.56, baseY - h * 0.21); ctx.stroke();
      // Rider torso
      ctx.fillStyle = '#27272a';
      dot(ctx, cx, baseY - h * 0.46, h * 0.09); ctx.fill();
      ctx.strokeStyle = '#3f3f46'; ctx.lineWidth = h * 0.07;
      ctx.beginPath();
      ctx.moveTo(cx, baseY - h * 0.38);
      ctx.lineTo(cx + offset * 0.3, baseY - h * 0.09); ctx.stroke();
      ctx.lineCap = 'butt';
    },

    cart(ctx, x, y, w, h, color, dir) {
      const padX = w * 0.12, bx = x + padX, bw = w - padX * 2;
      const by = y + h * 0.44, bh = h * 0.28;
      const wR = h * 0.09;
      // Wheels
      wheel(ctx, bx + bw * 0.22, by + bh + wR, wR);
      wheel(ctx, bx + bw * 0.78, by + bh + wR, wR);
      // Cart body
      ctx.fillStyle = '#e0e0e4'; rr(ctx, bx, by, bw, bh, 3); ctx.fill();
      ctx.strokeStyle = '#aaa'; ctx.lineWidth = 0.6;
      rr(ctx, bx, by, bw, bh, 3); ctx.stroke();
      // Canopy
      const cy = y + h * 0.16, ch = h * 0.16;
      const stripes = 5, sw = bw / stripes;
      for (let i = 0; i < stripes; i++) { ctx.fillStyle = i % 2 ? '#dc2626' : '#fef2f2'; ctx.fillRect(bx + i * sw, cy, sw, ch); }
      ctx.strokeStyle = '#c00'; ctx.lineWidth = 0.5;
      ctx.strokeRect(bx, cy, bw, ch);
      ctx.fillStyle = '#a16207'; ctx.fillRect(bx + bw * 0.46, cy + ch, w * 0.03, by - (cy + ch));
      // Items on cart
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(bx + bw * 0.15, by + bh * 0.16, bw * 0.18, bh * 0.52);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(bx + bw * 0.50, by + bh * 0.16, bw * 0.18, bh * 0.52);
    },

    wallet(ctx, x, y, w, h, color, dir) {
      const ww = w * 0.62, wh = h * 0.40, wx = x + (w - ww) / 2, wy = y + (h - wh) / 2;
      ctx.fillStyle = shade(color, -0.05); rr(ctx, wx, wy, ww, wh, h * 0.08); ctx.fill();
      ctx.fillStyle = shade(color, 0.12); rr(ctx, wx, wy, ww, wh * 0.5, h * 0.08); ctx.fill();
      ctx.fillStyle = '#e2e8f0'; rr(ctx, wx + ww * 0.55, wy - h * 0.05, ww * 0.4, wh * 0.34, 2); ctx.fill();
      ctx.fillStyle = '#38bdf8'; rr(ctx, wx + ww * 0.6, wy - h * 0.02, ww * 0.14, wh * 0.1, 1); ctx.fill();
      ctx.strokeStyle = shade(color, 0.3); ctx.lineWidth = 1; ctx.setLineDash([3, 2]);
      ctx.strokeRect(wx + 2, wy + 2, ww - 4, wh - 4); ctx.setLineDash([]);
      ctx.fillStyle = '#fbbf24'; dot(ctx, wx + ww / 2, wy + wh * 0.52, h * 0.04); ctx.fill();
    },

    purse(ctx, x, y, w, h, color, dir) {
      const pw = w * 0.56, ph = h * 0.40, px = x + (w - pw) / 2, py = y + h * 0.42;
      ctx.strokeStyle = shade(color, -0.2); ctx.lineWidth = h * 0.05;
      ctx.beginPath(); ctx.arc(px + pw / 2, py, pw * 0.42, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
      ctx.fillStyle = color; rr(ctx, px, py, pw, ph, h * 0.10); ctx.fill();
      ctx.fillStyle = shade(color, -0.12); rr(ctx, px, py, pw, ph * 0.5, h * 0.10); ctx.fill();
      ctx.fillStyle = '#fbbf24'; rr(ctx, px + pw / 2 - w * 0.03, py + ph * 0.42, w * 0.06, h * 0.08, 2); ctx.fill();
    },

    tourbus(ctx, x, y, w, h, color, dir) {
      const padX = w * 0.04, bx = x + padX, bw = w - padX * 2;
      const by = y + h * 0.10, bh = h * 0.62;
      const wR = h * 0.125, axleY = by + bh + wR * 0.10;
      const wF = dir > 0 ? bx + bw * 0.82 : bx + bw * 0.18;
      const wRr = dir > 0 ? bx + bw * 0.18 : bx + bw * 0.82;
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath();
      ctx.ellipse(bx + bw / 2, axleY + wR * 0.35, bw * 0.44, wR * 0.28, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0e0e0e';
      dot(ctx, wF, axleY, wR * 1.10); ctx.fill();
      dot(ctx, wRr, axleY, wR * 1.10); ctx.fill();
      ctx.fillStyle = color; rr(ctx, bx, by + bh * 0.42, bw, bh * 0.58, h * 0.08); ctx.fill();
      ctx.fillStyle = shade(color, 0.12); rr(ctx, bx + bw * 0.03, by, bw * 0.94, bh * 0.52, h * 0.08); ctx.fill();
      ctx.fillStyle = '#fde68a'; rr(ctx, bx, by - h * 0.015, bw, h * 0.05, 2); ctx.fill();
      const heads = ['#fcd34d', '#f9a8d4', '#93c5fd', '#fca5a5', '#a7f3d0'];
      for (let i = 0; i < 5; i++) { ctx.fillStyle = heads[i % heads.length]; dot(ctx, bx + bw * (0.12 + i * 0.18), by + bh * 0.20, h * 0.05); ctx.fill(); }
      ctx.fillStyle = GLASS;
      const n = 4, gap = bw * 0.045, cw2 = (bw - gap * (n + 1)) / n;
      for (let i = 0; i < n; i++) { rr(ctx, bx + gap + i * (cw2 + gap), by + bh * 0.53, cw2, bh * 0.26, 2); ctx.fill(); }
      wheel(ctx, wF, axleY, wR);
      wheel(ctx, wRr, axleY, wR);
    },

    carriage(ctx, x, y, w, h, color, dir) {
      ctx.save();
      if (dir < 0) { ctx.translate(x * 2 + w, 0); ctx.scale(-1, 1); }
      const ground = y + h * 0.80, wR2 = h * 0.17;
      ctx.strokeStyle = '#3f3f46'; ctx.lineWidth = h * 0.035;
      for (const wx of [x + w * 0.16, x + w * 0.40]) {
        ctx.beginPath(); ctx.arc(wx, ground - wR2 * 0.1, wR2, 0, 7); ctx.stroke();
        for (let a = 0; a < 4; a++) { ctx.beginPath(); ctx.moveTo(wx, ground - wR2 * 0.1); ctx.lineTo(wx + Math.cos(a * 1.57) * wR2, ground - wR2 * 0.1 + Math.sin(a * 1.57) * wR2); ctx.stroke(); }
      }
      ctx.fillStyle = color; rr(ctx, x + w * 0.10, y + h * 0.34, w * 0.40, h * 0.28, h * 0.06); ctx.fill();
      ctx.fillStyle = shade(color, -0.22); rr(ctx, x + w * 0.12, y + h * 0.20, w * 0.36, h * 0.14, h * 0.05); ctx.fill();
      ctx.fillStyle = '#fde68a'; rr(ctx, x + w * 0.14, y + h * 0.42, w * 0.12, h * 0.14, 2); ctx.fill();
      ctx.fillStyle = '#6b4423';
      ctx.beginPath(); ctx.ellipse(x + w * 0.66, y + h * 0.52, w * 0.12, h * 0.15, 0, 0, 7); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + w * 0.74, y + h * 0.46); ctx.lineTo(x + w * 0.88, y + h * 0.30);
      ctx.lineTo(x + w * 0.94, y + h * 0.40); ctx.lineTo(x + w * 0.80, y + h * 0.56); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#4b2e15';
      ctx.beginPath(); ctx.moveTo(x + w * 0.80, y + h * 0.34); ctx.lineTo(x + w * 0.86, y + h * 0.30); ctx.lineTo(x + w * 0.82, y + h * 0.46); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#5a3a1e'; ctx.lineWidth = h * 0.05; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x + w * 0.60, y + h * 0.64); ctx.lineTo(x + w * 0.60, ground);
      ctx.moveTo(x + w * 0.72, y + h * 0.64); ctx.lineTo(x + w * 0.72, ground); ctx.stroke();
      ctx.lineCap = 'butt';
      ctx.restore();
    },

    pedicab(ctx, x, y, w, h, color, dir) {
      ctx.save();
      if (dir < 0) { ctx.translate(x * 2 + w, 0); ctx.scale(-1, 1); }
      const ground = y + h * 0.76, wR2 = h * 0.16;
      ctx.strokeStyle = '#3f3f46'; ctx.lineWidth = h * 0.045;
      ctx.beginPath(); ctx.arc(x + w * 0.28, ground, wR2, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + w * 0.74, ground, wR2 * 0.82, 0, 7); ctx.stroke();
      ctx.fillStyle = color; rr(ctx, x + w * 0.10, y + h * 0.40, w * 0.38, h * 0.24, h * 0.05); ctx.fill();
      ctx.fillStyle = shade(color, -0.25); rr(ctx, x + w * 0.08, y + h * 0.24, w * 0.42, h * 0.12, h * 0.05); ctx.fill();
      ctx.fillStyle = '#fef3c7'; dot(ctx, x + w * 0.28, y + h * 0.44, h * 0.06); ctx.fill();
      ctx.fillStyle = '#27272a'; dot(ctx, x + w * 0.66, y + h * 0.36, h * 0.07); ctx.fill();
      ctx.strokeStyle = '#3f3f46'; ctx.lineWidth = h * 0.05;
      ctx.beginPath(); ctx.moveTo(x + w * 0.66, y + h * 0.42); ctx.lineTo(x + w * 0.74, ground); ctx.stroke();
      ctx.restore();
    },

    // ---- Water platforms ---------------------------------------------------
    ferry(ctx, x, y, w, h, color, dir) {
      hull(ctx, x, y, w, h, color, dir);
      const cw2 = w * 0.5, cx = x + (w - cw2) / 2, cy = y + h * 0.18, ch = h * 0.26;
      ctx.fillStyle = '#fff7ed'; rr(ctx, cx, cy, cw2, ch, 3); ctx.fill();
      ctx.fillStyle = GLASS;
      for (let i = 0; i < 3; i++) { rr(ctx, cx + cw2 * (0.12 + i * 0.28), cy + ch * 0.22, cw2 * 0.18, ch * 0.5, 2); ctx.fill(); }
      ctx.fillStyle = shade(color, -0.1); ctx.fillRect(cx + cw2 * 0.46, y + h * 0.05, w * 0.03, cy - y + h * 0.05);
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
      ctx.strokeStyle = '#3f3f46'; ctx.lineWidth = h * 0.04;
      ctx.beginPath(); ctx.moveTo(kx + kw * 0.3, ky - h * 0.08); ctx.lineTo(kx + kw * 0.7, ky + kh + h * 0.08); ctx.stroke();
    },
    rowboat(ctx, x, y, w, h, color, dir) {
      hull(ctx, x, y, w, h, color, dir);
      ctx.fillStyle = shade(color, -0.22);
      rr(ctx, x + w * 0.30, y + h * 0.46, w * 0.10, h * 0.08, 1); ctx.fill();
      rr(ctx, x + w * 0.60, y + h * 0.46, w * 0.10, h * 0.08, 1); ctx.fill();
      ctx.strokeStyle = '#7c5a32'; ctx.lineWidth = h * 0.04; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x + w * 0.42, y + h * 0.50); ctx.lineTo(x + w * 0.20, y + h * 0.32);
      ctx.moveTo(x + w * 0.58, y + h * 0.50); ctx.lineTo(x + w * 0.80, y + h * 0.32); ctx.stroke();
      ctx.lineCap = 'butt';
    },
    lilypad(ctx, x, y, w, h, color, dir) {
      const cx = x + w / 2, cy = y + h * 0.56, r = Math.min(w, h) * 0.40;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0.22 * Math.PI, 1.78 * Math.PI); ctx.lineTo(cx, cy); ctx.closePath(); ctx.fill();
      ctx.fillStyle = shade(color, -0.18);
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.62, 0.3 * Math.PI, 1.7 * Math.PI); ctx.lineTo(cx, cy); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f9a8d4';
      for (let i = -1; i <= 1; i++) { dot(ctx, cx + i * r * 0.22, cy - r * 0.5, r * 0.16); ctx.fill(); }
      ctx.fillStyle = '#fbbf24'; dot(ctx, cx, cy - r * 0.5, r * 0.12); ctx.fill();
    },

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

  function drawFrog(ctx, cx, cy, size) {
    const s = size;
    const G = '#43b14b', GD = '#2f8a39', GL = '#62c96a';
    ctx.fillStyle = GD;
    ctx.beginPath(); ctx.ellipse(cx - s * 0.42, cy + s * 0.34, s * 0.22, s * 0.16, -0.5, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + s * 0.42, cy + s * 0.34, s * 0.22, s * 0.16,  0.5, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx - s * 0.34, cy - s * 0.30, s * 0.12, s * 0.08, -0.4, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + s * 0.34, cy - s * 0.30, s * 0.12, s * 0.08,  0.4, 0, 7); ctx.fill();
    ctx.fillStyle = G;
    ctx.beginPath(); ctx.ellipse(cx, cy + s * 0.06, s * 0.42, s * 0.46, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = GL;
    ctx.beginPath(); ctx.ellipse(cx, cy + s * 0.16, s * 0.24, s * 0.30, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = G;
    dot(ctx, cx - s * 0.26, cy - s * 0.34, s * 0.22); ctx.fill();
    dot(ctx, cx + s * 0.26, cy - s * 0.34, s * 0.22); ctx.fill();
    ctx.fillStyle = '#fff';
    dot(ctx, cx - s * 0.26, cy - s * 0.36, s * 0.12); ctx.fill();
    dot(ctx, cx + s * 0.26, cy - s * 0.36, s * 0.12); ctx.fill();
    ctx.fillStyle = '#10240f';
    dot(ctx, cx - s * 0.24, cy - s * 0.36, s * 0.06); ctx.fill();
    dot(ctx, cx + s * 0.24, cy - s * 0.36, s * 0.06); ctx.fill();
    ctx.strokeStyle = GD; ctx.lineWidth = Math.max(1, s * 0.06); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, cy + s * 0.02, s * 0.22, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    ctx.lineCap = 'butt';
  }

  SPRITES.draw = function (ctx, shape, x, y, w, h, color, dir) {
    (SPRITES[shape] || SPRITES.car)(ctx, x, y, w, h, color, dir);
  };

  // ---- Goal slots -----------------------------------------------------------
  const GOAL_PALETTE = {
    chinatown:   { wall: '#6b1414', inner: '#8b1a1a', trim: '#fbbf24', glow: 'rgba(251,191,36,0.25)' },
    centralpark: { wall: '#14532d', inner: '#166534', trim: '#86efac', glow: 'rgba(134,239,172,0.22)' },
    timessquare: { wall: '#312e81', inner: '#4338ca', trim: '#22d3ee', glow: 'rgba(34,211,238,0.28)' },
    default:     { wall: '#1f2d24', inner: '#274033', trim: '#86efac', glow: 'rgba(134,239,172,0.20)' },
  };

  SPRITES.goalSlot = function (ctx, x, y, T, filled, theme) {
    const p = GOAL_PALETTE[theme] || GOAL_PALETTE.default;
    const dx = x + T * 0.10, dw = T * 0.80, dy = y + T * 0.10, dh = T * 0.78;

    if (theme === 'chinatown') {
      // Chinatown shopfront doorway
      // Red facade
      ctx.fillStyle = p.wall;
      rr(ctx, dx, dy, dw, dh, T * 0.06); ctx.fill();
      // Inner arch/doorway
      ctx.fillStyle = p.inner;
      rr(ctx, dx + dw * 0.12, dy + dh * 0.10, dw * 0.76, dh * 0.90, T * 0.04); ctx.fill();
      // Gold trim
      ctx.strokeStyle = p.trim; ctx.lineWidth = Math.max(1.5, T * 0.038);
      rr(ctx, dx + dw * 0.12, dy + dh * 0.10, dw * 0.76, dh * 0.90, T * 0.04); ctx.stroke();
      // Sign above door (red with gold)
      ctx.fillStyle = '#8b0000';
      rr(ctx, dx + dw * 0.08, dy + dh * 0.04, dw * 0.84, dh * 0.16, T * 0.02); ctx.fill();
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 0.8;
      rr(ctx, dx + dw * 0.08, dy + dh * 0.04, dw * 0.84, dh * 0.16, T * 0.02); ctx.stroke();
      // Chinese character strokes on sign (stylized)
      ctx.fillStyle = '#fbbf24';
      const sw = dw * 0.08, sh = dh * 0.08, sy2 = dy + dh * 0.065;
      for (let ci = 0; ci < 3; ci++) {
        const sx = dx + dw * (0.20 + ci * 0.24);
        ctx.fillRect(sx, sy2, sw * 0.25, sh * 0.90);
        ctx.fillRect(sx - sw * 0.15, sy2, sw * 0.55, sh * 0.25);
        ctx.fillRect(sx - sw * 0.15, sy2 + sh * 0.60, sw * 0.55, sh * 0.25);
      }
      // Lanterns flanking doorway
      lantern(ctx, dx + dw * 0.12, dy + dh * 0.18, T * 0.18);
      lantern(ctx, dx + dw * 0.88, dy + dh * 0.18, T * 0.18);
      if (filled) {
        drawFrog(ctx, x + T / 2, y + T * 0.60, T * 0.36);
      } else {
        ctx.fillStyle = p.glow;
        rr(ctx, dx + dw * 0.24, dy + dh * 0.32, dw * 0.52, dh * 0.60, T * 0.04); ctx.fill();
      }
    } else {
      // Default goal slot
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
    }
  };

  // ---- Decor helpers --------------------------------------------------------
  function lantern(ctx, cx, topY, size) {
    // String
    ctx.strokeStyle = '#7f1d1d'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(cx, topY); ctx.lineTo(cx, topY + size * 0.36); ctx.stroke();
    // Top cap
    ctx.fillStyle = '#fbbf24'; ctx.fillRect(cx - size * 0.28, topY + size * 0.33, size * 0.56, size * 0.10);
    // Lantern body (red ovoid)
    const grad = ctx.createRadialGradient(cx - size * 0.12, topY + size * 0.72, 0, cx, topY + size * 0.78, size * 0.42);
    grad.addColorStop(0, '#ff4444');
    grad.addColorStop(0.6, '#dc2626');
    grad.addColorStop(1, '#7f1d1d');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.ellipse(cx, topY + size * 0.78, size * 0.42, size * 0.36, 0, 0, Math.PI * 2); ctx.fill();
    // Rib lines
    ctx.strokeStyle = '#991b1b'; ctx.lineWidth = 0.7;
    for (let r = -1; r <= 1; r++) {
      ctx.beginPath();
      ctx.ellipse(cx + r * size * 0.14, topY + size * 0.78, size * 0.10, size * 0.36, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Bottom cap
    ctx.fillStyle = '#fbbf24'; ctx.fillRect(cx - size * 0.28, topY + size * 1.08, size * 0.56, size * 0.09);
    // Tassel
    ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(cx, topY + size * 1.17); ctx.lineTo(cx, topY + size * 1.38); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - size * 0.08, topY + size * 1.24); ctx.lineTo(cx - size * 0.08, topY + size * 1.42); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + size * 0.08, topY + size * 1.24); ctx.lineTo(cx + size * 0.08, topY + size * 1.42); ctx.stroke();
  }

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

  // Draw simplified Chinese character block (3-stroke style)
  function hanzi(ctx, cx, cy, size, color) {
    ctx.fillStyle = color;
    const s = size;
    // Horizontal top stroke
    ctx.fillRect(cx - s * 0.42, cy - s * 0.36, s * 0.84, s * 0.14);
    // Vertical center stroke
    ctx.fillRect(cx - s * 0.08, cy - s * 0.36, s * 0.16, s * 0.72);
    // Horizontal bottom stroke
    ctx.fillRect(cx - s * 0.42, cy + s * 0.22, s * 0.84, s * 0.14);
    // Left diagonal suggestion
    ctx.fillRect(cx - s * 0.42, cy - s * 0.04, s * 0.30, s * 0.12);
    // Right diagonal suggestion
    ctx.fillRect(cx + s * 0.12, cy - s * 0.04, s * 0.30, s * 0.12);
  }

  // ---- Themed backdrops -----------------------------------------------------
  const DECOR = {
    // ---- CHINATOWN (Canal Street) ------------------------------------------
    chinatown: {
      base: { safe: '#3c3530', start: '#3c3530' }, // warm concrete
      tint: { road: 'rgba(35,12,8,0.14)' },
      lane(ctx, lane, y, T, W) {
        if (lane.type === 'goal') {
          // Night sky sliver above roofline
          ctx.fillStyle = '#0a1422';
          ctx.fillRect(0, y, W, T * 0.06);

          // Brick building upper facade
          const brickH = T * 0.28;
          ctx.fillStyle = '#6b3528';
          ctx.fillRect(0, y + T * 0.06, W, brickH);
          // Mortar lines (horizontal)
          ctx.strokeStyle = '#573020'; ctx.lineWidth = 0.7;
          for (let ky = y + T * 0.09; ky < y + T * 0.06 + brickH; ky += T * 0.048) {
            ctx.beginPath(); ctx.moveTo(0, ky); ctx.lineTo(W, ky); ctx.stroke();
          }
          // Mortar vertical offset pattern
          ctx.strokeStyle = '#573020'; ctx.lineWidth = 0.6;
          for (let row = 0; row < 5; row++) {
            const offset = row % 2 ? T * 0.5 : 0;
            for (let bx = offset; bx < W + T; bx += T * 1.1) {
              const lineY = y + T * 0.09 + row * T * 0.048;
              ctx.beginPath(); ctx.moveTo(bx, lineY); ctx.lineTo(bx, lineY + T * 0.044); ctx.stroke();
            }
          }

          // Upper-story windows with warm light
          const numWin = Math.max(2, Math.floor(W / (T * 0.85)));
          const winStep = W / numWin;
          for (let i = 0; i < numWin; i++) {
            const wx = winStep * i + winStep * 0.22;
            const ww = winStep * 0.48;
            const wh = brickH * 0.52;
            const wwy = y + T * 0.09;
            // Window frame (dark)
            ctx.fillStyle = '#1a1010';
            ctx.fillRect(wx - 1, wwy - 1, ww + 2, wh + 2);
            // Warm interior glow
            const glowGrad = ctx.createLinearGradient(wx, wwy, wx, wwy + wh);
            glowGrad.addColorStop(0, 'rgba(255,200,80,0.18)');
            glowGrad.addColorStop(1, 'rgba(255,140,30,0.06)');
            ctx.fillStyle = glowGrad;
            ctx.fillRect(wx, wwy, ww, wh);
            // Pane divider
            ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(wx + ww / 2, wwy); ctx.lineTo(wx + ww / 2, wwy + wh); ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(wx, wwy + wh * 0.5); ctx.lineTo(wx + ww, wwy + wh * 0.5); ctx.stroke();
          }

          // Fire escapes (2 per lane width)
          const fePositions = [W * 0.22, W * 0.64];
          ctx.strokeStyle = '#1c1c1c'; ctx.lineWidth = 1.0;
          for (const feX of fePositions) {
            const feW = T * 0.26, feTop = y + T * 0.12;
            // Platform
            ctx.beginPath();
            ctx.moveTo(feX - feW / 2, feTop + T * 0.18); ctx.lineTo(feX + feW / 2, feTop + T * 0.18); ctx.stroke();
            // Railing posts
            ctx.beginPath();
            ctx.moveTo(feX - feW / 2, feTop + T * 0.06); ctx.lineTo(feX - feW / 2, feTop + T * 0.18); ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(feX + feW / 2, feTop + T * 0.06); ctx.lineTo(feX + feW / 2, feTop + T * 0.18); ctx.stroke();
            // Railing top bar
            ctx.beginPath();
            ctx.moveTo(feX - feW / 2, feTop + T * 0.06); ctx.lineTo(feX + feW / 2, feTop + T * 0.06); ctx.stroke();
            // Ladder rungs
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(feX + feW * 0.28, feTop + T * 0.18);
            ctx.lineTo(feX + feW * 0.28, feTop + T * 0.34);
            ctx.stroke();
            for (let rung = 0; rung < 3; rung++) {
              const ry = feTop + T * 0.20 + rung * T * 0.048;
              ctx.beginPath();
              ctx.moveTo(feX + feW * 0.16, ry); ctx.lineTo(feX + feW * 0.40, ry); ctx.stroke();
            }
            ctx.lineWidth = 1.0;
          }

          // Red canvas awning band
          const awningY = y + T * 0.34;
          ctx.fillStyle = '#8b0000';
          ctx.fillRect(0, awningY, W, T * 0.14);
          // Awning scalloped edge
          const scallop = T * 0.055;
          ctx.fillStyle = '#7a0000';
          for (let sx = 0; sx < W; sx += scallop * 2) {
            dot(ctx, sx + scallop, awningY + T * 0.14, scallop);
            ctx.fill();
          }
          // Gold awning stripe
          ctx.fillStyle = '#c8a020';
          ctx.fillRect(0, awningY, W, T * 0.018);

          // Chinese storefront signs (red boards with gold characters)
          const numSigns = Math.max(2, Math.floor(W / (T * 1.1)));
          const signStep = W / numSigns;
          for (let s = 0; s < numSigns; s++) {
            const scx = signStep * s + signStep * 0.5;
            const sw2 = signStep * 0.68, sh2 = T * 0.095;
            const ssy = awningY + T * 0.025;
            ctx.fillStyle = '#6b0000';
            rr(ctx, scx - sw2 / 2, ssy, sw2, sh2, 2); ctx.fill();
            ctx.strokeStyle = '#c8a020'; ctx.lineWidth = 0.8;
            rr(ctx, scx - sw2 / 2, ssy, sw2, sh2, 2); ctx.stroke();
            // Characters (3 per sign)
            const charCount = Math.max(1, Math.floor(sw2 / (sh2 * 1.1)));
            for (let ci = 0; ci < Math.min(3, charCount); ci++) {
              const charCx = scx - sw2 * 0.30 + ci * sw2 * 0.30;
              hanzi(ctx, charCx, ssy + sh2 * 0.50, sh2 * 0.34, '#fbbf24');
            }
          }

          // Hanging lanterns strung across
          const lCount = Math.max(3, Math.floor(W / (T * 0.52)));
          const lStep = W / lCount;
          // String wire
          ctx.strokeStyle = '#4a2020'; ctx.lineWidth = 0.7;
          ctx.beginPath(); ctx.moveTo(0, awningY - T * 0.04); ctx.lineTo(W, awningY - T * 0.04); ctx.stroke();
          for (let l = 0; l < lCount; l++) {
            lantern(ctx, lStep * (l + 0.5), awningY - T * 0.04, T * 0.26);
          }
        }

        else if (lane.type === 'safe' || lane.type === 'start') {
          // NYC concrete sidewalk
          ctx.fillStyle = '#4a4540';
          ctx.fillRect(0, y, W, T);

          // Concrete slab grid
          const slabW = T * 1.25, slabH = T * 0.90;
          ctx.strokeStyle = '#3a3530'; ctx.lineWidth = 0.8;
          for (let sx = 0; sx < W + slabW; sx += slabW) {
            ctx.beginPath(); ctx.moveTo(sx, y); ctx.lineTo(sx, y + T); ctx.stroke();
          }
          ctx.beginPath();
          ctx.moveTo(0, y + slabH); ctx.lineTo(W, y + slabH); ctx.stroke();

          // Building base strip at top (where wall meets sidewalk)
          ctx.fillStyle = '#5a3a28';
          ctx.fillRect(0, y, W, T * 0.08);
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(0, y + T * 0.08, W, T * 0.014);
          ctx.fillStyle = '#6b3528';
          ctx.fillRect(0, y + T * 0.094, W, T * 0.022);

          // Curb line at bottom
          ctx.fillStyle = '#5c5650';
          ctx.fillRect(0, y + T * 0.90, W, T * 0.10);
          ctx.strokeStyle = '#3a3428'; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(0, y + T * 0.90); ctx.lineTo(W, y + T * 0.90); ctx.stroke();

          // Lantern string overhead
          if (lane.type === 'safe') {
            const lC = Math.max(3, Math.floor(W / (T * 0.65)));
            const lS = W / lC;
            ctx.strokeStyle = '#4a2020'; ctx.lineWidth = 0.6;
            ctx.beginPath(); ctx.moveTo(0, y + T * 0.12); ctx.lineTo(W, y + T * 0.12); ctx.stroke();
            for (let l = 0; l < lC; l++) {
              lantern(ctx, lS * (l + 0.5), y + T * 0.12, T * 0.20);
            }
          }

          // Occasional manhole cover on sidewalk
          ctx.fillStyle = '#404040';
          dot(ctx, W * 0.72, y + T * 0.60, T * 0.10); ctx.fill();
          ctx.strokeStyle = '#555'; ctx.lineWidth = 0.6;
          for (let a = 0; a < 6; a++) {
            const ang = (a / 6) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(W * 0.72 + Math.cos(ang) * T * 0.03, y + T * 0.60 + Math.sin(ang) * T * 0.03);
            ctx.lineTo(W * 0.72 + Math.cos(ang) * T * 0.09, y + T * 0.60 + Math.sin(ang) * T * 0.09);
            ctx.stroke();
          }
        }

        else if (lane.type === 'road') {
          // White edge lines
          ctx.strokeStyle = 'rgba(255,255,255,0.55)';
          ctx.lineWidth = 1.5; ctx.setLineDash([]);
          ctx.beginPath(); ctx.moveTo(0, y + T * 0.04); ctx.lineTo(W, y + T * 0.04); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(0, y + T * 0.96); ctx.lineTo(W, y + T * 0.96); ctx.stroke();
          // Subtle asphalt variation
          ctx.fillStyle = 'rgba(0,0,0,0.05)';
          for (let px = 0; px < W; px += T * 0.8) {
            ctx.fillRect(px, y + T * 0.15, T * 0.4, T * 0.70);
          }
        }
      },
    },

    // ---- CENTRAL PARK -------------------------------------------------------
    centralpark: {
      base: { safe: '#3f6212', start: '#3f6212', water: '#0e4a52' },
      tint: { road: 'rgba(22,42,14,0.16)', water: 'rgba(16,90,80,0.16)' },
      lane(ctx, lane, y, T, W) {
        if (lane.type === 'goal') {
          ctx.fillStyle = '#14361a'; ctx.fillRect(0, y, W, T * 0.20);
          for (let cx2 = 10; cx2 < W + 10; cx2 += 24) tree(ctx, cx2, y + T * 0.30, T * 0.34);
        } else if (lane.type === 'safe' || lane.type === 'start') {
          for (let bx = 6; bx < W; bx += 26) {
            ctx.fillStyle = '#166534'; rr(ctx, bx, y + T * 0.04, T * 0.46, T * 0.20, 4); ctx.fill();
            ctx.fillStyle = '#22c55e'; rr(ctx, bx, y + T * 0.04, T * 0.46, T * 0.07, 4); ctx.fill();
          }
          const cols = ['#f9a8d4', '#fde68a', '#fca5a5'];
          let i = 0;
          for (let fx = 14; fx < W; fx += 19) { ctx.fillStyle = cols[i++ % cols.length]; dot(ctx, fx, y + T * 0.82, 2); ctx.fill(); }
        } else if (lane.type === 'water') {
          ctx.fillStyle = 'rgba(190,242,255,0.14)';
          for (let gx = 12; gx < W; gx += 27) { dot(ctx, gx, y + T * 0.6, 2.4); ctx.fill(); }
        }
      },
    },

    // ---- TIMES SQUARE -------------------------------------------------------
    timessquare: {
      base: { safe: '#15132e', start: '#15132e' },
      tint: { road: 'rgba(8,8,28,0.24)', safe: 'rgba(16,16,44,0.28)', start: 'rgba(16,16,44,0.28)' },
      lane(ctx, lane, y, T, W) {
        const cols = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#ec4899', '#06b6d4'];
        if (lane.type === 'goal') {
          const n = 5, pw = W / n;
          for (let i = 0; i < n; i++) {
            const c = cols[i % cols.length];
            ctx.fillStyle = c; rr(ctx, i * pw + 3, y + 2, pw - 6, T * 0.20, 3); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.6)'; rr(ctx, i * pw + 6, y + 4, pw - 12, T * 0.05, 1); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.28)'; rr(ctx, i * pw + 6, y + T * 0.13, pw - 12, T * 0.04, 1); ctx.fill();
          }
          ctx.fillStyle = '#1c1830'; ctx.fillRect(0, y + T * 0.22, W, T * 0.05);
          let k = 0;
          for (let bx = 7; bx < W; bx += 13) { ctx.fillStyle = k++ % 2 ? '#fde68a' : '#f9a8d4'; dot(ctx, bx, y + T * 0.245, 2); ctx.fill(); }
        } else if (lane.type === 'safe' || lane.type === 'start') {
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
  };

  GOTHAM.SPRITES = SPRITES;
  GOTHAM.DECOR = DECOR;
})();
