'use strict';
class Fighter {
  constructor(opts) {
    this.isPlayer = opts.isPlayer;
    this.beltColor = opts.beltColor;
    this.kiaiPitch = opts.kiaiPitch;
    this.label = opts.label;
    this.score = 0;
    this.pose = copyPose(P.shizentai);
    this.reset(opts.x, opts.facing);
  }

  reset(x, facing) {
    this.x = x;
    this.facing = facing;
    this.vx = 0;
    this.targetPose = P.idle;
    this.poseName = 'idle';
    this.poseBlend = 10;
    this.state = 'idle';
    this.stateTimer = 0;
    this.moveData = null;
    this.movePhase = 0;
    this.hasHit = false;
    this.blockKind = null;
    this.blockHeld = 0;
    this.hitFlash = 0;
    this.lastMoveName = '';
    this.moveNameTimer = 0;
    this.pendingCounter = null;
    this.counterDelay = 0;
    this.repeatTimer = 0;
    this.walkAnim = 0;
    this.throwPartner = null;
  }

  setPose(name, blend) {
    this.targetPose = P[name];
    this.poseName = name;
    if (blend) this.poseBlend = blend;
  }

  get canAct() {
    return this.state === 'idle' || this.state === 'walk' || this.state === 'block';
  }
  get canBeThrown() {
    return this.state === 'idle' || this.state === 'walk' || this.state === 'block' || this.state === 'attack' || this.state === 'hitstun';
  }
  get hurtbox() {
    const h = 185 * SCALE;
    return { x: this.x - 20 * SCALE, y: GROUND - h, w: 40 * SCALE, h };
  }

  // ---------- actions ----------
  startMove(name) {
    const move = MOVES[name];
    this.state = 'attack';
    this.moveData = move;
    this.movePhase = 0;
    this.stateTimer = move.phases[0].dur;
    this.setPose(move.phases[0].pose, 20);
    const moveDur = move.phases.reduce((s, p) => s + (p.move ? p.dur : 0), 0);
    this.moveSpeed = moveDur > 0 ? (move.step || 0) * SCALE / moveDur : 0;
    const backDur = move.phases.reduce((s, p) => s + (p.retreat ? p.dur : 0), 0);
    this.backSpeed = backDur > 0 ? (move.back || 0) * SCALE / backDur : 0;
    this.hasHit = false;
    this.kiaiDone = false;
    this.blockKind = null;
    this.lastMoveName = move.name;
    this.moveNameTimer = 1.0;
    SFX.whoosh();
  }

  startThrow(name, opponent) {
    const t = THROWS[name];
    this.state = 'throwing';
    this.moveData = t;
    this.movePhase = 0;
    this.stateTimer = t.phases[0].dur;
    this.setPose(t.phases[0].pose, 16);
    this.hasHit = false;
    this.blockKind = null;
    this.lastMoveName = t.name;
    this.moveNameTimer = 1.4;
    this.throwPartner = opponent;
    opponent.state = 'thrown';
    opponent.moveData = null;
    opponent.throwPartner = this;
    opponent.facing = -this.facing;
    opponent.setPose(t.phases[0].victim, 12);
    opponent.x = this.x + this.facing * t.phases[0].off * SCALE;
    SFX.step();
  }

  setBlock(kind) {
    this.state = 'block';
    this.blockKind = kind;
    this.setPose(BLOCK_POSE[kind], 16);
  }

  takeHit(move, attacker, game) {
    this.state = 'hitstun';
    this.stateTimer = move.hitstun;
    this.setPose('hit', 22);
    this.vx = attacker.facing * 260;
    this.hitFlash = 0.15;
    this.blockKind = null;
    if (move.knockdown) {
      this.state = 'knockdown';
      this.stateTimer = 1.1;
      this.setPose('knockdown', 7);
    }
  }

  // successful uke: counter with gyaku-zuki, or judo when close (less likely)
  queueCounter(opponent, move) {
    const dist = Math.abs(this.x - opponent.x);
    const closeEnough = dist < THROW_RANGE * 1.3 * SCALE;
    let counter = 'gyakuZuki';
    if (this.blockKind !== 'age' && closeEnough && Math.random() < 0.35) {
      const judo = this.blockKind === 'gedan'
        ? ['deAshiBarai', 'osotoGari', 'koUchiGari']
        : ['taiOtoshi', 'haraiGoshi', 'osotoGari'];
      counter = judo[Math.floor(Math.random() * judo.length)];
    }
    this.pendingCounter = counter;
    this.counterDelay = 1.0;
    this.state = 'counterWait';
    // the blocked attacker stays frozen in the stopped technique
    opponent.state = 'hitstun';
    opponent.stateTimer = 1.05;
    opponent.moveData = null;
  }

