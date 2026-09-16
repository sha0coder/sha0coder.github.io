'use strict';
let audioCtx = null;
let masterGain = null;

function ensureAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.7;
  masterGain.connect(audioCtx.destination);
}

function tone(freq, dur, type, vol, opts) {
  if (!audioCtx) return;
  opts = opts || {};
  const t0 = audioCtx.currentTime + (opts.delay || 0);
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (opts.slideTo) o.frequency.exponentialRampToValueAtTime(opts.slideTo, t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g); g.connect(masterGain);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

function noise(dur, vol, filterFreq, opts) {
  if (!audioCtx) return;
  opts = opts || {};
  const t0 = audioCtx.currentTime + (opts.delay || 0);
  const len = Math.floor(audioCtx.sampleRate * dur);
  const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  const f = audioCtx.createBiquadFilter();
  f.type = opts.type || 'bandpass';
  f.frequency.value = filterFreq;
  f.Q.value = opts.q || 1;
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(f); f.connect(g); g.connect(masterGain);
  src.start(t0);
}

// percussive impact: fast pitch drop through a soft clipper (no tonal "beep")
let clipCurve = null;
function thump(f0, f1, dur, vol, opts) {
  if (!audioCtx) return;
  opts = opts || {};
  const t0 = audioCtx.currentTime + (opts.delay || 0);
  const o = audioCtx.createOscillator();
  o.type = opts.type || 'sine';
  o.frequency.setValueAtTime(f0, t0);
  o.frequency.exponentialRampToValueAtTime(f1, t0 + dur * 0.6);
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  if (!clipCurve) {
    clipCurve = new Float32Array(256);
    for (let i = 0; i < 256; i++) { const x = i / 128 - 1; clipCurve[i] = Math.tanh(x * 3); }
  }
  const ws = audioCtx.createWaveShaper(); ws.curve = clipCurve;
  const pre = audioCtx.createGain(); pre.gain.value = opts.drive || 2.5;
  o.connect(pre); pre.connect(ws); ws.connect(g); g.connect(masterGain);
  o.start(t0); o.stop(t0 + dur + 0.02);
}
// sweeping noise: cloth swish / air
function swish(dur, vol, fFrom, fTo, opts) {
  if (!audioCtx) return;
  opts = opts || {};
  const t0 = audioCtx.currentTime + (opts.delay || 0);
  const len = Math.floor(audioCtx.sampleRate * dur);
  const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = audioCtx.createBufferSource(); src.buffer = buf;
  const f = audioCtx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = opts.q || 1.2;
  f.frequency.setValueAtTime(fFrom, t0);
  f.frequency.exponentialRampToValueAtTime(fTo, t0 + dur);
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + dur * 0.35);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(f); f.connect(g); g.connect(masterGain);
  src.start(t0);
}

// noise burst whose lowpass sweeps down fast: the "crack" of an impact
function crack(dur, vol, fFrom, fTo, opts) {
  if (!audioCtx) return;
  opts = opts || {};
  const t0 = audioCtx.currentTime + (opts.delay || 0);
  const len = Math.floor(audioCtx.sampleRate * dur);
  const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = audioCtx.createBufferSource(); src.buffer = buf;
  const f = audioCtx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = opts.q || 1.5;
  f.frequency.setValueAtTime(fFrom, t0);
  f.frequency.exponentialRampToValueAtTime(fTo, t0 + dur);
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(f); f.connect(g); g.connect(masterGain);
  src.start(t0);
}

