// localStorage shim for window.storage
window.storage = {
  set: async (key, value) => { try { localStorage.setItem(key, value); return true; } catch(e) { return false; } },
  get: async (key) => { try { const v = localStorage.getItem(key); return v ? { value: v } : null; } catch(e) { return null; } },
  delete: async (key) => { try { localStorage.removeItem(key); return true; } catch(e) { return false; } },
  list: async (prefix) => {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.startsWith(prefix)) keys.push(k);
      }
      return { keys };
    } catch(e) { return { keys: [] }; }
  },
};

const { useState, useEffect, useCallback, useRef, useMemo } = React;


// ============================================================
// SOUND ENGINE (Web Audio API) - Rich Gacha Audio
// ============================================================
const audioCtx = typeof window !== 'undefined' ? new (window.AudioContext || window.webkitAudioContext)() : null;
const bgmMaster = audioCtx ? audioCtx.createGain() : null;
const sfxMaster = audioCtx ? audioCtx.createGain() : null;
if (bgmMaster) { bgmMaster.connect(audioCtx.destination); }
if (sfxMaster) { sfxMaster.connect(audioCtx.destination); }

// 自動再生制限対策(2026-08-25実バグ根治): ログイン直後にBGMが鳴らず、次のページ遷移(クリック音)で初めて鳴っていた。
// AudioContextのresumeはユーザー操作ハンドラ内でないと効かない環境があるため、全ての操作で確実に再開する。
// 再生要求済み(bgmWanted)なのに要素が止まっている場合もここで再生を蹴り直す(iOS系の初回play拒否対策)。
let bgmWanted = false;
if (audioCtx && typeof document !== 'undefined') {
  document.addEventListener('pointerdown', () => {
    try {
      if (audioCtx.state === 'suspended') audioCtx.resume();
      if (bgmWanted && mainBgmAudio.paused) mainBgmAudio.play().catch(() => {});
    } catch (e) {}
  }, { capture: true });
}

function playNote(freq, duration = 0.1, type = 'sine', volume = 0.15, delay = 0, dest = null) {
  if (!audioCtx) return;
  if (!dest && volSfx === 0) return;
  if (dest === bgmMaster && volGameBgm === 0) return;
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const t = audioCtx.currentTime + delay;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(dest || sfxMaster || audioCtx.destination);
    osc.start(t);
    osc.stop(t + duration + 0.01);
  } catch(e) {}
}

function playSweep(startFreq, endFreq, duration = 0.3, type = 'sine', volume = 0.12, dest = null) {
  if (!audioCtx) return;
  if (!dest && volSfx === 0) return;
  if (dest === bgmMaster && volGameBgm === 0) return;
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + duration);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(dest || sfxMaster || audioCtx.destination);
    osc.start(t);
    osc.stop(t + duration + 0.01);
  } catch(e) {}
}

function playChord(freqs, duration = 0.4, type = 'sine', volume = 0.08, delay = 0, dest = null) {
  freqs.forEach(f => playNote(f, duration, type, volume, delay, dest));
}

function playNoise(duration = 0.05, volume = 0.08, dest = null) {
  if (!audioCtx) return;
  if (!dest && volSfx === 0) return;
  if (dest === bgmMaster && volGameBgm === 0) return;
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    const src = audioCtx.createBufferSource();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3000;
    src.buffer = buffer;
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(dest || sfxMaster || audioCtx.destination);
    src.start();
  } catch(e) {}
}

