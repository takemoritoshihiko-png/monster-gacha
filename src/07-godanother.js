// ============================================================
// GOD ANOTHER GAME (ゴッドアナザー / 180秒・演出中はタイマー停止)
// ============================================================
// --- 音の土台: sfxBus → compressor → sfxMaster / 並行 sfxBus → convolver(生成IR) → wet → compressor ---
const gaBufs = {};
let gaBus = null, gaComp = null, gaConv = null, gaWet = null, gaWarmStarted = false;
// 予約済み音源の登録簿。start() で未来の時刻に予約したノードは、画面を閉じても予約通りに鳴ってしまう。
// gaTrack で登録し、gaStopScheduled() でまとめて止める(自然終了した分は onended で自動的に外れる)。
let gaSched = [];
function gaTrack(n) {
  try {
    gaSched.push(n);
    n.onended = () => { const i = gaSched.indexOf(n); if (i >= 0) gaSched.splice(i, 1); };
  } catch (e) {}
  return n;
}
function gaStopScheduled() {
  const list = gaSched; gaSched = [];
  list.forEach(n => { try { n.stop(0); } catch (e) {} });
}
function gaMakeBuf(dur, fn) {
  const a = audioCtx; if (!a) return null;
  const sr = a.sampleRate, buf = a.createBuffer(2, Math.max(1, Math.floor(sr * dur)), sr);
  for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < d.length; i++) d[i] = fn(i / sr, ch); }
  return buf;
}
function gaGetBus() {
  const a = audioCtx; if (!a) return null;
  if (gaBus) return gaBus;
  try {
    gaBus = a.createGain(); gaBus.gain.value = 1;
    gaComp = a.createDynamicsCompressor();
    gaComp.threshold.value = -18; gaComp.knee.value = 12; gaComp.ratio.value = 5;
    gaComp.attack.value = 0.003; gaComp.release.value = 0.25;
    gaBus.connect(gaComp);
    gaComp.connect(sfxMaster || a.destination);
  } catch (e) { gaBus = null; }
  return gaBus;
}
function gaEnsureReverb() {
  const a = audioCtx; if (!a || gaConv) return;
  const bus = gaGetBus(); if (!bus || !gaComp) return;
  try {
    const ir = gaMakeBuf(2.0, (s) => (Math.random() * 2 - 1) * Math.pow(Math.max(0, 1 - s / 2.0), 2.6) * Math.exp(-s * 1.1));
    if (!ir) return;
    gaConv = a.createConvolver(); gaConv.normalize = true; gaConv.buffer = ir;
    gaWet = a.createGain(); gaWet.gain.value = 0.22;
    bus.connect(gaConv); gaConv.connect(gaWet); gaWet.connect(gaComp);
  } catch (e) { gaConv = null; }
}
// 重量バッファ(生成コストが高い音)の定義。startGame/ready表示時に事前生成してキャッシュする
const GA_SND = {
  godGong: [5.0, (s, ch) => { const f0 = 55; return (Math.sin(2 * Math.PI * f0 * s) * 0.5 * Math.exp(-s * 0.5) + Math.sin(2 * Math.PI * f0 * 2 * s) * 0.35 * Math.exp(-s * 0.7) + Math.sin(2 * Math.PI * f0 * 3 * s) * 0.2 * Math.exp(-s * 0.9) + Math.sin(2 * Math.PI * f0 * 4 * s) * 0.12 * Math.exp(-s * 1.1) + Math.sin(2 * Math.PI * f0 * 6 * s) * 0.06 * Math.exp(-s * 1.5) + Math.exp(-s * 6) * (Math.random() * 2 - 1) * 0.7 + Math.sin(2 * Math.PI * 27.5 * s) * 0.3 * Math.exp(-s * 0.8)) * (ch === 0 ? 0.65 : 0.6); }],
  godCoins: [2.5, (s, ch) => { let v = 0; for (let n = 0; n < 24; n++) { const o = n * 0.06, f = 1600 + n * 160 + (ch * 70); if (s > o) v += Math.sin(2 * Math.PI * f * (s - o)) * Math.exp(-(s - o) * 3) * 0.07; } return v * 0.9; }],
  meioRumble: [3.0, (s, ch) => { const sub = Math.sin(2 * Math.PI * 32 * s * (1 + 0.02 * Math.sin(2 * Math.PI * 1.3 * s))) * 0.55 * Math.exp(-s * 0.5); const grind = (Math.random() * 2 - 1) * 0.16 * Math.exp(-s * 0.9); const drone = Math.sin(2 * Math.PI * 49 * s) * 0.25 * Math.exp(-s * 0.6); return (sub + grind + drone) * (ch === 0 ? 0.62 : 0.58); }],
  allSpin: [2.2, (s, ch) => { const f = 90 + s * 95; return (Math.sin(2 * Math.PI * f * s) * 0.28 + Math.sin(2 * Math.PI * f * 2 * s) * 0.12 + (Math.random() * 2 - 1) * 0.05) * Math.min(s * 3, 1) * (ch === 0 ? 0.5 : 0.46); }],
  sinBoom: [2.4, (s, ch) => { const boom = (Math.random() * 2 - 1) * Math.exp(-s * 2.2) * 0.7; const sub = Math.sin(2 * Math.PI * 38 * s) * Math.exp(-s * 1.4) * 0.6; const shine = Math.sin(2 * Math.PI * (6000 * Math.exp(-s * 5)) * s) * Math.exp(-s * 6) * 0.3; return (boom + sub + shine) * (ch === 0 ? 0.62 : 0.58); }],
  glass: [1.2, (s, ch) => { let v = 0; for (let i = 0; i < 18; i++) { const o = i * 0.045, f = 2600 + i * 430 + ch * 120; if (s > o) v += Math.sin(2 * Math.PI * f * (s - o)) * Math.exp(-(s - o) * 13) * 0.09; } return (v + (Math.random() * 2 - 1) * Math.exp(-s * 6) * 0.25) * 0.9; }],
  thunder: [1.0, (s, ch) => { const crack = Math.sin(2 * Math.PI * (9000 * Math.exp(-s * 14)) * s) * Math.exp(-s * 10) * 0.4; const boom = (Math.random() * 2 - 1) * Math.exp(-s * 3.2) * 0.55; const sub = Math.sin(2 * Math.PI * 45 * s * (1 + 0.25 * Math.random())) * Math.exp(-s * 2) * 0.45; return (crack + boom + sub) * (ch === 0 ? 0.6 : 0.55); }],
  // P3: GODファンファーレ①地鳴り(D1=36.7Hzサブ+ノイズスウェル0.8秒)
  godRumble: [0.85, (s, ch) => { const env = Math.min(s / 0.6, 1) * (s > 0.72 ? Math.max(0, 1 - (s - 0.72) / 0.13) : 1); const sub = Math.sin(2 * Math.PI * 36.7 * s) * 0.8 + Math.sin(2 * Math.PI * 73.4 * s) * 0.18; const nz = (Math.random() * 2 - 1) * 0.24 * Math.pow(Math.min(s / 0.7, 1), 2); return (sub + nz) * env * (ch === 0 ? 0.62 : 0.58); }],
  oneG: [0.8, (s, ch) => { const thunder = (Math.random() * 2 - 1) * Math.exp(-s * 3) * 0.7; const crack = Math.sin(2 * Math.PI * 80 * s) * Math.exp(-s * 5) * 0.5; const rumble = Math.sin(2 * Math.PI * 40 * s * (1 + Math.random() * 0.3)) * Math.exp(-s * 1.5) * 0.4; const zap = Math.sin(2 * Math.PI * (8000 * Math.exp(-s * 12)) * s) * Math.exp(-s * 8) * 0.3; return (thunder + crack + rumble + zap) * (ch === 0 ? 0.6 : 0.55); }],
  // 連打で毎回鳴る操作音。波形は固定なので合成式はそのまま1回だけ焼き、以後はキャッシュ再生する
  // (以前は1タップごとにバッファを作り直していたため、50ms連打では毎秒最大60回の生成が走っていた)
  // レバーON「ガコッ」: ①低域トランジェント(レバーが落ちる衝撃) ②金属クリック(非整数倍音) ③極短ノイズのアタック
  // 主操作=連打なので音圧は抑えめ。バスのコンプ(-18dB/5:1)で頭を潰して耳の疲れを避ける
  tap: [0.16, (s, ch) => {
    const thud = (Math.sin(2 * Math.PI * 116 * s) * 0.85 + Math.sin(2 * Math.PI * 58 * s) * 0.6) * Math.exp(-s * 34);
    const clack = (Math.sin(2 * Math.PI * 1870 * s) * 0.3 + Math.sin(2 * Math.PI * 2630 * s) * 0.2 + Math.sin(2 * Math.PI * 3910 * s) * 0.11) * Math.exp(-s * 95);
    const atk = (Math.random() * 2 - 1) * Math.exp(-s * 200) * 0.5;
    return (thud + clack + atk) * (ch === 0 ? 0.3 : 0.28);
  }],
  // リール停止「ガシャッ」: 金属の当たり(低域クランク+非整数倍音)+ 擦れノイズ + サブの芯
  reelStop: [0.2, (s, ch) => {
    const clank = (Math.sin(2 * Math.PI * 168 * s) * 0.7 + Math.sin(2 * Math.PI * 252 * s) * 0.3) * Math.exp(-s * 28);
    const metal = (Math.sin(2 * Math.PI * 1420 * s) * 0.24 + Math.sin(2 * Math.PI * 2180 * s) * 0.16 + Math.sin(2 * Math.PI * 3260 * s) * 0.1) * Math.exp(-s * 46);
    const shhh = (Math.random() * 2 - 1) * Math.exp(-s * 70) * 0.4;
    const sub = Math.sin(2 * Math.PI * 62 * s) * 0.45 * Math.exp(-s * 22);
    return (clank + metal + shhh + sub) * (ch === 0 ? 0.5 : 0.46);
  }],
  softStop: [0.1, (s) => (Math.sin(2 * Math.PI * 140 * s) * Math.exp(-s * 34) * 0.4) * 0.7],
};
function gaPlay(key, vol) {
  const a = audioCtx; if (!a) return;
  if (a.state === 'suspended') a.resume();
  let b = gaBufs[key];
  if (!b) { const g = GA_SND[key]; if (!g) return; b = gaBufs[key] = gaMakeBuf(g[0], g[1]); if (!b) return; }
  const bs = a.createBufferSource(); bs.buffer = b;
  const gn = a.createGain(); gn.gain.value = vol == null ? 1 : vol;
  bs.connect(gn); gn.connect(gaGetBus() || a.destination); bs.start(a.currentTime); gaTrack(bs);
}
// 事前生成はidle時に1件ずつ(ready画面表示時に開始。playing中の一括生成を避ける)
function gaWarmup() {
  if (!audioCtx || gaWarmStarted) return; gaWarmStarted = true;
  const keys = ['__ir'].concat(Object.keys(GA_SND));
  const ric = (typeof window !== 'undefined' && window.requestIdleCallback) ? (f) => window.requestIdleCallback(f, { timeout: 400 }) : (f) => setTimeout(f, 16);
  let i = 0;
  const step = () => {
    if (i >= keys.length) return;
    const k = keys[i++];
    try { if (k === '__ir') gaEnsureReverb(); else if (!gaBufs[k]) gaBufs[k] = gaMakeBuf(GA_SND[k][0], GA_SND[k][1]); } catch (e) {}
    ric(step);
  };
  ric(step);
}

// --- リール回転ループ音(実機のドラム回転を模した機械音) ---------------------------
// 構成: ①帯域制限ノイズ=ドラムの摩擦 ②低いのこぎり波+ローパス=モーターのハム ③26Hzのこぎり波LFO=コマ通過のカチカチ
// 生成ノードは gaSpinNodes 1組だけ(多重起動しない)。停止は gaSpinLoopSet(false) / gaSpinLoopStop() のどちらでも必ず解放される。
let gaSpinNodes = null;
function gaSpinLoopStart() {
  const a = audioCtx; if (!a || gaSpinNodes) return;
  const bus = gaGetBus() || a.destination; if (!bus) return;
  if (a.state === 'suspended') a.resume();
  try {
    let nb = gaBufs.__spinNoise;
    if (!nb) nb = gaBufs.__spinNoise = gaMakeBuf(1.0, () => Math.random() * 2 - 1);
    if (!nb) return;
    const t0 = a.currentTime;
    const out = a.createGain();
    out.gain.setValueAtTime(0.0001, t0);
    out.gain.linearRampToValueAtTime(1, t0 + 0.06);   // 立ち上がりは短いフェードイン(プチッを防ぐ)
    out.connect(bus);
    // ① 摩擦ノイズ
    const ns = a.createBufferSource(); ns.buffer = nb; ns.loop = true;
    const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 950; bp.Q.value = 0.85;
    const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
    const ng = a.createGain(); ng.gain.value = 0.048;
    ns.connect(bp); bp.connect(lp); lp.connect(ng); ng.connect(out);
    // ② モーターのハム
    const mo = a.createOscillator(); mo.type = 'sawtooth'; mo.frequency.value = 58;
    const ml = a.createBiquadFilter(); ml.type = 'lowpass'; ml.frequency.value = 210; ml.Q.value = 3.5;
    const mg = a.createGain(); mg.gain.value = 0.05;
    mo.connect(ml); ml.connect(mg); mg.connect(out);
    // ③ コマ通過のカチカチ(ノイズ側の振幅だけを叩く。全体を叩くとうねって耳障りになる)
    const lfo = a.createOscillator(); lfo.type = 'sawtooth'; lfo.frequency.value = 26;
    const lg = a.createGain(); lg.gain.value = 0.03;
    lfo.connect(lg); lg.connect(ng.gain);
    ns.start(t0); mo.start(t0); lfo.start(t0);
    gaSpinNodes = { out, srcs: [ns, mo, lfo] };
  } catch (e) { gaSpinNodes = null; }
}
function gaSpinLoopStop() {
  const n = gaSpinNodes; if (!n) return;
  gaSpinNodes = null;                     // 先に参照を落とす(再入しても二重停止しない)
  const a = audioCtx;
  try {
    const t0 = a ? a.currentTime : 0;
    n.out.gain.cancelScheduledValues(t0);
    n.out.gain.setValueAtTime(Math.max(0.0001, n.out.gain.value), t0);
    n.out.gain.linearRampToValueAtTime(0.0001, t0 + 0.07);
    n.srcs.forEach(s => { try { s.stop(t0 + 0.1); } catch (e) {} });
  } catch (e) { n.srcs.forEach(s => { try { s.stop(); } catch (e2) {} }); }
  setTimeout(() => { try { n.out.disconnect(); } catch (e) {} }, 400);
}
// 冪等スイッチ。RAFから毎フレーム呼んで回転マスクと同期させる(どの経路で回転が終わっても次フレームで必ず止まる)
function gaSpinLoopSet(on) { if (on) gaSpinLoopStart(); else gaSpinLoopStop(); }

// --- P3: 勝利音の音色3種(オルガン / スーパーソウ / コーラス風)。オシレータ直演奏なので playing 中でも軽い ---
let gaWave = null, gaWaveCtx = null;
function gaOrganWave(a) {
  if (!gaWave || gaWaveCtx !== a) {
    gaWave = a.createPeriodicWave(new Float32Array([0, 1, .6, .4, .3, 0, .15, 0, .08]), new Float32Array(9));
    gaWaveCtx = a;
  }
  return gaWave;
}
function gaEnv(g, t0, dur, vol, at, rel) {
  const hold = Math.max(at + 0.005, dur - rel);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + at);
  g.gain.setValueAtTime(vol, t0 + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
}
// オルガン: createPeriodicWave(9倍音)
function gaOrgan(f, st, dur, vol) {
  const a = audioCtx; if (!a) return; if (a.state === 'suspended') a.resume();
  const o = a.createOscillator(), g = a.createGain();
  o.setPeriodicWave(gaOrganWave(a)); o.frequency.value = f;
  const t0 = a.currentTime + st;
  gaEnv(g, t0, dur, vol, 0.03, Math.min(0.2, dur * 0.4));
  o.connect(g); g.connect(gaGetBus() || a.destination);
  o.start(t0); o.stop(t0 + dur + 0.05); gaTrack(o);
}
// スーパーソウ: sawtooth 3本を ±7cent デチューン
function gaSaw(f, st, dur, vol) {
  const a = audioCtx; if (!a) return; if (a.state === 'suspended') a.resume();
  const g = a.createGain(), t0 = a.currentTime + st;
  gaEnv(g, t0, dur, vol, 0.012, Math.min(0.14, dur * 0.4));
  g.connect(gaGetBus() || a.destination);
  for (let i = 0; i < 3; i++) {
    const o = a.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
    o.detune.value = (i - 1) * 7; o.connect(g); o.start(t0); o.stop(t0 + dur + 0.05); gaTrack(o);
  }
}
// コーラス風: sawtooth → bandpass(800/1150Hz,Q=8)2連 + LFOでフォルマント揺らし
function gaChoir(f, st, dur, vol) {
  const a = audioCtx; if (!a) return; if (a.state === 'suspended') a.resume();
  const t0 = a.currentTime + st;
  const o = a.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
  const g = a.createGain();
  gaEnv(g, t0, dur, vol, 0.16, Math.min(0.45, dur * 0.4));
  const lfo = a.createOscillator(), lg = a.createGain();
  lfo.type = 'sine'; lfo.frequency.value = 4.6; lg.gain.value = 55;
  lfo.connect(lg);
  [800, 1150].forEach(fc => {
    const b = a.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = fc; b.Q.value = 8;
    lg.connect(b.frequency); o.connect(b); b.connect(g);
  });
  g.connect(gaGetBus() || a.destination);
  o.start(t0); o.stop(t0 + dur + 0.05); gaTrack(o);
  lfo.start(t0); lfo.stop(t0 + dur + 0.05); gaTrack(lfo);
}
// P3: GODファンファーレ(ニ長調・約4秒)。①地鳴り→②静寂 は呼び出し側で先行させ、ここは③和音進行+④きらめき
function gaGodFanfare() {
  if (!audioCtx) return;
  [[[146.83, 220, 293.66], 0], [[196, 246.94, 293.66], 0.7], [[220, 277.18, 329.63], 1.4]].forEach(c => {
    c[0].forEach(f => gaOrgan(f, c[1], 0.72, 0.12));
  });
  [293.66, 369.99, 440, 587.33].forEach(f => gaOrgan(f, 2.1, 1.25, 0.125));  // 最終和音
  gaSaw(293.66, 2.1, 1.25, 0.05); gaSaw(440, 2.1, 1.25, 0.045);              // スーパーソウを重ねる
  gaChoir(587.33, 2.12, 1.3, 0.06);                                          // コーラスパッドを重ねる
  [[1174.66, 3.15], [880, 3.30], [1174.66, 3.45]].forEach(k => gaOrgan(k[0], k[1], 0.16, 0.085)); // ④きらめき
}

// ============================================================
// アセット(画像/動画)の受け皿。**ファイルが1つも無い状態でも従来どおり動く**のが前提。
// ロードできたものだけが有効になり、失敗したものは黙って無効(現行のSVG/CSS演出が床)。
// 追加・差し替えはこの GA_ASSETS だけを編集すればよい。
// ============================================================
const GA_ASSETS = {
  base: 'assets/god-another/',
  // 画像(プリロード対象)
  bg: { file: 'bg.webp', opacity: 0.35 },                            // 常時・最下層に敷く背景
  logo: { file: 'logo.webp', maxWidth: 'min(78%,300px)' },           // ready画面のタイトル
  cutinGod: { file: 'cutin-god.webp', blend: 'screen', fade: 300 },
  cutinMeio: { file: 'cutin-meio.webp', blend: 'screen', fade: 300 },
  cutinPurple: { file: 'cutin-purple.webp', blend: 'screen', fade: 300 },
  cutinSin: { file: 'cutin-sin.webp', blend: 'screen', fade: 300 },
  // 図柄(黒背景・正方形。ロードできた図柄だけ画像に差し替わり、残りはSVGのまま)
  symY7: { file: 'sym-y7.webp' },
  symP7: { file: 'sym-p7.webp' },
  symR7: { file: 'sym-r7.webp' },
  symGod: { file: 'sym-god.webp' },
  symMeio: { file: 'sym-meio.webp' },
  symBar: { file: 'sym-bar.webp' },
  symBell: { file: 'sym-bell.webp' },
  symCherry: { file: 'sym-cherry.webp' },
  symReplay: { file: 'sym-replay.webp' },
  // 筐体パーツ(枠=border-image / 上下帯=画像。未ロードなら現行のSVG・CSSがそのまま床)
  bezel: { file: 'bezel.webp', slice: 0.18, width: 22 },
  pediment: { file: 'pediment.webp' },
  basestrip: { file: 'basestrip.webp' },
  panel: { file: 'panel.webp' },       // 計器盤の装飾背景(青銅+金メアンダー帯)
  // 動画(preload="none"。初回GOD揃い後に load()、アメイジングGOD時のみ再生)
  movie: { file: 'god-movie.mp4' },
  movieHades: { file: 'hades-movie.mp4' },     // 冥王プレミア降臨ムービー(未配置なら眠る)
  movieViolet: { file: 'violet-movie.mp4' },   // 紫7プレミア降臨ムービー(未配置なら眠る)
};
const GA_ASSET_IMGS = ['bg', 'logo', 'cutinGod', 'cutinMeio', 'cutinPurple', 'cutinSin',
  'symY7', 'symP7', 'symR7', 'symGod', 'symMeio', 'symBar', 'symBell', 'symCherry', 'symReplay',
  'bezel', 'pediment', 'basestrip', 'panel'];