const SFX = {
  // punch landing: crack + sub thump
  hitLight() { crack(0.11, 0.9, 5000, 250); thump(150, 48, 0.16, 0.55, { drive: 3 }); },
  // kick landing: bigger crack, deeper and longer sub
  hitHeavy() { crack(0.18, 1.0, 3500, 150, { q: 2 }); thump(110, 30, 0.32, 0.8, { drive: 4 }); noise(0.25, 0.25, 200, { type: 'lowpass', delay: 0.02 }); },
  // forearm on forearm: dry wooden knock
  block() { thump(520, 180, 0.05, 0.35, { type: 'triangle', drive: 1.5 }); noise(0.03, 0.3, 3200, { q: 2 }); },
  whoosh() { swish(0.2, 0.22, 500, 2600); },
  // body hitting the tatami
  thud() { thump(95, 28, 0.4, 0.8, { drive: 3 }); noise(0.3, 0.35, 220, { type: 'lowpass' }); noise(0.06, 0.25, 1200, { q: 0.6 }); },
  // point: taiko hit + short bell
  point() { thump(120, 45, 0.3, 0.6, { drive: 3 }); tone(1320, 0.35, 'triangle', 0.12, { delay: 0.05 }); tone(1980, 0.25, 'sine', 0.06, { delay: 0.05 }); },
  ko() { thump(80, 22, 0.7, 0.9, { drive: 4 }); noise(0.5, 0.35, 300, { type: 'lowpass' }); },
  step() { noise(0.04, 0.1, 500, { type: 'lowpass' }); },

  // victory: rising A minor arpeggio with a detuned second voice, over two taiko hits
  win() {
    if (!audioCtx) return;
    const notes = [220, 261.6, 329.6, 440, 523.3, 659.3];
    notes.forEach((f, i) => {
      tone(f, 0.28, 'triangle', 0.16, { delay: i * 0.09 });
      tone(f * 1.005, 0.28, 'square', 0.05, { delay: i * 0.09 });
    });
    tone(880, 1.4, 'triangle', 0.18, { delay: 0.56 });
    tone(659.3, 1.4, 'triangle', 0.12, { delay: 0.56 });
    tone(884, 1.4, 'sawtooth', 0.04, { delay: 0.56 });
    thump(130, 40, 0.35, 0.7, { drive: 3 });
    thump(130, 40, 0.35, 0.7, { drive: 3, delay: 0.56 });
  },
  // defeat: slow falling minor phrase with a deep drum
  lose() {
    if (!audioCtx) return;
    const notes = [329.6, 293.7, 261.6, 246.9, 220];
    notes.forEach((f, i) => {
      tone(f, 0.5, 'triangle', 0.16, { delay: i * 0.3 });
      tone(f / 2, 0.5, 'sawtooth', 0.05, { delay: i * 0.3 });
    });
    thump(70, 22, 0.9, 0.8, { drive: 4, delay: 1.2 });
    noise(0.6, 0.25, 250, { type: 'lowpass', delay: 1.2 });
  },

  // shouted "ki-AI!": a tight bright vowel that snaps open, voiced saw through two moving formants,
  // hard attack, pitch falling at the end, with a breath layer
  kiai(pitch) {
    if (!audioCtx) return;
    pitch = pitch || 1;
    const t0 = audioCtx.currentTime;
    const dur = 0.42;
    const o = audioCtx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(300 * pitch, t0);
    o.frequency.setValueAtTime(300 * pitch, t0 + 0.08);
    o.frequency.linearRampToValueAtTime(340 * pitch, t0 + 0.14);
    o.frequency.exponentialRampToValueAtTime(170 * pitch, t0 + dur);
    const f1 = audioCtx.createBiquadFilter(); f1.type = 'bandpass'; f1.Q.value = 5;
    const f2 = audioCtx.createBiquadFilter(); f2.type = 'bandpass'; f2.Q.value = 6;
    // 'i' (300 / 2300) -> 'a' (750 / 1250)
    f1.frequency.setValueAtTime(320 * pitch, t0); f1.frequency.linearRampToValueAtTime(760 * pitch, t0 + 0.13);
    f2.frequency.setValueAtTime(2300 * pitch, t0); f2.frequency.linearRampToValueAtTime(1250 * pitch, t0 + 0.13);
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.001, t0);
    g.gain.exponentialRampToValueAtTime(0.5, t0 + 0.015);
    g.gain.setValueAtTime(0.5, t0 + 0.08);
    g.gain.exponentialRampToValueAtTime(1.3, t0 + 0.12);
    g.gain.setValueAtTime(1.3, t0 + 0.2);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    const g1 = audioCtx.createGain(); g1.gain.value = 0.7;
    const g2 = audioCtx.createGain(); g2.gain.value = 0.35;
    const ws = audioCtx.createWaveShaper();
    if (!clipCurve) { clipCurve = new Float32Array(256); for (let i = 0; i < 256; i++) clipCurve[i] = Math.tanh((i / 128 - 1) * 3); }
    ws.curve = clipCurve;
    o.connect(f1); f1.connect(g1); g1.connect(ws);
    o.connect(f2); f2.connect(g2); g2.connect(ws);
    ws.connect(g); g.connect(masterGain);
    o.start(t0); o.stop(t0 + dur + 0.05);
    noise(0.3, 0.2, 1800 * pitch, { q: 0.6, delay: 0.1 });
  },

  // "Osu!": voiced 'o' (formants ~500/900), a hiss 's', short voiced 'u' (~350/700)
  osu(pitch) {
    if (!audioCtx) return;
    pitch = pitch || 1;
    const t0 = audioCtx.currentTime;
    const vowel = (start, dur, f0, f1, f2, vol) => {
      const o = audioCtx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(f0 * pitch, t0 + start);
      o.frequency.exponentialRampToValueAtTime(f0 * 0.85 * pitch, t0 + start + dur);
      const a = audioCtx.createBiquadFilter(); a.type = 'bandpass'; a.frequency.value = f1; a.Q.value = 4;
      const b = audioCtx.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = f2; b.Q.value = 5;
      const g = audioCtx.createGain();
      g.gain.setValueAtTime(0.001, t0 + start);
      g.gain.exponentialRampToValueAtTime(vol, t0 + start + 0.03);
      g.gain.setValueAtTime(vol, t0 + start + dur * 0.6);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + start + dur);
      const gb = audioCtx.createGain(); gb.gain.value = 0.6;
      o.connect(a); a.connect(g); o.connect(b); b.connect(gb); gb.connect(g); g.connect(masterGain);
      o.start(t0 + start); o.stop(t0 + start + dur + 0.05);
    };
    // "OSS!": short hard 'o', then a long strong 's' hiss, no trailing vowel
    vowel(0, 0.16, 160, 520, 900, 1.1);
    noise(0.26, 0.4, 5600, { delay: 0.13, q: 3 });
    noise(0.2, 0.12, 3200, { delay: 0.13, q: 1.5 });
  },
};