  // ---------- update ----------
  update(dt, opponent, game) {
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.moveNameTimer = Math.max(0, this.moveNameTimer - dt);
    this.repeatTimer = Math.max(0, this.repeatTimer - dt);

    if (this.state !== 'thrown') {
      this.x += this.vx * dt;
      this.vx *= Math.pow(0.0005, dt);
      this.x = Math.max(STAGE_L, Math.min(STAGE_R, this.x));
    }

    if (this.canAct && opponent && opponent.state !== 'thrown') {
      this.facing = opponent.x > this.x ? 1 : -1;
    }

    // keep bodies apart
    if (opponent && this.state !== 'thrown' && opponent.state !== 'thrown' &&
        this.state !== 'throwing' && opponent.state !== 'throwing') {
      const dist = Math.abs(this.x - opponent.x);
      const minDist = 56 * SCALE;
      if (dist < minDist) {
        const push = (minDist - dist) / 2;
        const dir = this.x < opponent.x ? -1 : 1;
        this.x = Math.max(STAGE_L, Math.min(STAGE_R, this.x + dir * push));
        opponent.x = Math.max(STAGE_L, Math.min(STAGE_R, opponent.x - dir * push));
      }
    }

    // pending counter fires once we are free
    if (this.pendingCounter) {
      this.counterDelay -= dt;
      if (this.counterDelay <= 0 && (this.canAct || this.state === 'block' || this.state === 'counterWait')) {
        const c = this.pendingCounter;
        this.pendingCounter = null;
        // yori-ashi: slide in so the counter reaches
        const want = 68 * SCALE, dist = Math.abs(this.x - opponent.x);
        if (dist > want) this.x += this.facing * (dist - want);
        if (MOVES[c]) {
          this.startMove(c);
          if (MOVES[c].kiaiOnHit) { SFX.kiai(this.kiaiPitch); this.kiaiDone = true; }
        } else if (opponent.canBeThrown && Math.abs(this.x - opponent.x) < THROW_RANGE * 1.6 * SCALE) {
          this.startThrow(c, opponent);
        } else {
          this.startMove('gyakuZuki');
        }
        game.announceCounter(this);
      }
    }

    switch (this.state) {
      case 'idle':
        this.setPose('idle', 10);
        break;
      case 'walk':
        this.walkAnim += dt * 9;
        this.setPose(Math.sin(this.walkAnim) > 0 ? 'walk1' : 'walk2', 12);
        break;
      case 'block':
        this.blockHeld += dt;
        break;
      case 'attack': {
        const phase = this.moveData.phases[this.movePhase];
        // step in only until the technique is at striking distance (ma-ai), never onto the opponent
        if (phase.move && (!opponent || Math.abs(this.x - opponent.x) > 84 * SCALE)) this.x += this.facing * this.moveSpeed * dt;
        if (phase.retreat) this.x -= this.facing * this.backSpeed * dt;
        if (phase.active && !this.hasHit) this.checkHit(opponent, game);
        if (this.state !== 'attack') break;
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          this.movePhase++;
          if (this.movePhase >= this.moveData.phases.length) {
            this.state = 'idle';
            this.moveData = null;
          } else {
            const next = this.moveData.phases[this.movePhase];
            this.stateTimer = next.dur;
            this.setPose(next.pose, 18);
            if (next.rehit) this.hasHit = false;
            if (next.active && this.moveData.kiai) SFX.kiai(this.kiaiPitch);
          }
        }
        break;
      }
      case 'throwing': {
        this.stateTimer -= dt;
        const victim = this.throwPartner;
        if (this.stateTimer <= 0) {
          this.movePhase++;
          if (this.movePhase >= this.moveData.phases.length) {
            this.state = 'idle';
            this.moveData = null;
            if (victim) { victim.state = 'knockdown'; victim.stateTimer = 0.6; victim.setPose('knockdown', 8); }
            this.throwPartner = null;
          } else {
            const ph = this.moveData.phases[this.movePhase];
            this.stateTimer = ph.dur;
            this.setPose(ph.pose, ph.todome ? 22 : 14);
            if (victim) victim.setPose(ph.victim, ph.land ? 9 : 12);
            if (ph.active) { SFX.kiai(this.kiaiPitch); SFX.whoosh(); game.onThrowStart(this, victim); }
            if (ph.land) { SFX.thud(); game.onThrowLand(this, victim); }
            if (ph.todome) { SFX.kiai(this.kiaiPitch * 1.1); SFX.hitHeavy(); game.onTodome(this, victim); game.scorePoint(this, this.moveData, victim); }
          }
        }
        if (victim && this.moveData) {
          const ph = this.moveData.phases[this.movePhase];
          const targetX = this.x + this.facing * ph.off * SCALE;
          victim.x += (targetX - victim.x) * Math.min(1, dt * 14);
        }
        break;
      }
      case 'thrown':
        break;
      case 'hitstun':
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) this.state = 'idle';
        break;
      case 'knockdown':
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          this.state = 'getup';
          this.stateTimer = 0.45;
          this.setPose('getup', 7);
        }
        break;
      case 'getup':
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) this.state = 'idle';
        break;
      case 'rei':
      case 'shizentai':
      case 'victory':
      case 'frozen':
        break;
    }

    const blend = 1 - Math.exp(-this.poseBlend * dt);
    for (let i = 0; i < 32; i++) this.pose[i] += (this.targetPose[i] - this.pose[i]) * blend;
  }

  checkHit(opponent, game) {
    if (!opponent || this.hasHit) return;
    if (opponent.state === 'thrown' || opponent.state === 'knockdown' || opponent.state === 'getup' || opponent.state === 'throwing') return;
    const hb = this.moveData.hitbox;
    const cx = this.x + hb.x * SCALE * this.facing;
    const cy = GROUND - hb.y * SCALE;
    const box = { x: cx - hb.w * SCALE / 2, y: cy - hb.h * SCALE / 2, w: hb.w * SCALE, h: hb.h * SCALE };
    const d = opponent.hurtbox;
    if (box.x < d.x + d.w && box.x + box.w > d.x && box.y < d.y + d.h && box.y + box.h > d.y) {
      this.hasHit = true;
      if (opponent.state === 'block' && blockStops(opponent.blockKind, this.moveData)) {
        SFX.block();
        opponent.hitFlash = 0.06;
        opponent.vx = 0;
        this.vx = 0;
        game.onBlock(opponent, this, this.moveData);
        opponent.queueCounter(this, this.moveData);
      } else {
        if (this.moveData.kiaiOnHit && !this.kiaiDone) SFX.kiai(this.kiaiPitch);
        if (this.moveData.kind === 'kick') SFX.hitHeavy(); else SFX.hitLight();
        // sen no sen: caught the opponent stepping in, before their technique was active
        if (opponent.state === 'attack' && opponent.moveData && !opponent.moveData.phases[opponent.movePhase].active) game.onDeai(this);
        opponent.takeHit(this.moveData, this, game);
        game.onHit(this, opponent, this.moveData);
        game.scorePoint(this, this.moveData, opponent);
      }
    }
  }

  // ---------- player input (cursors + space) ----------
  handleInput(opponent) {
    if (!this.isPlayer) return;
    const back = this.facing > 0 ? keys['ArrowLeft'] : keys['ArrowRight'];
    const fwd = this.facing > 0 ? keys['ArrowRight'] : keys['ArrowLeft'];
    const fwdPressed = this.facing > 0 ? consumePress('ArrowRight') : consumePress('ArrowLeft');
    const up = keys['ArrowUp'], down = keys['ArrowDown'];

    if (!this.canAct) return;

    if (this.attacksAllowed !== false) {
      // a quick tap of ↑ alone (released without Space/→/←) is the kizami-zuki
      if (consumePress('KizamiTap')) {
        this.startMove(Math.random() < 0.5 ? 'kizamiZuki' : 'gyakuOi');
        return;
      }
      if (consumePress('Space')) {
        this.startMove(up ? 'mawashiGeri' : 'maeGeri');
        return;
      }
      if (fwdPressed || (fwd && this.repeatTimer <= 0)) {
        this.repeatTimer = 0.8;
        this.startMove(down ? 'gyakuZuki' : up ? 'gyakuZukiJodan' : 'oiZuki');
        return;
      }
    }
    if (back) {
      const kind = up ? 'age' : down ? 'gedan' : 'uchi';
      if (this.state !== 'block' || this.blockKind !== kind) { this.blockHeld = 0; this.setBlock(kind); }
      if (kind === 'uchi') this.x -= this.facing * WALK_SPEED * 0.55 * dtGlobal;
      return;
    }
    this.state = 'idle';
    this.blockKind = null;
  }
}

