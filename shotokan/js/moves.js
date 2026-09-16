'use strict';
// level: 'chudan' (mid punch) blocked by uchi-uke, 'jodan' (head) blocked by age-uke,
// 'kick' (mae-geri gedan) blocked only by gedan-barai
// every attack opens with a long step-in (phases flagged `move` share `step`), so the defender can read it;
// after the strike the attacker steps back out (`retreat` phases share `back`) unless stopped and countered
const MOVES = {
  // fastest technique: the sen/deai tool — fires before a stepping-in attack becomes active
  kizamiZuki: {
    name: 'Kizami-zuki', level: 'jodan', points: 1, kind: 'punch', step: 45, back: 60,
    phases: [
      { pose: 'kizamiZuki', dur: 0.09, move: true },
      { pose: 'kizamiZuki', dur: 0.05, active: true },
      { pose: 'kizamiZuki', dur: 0.06 },
      { pose: 'walk2', dur: 0.22, retreat: true },
    ],
    hitbox: { x: 66, y: 164, w: 28, h: 28 },
    hitstun: 0.28,
  },
  // gyaku-zuki that keeps advancing: the rear leg steps through and the same fist becomes a jun/oi-zuki
  gyakuOi: {
    name: 'Gyaku-zuki → jun-zuki', level: 'chudan', points: 1, kind: 'punch', step: 150, back: 80, kiaiOnHit: true,
    phases: [
      { pose: 'walk2', dur: 0.14, move: true },
      { pose: 'gyakuZuki', dur: 0.08, move: true },
      { pose: 'gyakuZuki', dur: 0.06, active: true },
      { pose: 'walk1', dur: 0.12, move: true, rehit: true },
      { pose: 'oiZuki', dur: 0.08, move: true },
      { pose: 'oiZuki', dur: 0.06, active: true },
      { pose: 'oiZuki', dur: 0.1 },
      { pose: 'walk2', dur: 0.3, retreat: true },
    ],
    hitbox: { x: 58, y: 146, w: 30, h: 30 },
    hitstun: 0.32,
  },
  oiZuki: {
    name: 'Oi-zuki', level: 'chudan', points: 1, kind: 'punch', step: 120, back: 90,
    phases: [
      { pose: 'walk1', dur: 0.18, move: true },
      { pose: 'oiZuki', dur: 0.12, move: true },
      { pose: 'oiZuki', dur: 0.06, active: true },
      { pose: 'oiZuki', dur: 0.1 },
      { pose: 'walk2', dur: 0.3, retreat: true },
    ],
    hitbox: { x: 62, y: 146, w: 30, h: 30 },
    hitstun: 0.3,
  },
  gyakuZuki: {
    name: 'Gyaku-zuki chudan', level: 'chudan', points: 1, kind: 'punch', kiaiOnHit: true, step: 90, back: 80,
    phases: [
      { pose: 'walk2', dur: 0.16, move: true },
      { pose: 'gyakuZuki', dur: 0.10, move: true },
      { pose: 'gyakuZuki', dur: 0.06, active: true },
      { pose: 'gyakuZuki', dur: 0.1 },
      { pose: 'walk2', dur: 0.3, retreat: true },
    ],
    hitbox: { x: 54, y: 146, w: 30, h: 30 },
    hitstun: 0.32,
  },
  gyakuZukiJodan: {
    name: 'Gyaku-zuki jodan', level: 'jodan', points: 1, kind: 'punch', kiai: true, step: 90, back: 80,
    phases: [
      { pose: 'walk2', dur: 0.16, move: true },
      { pose: 'gyakuZukiJodan', dur: 0.10, move: true },
      { pose: 'gyakuZukiJodan', dur: 0.06, active: true },
      { pose: 'gyakuZukiJodan', dur: 0.1 },
      { pose: 'walk2', dur: 0.3, retreat: true },
    ],
    hitbox: { x: 54, y: 168, w: 30, h: 30 },
    hitstun: 0.32,
  },
  maeGeri: {
    name: 'Mae-geri', level: 'kick', points: 2, kind: 'kick', step: 100, back: 90,
    phases: [
      { pose: 'walk1', dur: 0.16, move: true },
      { pose: 'maeChamber', dur: 0.16, move: true },
      { pose: 'maeKick', dur: 0.07, active: true },
      { pose: 'maeChamber', dur: 0.14 },
      { pose: 'idle', dur: 0.16 },
      { pose: 'walk2', dur: 0.3, retreat: true },
    ],
    hitbox: { x: 60, y: 98, w: 34, h: 30 },
    hitstun: 0.35,
  },
  mawashiGeri: {
    name: 'Mawashi-geri jodan', level: 'jodan', points: 3, kind: 'kick', kiai: true, step: 100, back: 90,
    phases: [
      { pose: 'walk1', dur: 0.16, move: true },
      { pose: 'mawashiChamber', dur: 0.2, move: true },
      { pose: 'mawashiKick', dur: 0.08, active: true },
      { pose: 'mawashiChamber', dur: 0.14 },
      { pose: 'idle', dur: 0.16 },
      { pose: 'walk2', dur: 0.3, retreat: true },
    ],
    hitbox: { x: 60, y: 158, w: 36, h: 34 },
    hitstun: 0.45, knockdown: true,
  },
};

