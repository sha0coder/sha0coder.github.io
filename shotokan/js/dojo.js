'use strict';
// DOJO — belt training mode. No backend: progress is one number in localStorage
// (the belt currently being worked towards). Each belt's task is done while
// wearing that belt; passing it earns the next one, with a small ceremony.
const BELT_HEX = {
  white: '#f3efe6', yellow: '#e8d34a', orange: '#e08a3c', green: '#4a9c4a',
  blue: '#3a6fc0', purple: '#7a4ac0', brown: '#6b4226', black: '#1c1815', red: '#c1272d',
};
const BELT_NAME = {
  white: 'SHIRO-OBI', yellow: 'KI-OBI', orange: 'DAIDAI-OBI', green: 'MIDORI-OBI',
  blue: 'AO-OBI', purple: 'MURASAKI-OBI', brown: 'CHA-OBI', black: 'KURO-OBI', red: 'AKA-OBI',
};

const BELTS = [
  { id: 'white', label: 'White belt', task: 'Land 5 punches the sensei calls out', kind: 'strike', pool: ['oiZuki', 'gyakuZuki', 'gyakuZukiJodan'], need: 5 },
  { id: 'yellow', label: 'Yellow belt', task: 'Land 5 kicks the sensei calls out', kind: 'strike', pool: ['maeGeri', 'yokoGeri'], need: 5 },
  { id: 'orange', label: 'Orange belt', task: 'Block 5 partner attacks with the correct uke', kind: 'defend', pool: ['oiZuki', 'gyakuZuki', 'gyakuZukiJodan', 'maeGeri', 'mawashiGeri'], need: 5 },
  { id: 'green', label: 'Green belt', task: 'Win a jiyu ippon kumite match', kind: 'match', mode: 'ippon', level: 1 },
  { id: 'blue', label: 'Blue belt', task: 'Win a free kumite match against an easy opponent', kind: 'match', mode: 'jiyu', level: 1 },
  { id: 'purple', label: 'Purple belt', task: 'Block 3 attacks and finish each with a nage-waza counter', kind: 'throw', pool: ['oiZuki', 'gyakuZuki', 'maeGeri'], need: 3 },
  { id: 'brown', label: 'Brown belt', task: 'Win a kumite against a tougher opponent, then strike the pads', kind: 'brown', mode: 'jiyu', level: 2 },
  // black belt is the summit — no higher belt, just an endless tameshiwari (board-break) challenge
  { id: 'black', label: 'Black belt', task: 'Tameshiwari — break the board with a focused strike (kime)', kind: 'break' },
];

const DOJO_KEY = 'kime_dojo_belt';
const GREEN_BELT_INDEX = BELTS.findIndex(b => b.id === 'green');
const BLUE_BELT_INDEX = BELTS.findIndex(b => b.id === 'blue');

// the exact key each drilled technique needs, shown next to the sensei's call so there's
// never any doubt about which combo performs it
const KEY_HINT = {
  kizamiZuki: '↑ (tap)', gyakuZuki: '→', gyakuZukiJodan: '↑ + →', oiZuki: '↓ + →',
  maeGeri: 'SPACE', mawashiGeri: '↑ + SPACE', yokoGeri: '→ + SPACE',
};

class Dojo {
  constructor(game) {
    this.game = game;
    this.belt = 0;
    this.sub = 'seiza';
    this.timer = 0;
    this.progress = 0;
    this.cooldown = 0;
    this.drillMove = null;
    this.brownStage = 'kumite';
    this.padHits = 0;
    this.p1 = null; this.p2 = null;
    this.pendingPartnerMove = null;
    this.partnerDelay = 0;
    this.partnerTelegraph = 1.9; // seconds between the sensei's call and the actual attack (plenty to read it)
    this.breakCount = 0;
    this.boardFx = 0;
    this.boardX = W / 2;
  }

  get current() { return BELTS[this.belt]; }

