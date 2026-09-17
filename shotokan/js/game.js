'use strict';
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
canvas.width = W; canvas.height = H;

const keys = {};
const justPressed = {};
let dtGlobal = 1 / 60;
window.addEventListener('keydown', e => {
  if (!keys[e.code]) justPressed[e.code] = true;
  keys[e.code] = true;
  if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
  unlockAudio();
  if (e.code === 'KeyM') { MUSIC.toggle(); MUSIC.userStopped = !MUSIC.playing; }
});
// browsers only allow sound after a user gesture: the first key or click turns everything on
function unlockAudio() {
  ensureAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  if (!MUSIC.playing && !MUSIC.userStopped) MUSIC.start();
}
window.addEventListener('pointerdown', unlockAudio);
window.addEventListener('touchstart', unlockAudio, { passive: true });
// ↑ tapped alone (short, released without a combo key) fires the kizami-zuki
let upDownAt = 0, upCombo = false;
window.addEventListener('keydown', e => {
  if (e.repeat) return;
  if (e.code === 'ArrowUp') { upDownAt = performance.now(); upCombo = false; }
  else if (keys['ArrowUp'] && (e.code === 'Space' || e.code === 'ArrowRight' || e.code === 'ArrowLeft')) upCombo = true;
});
window.addEventListener('keyup', e => {
  keys[e.code] = false;
  if (e.code === 'ArrowUp' && !upCombo && performance.now() - upDownAt < 300 && !keys['ArrowLeft'] && !keys['ArrowRight']) justPressed['KizamiTap'] = true;
});
function consumePress(code) {
  if (justPressed[code]) { justPressed[code] = false; return true; }
  return false;
}

const POINT_NAMES = { 1: 'YUKO', 2: 'WAZA-ARI', 3: 'IPPON' };
const MAX_LEVEL = 10;
// per-level CPU opponents for kumite / ippon kumite (never in the dojo). Each is a distinct look.
const OPPONENTS = {
  1: { label: 'CPU' },
  2: { label: 'KENJI', hair: '#e6c85c' },                                   // blond guy
  3: { label: 'MAYU', hair: '#3a2a1c', longHair: true },                    // brunette girl
  4: { label: 'JABARI', skin: '#7a4a2c', skinShade: '#5a3620', hair: '#141013' }, // black boy
  5: { label: 'ANNA', hair: '#ecd47a', longHair: true },                    // blonde girl
  6: { label: 'TARO', build: 'heavy', hair: '#2a221c' },                    // chubby guy
  7: { label: 'SENSEI', hair: '#3a352c', hachimaki: true, belt: 'black' },  // sensei with headband
  8: { label: 'AKAI', gi: '#b53530', giShade: '#8c2622', giLine: '#e2a6a6', hair: '#e6c85c' }, // red gi, blond
  9: { label: 'LAWRENCE', hair: '#ecd47a', hachimaki: true, belt: 'black' },// blond sensei with headband
  10: { label: 'SILVER', hair: '#241f1b', longHair: true, heightScale: 1.12, smirk: true }, // tall villain, ponytail
};
const MODE_LABELS = {
  ippon: 'JIYU IPPON KUMITE', jiyu: 'JIYU KUMITE (free)', dojo: 'DOJO (belt training)',
  rumble: 'RUMBLE (no stop, combos)',
};

