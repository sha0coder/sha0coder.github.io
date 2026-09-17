'use strict';
// Heian Yondan (simplified for side view) — attract-mode demo on the title screen
Object.assign(P, {
  // Shotokan kokutsu-dachi: long and low, hips back over the deeply bent rear leg, front leg extended
  // Heian Yondan opening: both open hands rise together to one side (haiwan-uke), close to each other
  kokutsuHaiwan: [
    -18,80, -14,116, -12,148, -12,164,
    -2,146, 12,162, 28,178, -28,148, -8,166, 18,186,
    -8,78, 20,44, 52,2, -26,78, -44,36, -42,2
  ],
  jujiUkeGedan: [
    2,86, 8,120, 10,152, 10,168,
    18,148, 24,118, 34,92, -6,150, 10,120, 32,94,
    12,82, 40,44, 40,2, -8,82, -30,42, -54,2
  ],
  moroteUke: [
    -18,80, -14,116, -12,148, -12,164,
    0,146, 20,128, 30,160, -28,148, -12,128, 12,132,
    -8,78, 20,44, 52,2, -26,78, -44,36, -42,2
  ],
  yokoKeage: [
    -4,96, -6,132, -6,164, -6,180,
    12,158, 30,168, 44,172, -14,160, -16,138, 2,148,
    4,92, 22,88, 34,84, -10,92, -16,46, -18,2
  ],
  maeEmpi: [
    2,88, 10,124, 12,156, 12,172,
    20,150, 46,152, 22,154, -6,152, 16,146, 42,152,
    12,84, 40,44, 40,2, -8,84, -30,42, -54,2
  ],
  shutoUchi: [
    2,88, 10,124, 12,156, 12,172,
    22,150, 46,160, 70,170, -6,152, -10,176, -2,192,
    12,84, 40,44, 40,2, -8,84, -30,42, -54,2
  ],
  kakiwake: [
    0,90, 4,126, 6,158, 6,174,
    18,152, 34,136, 40,162, -8,154, -20,136, -14,162,
    10,86, 34,46, 34,2, -8,86, -26,44, -46,2
  ],
  // Kanku Dai opening — FRONT VIEW: hands joined low, raised slowly above the head, opened wide, crossed down
  kankuYoi: [
    0,92, 0,128, 0,160, 0,176,
    15,156, 18,128, 5,106, -15,156, -18,128, -5,106,
    5,88, 5,46, 5,2, -5,88, -5,46, -5,2
  ],
  kankuRaise: [
    0,92, 0,128, 0,160, 0,178,
    15,156, 24,182, 7,208, -15,156, -24,182, -7,208,
    5,88, 5,46, 5,2, -5,88, -5,46, -5,2
  ],
  kankuOpen: [
    0,92, 0,128, 0,160, 0,176,
    16,156, 44,172, 74,184, -16,156, -44,172, -74,184,
    5,88, 5,46, 5,2, -5,88, -5,46, -5,2
  ],
  kankuDown: [
    0,92, 0,128, 0,160, 0,176,
    15,156, 20,126, -8,116, -15,156, -20,126, 8,118,
    5,88, 5,46, 5,2, -5,88, -5,46, -5,2
  ],
  // Kanku Dai — side view techniques
  haishuSide: [
    0,92, 2,128, 3,160, 3,176,
    14,156, 40,156, 66,158, -12,156, -14,128, -8,104,
    8,88, 10,46, 10,2, -8,88, -10,46, -10,2
  ],
  tateShuto: [
    -18,80, -14,116, -12,148, -12,164,
    0,146, 26,140, 48,152, -28,148, -34,124, -24,100,
    -8,78, 20,44, 52,2, -26,78, -44,36, -42,2
  ],
  manjiUke: [
    -18,80, -12,116, -10,148, -10,164,
    2,146, 22,122, 38,94, -28,148, -36,172, -22,190,
    -8,78, 20,44, 52,2, -26,78, -44,36, -42,2
  ],
  urakenJodan: [
    2,86, 8,122, 10,154, 10,170,
    20,148, 44,158, 66,170, -6,150, -18,128, -12,102,
    12,82, 44,42, 44,2, -8,82, -34,40, -60,2
  ],
  kankuCrouch: [
    0,36, 10,64, 16,90, 18,104,
    22,84, 30,58, 42,28, -4,86, -8,58, 2,32,
    8,32, 30,26, 24,2, -8,32, -22,24, -30,2
  ],
  kankuJump: [
    0,150, 4,184, 6,214, 6,230,
    18,208, 36,196, 44,216, -8,210, -12,188, 8,198,
    8,146, 34,140, 62,150, -8,146, -14,120, -20,96
  ],
  // Heian Godan
  kokutsuUchiUke: [
    -18,80, -14,116, -12,148, -12,164,
    0,146, 22,130, 32,160, -28,148, -34,124, -24,100,
    -8,78, 20,44, 52,2, -26,78, -44,36, -42,2
  ],
  mizuNagare: [
    0,92, 2,128, 3,160, 3,176,
    14,156, 38,152, 62,150, -12,156, -10,130, 10,138,
    5,88, 5,46, 5,2, -5,88, -5,46, -5,2
  ],
  jujiJodan: [
    2,86, 8,122, 10,154, 10,170,
    18,148, 24,172, 6,196, -6,150, -2,174, 16,196,
    12,82, 44,42, 44,2, -8,82, -34,40, -60,2
  ],
  jumpJuji: [
    0,150, 4,184, 6,214, 6,230,
    18,208, 24,184, 10,164, -6,210, -2,186, 14,166,
    8,146, 26,124, 14,104, -8,146, -18,122, -22,100
  ],
  kosaJuji: [
    2,74, 8,108, 10,138, 10,154,
    20,134, 28,110, 16,84, -8,136, 0,110, 24,86,
    10,70, 22,36, 24,2, -6,70, 0,34, -10,8
  ],
  // kosa-dachi landing forward after the mae-geri, uraken snapping down (Heian Yondan 13, kiai)
  kosaUraken: [
    2,74, 8,108, 10,138, 10,154,
    20,134, 34,120, 48,92, -8,136, -18,116, -12,96,
    10,70, 22,36, 24,2, -6,70, 0,34, -10,8
  ],
  hizaGeri: [
    -2,94, 8,124, 14,152, 16,166,
    20,146, 34,122, 30,108, -4,148, 4,124, 14,108,
    6,90, 38,104, 26,70, -10,90, -16,46, -18,2
  ],
  shutoUke: [
    -18,80, -14,116, -12,148, -12,164,
    0,146, 22,132, 34,162, -28,148, -14,126, -2,124,
    -8,78, 20,44, 52,2, -26,78, -44,36, -42,2
  ],
  // Tekki Shodan — FRONT VIEW (facing the camera): +x = screen right. Techniques go right (f=1) or left (f=-1).
  // joints 4-6 right arm, 7-9 left arm, 10-12 right leg, 13-15 left leg
  heisoku: [
    0,92, 0,128, 0,160, 0,176,
    15,156, 13,128, 5,102, -15,156, -13,128, -5,102,
    5,88, 5,46, 5,2, -5,88, -5,46, -5,2
  ],
  reiFront: [
    0,90, 0,120, 0,144, 0,152,
    15,146, 14,120, 10,96, -15,146, -14,120, -10,96,
    5,86, 5,46, 5,2, -5,86, -5,46, -5,2
  ],
  // crossing step: left foot crosses in front of the right
  kosaDachi: [
    2,82, 2,118, 2,150, 2,166,
    16,146, 18,120, 12,98, -16,146, -4,118, 8,98,
    7,78, 10,40, 12,2, -7,78, 6,42, 18,6
  ],
  // kiba-dachi: wide, knees out, feet towards the camera
  kibaHaishu: [
    0,76, 0,112, 0,144, 0,160,
    18,140, 44,140, 70,142, -18,140, -24,116, -16,94,
    10,72, 36,40, 46,2, -10,72, -36,40, -46,2
  ],
  // mae-empi to the right: left elbow strikes across into the right palm
  kibaEmpi: [
    0,76, 0,112, 0,144, 0,160,
    18,140, 36,120, 30,144, -18,140, 28,146, 2,148,
    10,72, 36,40, 46,2, -10,72, -36,40, -46,2
  ],
  kibaGedan: [
    0,76, 0,112, 0,144, 0,160,
    18,140, 32,112, 48,82, -18,140, -24,116, -16,94,
    10,72, 36,40, 46,2, -10,72, -36,40, -46,2
  ],
  // kagi-zuki: left fist hooks across the body to the right, right hand hikite
  kibaKagi: [
    0,76, 0,112, 0,144, 0,160,
    18,140, 24,116, 18,94, -18,140, -12,118, 22,122,
    10,72, 36,40, 46,2, -10,72, -36,40, -46,2
  ],
  kibaUchiUke: [
    0,76, 0,112, 0,144, 0,160,
    18,140, 36,124, 44,158, -18,140, -24,116, -16,94,
    10,72, 36,40, 46,2, -10,72, -36,40, -46,2
  ],
  // nagashi-uke by the head with the left hand + ura-zuki with the right
  kibaNagashi: [
    0,76, 0,112, 0,144, 0,160,
    18,140, 32,120, 44,138, -18,140, -14,164, 0,180,
    10,72, 36,40, 46,2, -10,72, -36,40, -46,2
  ],
  // nami-gaeshi: right foot snaps up to the inside
  namiGaeshi: [
    -4,78, -4,114, -4,146, -4,162,
    14,142, 32,126, 40,160, -22,142, -28,118, -20,96,
    6,74, 26,64, 6,44, -14,74, -40,40, -50,2
  ],
  // morote-zuki: both fists to the right, right high, left low
  moroteZuki: [
    0,76, 0,112, 0,144, 0,160,
    18,140, 44,142, 72,146, -18,140, 6,120, 34,114,
    10,72, 36,40, 46,2, -10,72, -36,40, -46,2
  ],
});
Object.assign(POSE_META, {
  kokutsuHaiwan: { openHands: true },
  yokoKeage: { depthLeg: false },
  shutoUchi: { openHands: true },
  shutoUke: { openHands: true },
  moroteUke: { openHands: false },
  kibaHaishu: { openHands: true },
  kibaNagashi: { openHands: true },
  kosaDachi: { frontLeg: 'L' },
  kankuYoi: { openHands: true },
  kankuRaise: { openHands: true },
  kankuOpen: { openHands: true },
  kankuDown: { openHands: true },
  kankuCrouch: { openHands: true },
  haishuSide: { openHands: true },
  tateShuto: { openHands: true },
  manjiUke: { openHands: true },
  mizuNagare: { openHands: true },
  jujiJodan: { openHands: true },
});