  loadBelt() {
    try { return Math.min(BELTS.length - 1, Math.max(0, parseInt(localStorage.getItem(DOJO_KEY) || '0', 10) || 0)); }
    catch (e) { return 0; }
  }
  saveBelt() {
    try { localStorage.setItem(DOJO_KEY, String(this.belt)); } catch (e) {}
  }

  // called when the player enters the dojo from the title screen
  enter() {
    this.belt = this.loadBelt();
    this.startSeiza();
  }

  startSeiza() {
    MUSIC.setMode('dojo');
    this.sub = 'seiza';
    this.timer = 2.6;
    this.p1 = new Fighter({ isPlayer: true, x: 0, facing: 1, beltColor: this.current.id, kiaiPitch: 1.0, label: 'YOU' });
    this.p2 = new Fighter({ isPlayer: false, x: 0, facing: -1, beltColor: 'black', kiaiPitch: 0.8, label: 'SENSEI' });
    this.p2.hachimaki = true;
    this.p1.reset(W / 2 - 60, 1); this.p2.reset(W / 2 + 60, -1);
    this.p1.view = 'front'; this.p2.view = 'front';
    this.p1.state = 'frozen'; this.p1.setPose('seizaFront', 6);
    this.p2.state = 'frozen'; this.p2.setPose('seizaFront', 6);
    SFX.osu(1); SFX.osu(0.82);
  }

  startBriefing() {
    MUSIC.setMode('dojo');
    this.sub = 'briefing';
    this.timer = 2.4;
    this.progress = 0; this.padHits = 0; this.brownStage = 'kumite'; this.drillMove = null;
    this.pendingPartnerMove = null; this.partnerDelay = 0;
    this.p1.view = undefined; this.p2.view = undefined;
    // close enough that every technique in every drill pool (even the shorter-stepping gyaku-zuki) can land
    this.p1.reset(W / 2 - 75, 1); this.p2.reset(W / 2 + 75, -1);
    this.p1.state = 'idle'; this.p1.setPose('idle', 8);
    this.p2.state = 'idle'; this.p2.setPose('idle', 8);
    this.game.announce(this.current.label.toUpperCase(), this.current.task, 2.2);
  }

  startDrill() {
    const b = this.current;
    this.sub = 'drill';
    this.cooldown = 0.6;
    this.drillMove = null;
    if (b.kind === 'break') { this.breakCount = 0; this.boardFx = 0; this.boardX = W / 2 + 55 * SCALE; return; }
    if (b.kind === 'match') { this.game.enterDojoMatch(b.mode, b.level); return; }
    if (b.kind === 'brown') { this.brownStage = 'kumite'; this.game.enterDojoMatch(b.mode, b.level); return; }
  }

  callTechnique() {
    const b = this.current;
    this.drillMove = b.pool[Math.floor(Math.random() * b.pool.length)];
    const hint = KEY_HINT[this.drillMove] || '';
    const cat = MOVES[this.drillMove].kind === 'kick' ? 'any kick' : 'any punch';
    this.game.announce('SENSEI: ' + MOVES[this.drillMove].name.toUpperCase() + '!', hint + '  —  ' + cat + ' scores', 1.8);
  }

  // announce the partner's attack, then start it after a telegraph delay so there is time to react
  callPartnerAttack() {
    const b = this.current;
    const mv = b.pool[Math.floor(Math.random() * b.pool.length)];
    this.game.announce(MOVES[mv].name.toUpperCase() + '!', b.kind === 'throw' ? 'block it — the throw follows' : 'block it', 1.6);
    this.pendingPartnerMove = mv;
    this.partnerDelay = this.partnerTelegraph;
  }