const game = {
  state: 'title',
  p1: null, p2: null,
  ai: new AIController(),
  kata: null,
  level: 1,
  timer: ROUND_TIME,
  announceText: '', announceSub: '', announceTimer: 0,
  callout: '', calloutX: 0, calloutTimer: 0,
  hitPause: 0, screenShake: 0, stateTimer: 0,
  pointWinner: null,
  dojo: null, dojoReturn: false, forceThrowCounter: false, suppressCounter: false,

  // hand control to a real kumite match from inside the dojo; endMatch()/matchEnd hand it back
  enterDojoMatch(mode, level) {
    this.dojoReturn = true;
    this.forceThrowCounter = false;
    this.suppressCounter = false;
    MUSIC.setMode('combat');
    this.mode = mode;
    this.level = level;
    if (!this.p1 || !this.p2) this.init();
    // always refresh the player's belt from saved progress — reusing an earlier match's
    // fighter must never show a stale (lower) belt
    this.p1.beltColor = this.dojo ? BELTS[this.dojo.loadBelt()].id : 'black';
    this.startMatch();
  },

  init() {
    // kumite and ippon kumite show the belt actually earned in the dojo, not a fixed black
    const beltId = this.dojo ? BELTS[this.dojo.loadBelt()].id : 'black';
    this.p1 = new Fighter({ x: START_P1, facing: 1, isPlayer: true, beltColor: beltId, kiaiPitch: 1.0, label: 'P1' });
    this.p2 = new Fighter({ x: START_P2, facing: -1, isPlayer: false, beltColor: 'red', kiaiPitch: 0.8, label: 'CPU' });
  },

  // ippon kumite starts inside one step-in distance so a single attack can reach
  get marks() { return this.mode === 'ippon' ? [385, 575] : [START_P1, START_P2]; },

  // available title modes; RUMBLE (continuous free kumite) unlocks once black belt is earned
  get modes() {
    const m = ['ippon', 'jiyu', 'dojo'];
    if (this.dojo && this.dojo.loadBelt() >= BELTS.length - 1) m.push('rumble');
    return m;
  },

  // give the opponent its per-level look (kumite/ippon only; the dojo keeps a plain rival)
  applyOpponentLook(level) {
    const o = OPPONENTS[level] || OPPONENTS[1];
    const p = this.p2;
    p.skin = o.skin; p.skinShade = o.skinShade; p.hair = o.hair;
    p.gi = o.gi; p.giShade = o.giShade; p.giLine = o.giLine;
    p.longHair = !!o.longHair; p.build = o.build || null; p.heightScale = o.heightScale || 1;
    p.hachimaki = !!o.hachimaki; p.smirk = !!o.smirk;
    p.beltColor = o.belt || 'red';
    p.label = o.label || 'CPU';
  },

  startMatch() {
    this.p1.reset(this.marks[0], 1); this.p2.reset(this.marks[1], -1);
    this.p1.score = 0; this.p2.score = 0;
    // themed opponent by level in kumite/ippon; the dojo keeps a plain rival
    this.applyOpponentLook(this.dojoReturn ? 1 : this.level);
    this.ai.level = this.level;
    this.timer = ROUND_TIME;
    this.state = 'rei';
    this.stateTimer = 2.6;
    for (const f of [this.p1, this.p2]) { f.state = 'rei'; f.setPose('shizentai', 6); }
    this.announce('LEVEL ' + this.level, 'Rei · OSU!', 2.4);
    setTimeout(() => { for (const f of [this.p1, this.p2]) f.setPose('rei', 5); SFX.osu(1); SFX.osu(0.82); }, 900);
    setTimeout(() => { for (const f of [this.p1, this.p2]) f.setPose('shizentai', 5); }, 1900);
  },

  hajime(sub) {
    this.state = 'fight';
    for (const f of [this.p1, this.p2]) { f.state = 'idle'; f.setPose('idle', 8); }
    this.announce(sub ? 'TSUZUKETE HAJIME' : 'HAJIME', '', 0.9);
    if (this.mode === 'ippon') this.startExchange();
  },

  // jiyu ippon kumite: one announced attack, the defender answers with uke + counter, roles alternate
  mode: 'ippon',
  ippon: null,
  // the higher the level, the less time passes between the call and the CPU actually stepping in
  ipponReactDelay: [0, 2.4, 1.1, 0.7, 0.62, 0.56, 0.5, 0.46, 0.42, 0.4, 0.38],
  startExchange() {
    const attacker = this.ippon && this.ippon.attacker === 'cpu' ? 'p1' : 'cpu';
    const delay = this.ipponReactDelay[this.level] || 0.7;
    this.ippon = { attacker, phase: 'announce', timer: attacker === 'cpu' ? delay : 0, move: null, idleTime: 0 };
    if (attacker === 'cpu') {
      const pool = this.level === 1
        ? ['oiZuki', 'oiZuki', 'maeGeri', 'gyakuZuki', 'gyakuZukiJodan']
        : ['oiZuki', 'gyakuZuki', 'gyakuZukiJodan', 'maeGeri', 'mawashiGeri'];
      this.ippon.move = pool[Math.floor(Math.random() * pool.length)];
      const lvl = MOVES[this.ippon.move].level;
      const call = lvl === 'jodan' ? 'JODAN' : lvl === 'kick' ? 'MAE-GERI' : 'CHUDAN';
      this.announce(call + '!', 'AKA attacks · choose your uke', 1.3);
      setTimeout(() => SFX.kiai(0.75), 50);
    } else {
      this.announce('SHIRO ATTACKS', 'your turn · one attack', 1.3);
    }
  },
  updateIppon(dt) {
    const ip = this.ippon;
    if (!ip) return;
    if (ip.phase === 'announce') {
      ip.timer -= dt;
      if (ip.attacker === 'cpu') {
        if (ip.timer <= 0) {
          // the callout stays lit while we wait for the CPU to be free to actually step in
          if (this.p2.canAct) { this.p2.startMove(ip.move); ip.phase = 'attack'; }
          else this.announceTimer = Math.max(this.announceTimer, 0.3);
        }
      } else if (this.p1.state === 'attack') ip.phase = 'attack';
      else this.announceTimer = Math.max(this.announceTimer, 0.3);
    } else if (ip.phase === 'attack') {
      const quiet = [this.p1, this.p2].every(f => (f.state === 'idle' || f.state === 'walk' || f.state === 'block') && !f.pendingCounter);
      ip.idleTime = quiet ? ip.idleTime + dt : 0;
      if (ip.idleTime > 0.7) { this.announce('YAME', 'no point', 1.0); this.yame(); }
    }
    this.p1.attacksAllowed = ip.attacker === 'p1' && ip.phase === 'announce';
  },

  announce(text, sub, dur) { this.announceText = text; this.announceSub = sub; this.announceTimer = dur; },

  announceCounter(f) {
    this.callout = BLOCK_NAME[f.blockKind] + ' → counter';
    this.calloutX = f.x; this.calloutTimer = 1.0;
  },
  onBlock(defender, attacker, move) {
    this.callout = BLOCK_NAME[defender.blockKind] + '!';
    this.calloutX = defender.x; this.calloutTimer = 0.8;
    spawnHitSpark(defender.x + defender.facing * 30 * SCALE, GROUND - 140 * SCALE, 4);
    if (this.dojo) this.dojo.onBlockSuccess(defender, attacker, move);
  },
  onDeai(f) {
    this.callout = 'DEAI!  sen no sen';
    this.calloutX = f.x; this.calloutTimer = 1.2;
    SFX.kiai(f.kiaiPitch * 1.05);
    this.hitPause = 0.12; this.screenShake = 5;
  },
  onHit(attacker, defender, move) {
    spawnHitSpark(defender.x, GROUND - (move.level === 'jodan' ? 170 : 130) * SCALE, move.kind === 'kick' ? 14 : 8);
    this.hitPause = move.kind === 'kick' ? 0.09 : 0.05;
    this.screenShake = move.kind === 'kick' ? 6 : 3;
    if (this.dojo) this.dojo.onHit(attacker, defender, move);
  },
  // throw cinematics: slow motion on the reap, flash on landing, zoom + impact lines on the todome
  timeScale: 1, slowTimer: 0, flash: 0, zoom: null, impact: null,
  onThrowStart(tori, uke) {
    this.timeScale = 0.35; this.slowTimer = 0.55;
  },
  onThrowLand(tori, uke) {
    spawnDust(uke.x, GROUND); spawnDust(uke.x + 30, GROUND); spawnDust(uke.x - 30, GROUND);
    this.screenShake = 12; this.hitPause = 0.08; this.flash = 0.35;
    this.timeScale = 1; this.slowTimer = 0;
  },
  onTodome(tori, uke) {
    const fx = tori.x + tori.facing * 62 * SCALE, fy = GROUND - 26 * SCALE;
    this.impact = { x: fx, y: fy, timer: 0.35 };
    this.hitPause = 0.16; this.screenShake = 9; this.flash = 0.2;
    spawnHitSpark(fx, fy, 18);
    if (this.dojo) this.dojo.onThrowSuccess(tori);
  },

  scorePoint(scorer, move, victim) {
    if (this.state !== 'fight') return;
    scorer.score += move.points;
    SFX.point();
    const who = scorer === this.p1 ? 'SHIRO' : 'AKA';
    // rumble mode: the action never stops for a point — just a quick floating callout, keep fighting
    if (this.mode === 'rumble') {
      this.callout = (POINT_NAMES[move.points] || 'POINT') + '!';
      this.calloutX = scorer.x; this.calloutTimer = 0.7;
      return;
    }
    this.state = 'point';
    this.stateTimer = 1.9;
    this.pointWinner = scorer;
    this.announce(POINT_NAMES[move.points] || 'POINT', who + '  ·  ' + move.name, 1.9);
  },

  yame() {
    // back to the start marks in zenkutsu, ready to go again
    this.state = 'reset';
    this.stateTimer = 1.1;
    for (const f of [this.p1, this.p2]) {
      f.state = 'frozen'; f.moveData = null; f.pendingCounter = null; f.throwPartner = null;
      f.vx = 0; f.blockKind = null;
      f.setPose('idle', 6);
    }
    this.p1.facing = 1; this.p2.facing = -1;
  },

  endMatch() {
    const p1Wins = this.p1.score > this.p2.score;
    this.state = 'matchEnd';
    this.stateTimer = this.dojoReturn ? 3.2 : 6.5;
    for (const f of [this.p1, this.p2]) { f.state = 'frozen'; f.moveData = null; f.throwPartner = null; f.vx = 0; }
    setTimeout(() => { SFX.osu(1); SFX.osu(0.82); }, 1200);
    const backToDojo = 'back to the dojo…';
    if (p1Wins) {
      this.p1.state = 'victory'; this.p1.setPose('victory', 5);
      this.p2.setPose('rei', 5);
      SFX.win();
      this.announce('SHIRO NO KACHI', this.dojoReturn ? backToDojo : (this.level < MAX_LEVEL ? 'ENTER → level ' + (this.level + 1) : 'ALL ' + MAX_LEVEL + ' LEVELS CLEARED'), this.stateTimer);
    } else if (this.p1.score === this.p2.score) {
      for (const f of [this.p1, this.p2]) f.setPose('rei', 5);
      this.announce('HIKIWAKE', this.dojoReturn ? backToDojo : 'Draw · ENTER to replay', this.stateTimer);
    } else {
      this.p2.state = 'victory'; this.p2.setPose('victory', 5);
      this.p1.setPose('knockdown', 5);
      SFX.lose();
      this.announce('AKA NO KACHI', this.dojoReturn ? backToDojo : 'ENTER to retry the level', this.stateTimer);
    }
  },

  update(dt) {
    this.announceTimer = Math.max(0, this.announceTimer - dt);
    this.calloutTimer = Math.max(0, this.calloutTimer - dt);
    if (this.state !== 'title' && consumePress('Escape')) {
      this.state = 'title';
      this.kata = new KataPlayer();
      particles.length = 0;
      this.dojoReturn = false;
      this.forceThrowCounter = false;
      this.suppressCounter = false;
      MUSIC.setMode('combat');
      return;
    }
    const keep = this.state === 'title' ? ['Enter', 'ArrowUp', 'ArrowDown', 'KeyK']
      : this.state === 'kataView' ? ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'] : ['Enter'];
    for (const k in justPressed) if (!keep.includes(k) && this.state !== 'fight' && this.state !== 'dojo') justPressed[k] = false;

    switch (this.state) {
      case 'title':
        if (!this.kata) this.kata = new KataPlayer();
        this.kata.update(dt);
        // mode selector: ippon / free / dojo (+ rumble once black belt is earned)
        {
          const ms = this.modes;
          if (ms.indexOf(this.mode) < 0) this.mode = ms[0];
          if (consumePress('ArrowUp')) this.mode = ms[(ms.indexOf(this.mode) + ms.length - 1) % ms.length];
          if (consumePress('ArrowDown')) this.mode = ms[(ms.indexOf(this.mode) + 1) % ms.length];
        }
        if (consumePress('KeyK')) {
          this.state = 'kataView';
          this.kata = new KataPlayer();
          this.kata.manual = true;
          this.kata.fighter.x = W / 2;
          this.kata.setStep(0);
          break;
        }
        if (consumePress('Enter')) {
          this.dojoReturn = false;
          if (this.mode === 'dojo') {
            this.dojo.enter();
            this.state = 'dojo';
          } else {
            this.ippon = null;
            this.forceThrowCounter = false;
            this.suppressCounter = false;
            MUSIC.setMode('combat');
            unlockAudio();
            this.init(); this.startMatch();
          }
        }
        break;
      case 'dojo':
        this.dojo.update(dt);
        break;
      case 'kataView':
        if (consumePress('ArrowRight')) this.kata.setStep(this.kata.i + 1);
        if (consumePress('ArrowLeft')) this.kata.setStep(this.kata.i - 1);
        if (consumePress('ArrowDown')) { this.kata.switchKata(1); this.kata.fighter.x = W / 2; }
        if (consumePress('ArrowUp')) { this.kata.switchKata(-1); this.kata.fighter.x = W / 2; }
        if (consumePress('Space')) { this.kata.manual = !this.kata.manual; this.kata.t = this.kata.kata.steps[this.kata.i].dur; }
        this.kata.update(dt);
        break;
      case 'rei':
        this.stateTimer -= dt;
        this.p1.update(dt, this.p2, this); this.p2.update(dt, this.p1, this);
        if (this.stateTimer <= 0) this.hajime(false);
        break;
      case 'fight':
        if (this.mode === 'ippon') this.updateIppon(dt); else { this.timer -= dt; this.p1.attacksAllowed = true; }
        if (this.state !== 'fight') break;
        this.p1.handleInput(this.p2, this);
        this.ai.update(dt, this.p2, this.p1, this.mode === 'ippon');
        this.p1.update(dt, this.p2, this);
        this.p2.update(dt, this.p1, this);
        if (this.state !== 'fight') break;
        if (this.p1.score >= WIN_POINTS || this.p2.score >= WIN_POINTS) { this.endMatch(); break; }
        if (this.timer <= 0) { this.timer = 0; this.endMatch(); }
        break;
      case 'point':
        this.stateTimer -= dt;
        this.p1.update(dt, this.p2, this); this.p2.update(dt, this.p1, this);
        if (this.stateTimer <= 0) {
          if (this.p1.score >= WIN_POINTS || this.p2.score >= WIN_POINTS) this.endMatch();
          else this.yame();
        }
        break;
      case 'reset': {
        this.stateTimer -= dt;
        const k = Math.min(1, dt * 6);
        this.p1.x += (this.marks[0] - this.p1.x) * k; this.p2.x += (this.marks[1] - this.p2.x) * k;
        this.p1.update(dt, null, this); this.p2.update(dt, null, this);
        if (this.stateTimer <= 0) this.hajime(true);
        break;
      }
      case 'matchEnd': {
        this.stateTimer -= dt;
        this.p1.update(dt, null, this); this.p2.update(dt, null, this);
        if (this.dojoReturn) {
          if (this.stateTimer <= 0) {
            const won = this.p1.score > this.p2.score;
            this.dojoReturn = false;
            this.state = 'dojo';
            this.dojo.onMatchResult(won);
          }
          break;
        }
        const won = this.p1.score > this.p2.score;
        if (this.stateTimer <= 2.5 && consumePress('Enter')) {
          if (won && this.level < MAX_LEVEL) { this.level++; this.startMatch(); }
          else if (won) { this.level = 1; this.state = 'title'; this.kata = new KataPlayer(); }
          else this.startMatch();
        } else if (this.stateTimer <= 0) {
          // result stays on screen a few seconds, then back to the title keeping the earned level
          this.level = won ? (this.level < MAX_LEVEL ? this.level + 1 : 1) : this.level;
          this.state = 'title';
          this.kata = new KataPlayer();
        }
        break;
      }
    }
    updateParticles(dt);
    this.screenShake *= Math.pow(0.001, dt);
    const rdt = dt / this.timeScale;
    if (this.slowTimer > 0) { this.slowTimer -= rdt; if (this.slowTimer <= 0) this.timeScale = 1; }
    this.flash = Math.max(0, this.flash - rdt * 1.5);
    if (this.zoom) { this.zoom.timer -= rdt; if (this.zoom.timer <= 0) this.zoom = null; }
    if (this.impact) { this.impact.timer -= rdt; if (this.impact.timer <= 0) this.impact = null; }
    if (this.state === 'reset' || this.state === 'title') { this.zoom = null; this.timeScale = 1; }
  },

  render() {
    ctx.save();
    if (this.screenShake > 0.3) ctx.translate((Math.random() - 0.5) * this.screenShake * 2, (Math.random() - 0.5) * this.screenShake * 2);
    if (this.state === 'title') {
      drawTitle(ctx, this, this.kata);
    } else if (this.state === 'kataView') {
      drawKataView(ctx, this.kata);
    } else if (this.state === 'dojo') {
      this.dojo.render(ctx);
    } else {
      if (this.zoom) {
        const z = this.zoom, k = 1 + (z.k - 1) * Math.min(1, z.timer / 0.15) * Math.min(1, (0.9 - z.timer) / 0.08 + 0.2);
        ctx.translate(z.x, z.y); ctx.scale(k, k); ctx.translate(-z.x, -z.y);
      }
      drawDojo(ctx);
      // the fighter executing a technique draws on top, so the striking fist/foot is in front of the opponent;
      // a blocking forearm only reads over the attacking limb when that block actually stops the incoming
      // technique — a block held against the wrong attack must not paint over the strike that gets through it
      const z = (f, o) => {
        if (f.state === 'thrown' || f.state === 'knockdown' || f.state === 'getup') return 0;
        if (f.state === 'throwing') return 3;
        if (f.state === 'attack') return 2 + (f.moveData && f.moveData.phases[f.movePhase].active ? 1 : 0);
        if (f.state === 'block' || f.state === 'counterWait') {
          const wrongBlock = o && o.state === 'attack' && o.moveData && !blockStops(f.blockKind, o.moveData);
          return wrongBlock ? 1 : 4;
        }
        return 1;
      };
      const z1 = z(this.p1, this.p2), z2 = z(this.p2, this.p1);
      const order = z1 <= z2 ? [this.p1, this.p2] : [this.p2, this.p1];
      for (const f of order) drawFighter(ctx, f);
      drawParticles(ctx);
      if (this.impact) {
        const a = Math.min(1, this.impact.timer / 0.2);
        ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        for (let i = 0; i < 18; i++) {
          const ang = i / 18 * Math.PI * 2 + 0.2, r1 = 30 + (i % 3) * 14, r2 = r1 + 60 + (i % 4) * 30;
          ctx.beginPath();
          ctx.moveTo(this.impact.x + Math.cos(ang) * r1, this.impact.y + Math.sin(ang) * r1);
          ctx.lineTo(this.impact.x + Math.cos(ang) * r2, this.impact.y + Math.sin(ang) * r2);
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (this.flash > 0) { ctx.fillStyle = 'rgba(255,255,255,' + this.flash + ')'; ctx.fillRect(0, 0, W, H); }
      drawHUD(ctx, this);
      if (this.announceTimer > 0) drawAnnounce(ctx, this.announceText, this.announceSub, Math.min(1, this.announceTimer / 0.3));
      ctx.restore();
    }
    ctx.restore();
  },
};

game.dojo = new Dojo(game);

let lastTime = 0;
function loop(time) {
  const dt = Math.min(0.05, (time - lastTime) / 1000) || 1 / 60;
  lastTime = time;
  dtGlobal = dt * game.timeScale;
  if (MUSIC.playing) MUSIC.schedule();
  if (game.hitPause > 0) game.hitPause -= dt; else game.update(dt * game.timeScale);
  game.render();
  for (const k in justPressed) justPressed[k] = false;
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