const HEIAN_YONDAN = [
  { pose: 'shizentai', f: 1, dur: 1.2, label: 'Yoi' },
  { pose: 'kokutsuHaiwan', f: -1, dur: 1.6, label: '1 · Kokutsu-dachi, haiwan-uke (lento)' },
  { pose: 'kokutsuHaiwan', f: 1, dur: 1.6, label: '2 · Kokutsu-dachi, haiwan-uke (lento)' },
  { pose: 'jujiUkeGedan', f: 1, dur: 0.7, label: '3 · Zenkutsu-dachi, gedan juji-uke' },
  { pose: 'moroteUke', f: 1, dur: 0.8, label: '4 · Kokutsu-dachi, morote-uke' },
  { pose: 'yokoKeage', f: -1, dur: 0.5, label: '5 · Yoko-geri keage + uraken' },
  { pose: 'maeEmpi', f: -1, dur: 0.6, label: '6 · Zenkutsu-dachi, mae-empi' },
  { pose: 'yokoKeage', f: 1, dur: 0.5, label: '7 · Yoko-geri keage + uraken' },
  { pose: 'maeEmpi', f: 1, dur: 0.6, label: '8 · Zenkutsu-dachi, mae-empi' },
  { pose: 'shutoUchi', f: 1, dur: 0.7, label: '9 · Shuto-uchi jodan' },
  { pose: 'maeChamber', f: 1, dur: 0.25, label: '10 · Mae-geri' },
  { pose: 'maeKick', f: 1, dur: 0.3, label: '10 · Mae-geri' },
  { pose: 'kosaUraken', f: 1, dur: 0.9, label: '11 · Kosa-dachi, uraken-uchi — KIAI', kiai: true },
  { pose: 'kakiwake', f: -1, dur: 0.8, label: '12 · Kakiwake-uke' },
  { pose: 'maeChamber', f: -1, dur: 0.25, label: '13 · Mae-geri' },
  { pose: 'maeKick', f: -1, dur: 0.3, label: '13 · Mae-geri' },
  { pose: 'oiZuki', f: -1, dur: 0.4, label: '14 · Oi-zuki' },
  { pose: 'gyakuZuki', f: -1, dur: 0.5, label: '15 · Gyaku-zuki' },
  { pose: 'kakiwake', f: 1, dur: 0.8, label: '16 · Kakiwake-uke' },
  { pose: 'maeChamber', f: 1, dur: 0.25, label: '17 · Mae-geri' },
  { pose: 'maeKick', f: 1, dur: 0.3, label: '17 · Mae-geri' },
  { pose: 'oiZuki', f: 1, dur: 0.4, label: '18 · Oi-zuki' },
  { pose: 'gyakuZuki', f: 1, dur: 0.5, label: '19 · Gyaku-zuki' },
  { pose: 'moroteUke', f: -1, dur: 0.7, label: '20 · Morote-uke' },
  { pose: 'moroteUke', f: 1, dur: 0.7, label: '21 · Morote-uke' },
  { pose: 'moroteUke', f: 1, dur: 0.7, label: '22 · Morote-uke' },
  { pose: 'kakiwake', f: 1, dur: 0.6, label: '23 · Jodan kakiwake' },
  { pose: 'hizaGeri', f: 1, dur: 0.7, label: '25 · Hiza-geri — KIAI', kiai: true },
  { pose: 'shutoUke', f: -1, dur: 0.8, label: '26 · Kokutsu-dachi, shuto-uke' },
  { pose: 'shutoUke', f: 1, dur: 0.8, label: '27 · Kokutsu-dachi, shuto-uke' },
  { pose: 'shizentai', f: 1, dur: 1.0, label: 'Naore' },
  { pose: 'rei', f: 1, dur: 1.4, label: 'Rei — OSU!', osu: true },
];