  // ---------- hooks called from game.js's own onHit/onBlock/onTodome ----------
  // a strike drill scores on the right CATEGORY, not the exact technique: the belt goal is
  // "punches only" / "kicks only", so the sensei's call is a suggestion and any punch (resp.
  // kick) satisfies a punch (resp. kick) call — whether it lands or the sensei blocks it
  strikeMatches(move) {
    if (!this.drillMove || !move) return false;
    return move.kind === MOVES[this.drillMove].kind;
  }
  onHit(attacker, defender, move) {
    if (this.sub !== 'drill' || attacker !== this.p1) return;
    const b = this.current;
    if (b.kind === 'strike') {
      if (this.strikeMatches(move)) { this.progress++; SFX.point(); this.drillMove = null; this.cooldown = 0.9; }
    } else if (b.kind === 'brown' && this.brownStage === 'pads') {
      this.padHits++; SFX.point(); this.cooldown = 0.25;
    } else if (b.kind === 'break') {
      // a clean strike shatters the board: heavy impact, kiai, splinters — but no belt beyond black
      this.breakCount++; this.boardFx = 0.7; this.cooldown = 0.7;
      SFX.hitHeavy(); SFX.kiai(this.p1.kiaiPitch);
      this.game.flash = 0.3; this.game.screenShake = 13; this.game.hitPause = 0.12;
      const boardX = this.boardX;
      spawnHitSpark(boardX, GROUND - 144 * SCALE, 18); spawnDust(boardX, GROUND - 100 * SCALE);
    }
  }
  onBlockSuccess(defender, attacker, move) {
    if (this.sub !== 'drill') return;
    const b = this.current;
    if (b.kind === 'defend' && defender === this.p1) {
      this.progress++; SFX.point(); this.cooldown = 1.3;
    } else if (b.kind === 'strike' && attacker === this.p1 && defender === this.p2 && this.strikeMatches(move)) {
      // the sensei never just stands there and eats it — a clean, blocked technique counts too
      this.progress++; SFX.point(); this.drillMove = null; this.cooldown = 0.9;
    }
  }
  onThrowSuccess(tori) {
    if (this.sub !== 'drill' || tori !== this.p1) return;
    if (this.current.kind !== 'throw') return;
    this.progress++; SFX.point(); this.cooldown = 1.4;
  }

  // called by game.js when a dojo-triggered kumite match (green/blue/brown) ends
  onMatchResult(won) {
    MUSIC.setMode('dojo');
    const b = this.current;
    if (b.kind === 'brown' && this.brownStage === 'kumite') {
      if (won) {
        this.brownStage = 'pads'; this.padHits = 0;
        this.p1.reset(W / 2 - 75, 1); this.p2.reset(W / 2 + 75, -1);
        this.p1.state = 'idle'; this.p2.state = 'idle';
        this.sub = 'drill'; this.cooldown = 0.3;
        this.game.announce('SENSEI: PAO DRILL', 'strike the pads · land 8 hits', 1.8);
      } else {
        this.sub = 'briefing'; this.timer = 1.8;
        this.game.announce('AGAIN', 'that opponent still has your number', 1.6);
      }
      return;
    }
    if (won) this.startCeremony();
    else { this.sub = 'briefing'; this.timer = 1.8; this.game.announce('AGAIN', 'not yet — try once more', 1.6); }
  }

  promote() {
    this.belt = Math.min(BELTS.length - 1, this.belt + 1);
    this.saveBelt();
    this.p1.beltColor = this.current.id;
  }

  startCeremony() {
    MUSIC.setMode('dojo');
    this.promote();
    this.sub = 'ceremony';
    this.timer = 4.2;
    // both drop to one knee facing each other for the belt presentation
    this.p1.view = undefined; this.p2.view = undefined;
    this.p1.reset(W / 2 - 64, 1); this.p2.reset(W / 2 + 64, -1);
    this.p1.state = 'frozen'; this.p1.setPose('kneelOne', 6);
    this.p2.state = 'frozen'; this.p2.setPose('kneelOne', 6);
    SFX.win();
    setTimeout(() => { SFX.osu(1); SFX.osu(0.82); }, 900);
  }