function blockStops(blockKind, move) {
  if (blockKind === 'uchi') return move.level === 'chudan';
  if (blockKind === 'age') return move.level === 'jodan';
  if (blockKind === 'gedan') return move.level === 'kick';
  return false;
}

const BLOCK_POSE = { uchi: 'uchiUke', age: 'ageUke', gedan: 'gedanBarai' };
const BLOCK_NAME = { uchi: 'Uchi-uke', age: 'Age-uke', gedan: 'Gedan-barai' };

// judo: phases drive both tori (pose) and uke (victim pose + offset from tori)
const THROWS = {
  osotoGari: {
    name: 'O-soto-gari', points: 3,
    phases: [
      { pose: 'osotoStep', dur: 0.18, victim: 'idle', off: 42 },
      { pose: 'osotoReap', dur: 0.14, victim: 'thrown', off: 56, active: true },
      { pose: 'osotoReap', dur: 0.12, victim: 'thrownGround', off: 74, land: true },
      { pose: 'todomeChamber', dur: 0.2, victim: 'thrownGround', off: 74 },
      { pose: 'todome', dur: 0.5, victim: 'thrownGround', off: 74, todome: true },
      { pose: 'idle', dur: 0.3, victim: 'thrownGround', off: 74 },
    ],
  },
  haraiGoshi: {
    name: 'Harai-goshi', points: 3,
    phases: [
      { pose: 'haraiGoshi', dur: 0.2, victim: 'idle', off: 40 },
      { pose: 'haraiGoshi', dur: 0.16, victim: 'thrownHigh', off: 30, active: true },
      { pose: 'haraiGoshi', dur: 0.14, victim: 'thrownGround', off: 72, land: true },
      { pose: 'todomeChamber', dur: 0.2, victim: 'thrownGround', off: 72 },
      { pose: 'todome', dur: 0.5, victim: 'thrownGround', off: 72, todome: true },
      { pose: 'idle', dur: 0.3, victim: 'thrownGround', off: 72 },
    ],
  },
  taiOtoshi: {
    name: 'Tai-otoshi', points: 3,
    phases: [
      { pose: 'taiOtoshi', dur: 0.16, victim: 'idle', off: 40 },
      { pose: 'taiOtoshi', dur: 0.14, victim: 'thrownHigh', off: 44, active: true },
      { pose: 'taiOtoshi', dur: 0.12, victim: 'thrownGround', off: 76, land: true },
      { pose: 'todomeChamber', dur: 0.2, victim: 'thrownGround', off: 76 },
      { pose: 'todome', dur: 0.5, victim: 'thrownGround', off: 76, todome: true },
      { pose: 'idle', dur: 0.3, victim: 'thrownGround', off: 76 },
    ],
  },
  koUchiGari: {
    name: 'Ko-uchi-gari', points: 2,
    phases: [
      { pose: 'koUchiGari', dur: 0.14, victim: 'idle', off: 42 },
      { pose: 'koUchiGari', dur: 0.12, victim: 'thrown', off: 56, active: true },
      { pose: 'koUchiGari', dur: 0.1, victim: 'thrownGround', off: 74, land: true },
      { pose: 'todomeChamber', dur: 0.2, victim: 'thrownGround', off: 74 },
      { pose: 'todome', dur: 0.5, victim: 'thrownGround', off: 74, todome: true },
      { pose: 'idle', dur: 0.3, victim: 'thrownGround', off: 74 },
    ],
  },
  deAshiBarai: {
    name: 'De-ashi-barai', points: 2,
    phases: [
      { pose: 'deAshiBarai', dur: 0.1, victim: 'idle', off: 46 },
      { pose: 'deAshiBarai', dur: 0.1, victim: 'thrown', off: 58, active: true },
      { pose: 'deAshiBarai', dur: 0.1, victim: 'thrownGround', off: 74, land: true },
      { pose: 'todomeChamber', dur: 0.2, victim: 'thrownGround', off: 74 },
      { pose: 'todome', dur: 0.5, victim: 'thrownGround', off: 74, todome: true },
      { pose: 'idle', dur: 0.3, victim: 'thrownGround', off: 74 },
    ],
  },
};
const THROW_RANGE = 80;