const gaAssetState = {};       // key -> { loaded: bool }
const gaAssetSubs = [];
let gaAssetsStarted = false;
const gaAssetSrc = (k) => { const c = GA_ASSETS[k]; return c && c.file ? GA_ASSETS.base + c.file : ''; };
const gaAssetLoaded = (k) => { const s = gaAssetState[k]; return !!(s && s.loaded); };
// border-image-slice 用。画像実寸の ratio 倍(無次元数=画像ピクセル)。実寸が取れない時だけ % で代替。
const gaAssetSlice = (k, ratio) => {
  const s = gaAssetState[k], n = s && s.w ? Math.round(s.w * ratio) : 0;
  return n > 0 ? String(n) : (ratio * 100) + '%';
};
function gaOnAsset(fn) {
  gaAssetSubs.push(fn);
  return () => { const i = gaAssetSubs.indexOf(fn); if (i >= 0) gaAssetSubs.splice(i, 1); };
}
function gaMarkLoaded(k) {
  const s = gaAssetState[k]; if (!s || s.loaded) return;
  s.loaded = true;
  gaAssetSubs.slice().forEach(f => { try { f(k); } catch (e) {} });
}
// ゲームマウント時に1回だけ。decode() 完了まで loaded にしない(初回表示のジャンク防止)。
// 404・デコード失敗は握りつぶす(自前のconsole出力は一切しない)。
function gaPreloadAssets() {
  if (gaAssetsStarted || typeof window === 'undefined') return;
  gaAssetsStarted = true;
  GA_ASSET_IMGS.forEach(k => {
    const src = gaAssetSrc(k); if (!src) return;
    gaAssetState[k] = { loaded: false, w: 0, h: 0 };
    try {
      const img = new Image();
      img.onerror = () => {};
      img.onload = () => {
        const s = gaAssetState[k];
        if (s) { s.w = img.naturalWidth || 0; s.h = img.naturalHeight || 0; }   // border-image-slice の実寸計算用
        if (img.decode) { try { img.decode().then(() => gaMarkLoaded(k), () => {}); } catch (e) {} }
        else gaMarkLoaded(k);
      };
      img.src = src;
    } catch (e) {}
  });
}

