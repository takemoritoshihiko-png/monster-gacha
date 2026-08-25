// ============================================================
// ============================================================
// BATTING HERO GAME (70 seconds timing batting game)
// ============================================================
function BattingGame({ onScore, onClose }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const partsRef = useRef([]);
  const rafRef = useRef(null);
  const [phase, setPhase] = useState("ready");
  const [score, setScore] = useState(0);
  // 予約スプライト: assets/games/bat-pitch-f1〜f3.webp(投手振りかぶり→リリース)+bat-swing-f1〜f4.webp(打者構え→スイング)+bat-stadium.webp(球場背景)
  // 画像未配置の間は*Loadedがfalseのまま→現行の手描きprimitive人形・背景にフォールバック
  const bImgRef = useRef({
    pitch: [], pitchLoaded: false,
    swing: [], swingLoaded: false,
    stadium: null, stadiumLoaded: false,
  });

  const W = 340, H = 480, TOTAL = 70;
  const PX = W / 2;
  const BAT_X = W / 2 - 50;
  const BAT_Y = H - 94;
  const HIT_Y = BAT_Y - 22;
  const HW_P = 13, HW_G = 28, HW_OK = 50;

  const BALLS = [
    { nm: '普通', col: '#aaccff', spd: 260, vr: 30, acc: 0, w: 0.20, pts: 29 },
    { nm: '速い', col: '#ffffff', spd: 380, vr: 40, acc: 0, w: 0.25, pts: 45 },
    { nm: '超速い', col: '#ffcc44', spd: 520, vr: 50, acc: 0, w: 0.20, pts: 62 },
    { nm: 'マッハ', col: '#ff5533', spd: 700, vr: 60, acc: 0, w: 0.15, pts: 85 },
    { nm: '加速球', col: '#ff44ff', spd: 150, vr: 20, acc: 400, w: 0.20, pts: 74 },
  ];
  const pickBall = () => { const tot = BALLS.reduce((s, b) => s + b.w, 0); let r = Math.random() * tot; for (const b of BALLS) { r -= b.w; if (r <= 0) return b; } return BALLS[1]; };
  const comboMult = (c) => c >= 5 ? 1.5 : c >= 4 ? 1.4 : c >= 3 ? 1.2 : c >= 2 ? 1.1 : 1.0;

  const initGame = () => ({
    t: TOTAL, coins: 0, over: false,
    phase: 0, timer: 1.8,
    bx: PX, by: -20, bvy: 0, bacc: 0, brot: 0, brotS: 0,
    bCol: '#fff', bNm: '', bPts: 0, bAlive: false, trail: [],
    swinging: false, swingT: 0, swingAng: 0,
    hitFlash: 0, hitCol: '#fff',
    combo: 0, maxCombo: 0,
    pitches: 0, perfects: 0, greats: 0, goods: 0, misses: 0,
    floats: [], floatId: 0,
    flash: { col: '', a: 0 },
  });

  const launch = (G) => {
    const b = pickBall();
    G.bx = PX; G.by = 70;
    G.bvy = b.spd + Math.random() * b.vr;
    G.bacc = b.acc;
    G.brot = 0; G.brotS = (Math.random() - 0.5) * 10;
    G.bCol = b.col; G.bNm = b.nm; G.bPts = b.pts;
    G.bAlive = true; G.trail = [];
    G.phase = 2; G.pitches++;
  };

  const doSwing = () => {
    const G = gameRef.current;
    if (!G || G.over) return;
    if (G.swinging) return;
    G.swinging = true; G.swingT = 0;

    if (G.phase !== 2 || !G.bAlive) {
      playNote(140, 0.2, 'sawtooth', 0.1);
      G.floats.push({ id: ++G.floatId, x: 60, y: HIT_Y - 50, v: '早すぎ!', life: 0.9, vy: -30, col: '#ff8844' });
      return;
    }

    const dist = Math.abs(G.by - HIT_Y);
    let judge;
    if (dist <= HW_P) judge = { nm: 'PERFECT', col: '#ffd700', sm: 2.0 };
    else if (dist <= HW_G) judge = { nm: 'GREAT', col: '#44ffaa', sm: 1.4 };
    else if (dist <= HW_OK) judge = { nm: 'GOOD', col: '#66aaff', sm: 0.8 };
    else judge = { nm: 'MISS', col: '#ff4444', sm: 0 };

    if (judge.nm === 'MISS') {
      G.combo = 0; G.misses++;
      playNote(140, 0.2, 'sawtooth', 0.1);
      G.bAlive = false; G.phase = 3; G.timer = 0.8;
      G.floats.push({ id: ++G.floatId, x: 60, y: HIT_Y - 50, v: '💨 空振り！', life: 1.1, vy: -30, col: judge.col });
      return;
    }

    if (judge.nm === 'PERFECT') G.perfects++;
    else if (judge.nm === 'GREAT') G.greats++;
    else { G.goods++; G.combo = 0; }

    if (judge.nm === 'PERFECT' || judge.nm === 'GREAT') {
      G.combo++; if (G.combo > G.maxCombo) G.maxCombo = G.combo;
      if (G.combo >= 2) { const fs = [262, 294, 330, 349, 392, 440, 494, 523]; playNote(fs[Math.min(G.combo - 1, 7)] * 2, 0.12, 'sine', 0.15); }
    }

    const mult = comboMult(G.combo) * judge.sm;
    const earned = Math.round(G.bPts * mult);
    G.coins += earned;

    // Hit sound
    if (judge.nm === 'PERFECT') { playNote(523, 0.08, 'sine', 0.2); playNote(784, 0.12, 'sine', 0.15, 0.06); playNote(1047, 0.18, 'sine', 0.12, 0.14); playNoise(0.07, 0.4); }
    else if (judge.nm === 'GREAT') { playNote(440, 0.1, 'sine', 0.18); playNoise(0.06, 0.3); }
    else { playNote(330, 0.1, 'sine', 0.12); playNoise(0.05, 0.2); }

    G.hitFlash = 1.0; G.hitCol = judge.col;
    G.flash = { col: judge.col, a: judge.nm === 'PERFECT' ? 0.35 : 0.2 };
    G.bvy = -(300 + Math.random() * 180); G.bacc = 0;
    G.bx += 160 + Math.random() * 140;
    G.phase = 3; G.timer = 1.0;

    // Particles
    const pn = judge.nm === 'PERFECT' ? 36 : judge.nm === 'GREAT' ? 22 : 12;
    for (let i = 0; i < pn; i++) {
      const a = Math.random() * Math.PI * 2, s = 5 + Math.random() * 9;
      const pc = judge.nm === 'PERFECT' ? ['#ffd700', '#fff', '#ffaa00'][i % 3] : judge.col;
      partsRef.current.push({ x: W / 2, y: HIT_Y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 4, life: 1, col: pc, r: 4 + Math.random() * 5, star: false });
    }
    if (judge.nm === 'PERFECT') {
      for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2;
        partsRef.current.push({ x: W / 2, y: HIT_Y, vx: Math.cos(a) * 13, vy: Math.sin(a) * 13 - 2, life: 1.3, col: '#ffd700', r: 5, star: true }); }
    }

    const cs = G.combo >= 2 ? ' ×' + comboMult(G.combo).toFixed(1) : '';
    const label = judge.nm === 'PERFECT' ? '★ PERFECT!! ★' : judge.nm === 'GREAT' ? '◆ GREAT! ◆' : '● GOOD';
    G.floats.push({ id: ++G.floatId, x: 60, y: HIT_Y - 60, v: label + ' +' + earned + cs, life: 1.6, vy: -30, col: judge.col });
  };

  const startGame = () => {
    gameRef.current = initGame();
    partsRef.current = [];
    setPhase("play"); setScore(0);
    bgm.playLoop(SHOOTING_BGM, 140);
  };

  // 初期化時1回だけプリロード(画像が無ければonerrorで握りつぶし、*Loadedはfalseのまま=フォールバック継続)
  useEffect(() => {
    const R = bImgRef.current;
    const PITCH_SRC = ['assets/games/bat-pitch-f1.webp', 'assets/games/bat-pitch-f2.webp', 'assets/games/bat-pitch-f3.webp'];
    let pLoaded = 0;
    PITCH_SRC.forEach((src, i) => {
      const img = new Image();
      img.onerror = () => {};
      img.onload = () => { R.pitch[i] = img; pLoaded++; if (pLoaded === PITCH_SRC.length) R.pitchLoaded = true; };
      img.src = src;
    });
    const SWING_SRC = ['assets/games/bat-swing-f1.webp', 'assets/games/bat-swing-f2.webp', 'assets/games/bat-swing-f3.webp', 'assets/games/bat-swing-f4.webp'];
    let sLoaded = 0;
    SWING_SRC.forEach((src, i) => {
      const img = new Image();
      img.onerror = () => {};
      img.onload = () => { R.swing[i] = img; sLoaded++; if (sLoaded === SWING_SRC.length) R.swingLoaded = true; };
      img.src = src;
    });
    const stImg = new Image();
    stImg.onerror = () => {};
    stImg.onload = () => { R.stadium = stImg; R.stadiumLoaded = true; };
    stImg.src = 'assets/games/bat-stadium.webp';
  }, []);

  useEffect(() => {
    if (phase !== "play") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let last = performance.now();

    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.04);
      last = now;
      const G = gameRef.current;
      if (!G || G.over) return;

      G.t -= dt;
      if (G.t <= 0) { G.t = 0; G.over = true; bgm.stop(); sfx('gameFinish'); setScore(Math.floor(G.coins)); setPhase("done"); return; }

      // Swing anim
      if (G.swinging) {
        G.swingT += dt;
        G.swingAng = -Math.sin(G.swingT / 0.13 * Math.PI) * 1.6;
        if (G.swingT >= 0.35) { G.swinging = false; G.swingAng = 0; }
      }
      if (G.hitFlash > 0) G.hitFlash = Math.max(0, G.hitFlash - dt * 4);
      if (G.flash.a > 0) G.flash.a = Math.max(0, G.flash.a - dt * 3);

      G.timer -= dt;
      if (G.phase === 0) { if (G.timer <= 0) { G.phase = 1; G.timer = 0.42; } }
      else if (G.phase === 1) { if (G.timer <= 0) launch(G); }
      else if (G.phase === 2) {
        if (G.bAlive) {
          G.bvy += G.bacc * dt; G.by += G.bvy * dt; G.brot += G.brotS * dt;
          G.trail.unshift({ x: G.bx, y: G.by, spd: G.bvy }); if (G.trail.length > 16) G.trail.pop();
          if (G.by > HIT_Y + HW_OK + 28) {
            G.combo = 0; G.misses++; playNote(140, 0.2, 'sawtooth', 0.1);
            G.bAlive = false; G.phase = 3; G.timer = 0.9; G.trail = [];
            G.floats.push({ id: ++G.floatId, x: 60, y: HIT_Y - 50, v: '⚾ 見逃し', life: 1.0, vy: -30, col: '#ffaa44' });
          }
        } else { G.phase = 3; G.timer = 0.5; }
      } else if (G.phase === 3) {
        if (G.bAlive) { G.by += G.bvy * dt; G.bvy += 600 * dt; G.bx += 200 * dt; G.brot += 8 * dt; if (G.by > H + 80 || G.bx > W + 80) G.bAlive = false; }
        if (G.timer <= 0) { G.bAlive = false; G.trail = []; G.phase = 0; G.timer = 1.6 + Math.random() * 0.5; }
      }

      G.floats.forEach(f => { f.y += f.vy * dt; f.life -= dt; });
      G.floats = G.floats.filter(f => f.life > 0);
      partsRef.current.forEach(p => { p.x += p.vx * dt * 60; p.y += p.vy * dt * 60; p.vy += 0.35; p.life -= dt * 1.8; p.r *= 0.94; });
      partsRef.current = partsRef.current.filter(p => p.life > 0);

      // Draw
      const BI = bImgRef.current;
      const fy = H * 0.2;
      if (BI.stadiumLoaded) {
        // bat-stadium.webp 1枚で背景全域(空/照明/スタンド/フィールド/マウンド)を差し替え
        ctx.drawImage(BI.stadium, 0, 0, W, H);
      } else {
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#0a1828'); sky.addColorStop(0.55, '#0f1e30'); sky.addColorStop(1, '#141e08');
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

        // Stadium lights
        [[36, 26], [W - 36, 26]].forEach(([lx, ly]) => {
          const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, 80);
          g.addColorStop(0, 'rgba(255,240,180,0.22)'); g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        });

        // Stands
        ctx.fillStyle = '#111e30'; ctx.fillRect(0, 0, W, H * 0.18);
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 20; col++) {
            const cx = col * (W / 19), cy = 15 + row * 16;
            const cols = ['#bb2233', '#1e44aa', '#229944', '#bb9922', '#774422'];
            ctx.fillStyle = cols[(row * 7 + col) % cols.length]; ctx.globalAlpha = 0.6;
            ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#e8b870'; ctx.beginPath(); ctx.arc(cx, cy - 5, 3, 0, Math.PI * 2); ctx.fill();
          }
        }
        ctx.globalAlpha = 1;

        // Field
        ctx.fillStyle = '#162808'; ctx.fillRect(0, fy, W, H - fy);
        for (let i = 0; i < 7; i++) { ctx.fillStyle = i % 2 === 0 ? '#1a3208' : '#142606'; ctx.fillRect(0, fy + i * ((H - fy) / 7), W, (H - fy) / 7); }
        ctx.fillStyle = '#6e4828'; ctx.beginPath(); ctx.ellipse(W / 2, H * 0.74, W * 0.38, H * 0.2, 0, 0, Math.PI * 2); ctx.fill();

        // Mound
        const mg = ctx.createRadialGradient(PX, H * 0.32, 0, PX, H * 0.32, 24);
        mg.addColorStop(0, '#8a6038'); mg.addColorStop(1, '#6e4828');
        ctx.fillStyle = mg; ctx.beginPath(); ctx.ellipse(PX, H * 0.32, 22, 11, 0, 0, Math.PI * 2); ctx.fill();
      }

      // Foul lines
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(W / 2, BAT_Y + 44); ctx.lineTo(22, fy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W / 2, BAT_Y + 44); ctx.lineTo(W - 22, fy); ctx.stroke();
      ctx.setLineDash([]);

      // Home plate
      ctx.fillStyle = '#fff'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 6;
      const hx = W / 2 + 8, hy = BAT_Y + 42;
      ctx.beginPath(); ctx.moveTo(hx, hy - 8); ctx.lineTo(hx + 11, hy - 2); ctx.lineTo(hx + 11, hy + 7); ctx.lineTo(hx - 11, hy + 7); ctx.lineTo(hx - 11, hy - 2); ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;

      // Scoreboard
      ctx.fillStyle = '#080f1c';
      ctx.beginPath(); ctx.rect(W / 2 - 60, 4, 120, 24); ctx.fill();
      ctx.strokeStyle = 'rgba(255,200,50,0.4)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.rect(W / 2 - 60, 4, 120, 24); ctx.stroke();
      const s = Math.ceil(G.t);
      ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'left';
      ctx.fillStyle = '#ffd700'; ctx.fillText('🪙 ' + Math.floor(G.coins), W / 2 - 54, 20);
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.textAlign = 'right';
      ctx.fillText(Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + s % 60, W / 2 + 54, 20);

      // Timer bar
      ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(14, 31, W - 28, 4);
      ctx.fillStyle = G.t < 15 ? '#f33' : G.t < 35 ? '#f93' : '#3af';
      ctx.fillRect(14, 31, (W - 28) * (G.t / TOTAL), 4);

      // Screen flash
      if (G.flash.a > 0) { ctx.save(); ctx.globalAlpha = G.flash.a * 0.28; ctx.fillStyle = G.flash.col; ctx.fillRect(0, 0, W, H); ctx.restore(); }

      // Hit zone
      ctx.save();
      ctx.globalAlpha = 0.07; ctx.fillStyle = '#66aaff'; ctx.fillRect(W / 2 - 50, HIT_Y - HW_OK, 100, HW_OK * 2);
      ctx.globalAlpha = 0.12; ctx.fillStyle = '#44ffaa'; ctx.fillRect(W / 2 - 45, HIT_Y - HW_G, 90, HW_G * 2);
      ctx.globalAlpha = 0.2; ctx.fillStyle = '#ffd700'; ctx.fillRect(W / 2 - 40, HIT_Y - HW_P, 80, HW_P * 2);
      ctx.restore();
      ctx.save(); ctx.strokeStyle = 'rgba(255,215,0,0.3)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(W / 2 - 40, HIT_Y); ctx.lineTo(W / 2 + 40, HIT_Y); ctx.stroke(); ctx.setLineDash([]); ctx.restore();

      // Pitcher
      const ppx = PX, ppy = H * 0.31;
      const winding = G.phase === 1;
      const armLift = winding ? Math.sin((1 - (G.timer / 0.42)) * Math.PI) * 0.8 : 0;
      ctx.save();
      if (BI.pitchLoaded) {
        // bat-pitch-f1(構え/phase0)→f2(振りかぶり前半/phase1進行度<0.55)→f3(リリース/phase1後半・投球中)を切替
        const windProgress = winding ? 1 - (G.timer / 0.42) : 0;
        const ppFrame = G.phase === 0 ? 0 : G.phase === 1 ? (windProgress < 0.55 ? 1 : 2) : 2;
        // 現行primitiveの外接ボックス(帽子上ppy-38〜靴下ppy+35, 幅約44)に合わせて配置
        ctx.drawImage(BI.pitch[ppFrame], ppx - 22, ppy - 38, 44, 76);
      } else {
        ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(ppx, ppy + 32, 16, 5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#163380'; ctx.lineWidth = 7; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(ppx - 3, ppy + 12); ctx.lineTo(ppx - 4, ppy + 30); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ppx + 3, ppy + 12); ctx.lineTo(ppx + 6, ppy + 30); ctx.stroke();
        ctx.fillStyle = '#0a0a0a'; ctx.fillRect(ppx - 9, ppy + 27, 10, 5); ctx.fillRect(ppx + 2, ppy + 27, 10, 5);
        ctx.fillStyle = '#d01a28'; ctx.fillRect(ppx - 11, ppy - 16, 22, 28);
        ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('21', ppx, ppy + 2);
        ctx.strokeStyle = '#e8a860'; ctx.lineWidth = 6; ctx.lineCap = 'round';
        const ax = ppx + 10 + Math.cos(armLift) * 5, ay = ppy - 8 - Math.sin(armLift) * 16;
        ctx.beginPath(); ctx.moveTo(ppx + 8, ppy - 8); ctx.lineTo(ax, ay); ctx.stroke();
        ctx.fillStyle = '#e8a860'; ctx.beginPath(); ctx.arc(ppx, ppy - 22, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#c01020'; ctx.beginPath(); ctx.arc(ppx, ppy - 27, 11, Math.PI * 1.05, Math.PI * 2.1); ctx.fill();
      }
      ctx.restore();

      // Ball trail + ball
      if (G.bAlive) {
        G.trail.forEach((t, i) => {
          const al = (1 - i / G.trail.length) * 0.38, r = 6 * (1 - i / G.trail.length) * 0.8;
          const spd = t.spd || 200;
          const tc = spd > 550 ? `rgba(255,90,30,${al})` : spd < 250 ? `rgba(100,170,255,${al})` : `rgba(255,240,180,${al})`;
          ctx.save(); ctx.fillStyle = tc; ctx.shadowColor = tc; ctx.shadowBlur = 4;
          ctx.beginPath(); ctx.arc(t.x, t.y, Math.max(0.5, r), 0, Math.PI * 2); ctx.fill(); ctx.restore();
        });
        ctx.save(); ctx.translate(G.bx, G.by); ctx.rotate(G.brot * 0.3);
        ctx.shadowColor = G.bCol; ctx.shadowBlur = G.bacc > 0 ? 24 : 12;
        const bg2 = ctx.createRadialGradient(-2, -2, 0, 0, 0, 9);
        bg2.addColorStop(0, '#ffffff'); bg2.addColorStop(0.6, '#f0f0ee'); bg2.addColorStop(1, '#ccccca');
        ctx.fillStyle = bg2; ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#bb2820'; ctx.lineWidth = 1.5; ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.arc(0, 0, 6, 0.3, Math.PI - 0.3); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 6, Math.PI + 0.3, Math.PI * 2 - 0.3); ctx.stroke();
        if (G.bCol !== '#ffffff') { ctx.globalAlpha = 0.32; ctx.fillStyle = G.bCol; ctx.shadowColor = G.bCol; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
        if (G.bNm !== '普通' && G.bNm !== '速い' && G.by < HIT_Y - 50) {
          ctx.save(); ctx.globalAlpha = 0.8; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = G.bCol; ctx.shadowColor = G.bCol; ctx.shadowBlur = 6; ctx.fillText(G.bNm, G.bx, G.by - 14); ctx.restore();
        }
      }

      // Batter
      const bx = BAT_X, by = BAT_Y;
      const ang = G.swinging ? G.swingAng : 0.15;
      ctx.save();
      if (BI.swingLoaded) {
        // bat-swing-f1(構え)→f2〜f4(スイング進行)をswingT(0〜0.35s)の進捗で切替。バット込みの1枚絵想定
        const swingProgress = G.swinging ? G.swingT / 0.35 : 0;
        const batFrame = !G.swinging ? 0 : swingProgress < 0.33 ? 1 : swingProgress < 0.66 ? 2 : 3;
        // 現行primitive+バットの外接ボックス(頭上by-44〜靴下by+40, バット先端まで含め幅56)に合わせて配置
        ctx.drawImage(BI.swing[batFrame], bx - 14, by - 46, 56, 92);
      } else {
        ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(bx + 13, by + 36, 18, 5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#1a3680'; ctx.lineWidth = 8; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(bx + 5, by + 14); ctx.lineTo(bx + 2, by + 34); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx + 15, by + 14); ctx.lineTo(bx + 18, by + 34); ctx.stroke();
        ctx.fillStyle = '#0a0a0a'; ctx.fillRect(bx - 3, by + 31, 11, 6); ctx.fillRect(bx + 12, by + 31, 11, 6);
        ctx.fillStyle = '#1e3ecc'; ctx.fillRect(bx, by - 18, 26, 32);
        ctx.fillStyle = 'rgba(255,255,255,0.88)'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('3', bx + 13, by - 1);
        ctx.fillStyle = '#e8a860'; ctx.beginPath(); ctx.arc(bx + 13, by - 27, 11, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#0f1144'; ctx.beginPath(); ctx.arc(bx + 13, by - 32, 12, Math.PI * 1.1, Math.PI * 2.2); ctx.fill();
        // Bat
        ctx.save(); ctx.translate(bx + 24, by - 12); ctx.rotate(ang);
        ctx.fillStyle = '#cc8030'; ctx.strokeStyle = '#553010'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(-3, 0); ctx.bezierCurveTo(-4, 16, -8, 36, -7, 52); ctx.bezierCurveTo(-5, 54, 5, 54, 7, 52); ctx.bezierCurveTo(8, 36, 4, 16, 3, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
      if (G.hitFlash > 0) { ctx.globalAlpha = G.hitFlash * 0.45; ctx.fillStyle = G.hitCol; ctx.shadowColor = G.hitCol; ctx.shadowBlur = 24; ctx.beginPath(); ctx.ellipse(bx + 13, by - 8, 32, 26, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();

      // NOW indicator
      if (G.phase === 2 && G.bAlive) {
        const d = HIT_Y - G.by;
        if (d > 0 && d < 150) {
          const al = Math.max(0, (1 - d / 150) * 0.95);
          ctx.save(); ctx.globalAlpha = al; ctx.fillStyle = '#ffd700'; ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 10;
          ctx.font = '900 18px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('NOW!', BAT_X + 72, HIT_Y + 6); ctx.restore();
        }
      }

      // Windup hint
      if (G.phase === 0 || G.phase === 1) {
        const blink = Math.sin(Date.now() * 0.005) > 0;
        if (blink) { ctx.save(); ctx.globalAlpha = 0.45; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#aabbff'; ctx.fillText('構えろ…', W / 2, H * 0.34 + 44); ctx.restore(); }
      }

      // Particles
      partsRef.current.forEach(p => {
        ctx.save(); ctx.globalAlpha = Math.max(0, p.life * 0.9); ctx.fillStyle = p.col; ctx.shadowColor = p.col; ctx.shadowBlur = p.star ? 14 : 6;
        ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.5, p.r), 0, Math.PI * 2); ctx.fill(); ctx.restore();
      });

      // Floats
      G.floats.forEach(f => {
        ctx.save(); ctx.globalAlpha = Math.min(1, f.life * 1.6);
        ctx.font = '900 12px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillStyle = f.col; ctx.strokeStyle = 'rgba(0,0,0,0.95)'; ctx.lineWidth = 2;
        ctx.strokeText(f.v, f.x, f.y); ctx.fillText(f.v, f.x, f.y);
        ctx.restore();
      });

      // Combo
      if (G.combo >= 2) {
        ctx.save(); ctx.textAlign = 'right'; ctx.font = '900 13px sans-serif';
        ctx.fillStyle = G.combo >= 8 ? '#ffd700' : G.combo >= 5 ? '#ff9900' : '#ffcc44';
        ctx.shadowColor = '#ff6600'; ctx.shadowBlur = 8;
        const ct = G.combo + ' COMBO ×' + comboMult(G.combo).toFixed(1);
        ctx.strokeStyle = 'rgba(0,0,0,0.9)'; ctx.lineWidth = 3;
        ctx.strokeText(ct, W - 8, 52); ctx.fillText(ct, W - 8, 52);
        ctx.restore();
      }

      setScore(Math.floor(G.coins));
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [phase]);

  useEffect(() => () => { bgm.stop(); if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);
  useEffect(() => { if (phase === "done") { onScore(score); const t = setTimeout(onClose, 2500); return () => clearTimeout(t); } }, [phase]);   // scoreを依存から外す(done後のscore変動でonScore二重発火するのを防止)

  return (
    <div style={{ textAlign: 'center' }}>
      <div className="st" style={{ justifyContent: 'center' }}>⚾ バッティングヒーロー</div>
      {phase === "ready" && (
        <>
          <p style={{ fontSize: 11, opacity: 0.5, margin: '12px 0', lineHeight: 1.8 }}>
            上からボールが落ちてくる！<br/>打者の位置でタイミングよく打て！<br/>緩急に惑わされるな！制限時間: 70秒
          </p>
          <button className="btn bp" onClick={startGame}>⚾ PLAY BALL!</button>
        </>
      )}
      {phase === "play" && (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 40, touchAction: 'none' }}
            onPointerDown={e => { e.preventDefault(); doSwing(); }} />
          <div style={{ position: 'relative', marginTop: 4, touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', zIndex: 41, pointerEvents: 'none' }}>
            <canvas ref={canvasRef} width={W} height={H}
              style={{ borderRadius: 14, border: '2px solid rgba(255,200,50,0.15)', touchAction: 'none', width: '100%', height: 'auto',
                boxShadow: '0 0 20px rgba(255,200,50,0.1)' }} />
          </div>
        </>
      )}
      {phase === "done" && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <div style={{ fontSize: 44, margin: '12px 0' }}>⚾</div>
          <p style={{ fontSize: 20, fontWeight: 900, color: '#fbbf24' }}>🪙 {score} コイン獲得！</p>
          <div style={{ fontSize: 11, opacity: 0.5, marginTop: 8 }}>
            PERFECT: {gameRef.current?.perfects || 0} / GREAT: {gameRef.current?.greats || 0} / 最大コンボ: {gameRef.current?.maxCombo || 0}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// COIN RUNNER GAME (90 seconds side-scrolling runner)
// ============================================================
function CoinRunnerGame({ onScore, onClose }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const rafRef = useRef(null);
  const [phase, setPhase] = useState("ready");
  const [score, setScore] = useState(0);
  const heldRef = useRef(false);
  // 予約スプライト: assets/games/run-hero-f1〜f4.webp(走り4コマ) + run-hero-jump.webp(ジャンプ) + 3層パララックス背景
  // 画像未配置の間は imgRef.current.*Loaded が false のまま→現行primitive描画にフォールバック
  const imgRef = useRef({
    heroRun: [], heroRunLoaded: false,
    heroJump: null, heroJumpLoaded: false,
    bgFar: null, bgFarLoaded: false,
    bgMid: null, bgMidLoaded: false,
    bgNear: null, bgNearLoaded: false,
  });

  const W = 340, H = 240, GY = H - 44, TOTAL = 80, START_TIME = 70;

  const ITEMS_DEF = [
    {e:'🪙',v:20,r:12,freq:1.0},{e:'💰',v:56,r:14,freq:0.35},{e:'💎',v:79,r:13,freq:0.10},
    {e:'⭐',v:35,r:12,freq:0.5},{e:'🍓',v:31,r:12,freq:0.7},{e:'🌟',v:79,r:15,freq:0.18},
    {e:'🎁',v:79,r:14,freq:0.12},{e:'🍬',v:15,r:10,freq:0.9},
    {e:'🕸️',v:0,r:13,freq:0.25,slow:true},{e:'🐌',v:0,r:12,freq:0.20,slow:true},
  ];
  const OBS_DEF = [
    {e:'🪨',hw:13,air:false},{e:'🌵',hw:12,air:false},{e:'⚡',hw:13,air:true},
    {e:'🦔',hw:12,air:false},{e:'🦇',hw:12,air:true},{e:'💀',hw:13,air:true},
  ];
  const pickF = (arr) => { const tot=arr.reduce((s,a)=>s+(a.freq||1),0); let r=Math.random()*tot; for(const a of arr){r-=(a.freq||1);if(r<=0)return a;} return arr[0]; };
  const comboMult = (c) => c>=8?1.5:c>=6?1.4:c>=3?1.2:1;

  const PLAYER_H = 20; // player height from ground
  const initGame = () => ({
    running:true, over:false, t:START_TIME, coins:0,
    px:50, py:GY-PLAYER_H, pvy:0, ground:true, jumps:0,
    invTimer:0, drainTimer:0, DRAIN_RATE:9, DRAIN_DUR:2.2,
    slowTimer:0, SLOW_DUR:2.5, speed:180,
    items:[], obs:[], combo:0, mult:1, cTimer:0, C_RESET:3.5,
    got:0, maxCombo:0, iTimer:0, oTimer:2.5, bgX:0,
    animT:0, animFrame:0, bgMidX:0, bgFarX:0,
    floats:[], floatId:0,
  });

  const startGame = () => {
    gameRef.current = initGame();
    heldRef.current = false;
    setPhase("play"); setScore(0);
    bgm.playLoop(BGM_TAP, 160);
  };

  // 初期化時1回だけプリロード(画像が無ければonerrorで握りつぶし、*Loadedはfalseのまま=フォールバック継続)
  useEffect(() => {
    const R = imgRef.current;
    const HERO_RUN_SRC = ['assets/games/run-hero-f1.webp', 'assets/games/run-hero-f2.webp', 'assets/games/run-hero-f3.webp', 'assets/games/run-hero-f4.webp'];
    let runLoadedCount = 0;
    HERO_RUN_SRC.forEach((src, i) => {
      const img = new Image();
      img.onerror = () => {};
      img.onload = () => { R.heroRun[i] = img; runLoadedCount++; if (runLoadedCount === HERO_RUN_SRC.length) R.heroRunLoaded = true; };
      img.src = src;
    });
    const jumpImg = new Image();
    jumpImg.onerror = () => {};
    jumpImg.onload = () => { R.heroJump = jumpImg; R.heroJumpLoaded = true; };
    jumpImg.src = 'assets/games/run-hero-jump.webp';
    [['bgFar', 'run-bg-far.webp'], ['bgMid', 'run-bg-mid.webp'], ['bgNear', 'run-bg-near.webp']].forEach(([key, file]) => {
      const img = new Image();
      img.onerror = () => {};
      img.onload = () => { R[key] = img; R[key + 'Loaded'] = true; };
      img.src = 'assets/games/' + file;
    });
  }, []);

  useEffect(() => {
    if (phase !== "play") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let last = performance.now();

    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const G = gameRef.current;
      if (!G || G.over) return;

      // Update
      G.t -= dt;
      if (G.t <= 0) { G.t = 0; G.over = true; G.running = false; bgm.stop(); sfx('gameFinish'); setScore(Math.floor(G.coins)); setPhase("done"); return; }

      const prog = 1 - G.t / TOTAL;
      const baseSpeed = 180 + prog * 120;
      G.speed = G.slowTimer > 0 ? baseSpeed * 0.38 : baseSpeed;
      if (G.slowTimer > 0) G.slowTimer -= dt;

      // Physics - cap height at top of screen
      const grav = (heldRef.current && G.pvy < 0) ? 250 : 950;
      G.pvy += grav * dt;
      G.py += G.pvy * dt;
      if (G.py < 15) { G.py = 15; G.pvy = 0; } // ceiling cap
      if (G.py >= GY - PLAYER_H) { G.py = GY - PLAYER_H; G.pvy = 0; G.ground = true; G.jumps = 0; }
      else G.ground = false;

      // Sprite anim: 走りコマ送り(接地時のみ進行)+3層パララックス背景スクロール(現行ロジック・座標には無関係)
      if (G.ground) G.animT += dt * (G.speed / 180);
      G.animFrame = Math.floor(G.animT * 8) % 4;
      G.bgX -= G.speed * 0.5 * dt;
      G.bgMidX -= G.speed * 0.25 * dt;
      G.bgFarX -= G.speed * 0.1 * dt;

      if (G.invTimer > 0) G.invTimer -= dt;
      if (G.drainTimer > 0) { G.drainTimer -= dt; G.coins = Math.max(0, G.coins - G.DRAIN_RATE * dt); }
      if (G.combo > 0) { G.cTimer -= dt; if (G.cTimer <= 0) { G.combo = 0; G.mult = 1; } }

      // Spawn items
      const iInt = 0.8 - prog * 0.28;
      G.iTimer -= dt;
      if (G.iTimer <= 0) {
        const it = pickF(ITEMS_DEF);
        const heights = [GY-35, GY-70, GY-105, GY-130];
        const hy = heights[Math.floor(Math.random() * heights.length)];
        G.items.push({...it, x:W+15, y:hy, vx:-(G.speed*0.92+Math.random()*25), age:0});
        G.iTimer = iInt + Math.random() * 0.35;
      }

      // Spawn obstacles
      const oInt = 0.9 - prog * 0.4;
      G.oTimer -= dt;
      if (G.oTimer <= 0) {
        const o = pickF(OBS_DEF);
        const goAir = o.air || Math.random() < 0.30;
        const airH = [GY-56, GY-82, GY-108];
        const oy = goAir ? airH[Math.floor(Math.random()*airH.length)] : GY - o.hw;
        G.obs.push({...o, x:W+15, y:oy});
        G.oTimer = oInt + Math.random() * oInt * 0.8;
      }

      // Move
      G.items.forEach(it => { it.x += it.vx * dt; it.age += dt; });
      G.items = G.items.filter(it => it.x > -30);
      G.obs.forEach(o => { o.x -= G.speed * dt; });
      G.obs = G.obs.filter(o => o.x > -30);

      // Collisions - items
      const PR = 12;
      G.items = G.items.filter(it => {
        const dx = G.px - it.x, dy = G.py - it.y;
        if (dx*dx + dy*dy < (PR+it.r)*(PR+it.r)) {
          if (it.slow) { G.slowTimer = G.SLOW_DUR; if (G.combo > 0) G.cTimer = G.C_RESET; playNote(200, 0.15, 'square', 0.06); G.floats.push({ id: ++G.floatId, x: it.x, y: it.y, text: '🐌スロー!', life: 1.2, color: '#aa44ff' }); }
          else {
            G.combo++; G.cTimer = G.C_RESET; G.mult = comboMult(G.combo); if(G.combo>G.maxCombo)G.maxCombo=G.combo;
            const earn = Math.round(it.v * 0.8 * G.mult); G.coins += earn; G.got++;
            playNote(700 + G.combo * 40, 0.12, 'sine', 0.12); playNote(900 + G.combo * 40, 0.1, 'sine', 0.08, 0.03);
            if (G.combo >= 3) { playNote(1100 + G.combo * 30, 0.12, 'sine', 0.07, 0.05); playNote(1400, 0.08, 'triangle', 0.04, 0.08); }
            if (G.combo >= 6) playSweep(800, 1600, 0.15, 'sine', 0.05, 0.02);
            G.floats.push({ id: ++G.floatId, x: it.x, y: it.y, text: '+' + earn, life: 1.0, color: G.mult >= 1.4 ? '#ffd700' : G.mult >= 1.2 ? '#ff9f43' : '#fff' });
          }
          return false;
        }
        return true;
      });

      // Collisions - obstacles
      if (G.invTimer <= 0) {
        for (const o of G.obs) {
          const dx = G.px - o.x, dy = G.py - o.y;
          if (dx*dx + dy*dy < (o.hw+7)*(o.hw+7)) {
            G.invTimer = 1.8; G.drainTimer = G.DRAIN_DUR; G.combo = 0; G.mult = 1; G.cTimer = 0;
            playNote(150, 0.2, 'sawtooth', 0.1); playNoise(0.1, 0.08);
            G.floats.push({ id: ++G.floatId, x: G.px, y: G.py - 10, text: '💥ダメージ!', life: 1.5, color: '#ff4444' });
            break;
          }
        }
      }

      // Update float texts
      G.floats.forEach(f => { f.y -= 40 * dt; f.life -= dt; });
      G.floats = G.floats.filter(f => f.life > 0);

      setScore(Math.floor(G.coins));

      // Draw
      const CRI = imgRef.current;
      if (CRI.bgFarLoaded && CRI.bgMidLoaded && CRI.bgNearLoaded) {
        // 3層パララックス(横シームレスタイル・スクロール速度差で奥行き表現)
        const drawTiled = (img, offsetX) => {
          const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
          if (!iw || !ih) return;
          const scale = H / ih, dw = iw * scale;
          let ox = offsetX % dw; if (ox > 0) ox -= dw;
          for (let x = ox; x < W; x += dw) ctx.drawImage(img, x, 0, dw, H);
        };
        drawTiled(CRI.bgFar, G.bgFarX); drawTiled(CRI.bgMid, G.bgMidX); drawTiled(CRI.bgNear, G.bgX);
      } else {
        ctx.fillStyle = '#0f0c1a'; ctx.fillRect(0, 0, W, H);
      }
      // Ground
      ctx.fillStyle = '#2a1f5a'; ctx.fillRect(0, GY, W, H - GY);
      ctx.strokeStyle = 'rgba(255,200,50,0.2)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, GY); ctx.lineTo(W, GY); ctx.stroke();

      // Items
      G.items.forEach(it => {
        const bob = Math.sin(it.age * 4.5) * 3;
        ctx.save();
        if (it.slow) { ctx.shadowColor = '#aa44ff'; ctx.shadowBlur = 8; }
        else { ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 6; }
        ctx.font = (it.r * 2) + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(it.e, it.x, it.y + bob);
        ctx.restore();
      });

      // Obstacles - redesigned characters
      G.obs.forEach(o => {
        ctx.save();
        if (o.air) {
          // Air enemy: dark bat with wings
          ctx.shadowColor = '#ff0044'; ctx.shadowBlur = 10;
          ctx.fillStyle = '#880022';
          // Wings
          ctx.beginPath(); ctx.moveTo(o.x-o.hw, o.y);
          ctx.quadraticCurveTo(o.x-o.hw*2, o.y-o.hw*1.2, o.x-o.hw*0.8, o.y+o.hw*0.4);
          ctx.closePath(); ctx.fill();
          ctx.beginPath(); ctx.moveTo(o.x+o.hw, o.y);
          ctx.quadraticCurveTo(o.x+o.hw*2, o.y-o.hw*1.2, o.x+o.hw*0.8, o.y+o.hw*0.4);
          ctx.closePath(); ctx.fill();
          // Body
          ctx.fillStyle = '#cc1133';
          ctx.beginPath(); ctx.arc(o.x, o.y, o.hw*0.8, 0, Math.PI*2); ctx.fill();
          // Eyes
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#ffff00';
          ctx.beginPath(); ctx.arc(o.x-4, o.y-2, 3, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(o.x+4, o.y-2, 3, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#000';
          ctx.beginPath(); ctx.arc(o.x-4, o.y-2, 1.5, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(o.x+4, o.y-2, 1.5, 0, Math.PI*2); ctx.fill();
        } else {
          // Ground enemy: spiky green slime
          ctx.shadowColor = '#00ff44'; ctx.shadowBlur = 8;
          ctx.fillStyle = '#22aa44';
          ctx.beginPath(); ctx.arc(o.x, o.y, o.hw, 0, Math.PI*2); ctx.fill();
          // Spikes
          ctx.fillStyle = '#ff4400';
          for (let sp=0; sp<5; sp++) {
            const a = sp/5*Math.PI*2 - Math.PI/2;
            ctx.beginPath();
            ctx.moveTo(o.x+Math.cos(a)*(o.hw-2), o.y+Math.sin(a)*(o.hw-2));
            ctx.lineTo(o.x+Math.cos(a)*(o.hw+6), o.y+Math.sin(a)*(o.hw+6));
            ctx.lineTo(o.x+Math.cos(a+0.3)*(o.hw-2), o.y+Math.sin(a+0.3)*(o.hw-2));
            ctx.closePath(); ctx.fill();
          }
          // Eyes
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(o.x-4, o.y-3, 3, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(o.x+4, o.y-3, 3, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#ff0000';
          ctx.beginPath(); ctx.arc(o.x-4, o.y-3, 1.5, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(o.x+4, o.y-3, 1.5, 0, Math.PI*2); ctx.fill();
        }
        ctx.restore();
      });

      // Player - character on ground
      const blink = G.invTimer > 0 ? (Math.sin(G.invTimer * 24) > 0 ? 0.35 : 1) : 1;
      ctx.save(); ctx.globalAlpha = blink;
      const crJumping = !G.ground;
      if (crJumping && CRI.heroJumpLoaded) {
        // ジャンプ中: run-hero-jump.webp 1枚固定。足位置(py+6)を基準に30x36で配置(現行primitiveの縦幅と揃える)
        const sw = 30, sh = 36;
        ctx.drawImage(CRI.heroJump, G.px - sw / 2, G.py + 6 - sh, sw, sh);
      } else if (!crJumping && CRI.heroRunLoaded) {
        // 接地中: run-hero-f1〜f4.webp をanimFrame(0-3)で循環表示。フレームレート=8コマ/秒相当
        const sw = 30, sh = 36;
        ctx.drawImage(CRI.heroRun[G.animFrame], G.px - sw / 2, G.py + 6 - sh, sw, sh);
      } else {
        // フォールバック: 現行primitive描画(画像未配置時はジャンプ/走り区別なく常にこちら)
        // Body
        ctx.fillStyle = G.slowTimer > 0 ? '#8844cc' : G.drainTimer > 0 ? '#cc4400' : '#2255cc';
        ctx.beginPath(); ctx.roundRect(G.px-8, G.py-12, 16, 14, [3]); ctx.fill();
        // Head
        ctx.fillStyle = '#f4a460';
        ctx.beginPath(); ctx.arc(G.px, G.py-18, 8, 0, Math.PI*2); ctx.fill();
        // Cap
        ctx.fillStyle = '#cc1100';
        ctx.fillRect(G.px-10, G.py-24, 20, 5);
        ctx.beginPath(); ctx.ellipse(G.px, G.py-24, 10, 5, 0, Math.PI, Math.PI*2); ctx.fill();
        // Eyes
        ctx.fillStyle = '#222';
        ctx.beginPath(); ctx.arc(G.px-3, G.py-18, 1.5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(G.px+3, G.py-18, 1.5, 0, Math.PI*2); ctx.fill();
        // Legs
        ctx.fillStyle = '#3333aa';
        ctx.fillRect(G.px-6, G.py, 5, 6);
        ctx.fillRect(G.px+1, G.py, 5, 6);
      }
      ctx.restore();

      // Float texts
      G.floats.forEach(f => {
        ctx.save();
        ctx.globalAlpha = Math.min(1, f.life * 2);
        ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 2;
        ctx.strokeText(f.text, f.x, f.y);
        ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y);
        ctx.restore();
      });

      // HUD on canvas - larger, more visible
      ctx.save();
      // HUD background
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, 0, W, 22);
      ctx.fillStyle = '#ffd700'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('🪙 ' + Math.floor(G.coins), 8, 15);
      const s = Math.ceil(G.t);
      ctx.fillStyle = G.t < 20 ? '#ff4444' : '#fff';
      ctx.textAlign = 'right';
      ctx.fillText(Math.floor(s/60)+':'+(s%60<10?'0':'')+s%60, W-8, 15);
      if (G.combo > 0) {
        ctx.textAlign = 'center';
        ctx.fillStyle = G.mult >= 1.4 ? '#ffd700' : G.mult >= 1.2 ? '#ff9f43' : '#4ade80';
        ctx.fillText('×' + G.mult + ' COMBO ' + G.combo, W/2, 15);
      }
      ctx.restore();

      // Time bar
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(0, H-4, W, 4);
      ctx.fillStyle = G.t < 20 ? '#f33' : G.t < 40 ? '#f93' : '#4ea';
      ctx.fillRect(0, H-4, W * (G.t/START_TIME), 4);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [phase]);

  // Input
  const onDown = () => {
    const G = gameRef.current;
    if (!G || G.over || heldRef.current) return;
    heldRef.current = true;
    if (G.ground) { G.pvy = -320; G.ground = false; G.jumps = 1; }
    else if (G.jumps < 1) { G.pvy = -270; G.jumps++; }
  };
  const onUp = () => { heldRef.current = false; };

  useEffect(() => () => { bgm.stop(); if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);
  useEffect(() => { if (phase === "done") { onScore(score); const t = setTimeout(onClose, 3000); return () => clearTimeout(t); } }, [phase]);   // scoreを依存から外す(done後のscore変動でonScore二重発火するのを防止)

  return (
    <div style={{ textAlign: 'center' }}>
      <div className="st" style={{ justifyContent: 'center' }}>🏃 コインランナー</div>
      {phase === "ready" && (
        <>
          <p style={{ fontSize: 11, opacity: 0.5, margin: '12px 0', lineHeight: 1.8 }}>
            コインに当たってゲット！障害物を避けろ！<br/>
            画面タップ: ジャンプ　長押し: 高くジャンプ<br/>
            制限時間: 1分10秒
          </p>
          <button className="btn bp" onClick={startGame}>スタート！</button>
        </>
      )}
      {phase === "play" && (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 40, touchAction: 'none' }}
            onPointerDown={e => { e.preventDefault(); onDown(); }}
            onPointerUp={onUp} onPointerCancel={onUp} />
          <div style={{ position: 'relative', marginTop: 4, touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', zIndex: 41, pointerEvents: 'none' }}>
            <canvas ref={canvasRef} width={W} height={H}
              style={{ borderRadius: 14, border: '2px solid rgba(255,200,50,0.2)', touchAction: 'none', width: '100%', height: 'auto',
                boxShadow: '0 0 20px rgba(255,200,50,0.1)' }} />
          </div>
        </>
      )}
      {phase === "done" && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#fbbf24', marginBottom: 8 }}>🏁 RESULT</div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>🪙 {score.toLocaleString()}</div>
          <p style={{ fontSize: 12, opacity: 0.5 }}>
            {score >= 3200 ? '🏆 MASTER！' : score >= 2800 ? '🥇 エキスパート！' : score >= 2300 ? '🥈 グッドプレイ！' : score >= 1800 ? '🥉 もう少し！' : '💪 練習あるのみ！'}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// PINBALL GAME (80 seconds pinball with flippers)
// ============================================================
// ============================================================
// CHAIN BURST GAME (70 seconds bubble chain explosion)
// ============================================================
// A5: 光球のスプライト画像(BTYPESの色ごとに1枚対応)。無ければ現行のグラデ円のまま(progressive enhancement)。
const CB_GEM_SRCS = ['assets/games/cb-gem1.webp', 'assets/games/cb-gem2.webp', 'assets/games/cb-gem3.webp', 'assets/games/cb-gem4.webp', 'assets/games/cb-gem5.webp', 'assets/games/cb-gem6.webp'];
const CB_GEM_IMGS = CB_GEM_SRCS.map(() => ({ img: null, loaded: false }));
let cbAssetsStarted = false;
function cbPreloadAssets() {
  if (cbAssetsStarted || typeof window === 'undefined') return;
  cbAssetsStarted = true;
  CB_GEM_SRCS.forEach((src, i) => {
    try {
      const img = new Image();
      img.onload = () => { CB_GEM_IMGS[i].loaded = true; };
      img.onerror = () => {};
      img.src = src;
      CB_GEM_IMGS[i].img = img;
    } catch (e) {}
  });
}
function ChainBurstGame({ onScore, onClose }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const rafRef = useRef(null);
  const [phase, setPhase] = useState("ready");
  const [score, setScore] = useState(0);
  const partsRef = useRef([]);

  const W = 320, H = 420, TOTAL = 70;
  const BTYPES = [
    {col:'#ff4466',glow:'#ff0033',r:22,val:4,chainR:64,freq:1.0},
    {col:'#44aaff',glow:'#0066ff',r:20,val:3,chainR:58,freq:1.0},
    {col:'#ffcc00',glow:'#ff8800',r:19,val:5,chainR:55,freq:0.7},
    {col:'#44ff88',glow:'#00cc44',r:17,val:3,chainR:50,freq:0.8},
    {col:'#ff88ff',glow:'#cc00cc',r:26,val:8,chainR:74,freq:0.3},
    {col:'#ffffff',glow:'#88ccff',r:15,val:3,chainR:46,freq:0.9},
  ];
  const pickBTypeIdx = () => { const tot=BTYPES.reduce((s,t)=>s+t.freq,0); let r=Math.random()*tot; for(let i=0;i<BTYPES.length;i++){r-=BTYPES[i].freq;if(r<=0)return i;} return 0; };
  const chainMult = (n) => n>=20?2.0:n>=15?1.8:n>=10?1.5:n>=5?1.2:1.0;

  const initGame = () => ({
    running:true, over:false, t:TOTAL, coins:0,
    bubbles:[], spawnT:0,
    chainActive:false, chainCount:0, chainTimer:0, CHAIN_WINDOW:0.55,
    maxChain:0, totalPops:0, floats:[], floatId:0, chainFlash:null,
  });

  const startGame = () => {
    gameRef.current = initGame();
    partsRef.current = [];
    setPhase("play"); setScore(0);
    bgm.playLoop(BGM_CALC, 120);
  };

  const spawnBubble = (G) => {
    const tIdx = pickBTypeIdx();
    const t = BTYPES[tIdx];
    const slow = Math.random() < 0.30;
    const speedMult = slow ? 0.2+Math.random()*0.4 : 1.8+Math.random()*2.7;
    const angle = Math.random()*Math.PI*2;
    G.bubbles.push({ ...t, gemIdx:tIdx, x:t.r+10+Math.random()*(W-t.r*2-20), y:t.r+10+Math.random()*(H*0.7), vx:Math.cos(angle)*60*speedMult, vy:Math.sin(angle)*60*speedMult, age:0, alive:true, scale:0, pulse:Math.random()*Math.PI*2 });
  };

  const burstAt = (x,y,cols,n) => { for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=3+Math.random()*5; partsRef.current.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,life:1,col:cols[i%cols.length],r:2+Math.random()*4});} };

  // ドレミファソラシド音階（C4→C5）
  const SCALE = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
  const playChainNote = (chainN) => {
    const octave = Math.floor((chainN-1)/8);
    const noteIdx = (chainN-1) % 8;
    const freq = SCALE[noteIdx] * Math.pow(2, octave);
    // メイン音（まろやかなサイン波）
    playNote(freq, 0.25, 'sine', 0.15);
    // ハーモニクス（5度上を薄く重ねる）
    playNote(freq*1.5, 0.18, 'sine', 0.05, 0.01);
    // オクターブ変わり目は輝き音追加
    if(chainN > 1 && chainN%8 === 1) {
      playNote(freq*2, 0.15, 'triangle', 0.08, 0.04);
      playSweep(freq, freq*2, 0.2, 'sine', 0.04, 0.02);
    }
  };
  // チェイン終了ファンファーレ
  const playChainFanfare = (n) => {
    if(n < 5) return;
    const chord = n>=15 ? [523,659,784,1047] : [392,494,587,784];
    chord.forEach((f,i) => playNote(f, 0.4, 'sine', 0.1, i*0.06));
  };

  const explodeRef = useRef(null);
  explodeRef.current = (b, G, depth=0) => {
    if(!b.alive) return;
    b.alive = false;
    G.chainCount++; G.totalPops++;
    if(G.chainCount > G.maxChain) G.maxChain = G.chainCount;
    const mult = chainMult(G.chainCount);
    const earn = Math.round(b.val * mult);
    G.coins += earn;
    // ドレミ音階で連鎖音
    playChainNote(G.chainCount);
    burstAt(b.x, b.y, [b.col,'#fff',b.glow], 12);
    G.floats.push({id:++G.floatId, x:b.x, y:b.y, text:'+'+earn, life:0.9, color: mult>=1.8?'#ffd700':mult>=1.2?'#ffaa44':'#fff'});
    G.chainTimer = G.CHAIN_WINDOW;
    G.chainActive = true;
    // Chain to nearby
    const nearby = G.bubbles.filter(nb => nb.alive && nb!==b && Math.sqrt((b.x-nb.x)**2+(b.y-nb.y)**2) < b.chainR+nb.r);
    nearby.forEach((nb,i) => { setTimeout(() => { if(G.running && nb.alive) explodeRef.current(nb, G, depth+1); }, i*60); });
  };

  useEffect(() => {
    if (phase !== "play") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let last = performance.now();

    const loop = (now) => {
      const dt = Math.min((now-last)/1000, 0.04); last = now;
      const G = gameRef.current;
      if(!G||G.over) return;

      G.t -= dt;
      if(G.t <= 0) { G.t=0; G.over=true; G.running=false; bgm.stop(); sfx('gameFinish'); setScore(Math.floor(G.coins)); setPhase("done"); return; }

      // Chain timer
      if(G.chainActive) { G.chainTimer-=dt; if(G.chainTimer<=0) { G.chainActive=false;
        if(G.chainCount>=10) {
          G.chainFlash={count:G.chainCount,mult:chainMult(G.chainCount),life:G.chainCount>=15?2.5:1.5,final:true};
          if(G.chainCount>=20) {
            // 超派手ファンファーレ
            [523,659,784,1047,1319].forEach((f,i)=>playNote(f,0.5,'sine',0.12,i*0.06));
            playChord([1047,1319,1568],1.0,'sine',0.08,0.35);
            playSweep(523,2093,0.6,'sine',0.06,0.1);
            playChord([1568,2093,2637],0.8,'triangle',0.05,0.5);
          } else if(G.chainCount>=15) {
            // ファンファーレ
            [523,659,784,1047].forEach((f,i)=>playNote(f,0.4,'sine',0.1,i*0.07));
            playChord([784,1047,1319],0.6,'sine',0.06,0.3);
          } else if(G.chainCount>=5) {
            playChainFanfare(G.chainCount);
          }
        }
        G.chainCount=0;
      } }
      // Chain flash decay
      if(G.chainFlash) { G.chainFlash.life-=dt; if(G.chainFlash.life<=0) G.chainFlash=null; }

      // Move bubbles
      G.bubbles.forEach(b => {
        if(!b.alive) return;
        b.age+=dt; if(b.age>=5.0) { b.alive=false; return; }
        b.scale=Math.min(1,b.scale+dt*5); b.pulse+=dt*6;
        b.x+=b.vx*dt; b.y+=b.vy*dt;
        if(b.x-b.r<0){b.x=b.r;b.vx=Math.abs(b.vx);}
        if(b.x+b.r>W){b.x=W-b.r;b.vx=-Math.abs(b.vx);}
        if(b.y-b.r<0){b.y=b.r;b.vy=Math.abs(b.vy);}
        if(b.y+b.r>H*0.85){b.y=H*0.85-b.r;b.vy=-Math.abs(b.vy);}
      });
      G.bubbles = G.bubbles.filter(b => b.alive);

      // Spawn
      G.spawnT-=dt;
      if(G.spawnT<=0) {
        const elapsed=TOTAL-G.t;
        const max = elapsed<20?14:elapsed<40?18:elapsed<55?22:26;
        const alive = G.bubbles.filter(b=>b.alive).length;
        if(alive<max) spawnBubble(G);
        G.spawnT = (max-alive)>5?0.12:0.35;
      }

      // Floats + particles
      G.floats.forEach(f=>{f.y-=50*dt;f.life-=dt;});
      G.floats = G.floats.filter(f=>f.life>0);
      partsRef.current.forEach(p=>{p.x+=p.vx*dt*60;p.y+=p.vy*dt*60;p.vy+=0.2;p.life-=dt*2;p.r*=0.94;});
      partsRef.current = partsRef.current.filter(p=>p.life>0);

      setScore(Math.floor(G.coins));

      // Draw
      ctx.fillStyle='#050818'; ctx.fillRect(0,0,W,H);

      // Chain glow
      if(G.chainActive && G.chainCount>0) {
        const intensity = Math.min(G.chainCount/15,1);
        ctx.save(); ctx.globalAlpha=intensity*0.15; ctx.fillStyle='#ff8800';
        ctx.fillRect(0,0,W,H); ctx.restore();
      }

      // Bubbles
      G.bubbles.forEach(b => {
        if(!b.alive) return;
        const r = b.r*b.scale*(1+Math.sin(b.pulse)*0.04);
        if(r<=0) return;
        ctx.save();
        const timeLeft=5.0-b.age;
        const flicker=timeLeft<1.0?(Math.sin(b.age*30)>0?0.5:1.0):1.0;
        ctx.globalAlpha=0.9*flicker;
        const gemAsset = CB_GEM_IMGS[b.gemIdx];
        if (gemAsset && gemAsset.loaded && gemAsset.img) {
          ctx.shadowColor=b.glow; ctx.shadowBlur=16;
          ctx.drawImage(gemAsset.img, b.x-r, b.y-r, r*2, r*2);
          ctx.shadowBlur=0;
        } else {
          ctx.shadowColor=b.glow; ctx.shadowBlur=16;
          const grad=ctx.createRadialGradient(b.x-r*0.3,b.y-r*0.3,r*0.1,b.x,b.y,r);
          grad.addColorStop(0,'rgba(255,255,255,0.8)'); grad.addColorStop(0.3,b.col); grad.addColorStop(1,b.glow);
          ctx.fillStyle=grad;
          ctx.beginPath();ctx.arc(b.x,b.y,r,0,Math.PI*2);ctx.fill();
          ctx.shadowBlur=0; ctx.globalAlpha=0.4; ctx.fillStyle='#fff';
          ctx.beginPath();ctx.arc(b.x-r*0.3,b.y-r*0.3,r*0.25,0,Math.PI*2);ctx.fill();
        }
        if(G.chainActive && b.scale>0.9) {
          ctx.globalAlpha=0.06; ctx.strokeStyle=b.col; ctx.lineWidth=1; ctx.setLineDash([3,3]);
          ctx.beginPath();ctx.arc(b.x,b.y,b.chainR,0,Math.PI*2);ctx.stroke(); ctx.setLineDash([]);
        }
        ctx.restore();
      });

      // Particles
      partsRef.current.forEach(p=>{
        ctx.save();ctx.globalAlpha=Math.max(0,p.life*0.8);ctx.fillStyle=p.col;ctx.shadowColor=p.col;ctx.shadowBlur=6;
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();ctx.restore();
      });

      // Floats
      G.floats.forEach(f=>{
        ctx.save();ctx.globalAlpha=Math.min(1,f.life*2);ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.strokeStyle='rgba(0,0,0,0.8)';ctx.lineWidth=2;ctx.strokeText(f.text,f.x,f.y);
        ctx.fillStyle=f.color;ctx.fillText(f.text,f.x,f.y);ctx.restore();
      });

      // Chain count display (center, size scales with chain)
      if(G.chainActive && G.chainCount >= 2) {
        ctx.save();
        const csz = G.chainCount>=20?42:G.chainCount>=15?30:G.chainCount>=10?22:G.chainCount>=5?16:13;
        ctx.globalAlpha = G.chainCount>=10?0.9:G.chainCount>=5?0.7:0.5;
        ctx.font = 'bold '+csz+'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = G.chainCount>=15?'#ffd700':G.chainCount>=10?'#ff8844':G.chainCount>=5?'#ffaa00':'rgba(255,255,255,0.5)';
        ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 3;
        ctx.strokeText(G.chainCount+'🔥', W/2, H*0.42);
        ctx.fillText(G.chainCount+'🔥', W/2, H*0.42);
        if(G.chainCount >= 5) {
          ctx.font = 'bold '+(csz*0.5)+'px sans-serif'; ctx.fillStyle = '#ffcc44';
          ctx.fillText('×'+chainMult(G.chainCount), W/2, H*0.42+csz*0.7);
        }
        ctx.restore();
      }
      // Chain flash (final only)
      if(G.chainFlash) {
        ctx.save();
        const fl = G.chainFlash;
        ctx.globalAlpha = Math.min(1, fl.life * 1.2);
        // 20+ screen flash
        if(fl.count >= 20) {
          ctx.globalAlpha = Math.min(0.3, fl.life * 0.3);
          ctx.fillStyle = '#ffd700'; ctx.fillRect(0,0,W,H);
          ctx.globalAlpha = Math.min(1, fl.life * 1.2);
        } else if(fl.count >= 15) {
          ctx.globalAlpha = Math.min(0.15, fl.life * 0.2);
          ctx.fillStyle = '#66ffff'; ctx.fillRect(0,0,W,H);
          ctx.globalAlpha = Math.min(1, fl.life * 1.2);
        }
        const sz = fl.count>=20?52:fl.count>=15?34:fl.count>=10?22:0;
        ctx.font = 'bold '+sz+'px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        const icon = fl.count>=20?'⚡':fl.count>=15?'🌟':fl.count>=10?'💥':fl.count>=5?'🔥':'✨';
        ctx.strokeStyle='rgba(0,0,0,0.8)'; ctx.lineWidth=4;
        ctx.fillStyle = fl.count>=20?'#ffd700':fl.count>=15?'#66ffff':'#fff';
        const txt = icon+' '+fl.count+' CHAIN! '+icon;
        ctx.strokeText(txt, W/2, H*0.3); ctx.fillText(txt, W/2, H*0.3);
        ctx.font = 'bold '+(fl.count>=20?28:fl.count>=15?20:fl.count>=10?16:12)+'px sans-serif'; ctx.fillStyle='#ffd700';
        ctx.strokeText('×'+fl.mult+' BONUS!', W/2, H*0.3+42); ctx.fillText('×'+fl.mult+' BONUS!', W/2, H*0.3+42);
        ctx.restore();
      }

      // HUD
      ctx.save();ctx.fillStyle='rgba(0,0,0,0.4)';ctx.fillRect(0,0,W,20);
      ctx.fillStyle='#66ffff';ctx.font='bold 12px sans-serif';ctx.textAlign='left';
      ctx.fillText('🪙'+Math.floor(G.coins),6,14);
      const s=Math.ceil(G.t);ctx.textAlign='right';ctx.fillStyle=G.t<15?'#ff4444':'#fff';
      ctx.fillText(Math.floor(s/60)+':'+(s%60<10?'0':'')+s%60,W-6,14);
      ctx.textAlign='center';
      if(G.chainActive && G.chainCount>0) ctx.fillText('🔥'+G.chainCount+' ×'+chainMult(G.chainCount),W/2,14);
      ctx.restore();
      // Chain bar
      if(G.chainActive && G.chainCount>0) {
        const pct=Math.min(G.chainCount/20,1);
        ctx.fillStyle='rgba(0,0,0,0.4)';ctx.fillRect(10,H-14,W-20,7);
        const cg=ctx.createLinearGradient(10,0,W-10,0);cg.addColorStop(0,'#0af');cg.addColorStop(0.5,'#ffaa00');cg.addColorStop(1,'#ff2200');
        ctx.fillStyle=cg;ctx.fillRect(10,H-14,(W-20)*pct,7);
        // Chain countdown
        const cPct=G.chainTimer/G.CHAIN_WINDOW;
        ctx.fillStyle='rgba(255,255,255,0.12)';ctx.fillRect(10,H-5,W-20,3);
        ctx.fillStyle='rgba(255,255,255,0.5)';ctx.fillRect(10,H-5,(W-20)*cPct,3);
      }
      ctx.fillStyle='rgba(255,255,255,0.06)';ctx.fillRect(0,H-3,W,3);
      ctx.fillStyle=G.t<15?'#f33':'#0af';ctx.fillRect(0,H-3,W*(G.t/TOTAL),3);

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if(rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [phase]);

  const handleTap = (e) => {
    const G = gameRef.current;
    if(!G||G.over) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const cx = (e.clientX-rect.left)/rect.width*W;
    const cy = (e.clientY-rect.top)/rect.height*H;
    const sorted = [...G.bubbles].filter(b=>b.alive&&b.scale>0.5).sort((a,b)=>b.r-a.r);
    for(const b of sorted) {
      if(Math.sqrt((cx-b.x)**2+(cy-b.y)**2) < b.r+6) {
        if(!G.chainActive) { G.chainCount=0; }
        explodeRef.current(b, G, 0);
        return;
      }
    }
  };

  useEffect(() => { cbPreloadAssets(); }, []);
  useEffect(() => () => { bgm.stop(); if(rafRef.current) cancelAnimationFrame(rafRef.current); }, []);
  useEffect(() => { if(phase==="done"){onScore(score);const t=setTimeout(onClose,3000);return()=>clearTimeout(t);} }, [phase]);

  return (
    <div style={{textAlign:'center'}}>
      <div className="st" style={{justifyContent:'center'}}>💥 チェインバースト</div>
      {phase==="ready" && (
        <>
          <p style={{fontSize:11,opacity:0.5,margin:'12px 0',lineHeight:1.8}}>
            バブルをタップして爆発！連鎖で倍率UP！<br/>
            大連鎖を狙って一気に稼げ！<br/>制限時間: 1分10秒
          </p>
          <button className="btn bp" onClick={startGame}>スタート！</button>
        </>
      )}
      {phase==="play" && (
        <div style={{marginTop:4,touchAction:'none',userSelect:'none',WebkitUserSelect:'none'}}>
          <canvas ref={canvasRef} width={W} height={H}
            onPointerDown={e=>{e.preventDefault();handleTap(e);}}
            style={{borderRadius:12,border:'2px solid rgba(100,200,255,0.2)',touchAction:'none',width:'100%',maxHeight:'calc(100vh - 180px)',
              boxShadow:'0 0 20px rgba(0,150,255,0.15)'}} />
        </div>
      )}
      {phase==="done" && (
        <div style={{textAlign:'center',marginTop:16}}>
          <div style={{fontSize:18,fontWeight:900,color:'#66ffff',marginBottom:8}}>🏁 RESULT</div>
          <div style={{fontSize:28,fontWeight:900}}>🪙 {score.toLocaleString()}</div>
          <p style={{fontSize:12,opacity:0.5}}>
            {score>=3000?'🏆 CHAIN MASTER！':score>=2200?'🥇 エキスパート！':score>=1500?'🥈 グッドプレイ！':score>=800?'🥉 もう少し！':'💪 大連鎖を狙え！'}
          </p>
        </div>
      )}
    </div>
  );
}

// A5: 盤面背景画像。無ければ現行の黒地のまま(progressive enhancement)。
const PIN_BOARD_SRC = 'assets/games/pin-board.webp';
const PIN_BOARD_IMG = { img: null, loaded: false };
let pinAssetsStarted = false;
function pinPreloadAssets() {
  if (pinAssetsStarted || typeof window === 'undefined') return;
  pinAssetsStarted = true;
  try {
    const img = new Image();
    img.onload = () => { PIN_BOARD_IMG.loaded = true; };
    img.onerror = () => {};
    img.src = PIN_BOARD_SRC;
    PIN_BOARD_IMG.img = img;
  } catch (e) {}
}
function PinballGame({ onScore, onClose }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const rafRef = useRef(null);
  const [phase, setPhase] = useState("ready");
  const [score, setScore] = useState(0);
  const leftRef = useRef(false);
  const rightRef = useRef(false);

  const W = 300, H = 430, TOTAL = 80, START_TIME = 70;
  const WALL = 12, CEIL = 46, FLOOR = H - 8;
  const FY = H - 58, FL_PX = 75, FR_PX = W - 75, FLEN = 56, FTHICK = 9;
  const F_UP = -0.38, F_DN = 0.42, F_SPD = 22;
  const GRAV = 420, DAMPEN = 0.65, BDAMPEN = 0.75, FRICTION = 0.992;

  const BUMPERS = [
    {x:75,y:100,r:16,col:'#ff44ff',glow:'#cc00cc',pts:2},
    {x:150,y:88,r:18,col:'#ffaa00',glow:'#ff6600',pts:3},
    {x:225,y:100,r:16,col:'#ff44ff',glow:'#cc00cc',pts:2},
    {x:50,y:168,r:14,col:'#44ffff',glow:'#0088cc',pts:2},
    {x:115,y:162,r:20,col:'#ff2255',glow:'#cc0033',pts:5},
    {x:185,y:162,r:20,col:'#ff2255',glow:'#cc0033',pts:5},
    {x:250,y:168,r:14,col:'#44ffff',glow:'#0088cc',pts:2},
    {x:83,y:240,r:16,col:'#ffee00',glow:'#cc9900',pts:3},
    {x:217,y:240,r:16,col:'#ffee00',glow:'#cc9900',pts:3},
    {x:67,y:308,r:13,col:'#44ffaa',glow:'#00bb66',pts:2},
    {x:233,y:308,r:13,col:'#44ffaa',glow:'#00bb66',pts:2},
  ];

  const initGame = () => {
    const bmpState = BUMPERS.map(b => ({ ...b, flash: 0 }));
    return {
      running: true, over: false, t: START_TIME, coins: 0,
      balls: [{ x: W-WALL-14, y: CEIL+50, vx: -(70+Math.random()*50), vy: 100+Math.random()*60, r: 7, col: '#ffffff', glow: '#aaddff', trail: [] }],
      nextSpawn: 1.4, ballsAdded: 1,
      lAngle: F_DN, rAngle: F_DN, lPrev: F_DN, rPrev: F_DN,
      bumpers: bmpState, floats: [], floatId: 0, wallHits: 0, bumperHits: 0, dropped: 0,
    };
  };

  const startGame = () => {
    gameRef.current = initGame();
    leftRef.current = false; rightRef.current = false;
    setPhase("play"); setScore(0);
    bgm.playLoop(SHOOTING_BGM, 150);
  };

  useEffect(() => {
    if (phase !== "play") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let last = performance.now();

    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.033);
      last = now;
      const G = gameRef.current;
      if (!G || G.over) return;

      G.t -= dt;
      if (G.t <= 0) { G.t = 0; G.over = true; G.running = false; bgm.stop(); sfx('gameFinish'); setScore(Math.floor(G.coins)); setPhase("done"); return; }

      const prog = 1 - G.t / TOTAL;

      // Flippers
      const tL = leftRef.current ? F_UP : F_DN;
      const tR = rightRef.current ? F_UP : F_DN;
      G.lPrev = G.lAngle; G.rPrev = G.rAngle;
      G.lAngle += (tL - G.lAngle) * Math.min(1, F_SPD * dt);
      G.rAngle += (tR - G.rAngle) * Math.min(1, F_SPD * dt);

      G.bumpers.forEach(b => { if (b.flash > 0) b.flash -= dt * 4; });

      // Spawn balls
      G.nextSpawn -= dt;
      if (G.nextSpawn <= 0) {
        const max = G.t <= 30 ? 6 : Math.min(2 + Math.floor(prog * 4), 5);
        if (G.balls.length < max) {
          const cols = [{ col: '#ffcc44', glow: '#ff8800' }, { col: '#ff66ff', glow: '#cc00cc' }, { col: '#44ffcc', glow: '#00aaaa' }];
          const bc = cols[G.ballsAdded % cols.length];
          G.balls.push({ x: W-WALL-14, y: CEIL+50, vx: -(70+Math.random()*50), vy: 100+Math.random()*60, r: 7, col: bc.col, glow: bc.glow, trail: [] });
          G.ballsAdded++;
        }
        G.nextSpawn = 1.25 + Math.random() * 0.65;
      }

      // Update balls
      G.balls = G.balls.filter(b => {
        b.trail.push({ x: b.x, y: b.y }); if (b.trail.length > 6) b.trail.shift();
        b.vy += GRAV * dt; b.vx *= FRICTION; b.x += b.vx * dt; b.y += b.vy * dt;

        // Walls
        if (b.x - b.r < WALL) { b.x = WALL + b.r; b.vx = Math.abs(b.vx) * DAMPEN; G.coins += 2; G.wallHits++; playNote(400, 0.06, 'triangle', 0.1); }
        if (b.x + b.r > W - WALL) { b.x = W - WALL - b.r; b.vx = -Math.abs(b.vx) * DAMPEN; G.coins += 2; G.wallHits++; playNote(400, 0.06, 'triangle', 0.1); }
        if (b.y - b.r < CEIL) { b.y = CEIL + b.r; b.vy = Math.abs(b.vy) * DAMPEN; G.coins += 2; playNote(350, 0.05, 'triangle', 0.08); }

        // Gutters
        const checkGutter = (x1, y1, x2, y2) => {
          const dx2 = x2-x1, dy2 = y2-y1, len2 = dx2*dx2+dy2*dy2;
          let t2 = ((b.x-x1)*dx2+(b.y-y1)*dy2)/len2; t2 = Math.max(0, Math.min(1, t2));
          const cx = x1+t2*dx2, cy = y1+t2*dy2, ex = b.x-cx, ey = b.y-cy, dist = Math.sqrt(ex*ex+ey*ey);
          if (dist < b.r+4) {
            const nx = ex/dist, ny = ey/dist;
            b.x = cx+nx*(b.r+5); b.y = cy+ny*(b.r+5);
            const dot = b.vx*nx+b.vy*ny;
            b.vx = (b.vx-2*dot*nx)*DAMPEN; b.vy = (b.vy-2*dot*ny)*DAMPEN;
            G.coins += 1;
          }
        };
        checkGutter(WALL, FY-74, FL_PX, FY+3);
        checkGutter(W-WALL, FY-74, FR_PX, FY+3);

        // Bumpers
        for (const bmp of G.bumpers) {
          const dx3 = b.x-bmp.x, dy3 = b.y-bmp.y, dist = Math.sqrt(dx3*dx3+dy3*dy3);
          if (dist < b.r+bmp.r) {
            const nx = dx3/dist, ny = dy3/dist;
            b.x = bmp.x+nx*(b.r+bmp.r+1); b.y = bmp.y+ny*(b.r+bmp.r+1);
            const dot = b.vx*nx+b.vy*ny;
            b.vx = (b.vx-2*dot*nx)*BDAMPEN+nx*100; b.vy = (b.vy-2*dot*ny)*BDAMPEN+ny*100;
            const spd = Math.sqrt(b.vx*b.vx+b.vy*b.vy); if (spd > 600) { b.vx = b.vx/spd*600; b.vy = b.vy/spd*600; }
            const rng = Math.random();
            const mult = rng < 0.005 ? 3.0 : rng < 0.02 ? 2.0 : rng < 0.17 ? 1.5 : 1.0;
            const earn = Math.round(bmp.pts * mult * 0.972);
            G.coins += earn; G.bumperHits++; bmp.flash = 1;
            if (mult >= 3.0) {
              playNote(1200, 0.25, 'sine', 0.2); playNote(1500, 0.2, 'sine', 0.15, 0.05); playNote(1800, 0.15, 'sine', 0.12, 0.1);
              playNote(2200, 0.2, 'sine', 0.1, 0.15); playSweep(600, 2400, 0.3, 'sine', 0.1);
              playNoise(0.08, 0.15); playNote(2400, 0.12, 'triangle', 0.08, 0.2);
            } else if (mult >= 2.0) {
              playNote(1200, 0.2, 'sine', 0.15); playNote(1500, 0.15, 'sine', 0.12, 0.05); playNote(1800, 0.12, 'sine', 0.1, 0.1);
              playSweep(800, 2000, 0.2, 'sine', 0.08);
            } else if (mult >= 1.5) {
              playNote(900, 0.15, 'sine', 0.13); playNote(1200, 0.1, 'sine', 0.08, 0.04);
            } else {
              playNote(bmp.pts >= 5 ? 880 : bmp.pts >= 3 ? 660 : 520, 0.12, 'sine', 0.1);
            }
            const multLabel = mult >= 3.0 ? ' ×3!!' : mult >= 2.0 ? ' ×2!' : mult >= 1.5 ? ' ×1.5!' : '';
            const multColor = mult >= 2.0 ? '#ffd700' : mult >= 1.3 ? '#ff9f43' : mult >= 1.2 ? '#4ade80' : bmp.col;
            G.floats.push({ id: ++G.floatId, x: bmp.x, y: bmp.y-bmp.r-6, text: '+'+earn+multLabel, life: mult >= 1.3 ? 1.2 : 0.8, color: multColor });
          }
        }

        // Flippers collision
        const hitFlip = (px, py, angle, dir, prevAngle, active) => {
          const tx = px+Math.cos(angle)*FLEN*dir, ty = py+Math.sin(angle)*FLEN;
          const dx4 = tx-px, dy4 = ty-py, len2 = dx4*dx4+dy4*dy4;
          let t3 = ((b.x-px)*dx4+(b.y-py)*dy4)/len2; t3 = Math.max(0, Math.min(1, t3));
          const cx = px+t3*dx4, cy = py+t3*dy4, ex = b.x-cx, ey = b.y-cy, dist = Math.sqrt(ex*ex+ey*ey);
          if (dist < b.r+FTHICK/2+1) {
            const nx = ex/dist, ny = ey/dist;
            b.x = cx+nx*(b.r+FTHICK/2+2); b.y = cy+ny*(b.r+FTHICK/2+2);
            const dot = b.vx*nx+b.vy*ny;
            b.vx = (b.vx-2*dot*nx)*DAMPEN; b.vy = (b.vy-2*dot*ny)*DAMPEN;
            const angVel = Math.abs(angle-prevAngle)*60;
            if (active) { b.vy -= angVel*22+350; b.vx += dir*angVel*10; } else { b.vy = -220; }
            const spd = Math.sqrt(b.vx*b.vx+b.vy*b.vy); if (spd > 1500) { b.vx = b.vx/spd*1500; b.vy = b.vy/spd*1500; }
            playNote(200, 0.15, 'sine', 0.15); playNote(60, 0.1, 'sawtooth', 0.08);
          }
        };
        hitFlip(FL_PX, FY, G.lAngle, 1, G.lPrev, leftRef.current);
        hitFlip(FR_PX, FY, G.rAngle, -1, G.rPrev, rightRef.current);

        // Fall
        if (b.y > FLOOR) {
          G.coins = Math.max(0, G.coins - 30); G.dropped++;
          playNote(150, 0.2, 'sawtooth', 0.1); playNoise(0.1, 0.06);
          G.floats.push({ id: ++G.floatId, x: b.x, y: FLOOR-25, text: '-30💔', life: 1.0, color: '#ff3355' });
          G.balls.push({ x: W-WALL-14, y: CEIL+40, vx: -(70+Math.random()*60), vy: 80+Math.random()*50, r: b.r, col: b.col, glow: b.glow, trail: [] });
          return false;
        }
        return true;
      });

      G.floats.forEach(f => { f.y -= 35*dt; f.life -= dt; });
      G.floats = G.floats.filter(f => f.life > 0);
      setScore(Math.floor(G.coins));

      // Draw
      if (PIN_BOARD_IMG.loaded && PIN_BOARD_IMG.img) {
        ctx.drawImage(PIN_BOARD_IMG.img, 0, 0, W, H);
      } else {
        ctx.fillStyle = '#06040e'; ctx.fillRect(0, 0, W, H);
      }
      // Walls
      ctx.fillStyle = '#1a0025'; ctx.fillRect(0, CEIL, WALL, H-CEIL); ctx.fillRect(W-WALL, CEIL, WALL, H-CEIL);
      ctx.strokeStyle = '#aa00cc'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(WALL, CEIL); ctx.lineTo(WALL, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W-WALL, CEIL); ctx.lineTo(W-WALL, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(WALL, CEIL); ctx.lineTo(W-WALL, CEIL); ctx.stroke();

      // Gutters
      ctx.save(); ctx.strokeStyle = '#880099'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(WALL, FY-74); ctx.lineTo(FL_PX, FY+3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W-WALL, FY-74); ctx.lineTo(FR_PX, FY+3); ctx.stroke();
      ctx.restore();

      // Death zone
      ctx.fillStyle = 'rgba(255,0,60,0.05)'; ctx.fillRect(WALL, FY+14, W-WALL*2, H-FY-14);

      // Bumpers
      G.bumpers.forEach(bmp => {
        ctx.save();
        const lit = bmp.flash > 0;
        ctx.shadowColor = bmp.glow; ctx.shadowBlur = lit ? 24 : 8;
        ctx.strokeStyle = lit ? '#fff' : bmp.col; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(bmp.x, bmp.y, bmp.r, 0, Math.PI*2); ctx.stroke();
        ctx.fillStyle = lit ? bmp.col : 'rgba(0,0,0,0.5)';
        ctx.beginPath(); ctx.arc(bmp.x, bmp.y, bmp.r-2, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0; ctx.fillStyle = lit ? '#fff' : bmp.col;
        ctx.beginPath(); ctx.arc(bmp.x, bmp.y, bmp.r*0.3, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = lit ? '#fff' : 'rgba(255,255,255,0.4)';
        ctx.font = `bold ${bmp.r>16?10:8}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(bmp.pts, bmp.x, bmp.y); ctx.restore();
      });

      // Flippers
      const drawFlip = (px, py, angle, dir, active) => {
        const tx = px+Math.cos(angle)*FLEN*dir, ty = py+Math.sin(angle)*FLEN;
        ctx.save(); ctx.shadowColor = active ? '#ff88ff' : '#880099'; ctx.shadowBlur = active ? 18 : 6;
        ctx.strokeStyle = active ? '#ffaaff' : '#cc44cc'; ctx.lineWidth = FTHICK; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(tx, ty); ctx.stroke();
        ctx.fillStyle = active ? '#fff' : '#cc66cc'; ctx.shadowBlur = active ? 12 : 4;
        ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI*2); ctx.fill(); ctx.restore();
      };
      drawFlip(FL_PX, FY, G.lAngle, 1, leftRef.current);
      drawFlip(FR_PX, FY, G.rAngle, -1, rightRef.current);

      // Balls
      G.balls.forEach(b => {
        b.trail.forEach((p, ti) => {
          ctx.save(); ctx.globalAlpha = (ti/b.trail.length)*0.25; ctx.fillStyle = b.col;
          ctx.beginPath(); ctx.arc(p.x, p.y, b.r*(ti/b.trail.length)*0.6, 0, Math.PI*2); ctx.fill(); ctx.restore();
        });
        ctx.save(); ctx.shadowColor = b.glow; ctx.shadowBlur = 14; ctx.fillStyle = b.col;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath(); ctx.arc(b.x-b.r*0.3, b.y-b.r*0.3, b.r*0.3, 0, Math.PI*2); ctx.fill(); ctx.restore();
      });

      // Float texts
      G.floats.forEach(f => {
        ctx.save(); ctx.globalAlpha = Math.min(1, f.life*2);
        ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 2; ctx.strokeText(f.text, f.x, f.y);
        ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y); ctx.restore();
      });

      // HUD
      ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, 0, W, 20);
      ctx.fillStyle = '#ff88ff'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('🪙' + Math.floor(G.coins), 6, 14);
      const s = Math.ceil(G.t); ctx.textAlign = 'right'; ctx.fillStyle = G.t < 20 ? '#ff4444' : '#fff';
      ctx.fillText(Math.floor(s/60)+':'+(s%60<10?'0':'')+s%60, W-6, 14);
      ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('🎱×'+G.balls.length, W/2, 14);
      ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(0, H-3, W, 3);
      ctx.fillStyle = G.t < 20 ? '#f33' : '#cc44ff'; ctx.fillRect(0, H-3, W*(G.t/START_TIME), 3);

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [phase]);

  useEffect(() => { pinPreloadAssets(); }, []);
  useEffect(() => () => { bgm.stop(); if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);
  useEffect(() => { if (phase === "done") { onScore(score); const t = setTimeout(onClose, 3000); return () => clearTimeout(t); } }, [phase]);   // scoreを依存から外す(done後のscore変動でonScore二重発火するのを防止)

  return (
    <div style={{ textAlign: 'center' }}>
      <div className="st" style={{ justifyContent: 'center' }}>🎱 ピンボール</div>
      {phase === "ready" && (
        <>
          <p style={{ fontSize: 11, opacity: 0.5, margin: '12px 0', lineHeight: 1.8 }}>
            バンパーに当ててコイン獲得！<br/>
            左右ボタンでフリッパー操作<br/>
            球を落とさないように！制限時間: 1分10秒
          </p>
          <button className="btn bp" onClick={startGame}>スタート！</button>
        </>
      )}
      {phase === "play" && (
        <div style={{ marginTop: 4, touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}>
          <canvas ref={canvasRef} width={W} height={H}
            style={{ borderRadius: 10, border: '2px solid rgba(200,0,200,0.2)', touchAction: 'none', width: '100%', maxHeight: 'calc(100vh - 220px)',
              boxShadow: '0 0 20px rgba(200,0,200,0.15)' }} />
          <div style={{ display: 'flex', gap: 6, marginTop: 6, position: 'sticky', bottom: 90 }}>
            <button onPointerDown={e => { e.preventDefault(); leftRef.current = true; }}
              onPointerUp={() => { leftRef.current = false; }} onPointerCancel={() => { leftRef.current = false; }}
              style={{ flex: 1, height: 60, borderRadius: 14, border: 'none', fontSize: 22, fontWeight: 900, color: '#fff', cursor: 'pointer', touchAction: 'none',
                background: 'linear-gradient(135deg, #6600aa, #440088)', boxShadow: '0 4px 16px rgba(150,0,200,0.3)' }}>
              ◀ 左
            </button>
            <button onPointerDown={e => { e.preventDefault(); rightRef.current = true; }}
              onPointerUp={() => { rightRef.current = false; }} onPointerCancel={() => { rightRef.current = false; }}
              style={{ flex: 1, height: 60, borderRadius: 14, border: 'none', fontSize: 22, fontWeight: 900, color: '#fff', cursor: 'pointer', touchAction: 'none',
                background: 'linear-gradient(135deg, #6600aa, #440088)', boxShadow: '0 4px 16px rgba(150,0,200,0.3)' }}>
              右 ▶
            </button>
          </div>
        </div>
      )}
      {phase === "done" && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#ff88ff', marginBottom: 8 }}>🏁 RESULT</div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>🪙 {score.toLocaleString()}</div>
          <p style={{ fontSize: 12, opacity: 0.5 }}>
            {score >= 3200 ? '🏆 MASTER！' : score >= 2500 ? '🥇 エキスパート！' : score >= 1800 ? '🥈 グッドプレイ！' : score >= 1100 ? '🥉 もう少し！' : '💪 練習あるのみ！'}
          </p>
        </div>
      )}
    </div>
  );
}

// A5: レーン背景・判定ライン(金帯)・落下宝石アイテム画像。無ければ現行の描画/絵文字のまま(progressive enhancement)。
const GC_LANE_SRC = 'assets/games/gem-lane.webp';
const GC_LINE_SRC = 'assets/games/gem-line.webp';
const GC_ITEM_SRCS = Array.from({ length: 10 }, (_, i) => `assets/items/it-gem-${String(i + 1).padStart(2, '0')}.webp`);
const GC_LANE_IMG = { img: null, loaded: false };
const GC_LINE_IMG = { img: null, loaded: false };
const GC_ITEM_IMGS = GC_ITEM_SRCS.map(() => ({ img: null, loaded: false }));
let gcAssetsStarted = false;
function gcPreloadAssets() {
  if (gcAssetsStarted || typeof window === 'undefined') return;
  gcAssetsStarted = true;
  const loadOne = (src, state) => {
    try {
      const img = new Image();
      img.onload = () => { state.loaded = true; };
      img.onerror = () => {};
      img.src = src;
      state.img = img;
    } catch (e) {}
  };
  loadOne(GC_LANE_SRC, GC_LANE_IMG);
  loadOne(GC_LINE_SRC, GC_LINE_IMG);
  GC_ITEM_SRCS.forEach((src, i) => loadOne(src, GC_ITEM_IMGS[i]));
}
function GemCatchGame({ onScore, onClose }) {
  const [phase, setPhase] = useState("ready");
  const [earned, setEarned] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [stats, setStats] = useState({ perfect: 0, good: 0, miss: 0 });
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [floats, setFloats] = useState([]);

  const gemsRef = useRef([]);
  const earnedRef = useRef(0);
  const statsRef = useRef({ perfect: 0, good: 0, miss: 0 });
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const spawnRef = useRef(null);
  const fid = useRef(0);
  const canvasRef = useRef(null);
  const lastFrameRef = useRef(0);

  const LANES = 3;
  const GAME_H = 380;
  const HIT_Y = GAME_H - 100;
  const PERFECT_RANGE = 20;
  const GOOD_RANGE = 44;
  const PERFECT_COIN = 6;
  const GOOD_COIN = 3;
  const DURATION = 20;

  // Gem colors for bright glow
  const GEM_DATA = [
    { icon: '💎', glow: '#60a5fa' },
    { icon: '🔴', glow: '#f87171' },
    { icon: '🔵', glow: '#3b82f6' },
    { icon: '💚', glow: '#4ade80' },
    { icon: '🟣', glow: '#c084fc' },
    { icon: '✨', glow: '#fbbf24' },
    { icon: '💫', glow: '#f472b6' },
  ];

  const startGame = () => {
    setPhase("play"); setEarned(0); setTimeLeft(DURATION); setCombo(0); setMaxCombo(0);
    setStats({ perfect: 0, good: 0, miss: 0 });
    earnedRef.current = 0; statsRef.current = { perfect: 0, good: 0, miss: 0 };
    comboRef.current = 0; maxComboRef.current = 0;
    gemsRef.current = []; lastFrameRef.current = Date.now();
    startRef.current = Date.now();
    bgm.playLoop(GEM_BGM, 130);

    let beatCount = 0;
    const beatMs = 60000 / 130;
    const spawn = () => {
      if (!startRef.current) return;
      const elapsed = (Date.now() - startRef.current) / 1000;
      if (elapsed > DURATION - 1.5) return;

      const phase = elapsed / DURATION; // 0→1 progress
      const difficulty = Math.min(phase * 1.5, 1); // ramp up

      // Speed: huge variation. Slow=80, fast=380. More fast ones later.
      const baseMin = 80 + difficulty * 60;
      const baseMax = 200 + difficulty * 180;
      const speed = baseMin + Math.random() * (baseMax - baseMin);

      // Choose lanes - sometimes spawn 2 or 3 simultaneously
      const lanes = [Math.floor(Math.random() * LANES)];
      if (difficulty > 0.3 && Math.random() < 0.25 + difficulty * 0.2) {
        // Add a second lane (different from first)
        let l2;
        do { l2 = Math.floor(Math.random() * LANES); } while (l2 === lanes[0]);
        lanes.push(l2);
      }
      if (difficulty > 0.7 && Math.random() < 0.1) {
        // Rare triple spawn
        const missing = [0, 1, 2].filter(l => !lanes.includes(l));
        if (missing.length > 0) lanes.push(missing[0]);
      }

      lanes.forEach(lane => {
        const gd = GEM_DATA[Math.floor(Math.random() * GEM_DATA.length)];
        // Each gem in a multi-spawn can have different speed
        const gemSpeed = lanes.length > 1 ? speed * (0.7 + Math.random() * 0.6) : speed;
        // A5: 使えるアイテム画像があればランダムで1つ割り当て(無ければ絵文字のまま)
        const loadedItemIdxs = [];
        for (let ii = 0; ii < GC_ITEM_IMGS.length; ii++) { if (GC_ITEM_IMGS[ii].loaded) loadedItemIdxs.push(ii); }
        const itemImgIdx = loadedItemIdxs.length ? loadedItemIdxs[Math.floor(Math.random() * loadedItemIdxs.length)] : null;
        gemsRef.current.push({
          id: ++fid.current, lane, y: -30, speed: gemSpeed,
          icon: gd.icon, glow: gd.glow, size: 30 + Math.random() * 6,
          itemImgIdx,
          hit: false, missed: false
        });
      });

      beatCount++;
      // Rhythm variation: skip, double, normal
      let nextDelay;
      if (beatCount % 8 === 0) nextDelay = beatMs * 0.35; // double tap
      else if (beatCount % 5 === 3) nextDelay = beatMs * 1.4; // breath
      else if (beatCount % 3 === 0 && difficulty > 0.5) nextDelay = beatMs * 0.6; // fast section
      else nextDelay = beatMs * (0.8 + Math.random() * 0.4);
      spawnRef.current = setTimeout(spawn, nextDelay);
    };
    spawnRef.current = setTimeout(spawn, 400);

    // Game loop
    const loop = () => {
      const now = Date.now();
      const dt = Math.min((now - lastFrameRef.current) / 1000, 0.05);
      lastFrameRef.current = now;
      const elapsed = (now - startRef.current) / 1000;
      const rem = Math.max(0, DURATION - elapsed);
      setTimeLeft(rem);

      // Update gems
      gemsRef.current.forEach(g => {
        if (!g.hit && !g.missed) g.y += g.speed * dt;
        if (!g.hit && !g.missed && g.y > HIT_Y + GOOD_RANGE + 25) {
          g.missed = true;
          statsRef.current.miss++;
          comboRef.current = 0;
          setCombo(0);
          setStats({ ...statsRef.current });
        }
      });
      gemsRef.current = gemsRef.current.filter(g => !(g.missed && g.y > GAME_H + 40) && !(g.hit && g.y < -50));

      // Draw
      const cvs = canvasRef.current;
      if (cvs) {
        const ctx = cvs.getContext('2d');
        const w = cvs.width, h = cvs.height;
        ctx.clearRect(0, 0, w, h);
        const lw = w / LANES;

        // Lane backgrounds
        if (GC_LANE_IMG.loaded && GC_LANE_IMG.img) {
          ctx.drawImage(GC_LANE_IMG.img, 0, 0, w, h);
        } else {
          // (subtle)
          for (let i = 0; i < LANES; i++) {
            ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.005)';
            ctx.fillRect(i * lw, 0, lw, h);
          }
        }

        // Hit line (金帯画像 or 現行のグロー+ライン)
        if (GC_LINE_IMG.loaded && GC_LINE_IMG.img) {
          ctx.drawImage(GC_LINE_IMG.img, 0, HIT_Y - 30, w, 60);
        } else {
          const grad = ctx.createLinearGradient(0, HIT_Y - 30, 0, HIT_Y + 30);
          grad.addColorStop(0, 'rgba(167,139,250,0)');
          grad.addColorStop(0.4, 'rgba(167,139,250,0.12)');
          grad.addColorStop(0.5, 'rgba(167,139,250,0.18)');
          grad.addColorStop(0.6, 'rgba(167,139,250,0.12)');
          grad.addColorStop(1, 'rgba(167,139,250,0)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, HIT_Y - 30, w, 60);

          ctx.strokeStyle = 'rgba(167,139,250,0.7)';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(0, HIT_Y); ctx.lineTo(w, HIT_Y); ctx.stroke();
        }

        // Lane dividers
        for (let i = 1; i < LANES; i++) {
          ctx.strokeStyle = 'rgba(255,255,255,0.06)';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(i * lw, 0); ctx.lineTo(i * lw, h); ctx.stroke();
        }

        // Gems with glow
        gemsRef.current.forEach(g => {
          if (g.hit) return;
          const x = (g.lane + 0.5) * lw;
          const alpha = g.missed ? 0.15 : 1;

          // Glow circle
          if (!g.missed) {
            ctx.save();
            ctx.globalAlpha = 0.35;
            ctx.shadowColor = g.glow;
            ctx.shadowBlur = 18;
            ctx.beginPath();
            ctx.arc(x, g.y, 14, 0, Math.PI * 2);
            ctx.fillStyle = g.glow;
            ctx.fill();
            ctx.restore();
          }

          // Gem (item image if available, else emoji)
          ctx.globalAlpha = alpha;
          const gemItemState = g.itemImgIdx != null ? GC_ITEM_IMGS[g.itemImgIdx] : null;
          if (gemItemState && gemItemState.loaded && gemItemState.img) {
            const d = g.size * 1.3;
            ctx.drawImage(gemItemState.img, x - d / 2, g.y - d / 2, d, d);
          } else {
            ctx.font = `${g.size}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(g.icon, x, g.y);
          }
          ctx.globalAlpha = 1;
        });

        // Lane tap indicators
        for (let i = 0; i < LANES; i++) {
          ctx.fillStyle = 'rgba(167,139,250,0.15)';
          ctx.beginPath();
          ctx.arc((i + 0.5) * lw, HIT_Y, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(167,139,250,0.3)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      if (rem > 0) {
        rafRef.current = requestAnimationFrame(loop);
      } else {
        bgm.stop(); sfx('gameFinish');
        setPhase("done");
        setEarned(earnedRef.current);
        setStats({ ...statsRef.current });
        setMaxCombo(maxComboRef.current);
      }
    };
    rafRef.current = requestAnimationFrame(loop);
  };

  // Process a tap at a specific X position on the canvas
  const phaseRef = useRef("ready");
  phaseRef.current = phase;

  const processTapAtX = useCallback((clientX) => {
    if (phaseRef.current !== "play") return;
    const cvs = canvasRef.current;
    if (!cvs) return;
    const rect = cvs.getBoundingClientRect();
    const scaleX = cvs.width / rect.width;
    const tapX = (clientX - rect.left) * scaleX;
    const tapLane = Math.max(0, Math.min(Math.floor(tapX / (cvs.width / LANES)), LANES - 1));

    let closest = null, closestDist = Infinity;
    gemsRef.current.forEach(g => {
      if (g.hit || g.missed || g.lane !== tapLane) return;
      const dist = Math.abs(g.y - HIT_Y);
      if (dist < GOOD_RANGE + 10 && dist < closestDist) { closest = g; closestDist = dist; }
    });
    if (!closest) return;
    closest.hit = true;

    let coins = 0, label = '', color = '';
    if (closestDist <= PERFECT_RANGE) {
      coins = PERFECT_COIN; label = 'PERFECT'; color = '#fbbf24';
      statsRef.current.perfect++;
      playNote(523, 0.08, 'sine', 0.12); playNote(784, 0.12, 'sine', 0.1, 0.04);
    } else {
      coins = GOOD_COIN; label = 'GOOD'; color = '#a78bfa';
      statsRef.current.good++;
      playNote(440, 0.08, 'sine', 0.08);
    }

    comboRef.current++;
    if (comboRef.current > maxComboRef.current) maxComboRef.current = comboRef.current;
    // 5コンボから+4コインボーナス
    if (comboRef.current >= 5) { coins += 4; }

    earnedRef.current += coins;
    setEarned(earnedRef.current);
    setCombo(comboRef.current);
    setStats({ ...statsRef.current });

    const id = ++fid.current;
    const fx = (tapLane + 0.5) * (100 / LANES);
    label += ' +' + coins;
    if (comboRef.current >= 10) label += '🔥';
    else if (comboRef.current >= 5) label += '✨';
    setFloats(p => [...p, { id, label, color, x: fx }]);
    setTimeout(() => setFloats(p => p.filter(f => f.id !== id)), 600);
  }, []);

  // Handle click (mouse/desktop)
  const handleTap = useCallback((e) => {
    processTapAtX(e.clientX);
  }, [processTapAtX]);

  // Handle touch (mobile) - use changedTouches for new touches only
  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
    const touches = e.changedTouches || e.touches;
    for (let i = 0; i < touches.length; i++) {
      processTapAtX(touches[i].clientX);
    }
  }, [processTapAtX]);

  useEffect(() => { gcPreloadAssets(); }, []);
  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    clearTimeout(spawnRef.current);
    bgm.stop();
  }, []);
  useEffect(() => { if (phase === "done") { onScore(earned); const t = setTimeout(onClose, 2000); return () => clearTimeout(t); } }, [phase]);

  return (
    <div style={{ textAlign: 'center' }}>
      <div className="st" style={{ justifyContent: 'center' }}>💎 ジュエルキャッチ</div>
      {phase === "ready" && (
        <>
          <p style={{ fontSize: 12, opacity: 0.5, margin: '16px 0' }}>
            落ちてくる宝石をリズムよくキャッチ！20秒<br/>
            PERFECT = 🪙8 ／ GOOD = 🪙4 ／ 5コンボから+5ボーナス
          </p>
          <button className="btn bp" onClick={startGame}>スタート！</button>
        </>
      )}
      {phase === "play" && (
        <div style={{ position: 'relative' }}>
          <div className="sr">
            <div className="sb">⏱️ {timeLeft.toFixed(1)}s</div>
            <div className="sb">🪙 {earned}</div>
            <div className="sb" style={{ color: combo >= 15 ? '#fbbf24' : combo >= 10 ? '#f472b6' : combo >= 5 ? '#ec4899' : '#a78bfa' }}>
              {combo > 0 ? `🔥${combo}` : '-'}
            </div>
          </div>
          <div className="tb"><div className="tf" style={{ width: `${(timeLeft / DURATION) * 100}%` }} /></div>
          <div style={{ position: 'relative', marginTop: 8, display: 'inline-block' }}>
            <canvas ref={canvasRef} width={300} height={GAME_H}
              style={{ borderRadius: 14, background: 'rgba(6,6,15,0.85)', border: '1px solid rgba(167,139,250,0.2)', touchAction: 'none', maxWidth: '100%', marginBottom: 20 }}
              onClick={handleTap} onTouchStart={handleTouchStart} />
            {floats.map(f => (
              <div key={f.id} className="ft" style={{ color: f.color, left: `${f.x}%`, top: '70%', fontSize: 12, fontWeight: 900 }}>{f.label}</div>
            ))}
          </div>
        </div>
      )}
      {phase === "done" && (
        <>
          <div style={{ fontSize: 44, margin: '16px 0' }}>💎</div>
          <p style={{ fontSize: 20, fontWeight: 900, color: '#fbbf24' }}>🪙 {earned} コイン獲得！</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, margin: '12px 0', fontSize: 13 }}>
            <div><span style={{ color: '#fbbf24', fontWeight: 700 }}>PERFECT</span><br/>{stats.perfect}</div>
            <div><span style={{ color: '#a78bfa', fontWeight: 700 }}>GOOD</span><br/>{stats.good}</div>
            <div><span style={{ color: '#ef4444', fontWeight: 700 }}>MISS</span><br/>{stats.miss}</div>
          </div>
          <p style={{ fontSize: 12, opacity: 0.5 }}>最大コンボ: 🔥{maxCombo}</p>
        </>
      )}
    </div>
  );
}