// ============================================================
// BGM ENGINE - Looping mini-game music
// ============================================================
class BGMPlayer {
  constructor() { this.timers = []; this.playing = false; this.loopTimer = null; }
  stop() {
    this.playing = false;
    this.timers.forEach(t => clearTimeout(t)); this.timers = [];
    if (this.loopTimer) clearTimeout(this.loopTimer); this.loopTimer = null;
  }
  playLoop(pattern, bpm = 140) {
    if (volGameBgm === 0) return;
    this.stop(); this.playing = true;
    const ms = 60000 / bpm;
    const once = () => {
      if (!this.playing) return;
      pattern.forEach(({ n, b, d, t, v }) => {
        if (!this.playing) return;
        this.timers.push(setTimeout(() => { if (this.playing) playNote(n, d || ms/1000*0.8, t||'sine', v||0.04, 0, bgmMaster); }, b * ms));
      });
      this.loopTimer = setTimeout(() => once(), (Math.max(...pattern.map(p => p.b)) + 1) * ms);
    };
    once();
  }
}
const bgm = new BGMPlayer();

// Global volume levels (0.0 - 1.0)
let volMainBgm = 0.5;
let volGameBgm = 1.0;
let volSfx = 1.0;
// Load saved volumes
try {
  const sv = JSON.parse(localStorage.getItem('gacha_volumes') || '{}');
  if (sv.main !== undefined) volMainBgm = sv.main;
  if (sv.game !== undefined) volGameBgm = sv.game;
  if (sv.sfx !== undefined) volSfx = sv.sfx;
} catch(e) {}
if (bgmMaster) bgmMaster.gain.value = volGameBgm;
if (sfxMaster) sfxMaster.gain.value = volSfx;

// Main BGM: MP3 file player with loop, routed through Web Audio GainNode for mobile volume control
// Slider 0-100% maps to actual volume 0-30%
const bgmRealVol = (v) => v * 0.3;
const mainBgmAudio = new Audio('bgm-main.mp3');
mainBgmAudio.loop = true;
let mainBgmGain = null;
if (audioCtx) {
  try {
    const source = audioCtx.createMediaElementSource(mainBgmAudio);
    mainBgmGain = audioCtx.createGain();
    mainBgmGain.gain.value = bgmRealVol(volMainBgm);
    source.connect(mainBgmGain);
    mainBgmGain.connect(audioCtx.destination);
  } catch(e) {
    mainBgmAudio.volume = bgmRealVol(volMainBgm);
  }
}

const mainBgmControl = {
  play() {
    if (volMainBgm === 0) return;
    bgmWanted = true;
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    if (mainBgmGain) mainBgmGain.gain.value = bgmRealVol(volMainBgm);
    else mainBgmAudio.volume = bgmRealVol(volMainBgm);
    mainBgmAudio.play().catch(() => {});
  },
  stop() {
    bgmWanted = false;
    mainBgmAudio.pause();
    mainBgmAudio.currentTime = 0;
  },
  pause() {
    bgmWanted = false;
    mainBgmAudio.pause();
  },
  resume() {
    if (volMainBgm === 0) return;
    bgmWanted = true;
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    if (mainBgmGain) mainBgmGain.gain.value = bgmRealVol(volMainBgm);
    else mainBgmAudio.volume = bgmRealVol(volMainBgm);
    mainBgmAudio.play().catch(() => {});
  },
  setVolume(v) {
    const rv = bgmRealVol(v);
    if (mainBgmGain) mainBgmGain.gain.value = rv;
    else mainBgmAudio.volume = rv;
  },
  isPlaying() {
    return !mainBgmAudio.paused;
  }
};