// Tekki Shodan: lateral embusen, the figure turns towards the side each technique is aimed at
const TEKKI_SHODAN = [
  { pose: 'heisoku', f: 1, dur: 1.2, label: 'Yoi · heisoku-dachi' },
  { pose: 'kosaDachi', f: 1, dur: 0.7, label: '1 · Kosa-dachi' },
  { pose: 'kibaHaishu', f: 1, dur: 0.9, label: '2 · Kiba-dachi, haishu-uke' },
  { pose: 'kibaEmpi', f: 1, dur: 0.6, label: '3 · Mae-empi' },
  { pose: 'kibaGedan', f: -1, dur: 0.8, label: '4 · Gedan-barai' },
  { pose: 'kibaKagi', f: 1, dur: 0.6, label: '5 · Kagi-zuki' },
  { pose: 'kosaDachi', f: -1, dur: 0.6, label: '6 · Kosa-dachi' },
  { pose: 'kibaUchiUke', f: -1, dur: 0.7, label: '7 · Uchi-uke' },
  { pose: 'kibaNagashi', f: 1, dur: 0.5, label: '8 · Nagashi-uke' },
  { pose: 'kibaKagi', f: 1, dur: 0.5, label: '9 · Ura-zuki' },
  { pose: 'namiGaeshi', f: 1, dur: 0.4, label: '10 · Nami-gaeshi' },
  { pose: 'kibaUchiUke', f: 1, dur: 0.3, label: '10 · Nami-gaeshi' },
  { pose: 'namiGaeshi', f: -1, dur: 0.4, label: '11 · Nami-gaeshi' },
  { pose: 'kibaUchiUke', f: -1, dur: 0.3, label: '11 · Nami-gaeshi' },
  { pose: 'moroteZuki', f: 1, dur: 1.0, label: '12 · Morote-zuki — KIAI', kiai: true },
  { pose: 'kibaHaishu', f: -1, dur: 0.9, label: '13 · Haishu-uke' },
  { pose: 'kibaEmpi', f: -1, dur: 0.6, label: '14 · Mae-empi' },
  { pose: 'kibaGedan', f: 1, dur: 0.8, label: '15 · Gedan-barai' },
  { pose: 'kibaKagi', f: -1, dur: 0.6, label: '16 · Kagi-zuki' },
  { pose: 'kosaDachi', f: 1, dur: 0.6, label: '17 · Kosa-dachi' },
  { pose: 'kibaUchiUke', f: 1, dur: 0.7, label: '18 · Uchi-uke' },
  { pose: 'kibaNagashi', f: -1, dur: 0.5, label: '19 · Nagashi-uke' },
  { pose: 'kibaKagi', f: -1, dur: 0.5, label: '20 · Ura-zuki' },
  { pose: 'namiGaeshi', f: -1, dur: 0.4, label: '21 · Nami-gaeshi' },
  { pose: 'kibaUchiUke', f: -1, dur: 0.3, label: '21 · Nami-gaeshi' },
  { pose: 'namiGaeshi', f: 1, dur: 0.4, label: '22 · Nami-gaeshi' },
  { pose: 'kibaUchiUke', f: 1, dur: 0.3, label: '22 · Nami-gaeshi' },
  { pose: 'moroteZuki', f: -1, dur: 1.0, label: '23 · Morote-zuki — KIAI', kiai: true },
  { pose: 'heisoku', f: 1, dur: 1.0, label: 'Naore' },
  { pose: 'reiFront', f: 1, dur: 1.4, label: 'Rei — OSU!', osu: true },
];