// ==================== AI ====================
class AIController {
  constructor() { this.think = 0; this.level = 1; }

  update(dt, me, opp, reactOnly) {
    const L = this.level;
    if (reactOnly) {
      // jiyu ippon kumite: the CPU only answers the player's single attack with an uke
      if (opp.state === 'attack' && opp.movePhase <= 1 && me.canAct && !me._reacted) {
        me._reacted = true;
        const skill = [0, 0.4, 0.6, 0.8][L] || 0.8;
        const lvl = opp.moveData.level;
        const right = lvl === 'jodan' ? 'age' : lvl === 'kick' ? 'gedan' : 'uchi';
        if (Math.random() < skill) me.setBlock(right);
        else if (Math.random() < 0.5) me.setBlock(['uchi', 'age', 'gedan'].filter(k => k !== right)[Math.floor(Math.random() * 2)]);
        me.blockHeld = 0;
      } else if (opp.state !== 'attack') {
        me._reacted = false;
        if (me.state === 'block' && me.blockHeld > 0.6 && me.canAct) me.state = 'idle';
      }
      return;
    }
    const aggression = [0, 0.18, 0.4, 0.65][L] || 0.65;
    const blockSkill = [0, 0.35, 0.55, 0.75][L] || 0.75;
    const dist = Math.abs(me.x - opp.x);

    // react to an incoming attack: sen (kizami-zuki into the step-in) at higher levels, or the right uke
    if (opp.state === 'attack' && opp.movePhase === 0 && me.canAct && dist < 150 * SCALE) {
      if (!me._reacted) {
        me._reacted = true;
        const senChance = [0, 0, 0.2, 0.35][L] || 0.35;
        if (dist < 125 * SCALE && Math.random() < senChance) { me.startMove('kizamiZuki'); return; }
        if (Math.random() < blockSkill) {
          const lvl = opp.moveData.level;
          me.setBlock(lvl === 'jodan' ? 'age' : lvl === 'kick' ? 'gedan' : 'uchi');
          me.blockHeld = 0;
          return;
        } else if (Math.random() < 0.4) {
          me.setBlock(['uchi', 'age', 'gedan'][Math.floor(Math.random() * 3)]);
          return;
        }
      }
    } else if (opp.state !== 'attack') {
      me._reacted = false;
    }

    if (!me.canAct) return;
    this.think -= dt;
    if (me.state === 'block' && me.blockHeld < 0.35) return;
    if (this.think > 0) {
      if (me._plan === 'fwd') { me.x += me.facing * WALK_SPEED * 0.7 * dt; me.state = 'walk'; }
      else if (me._plan === 'back') { me.x -= me.facing * WALK_SPEED * 0.6 * dt; me.state = 'walk'; }
      else if (me._plan === 'guard') { if (me.state !== 'block') me.setBlock('uchi'); }
      else me.state = 'idle';
      return;
    }

    this.think = 0.18 + Math.random() * 0.3;
    const r = Math.random();
    // attacks carry a long step-in, so the CPU launches them from further out
    if (dist > 210 * SCALE) {
      me._plan = r < 0.55 ? 'fwd' : r < 0.8 ? 'idle' : 'guard';
    } else if (dist > 120 * SCALE) {
      if (r < aggression) { me.startMove(Math.random() < 0.5 ? 'oiZuki' : Math.random() < 0.6 ? 'maeGeri' : 'mawashiGeri'); return; }
      me._plan = r < aggression + 0.25 ? 'fwd' : r < aggression + 0.5 ? 'guard' : 'idle';
    } else {
      if (r < aggression) { me.startMove(Math.random() < 0.55 ? 'gyakuZuki' : Math.random() < 0.5 ? 'oiZuki' : 'mawashiGeri'); return; }
      me._plan = r < aggression + 0.35 ? 'back' : r < aggression + 0.6 ? 'guard' : 'idle';
    }
    if (me._plan === 'idle') me.state = 'idle';
  }
}