// Tap BGM: Energetic driving beat
const BGM_TAP = [
  {n:130,b:0,d:0.12,t:'square',v:0.06},{n:330,b:0,d:0.08,t:'sine',v:0.03},
  {n:165,b:0.5,d:0.08,t:'square',v:0.04},{n:130,b:1,d:0.12,t:'square',v:0.06},
  {n:392,b:1,d:0.08,t:'sine',v:0.03},{n:165,b:1.5,d:0.08,t:'square',v:0.04},
  {n:147,b:2,d:0.12,t:'square',v:0.06},{n:440,b:2,d:0.08,t:'sine',v:0.03},
  {n:185,b:2.5,d:0.08,t:'square',v:0.04},{n:147,b:3,d:0.12,t:'square',v:0.06},
  {n:392,b:3,d:0.1,t:'sine',v:0.03},{n:185,b:3.5,d:0.08,t:'square',v:0.04},
  {n:174,b:4,d:0.12,t:'square',v:0.06},{n:523,b:4,d:0.1,t:'sine',v:0.035},
  {n:220,b:4.5,d:0.08,t:'square',v:0.04},{n:174,b:5,d:0.12,t:'square',v:0.06},
  {n:494,b:5,d:0.08,t:'sine',v:0.03},{n:220,b:5.5,d:0.08,t:'square',v:0.04},
  {n:147,b:6,d:0.12,t:'square',v:0.06},{n:440,b:6,d:0.1,t:'sine',v:0.035},
  {n:185,b:6.5,d:0.08,t:'square',v:0.04},{n:130,b:7,d:0.15,t:'square',v:0.06},
  {n:392,b:7,d:0.12,t:'sine',v:0.035},{n:330,b:7.5,d:0.1,t:'sine',v:0.03},
];
// Calc BGM: Chill thinking arpeggios
const BGM_CALC = [
  {n:262,b:0,d:0.3,t:'sine',v:0.03},{n:330,b:0.5,d:0.3,t:'sine',v:0.025},
  {n:392,b:1,d:0.3,t:'sine',v:0.03},{n:330,b:1.5,d:0.3,t:'sine',v:0.025},
  {n:294,b:2,d:0.3,t:'sine',v:0.03},{n:370,b:2.5,d:0.3,t:'sine',v:0.025},
  {n:440,b:3,d:0.3,t:'sine',v:0.03},{n:370,b:3.5,d:0.3,t:'sine',v:0.025},
  {n:247,b:4,d:0.3,t:'sine',v:0.03},{n:311,b:4.5,d:0.3,t:'sine',v:0.025},
  {n:370,b:5,d:0.3,t:'sine',v:0.03},{n:311,b:5.5,d:0.3,t:'sine',v:0.025},
  {n:262,b:6,d:0.3,t:'sine',v:0.03},{n:330,b:6.5,d:0.3,t:'sine',v:0.025},
  {n:392,b:7,d:0.4,t:'sine',v:0.035},
  {n:131,b:0,d:0.5,t:'triangle',v:0.025},{n:147,b:2,d:0.5,t:'triangle',v:0.025},
  {n:123,b:4,d:0.5,t:'triangle',v:0.025},{n:131,b:6,d:0.5,t:'triangle',v:0.025},
];