// Kanku Dai (abridged): the opening faces the camera, the rest runs in side view
const KANKU_DAI = [
  { pose: 'kankuYoi', f: 1, dur: 1.4, label: 'Yoi · hands joined', view: 'front' },
  { pose: 'kankuRaise', f: 1, dur: 2.6, label: '1 · Rising slowly, looking through the hands', view: 'front' },
  { pose: 'kankuOpen', f: 1, dur: 1.1, label: '2 · Arms open wide', view: 'front' },
  { pose: 'kankuDown', f: 1, dur: 1.2, label: '3 · Hands cross down to shuto', view: 'front' },
  { pose: 'haishuSide', f: -1, dur: 0.8, label: '4 · Chudan haishu-uke (left)' },
  { pose: 'haishuSide', f: 1, dur: 0.8, label: '5 · Chudan haishu-uke (right)' },
  { pose: 'tateShuto', f: 1, dur: 0.8, label: '6 · Kokutsu-dachi, tate-shuto-uke' },
  { pose: 'gyakuZuki', f: 1, dur: 0.6, label: '7 · Gyaku-zuki chudan' },
  { pose: 'tateShuto', f: -1, dur: 0.8, label: '8 · Kokutsu-dachi, tate-shuto-uke' },
  { pose: 'gyakuZuki', f: -1, dur: 0.6, label: '9 · Gyaku-zuki chudan' },
  { pose: 'moroteUke', f: 1, dur: 0.8, label: '10 · Kokutsu-dachi, uchi-uke' },
  { pose: 'yokoKeage', f: -1, dur: 0.5, label: '11 · Yoko-geri keage + uraken' },
  { pose: 'shutoUke', f: -1, dur: 0.7, label: '12 · Kokutsu-dachi, shuto-uke' },
  { pose: 'shutoUke', f: -1, dur: 0.7, label: '13 · Kokutsu-dachi, shuto-uke' },
  { pose: 'yokoKeage', f: 1, dur: 0.5, label: '14 · Yoko-geri keage + uraken' },
  { pose: 'shutoUke', f: 1, dur: 0.7, label: '15 · Kokutsu-dachi, shuto-uke' },
  { pose: 'shutoUke', f: 1, dur: 0.7, label: '16 · Kokutsu-dachi, shuto-uke' },
  { pose: 'manjiUke', f: 1, dur: 0.9, label: '17 · Jodan shuto-uchi, gedan shuto' },
  { pose: 'maeChamber', f: 1, dur: 0.25, label: '18 · Mae-geri' },
  { pose: 'maeKick', f: 1, dur: 0.3, label: '18 · Mae-geri' },
  { pose: 'oiZuki', f: 1, dur: 0.9, label: '19 · Oi-zuki chudan — KIAI', kiai: true },
  { pose: 'manjiUke', f: -1, dur: 0.9, label: '20 · Kokutsu-dachi, manji-uke' },
  { pose: 'manjiUke', f: 1, dur: 0.9, label: '21 · Kokutsu-dachi, manji-uke' },
  { pose: 'yokoKeage', f: -1, dur: 0.5, label: '22 · Yoko-geri keage + uraken' },
  { pose: 'shutoUke', f: -1, dur: 0.7, label: '23 · Kokutsu-dachi, shuto-uke' },
  { pose: 'shutoUke', f: -1, dur: 0.7, label: '24 · Kokutsu-dachi, shuto-uke' },
  { pose: 'yokoKeage', f: 1, dur: 0.5, label: '25 · Yoko-geri keage + uraken' },
  { pose: 'shutoUke', f: 1, dur: 0.7, label: '26 · Kokutsu-dachi, shuto-uke' },
  { pose: 'shutoUke', f: 1, dur: 0.7, label: '27 · Kokutsu-dachi, shuto-uke' },
  { pose: 'urakenJodan', f: 1, dur: 0.5, label: '28 · Uraken jodan' },
  { pose: 'maeChamber', f: 1, dur: 0.2, label: '29 · Mae-geri' },
  { pose: 'maeKick', f: 1, dur: 0.3, label: '29 · Mae-geri' },
  { pose: 'gyakuZuki', f: 1, dur: 0.6, label: '30 · Gyaku-zuki' },
  { pose: 'urakenJodan', f: 1, dur: 0.5, label: '31 · Uraken jodan' },
  { pose: 'maeChamber', f: 1, dur: 0.2, label: '32 · Mae-geri' },
  { pose: 'maeKick', f: 1, dur: 0.3, label: '32 · Mae-geri' },
  { pose: 'gyakuZuki', f: 1, dur: 0.6, label: '33 · Gyaku-zuki' },
  { pose: 'kankuCrouch', f: 1, dur: 1.5, label: '34 · Dropping low, looking under' },
  { pose: 'urakenJodan', f: 1, dur: 0.7, label: '35 · Rising, uraken jodan' },
  { pose: 'gedanBarai', f: -1, dur: 0.7, label: '36 · Gedan-barai' },
  { pose: 'gyakuZuki', f: -1, dur: 0.6, label: '37 · Gyaku-zuki' },
  { pose: 'moroteUke', f: 1, dur: 0.8, label: '38 · Kokutsu-dachi, uchi-uke' },
  { pose: 'oiZuki', f: 1, dur: 0.7, label: '39 · Oi-zuki chudan' },
  { pose: 'moroteUke', f: -1, dur: 0.8, label: '40 · Kokutsu-dachi, uchi-uke' },
  { pose: 'oiZuki', f: -1, dur: 0.7, label: '41 · Oi-zuki chudan' },
  { pose: 'ageUke', f: 1, dur: 0.8, label: '42 · Jodan shuto-uchi' },
  { pose: 'kankuJump', f: 1, dur: 0.45, label: '43 · Nidan-geri (jump)' },
  { pose: 'kosaUraken', f: 1, dur: 1.0, label: '43 · Landing kosa-dachi, uraken — KIAI', kiai: true },
  { pose: 'shutoUke', f: -1, dur: 0.8, label: '44 · Kokutsu-dachi, shuto-uke' },
  { pose: 'shutoUke', f: 1, dur: 0.8, label: '45 · Kokutsu-dachi, shuto-uke' },
  { pose: 'shizentai', f: 1, dur: 1.0, label: 'Naore' },
  { pose: 'rei', f: 1, dur: 1.4, label: 'Rei — OSS!', osu: true },
];