// ==================== MUSIC (SID-style, three voices + drums) ====================
// A minor with Phrygian colour. Sections A · B · A' · bridge, 28 bars per loop.
// Chords are semitone offsets from A; melodies are [semitone from A4, length in 16ths] pairs.
const Am = [0, 3, 7], F = [-4, 0, 3], G = [-2, 2, 5], Dm = [5, 8, 12], E = [7, 11, 14], C = [3, 7, 10], Bb = [1, 5, 8];
const N = null;
function expand(pairs) {
  const out = [];
  for (const [n, len] of pairs) { out.push({ n, len }); for (let i = 1; i < len; i++) out.push(null); }
  return out;
}
const MEL_A = expand([
  [12,2],[10,2],[8,2],[7,4],[N,2],[3,2],[7,2],[8,4],[7,2],[5,2],[3,4],[N,4],
  [8,2],[10,2],[12,4],[8,2],[10,2],[12,4],[14,2],[12,2],[10,2],[12,2],[10,2],[8,2],[7,4],
  [7,2],[8,2],[10,2],[12,4],[15,2],[14,2],[12,2],[10,2],[12,2],[10,2],[8,2],[7,4],[N,4],
  [5,2],[8,2],[12,2],[17,4],[15,2],[14,2],[12,2],[11,4],[14,2],[11,2],[7,4],[N,4],
]);
const MEL_B = expand([
  [15,3],[14,1],[12,2],[10,2],[12,4],[N,4],
  [14,3],[12,1],[10,2],[7,2],[10,4],[N,4],
  [12,2],[14,2],[17,2],[15,2],[14,2],[12,2],[10,4],
  [12,4],[7,2],[8,2],[7,2],[5,2],[3,4],
  [8,2],[12,2],[15,2],[12,2],[8,2],[12,2],[15,4],
  [14,2],[17,2],[19,2],[17,2],[14,2],[12,2],[10,4],
  [11,4],[12,2],[11,2],[8,2],[7,2],[4,4],
  [7,2],[8,2],[11,2],[14,2],[19,8],
]);
const MEL_BRIDGE = expand(
  [[13,17,20,25],[12,15,19,24],[13,17,20,25],[11,14,19,23]].flatMap(arp =>
    [0,1,2,3].flatMap(() => arp.map(n => [n, 1]))));

const SECTIONS = [
  { chords: [Am, Am, F, G, Am, Am, Dm, E], melody: MEL_A, bass: 'drive', drums: 'rock', pad: true },
  { chords: [C, G, Dm, Am, F, G, E, E], melody: MEL_B, bass: 'synco', drums: 'rock', pad: true },
  { chords: [Am, Am, F, G, Am, Am, Dm, E], melody: MEL_A, bass: 'drive', drums: 'rock', pad: true, double: true },
  { chords: [Bb, Am, Bb, E], melody: MEL_BRIDGE, bass: 'half', drums: 'half', pad: false },
];
const BASS = {
  drive: [0, 0, 12, 0, 0, 12, 0, 0, 0, 0, 12, 0, 7, 0, 12, 10],
  synco: [0, N, 0, 12, N, 0, N, 7, 0, N, 0, 12, N, 10, 12, N],
  half: [0, N, N, N, N, N, 0, N, N, N, N, N, 12, N, N, N],
};
let totalSteps = 0;
for (const s of SECTIONS) { s.start = totalSteps; s.steps = s.chords.length * 16; totalSteps += s.steps; }

