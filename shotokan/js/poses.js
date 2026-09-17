'use strict';
// 16 joints, each [x, y]: origin at ground-center, X+ = forward, Y+ = up
// 0 HIP, 1 CHEST, 2 NECK, 3 HEAD, 4 ShoulderF, 5 ElbowF, 6 HandF,
// 7 ShoulderB, 8 ElbowB, 9 HandB, 10 HipF, 11 KneeF, 12 FootF, 13 HipB, 14 KneeB, 15 FootB
const P = {
  // zenkutsu-dachi kamae: front knee bent over toes, rear leg extended, guard inclined forward
  idle: [
    0,86, 6,122, 9,154, 10,170,
    20,148, 38,132, 48,156, -6,150, -10,128, 12,140,
    10,82, 40,42, 40,2, -8,82, -32,40, -58,2
  ],
  walk1: [
    2,86, 8,122, 11,154, 12,170,
    22,148, 40,132, 50,156, -4,150, -8,128, 14,140,
    12,82, 36,42, 32,2, -6,82, -24,40, -42,2
  ],
  walk2: [
    -2,86, 4,122, 7,154, 8,170,
    18,148, 36,132, 46,156, -8,150, -12,128, 10,140,
    8,82, 42,42, 46,2, -10,82, -36,40, -66,2
  ],
  // oi-zuki: lunge punch stepping in, hips slightly turned, rear hand hikite
  oiZuki: [
    4,84, 12,120, 14,152, 15,168,
    24,146, 50,144, 76,142, -6,148, -18,128, -12,102,
    14,80, 46,42, 46,2, -6,80, -34,38, -62,2
  ],
  // kizami-zuki: lead-hand jab to jodan from the kamae, hips stay sideways, rear hand guards
  kizamiZuki: [
    2,88, 8,124, 10,156, 11,172,
    22,152, 48,158, 72,164, -6,152, -10,130, 12,142,
    12,84, 40,42, 42,2, -8,84, -32,40, -56,2
  ],
  // oi-zuki continuing into jodan reach (front hand raised to head), used when the
  // step-through gyaku->oi-zuki lands at head height
  oiZukiJodan: [
    4,84, 12,120, 14,152, 15,168,
    22,150, 48,158, 74,166, -6,148, -18,128, -12,102,
    14,80, 46,42, 46,2, -6,80, -34,38, -62,2
  ],
  // gyaku-zuki: frontal zenkutsu, rear hand punches, front hand hikite
  gyakuZuki: [
    2,84, 8,120, 10,152, 10,168,
    10,146, -8,128, -4,100, 4,148, 32,146, 66,142,
    12,80, 44,42, 44,2, -8,80, -36,38, -64,2
  ],
  gyakuZukiJodan: [
    2,84, 8,120, 10,152, 10,168,
    10,146, -8,128, -4,100, 4,148, 34,158, 66,168,
    12,80, 44,42, 44,2, -8,80, -36,38, -64,2
  ],
  // mae-geri with the front leg: chamber, then snap to gedan/chudan
  maeChamber: [
    -4,96, 0,132, 2,164, 2,180,
    14,158, 32,144, 40,164, -10,160, -10,138, 10,150,
    4,92, 32,100, 24,74, -10,92, -16,46, -18,2
  ],
  maeKick: [
    -6,94, -4,130, -4,162, -4,178,
    12,156, 30,142, 38,162, -12,158, -12,136, 8,148,
    4,90, 42,108, 76,112, -10,90, -16,46, -18,2
  ],
  // yoko-geri kekomi (thrusting side kick) chudan, with the front leg
  yokoChamber: [
    -4,98, 2,136, 4,168, 4,184,
    16,160, 34,146, 42,166, -10,162, -10,140, 10,152,
    4,94, 26,118, 14,96, -10,94, -16,46, -18,2
  ],
  yokoKick: [
    -8,96, -6,134, -6,166, -6,182,
    10,158, 28,144, 36,164, -14,160, -14,138, 6,150,
    4,92, 46,128, 82,132, -10,92, -16,46, -18,2
  ],
  // mawashi-geri jodan with the rear leg, pivoting on the front foot
  mawashiChamber: [
    -2,96, -6,130, -8,162, -9,178,
    10,156, 26,142, 32,162, -14,158, -18,136, 0,146,
    -2,92, 4,48, 6,2, 8,92, 34,110, 22,88
  ],
  mawashiKick: [
    -6,94, -14,128, -18,158, -20,174,
    6,154, 22,140, 28,160, -18,156, -22,134, -4,144,
    -4,90, 2,46, 4,2, 6,90, 36,132, 72,160
  ],
  // the same technique aimed at the torso instead of the head — used before green belt
  mawashiKickChudan: [
    -6,94, -14,128, -18,158, -20,174,
    6,154, 22,140, 28,160, -18,156, -22,134, -4,144,
    -4,90, 2,46, 4,2, 6,90, 30,108, 66,124
  ],
  // uke: always with hikite
  ageUke: [
    -2,86, 4,122, 6,154, 6,170,
    18,148, 34,162, 12,180, -6,150, -18,128, -12,102,
    10,82, 40,42, 40,2, -8,82, -32,40, -58,2
  ],
  uchiUke: [
    -2,86, 4,122, 6,154, 6,170,
    18,148, 36,130, 44,160, -6,150, -18,128, -12,102,
    10,82, 40,42, 40,2, -8,82, -32,40, -58,2
  ],
  // gedan-barai: the sweeping (front/far) arm reaches well forward and across, so it clearly
  // passes in front of an incoming mae-geri shin rather than tucking low behind the leg
  gedanBarai: [
    0,82, 6,116, 8,148, 8,164,
    18,146, 40,124, 62,102, -6,146, -18,126, -12,100,
    12,78, 46,42, 46,2, -8,78, -36,38, -64,2
  ],
  // judo (tori)
  osotoStep: [
    12,92, 16,128, 16,160, 16,176,
    26,154, 46,158, 60,150, 6,156, 28,160, 50,146,
    18,88, 34,46, 30,2, 2,88, 30,74, 50,62
  ],
  osotoReap: [
    14,90, 14,126, 12,158, 10,174,
    24,152, 40,154, 52,144, 4,154, 24,156, 42,140,
    18,86, 32,44, 28,2, 2,86, -8,66, -30,58
  ],
  haraiGoshi: [
    6,90, 26,116, 36,140, 42,152,
    34,134, 50,146, 60,132, 18,130, 32,144, 44,130,
    12,86, 22,44, 20,2, -4,86, -20,76, -44,90
  ],
  taiOtoshi: [
    -6,70, 6,104, 10,134, 12,150,
    20,128, 42,118, 58,100, -2,130, 16,120, 34,102,
    4,66, 32,24, 50,2, -14,66, -24,36, -28,2
  ],
  koUchiGari: [
    4,90, 12,124, 16,156, 18,172,
    24,150, 46,144, 56,130, 6,152, 28,148, 40,134,
    10,86, 26,52, 46,14, -6,86, -20,46, -28,2
  ],
  deAshiBarai: [
    -2,92, 2,128, 4,160, 4,176,
    16,154, 40,148, 48,136, -6,156, 18,150, 32,136,
    8,88, 30,44, 54,10, -8,88, -20,46, -28,2
  ],
  // finishing punch to the downed opponent (todome / kime-zuki)
  // todome: drop low over the downed opponent, fist chambered high, then drive it down
  // gyaku-zuki: rear fist chambered at the hip, lead hand over the opponent; then the rear fist drives down
  todomeChamber: [
    6,58, 14,90, 18,120, 20,136,
    26,114, 40,96, 50,72, 0,116, -14,100, -4,84,
    12,54, 40,32, 38,2, -6,54, -14,30, -32,2
  ],
  todome: [
    10,46, 26,74, 36,100, 40,114,
    38,96, 24,80, 30,62, 8,98, 32,70, 62,24,
    16,42, 46,26, 44,2, -2,42, -12,26, -30,2
  ],
  // judo (uke)
  thrown: [
    0,110, -10,96, -18,86, -24,76,
    -14,102, -26,112, -32,104, 2,92, 14,102, 10,114,
    6,112, 4,134, -6,150, -8,112, -16,132, -24,146
  ],
  thrownHigh: [
    24,150, 4,146, -10,138, -20,130,
    14,152, 4,132, -6,118, 0,142, -10,126, -16,112,
    30,152, 42,174, 32,192, 18,152, 26,170, 14,188
  ],
  thrownGround: [
    0,18, -16,22, -28,20, -36,18,
    -12,26, -6,14, 6,8, -22,18, -28,12, -34,6,
    4,16, 18,12, 30,8, -6,16, -14,12, -22,8
  ],
  // hits
  hit: [
    -8,88, -12,122, -16,150, -20,166,
    4,150, -8,136, -16,122, -18,150, -28,134, -32,118,
    6,84, 20,44, 18,2, -10,84, -26,42, -40,2
  ],
  knockdown: [
    2,20, -14,24, -26,22, -34,20,
    -10,28, -4,16, 8,10, -20,20, -26,14, -32,8,
    6,18, 20,14, 32,10, -4,18, -12,14, -20,10
  ],
  getup: [
    0,54, 4,84, 6,112, 6,128,
    14,106, 22,90, 26,102, -8,108, -16,92, -12,80,
    8,50, 22,26, 18,2, -8,50, -18,24, -26,2
  ],
  // seiza: kneeling, sitting back on the heels, hands resting on the thighs
  seiza: [
    0,40, 2,74, 4,102, 4,118,
    10,96, 12,66, 12,40, -8,96, -10,66, -10,40,
    8,36, 20,18, 34,2, -8,36, -20,18, -34,2
  ],
  // seiza, front view (facing the camera): symmetric kneel, hands resting on the thighs
  seizaFront: [
    0,38, 0,72, 0,100, 0,116,
    14,94, 16,64, 14,40, -14,94, -16,64, -14,40,
    8,34, 20,16, 34,2, -8,34, -20,16, -34,2
  ],
  // one-knee kneel for the belt ceremony: front foot planted, rear knee down, head bowed forward
  kneelOne: [
    8,52, 14,84, 20,104, 24,112,
    22,78, 34,58, 44,44, -2,78, -8,58, 8,46,
    12,48, 30,26, 46,2, -6,48, -22,4, -40,2
  ],
  // ceremony
  shizentai: [
    0,92, 2,128, 3,160, 3,176,
    14,156, 16,128, 16,102, -12,156, -14,128, -14,102,
    6,88, 8,46, 8,2, -8,88, -10,46, -12,2
  ],
  rei: [
    0,90, 14,122, 24,148, 30,160,
    24,150, 28,122, 30,98, -2,150, 2,122, 4,98,
    6,86, 8,46, 8,2, -8,86, -10,46, -12,2
  ],
  victory: [
    0,92, 2,128, 3,160, 3,176,
    16,156, 26,176, 20,196, -10,156, -20,176, -14,196,
    8,88, 12,46, 12,2, -8,88, -12,46, -14,2
  ],
};

// rendering hints: which limbs come toward the camera / in front of the body
const POSE_META = {
  idle: { backArmFront: true },
  walk1: { backArmFront: true },
  walk2: { backArmFront: true },
  oiZuki: { backArmFront: true },
  oiZukiJodan: { backArmFront: true },
  // uke: the blocking (far) forearm must read in FRONT of the body and legs, over the incoming limb
  ageUke: { backArmFront: true, sweepFront: true },
  uchiUke: { backArmFront: true, sweepFront: true },
  gedanBarai: { backArmFront: true, sweepFront: true },
  mawashiChamber: { backLegFront: true },
  mawashiKick: { backLegFront: true },
  mawashiKickChudan: { backLegFront: true },
  osotoReap: { backLegFront: true, depthLeg: true },
  haraiGoshi: { backLegFront: true, depthLeg: true },
};

function lerpPose(out, a, b, t) {
  for (let i = 0; i < 32; i++) out[i] = a[i] + (b[i] - a[i]) * t;
  return out;
}
function copyPose(src) { return src.slice(); }