const HEIAN_GODAN = [
  { pose: 'shizentai', f: 1, dur: 1.2, label: 'Yoi' },
  { pose: 'kokutsuUchiUke', f: -1, dur: 0.8, label: '1 · Kokutsu-dachi, uchi-uke' },
  { pose: 'gyakuZuki', f: -1, dur: 0.6, label: '2 · Gyaku-zuki chudan' },
  { pose: 'mizuNagare', f: -1, dur: 1.6, label: '3 · Heisoku-dachi, mizu-nagare no kamae (slow)' },
  { pose: 'kokutsuUchiUke', f: 1, dur: 0.8, label: '4 · Kokutsu-dachi, uchi-uke' },
  { pose: 'gyakuZuki', f: 1, dur: 0.6, label: '5 · Gyaku-zuki chudan' },
  { pose: 'mizuNagare', f: 1, dur: 1.6, label: '6 · Heisoku-dachi, mizu-nagare no kamae (slow)' },
  { pose: 'moroteUke', f: 1, dur: 0.8, label: '7 · Kokutsu-dachi, morote-uke' },
  { pose: 'jujiUkeGedan', f: 1, dur: 0.8, label: '8 · Zenkutsu-dachi, gedan juji-uke' },
  { pose: 'jujiJodan', f: 1, dur: 0.8, label: '9 · Jodan juji-uke' },
  { pose: 'kakiwake', f: 1, dur: 0.7, label: '10 · Kake-te, osae-uke' },
  { pose: 'oiZuki', f: 1, dur: 0.9, label: '11 · Oi-zuki chudan — KIAI', kiai: true },
  { pose: 'gedanBarai', f: -1, dur: 0.8, label: '12 · Kiba-dachi, gedan-barai' },
  { pose: 'haishuSide', f: 1, dur: 0.7, label: '13 · Haishu-uke' },
  { pose: 'mawashiKick', f: 1, dur: 0.35, label: '14 · Mikazuki-geri' },
  { pose: 'maeEmpi', f: 1, dur: 0.6, label: '14 · Mae-empi' },
  { pose: 'moroteUke', f: 1, dur: 0.8, label: '15 · Morote-uke' },
  { pose: 'kakiwake', f: 1, dur: 0.6, label: '16 · Kosa-uke' },
  { pose: 'jumpJuji', f: 1, dur: 0.45, label: '17 · Tobi (jump)' },
  { pose: 'kosaJuji', f: 1, dur: 1.0, label: '17 · Kosa-dachi, gedan juji-uke — KIAI', kiai: true },
  { pose: 'moroteUke', f: 1, dur: 0.8, label: '18 · Zenkutsu-dachi, morote-uke' },
  { pose: 'manjiUke', f: -1, dur: 0.9, label: '19 · Kokutsu-dachi, manji-uke' },
  { pose: 'gedanBarai', f: -1, dur: 0.7, label: '20 · Zenkutsu-dachi, gedan-barai' },
  { pose: 'manjiUke', f: 1, dur: 0.9, label: '21 · Kokutsu-dachi, manji-uke' },
  { pose: 'gedanBarai', f: 1, dur: 0.7, label: '22 · Zenkutsu-dachi, gedan-barai' },
  { pose: 'manjiUke', f: -1, dur: 0.9, label: '23 · Kokutsu-dachi, manji-uke' },
  { pose: 'shizentai', f: 1, dur: 1.0, label: 'Naore' },
  { pose: 'rei', f: 1, dur: 1.4, label: 'Rei — OSS!', osu: true },
];