function sfx(name) {
  const sounds = {
    // === GACHA: Chest Open ===
    chestWood: () => {
      // Creaky wood open + small sparkle
      playNote(130, 0.12, 'sawtooth', 0.08);
      playNote(180, 0.15, 'square', 0.06, 0.05);
      playNoise(0.08, 0.06);
      playNote(440, 0.15, 'sine', 0.08, 0.15);
      playNote(554, 0.12, 'sine', 0.06, 0.22);
    },
    chestSilver: () => {
      // Metallic clink + ascending shimmer
      playNote(180, 0.1, 'sawtooth', 0.07);
      playNoise(0.06, 0.07);
      playNote(600, 0.12, 'sine', 0.1, 0.08);
      playNote(750, 0.15, 'sine', 0.09, 0.14);
      playNote(900, 0.12, 'sine', 0.07, 0.2);
    },
    chestGold: () => {
      // Grand golden chest: dramatic creak → ascending sparkle chord
      playNote(110, 0.15, 'sawtooth', 0.08);
      playNoise(0.1, 0.07);
      playSweep(200, 600, 0.25, 'sine', 0.1);
      [554, 660, 831].forEach((f, i) => playNote(f, 0.3, 'sine', 0.1, 0.2 + i * 0.07));
      playNote(1047, 0.4, 'sine', 0.08, 0.42);
      playNote(1319, 0.35, 'sine', 0.06, 0.5);
    },
    chestRainbow: () => {
      // Epic rainbow: deep impact → shimmering ascending arpeggio → chord bloom
      playNote(80, 0.3, 'sawtooth', 0.1);
      playNoise(0.15, 0.1);
      playSweep(150, 1200, 0.5, 'sine', 0.12);
      [440, 554, 660, 831, 1047, 1319, 1568].forEach((f, i) =>
        playNote(f, 0.35, 'sine', 0.1, 0.15 + i * 0.06)
      );
      // Final shimmering chord
      playChord([1047, 1319, 1568, 2093], 0.8, 'sine', 0.07, 0.6);
      playChord([1047, 1319, 1568, 2093], 0.6, 'triangle', 0.05, 0.7);
    },

    // === GACHA: Monster Reveal ===
    reveal1: () => {
      // ★1-2: Simple pop
      playNote(600, 0.08, 'square', 0.08);
      playNote(800, 0.1, 'sine', 0.06, 0.06);
    },
    reveal3: () => {
      // ★3-4: Bright two-note
      playNote(523, 0.1, 'sine', 0.1);
      playNote(784, 0.15, 'sine', 0.1, 0.08);
    },
    reveal5: () => {
      // ★5-6: Sparkle triple
      [659, 831, 1047].forEach((f, i) => playNote(f, 0.18, 'sine', 0.1, i * 0.07));
      playNoise(0.04, 0.04);
    },
    reveal7: () => {
      // ★7: Epic ascending quad
      [554, 659, 831, 1047].forEach((f, i) => playNote(f, 0.22, 'sine', 0.12, i * 0.08));
      playNote(1047, 0.3, 'triangle', 0.06, 0.35);
    },
    reveal8: () => {
      // ★8 Legend: Dramatic sweep + triumphant chord
      playSweep(300, 1200, 0.4, 'sine', 0.1);
      [659, 831, 1047, 1319].forEach((f, i) => playNote(f, 0.3, 'sine', 0.12, 0.2 + i * 0.06));
      playChord([1047, 1319, 1568], 0.5, 'sine', 0.08, 0.5);
      playNoise(0.06, 0.05);
    },
    reveal9: () => {
      // ★9 Mythical: Deep boom → ethereal ascending → shimmering hold
      playNote(65, 0.5, 'sawtooth', 0.1);
      playNoise(0.12, 0.08);
      playSweep(200, 2000, 0.6, 'sine', 0.1);
      [440, 554, 659, 831, 1047, 1319, 1568].forEach((f, i) =>
        playNote(f, 0.3, 'sine', 0.1, 0.15 + i * 0.07)
      );
      playChord([1319, 1568, 2093], 0.8, 'sine', 0.08, 0.7);
      playChord([1319, 1568, 2093], 0.6, 'triangle', 0.05, 0.8);
    },
    reveal10: () => {
      // ★10 GOD: Ground-shaking boom → silence → explosive fanfare
      playNote(40, 0.6, 'sawtooth', 0.15);
      playNote(55, 0.5, 'square', 0.08);
      playNoise(0.2, 0.12);
      // Silence gap, then fanfare at 0.5s
      playSweep(100, 3000, 0.8, 'sine', 0.1);
      [330, 440, 554, 660, 831, 1047, 1319, 1568, 2093].forEach((f, i) =>
        playNote(f, 0.4, 'sine', 0.12, 0.5 + i * 0.06)
      );
      // Majestic final chord
      playChord([1047, 1319, 1568, 2093], 1.2, 'sine', 0.1, 1.0);
      playChord([1047, 1319, 1568, 2093], 1.0, 'triangle', 0.06, 1.1);
      playChord([523, 784, 1047, 1568], 1.0, 'sine', 0.05, 1.2);
      // Sparkle tail
      [2093, 2349, 2637, 3136].forEach((f, i) =>
        playNote(f, 0.2, 'sine', 0.04, 1.5 + i * 0.1)
      );
    },

    // === ★12 CONGRATULATIONS FANFARES ===
    congrats1: () => {
      // Tier1 Gold: Deep boom → grand ascending fanfare → majestic chord → sparkle trail (5s)
      playNote(35, 0.8, 'sawtooth', 0.15);
      playNote(50, 0.6, 'square', 0.1);
      playNoise(0.3, 0.1);
      playSweep(80, 2500, 1.0, 'sine', 0.12);
      [262, 330, 392, 494, 587, 698, 831, 1047, 1319, 1568].forEach((f, i) =>
        playNote(f, 0.5, 'sine', 0.12, 0.6 + i * 0.08)
      );
      playChord([1047, 1319, 1568, 2093], 1.5, 'sine', 0.1, 1.5);
      playChord([1319, 1568, 2093], 1.2, 'triangle', 0.06, 1.8);
      [2093, 2349, 2637, 3136, 3520].forEach((f, i) =>
        playNote(f, 0.3, 'sine', 0.05, 2.5 + i * 0.12)
      );
      playChord([523, 1047, 1568, 2093], 2.0, 'sine', 0.04, 3.2);
      playChord([659, 1319, 1976], 1.5, 'triangle', 0.03, 3.8);
    },
    congrats2: () => {
      // Tier2 Rainbow: Thunder → sweep storm → double fanfare → rainbow shimmer (5s)
      playNote(30, 1.0, 'sawtooth', 0.18);
      playNote(45, 0.8, 'square', 0.12);
      playNoise(0.4, 0.14);
      playSweep(60, 3000, 1.2, 'sine', 0.14);
      playSweep(3000, 100, 0.5, 'sawtooth', 0.04, 0.3);
      [220, 277, 330, 415, 494, 587, 698, 831, 1047, 1319, 1568, 2093].forEach((f, i) =>
        playNote(f, 0.5, 'sine', 0.13, 0.5 + i * 0.07)
      );
      playChord([1047, 1319, 1568, 2093], 1.8, 'sine', 0.12, 1.4);
      playChord([1319, 1568, 2093, 2637], 1.5, 'triangle', 0.07, 1.7);
      playChord([784, 1047, 1568], 1.2, 'sine', 0.06, 2.0);
      [2093, 2349, 2637, 3136, 3520, 4186].forEach((f, i) =>
        playNote(f, 0.35, 'sine', 0.05, 2.5 + i * 0.1)
      );
      playChord([523, 1047, 1568, 2093, 2637], 2.5, 'sine', 0.04, 3.2);
      playChord([659, 1319, 1976, 2637], 2.0, 'triangle', 0.03, 3.5);
      [3520, 4186, 4699].forEach((f, i) => playNote(f, 0.4, 'sine', 0.03, 4.0 + i * 0.15));
    },
    congrats3: () => {
      // Tier3 Ultimate: Earthquake → triple sweep → epic 3-wave fanfare → celestial chorus (5s)
      playNote(25, 1.2, 'sawtooth', 0.2);
      playNote(40, 1.0, 'square', 0.15);
      playNote(55, 0.8, 'sawtooth', 0.1);
      playNoise(0.5, 0.16);
      playSweep(50, 4000, 1.5, 'sine', 0.15);
      playSweep(4000, 80, 0.6, 'sawtooth', 0.05, 0.2);
      playSweep(100, 3000, 0.8, 'triangle', 0.06, 0.4);
      [196, 247, 294, 370, 440, 554, 659, 831, 1047, 1319, 1568, 2093, 2637].forEach((f, i) =>
        playNote(f, 0.6, 'sine', 0.14, 0.4 + i * 0.06)
      );
      playChord([1047, 1319, 1568, 2093], 2.0, 'sine', 0.13, 1.2);
      playChord([1319, 1568, 2093, 2637], 1.8, 'triangle', 0.08, 1.5);
      playChord([784, 1047, 1568, 2093], 1.5, 'sine', 0.07, 1.8);
      [2093, 2349, 2637, 3136, 3520, 4186, 4699].forEach((f, i) =>
        playNote(f, 0.4, 'sine', 0.06, 2.2 + i * 0.1)
      );
      playChord([523, 1047, 1568, 2093, 2637, 3136], 2.5, 'sine', 0.05, 3.0);
      playChord([659, 1319, 1976, 2637, 3520], 2.0, 'triangle', 0.04, 3.3);
      playChord([784, 1568, 2349, 3136], 2.0, 'sine', 0.04, 3.6);
      [3520, 4186, 4699, 5274, 5920].forEach((f, i) => playNote(f, 0.5, 'sine', 0.03, 4.0 + i * 0.12));
      playChord([2093, 2637, 3136, 3520, 4186], 1.5, 'sine', 0.03, 4.6);
    },

    // === GACHA: Pull button ===
    gachaPull: () => {
      // Anticipation whoosh
      playSweep(200, 800, 0.3, 'sine', 0.08);
      playNoise(0.1, 0.06);
      playNote(400, 0.15, 'triangle', 0.06, 0.1);
    },

    // === MINI GAMES ===
    tap: () => playNote(440 + Math.random() * 60, 0.04, 'square', 0.07),
    tapBonus2: () => {
      playNote(523, 0.1, 'sine', 0.12); playNote(659, 0.12, 'sine', 0.12, 0.05);
      playNote(523, 0.06, 'triangle', 0.05);
    },
    tapBonus4: () => {
      [523, 659, 784].forEach((f, i) => playNote(f, 0.12, 'sine', 0.14, i * 0.04));
      playNoise(0.03, 0.04);
    },
    tapBonus6: () => {
      [523, 659, 784, 880].forEach((f, i) => playNote(f, 0.12, 'sine', 0.16, i * 0.04));
      playSweep(400, 900, 0.2, 'sine', 0.06);
    },
    tapBonus10: () => {
      playSweep(300, 1200, 0.3, 'sine', 0.08);
      [523, 659, 784, 880, 1047].forEach((f, i) => playNote(f, 0.18, 'sine', 0.18, i * 0.05));
      playChord([784, 1047, 1319], 0.3, 'sine', 0.06, 0.3);
    },
    tapBonus100: () => {
      playNote(80, 0.3, 'sawtooth', 0.08);
      playSweep(200, 2400, 0.5, 'sine', 0.1);
      [523, 659, 784, 880, 1047, 1319, 1568, 2093].forEach((f, i) => playNote(f, 0.25, 'sine', 0.2, 0.1 + i * 0.05));
      playChord([1047, 1319, 1568, 2093], 0.8, 'sine', 0.08, 0.6);
    },
    correctStreak: () => {
      // Ascending sparkle for correct answer streaks
      playNote(880, 0.08, 'sine', 0.1); playNote(1047, 0.1, 'sine', 0.1, 0.06);
      playNote(1319, 0.12, 'sine', 0.08, 0.12);
    },
    gameFinish: () => {
      // Victory fanfare
      [523, 659, 784].forEach((f, i) => playNote(f, 0.2, 'sine', 0.12, i * 0.1));
      playChord([784, 1047, 1319], 0.6, 'sine', 0.08, 0.35);
    },
    correct: () => { playNote(523, 0.08, 'sine', 0.1); playNote(659, 0.12, 'sine', 0.1, 0.06); },
    wrong: () => playNote(200, 0.2, 'sawtooth', 0.08),
    hit: () => { playNote(100, 0.25, 'sawtooth', 0.12); playNoise(0.08, 0.06); },

    // === UI ===
    sell: () => { playNote(800, 0.06, 'sine', 0.08); playNote(1000, 0.1, 'sine', 0.08, 0.05); },
    synth: () => {
      playSweep(300, 1500, 0.5, 'sine', 0.1);
      [440, 554, 660, 880, 1047].forEach((f, i) => playNote(f, 0.35, 'sine', 0.12, 0.1 + i * 0.09));
      playChord([880, 1047, 1319], 0.5, 'sine', 0.06, 0.55);
    },
    click: () => playNote(600, 0.03, 'square', 0.05),
  };
  if (sounds[name]) sounds[name]();
}