  update(dt) {
    const g = this.game;
    g.forceThrowCounter = this.sub === 'drill' && this.current.kind === 'throw';
    g.suppressCounter = this.sub === 'drill' && this.current.kind === 'strike';
    switch (this.sub) {
      case 'seiza':
        this.timer -= dt;
        this.p1.update(dt, null, g); this.p2.update(dt, null, g);
        if (this.timer <= 0) this.startBriefing();
        break;
      case 'briefing':
        this.timer -= dt;
        this.p1.update(dt, null, g); this.p2.update(dt, null, g);
        if (this.timer <= 0 || consumePress('Enter')) {
          if (this.current.kind === 'done') { g.state = 'title'; g.kata = new KataPlayer(); return; }
          this.startDrill();
        }
        break;
      case 'drill': {
        const b = this.current;
        this.cooldown -= dt;
        // every technique ends with a retreat step, so ease both partners back to drilling
        // range whenever neither is mid-technique — otherwise repeated reps drift them apart
        // until nothing can reach any more
        const settled = (f) => f.state !== 'attack' && f.state !== 'throwing' && f.state !== 'thrown'
          && f.state !== 'knockdown' && f.state !== 'getup';
        if ((b.kind !== 'brown' || this.brownStage === 'pads') && settled(this.p1) && settled(this.p2)) {
          const k = Math.min(1, dt * 4);
          this.p1.x += (W / 2 - 75 - this.p1.x) * k;
          this.p2.x += (W / 2 + 75 - this.p2.x) * k;
        }
        if (b.kind === 'strike') {
          if (!this.drillMove && this.cooldown <= 0) this.callTechnique();
          // the sensei isn't a pad — as soon as the technique is called, he sets the guard
          // that actually stops it, so a correct rep gets blocked cleanly instead of landing
          if (this.drillMove && this.p2.canAct) {
            const lvl = MOVES[this.drillMove].level;
            const kind = lvl === 'jodan' ? 'age' : lvl === 'kick' ? 'gedan' : 'uchi';
            if (this.p2.state !== 'block' || this.p2.blockKind !== kind) { this.p2.blockHeld = 0; this.p2.setBlock(kind); }
          }
          this.p1.handleInput(this.p2);
          this.p1.update(dt, this.p2, g); this.p2.update(dt, this.p1, g);
        } else if (b.kind === 'defend' || b.kind === 'throw') {
          // announce, wait out the telegraph, then the partner actually attacks — giving time to react
          if (this.pendingPartnerMove) {
            this.partnerDelay -= dt;
            if (this.partnerDelay <= 0 && this.p2.canAct) { this.p2.startMove(this.pendingPartnerMove); this.pendingPartnerMove = null; }
          } else if (this.cooldown <= 0 && this.p2.canAct && settled(this.p1) && settled(this.p2)) {
            this.callPartnerAttack(); this.cooldown = 3.6;
          }
          this.p1.handleInput(this.p2);
          this.p1.update(dt, this.p2, g); this.p2.update(dt, this.p1, g);
        } else if (b.kind === 'brown' && this.brownStage === 'pads') {
          this.p1.handleInput(this.p2);
          this.p1.update(dt, this.p2, g); this.p2.update(dt, this.p1, g);
        } else if (b.kind === 'break') {
          // endless board-break practice — no promotion beyond black
          this.boardFx = Math.max(0, this.boardFx - dt);
          this.p1.handleInput(this.p2);
          this.p1.update(dt, this.p2, g);
          // the sensei simply holds the board in a steady stance — never knocked about
          this.p2.state = 'frozen'; this.p2.setPose('idle', 20); this.p2.vx = 0;
          this.p2.update(dt, this.p1, g);
        }
        if (b.need && this.progress >= b.need) this.startCeremony();
        if (b.kind === 'brown' && this.brownStage === 'pads' && this.padHits >= 8) this.startCeremony();
        break;
      }
      case 'ceremony':
        this.timer -= dt;
        this.p1.update(dt, null, g); this.p2.update(dt, null, g);
        if (this.timer <= 0) {
          if (this.current.kind === 'done') { g.state = 'title'; g.kata = new KataPlayer(); }
          else this.startBriefing();
        }
        break;
    }
  }

  render(ctx) { drawDojoScene(ctx, this); }
}