const KATAS = [
  { name: 'TEKKI SHODAN', steps: TEKKI_SHODAN, view: 'front' },
  { name: 'KANKU DAI', steps: KANKU_DAI },
  { name: 'HEIAN YONDAN', steps: HEIAN_YONDAN },
  { name: 'HEIAN GODAN', steps: HEIAN_GODAN },
];

// the title demo always opens with Tekki Shodan, then cycles through the list in order
let kataCursor = 0;
class KataPlayer {
  constructor() {
    this.fighter = new Fighter({ x: 700, facing: 1, isPlayer: false, beltColor: 'black', kiaiPitch: 1, label: '' });
    this.fighter.state = 'frozen';
    this.t = 0;
    this.label = '';
    kataCursor = KATAS.findIndex(k => k.name === 'TEKKI SHODAN');
    this.load(KATAS[kataCursor]);
  }
  load(kata) {
    this.kata = kata;
    this.name = kata.name;
    this.fighter.view = kata.view || 'side';
    this.fighter.pose = copyPose(P[kata.steps[0].pose]);
    this.i = -1;
    this.next();
  }
  // kata viewer: manual stepping through the movements
  setStep(i) {
    const n = this.kata.steps.length;
    this.i = ((i % n) + n) % n - 1;
    this.next();
  }
  switchKata(dir) {
    kataCursor = (kataCursor + dir + KATAS.length) % KATAS.length;
    this.load(KATAS[kataCursor]);
  }
  next() {
    if (this.i + 1 >= this.kata.steps.length) {
      if (this.manual) { this.i = -1; }
      else { kataCursor = (kataCursor + 1) % KATAS.length; this.load(KATAS[kataCursor]); return; }
    }
    this.i++;
    const s = this.kata.steps[this.i];
    const view = s.view || this.kata.view || 'side';
    if (view !== this.fighter.view) { this.fighter.view = view; this.fighter.pose = copyPose(P[s.pose]); }
    this.t = s.dur;
    this.label = s.label;
    this.fighter.facing = s.f;
    this.fighter.setPose(s.pose, s.dur > 1 ? 4 : 14);
    if (s.kiai && audioCtx) SFX.kiai(1);
    if (s.osu && audioCtx) SFX.osu(1);
  }
  update(dt) {
    if (!this.manual) {
      this.t -= dt;
      if (this.t <= 0) this.next();
    }
    this.fighter.update(dt, null, null);
  }
}
