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

  // successful uke: counter with gyaku-zuki (chudan or jodan, at random) or judo when close (less likely);
  // an uchi-uke specifically opens a 3-way counter (gyaku most likely, then the throw, then a mawashi-geri)
  queueCounter(opponent, move, game) {
    const dist = Math.abs(this.x - opponent.x);
    const closeEnough = dist < THROW_RANGE * 1.3 * SCALE;
    // nage-waza counters stay out of the game entirely until blue belt is earned
    const throwsUnlocked = !game || !game.dojo || game.forceThrowCounter || game.dojo.loadBelt() >= BLUE_BELT_INDEX;
    const canThrow = this.blockKind !== 'age' && closeEnough && throwsUnlocked;
    const jodanMawashi = !game || !game.dojo || game.dojo.loadBelt() >= GREEN_BELT_INDEX;
    const mawashiCounter = jodanMawashi ? 'mawashiGeri' : 'mawashiGeriChudan';
    const judoPool = this.blockKind === 'gedan'
      ? ['deAshiBarai', 'osotoGari', 'koUchiGari']
      : ['taiOtoshi', 'haraiGoshi', 'osotoGari'];
    const gyakuRandom = () => Math.random() < 0.5 ? 'gyakuZuki' : 'gyakuZukiJodan';
    let counter;
    if (game && game.forceThrowCounter && canThrow) {
      counter = judoPool[Math.floor(Math.random() * judoPool.length)];
    } else if (this.blockKind === 'uchi') {
      const r = Math.random();
      counter = (canThrow && r < 0.25) ? judoPool[Math.floor(Math.random() * judoPool.length)]
        : r < 0.45 ? mawashiCounter
        : gyakuRandom();
    } else if (canThrow && Math.random() < 0.35) {
      counter = judoPool[Math.floor(Math.random() * judoPool.length)];
    } else {
      counter = gyakuRandom();
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
      // yori-ashi: ease into range smoothly during the wait, instead of snapping into place
      // the instant the counter fires — a real step, not a teleport
      if (opponent) {
        // stop a touch further out so the counter doesn't crowd into the opponent
        const want = 82 * SCALE, dist = Math.abs(this.x - opponent.x);
        if (dist > want) {
          const k = Math.min(1, dt * 3.2);
          this.x += this.facing * (dist - want) * k;
        }
      }
      if (this.counterDelay <= 0 && (this.canAct || this.state === 'block' || this.state === 'counterWait')) {
        const c = this.pendingCounter;
        this.pendingCounter = null;
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
        // step in only until the technique is at striking distance (ma-ai), never onto the opponent;
        // a move can override the stop distance (e.g. a full step-through commits closer than a jab)
        const stopDist = (this.moveData.stepStop || 84) * SCALE;
        if (phase.move && (!opponent || Math.abs(this.x - opponent.x) > stopDist)) this.x += this.facing * this.moveSpeed * dt;
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
            // a snapping strike (mae-geri, yoko-geri...) can ask for a faster blend into its
            // active pose so the limb visibly reaches full extension before the hit is checked
            this.setPose(next.pose, next.blend || 18);
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
        // a plain "the sensei blocked it" drill rep isn't a counter-attack cycle
        if (!(game && game.suppressCounter)) opponent.queueCounter(this, this.moveData, game);
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
  handleInput(opponent, game) {
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
        // mawashi-geri is chudan until green belt is actually earned, then it rises to jodan —
        // this reads the persisted dojo rank directly, so it applies in every mode, not just the dojo
        const jodanMawashi = !game || !game.dojo || game.dojo.loadBelt() >= GREEN_BELT_INDEX;
        this.startMove(up ? (jodanMawashi ? 'mawashiGeri' : 'mawashiGeriChudan') : fwd ? 'yokoGeri' : 'maeGeri');
        return;
      }
      if (fwdPressed || (fwd && this.repeatTimer <= 0)) {
        this.repeatTimer = 0.8;
        // → alone is gyaku-zuki chudan (the rear-hand punch — ↑ alone already covers the
        // lead/front-hand punch, kizami-zuki); ↓+→ keeps the long stepping oi-zuki lunge
        this.startMove(down ? 'oiZuki' : up ? 'gyakuZukiJodan' : 'gyakuZuki');
        return;
      }
    }
    if (back) {
      // back is always a block, held on the spot — it never steps the fighter backwards
      const kind = up ? 'age' : down ? 'gedan' : 'uchi';
      if (this.state !== 'block' || this.blockKind !== kind) { this.blockHeld = 0; this.setBlock(kind); }
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
        const skill = [0, 0.4, 0.52, 0.6, 0.68, 0.74, 0.8, 0.85, 0.89, 0.93, 0.96][L] || 0.9;
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
    const aggression = [0, 0.15, 0.28, 0.38, 0.48, 0.56, 0.64, 0.72, 0.8, 0.87, 0.93][L] || 0.7;
    const blockSkill = [0, 0.3, 0.42, 0.52, 0.6, 0.67, 0.73, 0.79, 0.85, 0.9, 0.94][L] || 0.8;
    const dist = Math.abs(me.x - opp.x);

    // react to an incoming attack: sen (kizami-zuki into the step-in) at higher levels, or the right uke
    if (opp.state === 'attack' && opp.movePhase === 0 && me.canAct && dist < 150 * SCALE) {
      if (!me._reacted) {
        me._reacted = true;
        const senChance = [0, 0, 0.1, 0.16, 0.24, 0.32, 0.4, 0.47, 0.54, 0.6, 0.66][L] || 0.4;
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

    // from level 4: if the player camps in one uke, attack a height that block does NOT cover
    this._openPunish = Math.max(0, (this._openPunish || 0) - dt);
    if (L >= 4 && opp.state === 'block' && opp.blockHeld > 1.1 && this._openPunish <= 0 && dist < 200 * SCALE) {
      const bk = opp.blockKind;
      const pool = bk === 'uchi' ? ['gyakuZukiJodan', 'maeGeri', 'mawashiGeri']   // beat a chudan block: jodan or kick
        : bk === 'age' ? ['gyakuZuki', 'oiZuki', 'maeGeri']                        // beat a jodan block: chudan or kick
        : ['gyakuZukiJodan', 'gyakuZuki', 'mawashiGeri'];                          // beat a gedan block: jodan or chudan
      this._openPunish = 1.8;
      me.startMove(pool[Math.floor(Math.random() * pool.length)]);
      return;
    }

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