const MUSIC = {
  playing: false,
  bpm: 138,
  step: 0,
  nextTime: 0,
  timer: null,
  volume: 0.55,
  baseFreq: 220, // A3

  freq(semi) { return this.baseFreq * Math.pow(2, semi / 12); },

  start() {
    ensureAudio();
    if (this.playing) return;
    this.playing = true;
    this.step = 0;
    this.nextTime = audioCtx.currentTime + 0.05;
    this.timer = setInterval(() => this.schedule(), 40);
  },
  stop() {
    this.playing = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  },
  toggle() { this.playing ? this.stop() : this.start(); },

  schedule() {
    const stepDur = 60 / this.bpm / 4;
    while (this.nextTime < audioCtx.currentTime + 0.12) {
      this.playStep(this.step, this.nextTime, stepDur);
      this.nextTime += stepDur;
      this.step++;
    }
  },

  voice(freq, t, dur, type, vol, opts) {
    opts = opts || {};
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (opts.detune) o.detune.value = opts.detune;
    if (opts.arp) {
      for (let i = 0, n = Math.floor(dur / 0.02); i < n; i++) {
        o.frequency.setValueAtTime(freq * Math.pow(2, opts.arp[i % opts.arp.length] / 12), t + i * 0.02);
      }
    }
    if (opts.vibrato) {
      const lfo = audioCtx.createOscillator();
      const lg = audioCtx.createGain();
      lfo.frequency.value = 5.5; lg.gain.value = 7;
      lfo.connect(lg); lg.connect(o.detune);
      lfo.start(t + 0.08); lfo.stop(t + dur + 0.01);
    }
    g.gain.setValueAtTime(0.001, t);
    g.gain.exponentialRampToValueAtTime(vol * this.volume, t + 0.01);
    g.gain.setValueAtTime(vol * this.volume, t + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(masterGain);
    o.start(t); o.stop(t + dur + 0.02);
  },

  drum(kind, t) {
    const g = audioCtx.createGain();
    g.connect(masterGain);
    if (kind === 'kick') {
      const o = audioCtx.createOscillator();
      o.type = 'square';
      o.frequency.setValueAtTime(160, t);
      o.frequency.exponentialRampToValueAtTime(40, t + 0.08);
      g.gain.setValueAtTime(0.35 * this.volume, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      o.connect(g); o.start(t); o.stop(t + 0.12);
    } else {
      const len = Math.floor(audioCtx.sampleRate * 0.06);
      const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const s = audioCtx.createBufferSource();
      s.buffer = buf;
      const f = audioCtx.createBiquadFilter();
      f.type = 'highpass'; f.frequency.value = kind === 'snare' ? 1800 : 6000;
      g.gain.setValueAtTime((kind === 'snare' ? 0.3 : 0.1) * this.volume, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + (kind === 'snare' ? 0.08 : 0.03));
      s.connect(f); f.connect(g); s.start(t);
    }
  },

  playStep(step, t, dur) {
    const s = step % totalSteps;
    const sec = SECTIONS.find(x => s >= x.start && s < x.start + x.steps);
    const local = s - sec.start;
    const bar = Math.floor(local / 16), s16 = local % 16;
    const chord = sec.chords[bar];
    const lastBar = bar === sec.chords.length - 1;

    // bass (octave below chord root)
    const b = BASS[sec.bass][s16];
    if (b !== null) this.voice(this.freq(chord[0] + b - 12), t, dur * (sec.bass === 'half' ? 3 : 0.9), 'sawtooth', 0.22);

    // chord pad with SID-style fast arpeggio
    if (sec.pad && s16 % 2 === 0) this.voice(this.freq(chord[0] + 12), t, dur * 1.8, 'square', 0.06, { arp: chord.map(c => c - chord[0]) });

    // lead
    const m = sec.melody[local];
    if (m && m.n !== null) {
      const d = dur * m.len * 0.92;
      const f = this.freq(m.n + 12);
      this.voice(f, t, d, 'square', 0.16, { vibrato: m.len >= 4 });
      if (sec.double) this.voice(f, t, d, 'square', 0.1, { detune: 9 });
    }

    // drums
    if (sec.drums === 'rock') {
      if (s16 === 0 || s16 === 8 || (s16 === 10 && bar % 2 === 1)) this.drum('kick', t);
      if (s16 === 4 || s16 === 12) this.drum('snare', t);
      if (lastBar && s16 >= 13) this.drum('snare', t);
      if (s16 % 2 === 1) this.drum('hat', t);
    } else {
      if (s16 === 0) this.drum('kick', t);
      if (s16 === 8) this.drum('snare', t);
      if (s16 % 4 === 2) this.drum('hat', t);
      if (lastBar && s16 >= 12) this.drum('snare', t);
    }
  },
};