// --- 検証済みSVG図柄(symbol-mock.html採用案)。<defs>は1回だけ定義し <use> で参照。id は ga- プレフィクス ---
function GaDefs() {
  return (
    <svg aria-hidden="true" width="0" height="0" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
      <defs>
        <linearGradient id="ga-g7y" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff6c0" /><stop offset="0.28" stopColor="#ffd84d" />
          <stop offset="0.55" stopColor="#e8a000" /><stop offset="0.56" stopColor="#a86a00" />
          <stop offset="1" stopColor="#ffcf3d" />
        </linearGradient>
        <linearGradient id="ga-e7y" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7a5a10" /><stop offset="1" stopColor="#3a2a06" /></linearGradient>
        <linearGradient id="ga-g7p" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3dcff" /><stop offset="0.28" stopColor="#c26bff" />
          <stop offset="0.55" stopColor="#8a2be2" /><stop offset="0.56" stopColor="#5a1596" />
          <stop offset="1" stopColor="#b95cff" />
        </linearGradient>
        <linearGradient id="ga-e7p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4a1a70" /><stop offset="1" stopColor="#220838" /></linearGradient>
        <linearGradient id="ga-g7r" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd9d9" /><stop offset="0.28" stopColor="#ff5566" />
          <stop offset="0.55" stopColor="#d40f2e" /><stop offset="0.56" stopColor="#8d0518" />
          <stop offset="1" stopColor="#ff4455" />
        </linearGradient>
        <linearGradient id="ga-e7r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6b0a1a" /><stop offset="1" stopColor="#320410" /></linearGradient>
        <linearGradient id="ga-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff8cc" /><stop offset="0.35" stopColor="#ffd84d" />
          <stop offset="0.6" stopColor="#c8860a" /><stop offset="0.61" stopColor="#8d5c00" />
          <stop offset="1" stopColor="#ffd23f" />
        </linearGradient>
        <radialGradient id="ga-halo" cx="0.5" cy="0.45" r="0.62">
          <stop offset="0" stopColor="rgba(255,240,170,1)" /><stop offset="0.5" stopColor="rgba(255,205,70,0.4)" /><stop offset="1" stopColor="rgba(255,205,70,0)" />
        </radialGradient>
        <radialGradient id="ga-mdisc" cx="0.5" cy="0.55" r="0.62">
          <stop offset="0" stopColor="#0e3d6e" /><stop offset="0.7" stopColor="#071f3a" /><stop offset="1" stopColor="rgba(7,20,40,0)" />
        </radialGradient>
        <linearGradient id="ga-mflame" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#0a2a55" /><stop offset="0.4" stopColor="#1e8fe0" />
          <stop offset="0.75" stopColor="#9fe2ff" /><stop offset="1" stopColor="#f0fcff" />
        </linearGradient>
        <linearGradient id="ga-msteel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eaf6ff" /><stop offset="0.42" stopColor="#9fc4e0" />
          <stop offset="0.43" stopColor="#4a7396" /><stop offset="1" stopColor="#cfe6f6" />
        </linearGradient>
        <linearGradient id="ga-barp" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4f7f2" /><stop offset="0.45" stopColor="#9fb5a2" />
          <stop offset="0.46" stopColor="#5c7a62" /><stop offset="1" stopColor="#c9d9c8" />
        </linearGradient>
        <linearGradient id="ga-bellg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3b8" /><stop offset="0.5" stopColor="#f4b830" /><stop offset="1" stopColor="#a86f08" />
        </linearGradient>
        <radialGradient id="ga-ch" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#ff9aa8" /><stop offset="0.35" stopColor="#e6273f" /><stop offset="1" stopColor="#8d0518" />
        </radialGradient>
        <linearGradient id="ga-rep" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e3f0ff" /><stop offset="0.45" stopColor="#7ba6e8" />
          <stop offset="0.46" stopColor="#3b5f9c" /><stop offset="1" stopColor="#9fc4f0" />
        </linearGradient>
        <linearGradient id="ga-fgold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f7e08a" /><stop offset="0.45" stopColor="#b8860b" />
          <stop offset="0.55" stopColor="#7a5506" /><stop offset="1" stopColor="#d4a017" />
        </linearGradient>

        <g id="ga-s-y7" transform="translate(10,0)">
          <path d="M12 14 h76 v30 L52 122 H20 L60 44 H12 Z" fill="url(#ga-e7y)" transform="translate(3,4)" opacity="0.9" />
          <path d="M12 14 h76 v30 L52 122 H20 L60 44 H12 Z" fill="url(#ga-g7y)" stroke="#5d420a" strokeWidth="2.5" />
          <path d="M16 18 h66 l-3 8 H20 Z" fill="rgba(255,255,255,0.75)" />
        </g>
        <g id="ga-s-p7" transform="translate(10,0)">
          <path d="M12 14 h76 v30 L52 122 H20 L60 44 H12 Z" fill="url(#ga-e7p)" transform="translate(3,4)" opacity="0.9" />
          <path d="M12 14 h76 v30 L52 122 H20 L60 44 H12 Z" fill="url(#ga-g7p)" stroke="#3c0d63" strokeWidth="2.5" />
          <path d="M16 18 h66 l-3 8 H20 Z" fill="rgba(255,255,255,0.65)" />
        </g>
        <g id="ga-s-r7" transform="translate(10,0)">
          <path d="M12 14 h76 v30 L52 122 H20 L60 44 H12 Z" fill="url(#ga-e7r)" transform="translate(3,4)" opacity="0.9" />
          <path d="M12 14 h76 v30 L52 122 H20 L60 44 H12 Z" fill="url(#ga-g7r)" stroke="#5d0715" strokeWidth="2.5" />
          <path d="M16 18 h66 l-3 8 H20 Z" fill="rgba(255,255,255,0.7)" />
        </g>
        <g id="ga-s-god">
          <circle cx="60" cy="58" r="54" fill="url(#ga-halo)" />
          <g stroke="#5d420a" strokeWidth="1.4" fill="url(#ga-gold)">
            <path d="M60 4 L67 38 L60 52 L53 38 Z" />
            <path d="M60 4 L67 38 L60 52 L53 38 Z" transform="rotate(30 60 58)" />
            <path d="M60 4 L67 38 L60 52 L53 38 Z" transform="rotate(-30 60 58)" />
            <path d="M60 4 L67 38 L60 52 L53 38 Z" transform="rotate(65 60 58)" />
            <path d="M60 4 L67 38 L60 52 L53 38 Z" transform="rotate(-65 60 58)" />
            <path d="M60 4 L67 38 L60 52 L53 38 Z" transform="rotate(100 60 58)" />
            <path d="M60 4 L67 38 L60 52 L53 38 Z" transform="rotate(-100 60 58)" />
          </g>
          <circle cx="60" cy="58" r="20" fill="url(#ga-gold)" stroke="#5d420a" strokeWidth="2" />
          <ellipse cx="60" cy="58" rx="12" ry="7.5" fill="#1a1206" />
          <circle cx="60" cy="58" r="4.6" fill="#ffd84d" />
          <text x="60" y="112" textAnchor="middle" fontFamily="Georgia,serif" fontWeight="900" fontSize="26" fill="url(#ga-gold)" stroke="#5d420a" strokeWidth="1.2" letterSpacing="2">GOD</text>
        </g>
        <g id="ga-s-meio">
          <circle cx="60" cy="66" r="54" fill="url(#ga-mdisc)" />
          <path d="M28 78 Q22 46 38 40 Q34 56 44 48 Q38 30 52 24 Q50 40 58 34 Q54 16 60 8 Q66 16 62 34 Q70 40 68 24 Q82 30 76 48 Q86 56 82 40 Q98 46 92 78 Z" fill="url(#ga-mflame)" opacity="0.92" />
          <text x="60" y="96" textAnchor="middle" fontFamily="'Yu Mincho','Hiragino Mincho ProN',serif" fontWeight="900" fontSize="56" fill="url(#ga-msteel)" stroke="#0c2438" strokeWidth="2">冥</text>
        </g>
        <g id="ga-s-bar" transform="translate(5,0)">
          <g transform="rotate(-8 55 65)">
            <rect x="10" y="40" width="90" height="46" rx="8" fill="#20301f" transform="translate(3,4)" />
            <rect x="10" y="40" width="90" height="46" rx="8" fill="url(#ga-barp)" stroke="#233c26" strokeWidth="2.5" />
            <text x="55" y="74" textAnchor="middle" fontFamily="Arial Black,sans-serif" fontWeight="900" fontSize="30" fill="#15241a">BAR</text>
          </g>
        </g>
        <g id="ga-s-bell" transform="translate(5,0)">
          <path d="M55 22 q4 0 4 6 v4 q20 6 22 34 q1 14 8 20 H21 q7 -6 8 -20 q2 -28 22 -34 v-4 q0 -6 4 -6 Z" fill="url(#ga-bellg)" stroke="#6b4a06" strokeWidth="2.5" />
          <circle cx="55" cy="94" r="7" fill="url(#ga-bellg)" stroke="#6b4a06" strokeWidth="2" />
          <path d="M36 40 q8 -8 16 -9" stroke="rgba(255,255,255,0.8)" strokeWidth="4" fill="none" strokeLinecap="round" />
        </g>
        <g id="ga-s-cherry" transform="translate(5,0)">
          <path d="M42 62 Q48 26 74 16 M68 66 Q70 34 74 16" stroke="#3f7d2c" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M74 16 q14 -6 20 4 q-12 2 -20 -4" fill="#57a03c" />
          <circle cx="40" cy="82" r="21" fill="url(#ga-ch)" stroke="#5d0715" strokeWidth="2" />
          <circle cx="70" cy="86" r="19" fill="url(#ga-ch)" stroke="#5d0715" strokeWidth="2" />
          <ellipse cx="33" cy="74" rx="6" ry="4" fill="rgba(255,255,255,0.55)" transform="rotate(-25 33 74)" />
          <ellipse cx="64" cy="79" rx="5" ry="3.4" fill="rgba(255,255,255,0.5)" transform="rotate(-25 64 79)" />
        </g>
        <g id="ga-s-replay" transform="translate(10,0)">
          <path d="M20 28 L56 65 L20 102 Z" fill="url(#ga-rep)" stroke="#1e3a6b" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M52 28 L88 65 L52 102 Z" fill="url(#ga-rep)" stroke="#1e3a6b" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M24 34 L44 54" stroke="rgba(255,255,255,0.7)" strokeWidth="4" fill="none" strokeLinecap="round" />
        </g>
      </defs>
    </svg>
  );
}

// ============================================================
// 計器盤(GAME/TIME/COIN・当たり間・カウンタ)のタイポグラフィ
// 数字=Orbitron / ラベル=Cinzel(<head>のGoogle Fontsで読み込み。未達時は従来のCourier/serifに落ちる)
// 色はCSS変数 --gc(明) / --gc2(陰) / --gg(発光) をインラインで差し替える。
// → 毎秒・毎タップ書き換わる要素でも「クラスは静的」のまま色だけ変えられ、styleの再parseが起きない。
// ============================================================
const GA_METER_CSS = `
.ga-mnum{
  font-family:'Orbitron','Courier New',monospace;
  font-weight:900; font-variant-numeric:tabular-nums; letter-spacing:.02em;
  background-image:linear-gradient(180deg,#fffdf2 0%,var(--gc,#ffd24a) 32%,var(--gc2,#8a5f06) 56%,var(--gc,#ffd24a) 76%,#fff7d6 100%);
  -webkit-background-clip:text; background-clip:text;
  -webkit-text-fill-color:transparent; color:transparent;
  filter:drop-shadow(0 1px 0 rgba(0,0,0,.9)) drop-shadow(0 0 6px var(--gg,rgba(255,210,74,.4)));
}
/* background-clip:text 非対応環境では文字が消えてしまうので、べた塗り+発光に落とす */
@supports not ((-webkit-background-clip:text) or (background-clip:text)){
  .ga-mnum{ background-image:none; -webkit-text-fill-color:var(--gc,#ffd24a); color:var(--gc,#ffd24a); }
}
.ga-mlbl{
  font-family:'Cinzel','Times New Roman','Yu Mincho','Hiragino Mincho ProN',serif;
  font-weight:700; letter-spacing:.16em;
  color:var(--gc,#b3902f);
  text-shadow:0 1px 0 #000,0 0 6px rgba(255,200,60,.22);
}
.ga-panel{
  position:relative;
  background:linear-gradient(180deg,#15120c 0%,#0a0809 55%,#110d0a 100%);
  border:1px solid rgba(201,162,39,.34); border-radius:6px;
  box-shadow:inset 0 0 14px rgba(0,0,0,.92),inset 0 1px 0 rgba(255,222,140,.09);
}
.ga-panel::before{
  content:'';position:absolute;left:10px;right:10px;top:3px;height:1px;
  background:linear-gradient(90deg,transparent,rgba(255,214,110,.5),transparent);
}
.ga-panel::after{
  content:'';position:absolute;left:10px;right:10px;bottom:3px;height:1px;
  background:linear-gradient(90deg,transparent,rgba(255,214,110,.32),transparent);
}
`;
function GaMeterStyles() { return <style>{GA_METER_CSS}</style>; }
// 数字の金属色プリセット [明部, 陰, 発光]。gaMV() でCSS変数に展開する
const GA_MC = {
  gold: ['#ffd24a', '#8a5f06', 'rgba(255,210,74,.45)'],
  amber: ['#ff9922', '#8a4a04', 'rgba(255,153,34,.5)'],
  red: ['#ff5544', '#8a0d0d', 'rgba(255,60,40,.55)'],
  ice: ['#9fdcff', '#1f5f8a', 'rgba(102,204,255,.6)'],
  coin: ['#ffdc55', '#8a6a05', 'rgba(238,204,34,.45)'],
  loss: ['#ff8878', '#8a2a1c', 'rgba(255,119,102,.5)'],
};
const gaMV = (c) => ({ '--gc': c[0], '--gc2': c[1], '--gg': c[2] });

// 角飾り(神殿モチーフの二重ブラケット)。装飾専用でイベントは通さない
const GA_CNR_D = 'M1 14 L1 1 L14 1 L14 3.2 L3.2 3.2 L3.2 14 Z M6 11 L6 6 L11 6 L11 7.6 L7.6 7.6 L7.6 11 Z';
const GA_CNR_POS = [[0, 0, '1,1'], [1, 0, '-1,1'], [0, 1, '1,-1'], [1, 1, '-1,-1']];
function GaCorners({ size = 12, inset = 2, color = '#c9a227', op = 0.72 }) {
  return (
    <React.Fragment>
      {GA_CNR_POS.map((p, i) => {
        const st = { position: 'absolute', transform: `scale(${p[2]})`, pointerEvents: 'none', opacity: op };
        st[p[0] ? 'right' : 'left'] = inset; st[p[1] ? 'bottom' : 'top'] = inset;
        return <svg key={i} viewBox="0 0 15 15" width={size} height={size} aria-hidden="true" style={st}><path d={GA_CNR_D} fill={color} /></svg>;
      })}
    </React.Fragment>
  );
}

function GodAnotherGame({ onScore, onClose }) {
  const [phase, setPhase] = useState("ready");
  const [gameN, setGameN] = useState(0);
  const [timeLeft, setTimeLeft] = useState(180);
  const [coins, setCoins] = useState(0);
  const [godC, setGodC] = useState(0);
  const [meioC, setMeioC] = useState(0);
  const [purpleC, setPurpleC] = useState(0);
  const [y7C, setY7C] = useState(0);
  // PC(幅1000px以上・マウス環境): 画面にジャストフィットする表示倍率を実測で算出。スマホは等倍のまま
  const zoomFitRef = useRef(null);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1000px) and (pointer: fine)');
    const fit = () => {
      const el = zoomFitRef.current; if (!el) return;
      if (!mq.matches) { if (el.style.zoom) el.style.zoom = ''; return; }
      el.style.zoom = 1;   // 等倍で自然なサイズを実測してから倍率を決める
      const w = el.offsetWidth || 448;
      const h = el.scrollHeight || 900;
      const top = el.getBoundingClientRect().top + window.scrollY;             // ヘッダー+上余白の実測
      const navH = (document.querySelector('.nav') || {}).offsetHeight || 70;  // 下ナビ(fixed)の実測
      const z = Math.max(1, Math.min((window.innerWidth - 16) / w, (window.innerHeight - top - navH - 8) / h));
      el.style.zoom = z;
    };
    fit();
    // 画像(ベゼル等)のロード後に高さが伸びるため、遅れて再算出する
    const t1 = setTimeout(fit, 350), t2 = setTimeout(fit, 1200);
    window.addEventListener('resize', fit);
    return () => { clearTimeout(t1); clearTimeout(t2); window.removeEventListener('resize', fit); };
  }, [phase]);
  const [crashC, setCrashC] = useState(0);
  const [sinC, setSinC] = useState(0);
  const [spinCount, setSpinCount] = useState(0);
  const [history, setHistory] = useState([]);
  const [jugRen, setJugRen] = useState(0);
  const [msg, setMsg] = useState('');
  const [msgColor, setMsgColor] = useState('#c8a24a');
  const [bigMsg, setBigMsg] = useState('');
  const [bigMsgColor, setBigMsgColor] = useState('#ffd700');
  const [locked, setLocked] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [crtActive, setCrtActive] = useState(false);
  const [flashAlpha, setFlashAlpha] = useState(0);
  const [flashColor, setFlashColor] = useState('#fff');
  const [dim, setDim] = useState(0);
  const [tint, setTint] = useState('none');
  const [crackLv, setCrackLv] = useState(0);
  const [lampMainText, setLampMainText] = useState('');
  const [lampMainSize, setLampMainSize] = useState('min(24vw,100px)');
  const [lampSubText, setLampSubText] = useState('ANOTHER');
  const [sinPlus, setSinPlus] = useState(false);
  const [lastMult, setLastMult] = useState(1);       // 直近の当たりで実際に適用された倍率(1G連の+1.0込み)
  const [cutinOn, setCutinOn] = useState(false);     // 画像カットイン表示中は巨大GOD文字を隠す
  const [reels, setReels] = useState(['bell', 'cherry', 'replay']);

  const lampRef = useRef(null);
  const lampTypeRef = useRef('off');
  const lampStartRef = useRef(null);
  const lockedRef = useRef(false);
  const phaseRef = useRef('ready');
  const coinsRef = useRef(0);
  const gameNRef = useRef(0);
  // 連打ガード: pointerId単位のスロットル(同一指は50ms間隔・別の指なら同時でも受理)+ 50ms窓内は最大3回転
  const tapGuardRef = useRef({ lastByPointer: new Map(), recent: [] });
  const spinCountRef = useRef(0);
  const jugRenRef = useRef(0);
  const godGapRef = useRef(0);
  const godCountRef = useRef(0);
  const startTimeRef = useRef(null);
  const timeLeftRef = useRef(180);
  const lastTsRef = useRef(null);
  const reelSpinRef = useRef(0);
  const reelSlowRef = useRef(false);
  const reelPoolRef = useRef(null);
  const aliveRef = useRef(true);
  const timeoutsRef = useRef([]);
  const crtActiveRef = useRef(false);
  const lockFreezeRef = useRef(null);   // 演出ロック開始時刻(Date.now)。ロック中でない時は null
  const cutinOnRef = useRef(false);
  // --- RAFからDOM直書きするための参照(setState毎フレームを廃止) ---
  const sgRef = useRef(null);
  const frameRef = useRef(null);
  const frameGlowRef = useRef(null);
  const glowRef = useRef(null);
  const mainTxtRef = useRef(null);
  const subTxtRef = useRef(null);
  const ringRef = useRef(null);
  const crtBarRef = useRef(null);
  const crtBarRRef = useRef(null);   // P8: 色収差(赤)
  const crtBarCRef = useRef(null);   // P8: 色収差(シアン)
  const crtScanRef = useRef(null);   // P8: 走査線
  const crtLineRef = useRef(null);
  const crtDotRef = useRef(null);
  const crtStartRef = useRef(0);
  const lsRef = useRef({});
  const styCacheRef = useRef({});
  const prevLtRef = useRef('off');
  // --- P4: 縦ストリップ式リール(reel-mock.html検証済み機構をref+既存RAFへ移植) ---
  const rObjRef = useRef(null);
  if (!rObjRef.current) rObjRef.current = [0, 1, 2].map(() => ({
    pos: 0, from: 0, target: 0, et: 0, dur: 175, mode: 'idle', bounceT: 0,
    sym: 'bell', stopIdx: 0, quiet: false, silent: false, dirty: true, spinCls: false,
  }));
  const stripRef = useRef([]);
  const cellRef = useRef([[], [], []]);
  const rGlowRef = useRef([]);
  const rHaloRef = useRef([]);
  const rDarkRef = useRef([]);
  const rBackRef = useRef([]);
  const tenpaiRef = useRef(false);
  // P5/P10 用
  const rayRef = useRef(null);
  const boltRef = useRef(null);
  const barRef = useRef([]);
  const barPrevRef = useRef('');
  const barCacheRef = useRef([-1, -1, -1, -1, -1, -1, -1, -1]);
  const barLockRef = useRef(0);      // P6: ロック段階(0=なし / 1〜3=点灯数)
  // P7: canvasパーティクル(particle-mock.html検証済み機構)
  const cvRef = useRef(null);
  const psRef = useRef([]);
  const sprRef = useRef(null);
  const pRafRef = useRef(null);
  // アセット層(画像が無い間は全て何もしない)
  const [, setAssetTick] = useState(0);   // アセットが1つロードされた時だけ再レンダーする
  const cutinRef = useRef(null);
  const vidRef = useRef(null);
  const vidStRef = useRef({});          // 動画キー('movie'/'movieHades'/'movieViolet') -> { armed, ready, failed }
  const vidKeyRef = useRef('movie');    // video要素に現在セットされているソースのキー
  // ref コールバックは identity を固定(再レンダーごとの detach/attach を避ける)
  const cbRef = useRef(null);
  if (!cbRef.current) {
    const mk = (store) => [0, 1, 2].map(i => (el) => { store.current[i] = el; });
    cbRef.current = {
      strip: mk(stripRef), glow: mk(rGlowRef), halo: mk(rHaloRef), dark: mk(rDarkRef), back: mk(rBackRef),
      bar: [0, 1, 2, 3, 4, 5, 6, 7].map(i => (el) => { barRef.current[i] = el; }),
      cell: [0, 1, 2].map(i => [0, 1, 2, 3].map(j => (el) => {
        cellRef.current[i][j] = el ? {
          el, u: el.getElementsByTagName('use'), im: el.getElementsByTagName('image'),
          sg: el.querySelector('.gaCsvg'), ig: el.querySelector('.gaCimg'),
          idx: null, h: null, useImg: null,
        } : null;
      })),
    };
  }

  const TOTAL = 180;
  // 抽選単位 R = 1/65536(2026-08-25 第5次で分母を2倍化)。各フラグの重みは R の整数倍(仕様分母との誤差1%以内)
  const RU = 65536;
  const FLAGS = [
    ['sin', 2],          // レアSIN 1/32768
    ['amazing', 1],      // アメイジング・グレイス 1/65536(2026-08-25 第5次で1/2に)
    ['hades', 1],        // 冥王プレミア 1/65536(第5次新設・冥王の4倍)
    ['violet', 1],       // 紫7プレミア 1/65536(第5次新設・紫7の4倍)
    ['cgod', 2],         // クラッシュ→GOD 1/32768
    ['cmeio', 2],        // クラッシュ→冥王 1/32768
    ['cpurple', 2],      // クラッシュ→紫7 1/32768
    ['god', 8],          // GOD揃い 1/8192
    ['meio', 6],         // 冥王揃い 1/10922.7
    ['purple', 10],      // 紫7揃い 1/6553.6
    ['y7', 93],          // 中段黄7 93/65536 = 1/704.7(2026-08-25 竹森氏指示: 確率を1.5倍悪化。140→93=悪化率1.505)
    // ガセ前兆フラグは2026-08-25廃止(doGase等の演出コードは残置)
  ];
  const BASE = { sin: 20000, amazing: 31108, hades: 20000, violet: 14000, cgod: 15554, cmeio: 10000, cpurple: 7000, god: 7777, meio: 5000, purple: 3500, y7: 1200 };

  const SYMS = {
    y7: { t: '7', c: '#ffd24a', g: 'rgba(255,210,74,0.55)' },
    p7: { t: '7', c: '#b06bff', g: 'rgba(176,107,255,0.55)' },
    r7: { t: '7', c: '#ff4560', g: 'rgba(255,69,96,0.55)' },
    god: { t: '神', c: '#fff0a8', g: 'rgba(255,215,0,0.75)' },
    meio: { t: '冥', c: '#8fd8ff', g: 'rgba(143,216,255,0.6)' },
    bar: { t: 'BAR', c: '#7fe0a0', g: 'rgba(127,224,160,0.3)', sm: 1 },
    bell: { t: '🔔', c: '#ffcc55', g: 'rgba(255,204,85,0.25)' },
    cherry: { t: '🍒', c: '#ff7799', g: 'rgba(255,119,153,0.25)' },
    replay: { t: '▶', c: '#88aaff', g: 'rgba(136,170,255,0.25)' },
  };
  const BLANKS = ['bell', 'cherry', 'replay', 'bar'];
  const SPINPOOL = ['bell', 'cherry', 'replay', 'bar', 'y7', 'p7', 'r7'];
  const ALLPOOL = ['god', 'meio', 'p7', 'y7', 'r7', 'bar'];
  // SVG図柄ID / 後光を出す図柄 / ストリップ実DOMコマ数 / 回転速度(コマ per 100ms・reel-mock検証値)
  const SYM_ID = { y7: 'ga-s-y7', p7: 'ga-s-p7', r7: 'ga-s-r7', god: 'ga-s-god', meio: 'ga-s-meio', bar: 'ga-s-bar', bell: 'ga-s-bell', cherry: 'ga-s-cherry', replay: 'ga-s-replay' };
  // 図柄画像のアセットキー。ロード済みの図柄だけ <image> に差し替わる(未ロードは上のSVGのまま)
  const SYM_ASSET = { y7: 'symY7', p7: 'symP7', r7: 'symR7', god: 'symGod', meio: 'symMeio', bar: 'symBar', bell: 'symBell', cherry: 'symCherry', replay: 'symReplay' };
  const HALO_SYM = { y7: 1, p7: 1, r7: 1, god: 1, meio: 1 };
  const RCELLS = 4;
  const RV_FAST = 2.6, RV_SLOW = 0.55, RV_TENPAI = 0.5;
  const XLINK = 'http://www.w3.org/1999/xlink';
  // P10: 上部ランプ帯の色(当たり種別ごと)
  const BAR_C = { y7: '255,210,74', y7hold: '255,200,60', y7win: '255,230,130', purple: '190,110,255', meio: '150,220,255', god: '255,215,0', amazing: '255,235,140', crash: '255,90,70', allspin: '120,180,255', sinwin: '255,190,60', lock: '150,220,255' };
  const FRZ = 800;         // P6: レバーONフリーズ(完全無音・無反応)。locked中はタイマー停止なので収支不変
  const MEIO_PRE = 1800;   // P6: 冥王ロック段階(ロック1→700→ロック2→700→ロック3→400→暗転)
  const P_MAX = 120;       // P7: 同時パーティクル上限
  const barGrad = (m, i) => {
    if (m === 'off') return 'none';
    const c = m === 'sinwin' ? (i % 2 ? '210,120,255' : '255,190,60') : BAR_C[m];
    return `radial-gradient(circle at 50% 45%,rgba(255,255,255,0.95) 0%,rgba(${c},0.95) 30%,rgba(${c},0.34) 54%,rgba(${c},0) 74%)`;
  };
  const barVal = (m, i, e) => {
    if (m === 'lock') return i < barLockRef.current ? 1 : 0.06;   // P6: ロック段階の点灯数
    if (m === 'y7' || m === 'y7hold' || m === 'y7win') { const k = Math.floor(e * 7) % 4; return (i === k || i === 7 - k) ? 1 : 0.1; }
    if (m === 'purple') return (i % 2 === (Math.floor(e * 6) % 2)) ? 1 : 0.08;
    if (m === 'meio') return 0.12 + 0.88 * (0.5 + 0.5 * Math.sin(e * 3 - i * 0.5));
    if (m === 'god' || m === 'amazing') return (Math.floor(e * 3) % 2) ? 1 : 0.12;   // 1.5回/秒(WCAG 3回/秒以下)
    if (m === 'crash') { const s = Math.sin(Math.floor(e * 10) * 13.13 + i * 7.7) * 43758.5453; return (s - Math.floor(s)) > 0.45 ? 1 : 0.08; }
    if (m === 'allspin') return 0.1 + 0.5 * (0.5 + 0.5 * Math.sin(e * 2.2 - i * 0.6));
    if (m === 'sinwin') return ((Math.floor(e * 5) + i) % 2) ? 1 : 0.12;
    return 0;
  };
  const HTYPE = {
    god: { t: '神', c: '#ffd700', bg: 'rgba(255,215,0,0.2)', bd: 'rgba(255,215,0,0.35)' },
    cgod: { t: '神', c: '#ffd700', bg: 'rgba(255,215,0,0.28)', bd: 'rgba(255,255,255,0.55)' },
    amazing: { t: 'A', c: '#ffe98a', bg: 'rgba(255,233,138,0.28)', bd: 'rgba(255,255,255,0.6)' },
    meio: { t: '冥', c: '#8fd8ff', bg: 'rgba(143,216,255,0.16)', bd: 'rgba(143,216,255,0.3)' },
    cmeio: { t: '冥', c: '#8fd8ff', bg: 'rgba(143,216,255,0.24)', bd: 'rgba(255,255,255,0.55)' },
    hades: { t: '冥', c: '#cfeaff', bg: 'rgba(143,216,255,0.34)', bd: 'rgba(255,215,0,0.85)' },
    purple: { t: '紫', c: '#c48bff', bg: 'rgba(196,139,255,0.15)', bd: 'rgba(196,139,255,0.28)' },
    cpurple: { t: '紫', c: '#c48bff', bg: 'rgba(196,139,255,0.24)', bd: 'rgba(255,255,255,0.55)' },
    violet: { t: '紫', c: '#e2c6ff', bg: 'rgba(196,139,255,0.34)', bd: 'rgba(255,255,255,0.9)' },
    y7: { t: '黄', c: '#ffd24a', bg: 'rgba(255,210,74,0.12)', bd: 'rgba(255,210,74,0.22)' },
    sin: { t: 'S', c: '#ff7ae0', bg: 'rgba(255,122,224,0.22)', bd: 'rgba(255,122,224,0.45)' },
  };
  const IS_CRASH = { cgod: 1, cmeio: 1, cpurple: 1 };
  const CRACKS = [
    { l: 48, t: 6, w: 44, r: 68 }, { l: 50, t: 40, w: 38, r: 172 }, { l: 46, t: 44, w: 34, r: -102 },
    { l: 20, t: 14, w: 30, r: 34 }, { l: 74, t: 20, w: 28, r: 138 }, { l: 30, t: 70, w: 32, r: -38 },
    { l: 62, t: 66, w: 30, r: 26 }, { l: 12, t: 50, w: 26, r: 82 }, { l: 82, t: 52, w: 24, r: -66 },
    { l: 38, t: 24, w: 22, r: 118 }, { l: 56, t: 80, w: 26, r: -14 }, { l: 24, t: 34, w: 20, r: -128 },
  ];

  const T = (fn, ms) => { const id = setTimeout(() => { if (!aliveRef.current) return; fn(); }, ms); timeoutsRef.current.push(id); return id; };

  const synth = (dur, fn, vol = 0.7) => {
    const a = audioCtx; if (!a) return; if (a.state === 'suspended') a.resume();
    const buf = gaMakeBuf(dur, fn); if (!buf) return;
    const bs = a.createBufferSource(); bs.buffer = buf; const g = a.createGain(); g.gain.value = vol; bs.connect(g); g.connect(gaGetBus() || a.destination); bs.start(a.currentTime); gaTrack(bs);
  };
  const jTone = (f, st, dur, vol = 0.25, type = 'sine') => {
    const a = audioCtx; if (!a) return;
    const o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.value = f;
    const t0 = a.currentTime + st, at = Math.min(0.008, dur * 0.4);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + at);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(gaGetBus() || a.destination); o.start(t0); o.stop(t0 + dur); gaTrack(o);
  };
  // 連打で毎回鳴る3音は GA_SND に事前生成させ、キャッシュ再生する(音色・音量は現行のまま)
  const sndTap = () => gaPlay('tap', 0.24);
  const sndReelStop = () => gaPlay('reelStop', 0.3);
  const sndSoftStop = () => gaPlay('softStop', 0.12);
  const sndGakonG = () => synth(0.8, (s, ch) => { const at = Math.exp(-s * 40) * 0.9; return (Math.sin(2 * Math.PI * 220 * s + Math.sin(2 * Math.PI * 440 * s) * 0.5) * at + (Math.sin(2 * Math.PI * 880 * s) * 0.2 + Math.sin(2 * Math.PI * 1320 * s) * 0.15) * Math.exp(-s * 8) + Math.sin(2 * Math.PI * 55 * s) * 0.6 * Math.exp(-s * 20) + (Math.random() * 2 - 1) * 0.35 * Math.exp(-s * 30)) * (ch === 0 ? 0.55 : 0.5); }, 0.85);
  const sndZawa = () => synth(1.0, (s, ch) => { const env = Math.sin(Math.PI * Math.min(s, 1)); return ((Math.random() * 2 - 1) * 0.22 + Math.sin(2 * Math.PI * 68 * s) * 0.3) * env * (ch === 0 ? 0.5 : 0.45); }, 0.3);
  const sndCutin = () => { synth(0.3, (s) => (Math.random() * 2 - 1) * Math.exp(-s * 10) * 0.5, 0.45); [392, 523, 659, 880].forEach((f, i) => jTone(f, i * 0.05, 0.35, 0.18, 'square')); jTone(98, 0, 0.5, 0.14, 'sawtooth'); };
  const sndHeart = () => { jTone(70, 0, 0.18, 0.3, 'sine'); jTone(70, 0.22, 0.22, 0.24, 'sine'); };
  const sndVWin = () => { sndGakonG(); [659, 880, 1047, 1319, 1568, 2093].forEach((f, i) => jTone(f, 0.08 + i * 0.07, 0.45, 0.2)); jTone(131, 0.05, 0.9, 0.12); };
  const sndThunder = (vol = 1.0) => gaPlay('thunder', vol);
  const sndPuchun = () => synth(0.3, (s, ch) => (Math.sin(2 * Math.PI * (9000 * Math.exp(-s * 16) + 150) * s) * 0.55 * Math.exp(-s * 7) + Math.sin(2 * Math.PI * 14000 * s) * 0.1 * Math.exp(-s * 35) + Math.sin(2 * Math.PI * 60 * s) * 0.5 * Math.exp(-s * 20) + (Math.random() * 2 - 1) * 0.4 * Math.exp(-s * 25)) * 0.85, 1.0);
  const sndGodGong = () => gaPlay('godGong', 1.0);
  const sndGodCoins = () => gaPlay('godCoins', 0.8);
  const sndMeioRumble = () => gaPlay('meioRumble', 0.95);
  // P3: 冥王(約3秒)= 低音クラスタ C2/C#2/G2 をオルガンで2.5秒持続 + 「怒りの日」の鐘モチーフ D4→C#4→D4→B3 を長残響で
  const sndMeioBell = () => {
    [65.41, 69.30, 98].forEach(f => gaOrgan(f, 0, 2.5, 0.105));
    [[293.66, 0], [277.18, 0.5], [293.66, 1.0], [246.94, 1.5]].forEach(k => {
      jTone(k[0], k[1], 1.7, 0.15, 'triangle');
      jTone(k[0] * 2, k[1] + 0.01, 0.9, 0.05, 'triangle');
      jTone(k[0] * 2.76, k[1], 0.5, 0.028, 'sine');
    });
  };
  // P3: 紫7(約2秒・疾走)= スーパーソウ上昇 + シンバルノイズ(既存thunderに重ねる)
  const sndPurpleRun = () => {
    [329.63, 369.99, 415.30, 493.88, 659.25].forEach((f, i) => gaSaw(f, i * 0.12, 0.22, 0.085));
    synth(0.7, (s, ch) => ((Math.random() * 2 - 1) * Math.exp(-s * 4.6)) * (ch === 0 ? 0.42 : 0.38), 0.26);
  };
  // P6: ロック音(ガコッ)。段階が上がるほど高く強く。ガセのロック1止まりにも使う
  const sndLock = (n) => synth(0.5, (s, ch) => { const f = 148 + n * 46; return (Math.sin(2 * Math.PI * f * s + Math.sin(2 * Math.PI * f * 2 * s) * 0.6) * Math.exp(-s * 26) + Math.sin(2 * Math.PI * 58 * s) * 0.5 * Math.exp(-s * 16) + (Math.random() * 2 - 1) * 0.3 * Math.exp(-s * 34)) * (ch === 0 ? 0.5 : 0.46); }, 0.34 + n * 0.13);
  // P9: 触覚(存在チェック付き)
  const vib = (p) => { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} };
  const sndCrack = () => synth(0.35, (s) => (Math.sin(2 * Math.PI * (1400 * Math.exp(-s * 20)) * s) * Math.exp(-s * 14) * 0.5 + (Math.random() * 2 - 1) * Math.exp(-s * 18) * 0.55) * 0.9, 0.8);
  const sndGlass = () => gaPlay('glass', 0.75);
  const sndAllSpin = () => gaPlay('allSpin', 0.45);
  const sndSinBoom = () => { gaPlay('sinBoom', 1.0); sndThunder(0.9); };
  const sndSinFade = () => { jTone(196, 0, 1.2, 0.08, 'sine'); jTone(147, 0.15, 1.4, 0.06, 'sine'); };

  // アメイジング・グレイス (G長調 / 1拍=0.55秒)
  const AG_NOTES = [[293.66, 1], [392, 2], [493.88, 0.5], [392, 0.5], [493.88, 2], [440, 1], [392, 2], [329.63, 1], [293.66, 2], [293.66, 1], [392, 2], [493.88, 0.5], [392, 0.5], [493.88, 2], [440, 1], [587.33, 3]];
  // P3: 音列・拍・発火条件は不変。音色のみ差し替え(主旋律=オルガン / ハモリ=音階内3度下のオルガン第2声 / 下にGメジャー系コーラスパッド)
  const AG_H = { 293.66: 246.94, 392: 329.63, 493.88: 392, 440: 369.99, 329.63: 261.63, 587.33: 493.88 };
  const AG_PAD = [[196, 293.66], [261.63, 392], [196, 293.66], [293.66, 440], [196, 293.66]];  // G→C→G→D→G(根音+5度)
  const playAmazingGrace = () => {
    const B = 0.55; let t = 0;
    AG_NOTES.forEach(n => {
      const f = n[0], d = n[1] * B;
      gaOrgan(f, t, d * 0.96, 0.13);
      const h = AG_H[f]; if (h) gaOrgan(h, t + 0.015, d * 0.9, 0.075);
      gaOrgan(f / 2, t, d * 0.9, 0.045);
      t += d;
    });
    const bar = 3 * B;   // 3拍=1小節。フレーズ頭から小節ごとに和音を敷く
    AG_PAD.forEach((ch, i) => {
      const st = i * bar; if (st >= t) return;
      const d = (i === AG_PAD.length - 1 ? Math.max(bar, t - st) : bar) * 0.98;
      ch.forEach((f, k) => gaChoir(f, st, d, k ? 0.03 : 0.038));
    });
  };

  const fmtT = (s) => { const m = Math.floor(s / 60); return m + ':' + (s % 60 < 10 ? '0' : '') + s % 60; };
  const fmtP = (g, h) => h === 0 ? '1/ -' : '1/' + Math.round(g / h);
  const rndB = () => BLANKS[Math.floor(Math.random() * BLANKS.length)];
  const rnd3 = () => { let a, b, c; do { a = rndB(); b = rndB(); c = rndB(); } while (a === b && b === c); return [a, b, c]; };

  // ランプ盤の既定値(ls が空の時の見え方。JSXの `||` フォールバックと必ず一致させる)
  const D_BG = 'radial-gradient(circle at 50% 45%, #14110a 0%, #050406 70%)';
  const D_BORDER = 'rgba(255,215,0,0.18)';
  const D_MAINC = '#ffd700';
  const D_SUBC = 'rgba(255,215,0,0.18)';
  // 枠の発光は box-shadow の毎フレーム書換えをやめ、プリブラーした radial-gradient div の opacity 変調で表現
  const fgGrad = (h, s, l) => `radial-gradient(closest-side,hsla(${h},${s}%,${l}%,0.6) 0%,hsla(${h},${s}%,${l}%,0.25) 55%,hsla(${h},${s}%,${l}%,0) 100%)`;
  const FG_GOLD = 'radial-gradient(closest-side,rgba(255,215,0,0.62) 0%,rgba(255,190,0,0.26) 55%,rgba(255,180,0,0) 100%)';
  // 値が変わった時だけ style を書く(無駄なpaintと再parseを避ける)
  const wsty = (el, key, prop, val) => {
    const c0 = styCacheRef.current;
    if (!el) { delete c0[key]; return; } // 未マウント時はキャッシュを捨てる(再マウント時の書き漏れ防止)
    const c = c0;
    if (c[key] === val) return;
    c[key] = val; el.style[prop] = val;
  };
  const applyLamp = (st) => {
    const s = st || {};
    lsRef.current = s;
    if (!st) styCacheRef.current = {};
    wsty(sgRef.current, 'sg', 'background', s.sg || 'none');
    wsty(frameRef.current, 'fbg', 'background', s.bg || D_BG);
    wsty(frameRef.current, 'fbd', 'borderColor', s.border || D_BORDER);
    wsty(glowRef.current, 'gl', 'background', s.glow || 'none');
    wsty(frameGlowRef.current, 'fgb', 'background', s.fg || 'none');
    wsty(frameGlowRef.current, 'fgo', 'opacity', String(s.fgo || 0));
    wsty(mainTxtRef.current, 'mc', 'color', s.textColor || D_MAINC);
    wsty(mainTxtRef.current, 'ms', 'textShadow', s.textShadow || 'none');
    wsty(subTxtRef.current, 'sc', 'color', s.subColor || D_SUBC);
    wsty(subTxtRef.current, 'ss', 'textShadow', s.subShadow || 'none');
    wsty(ringRef.current, 'rb', 'borderColor', s.ringBorder || 'transparent');
  };
  const lampOff = () => { lampTypeRef.current = 'off'; lampStartRef.current = null; prevLtRef.current = 'off'; applyLamp(null); };
  const resetLamp = () => {
    lampOff(); setShaking(false);
    setLampMainText(''); setLampMainSize('min(24vw,100px)'); setLampSubText('ANOTHER');
  };
  const flash = (a, ms, col) => { setFlashColor(col || '#fff'); setFlashAlpha(a); T(() => setFlashAlpha(0), ms); };
  const shakeFor = (ms) => { setShaking(true); T(() => setShaking(false), ms); };
  // --- アセット: カットイン層。画像が未ロードなら完全に何もしない(既存タイムラインの時刻・音・ロック時間は不変) ---
  const hideCutin = () => {
    const el = cutinRef.current; if (el && el.style.opacity !== '0') el.style.opacity = '0';
    if (cutinOnRef.current) { cutinOnRef.current = false; setCutinOn(false); }   // 巨大GOD文字を戻す
  };
  const showCutin = (key, durationMs) => {
    const el = cutinRef.current; if (!el) return;
    if (!gaAssetLoaded(key)) return;
    const cfg = GA_ASSETS[key] || {}, fade = cfg.fade != null ? cfg.fade : 300;
    el.style.backgroundImage = 'url("' + gaAssetSrc(key) + '")';
    el.style.mixBlendMode = cfg.blend || 'screen';
    el.style.transition = 'opacity ' + fade + 'ms linear';
    el.style.opacity = '1';
    if (!cutinOnRef.current) { cutinOnRef.current = true; setCutinOn(true); }   // 画像が実際に出る時だけ主文字を退避(未ロード時は上の return で来ない)
    T(hideCutin, Math.max(fade, durationMs || 0));   // 表示時間の終端でフェードアウト(ロック時間内)
  };
  // --- アセット: 動画。preload="none" のまま眠り、初回GOD揃いで load()、アメイジングGOD時だけ再生 ---
  const hideMovie = () => {
    const v = vidRef.current; if (!v) return;
    if (v.style.display === 'none') return;   // 非表示のままなら完全に何もしない
    v.style.display = 'none';
    try { v.pause(); } catch (e) {}
  };
  const vidSt = (k) => vidStRef.current[k] || (vidStRef.current[k] = { armed: false, ready: false, failed: false });
  // 再生可否はvideo要素のreadyStateを正とする(合成イベント頼みのフラグはsrc切替時に取りこぼす実績あり・2026-08-25)
  const mvReady = (k) => {
    const key = k || 'movie', v = vidRef.current;
    if (!v || vidKeyRef.current !== key) return false;
    const st = vidSt(key);
    return v.readyState >= 3 || (st.ready && !st.failed);
  };
  const armMovie = (key) => {
    const k = key || 'movie';
    const st = vidSt(k), v = vidRef.current;
    if (st.failed || !v) return;
    if (vidKeyRef.current !== k) {
      // ソース切替: 切替先のready状態はロードし直すまで無効(バッファはvideo要素1本を使い回すため)
      vidKeyRef.current = k; st.ready = false; st.armed = true;
      try { v.src = gaAssetSrc(k); } catch (e) {}
      try { v.load(); } catch (e) {}
      return;
    }
    if (st.armed) return;
    st.armed = true;
    try { v.load(); } catch (e) {}
  };
  const playMovie = (key) => {
    const k = key || 'movie';
    // 未ready・play()拒否とも1回だけ再試行(初回再生の取りこぼし対策・2026-08-25)。それでも駄目なら現行演出が床
    const attempt = (retry) => {
      const v = vidRef.current;
      if (!v || vidKeyRef.current !== k) return;   // 別ソースがセット中なら再生しない(取り違え防止)
      if (!mvReady(k)) { if (retry) T(() => attempt(false), 700); return; }
      try {
        v.style.display = 'block';
        v.currentTime = 0;
        const p = v.play();
        if (p && p.catch) p.catch(() => { if (retry) T(() => attempt(false), 350); else hideMovie(); });
      } catch (e) { hideMovie(); }
    };
    attempt(true);
  };
  // --- リール: 図柄の並び(帯)は idx から決まる固定バンド。停止コマ(stopIdx)だけ狙った図柄に差し替える ---
  const symAt = (i, idx, r, pool) => {
    if (r.stopIdx != null && idx === r.stopIdx) return r.sym;
    if (r.prevIdx != null && idx === r.prevIdx) return r.prevSym;   // 差し替え直前の出目(滑り込み中の見た目維持)
    const L = pool.length;
    return pool[(((idx + i * 2) % L) + L) % L];
  };
  const paintReel = (i, r, pool) => {
    const st = stripRef.current[i]; if (!st) return;
    const tf = 'translateY(' + (-r.pos * 100).toFixed(3) + '%)';
    if (tf !== r.lastT) { r.lastT = tf; st.style.transform = tf; }   // 静止中の無駄な書き込みを避ける
    const spinning = r.mode === 'spin';
    if (spinning !== r.spinCls) { r.spinCls = spinning; st.className = spinning ? 'gaStrip gaSpin' : 'gaStrip'; }
    const base = Math.floor(r.pos);
    for (let j = 0; j < RCELLS; j++) {
      const c = cellRef.current[i][j]; if (!c) continue;
      const idx = base - 1 + (((j - (base - 1)) % RCELLS) + RCELLS) % RCELLS;
      if (c.idx !== idx) { c.idx = idx; c.el.style.top = (idx * 100) + '%'; }
      const sym = symAt(i, idx, r, pool);
      if (c.h !== sym) {
        c.h = sym;
        const ak = SYM_ASSET[sym], useImg = !!(ak && gaAssetLoaded(ak));
        if (useImg) {
          const src = gaAssetSrc(ak), ims = c.im;
          for (let k = 0; k < ims.length; k++) { ims[k].setAttribute('href', src); ims[k].setAttributeNS(XLINK, 'xlink:href', src); }
        } else {
          const h = '#' + SYM_ID[sym], us = c.u;
          for (let k = 0; k < us.length; k++) { us[k].setAttribute('href', h); us[k].setAttributeNS(XLINK, 'xlink:href', h); }
        }
        if (c.useImg !== useImg) {   // レイヤの表示切替は変化した時だけ(毎フレームの書き込みを増やさない)
          c.useImg = useImg;
          if (c.sg) c.sg.style.display = useImg ? 'none' : '';
          if (c.ig) c.ig.style.display = useImg ? '' : 'none';
        }
      }
    }
    r.dirty = false;
  };
  const rebaseReel = (r) => {
    if (Math.abs(r.pos) < 400) return;
    const k = Math.round(r.pos);
    r.pos -= k; r.target -= k; r.from -= k;
    if (r.stopIdx != null) r.stopIdx -= k;
    if (r.prevIdx != null) r.prevIdx -= k;
    r.dirty = true;
  };
  const setHalo = (i, sym) => {
    const h = rHaloRef.current[i]; if (!h) return;
    const s = SYMS[sym];
    if (s && HALO_SYM[sym]) { h.style.background = `radial-gradient(ellipse at 50% 50%,${s.g},transparent 74%)`; h.style.opacity = '1'; }
    else h.style.opacity = '0';
  };
  const setReelGlow = (i, col) => {
    const g = rGlowRef.current[i]; if (!g) return;
    if (col) { g.style.background = `radial-gradient(ellipse at 50% 50%,${col},transparent 76%)`; g.style.opacity = '1'; }
    else g.style.opacity = '0';
  };
  const sndTenpai = () => { jTone(740, 0, 0.09, 0.13, 'triangle'); jTone(988, 0.1, 0.15, 0.13, 'triangle'); };
  const startTenpai = (col) => { tenpaiRef.current = true; setReelGlow(2, col); sndTenpai(); };
  const endTenpai = () => { tenpaiRef.current = false; setReelGlow(2, null); };
  // 停止ターゲティング: 目標コマまで easeOut で寄せ、着地後に減衰振動(バウンス)
  const beginStop = (i, sym, quiet, silent) => {
    const r = rObjRef.current[i];
    if (r.mode === 'stopping' || r.mode === 'bounce') { r.sym = sym; r.stopIdx = r.target; r.dirty = true; return; }
    const wasSpin = r.mode === 'spin' || !!(reelSpinRef.current & (1 << i));
    r.prevIdx = r.stopIdx; r.prevSym = r.sym;
    if (wasSpin) {
      r.target = Math.ceil(r.pos + 1.8);
      r.dur = (i === 2 && tenpaiRef.current) ? 430 : (reelSlowRef.current ? 360 : 175);
    } else {
      r.target = Math.round(r.pos) + 1; r.pos = r.target - 1.05; r.dur = 110;
    }
    r.from = r.pos; r.et = 0; r.mode = 'stopping';
    r.sym = sym; r.stopIdx = r.target; r.quiet = !!quiet; r.silent = !!silent; r.dirty = true;
  };
  const stopReel = (i, sym, quiet) => {
    reelSpinRef.current = reelSpinRef.current & ~(1 << i);
    setReels(prev => { const n = prev.slice(); n[i] = sym; return n; });
    beginStop(i, sym, quiet, false);   // 停止音は着地フレームで鳴らす(RAF側)
  };
  const landStagger = (arr, t0, gap, quiet, tenpaiCol) => {
    if (tenpaiCol) { T(() => startTenpai(tenpaiCol), t0 + gap + 90); T(endTenpai, t0 + 2 * gap + 1200); }
    arr.forEach((s, i) => T(() => stopReel(i, s, quiet), t0 + i * gap));
  };
  const spinReels = (pool) => { reelPoolRef.current = pool; reelSpinRef.current = 7; };
  // --- P5: 消灯→再点灯 / 回転レイ盤 / 稲妻 ---
  const RELIT = {
    god: 'radial-gradient(ellipse at 50% 55%,rgba(255,228,130,0.5),rgba(255,180,0,0.16) 58%,transparent 84%)',
    meio: 'radial-gradient(ellipse at 50% 55%,rgba(170,230,255,0.46),rgba(40,140,230,0.16) 58%,transparent 84%)',
    purple: 'radial-gradient(ellipse at 50% 55%,rgba(210,150,255,0.46),rgba(140,50,230,0.16) 58%,transparent 84%)',
  };
  const reelDark = (on) => { for (let i = 0; i < 3; i++) { const d = rDarkRef.current[i]; if (d) d.style.opacity = on ? '0.85' : '0'; } };
  const reelRelight = (kind, step) => {
    const g = RELIT[kind] || RELIT.god;
    for (let i = 0; i < 3; i++) T(() => {
      const d = rDarkRef.current[i], b = rBackRef.current[i];
      if (d) d.style.opacity = '0';
      if (b) { b.style.background = g; b.style.opacity = '1'; }
    }, i * step);
    T(() => { for (let i = 0; i < 3; i++) { const b = rBackRef.current[i]; if (b) b.style.opacity = '0.4'; } }, 2 * step + 300);
  };
  const reelReset = () => {
    tenpaiRef.current = false;
    for (let i = 0; i < 3; i++) {
      const d = rDarkRef.current[i], b = rBackRef.current[i], g = rGlowRef.current[i], h = rHaloRef.current[i];
      if (d) d.style.opacity = '0'; if (b) b.style.opacity = '0';
      if (g) g.style.opacity = '0'; if (h) h.style.opacity = '0';
    }
  };
  const rayOn = (on) => { const el = rayRef.current; if (el) el.className = on ? 'gaRayWrap gaRayOn' : 'gaRayWrap'; };
  const boltFlash = () => {
    const el = boltRef.current; if (!el) return;
    el.style.opacity = '1';
    T(() => { if (boltRef.current) boltRef.current.style.opacity = '0'; }, 90);
    T(() => { if (boltRef.current) boltRef.current.style.opacity = '0.85'; }, 165);
    T(() => { if (boltRef.current) boltRef.current.style.opacity = '0'; }, 270);
  };

  // --- P7: canvasパーティクル1枚(スプライト事前描画+プール+drawImageのみ+粒が尽きたらRAF停止) ---
  const mkSprite = (draw, w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; };
  const ensureSprites = () => {
    if (sprRef.current) return sprRef.current;
    try {
      const coin = mkSprite((c, w, h) => {
        const g = c.createRadialGradient(w * 0.4, h * 0.35, 2, w / 2, h / 2, w / 2);
        g.addColorStop(0, '#fff6c0'); g.addColorStop(0.45, '#ffd84d'); g.addColorStop(0.8, '#c8860a'); g.addColorStop(1, '#8d5c00');
        c.fillStyle = g; c.beginPath(); c.arc(w / 2, h / 2, w / 2 - 2, 0, 7); c.fill();
        c.strokeStyle = '#6b4a06'; c.lineWidth = 3; c.stroke();
        c.strokeStyle = 'rgba(255,246,192,0.9)'; c.lineWidth = 2; c.beginPath(); c.arc(w / 2, h / 2, w / 2 - 7, 0, 7); c.stroke();
        c.fillStyle = '#8d5c00'; c.font = 'bold ' + (w * 0.5) + 'px Georgia'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('G', w / 2, h / 2 + 2);
      }, 44, 44);
      const dust = mkSprite((c, w, h) => {
        const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        g.addColorStop(0, 'rgba(255,240,170,1)'); g.addColorStop(0.5, 'rgba(255,210,74,0.55)'); g.addColorStop(1, 'rgba(255,210,74,0)');
        c.fillStyle = g; c.fillRect(0, 0, w, h);
      }, 18, 18);
      const shard = mkSprite((c, w, h) => {
        c.fillStyle = 'rgba(200,230,255,0.85)'; c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(w * 0.5, 0); c.lineTo(w, h * 0.7); c.lineTo(w * 0.3, h); c.closePath(); c.fill(); c.stroke();
      }, 26, 34);
      const spark = mkSprite((c, w, h) => {
        const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,122,224,0.85)'); g.addColorStop(0.7, 'rgba(196,139,255,0.4)'); g.addColorStop(1, 'rgba(196,139,255,0)');
        c.fillStyle = g; c.fillRect(0, 0, w, h);
      }, 22, 22);
      sprRef.current = { coin, dust, shard, spark };
    } catch (e) { sprRef.current = null; }
    return sprRef.current;
  };
  // 残留掃除: refの生死に関わらずDOM上のパーティクルcanvasを全て消して隠す(2026-08-25残留バグの根治側)
  const pSweep = () => {
    try {
      document.querySelectorAll('canvas.gaPcv').forEach(c => {
        try { c.getContext('2d').clearRect(0, 0, c.width, c.height); } catch (e) {}
        c.style.display = 'none';
      });
    } catch (e) {}
  };
  const pTick = () => {
    const cv = cvRef.current || document.querySelector('canvas.gaPcv'), ps = psRef.current;
    if (!cv || !aliveRef.current) {
      // 死亡時も塗り残しを消してから止める(描画済みフレームが画面に残留した実バグの防御・2026-08-25)
      pRafRef.current = null; psRef.current = [];
      pSweep();
      return;
    }
    const ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life--;
      if (p.y > H + 80 || p.life <= 0) { ps.splice(i, 1); continue; }
      ctx.save(); ctx.translate(p.x, p.y);
      if (p.squash >= 0) { p.squash += 0.18; ctx.rotate(p.rot); ctx.scale(Math.abs(Math.cos(p.squash)) * 0.9 + 0.1, 1); }
      else if (p.vr) { ctx.rotate(p.rot); }
      ctx.globalAlpha = p.life < 30 ? p.life / 30 : 1;
      ctx.drawImage(p.spr, -p.spr.width / 2, -p.spr.height / 2);
      ctx.restore();
    }
    if (ps.length) pRafRef.current = requestAnimationFrame(pTick);
    else { pRafRef.current = null; cv.style.display = 'none'; }
  };
  const pBurst = (type) => {
    const cv = cvRef.current || document.querySelector('canvas.gaPcv'); if (!cv) return;
    const sp = ensureSprites(); if (!sp) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round((cv.clientWidth || 360) * dpr)), h = Math.max(1, Math.round((cv.clientHeight || 480) * dpr));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    cv.style.display = 'block';
    const W = w, H = h, k = H / 1120, ps = psRef.current;   // k: モック(高さ1120)基準の速度スケール
    const add = (n, init) => { for (let i = 0; i < n && ps.length < P_MAX; i++) ps.push(init()); };
    if (type === 'coins') {
      // 調整指示: vy 2.5〜4 + 出現高さの分散を広げ、雨が約2.5秒続くようにする
      add(40, () => ({ spr: sp.coin, x: Math.random() * W, y: -0.05 * H - Math.random() * 1.25 * H, vx: (Math.random() - 0.5) * 1.2 * k, vy: (2.5 + Math.random() * 1.5) * k, g: 0.25 * k, rot: Math.random() * 7, vr: (Math.random() - 0.5) * 0.3, life: 999, squash: Math.random() * 7 }));
      add(60, () => ({ spr: sp.dust, x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.8 * k, vy: (-0.6 - Math.random() * 1.2) * k, g: -0.005 * k, rot: 0, vr: 0, life: 90 + Math.random() * 60, squash: -1 }));
    } else if (type === 'glass') {
      add(30, () => { const a = Math.random() * 6.28, s = (6 + Math.random() * 9) * k;
        return { spr: sp.shard, x: W / 2, y: H * 0.35, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 3 * k, g: 0.5 * k, rot: Math.random() * 7, vr: (Math.random() - 0.5) * 0.5, life: 999, squash: -1 }; });
    } else {
      add(80, () => { const a = Math.random() * 6.28, s = (2 + Math.random() * 11) * k;
        return { spr: sp.spark, x: W / 2, y: H * 0.45, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: 0.12 * k, rot: 0, vr: 0, life: 40 + Math.random() * 50, squash: -1 }; });
    }
    if (!pRafRef.current) pRafRef.current = requestAnimationFrame(pTick);
  };

  const computeLamp = (h, s, l, p, a) => ({
    glow: `radial-gradient(circle,hsla(${h},${s}%,${l + 15}%,${a * 1.1}) 0%,hsla(${h},${s}%,${l + 5}%,${a * 0.5}) 30%,hsla(${h},${s * 0.7}%,${l - 10}%,${a * 0.08}) 65%,transparent 88%)`,
    textColor: `hsla(${h},${s}%,${l + 25}%,${0.9 + 0.1 * p})`,
    textShadow: `0 0 15px hsla(${h},${s}%,${l + 10}%,${0.9 * p}),0 0 40px hsla(${h},${s}%,${l}%,${0.5 * p}),0 0 80px hsla(${h},${s * 0.8}%,${l - 5}%,${0.2 * p})`,
    subColor: `hsla(${h},${s}%,${l + 10}%,${0.4 * p})`, subShadow: `0 0 8px hsla(${h},${s}%,${l}%,${0.3 * p})`,
    border: `hsla(${h},${s}%,${l - 5}%,${0.3 + 0.5 * p})`,
    fg: fgGrad(Math.round(h / 6) * 6, Math.round(s), Math.round(l - 5)), fgo: 0.3 * p,
    ringBorder: `hsla(${h},${s}%,${l - 5}%,${0.15 + 0.2 * p})`, bg: '#050406',
    sg: `radial-gradient(circle at 50% 45%,hsla(${h},${s}%,${l - 10}%,${a * 0.1}) 0%,transparent 60%)`,
  });

  // Main loop: dt計測 → ロック中は実時間(Date.now)ベースで残り時間を凍結 + リール + ランプ
  useEffect(() => {
    if (phase !== "playing" && phase !== "done") return;
    let running = true;
    lastTsRef.current = null;
    const loop = (ts) => {
      if (!running) return;
      const prev = lastTsRef.current; lastTsRef.current = ts;
      const dt = prev == null ? 0 : Math.min(ts - prev, 500);
      // 演出ロック中のタイマー停止は Date.now ベース(lockFreezeRef)で行う。
      // フレームdtに依存しないので、タブを裏に回して RAF が止まっても離脱ぶんの実時間が正しく凍結される
      // CRT(ぷちゅん): 固定div3枚を ref で持ち、座標とopacityだけRAFで更新(再レンダーなし)
      if (crtActiveRef.current) {
        const ce = performance.now() - crtStartRef.current;
        const cb = crtBarRef.current, cl = crtLineRef.current, cd = crtDotRef.current;
        const cr = crtBarRRef.current, cc = crtBarCRef.current, cs = crtScanRef.current;
        if (cs) { const sv = ce < 500 ? 'block' : 'none'; if (cs.style.display !== sv) cs.style.display = sv; }  // P8: 走査線は収縮中0.5秒
        if (cb && cl && cd) {
          if (ce < 160) {
            const p = ce / 160, h = 100 * (1 - p);
            cb.style.display = 'block'; cb.style.height = Math.max(h, 0.5) + '%'; cb.style.top = (50 - h / 2) + '%';
            // P8: 色収差(赤/シアンを1pxずらした半透明バー)
            if (cr) { cr.style.display = 'block'; cr.style.height = cb.style.height; cr.style.top = cb.style.top; }
            if (cc) { cc.style.display = 'block'; cc.style.height = cb.style.height; cc.style.top = cb.style.top; }
            cl.style.display = 'none'; cd.style.display = 'none';
          } else if (ce < 280) {
            if (cr) cr.style.display = 'none';
            if (cc) cc.style.display = 'none';
            const p = (ce - 160) / 120;
            cb.style.display = 'none'; cd.style.display = 'none';
            cl.style.display = 'block'; cl.style.left = (50 * p) + '%'; cl.style.right = (50 * p) + '%'; cl.style.opacity = String(1 - p * 0.7);
          } else if (ce < 530) {
            const p = (ce - 280) / 250;
            cb.style.display = 'none'; cl.style.display = 'none';
            cd.style.display = 'block'; cd.style.opacity = String(1 - p);
          } else {
            cb.style.display = 'none'; cl.style.display = 'none'; cd.style.display = 'none';
          }
        }
      }
      if (phaseRef.current === 'playing' && startTimeRef.current) {
        const frozen = lockFreezeRef.current != null ? (Date.now() - lockFreezeRef.current) : 0;   // 進行中のロックぶん(未確定)
        const elapsed = Math.floor((Date.now() - startTimeRef.current - frozen) / 1000);
        const newTimeLeft = Math.max(0, TOTAL - elapsed);
        if (newTimeLeft !== timeLeftRef.current) {
          timeLeftRef.current = newTimeLeft; setTimeLeft(newTimeLeft);
        }
        // 演出ロック中はTIME UPさせない(award完了後にdoneへ→スコア取りこぼし防止)
        if (newTimeLeft <= 0 && !lockedRef.current && phaseRef.current === 'playing') { phaseRef.current = 'done'; setPhase("done"); setMsg('TIME UP'); setMsgColor('#666'); resetLamp(); }
      }
      // --- P4: 縦ストリップの回転・停止ターゲティング・減衰振動バウンス(setStateなし) ---
      {
        const pool = reelPoolRef.current || SPINPOOL, mask = reelSpinRef.current;
        let anySpin = false;   // 回転ループ音の可否。回転中 or 減速中の1本でもあれば鳴らす
        for (let i = 0; i < 3; i++) {
          const r = rObjRef.current[i];
          if ((mask & (1 << i)) || r.mode === 'spin' || r.mode === 'stopping') anySpin = true;
          if (r.mode === 'stopping') {
            r.et += dt;
            const x = r.dur > 0 ? Math.min(1, r.et / r.dur) : 1;
            r.pos = r.from + (r.target - r.from) * (1 - (1 - x) * (1 - x));
            if (x >= 1) {
              r.pos = r.target; r.mode = 'bounce'; r.bounceT = 0;
              if (!r.silent) { if (r.quiet) sndSoftStop(); else sndReelStop(); }
              r.silent = false; setHalo(i, r.sym);
              if (i === 2 && tenpaiRef.current) endTenpai();
            }
          } else if (r.mode === 'bounce') {
            r.bounceT += dt / 1000;
            const t = r.bounceT;
            r.pos = r.target + 0.06 * Math.exp(-8 * t) * Math.cos(24 * t);   // reel-mock検証済みの式
            if (t > 0.45) { r.pos = r.target; r.mode = 'idle'; rebaseReel(r); }
          } else if (mask & (1 << i)) {
            if (r.mode !== 'spin') { r.mode = 'spin'; r.stopIdx = null; r.dirty = true; }
            r.pos += ((i === 2 && tenpaiRef.current) ? RV_TENPAI : (reelSlowRef.current ? RV_SLOW : RV_FAST)) * dt / 100;
          } else if (r.mode === 'spin') { r.mode = 'idle'; }
          paintReel(i, r, pool);
        }
        gaSpinLoopSet(anySpin);   // 毎フレーム同期。どの経路で回転が終わっても次フレームで必ず停止する
      }
      const lt = lampTypeRef.current;
      if (lt !== prevLtRef.current) { prevLtRef.current = lt; styCacheRef.current = {}; }
      if (lt !== 'off') {
        if (!lampStartRef.current) lampStartRef.current = ts;
        const e = (ts - lampStartRef.current) / 1000;
        let st = {};
        if (lt === 'gase') { const p = 0.25 + 0.2 * Math.sin(e * 24), a = 0.2 + 0.15 * p; st = computeLamp(45, 60, 28, p, a); }
        else if (lt === 'y7') { const p = 0.7 + 0.3 * Math.sin(e * 9), a = 0.7 + 0.3 * p; st = computeLamp(48, 100, 52, p, a); }
        else if (lt === 'y7hold') { const p = 0.5 + 0.5 * Math.sin(e * (4 + e * 5)), a = 0.45 + 0.4 * p; st = computeLamp(48, 100, 45, p, a); }
        else if (lt === 'y7win') { const p = 0.75 + 0.25 * Math.sin(e * 16), a = 0.85 + 0.15 * p; st = computeLamp(50, 100, 58, p, a); }
        else if (lt === 'purple') { const fl = Math.sin(e * 34) > 0.85 ? 1 : 0; const p = 0.7 + 0.3 * Math.sin(e * 13), a = (0.75 + 0.25 * p) * (1 + fl * 0.35); st = computeLamp(275, 100, 55 + fl * 12, p, a); }
        else if (lt === 'meio') { const h = 195 + 38 * Math.sin(e * 1.6), p = 0.55 + 0.45 * Math.sin(e * 5.5), a = 0.7 + 0.3 * p; st = computeLamp(h, 90, 52, p, a); }
        else if (lt === 'crash') { const on = Math.sin(e * 95) > 0; if (on) { const p = 0.8 + 0.2 * Math.sin(e * 30), a = 0.9; st = computeLamp(4, 95, 52, p, a); } else { const p = 0.9, a = 0.85; st = computeLamp(0, 0, 62, p, a); } }
        else if (lt === 'allspin') { const p = 0.35 + 0.3 * Math.sin(e * 3), a = 0.3 + 0.25 * p; st = computeLamp(210, 60, 40, p, a); }
        else if (lt === 'sin') { st = { glow: 'none', textColor: 'rgba(255,255,255,0.06)', textShadow: 'none', subColor: 'rgba(255,255,255,0.05)', subShadow: 'none', border: '#0b0a0c', fg: 'none', fgo: 0, ringBorder: 'transparent', bg: '#020203', sg: 'none' }; }
        else if (lt === 'sinlose') { const a = Math.max(0, 0.28 - e * 0.13); st = computeLamp(300, 30, 26, 0.25, a); }
        else if (lt === 'sinwin') { const h = Math.sin(e * 13) > 0 ? 45 : 288; const p = 0.8 + 0.2 * Math.sin(e * 20), a = 0.95; st = computeLamp(h, 100, 58, p, a); }
        else if (lt === 'god') {
          const fc = Math.floor(e * 60); const on = Math.sin(fc * 0.7) > 0, p = 0.7 + 0.3 * Math.sin(e * 14);
          if (on) { const hue = (e * 150) % 50, a = 0.85 + 0.15 * p;
            st = { glow: `radial-gradient(circle,rgba(255,255,255,${a}) 0%,hsla(${42 + hue},100%,58%,${a * 0.55}) 25%,transparent 80%)`, textColor: `rgba(255,${225 + 30 * p | 0},${115 + 40 * p | 0},1)`, textShadow: `0 0 25px rgba(255,215,0,1),0 0 60px rgba(255,180,0,0.7),0 0 100px rgba(255,255,255,0.4)`, subColor: `rgba(255,215,0,${0.7 * p})`, subShadow: 'none', border: `rgba(255,215,0,${0.6 + 0.35 * p})`, fg: FG_GOLD, fgo: 0.5, ringBorder: `rgba(255,215,0,${0.4 + 0.4 * p})`, bg: `radial-gradient(circle,rgba(35,28,0,1) 0%,#040404 60%)`, sg: `radial-gradient(circle at 50% 45%,rgba(255,215,0,${0.2 * p}) 0%,rgba(255,180,0,${0.08 * p}) 20%,transparent 65%)` };
          } else { st = { glow: 'radial-gradient(circle,rgba(255,255,255,0.08) 0%,transparent 50%)', textColor: 'rgba(255,215,0,0.2)', textShadow: '0 0 6px rgba(255,200,0,0.1)', subColor: 'rgba(255,215,0,0.1)', subShadow: 'none', border: 'rgba(255,215,0,0.12)', fg: FG_GOLD, fgo: 0, ringBorder: 'rgba(255,215,0,0.06)', bg: '#040404', sg: `radial-gradient(circle at 50% 45%,rgba(255,200,0,0.02) 0%,transparent 30%)` }; }
        }
        else if (lt === 'amazing') {
          const h = (e * 120) % 360, p = 0.8 + 0.2 * Math.sin(e * 10), a = 0.9 + 0.1 * p;
          st = { glow: `radial-gradient(circle,rgba(255,255,255,${a}) 0%,rgba(255,215,0,${a * 0.75}) 18%,hsla(${h},100%,60%,${a * 0.5}) 42%,hsla(${(h + 60) % 360},100%,55%,${a * 0.25}) 62%,transparent 88%)`, textColor: '#fffbe0', textShadow: `0 0 30px rgba(255,215,0,1),0 0 70px hsla(${h},100%,60%,0.8),0 0 120px rgba(255,255,255,0.5)`, subColor: `hsla(${h},100%,78%,${0.85 * p})`, subShadow: 'none', border: `hsla(${h},100%,60%,${0.7 + 0.3 * p})`, fg: FG_GOLD, fgo: 0.6, ringBorder: `hsla(${(h + 180) % 360},100%,60%,${0.5 + 0.4 * p})`, bg: 'radial-gradient(circle,rgba(45,36,0,1) 0%,#050403 62%)', sg: `radial-gradient(circle at 50% 45%,rgba(255,215,0,${0.25 * p}) 0%,hsla(${h},100%,50%,${0.1 * p}) 25%,transparent 70%)` };
        }
        applyLamp(st);
      }
      // --- P10: 上部ランプ帯(色はモード切替時のみ・毎フレームは opacity だけ) ---
      if (barRef.current[0]) {
        const bm = barLockRef.current > 0 ? 'lock' : (BAR_C[lt] ? lt : 'off');
        if (bm !== barPrevRef.current) {
          barPrevRef.current = bm;
          for (let i = 0; i < 8; i++) { const el = barRef.current[i]; if (el) el.style.background = barGrad(bm, i); barCacheRef.current[i] = -1; }
        }
        const be = (bm !== 'off' && lampStartRef.current) ? (ts - lampStartRef.current) / 1000 : 0;
        for (let i = 0; i < 8; i++) {
          const el = barRef.current[i]; if (!el) continue;
          const v = Math.round(barVal(bm, i, be) * 20) / 20;
          if (barCacheRef.current[i] !== v) { barCacheRef.current[i] = v; el.style.opacity = String(v); }
        }
      }
      lampRef.current = requestAnimationFrame(loop);
    };
    lampRef.current = requestAnimationFrame(loop);
    return () => { running = false; if (lampRef.current) cancelAnimationFrame(lampRef.current); gaSpinLoopStop(); };
  }, [phase]);

  // reels(出目の正)とストリップ表示の同期。setReels 直書き(seqGod/unlockAt/rnd3等)を取りこぼさない
  useEffect(() => {
    const mask = reelSpinRef.current;
    for (let i = 0; i < 3; i++) {
      const r = rObjRef.current[i];
      if (r.sym === reels[i] && r.mode !== 'spin' && !(mask & (1 << i))) continue;   // 回転中は同図柄でも必ず停止処理へ(コマ間固着の防止)
      if (r.mode === 'stopping' || r.mode === 'bounce') { r.sym = reels[i]; r.stopIdx = r.target; r.dirty = true; continue; }
      if (r.mode === 'spin' || (mask & (1 << i))) { beginStop(i, reels[i], true, true); continue; }
      const k = Math.round(r.pos);
      r.pos = k; r.from = k; r.target = k; r.stopIdx = k; r.prevIdx = null; r.sym = reels[i]; r.mode = 'idle'; r.dirty = true;
      setHalo(i, reels[i]);
    }
  }, [reels]);
  // リールDOMのマウント直後(playing/done切替時)に現在の出目を描き直す
  useEffect(() => {
    if (phase !== 'playing' && phase !== 'done') return;
    barPrevRef.current = '';
    for (let i = 0; i < 3; i++) {
      const r = rObjRef.current[i];
      r.dirty = true; r.spinCls = false; r.lastT = null;
      for (let j = 0; j < RCELLS; j++) { const c = cellRef.current[i][j]; if (c) { c.idx = null; c.h = null; } }
      setHalo(i, r.sym);
    }
  }, [phase]);

  // ジャグ連の計算(支払いが発生したフラグのみ呼ぶ)
  const computeJug = (type) => {
    const hitAt = spinCountRef.current;
    const newJugRen = hitAt <= 100 ? jugRenRef.current + 1 : 1;
    jugRenRef.current = newJugRen; setJugRen(newJugRen);
    const baseMult = 1 + (newJugRen - 1) * 0.1;
    const is1G = hitAt === 1;
    // ハマリプレミア: 1000以上ハマりからの当たりは倍率アップ(1000で×1.2, 1100で×1.4, 1200で×1.6, …+0.2/100G・上限なし)
    // 2026-08-25 竹森氏指示で開始を900→1000に変更
    const hamari = hitAt >= 1000 ? 1 + 0.2 * Math.floor((hitAt - 900) / 100) : 1;
    const mult = (is1G ? baseMult + 1.0 : baseMult) * hamari;
    setLastMult(mult);   // 連チャンバナーは「直近の当たりで実際に適用された倍率」(1G連の+1.0込み)を表示する
    spinCountRef.current = 0; setSpinCount(0);
    setHistory(prev => [{ type, at: hitAt, jugRen: newJugRen, is1G }].concat(prev).slice(0, 30));
    if (is1G) {
      gaPlay('oneG', 1.0);
      [1568, 1976, 2349, 2793, 3136].forEach((f, i) => jTone(f, 0.05 + i * 0.03, 0.2, 0.15));
      flash(0.8, 120, '#fff'); shakeFor(500); boltFlash();
    }
    if (newJugRen >= 2) {
      const intensity = Math.min(newJugRen, 5);
      const baseVol = 0.1 + intensity * 0.04;
      const baseFreqs = [523, 659, 784, 988, 1175, 1397, 1568, 1760, 2093];
      const noteCount = 3 + intensity * 2;
      for (let i = 0; i < noteCount && i < baseFreqs.length; i++) jTone(baseFreqs[i], 0.05 + i * 0.04, 0.25 + intensity * 0.05, baseVol);
      if (intensity >= 3) synth(0.15, (s) => (Math.random() * 2 - 1) * Math.exp(-s * 18) * 0.4, 0.3 + intensity * 0.1);
      if (intensity >= 4) jTone(65, 0, 0.5, 0.12 + intensity * 0.02, 'sawtooth');
      if (intensity >= 5) { [2093, 2349, 2637, 3136].forEach((f, i) => jTone(f, 0.3 + i * 0.05, 0.3, 0.06)); synth(0.3, (s) => (Math.random() * 2 - 1) * Math.exp(-s * 8) * 0.3, 0.4); }
    }
    return { mult, is1G, jugRen: newJugRen, label: (is1G ? ' 1G連!' : '') + (hamari > 1 ? ' ハマリプレミア' : newJugRen >= 2 ? ' ジャグ連' + newJugRen : '') + (mult > 1 ? ' ×' + mult.toFixed(1) : '') };
  };

  const award = (type, prefix, color, cfn) => {
    if (phaseRef.current !== 'playing' && phaseRef.current !== 'done') return 0;
    const j = computeJug(type);
    const earn = Math.round(BASE[type] * j.mult);
    coinsRef.current += earn; setCoins(coinsRef.current);
    if (cfn) cfn();
    setMsgColor(color); setMsg(prefix + ' +' + earn.toLocaleString() + j.label);
    return earn;
  };

  const startEffect = () => {
    if (lockFreezeRef.current == null) lockFreezeRef.current = Date.now();   // 凍結開始(実時間)。多重呼び出しでも最初の時刻を保持
    setLocked(true); lockedRef.current = true; resetLamp(); setMsg('');
  };
  const unlockAt = (ms) => T(() => {
    // 凍結終了: ロック中に経過した実時間ぶんだけ開始時刻を後ろへずらす(タブ非表示中の離脱時間も含む)
    if (lockFreezeRef.current != null) {
      if (startTimeRef.current) startTimeRef.current += Date.now() - lockFreezeRef.current;
      lockFreezeRef.current = null;
    }
    lockedRef.current = false; setLocked(false); resetLamp();
    setBigMsg(''); setDim(0); setTint('none'); setCrackLv(0); setSinPlus(false);
    barLockRef.current = 0;
    reelSpinRef.current = 0; reelSlowRef.current = false; reelPoolRef.current = SPINPOOL;
    reelReset(); rayOn(false);
    hideCutin(); hideMovie();   // アセット: 演出終了時の保険(未使用なら何も変わらない)
    // パーティクル残留の防止: 演出終了時に無条件で掃除(全演出でパーティクルは解除の1秒以上前に消滅済み=実測)。
    // バックグラウンドやオクルージョンでRAFがスロットリングされ凍結フレームが残るケースの根治(2026-08-25)
    if (pRafRef.current) { cancelAnimationFrame(pRafRef.current); pRafRef.current = null; }
    psRef.current = []; pSweep();
    setReels(rnd3());
  }, ms);

  // --- 演出シーケンス（派手さ: ガセ < 黄7 < 紫7 < GOD < 冥王 < クラッシュ/レアSIN） ---
  const seqPurple = (t0, type, cfg) => {
    const c = cfg || {}, pay = c.pay != null ? c.pay : 1200;
    T(() => {
      lampTypeRef.current = 'purple'; lampStartRef.current = null; setLampSubText('PURPLE 7');
      setTint('radial-gradient(circle at 50% 45%, rgba(165,60,255,0.4) 0%, rgba(70,0,140,0.55) 70%)');
      sndThunder(0.9); sndPurpleRun(); vib([30, 40, 80]); flash(0.6, 110, '#c07bff'); shakeFor(520);
      if (!c.noReels) reelDark(true);          // P5: 消灯
      boltFlash();                             // P5: 稲妻SVG
      showCutin('cutinPurple', pay);           // アセット: 紫7カットイン(未ロードなら何もしない)
    }, t0);
    T(() => reelRelight('purple', 70), t0 + 90);   // P5: 左から1本ずつ再点灯
    if (!c.noReels) landStagger(['p7', 'p7', 'p7'], t0 + 180, 180, false, 'rgba(190,110,255,0.5)');
    T(() => { setLampMainText('紫7'); setLampMainSize('min(24vw,96px)'); flash(0.45, 80, '#c07bff'); }, t0 + Math.round(pay * 0.55));
    T(() => award(type, '⚡ 紫7揃い', '#c48bff', () => setPurpleC(v => v + 1)), t0 + pay);
  };
  const lockStage = (n) => { barLockRef.current = n; sndLock(n); vib(8 + n * 6); };
  const seqMeio = (t0, type, cfg) => {
    const c = cfg || {}, pay = c.pay != null ? c.pay : 2600;
    const pre = c.noIntro ? 0 : MEIO_PRE;   // P6: ロック1→700ms→ロック2→ロック3→暗転→冥王降臨
    if (!c.noIntro) {
      T(() => { lockStage(1); setDim(0.34); }, t0);
      T(() => { lockStage(2); setDim(0.52); shakeFor(220); }, t0 + 700);
      T(() => { lockStage(3); setDim(0.72); shakeFor(320); }, t0 + 1400);
      T(() => { barLockRef.current = 0; setDim(0.92); sndMeioRumble(); shakeFor(2400); spinReels(SPINPOOL); reelDark(true); }, t0 + pre);
      T(() => { lampTypeRef.current = 'meio'; lampStartRef.current = null; setLampSubText('HADES'); setDim(0.16); setTint('radial-gradient(circle at 50% 45%, rgba(60,150,255,0.35) 0%, rgba(20,0,70,0.6) 70%)'); reelRelight('meio', 120); showCutin('cutinMeio', Math.max(0, pay - 700)); }, t0 + pre + 700);   // アセット: 冥王カットイン(降臨時)
      landStagger(['meio', 'meio', 'meio'], t0 + pre + 900, 200, false, 'rgba(150,220,255,0.5)');
    } else {
      T(() => { lampTypeRef.current = 'meio'; lampStartRef.current = null; setLampSubText('HADES'); setDim(0.16); setTint('radial-gradient(circle at 50% 45%, rgba(60,150,255,0.35) 0%, rgba(20,0,70,0.6) 70%)'); sndMeioRumble(); shakeFor(1600); reelRelight('meio', 90); showCutin('cutinMeio', pay); }, t0);   // アセット: 冥王カットイン(クラッシュ経由の降臨時)
    }
    T(() => { setLampMainText('冥王'); setLampMainSize('min(26vw,104px)'); sndMeioBell(); vib([30, 40, 80]); flash(0.6, 150, '#9fdcff'); shakeFor(900); }, t0 + pre + Math.round(pay * 0.58));
    T(() => award(type, '☠ 冥王 降臨', '#8fd8ff', () => setMeioC(v => v + 1)), t0 + pre + pay);
  };
  const seqGod = (t0, type, amazing, cfg) => {
    const c = cfg || {}, rise = c.rise != null ? c.rise : 1100, pay = c.pay != null ? c.pay : 3200;
    if (!c.noCrt) T(() => { crtStartRef.current = performance.now(); crtActiveRef.current = true; setCrtActive(true); sndPuchun(); }, t0);
    T(() => reelDark(true), t0);                                                    // P5: 消灯
    // P3-①②: 地鳴り0.8秒 → 完全静寂0.3秒 → ③ゴングと同時にオルガン進行
    if (rise >= 1100) T(() => gaPlay('godRumble', 1.0), t0 + rise - 1100);
    if (rise >= 400) T(() => { setReelGlow(2, 'rgba(255,215,0,0.5)'); sndTenpai(); }, t0 + rise - 320);   // 第3リール枠グロー(テンパイ相当)
    T(() => {
      crtActiveRef.current = false; setCrtActive(false); flash(0.75, 110, '#fff');
      setReelGlow(2, null); reelRelight('god', 110); rayOn(true);                    // P5: 再点灯 + 回転レイ盤
      lampTypeRef.current = amazing ? 'amazing' : 'god'; lampStartRef.current = null;
      setLampMainText('GOD'); setLampMainSize('min(30vw,126px)'); setLampSubText(amazing ? 'AMAZING GRACE' : 'JACKPOT');
      reelSpinRef.current = 0; setReels(['god', 'god', 'god']);
      setTint('radial-gradient(circle at 50% 45%, rgba(255,200,40,0.28) 0%, rgba(60,40,0,0.5) 75%)');
      shakeFor(1400); sndGodGong(); vib([0, 60, 50, 60, 50, 60, 250]); pBurst('coins');   // P7: 金コイン雨+金粉
      showCutin('cutinGod', Math.max(0, pay - rise));   // アセット: GODカットイン(降臨時)
      armMovie();                                       // アセット: 初回GOD揃いで動画のプリロードを開始
      // P3-③: amazing時はアメイジンググレイスが主役(G調)なのでニ長調ファンファーレは重ねない
      if (amazing) { playAmazingGrace(); setBigMsgColor('#ffe98a'); setBigMsg('AMAZING GOD!'); playMovie(); }
      else gaGodFanfare();
    }, t0 + rise);
    T(() => flash(0.42, 80, '#ffd700'), t0 + rise + Math.round((pay - rise) * 0.35));
    T(() => flash(0.42, 80, '#ffd700'), t0 + rise + Math.round((pay - rise) * 0.7));
    T(() => { sndGodCoins(); award(type, '👑 GOD', '#ffd700', () => setGodC(v => v + 1)); }, t0 + pay);
  };

  // --- 第5次(2026-08-25): 1/65536 のプレミア2種。AG級の映画的シーケンス ---
  // 冥界の門が軋みながら開く音(低音のうねり+ノイズ+オルガンの持続)
  const sndHadesGate = () => {
    synth(1.4, (s, ch) => (((Math.random() * 2 - 1) * 0.2 * Math.exp(-s * 2.0)) + Math.sin(2 * Math.PI * (38 + 34 * Math.exp(-s * 1.4)) * s) * 0.6 * Math.exp(-s * 1.1)) * (ch === 0 ? 0.55 : 0.5), 0.5);
    [55, 65.41, 82.41].forEach(f => gaOrgan(f, 0, 2.2, 0.085));
  };
  // 短調(Dm)の鐘進行 D4→F4→A4→D5。倍音2.76倍を薄く重ねて鐘らしく
  const sndHadesToll = () => {
    [[293.66, 0], [349.23, 0.45], [440, 0.9], [587.33, 1.35]].forEach(k => {
      jTone(k[0], k[1], 1.6, 0.11); jTone(k[0] * 2, k[1], 0.9, 0.045); jTone(k[0] * 2.76, k[1], 0.6, 0.028);
    });
    gaOrgan(73.42, 0, 2.6, 0.09);
  };
  // 紫電の嵐の唸り(ノイズのスウェル)
  const sndVioletStorm = () => synth(1.6, (s, ch) => { const env = Math.min(1, s / 1.2); return ((Math.random() * 2 - 1) * 0.3 * env + Math.sin(2 * Math.PI * (70 + 90 * env) * s) * 0.22 * env) * (ch === 0 ? 0.5 : 0.46); }, 0.38);
  // 至近距離の落雷(鋭いクラック+急降下)
  const sndVioletBolt = () => {
    synth(0.5, (s) => ((Math.random() * 2 - 1) * Math.exp(-s * 9) * 0.7 + Math.sin(2 * Math.PI * (2200 * Math.exp(-s * 10) + 80) * s) * 0.4 * Math.exp(-s * 6)) * 0.9, 0.55);
    jTone(1760, 0, 0.22, 0.09, 'square');
  };
  // 急速上昇アルペジオ(D→F#→A→D→F#→A→D)+ 金のきらめき
  const sndVioletArp = () => {
    [293.66, 369.99, 440, 587.33, 739.99, 880, 1174.66].forEach((f, i) => jTone(f, i * 0.055, 0.32, 0.1, 'triangle'));
    [1174.66, 1479.98, 1760].forEach((f, i) => jTone(f, 0.42 + i * 0.05, 0.5, 0.07));
    gaOrgan(146.83, 0, 1.5, 0.095); gaSaw(293.66, 0.05, 1.1, 0.04);
  };

  // 冥王プレミア「HADES REQUIEM」: 冥界の扉が開き冥王が完全降臨する(青×白)
  const doHadesPremium = () => {
    startEffect();
    const F = FRZ;   // レバーONフリーズ(完全無音・無反応)
    // ① 地鳴りとともに徐々に暗転 → ロック段階4つ
    T(() => {
      lampTypeRef.current = 'meio'; lampStartRef.current = null; setLampSubText('...');
      setDim(0.28); spinReels(SPINPOOL); sndMeioRumble(); shakeFor(1500);
      armMovie('movieHades');   // 降臨ムービーのプリロード開始(未配置なら黙って眠る)
    }, F);
    T(() => { lockStage(1); setDim(0.44); }, F + 500);
    T(() => { lockStage(2); setDim(0.58); shakeFor(300); }, F + 1100);
    T(() => { lockStage(3); setDim(0.74); shakeFor(400); }, F + 1700);
    T(() => { lockStage(4); setDim(0.88); shakeFor(500); sndMeioRumble(); }, F + 2300);
    // ② 完全暗転(静寂)
    T(() => { barLockRef.current = 0; lampOff(); setDim(1); setTint('none'); reelSpinRef.current = 0; reelDark(true); }, F + 2900);
    // ③ 青白い閃光 + 冥界の門 + 冥王カットイン
    T(() => {
      lampTypeRef.current = 'meio'; lampStartRef.current = null; setLampSubText('HADES REQUIEM');
      setDim(0.14); setTint('radial-gradient(circle at 50% 45%, rgba(60,150,255,0.4) 0%, rgba(10,0,60,0.68) 70%)');
      flash(1.0, 180, '#cfeaff'); shakeFor(1000); sndHadesGate(); vib([30, 40, 80]);
      showCutin('cutinMeio', 2600);
    }, F + 3400);
    // ④ 全回転(ゆっくり回る溜め 約2.2秒)
    T(() => { reelSlowRef.current = true; spinReels(ALLPOOL); reelDark(false); sndAllSpin(); }, F + 3900);
    T(() => { reelSlowRef.current = false; }, F + 6100);
    landStagger(['meio', 'meio', 'meio'], F + 6150, 300, false, 'rgba(150,220,255,0.5)');
    // ⑤ 冥王完全降臨: 再点灯 + 鐘の連打
    T(() => { reelRelight('meio', 120); rayOn(true); flash(0.6, 150, '#9fdcff'); }, F + 6800);
    T(() => {
      setLampMainText('冥王'); setLampMainSize('min(26vw,104px)');
      sndHadesToll(); vib([30, 40, 80]); flash(0.75, 170, '#cfeaff'); shakeFor(1100); pBurst('spark');
      playMovie('movieHades');   // ムービーがreadyなら全画面再生(なければ現行演出のみ)
    }, F + 7000);
    T(() => flash(0.5, 110, '#9fdcff'), F + 7600);
    T(() => { sndMeioBell(); flash(0.55, 120, '#cfeaff'); pBurst('spark'); }, F + 8200);
    T(() => { setBigMsgColor('#9fdcff'); setBigMsg('HADES REQUIEM'); flash(0.5, 110, '#fff'); }, F + 8600);
    T(() => {
      award('hades', '☠ 冥王プレミア', '#8fd8ff', () => setMeioC(v => v + 1));
      unlockAt(1600 + (mvReady('movieHades') ? 7000 : 0));   // 鐘の残響まで+ムービー再生中(8秒級)はその終端まで覆う
    }, F + 9200);
  };

  // 紫7プレミア「VIOLET TEMPEST」: 紫電の嵐・雷(紫×金)
  const doVioletPremium = () => {
    startEffect();
    const F = FRZ;
    // ① 紫の明滅と雷鳴が近づく
    T(() => {
      lampTypeRef.current = 'purple'; lampStartRef.current = null; setLampSubText('...');
      setDim(0.34); spinReels(SPINPOOL); sndVioletStorm(); shakeFor(1300);
      setTint('radial-gradient(circle at 50% 45%, rgba(140,50,230,0.28) 0%, rgba(30,0,70,0.55) 72%)');
      armMovie('movieViolet');   // 降臨ムービーのプリロード開始(未配置なら黙って眠る)
    }, F);
    T(() => { boltFlash(); flash(0.5, 90, '#c07bff'); sndThunder(0.7); }, F + 300);
    T(() => { setDim(0.5); boltFlash(); flash(0.55, 90, '#e0a0ff'); sndThunder(0.85); }, F + 900);
    T(() => { setDim(0.68); boltFlash(); flash(0.6, 100, '#c07bff'); sndThunder(1.0); shakeFor(500); }, F + 1500);
    // ② 一瞬の暗転
    T(() => { lampOff(); setDim(0.96); setTint('none'); reelSpinRef.current = 0; reelDark(true); }, F + 2100);
    // ③ 直撃の落雷 + 紫カットイン
    T(() => {
      lampTypeRef.current = 'purple'; lampStartRef.current = null; setLampSubText('VIOLET TEMPEST');
      setDim(0.12); setTint('radial-gradient(circle at 50% 45%, rgba(200,110,255,0.42) 0%, rgba(50,0,110,0.62) 72%)');
      boltFlash(); flash(0.95, 170, '#d9a6ff'); sndVioletBolt(); vib([30, 40, 80]); shakeFor(900);
      showCutin('cutinPurple', 2400);
    }, F + 2600);
    // ④ 全回転(約2.2秒)
    T(() => { reelSlowRef.current = true; spinReels(ALLPOOL); reelDark(false); sndAllSpin(); }, F + 3100);
    T(() => { reelSlowRef.current = false; }, F + 5300);
    landStagger(['p7', 'p7', 'p7'], F + 5350, 300, false, 'rgba(190,110,255,0.5)');
    // ⑤ 紫金の火花
    T(() => { reelRelight('purple', 110); rayOn(true); boltFlash(); flash(0.6, 140, '#c07bff'); }, F + 6000);
    T(() => {
      setLampMainText('紫7'); setLampMainSize('min(26vw,104px)');
      sndVioletArp(); pBurst('spark'); vib([30, 40, 80]); flash(0.72, 160, '#e8c8ff'); shakeFor(1000);
      playMovie('movieViolet');   // ムービーがreadyなら全画面再生(なければ現行演出のみ)
    }, F + 6300);
    T(() => { boltFlash(); flash(0.5, 100, '#ffd76a'); }, F + 6900);
    T(() => { pBurst('spark'); flash(0.55, 110, '#c07bff'); sndThunder(0.9); }, F + 7400);
    T(() => { setBigMsgColor('#d9a6ff'); setBigMsg('VIOLET TEMPEST'); }, F + 7800);
    T(() => {
      award('violet', '⚡ 紫7プレミア', '#c48bff', () => setPurpleC(v => v + 1));
      unlockAt(1000 + (mvReady('movieViolet') ? 7800 : 0));   // ムービー再生中(10秒級)はその終端まで覆う
    }, F + 8400);
  };

  const doGase = () => {
    startEffect();
    // P6: 30%で「ロック1止まり」(ガコッ→1点灯→消灯。何も起きない)。期待度の谷を作る
    if (Math.random() < 0.3) {
      lockStage(1); setDim(0.3); shakeFor(180);
      T(() => { barLockRef.current = 0; setDim(0); setReels(rnd3()); setMsgColor('#6b6b6b'); setMsg('…なんでもなかった'); }, 700);
      unlockAt(1000);
      return;
    }
    spinReels(SPINPOOL);
    lampTypeRef.current = 'gase'; setLampSubText('ZAWA...'); setDim(0.32); shakeFor(760); sndZawa();
    T(() => setDim(0.58), 620);
    T(() => { reelSpinRef.current = 0; setReels(rnd3()); sndReelStop(); setDim(0); setMsgColor('#6b6b6b'); setMsg('…なんでもなかった'); }, 900);
    unlockAt(1200);
  };

  const doY7 = (win) => {
    startEffect();
    const late = win && Math.random() < 0.2;   // P6: 黄7当選の20%は遅れ告知(全停止→400ms無音→点灯+当たり)
    spinReels(SPINPOOL);
    lampTypeRef.current = 'y7'; setLampSubText('CUT IN'); sndCutin(); flash(0.5, 90, '#ffd24a'); shakeFor(340);
    landStagger(['y7', 'y7', 'y7'], 420, 150);
    const y7Win = () => {
      lampTypeRef.current = 'y7win'; lampStartRef.current = null;
      setLampMainText('V'); setLampMainSize('min(28vw,112px)'); setLampSubText('GET');
      setTint('radial-gradient(circle at 50% 45%, rgba(255,200,60,0.28) 0%, rgba(50,35,0,0.45) 75%)');
      sndVWin(); vib([30, 40, 80]); flash(0.75, 110, '#fff'); shakeFor(420);
      award('y7', '★ 中段黄7', '#ffd24a', () => setY7C(v => v + 1));
    };
    if (late) {
      T(() => { lampOff(); setLampSubText(''); }, 1000);   // リール全停止 → 400ms無音
      T(y7Win, 1400);
      unlockAt(1950);
      return;
    }
    T(() => { lampTypeRef.current = 'y7hold'; lampStartRef.current = null; setLampMainText('V ?'); setLampMainSize('min(18vw,72px)'); setLampSubText('CHANCE'); }, 950);
    [1050, 1400, 1700].forEach(t => T(sndHeart, t));
    T(() => {
      if (win) y7Win();
      else {
        lampOff(); setLampMainText(''); setDim(0.55); sndSinFade();
        setMsgColor('#6b6b6b'); setMsg('…ガセ');
        T(() => setDim(0), 400);
      }
    }, 1950);
    unlockAt(2500);
  };

  const doCrash = (type, amazing) => {
    startEffect();
    // P6: 頭に FRZ ミリ秒のレバーONフリーズ(完全無音・無反応。リールも始動しない)を挿入
    T(() => {
      lampTypeRef.current = 'crash'; setLampSubText('CRASH');
      sndCrack(); setCrackLv(1); vib([30, 40, 80]); flash(0.7, 120, '#fff'); shakeFor(1000); spinReels(SPINPOOL);
    }, FRZ);
    T(() => { setCrackLv(2); sndCrack(); flash(0.5, 90, '#fff'); }, FRZ + 260);
    T(() => { setCrackLv(3); sndGlass(); pBurst('glass'); }, FRZ + 520);   // P7: ガラス破片30(中央から放射)
    T(() => { setCrackLv(4); flash(0.9, 140, '#fff'); shakeFor(400); }, FRZ + 900);
    // ブラックアウト
    T(() => { lampOff(); setCrackLv(0); setDim(1); setLampMainText(''); reelSpinRef.current = 0; setTint('none'); reelDark(true); }, FRZ + 1150);
    // 全回転(ゆっくり回る溜め 約2秒)
    T(() => {
      setDim(0.12); lampTypeRef.current = 'allspin'; lampStartRef.current = null; setLampSubText('ALL SPIN');
      reelSlowRef.current = true; spinReels(ALLPOOL); sndAllSpin(); reelDark(false);
    }, FRZ + 1600);
    const sym = type === 'cgod' ? 'god' : type === 'cmeio' ? 'meio' : 'p7';
    T(() => { reelSlowRef.current = false; }, FRZ + 3550);
    landStagger([sym, sym, sym], FRZ + 3600, 250, false, type === 'cgod' ? 'rgba(255,215,0,0.55)' : type === 'cmeio' ? 'rgba(150,220,255,0.5)' : 'rgba(190,110,255,0.5)');
    // 対応する揃い演出へ接続(6秒ロック内に収める圧縮版)
    if (type === 'cgod') seqGod(FRZ + 4100, 'cgod', amazing, { noCrt: true, rise: 0, pay: 900 });
    else if (type === 'cmeio') seqMeio(FRZ + 4100, 'cmeio', { noIntro: true, pay: 700 });
    else seqPurple(FRZ + 4100, 'cpurple', { noReels: true, pay: 600 });
    T(() => setCrashC(v => v + 1), FRZ + 4200);
    const mext = (type === 'cgod' && amazing) ? 10200 : 0;   // アメイジング=AG音楽12.1秒+動画10秒を両方収める延長(タイマー停止中=収支不変)
    unlockAt(FRZ + 6000 + mext);
  };

  const doSin = (win) => {
    startEffect();
    lampTypeRef.current = 'sin'; setLampSubText('...'); setDim(0.45); reelSpinRef.current = 0;
    landStagger(['r7', 'r7', 'god'], 200, 230, true);
    T(() => { setSinPlus(true); jTone(880, 0, 0.12, 0.05); }, 950);
    // 2秒の完全静寂
    T(() => { lampOff(); setDim(0.8); }, 1100);
    T(() => {
      if (win) {
        lampTypeRef.current = 'sinwin'; lampStartRef.current = null; setDim(0); setSinPlus(false);
        setLampMainText('SIN'); setLampMainSize('min(28vw,116px)'); setLampSubText('JACKPOT');
        setTint('radial-gradient(circle at 50% 45%, rgba(255,215,0,0.35) 0%, rgba(140,40,255,0.5) 55%, rgba(20,0,40,0.7) 100%)');
        flash(1.0, 170, '#fff'); shakeFor(1300); sndSinBoom(); vib([30, 40, 80]); pBurst('spark');   // P7: 紫金の火花80
        showCutin('cutinSin', 1700);   // アセット: レアSINカットイン(爆発時・unlockAt(5000)の内側)
        T(() => flash(0.55, 90, '#e0a0ff'), 260);
        T(() => flash(0.5, 90, '#ffd700'), 520);
        const earn = award('sin', '💥 SIN JACKPOT', '#ffcf3a', () => setSinC(v => v + 1));
        setBigMsgColor('#ffd76a'); setBigMsg('+' + earn.toLocaleString());
      } else {
        lampTypeRef.current = 'sinlose'; lampStartRef.current = null;
        setDim(0.6); setSinPlus(false); sndSinFade();
        setLampMainText(''); setMsgColor('#6b6b6b'); setMsg('…SIN');
        T(() => setDim(0.25), 800);
        T(() => { lampOff(); setDim(0); }, 1500);
      }
    }, 3100);
    unlockAt(5000);
  };

  const doSpin = (pointerId) => {
    if (lockedRef.current || phaseRef.current !== 'playing') return;
    // 連打ガード: pointerId単位のスロットルのみ。同じ指は20ms未満を無視(2026-08-25竹森氏指示で10→20ms。窓内回数上限は撤廃のまま)
    const now = performance.now();
    const pid = (pointerId === undefined || pointerId === null) ? 'm' : pointerId;
    const g = tapGuardRef.current;
    if (now - (g.lastByPointer.get(pid) || 0) < 20) return;
    g.lastByPointer.set(pid, now);
    if (g.lastByPointer.size > 32) { g.lastByPointer.forEach((t, k) => { if (now - t > 1000) g.lastByPointer.delete(k); }); }
    gameNRef.current++; setGameN(gameNRef.current);
    spinCountRef.current++; setSpinCount(spinCountRef.current);
    godGapRef.current++;
    coinsRef.current -= 1; setCoins(coinsRef.current);
    setMsg('');
    if (spinCountRef.current > 100 && jugRenRef.current > 0) { jugRenRef.current = 0; setJugRen(0); }
    // 1タップ = Math.random() 1回。排他レンジで判定
    const u = Math.random() * RU;
    let acc = 0, flag = null;
    for (const f of FLAGS) { acc += f[1]; if (u < acc) { flag = f[0]; break; } }
    // P6: GOD/クラッシュはレバーONフリーズ(タップ音もバイブも出さない=完全無音・無反応)
    const frz = (flag === 'god' || flag === 'amazing' || flag === 'hades' || flag === 'violet' || IS_CRASH[flag]) ? FRZ : 0;
    if (!frz) { sndTap(); vib(8); }
    if (!flag) { setReels(rnd3()); return; }
    if (flag === 'y7') { doY7(Math.random() < 0.75); return; }
    if (flag === 'sin') { doSin(Math.random() < 0.5); return; }
    // アメイジング・グレイスは独立フラグ(1/32768)。旧「GOD100G以内連チャン」条件は2026-08-25廃止
    if (flag === 'god' || flag === 'cgod') { godCountRef.current++; godGapRef.current = 0; }
    if (flag === 'amazing') { startEffect(); seqGod(frz, 'amazing', true, null); unlockAt(5000 + frz + 8200); return; }   // アメイジング=AG音楽12.1秒+動画10秒を両方収める延長
    if (flag === 'hades') { doHadesPremium(); return; }     // 第5次: 冥王プレミア 1/65536
    if (flag === 'violet') { doVioletPremium(); return; }   // 第5次: 紫7プレミア 1/65536
    if (flag === 'god') { startEffect(); seqGod(frz, 'god', false, null); unlockAt(5000 + frz); return; }
    if (flag === 'meio') { startEffect(); seqMeio(0, 'meio', null); unlockAt(4500 + MEIO_PRE); return; }
    if (flag === 'purple') { startEffect(); spinReels(SPINPOOL); seqPurple(0, 'purple', null); unlockAt(2500); return; }
    doCrash(flag, false);
  };

  const startGame = () => {
    gaWarmup(); // 重量バッファ・IRの事前生成(既に開始済みなら何もしない)
    setPhase("playing"); phaseRef.current = 'playing';
    setGameN(0); setTimeLeft(TOTAL); setCoins(0);
    setGodC(0); setMeioC(0); setPurpleC(0); setY7C(0); setCrashC(0); setSinC(0);
    setMsg(''); setBigMsg(''); setLocked(false); lockedRef.current = false;
    coinsRef.current = 0; gameNRef.current = 0; tapGuardRef.current = { lastByPointer: new Map(), recent: [] };
    spinCountRef.current = 0; setSpinCount(0);
    setHistory([]); jugRenRef.current = 0; setJugRen(0); setLastMult(1);
    godGapRef.current = 0; godCountRef.current = 0;
    lockFreezeRef.current = null; cutinOnRef.current = false; setCutinOn(false);
    startTimeRef.current = Date.now(); timeLeftRef.current = TOTAL; lastTsRef.current = null;
    reelSpinRef.current = 0; reelSlowRef.current = false; reelPoolRef.current = SPINPOOL;
    setReels(rnd3()); setDim(0); setTint('none'); setCrackLv(0); setSinPlus(false);
    barLockRef.current = 0; psRef.current = [];
    resetLamp();
    bgm.stop();
  };

  useEffect(() => {
    aliveRef.current = true;
    gaWarmup();       // ready画面表示中に重量バッファ・IRを作っておく(playing中の一括生成を避ける)
    ensureSprites();  // P7: パーティクルのスプライトも起動時に1回だけ描いておく
    gaPreloadAssets();                              // アセット: 画像の非同期プリロード(無ければ黙って無効のまま)
    if (vidRef.current) vidRef.current.muted = true;  // 一部ブラウザは muted 属性だけでは効かないため実体にも設定
    const offAsset = gaOnAsset(() => {
      if (!aliveRef.current) return;
      // 図柄画像が後から来ても次フレームで差し替わるよう、コマのキャッシュを無効化する
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < RCELLS; j++) { const c = cellRef.current[i][j]; if (c) c.h = null; }
      }
      setAssetTick(t => t + 1);
    });
    // 裏に回るとRAFが止まり、回転ループ音だけが鳴り続けてしまうので明示的に落とす(復帰後はRAFが鳴らし直す)
    const onHide = () => { if (document.hidden) gaSpinLoopStop(); };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      aliveRef.current = false;
      document.removeEventListener('visibilitychange', onHide);
      gaSpinLoopStop();      // アンマウント: 回転ループ音を確実に解放
      gaStopScheduled();     // アンマウント: 予約済みの勝利音・ファンファーレ等が鳴り続けるのを止める
      offAsset(); hideMovie();
      timeoutsRef.current.forEach(clearTimeout); timeoutsRef.current = [];
      if (lampRef.current) cancelAnimationFrame(lampRef.current);
      if (pRafRef.current) { cancelAnimationFrame(pRafRef.current); pRafRef.current = null; }
      psRef.current = [];
    };
  }, []);
  useEffect(() => { if (phase === "done") { onScore(coinsRef.current); const t = setTimeout(onClose, 3000); return () => clearTimeout(t); } }, [phase]);

  const ls = lsRef.current;
  const totalC = godC + meioC + purpleC + y7C + sinC;
  // アセット: 筐体パーツ(未ロードなら null = 現行のSVG/CSSがそのまま残る)
  const bezelOn = gaAssetLoaded('bezel');
  const bezelSty = bezelOn ? {
    borderWidth: GA_ASSETS.bezel.width, borderStyle: 'solid', borderColor: 'transparent', borderRadius: 0,
    borderImageSource: `url("${gaAssetSrc('bezel')}")`,
    borderImageSlice: gaAssetSlice('bezel', GA_ASSETS.bezel.slice),
    borderImageRepeat: 'stretch',
  } : null;
  const pedimentOn = gaAssetLoaded('pediment');
  const basestripOn = gaAssetLoaded('basestrip');
  const panelOn = gaAssetLoaded('panel');

  return (
    <div className="gaDesktopZoom" ref={zoomFitRef} style={{
      textAlign: 'center', minHeight: '60vh', borderRadius: 12, padding: 0, position: 'relative', overflow: 'hidden',
      background: 'radial-gradient(ellipse 90% 34% at 50% -4%, rgba(90,60,140,0.5), transparent 70%),radial-gradient(ellipse 60% 26% at 18% 108%, rgba(180,120,20,0.16), transparent 70%),radial-gradient(ellipse 60% 26% at 82% 108%, rgba(180,120,20,0.16), transparent 70%),linear-gradient(180deg,#0d0a18 0%,#070510 46%,#0e0a14 100%)',
    }}>
      <GaDefs />
      <GaMeterStyles />
      {/* アセット: 背景画像(ロード済みの時だけ現CSSグラデの上に低不透明度で敷く・最下層) */}
      {gaAssetLoaded('bg') && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          backgroundImage: 'url("' + gaAssetSrc('bg') + '")', backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: GA_ASSETS.bg.opacity }} />
      )}
      <div key="gaSg" ref={sgRef} style={{ position: 'absolute', inset: 0, background: ls.sg || 'none', pointerEvents: 'none', zIndex: 0 }} />
      {/* 火の粉(常設・transform/opacityのみ) */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden' }}>
        {[[8, 10, 5, 0], [26, 6, 4, 1.8], [63, 9, 4, 3.4], [81, 13, 6, 5.2], [45, 4, 3, 7]].map((p, i) => (
          <div key={i} className="gaEmb" style={{ position: 'absolute', left: p[0] + '%', bottom: p[1] + '%', width: p[2], height: p[2], borderRadius: '50%', background: i % 2 ? '#ffd84d' : '#ffb84d', boxShadow: '0 0 7px #ff9a1f', opacity: 0, animationDelay: p[3] + 's' }} />
        ))}
      </div>
      {/* 常設ビネット(静的radial 1枚) */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 82% 64% at 50% 44%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.5) 100%)', pointerEvents: 'none', zIndex: 43 }} />
      {/* 稲妻SVG(紫7・1G連。opacityのみアニメ) */}
      <svg key="gaBolt" ref={boltRef} viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, pointerEvents: 'none', zIndex: 46, transition: 'opacity 0.08s linear' }}>
        <polyline points="18,0 31,26 21,31 37,58 27,63 45,100" fill="none" stroke="#efe0ff" strokeWidth="2.4" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <polyline points="83,0 70,23 80,29 63,55 73,60 56,100" fill="none" stroke="#d3a8ff" strokeWidth="1.6" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      {/* P7: パーティクルcanvas 1枚(非演出時は display:none + RAF停止)。refが外れても掃除できるようclassNameで特定可能にする(2026-08-25残留バグ対策) */}
      <canvas key="gaPcv" className="gaPcv" ref={cvRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 47, display: 'none' }} />
      {tint !== 'none' && <div style={{ position: 'absolute', inset: 0, background: tint, pointerEvents: 'none', zIndex: 2 }} />}
      {dim > 0 && <div style={{ position: 'absolute', inset: 0, background: '#000', opacity: dim, pointerEvents: 'none', zIndex: 45, transition: 'opacity 0.25s linear' }} />}
      {flashAlpha > 0 && <div style={{ position: 'absolute', inset: 0, background: flashColor, opacity: flashAlpha, pointerEvents: 'none', zIndex: 50 }} />}
      {crackLv > 0 && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 52, pointerEvents: 'none' }}>
          {CRACKS.slice(0, crackLv * 3).map((c, i) => (
            <div key={i} style={{ position: 'absolute', left: c.l + '%', top: c.t + '%', width: c.w + '%', height: 2,
              background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.95),rgba(190,225,255,0.6),transparent)',
              transform: `rotate(${c.r}deg)`, transformOrigin: 'left center', boxShadow: '0 0 8px rgba(255,255,255,0.85)' }} />
          ))}
        </div>
      )}
      {crtActive && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000', pointerEvents: 'none' }}>
          <div ref={crtBarRef} style={{ position: 'absolute', left: 0, right: 0, height: '100%', top: '0%', background: '#fff' }} />
          {/* P8: 色収差(赤/シアンを1pxずらした半透明バー) */}
          <div ref={crtBarRRef} style={{ position: 'absolute', left: -1, right: 1, height: '100%', top: '0%', background: '#ff2b2b', opacity: 0.45, mixBlendMode: 'screen', display: 'none' }} />
          <div ref={crtBarCRef} style={{ position: 'absolute', left: 1, right: -1, height: '100%', top: '0%', background: '#2bffff', opacity: 0.45, mixBlendMode: 'screen', display: 'none' }} />
          {/* P8: 走査線(静的 repeating-linear-gradient) */}
          <div ref={crtScanRef} style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(180deg,rgba(0,0,0,0) 0 2px,rgba(0,0,0,0.55) 2px 4px)', opacity: 0.75, pointerEvents: 'none' }} />
          <div ref={crtLineRef} style={{ position: 'absolute', height: 2, top: '50%', transform: 'translateY(-50%)', left: '0%', right: '0%', background: '#fff', boxShadow: '0 0 20px #fff', opacity: 1, display: 'none' }} />
          <div ref={crtDotRef} style={{ position: 'absolute', width: 6, height: 6, borderRadius: '50%', background: '#fff', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', opacity: 1, boxShadow: '0 0 12px #fff', display: 'none' }} />
        </div>
      )}

      {phase === "ready" && (
        <div style={{ padding: '40px 20px' }}>
          {/* アセット: ロゴ画像があれば置換。無ければ現行のテキストタイトルのまま(altも同文) */}
          {gaAssetLoaded('logo') ? (
            <img src={gaAssetSrc('logo')} alt="⚡ ゴッドアナザー"
              style={{ display: 'block', width: GA_ASSETS.logo.maxWidth, height: 'auto', margin: '0 auto 12px' }} />
          ) : (
            <div style={{ fontSize: 28, fontWeight: 900, color: '#ffd24a', fontFamily: "'Courier New',monospace", marginBottom: 12, letterSpacing: 2, textShadow: '0 0 14px rgba(255,210,74,0.6)' }}>⚡ ゴッドアナザー</div>
          )}
          <p style={{ fontSize: 11, opacity: 0.6, margin: '12px 0', lineHeight: 1.9, color: '#a89660' }}>
            画面タップでレバーON！<br/>GOD・冥王・紫7を狙え！<br/>100回転以内の連チャンで倍率アップ！<br/>1000超の大ハマリはハマリプレミアで倍率アップ！<br/>演出の間は時間が止まります<br/>制限時間: 3分
          </p>
          <button className="btn bp" onClick={startGame} style={{ background: 'linear-gradient(135deg, #8a6a00, #d4a017)' }}>START</button>
        </div>
      )}

      {(phase === "playing" || phase === "done") && (
        <>
          {phase === "playing" && <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 40, touchAction: 'none', overscrollBehavior: 'none' }}
            onPointerDown={e => { e.preventDefault(); doSpin(e.pointerId); }}
            onTouchMove={e => { /* React18はtouch系をpassive登録するためpreventDefaultは無効(警告が出るだけ)。スクロール抑止は touchAction:'none' が担当 */ }}
            onTouchStart={e => { }} />}

          <div style={{ background: '#08070a', borderBottom: '1px solid #2a2210', padding: '4px 8px 5px', position: 'relative', zIndex: 41, pointerEvents: 'none' }}>
            {/* P10: 上部ランプ帯(プリブラーgradient・opacity切替のみ) */}
            <div style={{ display: 'flex', gap: 5, justifyContent: 'center', alignItems: 'center', height: 14, marginBottom: 2 }}>
              {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
                <div key={i} ref={cbRef.current.bar[i]} style={{ width: 14, height: 14, borderRadius: '50%', background: 'none', opacity: 0 }} />
              ))}
            </div>
            {/* 主計器: 当たり間(主役)+ GAME/TIME/COIN。金の装飾罫と角飾りで「計器盤」に見せる */}
            {/* 計器盤: panel.webp がロードできたら青銅+金メアンダー帯の9スライス枠、無ければ従来のCSS+SVG角飾り */}
            <div className="ga-panel" style={{ padding: panelOn ? '8px 14px 9px' : '6px 11px 7px', marginBottom: 4,
              ...(panelOn ? { borderImage: `url(${gaAssetSrc('panel')}) 60 fill / 8px stretch`, borderWidth: 8, borderStyle: 'solid' } : {}) }}>
              {!panelOn && <GaCorners size={12} inset={2} />}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ textAlign: 'left' }}>
                  <div className="ga-mlbl" style={{ fontSize: 8, marginBottom: 3, lineHeight: 1 }}>当たり間</div>
                  <div className="ga-mnum" style={{ fontSize: 42, lineHeight: 0.9, ...gaMV(spinCount >= 500 ? GA_MC.red : spinCount >= 200 ? GA_MC.amber : GA_MC.gold) }}>{spinCount}</div>
                  {spinCount >= 1000 && (
                    <div className="ga-mlbl" style={{ fontSize: 8.5, marginTop: 3, lineHeight: 1, color: '#ff6b8a', textShadow: '0 0 6px rgba(255,60,110,0.7)' }}>
                      ハマリプレミア ×{(1 + 0.2 * Math.floor((spinCount - 900) / 100)).toFixed(1)}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 11, alignItems: 'flex-end' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div className="ga-mlbl" style={{ fontSize: 7.5, lineHeight: 1 }}>GAME</div>
                    <div className="ga-mnum" style={{ fontSize: 18, lineHeight: 1.15, ...gaMV(GA_MC.gold) }}>{gameN}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="ga-mlbl" style={{ fontSize: 7.5, lineHeight: 1 }}>TIME</div>
                    <div className="ga-mnum" style={{ fontSize: 18, lineHeight: 1.15, ...gaMV(locked ? GA_MC.ice : timeLeft <= 10 ? GA_MC.red : GA_MC.gold) }}>{fmtT(timeLeft)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="ga-mlbl" style={{ fontSize: 7.5, lineHeight: 1 }}>COIN</div>
                    <div className="ga-mnum" style={{ fontSize: 18, lineHeight: 1.15, ...gaMV(coins < 0 ? GA_MC.loss : GA_MC.coin) }}>{coins.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              {[
                { label: 'GOD', val: godC, prob: fmtP(gameN, godC), mc: ['#ffe14a', '#8a6a00', 'rgba(255,215,0,.45)'] },
                { label: '冥王', val: meioC, prob: fmtP(gameN, meioC), mc: ['#a8e2ff', '#2b6f96', 'rgba(143,216,255,.42)'] },
                { label: '紫7', val: purpleC, prob: fmtP(gameN, purpleC), mc: ['#d3a5ff', '#5f3596', 'rgba(196,139,255,.42)'] },
                { label: '合算', val: totalC, prob: fmtP(gameN, totalC), mc: ['#ffc266', '#8a5410', 'rgba(255,179,71,.42)'] },
              ].map(s => (
                <div key={s.label} className="ga-panel" style={{ flex: 1, padding: '5px 2px 4px', textAlign: 'center', ...gaMV(s.mc) }}>
                  <GaCorners size={8} inset={1} color={s.mc[0]} op={0.4} />
                  <div className="ga-mlbl" style={{ fontSize: 9.5, marginBottom: 2, lineHeight: 1 }}>{s.label}</div>
                  <div className="ga-mnum" style={{ fontSize: 22, lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: 9, fontFamily: "'Orbitron','Courier New',monospace", fontWeight: 600, marginTop: 2, color: s.mc[0], opacity: 0.5 }}>{s.prob}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, padding: '6px 2px 8px', pointerEvents: 'none' }}>
            <div style={{ position: 'relative', width: '99%', maxWidth: 432, padding: '30px 24px 16px', boxSizing: 'border-box' }}>
            {/* 筐体: 神殿フレーム(ペディメント+溝彫り柱+金の台座) */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
              {/* 上帯: pediment.webp がロードできたら画像、無ければ従来のSVG破風+メダリオン */}
              {pedimentOn ? (
                <img src={gaAssetSrc('pediment')} alt="" aria-hidden="true"
                  style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: 'auto', display: 'block' }} />
              ) : (
                <React.Fragment>
                  <svg viewBox="0 0 420 44" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: 30, display: 'block' }}>
                    <path d="M4 30 L210 2 L416 30 L416 42 L4 42 Z" fill="url(#ga-fgold)" stroke="#513c08" strokeWidth="2" />
                    <path d="M46 30 L210 9 L374 30 Z" fill="#181226" stroke="#7a5c10" strokeWidth="1.5" />
                  </svg>
                  <svg viewBox="0 0 40 40" style={{ position: 'absolute', left: '50%', top: 5, width: 20, height: 20, marginLeft: -10 }}>
                    <circle cx="20" cy="20" r="12" fill="url(#ga-fgold)" stroke="#513c08" strokeWidth="1.5" />
                    <circle cx="20" cy="20" r="5.5" fill="#2a2010" />
                    <circle cx="20" cy="20" r="2" fill="#ffd84d" />
                  </svg>
                </React.Fragment>
              )}
              {[0, 1].map(k => (
                <div key={k} style={{ position: 'absolute', left: k ? 'auto' : 0, right: k ? 0 : 'auto', top: 30, bottom: 14, width: 20 }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,#241c30,#4a3a5e 50%,#1a1424)', border: '1px solid #6b5510' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg,transparent 0 4px,rgba(190,150,60,0.34) 4px 5px,transparent 5px 9px)' }} />
                  <div style={{ position: 'absolute', left: -3, right: -3, top: -8, height: 9, background: 'linear-gradient(180deg,#f7e08a,#b8860b 55%,#7a5506)', border: '1px solid #513c08' }} />
                  <div style={{ position: 'absolute', left: -3, right: -3, bottom: -4, height: 8, background: 'linear-gradient(180deg,#d4a017,#7a5506)', border: '1px solid #513c08' }} />
                </div>
              ))}
              {/* 下帯: basestrip.webp がロードできたら画像、無ければ従来のCSS台座 */}
              {basestripOn ? (
                <img src={gaAssetSrc('basestrip')} alt="" aria-hidden="true"
                  style={{ position: 'absolute', left: 0, bottom: 0, width: '100%', height: 'auto', display: 'block' }} />
              ) : (
                <React.Fragment>
                  <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 12, background: 'linear-gradient(180deg,#f7e08a,#b8860b 42%,#7a5506 58%,#d4a017)', border: '1px solid #513c08', borderRadius: 2 }} />
                  <div style={{ position: 'absolute', left: '9%', right: '9%', bottom: 1, height: 5, background: '#2a2010', borderRadius: 2 }} />
                </React.Fragment>
              )}
            </div>
            {/* 枠の発光: プリブラー済みradial-gradient + opacity変調(box-shadowの毎フレーム書換えを廃止) */}
            <div ref={frameGlowRef} style={{ position: 'absolute', inset: -16, borderRadius: 34, background: ls.fg || 'none', opacity: ls.fgo || 0, pointerEvents: 'none', zIndex: 0 }} />
            <div ref={frameRef} style={{ width: '100%', aspectRatio: '16/10', borderRadius: 20, position: 'relative', zIndex: 1,
              background: ls.bg || 'radial-gradient(circle at 50% 45%, #14110a 0%, #050406 70%)',
              border: `3px solid ${ls.border || 'rgba(255,215,0,0.18)'}`, overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'inset 0 0 30px rgba(0,0,0,0.9)',
              animation: shaking ? 'shake 0.15s linear infinite' : 'none',
              ...(bezelSty || {}) }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: bezelSty ? 0 : 20, boxShadow: 'inset 0 0 30px rgba(0,0,0,0.85)', pointerEvents: 'none', zIndex: 5 }} />
              <div ref={glowRef} style={{ position: 'absolute', inset: 0, background: ls.glow || 'none', pointerEvents: 'none', zIndex: 1 }} />
              {/* P5: 回転レイ盤(conic-gradient 2枚・逆回転。GOD/amazing中のみ表示) */}
              <div ref={rayRef} className="gaRayWrap" style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden' }}>
                <div className="gaRay gaRayA" style={{ position: 'absolute', left: '50%', top: '50%', width: '190%', aspectRatio: '1/1', marginLeft: '-95%', marginTop: '-95%', borderRadius: '50%', mixBlendMode: 'screen', background: 'repeating-conic-gradient(rgba(255,215,0,0.20) 0deg 6deg, rgba(255,215,0,0) 6deg 26deg)' }} />
                <div className="gaRay gaRayB" style={{ position: 'absolute', left: '50%', top: '50%', width: '150%', aspectRatio: '1/1', marginLeft: '-75%', marginTop: '-75%', borderRadius: '50%', mixBlendMode: 'screen', background: 'repeating-conic-gradient(rgba(255,255,255,0.13) 0deg 4deg, rgba(255,255,255,0) 4deg 34deg)' }} />
              </div>
              {/* 3リール(縦ストリップ・SVG図柄) */}
              <div style={{ display: 'flex', gap: '3%', alignItems: 'center', justifyContent: 'center', width: '86%', zIndex: 2, position: 'relative' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ flex: 1, aspectRatio: '3/4', position: 'relative' }}>
                    {/* テンパイ時のリール枠グロー(窓のoverflow外に置く) */}
                    <div ref={cbRef.current.glow[i]} style={{ position: 'absolute', inset: -7, borderRadius: 16, background: 'radial-gradient(ellipse at 50% 50%,rgba(255,210,74,0.5),transparent 76%)', opacity: 0, transition: 'opacity 0.2s linear', zIndex: 0, pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', inset: 0, borderRadius: 10, overflow: 'hidden', zIndex: 1,
                      background: 'linear-gradient(180deg,#131117,#050406 55%,#0f0d13)',
                      border: '2px solid rgba(255,215,0,0.25)', boxShadow: 'inset 0 0 18px rgba(0,0,0,0.9)' }}>
                      {/* バックライト(消灯→再点灯用) */}
                      <div ref={cbRef.current.back[i]} style={{ position: 'absolute', inset: 0, background: 'none', opacity: 0, transition: 'opacity 0.22s linear', pointerEvents: 'none', zIndex: 0 }} />
                      {/* 当たり図柄の後光 */}
                      <div ref={cbRef.current.halo[i]} style={{ position: 'absolute', inset: 0, background: 'none', opacity: 0, transition: 'opacity 0.3s ease', zIndex: 1, pointerEvents: 'none' }} />
                      <div ref={cbRef.current.strip[i]} className="gaStrip" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '100%', willChange: 'transform', zIndex: 2 }}>
                        {[0, 1, 2, 3].map(j => (
                          <svg key={j} ref={cbRef.current.cell[i][j]} viewBox="0 0 120 130" preserveAspectRatio="xMidYMid meet"
                            style={{ position: 'absolute', left: '6%', width: '88%', height: '100%', top: (j === 3 ? -100 : j * 100) + '%' }}>
                            {/* SVG図柄(既定)。画像がロードできた図柄だけ下の画像層に切り替わる */}
                            <g className="gaCsvg">
                              <g className="gaGh"><use href="#ga-s-bell" y="-34" /><use href="#ga-s-bell" y="34" /></g>
                              <use href="#ga-s-bell" />
                            </g>
                            {/* 画像図柄(黒背景を screen で透過扱い)。href は paintReel が入れる */}
                            <g className="gaCimg" style={{ display: 'none' }}>
                              <g className="gaGh">
                                <image x="0" y="-29" width="120" height="120" preserveAspectRatio="xMidYMid meet" style={{ mixBlendMode: 'screen' }} />
                                <image x="0" y="39" width="120" height="120" preserveAspectRatio="xMidYMid meet" style={{ mixBlendMode: 'screen' }} />
                              </g>
                              <image x="0" y="5" width="120" height="120" preserveAspectRatio="xMidYMid meet" style={{ mixBlendMode: 'screen' }} />
                            </g>
                          </svg>
                        ))}
                      </div>
                      {/* リール窓の円筒感(上下の暗いグラデ) */}
                      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '26%', background: 'linear-gradient(180deg,rgba(0,0,0,0.88),transparent)', zIndex: 3, pointerEvents: 'none' }} />
                      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '26%', background: 'linear-gradient(0deg,rgba(0,0,0,0.88),transparent)', zIndex: 3, pointerEvents: 'none' }} />
                      {/* 消灯オーバーレイ */}
                      <div ref={cbRef.current.dark[i]} style={{ position: 'absolute', inset: 0, background: '#000', opacity: 0, transition: 'opacity 0.18s linear', zIndex: 4, pointerEvents: 'none' }} />
                    </div>
                  </div>
                ))}
              </div>
              {/* アセット: カットイン層(リール窓の上・全幅。画像が無い間は opacity 0 のまま何も描かない) */}
              <div key="gaCutin" ref={cutinRef} style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none', opacity: 0,
                backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
                transition: 'opacity 300ms linear' }} />
              {sinPlus && <div style={{ position: 'absolute', right: '8%', top: '14%', fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.55)', zIndex: 6, fontFamily: "'Courier New',monospace" }}>+1</div>}
              {lampMainText && (
                /* カットイン画像の表示中は主文字を伏せる(重なり回避)。カットイン終了で戻る */
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6, pointerEvents: 'none',
                  opacity: cutinOn ? 0 : 1, transition: 'opacity 200ms linear' }}>
                  <span ref={mainTxtRef} style={{ fontSize: lampMainSize, fontWeight: 900, letterSpacing: '0.08em', fontStyle: 'italic', lineHeight: 1,
                    color: ls.textColor || '#ffd700', textShadow: ls.textShadow || 'none' }}>{lampMainText}</span>
                </div>
              )}
              {bigMsg && (
                <div style={{ position: 'absolute', bottom: '14%', left: 0, right: 0, zIndex: 7, pointerEvents: 'none' }}>
                  <span style={{ fontSize: 'min(6.5vw,26px)', fontWeight: 900, letterSpacing: 2, color: bigMsgColor,
                    textShadow: '0 0 12px rgba(255,215,0,0.9), 0 0 30px rgba(255,255,255,0.5)' }}>{bigMsg}</span>
                </div>
              )}
              <div ref={subTxtRef} style={{ position: 'absolute', bottom: 'min(2.2vw,10px)', width: '100%', fontSize: 'min(3vw,12px)',
                color: ls.subColor || 'rgba(255,215,0,0.18)', zIndex: 4, letterSpacing: 5, fontWeight: 700, textShadow: ls.subShadow || 'none' }}>{lampSubText}</div>
              <div ref={ringRef} style={{ position: 'absolute', inset: -5, borderRadius: 25, border: `2px solid ${ls.ringBorder || 'transparent'}`, pointerEvents: 'none', zIndex: 8 }} />
            </div>
            </div>
          </div>

          {jugRen >= 2 && (
            <div style={{ textAlign: 'center', pointerEvents: 'none', position: 'relative', zIndex: 41, marginBottom: 2 }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#ffb347', letterSpacing: 2, textShadow: '0 0 8px rgba(255,179,71,0.6)' }}>
                🔥 連チャン {jugRen} ×{lastMult.toFixed(1)}
              </span>
            </div>
          )}

          {history.length > 0 && (
            <div style={{ padding: '2px 8px', pointerEvents: 'none', position: 'relative', zIndex: 41 }}>
              {[0, 10, 20].map(rowStart => {
                const row = history.slice(rowStart, rowStart + 10);
                if (row.length === 0) return null;
                return (
                  <div key={rowStart} style={{ display: 'flex', gap: 2, justifyContent: 'center', marginBottom: 2 }}>
                    {row.map((h, i) => {
                      const ht = HTYPE[h.type] || HTYPE.y7;
                      return (
                        <div key={rowStart + i} style={{ fontSize: 9, padding: '2px 4px', borderRadius: 4, fontFamily: "'Courier New',monospace", fontWeight: 800, position: 'relative',
                          background: h.is1G ? 'linear-gradient(135deg, rgba(255,107,107,0.25), rgba(255,209,61,0.25), rgba(107,255,107,0.25), rgba(107,197,255,0.25), rgba(208,107,255,0.25))' : ht.bg,
                          color: h.is1G ? '#fff' : ht.c,
                          textShadow: h.is1G ? '0 0 6px rgba(255,215,0,0.8)' : 'none',
                          border: `1px solid ${h.is1G ? 'rgba(255,215,0,0.5)' : ht.bd}` }}>
                          {ht.t}{h.at}
                          {IS_CRASH[h.type] && <span style={{ color: '#fff' }}>💥</span>}
                          {h.is1G && <span style={{ color: '#ffee00' }}>⚡</span>}
                          {h.jugRen >= 2 && (
                            <span style={{ position: 'absolute', top: -5, right: -4, fontSize: 7, fontWeight: 900, color: '#fff',
                              background: h.is1G ? 'linear-gradient(135deg, #ff6b6b, #ffd93d, #6bff6b, #6bc5ff, #d06bff)' : 'rgba(255,179,71,0.85)',
                              borderRadius: 4, padding: '0 2px', lineHeight: 1.3, textShadow: '0 0 4px rgba(0,0,0,0.5)' }}>×{h.jugRen}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ padding: '4px 12px', textAlign: 'center', pointerEvents: 'none', position: 'relative', zIndex: 41 }}>
            <div style={{ fontSize: 14, fontWeight: 700, minHeight: 18, marginBottom: 4, color: msgColor, letterSpacing: 1 }}>{msg}</div>
            {phase === "playing" && <div style={{ fontSize: 9, color: '#5a4d2a', marginBottom: 4 }}>{locked ? '演出中（時間ストップ）' : 'どこでもタップでレバーON'}</div>}
          </div>

          {phase === "done" && (
            <div style={{ margin: '4px 12px', padding: '8px 10px', background: 'rgba(10,9,14,0.95)', border: '1px solid #241d10', borderRadius: 8, textAlign: 'left', pointerEvents: 'none', position: 'relative', zIndex: 41 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2, textAlign: 'center', color: '#ffd700', letterSpacing: 2 }}>★ RESULT ★</div>
              <div style={{ fontSize: 11, color: '#8a8070', lineHeight: 1.8 }}>
                回転数：<b style={{ color: '#ddd' }}>{gameN}G</b><br/>
                GOD：<b style={{ color: '#ddd' }}>{godC}回</b>（{fmtP(gameN, godC)}） ／ 冥王：<b style={{ color: '#ddd' }}>{meioC}回</b>（{fmtP(gameN, meioC)}）<br/>
                紫7：<b style={{ color: '#ddd' }}>{purpleC}回</b>（{fmtP(gameN, purpleC)}） ／ 中段黄7：<b style={{ color: '#ddd' }}>{y7C}回</b><br/>
                クラッシュ：<b style={{ color: '#ddd' }}>{crashC}回</b> ／ レアSIN：<b style={{ color: '#ddd' }}>{sinC}回</b><br/>
                獲得コイン：<b style={{ color: '#ddd' }}>{coins.toLocaleString()}枚</b>
              </div>
            </div>
          )}
        </>
      )}

      {/* アセット: GOD降臨ムービー。preload="none" のまま眠り、初回GOD揃いで load()・アメイジングGOD時のみ全画面再生 */}
      <video key="gaMovie" ref={vidRef} src={gaAssetSrc('movie')} muted playsInline preload="none"
        onCanPlayThrough={() => { vidSt(vidKeyRef.current).ready = true; }}
        onError={() => { vidSt(vidKeyRef.current).failed = true; hideMovie(); }}
        onEnded={hideMovie}
        style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', objectFit: 'contain',
          background: '#000', zIndex: 9998, display: 'none', pointerEvents: 'none' }} />

      <style>{`@keyframes shake{0%,100%{transform:translate(0)}10%{transform:translate(-4px,3px)}30%{transform:translate(4px,-3px)}50%{transform:translate(-3px,4px)}70%{transform:translate(3px,-2px)}90%{transform:translate(-2px,3px)}}
/* PC: レイアウト幅は448px固定(親の480px制約を解放して潰れ防止)。倍率はJSが画面サイズから実測算出してジャストフィットさせる */
@media (min-width: 1000px) and (pointer: fine) {
  .G:has(.gaDesktopZoom) { max-width: none; }
  .gaDesktopZoom { width: 448px; margin: 0 auto; }
}
.gaStrip{opacity:1;transition:opacity .18s linear}
.gaStrip.gaSpin{opacity:.72}
.gaGh{opacity:0;transition:opacity .18s linear}
.gaSpin .gaGh{opacity:.26}
@keyframes gaRotA{to{transform:rotate(360deg)}}
@keyframes gaRotB{to{transform:rotate(-360deg)}}
.gaRayWrap{opacity:0;transition:opacity .35s linear}
.gaRayWrap.gaRayOn{opacity:1}
.gaRay{animation-play-state:paused}
.gaRayWrap.gaRayOn .gaRay{animation-play-state:running}
.gaRayA{animation:gaRotA 15s linear infinite}
.gaRayB{animation:gaRotB 23s linear infinite}
@keyframes gaEmb{0%{transform:translate3d(0,0,0);opacity:0}18%{opacity:.75}100%{transform:translate3d(10px,-120px,0);opacity:0}}
.gaEmb{animation:gaEmb 9s ease-out infinite}`}</style>
    </div>
  );
}
