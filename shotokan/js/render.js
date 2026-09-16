'use strict';
const INK = '#1c1815';
const COLORS = {
  gi: '#f3efe6', giShade: '#d9d3c6', giLine: '#b9b2a3',
  skin: '#e2b48c', skinShade: '#c4906a', hair: '#1f1a17',
  black: '#1c1815', red: '#c1272d',
};

// ==================== PARTICLES ====================
const particles = [];
function spawnHitSpark(x, y, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = 120 + Math.random() * 280;
    const life = 0.15 + Math.random() * 0.2;
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, life, maxLife: life,
      size: 2 + Math.random() * 3, color: Math.random() > 0.5 ? '#ffe066' : '#fff' });
  }
}
function spawnDust(x, y) {
  for (let i = 0; i < 7; i++) {
    const life = 0.25 + Math.random() * 0.3;
    particles.push({ x: x + (Math.random() - 0.5) * 40, y, vx: (Math.random() - 0.5) * 120, vy: -30 - Math.random() * 60,
      life, maxLife: life, size: 3 + Math.random() * 5, color: '#8a7050' });
  }
}
function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}
function drawParticles(ctx) {
  for (const p of particles) {
    const a = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = a; ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size * a, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ==================== FIGHTER (cel-shaded, outlined) ====================
function limbPath(ctx, a, b, w1, w2) {
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  ctx.beginPath();
  ctx.moveTo(a.x + nx * w1 / 2, a.y + ny * w1 / 2);
  ctx.lineTo(b.x + nx * w2 / 2, b.y + ny * w2 / 2);
  ctx.arc(b.x, b.y, w2 / 2, Math.atan2(ny, nx), Math.atan2(-ny, -nx), true);
  ctx.lineTo(a.x - nx * w1 / 2, a.y - ny * w1 / 2);
  ctx.arc(a.x, a.y, w1 / 2, Math.atan2(-ny, -nx), Math.atan2(ny, nx), true);
  ctx.closePath();
}
function limb(ctx, a, b, w1, w2, fill, shade) {
  limbPath(ctx, a, b, w1, w2);
  ctx.fillStyle = fill; ctx.fill();
  if (shade) {
    ctx.save(); ctx.clip();
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    ctx.beginPath();
    ctx.moveTo(a.x + nx * w1 * 0.15, a.y + ny * w1 * 0.15);
    ctx.lineTo(b.x + nx * w2 * 0.15, b.y + ny * w2 * 0.15);
    ctx.lineTo(b.x + nx * w2, b.y + ny * w2);
    ctx.lineTo(a.x + nx * w1, a.y + ny * w1);
    ctx.closePath(); ctx.fillStyle = shade; ctx.fill();
    ctx.restore();
  }
  ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineJoin = 'round';
  limbPath(ctx, a, b, w1, w2); ctx.stroke();
}
function fist(ctx, p, f, r, open, far) {
  ctx.fillStyle = far ? COLORS.skinShade : COLORS.skin; ctx.strokeStyle = INK; ctx.lineWidth = 2;
  ctx.beginPath();
  if (open) ctx.ellipse(p.x + 2 * f, p.y, r * 1.5, r * 0.75, 0, 0, Math.PI * 2);
  else ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  if (!open) {
    ctx.beginPath();
    ctx.moveTo(p.x + r * 0.2 * f, p.y - r * 0.6); ctx.lineTo(p.x + r * 0.9 * f, p.y - r * 0.2);
    ctx.moveTo(p.x + r * 0.1 * f, p.y + r * 0.1); ctx.lineTo(p.x + r * 0.9 * f, p.y + r * 0.35);
    ctx.lineWidth = 1.2; ctx.stroke();
  }
}
function foot(ctx, k, p, f, big, far) {
  // toes always point forward (towards the opponent)
  const fx = f, fy = 0;
  const s = big ? 1.6 : 1;
  ctx.fillStyle = far ? COLORS.skinShade : COLORS.skin; ctx.strokeStyle = INK; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(p.x - fx * 6 * s, p.y - fy * 6 * s);
  ctx.quadraticCurveTo(p.x + fx * 12 * s - fy * 6 * s, p.y + fy * 12 * s + fx * 6 * s, p.x + fx * 16 * s, p.y + fy * 16 * s + 1);
  ctx.quadraticCurveTo(p.x + fx * 8 * s + fy * 5 * s, p.y + fy * 8 * s - fx * 5 * s, p.x - fx * 6 * s + fy * 5 * s, p.y - fy * 6 * s - fx * 5 * s);
  ctx.closePath(); ctx.fill(); ctx.stroke();
}

// front view (kata facing the camera): joints 4-6/10-12 are the screen-right arm/leg, 7-9/13-15 the left ones
function drawFighterFront(ctx, fighter) {
  const pose = fighter.pose, f = fighter.facing, gx = fighter.x, gy = GROUND;
  const meta = POSE_META[fighter.poseName] || {};
  const S = SCALE;
  const J = (i) => ({ x: gx + pose[i * 2] * f * S, y: gy - pose[i * 2 + 1] * S });
  const belt = fighter.beltColor === 'red' ? COLORS.red : COLORS.black;
  const open = meta.openHands;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath(); ctx.ellipse(gx, gy + 3, 46 * S, 6 * S, 0, 0, Math.PI * 2); ctx.fill();

  const chest = J(1), neck = J(2), head = J(3);
  // pose-space sides; when mirrored (f < 0) the pose's right side is on screen-left,
  // so the jacket/belt geometry below always uses the screen-right ("R") set
  const pR = { s: J(4), e: J(5), h: J(6), hip: J(10), k: J(11), f: J(12) };
  const pL = { s: J(7), e: J(8), h: J(9), hip: J(13), k: J(14), f: J(15) };
  const R = f > 0 ? pR : pL, Lt = f > 0 ? pL : pR;
  const sR = R.s, eR = R.e, hR = R.h, sL = Lt.s, eL = Lt.e, hL = Lt.h;
  const hipR = R.hip, kR = R.k, fR = R.f, hipL = Lt.hip, kL = Lt.k, fL = Lt.f;
  const legW = 19 * S, shinW = 15 * S, armW = 13 * S, foreW = 10 * S;

  const frontFoot = (k, p) => {
    ctx.fillStyle = COLORS.skin; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(p.x, p.y + 2, 9 * S, 6 * S, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  };
  const leg = (hip, k, ft) => {
    limb(ctx, hip, k, legW, legW - 2, COLORS.gi, COLORS.giShade);
    limb(ctx, k, ft, shinW, shinW - 2, COLORS.gi, COLORS.giShade);
    frontFoot(k, ft);
  };
  const arm = (s, e, h) => {
    limb(ctx, s, e, armW, armW - 1, COLORS.gi, COLORS.giShade);
    limb(ctx, e, h, foreW, foreW - 2, COLORS.skin, COLORS.skinShade);
    fist(ctx, h, 1, 6.5 * S, open);
  };

  // draw order in pose space: the pose's left leg crosses in front when meta.frontLeg === 'L'
  const first = meta.frontLeg === 'L' ? [pR.hip, pR.k, pR.f] : [pL.hip, pL.k, pL.f];
  const second = meta.frontLeg === 'L' ? [pL.hip, pL.k, pL.f] : [pR.hip, pR.k, pR.f];
  drawHead();
  leg(...first); leg(...second);

  // jacket, symmetric, hem below the belt
  const hemR = { x: hipR.x + 8 * S, y: hipR.y + 16 * S }, hemL = { x: hipL.x - 8 * S, y: hipL.y + 16 * S };
  ctx.beginPath();
  ctx.moveTo(sR.x + 6 * S, sR.y - 4 * S);
  ctx.quadraticCurveTo(chest.x + 22 * S, chest.y, hemR.x, hemR.y);
  ctx.lineTo(hemL.x, hemL.y);
  ctx.quadraticCurveTo(chest.x - 22 * S, chest.y, sL.x - 6 * S, sL.y - 4 * S);
  ctx.closePath();
  ctx.fillStyle = COLORS.gi; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
  // lapels: V from the neck meeting at the chest, then one overlap line down to the belt
  const vx = chest.x + 2 * S, vy = chest.y - 10 * S;
  ctx.beginPath();
  ctx.moveTo(neck.x - 9 * S, neck.y - 2 * S); ctx.lineTo(vx, vy);
  ctx.moveTo(neck.x + 9 * S, neck.y - 2 * S); ctx.lineTo(vx, vy);
  ctx.lineTo(vx, (hipR.y + hipL.y) / 2 - 10 * S);
  ctx.strokeStyle = COLORS.giLine; ctx.lineWidth = 1.6; ctx.stroke();
  // belt with a centered knot and two tails
  const by = (hipR.y + hipL.y) / 2 - 8 * S;
  ctx.fillStyle = belt; ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.rect(hipL.x - 8 * S, by - 4 * S, (hipR.x - hipL.x) + 16 * S, 8 * S); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(chest.x, by, 5 * S, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = belt; ctx.lineWidth = 4 * S; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(chest.x, by + 2 * S); ctx.lineTo(chest.x - 7 * S, by + 22 * S);
  ctx.moveTo(chest.x, by + 2 * S); ctx.lineTo(chest.x + 7 * S, by + 22 * S); ctx.stroke();
  ctx.lineCap = 'butt';

  arm(sL, eL, hL); arm(sR, eR, hR);
  ctx.restore();

  // head is drawn first so every arm passes in front of it
  function drawHead() {
  const r = 15 * S;
  ctx.fillStyle = COLORS.skin; ctx.strokeStyle = INK; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(head.x, head.y, r * 0.95, r * 1.05, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = COLORS.hair;
  ctx.beginPath();
  ctx.moveTo(head.x - r, head.y - r * 0.2);
  ctx.lineTo(head.x - r * 1.1, head.y - r * 0.8);
  ctx.lineTo(head.x - r * 0.6, head.y - r * 1.05);
  ctx.lineTo(head.x - r * 0.35, head.y - r * 1.4);
  ctx.lineTo(head.x, head.y - r * 1.1);
  ctx.lineTo(head.x + r * 0.35, head.y - r * 1.4);
  ctx.lineTo(head.x + r * 0.6, head.y - r * 1.05);
  ctx.lineTo(head.x + r * 1.1, head.y - r * 0.8);
  ctx.lineTo(head.x + r, head.y - r * 0.2);
  ctx.quadraticCurveTo(head.x, head.y - r * 0.55, head.x - r, head.y - r * 0.2);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK;
  ctx.beginPath(); ctx.ellipse(head.x - r * 0.4, head.y + 1, 2.2 * S, 3 * S, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(head.x + r * 0.4, head.y + 1, 2.2 * S, 3 * S, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(head.x - r * 0.65, head.y - r * 0.3); ctx.lineTo(head.x - r * 0.15, head.y - r * 0.2);
  ctx.moveTo(head.x + r * 0.65, head.y - r * 0.3); ctx.lineTo(head.x + r * 0.15, head.y - r * 0.2); ctx.stroke();
  ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(head.x - r * 0.25, head.y + r * 0.55); ctx.lineTo(head.x + r * 0.25, head.y + r * 0.55); ctx.stroke();
  }
}

function drawFighter(ctx, fighter) {
  if (fighter.view === 'front') return drawFighterFront(ctx, fighter);
  const pose = fighter.pose, f = fighter.facing, gx = fighter.x, gy = GROUND;
  const meta = POSE_META[fighter.poseName] || {};
  const S = SCALE;
  const J = (i) => ({ x: gx + pose[i * 2] * f * S, y: gy - pose[i * 2 + 1] * S });
  const belt = fighter.beltColor === 'red' ? COLORS.red : COLORS.black;
  const open = meta.openHands;

  ctx.save();
  if (fighter.hitFlash > 0 && Math.floor(performance.now() / 30) % 2 === 0) ctx.globalAlpha = 0.55;

  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath(); ctx.ellipse(gx, gy + 3, 34 * S, 6 * S, 0, 0, Math.PI * 2); ctx.fill();

  const hip = J(0), chest = J(1), neck = J(2), head = J(3);
  const sF = J(4), eF = J(5), hF = J(6), sB = J(7), eB = J(8), hB = J(9);
  const hipF = J(10), kF = J(11), fF = J(12), hipB = J(13), kB = J(14), fB = J(15);
  const legW = 19 * S, shinW = 15 * S, armW = 13 * S, foreW = 10 * S;

  // camera side is the rear side of the body: rear arm (hikite) and rear leg are near and drawn last;
  // the lead arm (guard) and lead leg are on the far side, drawn behind the jacket but visible as they extend forward
  const drawFarLeg = () => {
    limb(ctx, hipF, kF, legW, legW - 2, COLORS.giShade, null);
    limb(ctx, kF, fF, shinW, shinW - 2, COLORS.giShade, null);
    foot(ctx, kF, fF, f, false, true);
  };
  const drawFarArm = () => {
    limb(ctx, sF, eF, armW, armW - 1, COLORS.giShade, null);
    limb(ctx, eF, hF, foreW, foreW - 2, COLORS.skinShade, null);
    fist(ctx, hF, f, 6.5 * S, open, true);
  };
  const drawNearLeg = () => {
    const m = meta.depthLeg ? 1.45 : 1;
    limb(ctx, hipB, kB, legW * m, (legW - 2) * m, COLORS.gi, COLORS.giShade);
    limb(ctx, kB, fB, shinW * m, (shinW - 2) * m, COLORS.gi, COLORS.giShade);
    foot(ctx, kB, fB, f, meta.depthLeg, false);
  };
  const drawNearArm = () => {
    limb(ctx, sB, eB, armW, armW - 1, COLORS.gi, COLORS.giShade);
    limb(ctx, eB, hB, foreW, foreW - 2, COLORS.skin, COLORS.skinShade);
    fist(ctx, hB, f, 6.5 * S, open, false);
  };

  drawHead();
  drawFarLeg();
  drawFarArm();

  // jacket: shoulders -> hips, hem skirt below belt
  const hemF = { x: hipF.x + 6 * f * S, y: hipF.y + 16 * S }, hemB = { x: hipB.x - 8 * f * S, y: hipB.y + 16 * S };
  ctx.beginPath();
  ctx.moveTo(sF.x + 6 * f * S, sF.y - 4 * S);
  ctx.quadraticCurveTo(chest.x + 14 * f * S, chest.y, hemF.x, hemF.y);
  ctx.lineTo(hemB.x, hemB.y);
  ctx.quadraticCurveTo(chest.x - 16 * f * S, chest.y, sB.x - 6 * f * S, sB.y - 4 * S);
  ctx.closePath();
  ctx.fillStyle = COLORS.gi; ctx.fill();
  ctx.save(); ctx.clip();
  ctx.fillStyle = COLORS.giShade;
  ctx.beginPath();
  ctx.moveTo(sB.x - 8 * f * S, sB.y - 6 * S); ctx.lineTo(chest.x - 4 * f * S, chest.y - 10 * S);
  ctx.lineTo(hemB.x + 10 * f * S, hemB.y + 4 * S); ctx.lineTo(hemB.x - 10 * f * S, hemB.y + 4 * S); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
  // lapels
  ctx.beginPath();
  ctx.moveTo(neck.x - 7 * f * S, neck.y - 2 * S); ctx.lineTo(chest.x + 4 * f * S, chest.y - 2 * S);
  ctx.lineTo(chest.x + 4 * f * S, hip.y + 4 * S);
  ctx.moveTo(neck.x + 7 * f * S, neck.y - 2 * S); ctx.lineTo(chest.x + 4 * f * S, chest.y - 2 * S);
  ctx.strokeStyle = COLORS.giLine; ctx.lineWidth = 1.6; ctx.stroke();
  // belt
  const bt = 0.72, bb = 0.8;
  const L = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  const b1 = L(sF, hipF, bt), b2 = L(sB, hipB, bt), b3 = L(sB, hipB, bb), b4 = L(sF, hipF, bb);
  ctx.beginPath();
  ctx.moveTo(b1.x + 7 * f * S, b1.y); ctx.lineTo(b2.x - 9 * f * S, b2.y); ctx.lineTo(b3.x - 9 * f * S, b3.y); ctx.lineTo(b4.x + 7 * f * S, b4.y);
  ctx.closePath(); ctx.fillStyle = belt; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke();
  const kx = (b1.x + b4.x) / 2 + 4 * f * S, ky = (b1.y + b4.y) / 2;
  ctx.strokeStyle = belt; ctx.lineWidth = 4 * S; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(kx + 6 * f * S, ky + 18 * S);
  ctx.moveTo(kx, ky); ctx.lineTo(kx - 8 * f * S, ky + 20 * S); ctx.stroke();
  ctx.lineCap = 'butt';

  drawNearLeg();
  drawNearArm();
  ctx.restore();

  // head is drawn first so every arm passes in front of it
  function drawHead() {
  const r = 15 * S;
  ctx.fillStyle = COLORS.skin; ctx.strokeStyle = INK; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(head.x - r, head.y - 2);
  ctx.quadraticCurveTo(head.x - r, head.y + r * 1.1, head.x + 3 * f, head.y + r * 1.05);
  ctx.quadraticCurveTo(head.x + r * 1.05 * f, head.y + r * 0.7, head.x + r * f, head.y - 2);
  ctx.arc(head.x, head.y - 2, r, f > 0 ? 0 : Math.PI, f > 0 ? Math.PI : 0, true);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // hair (spiky, anime-style)
  ctx.fillStyle = COLORS.hair;
  ctx.beginPath();
  ctx.moveTo(head.x - r * 1.05 * f, head.y + 2);
  ctx.lineTo(head.x - r * 1.15 * f, head.y - r * 0.6);
  ctx.lineTo(head.x - r * 0.7 * f, head.y - r * 0.9);
  ctx.lineTo(head.x - r * 0.45 * f, head.y - r * 1.35);
  ctx.lineTo(head.x - r * 0.05 * f, head.y - r * 1.0);
  ctx.lineTo(head.x + r * 0.35 * f, head.y - r * 1.3);
  ctx.lineTo(head.x + r * 0.55 * f, head.y - r * 0.85);
  ctx.lineTo(head.x + r * 1.0 * f, head.y - r * 0.75);
  ctx.lineTo(head.x + r * 0.7 * f, head.y - r * 0.4);
  ctx.quadraticCurveTo(head.x, head.y - r * 0.6, head.x - r * 0.6 * f, head.y - r * 0.2);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // eye + brow
  ctx.fillStyle = INK;
  ctx.beginPath(); ctx.ellipse(head.x + r * 0.45 * f, head.y + 1, 2.2 * S, 3 * S, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(head.x + r * 0.15 * f, head.y - r * 0.32); ctx.lineTo(head.x + r * 0.75 * f, head.y - r * 0.2); ctx.stroke();
  ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(head.x + r * 0.35 * f, head.y + r * 0.55); ctx.lineTo(head.x + r * 0.7 * f, head.y + r * 0.5); ctx.stroke();
  }
}

// ==================== TIGER EMBLEM (original, Shotokan-inspired) ====================
const tigerImg = new Image();
tigerImg.src = 'pic/logo.png';
function drawTiger(ctx, cx, cy, R, color) {
  if (tigerImg.complete && tigerImg.naturalWidth > 0) {
    const ar = tigerImg.naturalWidth / tigerImg.naturalHeight;
    const w = ar >= 1 ? R * 2 : R * 2 * ar, h = ar >= 1 ? R * 2 / ar : R * 2;
    ctx.drawImage(tigerImg, cx - w / 2, cy - h / 2, w, h);
    return;
  }
  ctx.save();
  ctx.translate(cx, cy);
  const s = R / 60;
  ctx.scale(s, s);
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const bg = '#0a0e16';
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(0, 0, 56, 0.35, Math.PI * 2 - 0.55); ctx.stroke();
  // prowling tiger: head left, arched back, tail curling up on the right
  ctx.beginPath();
  ctx.moveTo(-22, -8);
  ctx.bezierCurveTo(-14, -30, 12, -38, 32, -26);
  ctx.bezierCurveTo(44, -18, 48, -4, 44, 8);
  ctx.bezierCurveTo(50, 4, 58, -10, 52, -26);
  ctx.bezierCurveTo(62, -12, 58, 10, 44, 16);
  ctx.bezierCurveTo(46, 24, 44, 32, 46, 38);
  ctx.lineTo(34, 38);
  ctx.bezierCurveTo(32, 30, 32, 24, 30, 18);
  ctx.bezierCurveTo(24, 26, 20, 32, 22, 40);
  ctx.lineTo(10, 40);
  ctx.bezierCurveTo(8, 30, 10, 22, 8, 16);
  ctx.bezierCurveTo(0, 22, -12, 22, -18, 18);
  ctx.bezierCurveTo(-16, 26, -14, 34, -8, 42);
  ctx.lineTo(-20, 42);
  ctx.bezierCurveTo(-26, 34, -28, 26, -26, 18);
  ctx.lineTo(-30, 10);
  ctx.closePath(); ctx.fill();
  // head with round ears and open jaw
  ctx.beginPath(); ctx.arc(-32, -4, 20, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-44, -22, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-24, -24, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-48, 4); ctx.bezierCurveTo(-58, 8, -58, 18, -46, 22);
  ctx.lineTo(-30, 12); ctx.closePath(); ctx.fill();
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.moveTo(-52, 8); ctx.lineTo(-34, 10); ctx.lineTo(-48, 18); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.arc(-44, -20, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-24, -22, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-38, -8, 3, 2.2, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-46, 0, 2, 0, Math.PI * 2); ctx.fill();
  // stripes
  ctx.strokeStyle = bg; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-8, -28); ctx.quadraticCurveTo(-4, -18, -8, -8);
  ctx.moveTo(6, -32); ctx.quadraticCurveTo(10, -20, 6, -10);
  ctx.moveTo(20, -30); ctx.quadraticCurveTo(24, -18, 20, -8);
  ctx.moveTo(34, -22); ctx.quadraticCurveTo(36, -12, 32, -2);
  ctx.moveTo(-20, -14); ctx.quadraticCurveTo(-16, -6, -20, 2);
  ctx.stroke();
  ctx.restore();
}

// ==================== DOJO ====================
function drawDojo(ctx) {
  const wall = ctx.createLinearGradient(0, 0, 0, GROUND);
  wall.addColorStop(0, '#171310'); wall.addColorStop(1, '#2b2219');
  ctx.fillStyle = wall; ctx.fillRect(0, 0, W, GROUND);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2;
  for (let x = 0; x < W; x += 96) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, GROUND); ctx.stroke(); }
  ctx.fillStyle = '#3a2e22'; ctx.fillRect(0, GROUND - 70, W, 6);

  // tokonoma scroll
  const sx = W / 2;
  ctx.fillStyle = '#3a322a'; ctx.fillRect(sx - 30, 40, 60, 150);
  ctx.fillStyle = '#efe6d2'; ctx.fillRect(sx - 24, 50, 48, 130);
  ctx.font = 'bold 34px serif'; ctx.fillStyle = '#1a1510'; ctx.textAlign = 'center';
  ctx.fillText('空', sx, 96); ctx.fillText('手', sx, 136);
  ctx.fillStyle = '#c1272d'; ctx.fillRect(sx + 8, 156, 10, 10);

  // tiger banners on both sides
  ctx.fillStyle = '#efe6d2';
  ctx.fillRect(120, 60, 110, 150); ctx.fillRect(W - 230, 60, 110, 150);
  drawTiger(ctx, 175, 130, 42, COLORS.red);
  drawTiger(ctx, W - 175, 130, 42, COLORS.red);
  ctx.font = '13px serif'; ctx.fillStyle = '#1a1510';
  ctx.fillText('松濤館', 175, 198); ctx.fillText('松濤館', W - 175, 198);

  const light = ctx.createRadialGradient(W / 2, 0, 10, W / 2, 0, 520);
  light.addColorStop(0, 'rgba(255,235,190,0.07)'); light.addColorStop(1, 'rgba(255,235,190,0)');
  ctx.fillStyle = light; ctx.fillRect(0, 0, W, GROUND);

  // tatami floor
  const floor = ctx.createLinearGradient(0, GROUND, 0, H);
  floor.addColorStop(0, '#8a9a5a'); floor.addColorStop(1, '#5e6b3c');
  ctx.fillStyle = floor; ctx.fillRect(0, GROUND, W, H - GROUND);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2;
  for (let x = 0; x <= W; x += 160) { ctx.beginPath(); ctx.moveTo(x, GROUND); ctx.lineTo(x, H); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1;
  for (let y = GROUND + 8; y < H; y += 8) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.fillStyle = '#c1272d'; ctx.fillRect(0, GROUND - 2, W, 4);
}

// ==================== HUD ====================
function drawHUD(ctx, game) {
  const p1 = game.p1, p2 = game.p2;
  ctx.textAlign = 'left';
  ctx.font = 'bold 14px "SF Mono", "Cascadia Code", monospace';
  ctx.fillStyle = '#f3efe6'; ctx.fillText(p1.label, 30, 34);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#e88a8a'; ctx.fillText(p2.label + '  ·  LEVEL ' + game.level, W - 30, 34);

  ctx.font = 'bold 52px "Georgia", serif';
  ctx.textAlign = 'left'; ctx.fillStyle = '#f3efe6'; ctx.fillText(String(p1.score), 30, 80);
  ctx.textAlign = 'right'; ctx.fillStyle = '#e06060'; ctx.fillText(String(p2.score), W - 30, 80);
  ctx.font = '11px "SF Mono", monospace'; ctx.fillStyle = '#8a7a6a';
  ctx.textAlign = 'left'; ctx.fillText('KURO-OBI', 30, 96);
  ctx.textAlign = 'right'; ctx.fillText('AKA-OBI', W - 30, 96);

  ctx.textAlign = 'center';
  // status line on the tatami strip, clear of the announcements
  if (game.mode === 'ippon') {
    if (game.ippon) {
      const cpu = game.ippon.attacker === 'cpu';
      ctx.font = 'bold 14px "SF Mono", monospace'; ctx.fillStyle = cpu ? '#e06060' : '#f3efe6';
      ctx.fillText(cpu ? 'AKA ATTACKS  →  defend' : 'SHIRO ATTACKS  →  your technique', W / 2, GROUND + 34);
    }
  } else {
    ctx.font = 'bold 30px "SF Mono", monospace'; ctx.fillStyle = '#d4a843';
    ctx.fillText(String(Math.ceil(Math.max(0, game.timer))).padStart(2, '0'), W / 2, GROUND + 40);
    ctx.font = '11px "SF Mono", monospace'; ctx.fillStyle = '#8a7a6a';
    ctx.fillText('FIRST TO ' + WIN_POINTS, W / 2, GROUND + 56);
  }

  for (const f of [p1, p2]) {
    if (f.moveNameTimer > 0 && f.lastMoveName) {
      ctx.globalAlpha = Math.min(1, f.moveNameTimer / 0.3);
      ctx.font = 'bold 15px "SF Mono", monospace'; ctx.fillStyle = '#d4a843';
      ctx.fillText(f.lastMoveName, f.x, GROUND - 215 * SCALE);
      ctx.globalAlpha = 1;
    }
  }
  if (game.calloutTimer > 0) {
    ctx.globalAlpha = Math.min(1, game.calloutTimer / 0.3);
    ctx.font = 'bold 20px "SF Mono", monospace'; ctx.fillStyle = '#7fc8f0';
    ctx.fillText(game.callout, game.calloutX, GROUND - 240 * SCALE);
    ctx.globalAlpha = 1;
  }
  drawAudioStatus(ctx);
}

function drawAnnounce(ctx, text, sub, alpha) {
  ctx.globalAlpha = alpha; ctx.textAlign = 'center';
  ctx.font = 'bold 60px "Georgia", serif'; ctx.fillStyle = '#d4a843';
  ctx.fillText(text, W / 2, H / 2 - 20);
  if (sub) { ctx.font = '18px "SF Mono", monospace'; ctx.fillStyle = '#e8e0d0'; ctx.fillText(sub, W / 2, H / 2 + 22); }
  ctx.globalAlpha = 1;
}

// ==================== TITLE ====================
function drawTitle(ctx, game, kata) {
  ctx.fillStyle = '#0a0e16'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#131a24'; ctx.fillRect(0, GROUND, W, H - GROUND);
  ctx.fillStyle = '#c1272d'; ctx.fillRect(0, GROUND - 2, W, 3);

  drawTiger(ctx, 110, 110, 70, COLORS.red);
  ctx.textAlign = 'left';
  ctx.font = 'bold 96px "Georgia", serif'; ctx.fillStyle = '#d4a843';
  ctx.fillText('KIME', 210, 130);
  ctx.font = '15px "SF Mono", "Cascadia Code", monospace'; ctx.fillStyle = '#8a7a6a';
  ctx.fillText('SHOTOKAN KUMITE  ·  NAGE-WAZA', 214, 160);
  ctx.font = '26px serif'; ctx.fillStyle = 'rgba(212,168,67,0.35)'; ctx.fillText('極め', 214, 196);

  // kata demo figure + label
  if (kata) {
    drawFighter(ctx, kata.fighter);
    ctx.textAlign = 'center';
    ctx.font = 'bold 15px "SF Mono", monospace'; ctx.fillStyle = '#d4a843';
    ctx.fillText(kata.name, kata.fighter.x, GROUND + 30);
    ctx.font = '13px "SF Mono", monospace'; ctx.fillStyle = '#8a7a6a';
    ctx.fillText(kata.label, kata.fighter.x, GROUND + 50);
  }

  // key guide
  const kx = 40, ky = 250;
  ctx.textAlign = 'left';
  ctx.font = 'bold 13px "SF Mono", monospace'; ctx.fillStyle = '#e8e0d0';
  ctx.fillText('CONTROLS', kx, ky);
  ctx.font = '12px "SF Mono", monospace';
  const rows = [
    ['↑ (tap)', 'Kizami-zuki jodan, or gyaku-zuki stepping through into jun-zuki'],
    ['→', 'Oi-zuki chudan (steps in, zenkutsu-dachi)'],
    ['↓ + →  /  ↑ + →', 'Gyaku-zuki chudan / jodan'],
    ['SPACE', 'Mae-geri (front leg, belt height)'],
    ['↑ + SPACE', 'Mawashi-geri jodan (rear leg, pivoting)'],
    ['←', 'Uchi-uke (stops chudan) · step back'],
    ['← + ↑', 'Age-uke (stops jodan)'],
    ['← + ↓', 'Gedan-barai (stops mae-geri)'],
    ['', 'Correct uke = automatic counter: gyaku-zuki or nage-waza'],
    ['M', 'music   ·   ESC  back to this screen'],
    ['K', 'kata viewer (step through the movements)'],
  ];
  rows.forEach((r, i) => {
    ctx.fillStyle = '#d4a843'; ctx.fillText(r[0], kx, ky + 20 + i * 15);
    ctx.fillStyle = '#9a8a7a'; ctx.fillText(r[1], kx + 130, ky + 20 + i * 15);
  });

  // mode selector
  ctx.textAlign = 'right';
  ctx.font = 'bold 13px "SF Mono", monospace'; ctx.fillStyle = '#e8e0d0';
  const my = 70;
  ctx.fillText('MODE  (↑ ↓)', W - 40, my);
  const modes = [['ippon', 'JIYU IPPON KUMITE'], ['jiyu', 'JIYU KUMITE (free)']];
  modes.forEach((m, i) => {
    const sel = game.mode === m[0];
    ctx.font = (sel ? 'bold ' : '') + '13px "SF Mono", monospace';
    ctx.fillStyle = sel ? '#d4a843' : '#665b4f';
    ctx.fillText((sel ? '▶ ' : '') + m[1], W - 40, my + 22 + i * 18);
  });
  ctx.font = '11px "SF Mono", monospace'; ctx.fillStyle = '#665b4f';
  ctx.fillText(game.mode === 'ippon' ? 'one announced attack · uke · counter · roles alternate' : 'free sparring for points', W - 40, my + 62);
  ctx.font = 'bold 12px "SF Mono", monospace'; ctx.fillStyle = '#d4a843';
  ctx.fillText('ENTER  →  LEVEL ' + game.level, W - 40, my + 86);
  ctx.textAlign = 'left';
  ctx.font = '12px "SF Mono", monospace'; ctx.fillStyle = '#8a7a6a';
  ctx.fillText('POINTS: yuko 1 (tsuki)  ·  waza-ari 2 (mae-geri, ashi-waza)  ·  ippon 3 (jodan geri, nage + todome)', kx, ky + 190);

  ctx.textAlign = 'center';
  if (Math.sin(performance.now() / 450) > 0) {
    ctx.font = 'bold 15px "SF Mono", monospace'; ctx.fillStyle = '#e8e0d0';
    ctx.fillText('PRESS  ENTER', W / 2, H - 22);
  }
  if (!audioCtx || audioCtx.state !== 'running') {
    ctx.font = '11px "SF Mono", monospace'; ctx.fillStyle = '#665b4f';
    ctx.fillText('press any key to enable sound (kiai, osu, music)', W / 2, H - 6);
  }
  drawAudioStatus(ctx);
}

// kata viewer: one figure, centred, stepped manually
function drawKataView(ctx, kata) {
  ctx.fillStyle = '#0a0e16'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#131a24'; ctx.fillRect(0, GROUND, W, H - GROUND);
  ctx.fillStyle = '#c1272d'; ctx.fillRect(0, GROUND - 2, W, 3);
  drawTiger(ctx, 70, 70, 44, COLORS.red);
  ctx.textAlign = 'center';
  ctx.font = 'bold 30px "Georgia", serif'; ctx.fillStyle = '#d4a843';
  ctx.fillText(kata.name, W / 2, 60);
  ctx.font = '12px "SF Mono", monospace'; ctx.fillStyle = '#8a7a6a';
  ctx.fillText('KATA  ' + (KATAS.indexOf(kata.kata) + 1) + ' / ' + KATAS.length + '   ·   movement ' + (kata.i + 1) + ' / ' + kata.kata.steps.length, W / 2, 82);
  drawFighter(ctx, kata.fighter);
  ctx.textAlign = 'center';
  ctx.font = 'bold 18px "SF Mono", monospace'; ctx.fillStyle = '#e8e0d0';
  ctx.fillText(kata.label, W / 2, GROUND + 34);
  ctx.font = '11px "SF Mono", monospace'; ctx.fillStyle = '#665b4f';
  ctx.fillText('← →  step   ·   ↑ ↓  kata   ·   SPACE  ' + (kata.manual ? 'play' : 'pause') + '   ·   ESC  back', W / 2, H - 22);
  drawAudioStatus(ctx);
}

function drawAudioStatus(ctx) {
  ctx.textAlign = 'right';
  ctx.font = '10px "SF Mono", monospace'; ctx.fillStyle = '#665b4f';
  const st = audioCtx ? audioCtx.state : 'off';
  ctx.fillText('♪ audio: ' + st + (MUSIC.playing ? ' · music on · step ' + MUSIC.step : ' · music off (press M)'), W - 8, H - 6);
}
