// ============================================================
// TAP GAME
// ============================================================
function TapGame({ onScore, onClose }) {
  const [phase, setPhase] = useState("ready");
  const [timeLeft, setTimeLeft] = useState(10);
  const [earned, setEarned] = useState(0);
  const [taps, setTaps] = useState(0);
  const [floats, setFloats] = useState([]);
  const [shakeKey, setShakeKey] = useState(0);
  const [gems, setGems] = useState([]);
  const fid = useRef(0);
  const gid = useRef(0);
  const timer = useRef(null);
  const start0 = useRef(null);

  const GEM_ICONS = ['💎','🪙','⭐','💰','🔮','👑','🏆','💫','✨','🌟'];

  const startGame = () => {
    setPhase("play"); setTimeLeft(10); setEarned(0); setTaps(0); setGems([]);
    bgm.playLoop(BGM_TAP, 160);
    start0.current = Date.now();
    timer.current = setInterval(() => {
      const rem = Math.max(0, 10 - (Date.now() - start0.current) / 1000);
      setTimeLeft(rem);
      if (rem <= 0) { clearInterval(timer.current); bgm.stop(); sfx('gameFinish'); setPhase("done"); }
    }, 50);
  };
  useEffect(() => () => { clearInterval(timer.current); bgm.stop(); }, []);
  useEffect(() => { if (phase === "done") { onScore(earned); const t = setTimeout(onClose, 2000); return () => clearTimeout(t); } }, [phase]);

  const handleTap = () => {
    if (phase !== "play") return;
    setTaps(t => t + 1);
    setShakeKey(k => k + 1);
    const r = Math.random();
    let bonus = 1, label = "+1", snd = "tap", color = "#fff", gemCount = 1;
    if (r < 0.001) { bonus = 80; label = "+80!!!"; snd = "tapBonus100"; color = "#f1c40f"; gemCount = 8; }
    else if (r < 0.008) { bonus = 6; label = "+6!"; snd = "tapBonus10"; color = "#e84393"; gemCount = 5; }
    else if (r < 0.018) { bonus = 4; label = "+4!"; snd = "tapBonus6"; color = "#e74c3c"; gemCount = 4; }
    else if (r < 0.048) { bonus = 3; label = "+3"; snd = "tapBonus4"; color = "#9b59b6"; gemCount = 3; }
    else if (r < 0.118) { bonus = 2; label = "+2"; snd = "tapBonus2"; color = "#3498db"; gemCount = 2; }
    sfx(snd);
    setEarned(e => e + bonus);
    const id = ++fid.current;
    setFloats(p => [...p, { id, label, color, x: 30 + Math.random() * 40, y: 10 + Math.random() * 30 }]);
    setTimeout(() => setFloats(p => p.filter(f => f.id !== id)), 800);
    // Spawn falling gems
    const newGems = [];
    for (let i = 0; i < gemCount; i++) {
      newGems.push({
        id: ++gid.current,
        icon: GEM_ICONS[Math.floor(Math.random() * GEM_ICONS.length)],
        x: 10 + Math.random() * 80,
        delay: i * 50,
        size: 12 + Math.random() * 10,
        duration: 600 + Math.random() * 400,
      });
    }
    setGems(p => [...p, ...newGems]);
    newGems.forEach(g => setTimeout(() => setGems(p => p.filter(gg => gg.id !== g.id)), g.duration + g.delay + 100));
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div className="st" style={{ justifyContent: 'center' }}>⛏️ 連打バトル</div>
      {phase === "ready" && (
        <>
          <p style={{ fontSize: 12, opacity: 0.5, margin: '16px 0' }}>岩を叩いて宝石を掘り出せ！10秒間！</p>
          <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)',
            borderRadius: 10, padding: '8px 12px', margin: '0 0 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: '#a78bfa', marginBottom: 2 }}>👆👆 同時タップ対応！</div>
            <div style={{ fontSize: 9, opacity: 0.5 }}>複数の指で同時にタップすると、その分カウントされます</div>
          </div>
          <button className="btn bp" onClick={startGame}>スタート！</button>
        </>
      )}
      {phase === "play" && (
        <div style={{ position: 'relative', overflow: 'hidden', minHeight: 350 }}>
          <div className="sr">
            <div className="sb">⏱️ {timeLeft.toFixed(1)}s</div>
            <div className="sb">🪙 {earned}</div>
            <div className="sb">⛏️ {taps}</div>
          </div>
          <div className="tb"><div className="tf" style={{ width: `${(timeLeft / 10) * 100}%` }} /></div>
          {/* Falling gems */}
          {gems.map(g => (
            <div key={g.id} style={{
              position: 'absolute', left: `${g.x}%`, top: '30%', fontSize: g.size,
              animation: `gemFall ${g.duration}ms ease-out ${g.delay}ms forwards`,
              pointerEvents: 'none', zIndex: 0, opacity: 0.9,
              filter: 'drop-shadow(0 0 3px rgba(255,215,0,0.4))',
            }}>{g.icon}</div>
          ))}
          {/* Full-width tap area */}
          <div onTouchStart={e => { e.preventDefault(); for (let i = 0; i < Math.min(e.touches.length, 3); i++) handleTap(); }}
            onClick={e => { if (!('ontouchstart' in window)) handleTap(); }}
            style={{ position: 'relative', marginTop: 12, cursor: 'pointer', userSelect: 'none', WebkitUserSelect: 'none', zIndex: 1, touchAction: 'none' }}>
            {/* Rock/ore */}
            <div key={shakeKey} style={{
              width: 200, height: 200, margin: '0 auto', borderRadius: '50%',
              background: 'radial-gradient(circle at 40% 35%, #8B7355, #5C4033, #3B2A1A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 72, position: 'relative', overflow: 'hidden',
              boxShadow: '0 8px 30px rgba(0,0,0,0.5), inset 0 -4px 10px rgba(0,0,0,0.3), inset 0 4px 8px rgba(255,255,255,0.05)',
              animation: 'rareShake 0.15s ease-out',
            }}>
              {/* Rock texture by damage stage (progressive enhancement: hidden until asset exists) */}
              <img key={`rock-img-${taps >= 60 ? 3 : taps >= 25 ? 2 : 1}`}
                src={`assets/games/tap-rock${taps >= 60 ? 3 : taps >= 25 ? 2 : 1}.webp`} alt=""
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
                onError={e => { e.currentTarget.style.display = 'none'; }} />
              {/* Gem veins on rock (kept above the rock texture image) */}
              <div style={{ position: 'absolute', width: 12, height: 12, background: 'rgba(139,92,246,0.4)', borderRadius: '50%', top: '25%', left: '30%', filter: 'blur(2px)', zIndex: 1 }} />
              <div style={{ position: 'absolute', width: 8, height: 8, background: 'rgba(251,191,36,0.4)', borderRadius: '50%', top: '60%', right: '25%', filter: 'blur(2px)', zIndex: 1 }} />
              <div style={{ position: 'absolute', width: 10, height: 10, background: 'rgba(96,165,250,0.3)', borderRadius: '50%', bottom: '30%', left: '25%', filter: 'blur(2px)', zIndex: 1 }} />
              <span style={{ position: 'relative', zIndex: 2 }}>⛏️</span>
            </div>
            {/* Extended tap zone (invisible) */}
            <div style={{ position: 'absolute', inset: -20, zIndex: 2 }} />
            {/* Float texts */}
            {floats.map(f => (
              <div key={f.id} className="ft" style={{ color: f.color, left: `${f.x}%`, top: `${f.y}%`, zIndex: 10 }}>{f.label}</div>
            ))}
          </div>
          {/* Tap hint */}
          <div style={{ fontSize: 11, opacity: 0.3, marginTop: 8 }}>どこでもタップ！</div>
        </div>
      )}
      {phase === "done" && (
        <>
          <div style={{ fontSize: 44, margin: '16px 0' }}>💎</div>
          <p style={{ fontSize: 18, fontWeight: 900, color: '#f1c40f' }}>🪙 {earned} コイン獲得！</p>
          <p style={{ fontSize: 12, opacity: 0.5 }}>採掘回数: {taps}回</p>
        </>
      )}
    </div>
  );
}

// ============================================================
// KUKU GAME (計算ゲーム【初級】九九)
// ============================================================
function KukuGame({ onScore, onClose }) {
  const [phase, setPhase] = useState("ready");
  const [timeLeft, setTimeLeft] = useState(20);
  const [prob, setProb] = useState(null);
  const [ans, setAns] = useState("");
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [earned, setEarned] = useState(0);
  const [fb, setFb] = useState("");
  const inp = useRef(null);
  const timer = useRef(null);
  const st = useRef(null);

  const gen = () => {
    const a = 1 + Math.floor(Math.random() * 9); // 1-9
    const b = 1 + Math.floor(Math.random() * 9); // 1-9
    return { text: `${a} × ${b}`, answer: a * b };
  };

  const startGame = () => {
    setPhase("play"); setTimeLeft(20); setCorrect(0); setStreak(0); setEarned(0); setAns(""); setProb(gen()); setFb("");
    bgm.playLoop(BGM_CALC, 120);
    st.current = Date.now();
    timer.current = setInterval(() => {
      const rem = Math.max(0, 20 - (Date.now() - st.current) / 1000);
      setTimeLeft(rem);
      if (rem <= 0) { clearInterval(timer.current); bgm.stop(); sfx('gameFinish'); setPhase("done"); }
    }, 50);
    setTimeout(() => inp.current?.focus(), 100);
  };
  useEffect(() => () => { clearInterval(timer.current); bgm.stop(); }, []);
  useEffect(() => { if (phase === "done") { onScore(earned); const t = setTimeout(onClose, 2000); return () => clearTimeout(t); } }, [phase]);

  const check = (v) => {
    if (!prob) return;
    const n = parseInt(v);
    if (isNaN(n)) return;
    if (n === prob.answer) {
      const ns = streak + 1;
      const bonus = ns >= 4 ? 13 : 0;
      if (ns >= 4) sfx('correctStreak'); else sfx('correct');
      setCorrect(c => c + 1); setStreak(ns); setEarned(e => e + 26 + bonus); setFb(bonus > 0 ? "⭕+13" : "⭕");
    } else { sfx('wrong'); setStreak(0); setFb("❌"); }
    setAns(""); setProb(gen());
    setTimeout(() => setFb(""), 400);
    setTimeout(() => inp.current?.focus(), 50);
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div className="st" style={{ justifyContent: 'center' }}>🔢 計算ゲーム【初級】九九</div>
      {phase === "ready" && (
        <>
          <p style={{ fontSize: 12, opacity: 0.5, margin: '16px 0' }}>20秒間で九九を解こう！<br/>1問正解 = 🪙26コイン（4連続で+13）</p>
          <button className="btn bp" onClick={startGame}>スタート！</button>
        </>
      )}
      {phase === "play" && (
        <>
          <div className="sr">
            <div className="sb">⏱️ {timeLeft.toFixed(1)}s</div>
            <div className="sb">✅ {correct}</div>
            <div className="sb">🔥 {streak}連続</div>
          </div>
          <div className="tb"><div className="tf" style={{ width: `${(timeLeft / 20) * 100}%` }} /></div>
          <div style={{ position: 'relative', marginTop: 16 }}>
            {fb && <div style={{ position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)', fontSize: 36 }}>{fb}</div>}
            {/* アセット: 計器盤の9スライス石板枠(panel.webp)。border-image未ロード時は下のborderColorがそのまま床(現状表示のまま) */}
            {prob && (
              <div style={{ display: 'inline-block', padding: '4px 26px', borderRadius: 6,
                border: '2px solid rgba(139,92,246,0.22)',
                borderImage: 'url(assets/god-another/panel.webp) 60 fill / 9px stretch', borderWidth: 9, borderStyle: 'solid' }}>
                <div className="md">{prob.text} = ?</div>
              </div>
            )}
            <input ref={inp} className="mi" type="number" inputMode="numeric" value={ans}
              onChange={e => {
                const v = e.target.value;
                setAns(v);
                if (v.length > 0 && prob) {
                  const ansStr = String(prob.answer);
                  if (v.length >= ansStr.length) {
                    check(v);
                  }
                }
              }} onKeyDown={e => e.key === 'Enter' && check(ans)} placeholder="答え" autoComplete="off" />
          </div>
        </>
      )}
      {phase === "done" && (
        <>
          <div style={{ fontSize: 44, margin: '16px 0' }}>🧠</div>
          <p style={{ fontSize: 18, fontWeight: 900, color: '#fbbf24' }}>🪙 {earned} コイン獲得！</p>
          <p style={{ fontSize: 12, opacity: 0.5 }}>正解数: {correct}問</p>
        </>
      )}
    </div>
  );
}

// ============================================================
// MATH MID GAME (計算ゲーム【中級】足し算引き算)
// ============================================================
function MathMidGame({ onScore, onClose }) {
  const [phase, setPhase] = useState("ready");
  const [timeLeft, setTimeLeft] = useState(20);
  const [prob, setProb] = useState(null);
  const [ans, setAns] = useState("");
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [earned, setEarned] = useState(0);
  const [fb, setFb] = useState("");
  const inp = useRef(null);
  const timer = useRef(null);
  const st = useRef(null);

  const gen = () => {
    const a = 10 + Math.floor(Math.random() * 90);
    const b = 10 + Math.floor(Math.random() * 90);
    if (Math.random() > 0.5) {
      return { text: `${a} + ${b}`, answer: a + b };
    } else {
      const big = Math.max(a, b);
      const small = Math.min(a, b);
      return { text: `${big} − ${small}`, answer: big - small };
    }
  };

  const startGame = () => {
    setPhase("play"); setTimeLeft(25); setCorrect(0); setStreak(0); setEarned(0); setAns(""); setProb(gen()); setFb("");
    bgm.playLoop(BGM_CALC, 110);
    st.current = Date.now();
    timer.current = setInterval(() => {
      const rem = Math.max(0, 25 - (Date.now() - st.current) / 1000);
      setTimeLeft(rem);
      if (rem <= 0) { clearInterval(timer.current); bgm.stop(); sfx('gameFinish'); setPhase("done"); }
    }, 50);
    setTimeout(() => inp.current?.focus(), 100);
  };
  useEffect(() => () => { clearInterval(timer.current); bgm.stop(); }, []);
  useEffect(() => { if (phase === "done") { onScore(earned); const t = setTimeout(onClose, 2000); return () => clearTimeout(t); } }, [phase]);

  const check = (v) => {
    if (!prob) return;
    const n = parseInt(v);
    if (isNaN(n)) return;
    if (n === prob.answer) {
      const ns = streak + 1;
      const bonus = ns >= 4 ? 30 : 0;
      if (ns >= 4) sfx('correctStreak'); else sfx('correct');
      setCorrect(c => c + 1); setStreak(ns); setEarned(e => e + 60 + bonus); setFb(bonus > 0 ? "⭕+30" : "⭕");
    } else { sfx('wrong'); setStreak(0); setFb("❌"); }
    setAns(""); setProb(gen());
    setTimeout(() => setFb(""), 400);
    setTimeout(() => inp.current?.focus(), 50);
  };


  return (
    <div style={{ textAlign: 'center' }}>
      <div className="st" style={{ justifyContent: 'center' }}>📐 計算ゲーム【中級】足し算引き算</div>
      {phase === "ready" && (
        <>
          <p style={{ fontSize: 12, opacity: 0.5, margin: '16px 0' }}>25秒間で2桁の足し算・引き算を解こう！<br/>1問正解 = 🪙60コイン（4連続で+30）</p>
          <button className="btn bp" onClick={startGame}>スタート！</button>
        </>
      )}
      {phase === "play" && (
        <>
          <div className="sr">
            <div className="sb">⏱️ {timeLeft.toFixed(1)}s</div>
            <div className="sb">✅ {correct}</div>
            <div className="sb">🔥 {streak}連続</div>
          </div>
          <div className="tb"><div className="tf" style={{ width: `${(timeLeft / 20) * 100}%` }} /></div>
          <div style={{ position: 'relative', marginTop: 16 }}>
            {fb && <div style={{ position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)', fontSize: 36 }}>{fb}</div>}
            {/* アセット: 計器盤の9スライス石板枠(panel.webp)。border-image未ロード時は下のborderColorがそのまま床(現状表示のまま) */}
            {prob && (
              <div style={{ display: 'inline-block', padding: '4px 26px', borderRadius: 6,
                border: '2px solid rgba(139,92,246,0.22)',
                borderImage: 'url(assets/god-another/panel.webp) 60 fill / 9px stretch', borderWidth: 9, borderStyle: 'solid' }}>
                <div className="md">{prob.text} = ?</div>
              </div>
            )}
            <input ref={inp} className="mi" type="number" inputMode="numeric" value={ans}
              onChange={e => {
                const v = e.target.value;
                setAns(v);
                if (v.length > 0 && prob) {
                  const ansStr = String(prob.answer);
                  if (v.length >= ansStr.length) {
                    check(v);
                  }
                }
              }} onKeyDown={e => e.key === 'Enter' && check(ans)} placeholder="答え" autoComplete="off" />
          </div>
        </>
      )}
      {phase === "done" && (
        <>
          <div style={{ fontSize: 44, margin: '16px 0' }}>🧠</div>
          <p style={{ fontSize: 18, fontWeight: 900, color: '#fbbf24' }}>🪙 {earned} コイン獲得！</p>
          <p style={{ fontSize: 12, opacity: 0.5 }}>正解数: {correct}問</p>
        </>
      )}
    </div>
  );
}

// ============================================================
// MATH EASY GAME (計算ゲーム【初級】足し算引き算 2桁±1桁)
// ============================================================
function MathEasyGame({ onScore, onClose }) {
  const [phase, setPhase] = useState("ready");
  const [timeLeft, setTimeLeft] = useState(20);
  const [prob, setProb] = useState(null);
  const [ans, setAns] = useState("");
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [earned, setEarned] = useState(0);
  const [fb, setFb] = useState("");
  const inp = useRef(null);
  const timer = useRef(null);
  const st = useRef(null);

  const gen = () => {
    const a = 10 + Math.floor(Math.random() * 90); // 10-99
    const b = 1 + Math.floor(Math.random() * 9);   // 1-9
    if (Math.random() > 0.5) {
      return { text: `${a} + ${b}`, answer: a + b };
    } else {
      return { text: `${a} − ${b}`, answer: a - b };
    }
  };

  const startGame = () => {
    setPhase("play"); setTimeLeft(20); setCorrect(0); setStreak(0); setEarned(0); setAns(""); setProb(gen()); setFb("");
    bgm.playLoop(BGM_CALC, 120);
    st.current = Date.now();
    timer.current = setInterval(() => {
      const rem = Math.max(0, 20 - (Date.now() - st.current) / 1000);
      setTimeLeft(rem);
      if (rem <= 0) { clearInterval(timer.current); bgm.stop(); sfx('gameFinish'); setPhase("done"); }
    }, 50);
    setTimeout(() => inp.current?.focus(), 100);
  };
  useEffect(() => () => { clearInterval(timer.current); bgm.stop(); }, []);
  useEffect(() => { if (phase === "done") { onScore(earned); const t = setTimeout(onClose, 2000); return () => clearTimeout(t); } }, [phase]);

  const check = (v) => {
    if (!prob) return;
    const n = parseInt(v);
    if (isNaN(n)) return;
    if (n === prob.answer) {
      const ns = streak + 1;
      const bonus = ns >= 4 ? 18 : 0;
      if (ns >= 4) sfx('correctStreak'); else sfx('correct');
      setCorrect(c => c + 1); setStreak(ns); setEarned(e => e + 36 + bonus); setFb(bonus > 0 ? "⭕+18" : "⭕");
    } else { sfx('wrong'); setStreak(0); setFb("❌"); }
    setAns(""); setProb(gen());
    setTimeout(() => setFb(""), 400);
    setTimeout(() => inp.current?.focus(), 50);
  };



  return (
    <div style={{ textAlign: 'center' }}>
      <div className="st" style={{ justifyContent: 'center' }}>➕ 計算ゲーム【初級】足し算引き算</div>
      {phase === "ready" && (
        <>
          <p style={{ fontSize: 12, opacity: 0.5, margin: '16px 0' }}>20秒間で2桁±1桁を解こう！<br/>1問正解 = 🪙36コイン（4連続で+18）</p>
          <button className="btn bp" onClick={startGame}>スタート！</button>
        </>
      )}
      {phase === "play" && (
        <>
          <div className="sr">
            <div className="sb">⏱️ {timeLeft.toFixed(1)}s</div>
            <div className="sb">✅ {correct}</div>
            <div className="sb">🔥 {streak}連続</div>
          </div>
          <div className="tb"><div className="tf" style={{ width: `${(timeLeft / 20) * 100}%` }} /></div>
          <div style={{ position: 'relative', marginTop: 16 }}>
            {fb && <div style={{ position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)', fontSize: 36 }}>{fb}</div>}
            {/* アセット: 計器盤の9スライス石板枠(panel.webp)。border-image未ロード時は下のborderColorがそのまま床(現状表示のまま) */}
            {prob && (
              <div style={{ display: 'inline-block', padding: '4px 26px', borderRadius: 6,
                border: '2px solid rgba(139,92,246,0.22)',
                borderImage: 'url(assets/god-another/panel.webp) 60 fill / 9px stretch', borderWidth: 9, borderStyle: 'solid' }}>
                <div className="md">{prob.text} = ?</div>
              </div>
            )}
            <input ref={inp} className="mi" type="number" inputMode="numeric" value={ans}
              onChange={e => {
                const v = e.target.value;
                setAns(v);
                if (v.length > 0 && prob) {
                  const ansStr = String(prob.answer);
                  if (v.length >= ansStr.length) {
                    check(v);
                  }
                }
              }} onKeyDown={e => e.key === 'Enter' && check(ans)} placeholder="答え" autoComplete="off" />
          </div>
        </>
      )}
      {phase === "done" && (
        <>
          <div style={{ fontSize: 44, margin: '16px 0' }}>🧠</div>
          <p style={{ fontSize: 18, fontWeight: 900, color: '#fbbf24' }}>🪙 {earned} コイン獲得！</p>
          <p style={{ fontSize: 12, opacity: 0.5 }}>正解数: {correct}問</p>
        </>
      )}
    </div>
  );
}

// ============================================================
// MATH HARD ADD/SUB GAME (計算ゲーム【上級】足し算引き算 2桁±2桁)
// ============================================================
function MathHardAddGame({ onScore, onClose }) {
  const [phase, setPhase] = useState("ready");
  const [timeLeft, setTimeLeft] = useState(20);
  const [prob, setProb] = useState(null);
  const [ans, setAns] = useState("");
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [earned, setEarned] = useState(0);
  const [fb, setFb] = useState("");
  const inp = useRef(null);
  const timer = useRef(null);
  const st = useRef(null);

  const gen = () => {
    const a = 100 + Math.floor(Math.random() * 900);
    const b = 10 + Math.floor(Math.random() * 90);
    if (Math.random() > 0.5) {
      return { text: `${a} + ${b}`, answer: a + b };
    } else {
      return { text: `${a} − ${b}`, answer: a - b };
    }
  };

  const startGame = () => {
    setPhase("play"); setTimeLeft(30); setCorrect(0); setStreak(0); setEarned(0); setAns(""); setProb(gen()); setFb("");
    bgm.playLoop(BGM_CALC, 100);
    st.current = Date.now();
    timer.current = setInterval(() => {
      const rem = Math.max(0, 30 - (Date.now() - st.current) / 1000);
      setTimeLeft(rem);
      if (rem <= 0) { clearInterval(timer.current); bgm.stop(); sfx('gameFinish'); setPhase("done"); }
    }, 50);
    setTimeout(() => inp.current?.focus(), 100);
  };
  useEffect(() => () => { clearInterval(timer.current); bgm.stop(); }, []);
  useEffect(() => { if (phase === "done") { onScore(earned); const t = setTimeout(onClose, 2000); return () => clearTimeout(t); } }, [phase]);

  const check = (v) => {
    if (!prob) return;
    const n = parseInt(v);
    if (isNaN(n)) return;
    if (n === prob.answer) {
      const ns = streak + 1;
      const bonus = ns >= 4 ? 50 : 0;
      if (ns >= 4) sfx('correctStreak'); else sfx('correct');
      setCorrect(c => c + 1); setStreak(ns); setEarned(e => e + 100 + bonus); setFb(bonus > 0 ? "⭕+50" : "⭕");
    } else { sfx('wrong'); setStreak(0); setFb("❌"); }
    setAns(""); setProb(gen());
    setTimeout(() => setFb(""), 400);
    setTimeout(() => inp.current?.focus(), 50);
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div className="st" style={{ justifyContent: 'center' }}>🧮 計算ゲーム【上級】足し算引き算</div>
      {phase === "ready" && (
        <>
          <p style={{ fontSize: 12, opacity: 0.5, margin: '16px 0' }}>30秒間で3桁±2桁を解こう！<br/>1問正解 = 🪙100コイン（4連続で+50）</p>
          <button className="btn bp" onClick={startGame}>スタート！</button>
        </>
      )}
      {phase === "play" && (
        <>
          <div className="sr">
            <div className="sb">⏱️ {timeLeft.toFixed(1)}s</div>
            <div className="sb">✅ {correct}</div>
            <div className="sb">🔥 {streak}連続</div>
          </div>
          <div className="tb"><div className="tf" style={{ width: `${(timeLeft / 20) * 100}%` }} /></div>
          <div style={{ position: 'relative', marginTop: 16 }}>
            {fb && <div style={{ position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)', fontSize: 36 }}>{fb}</div>}
            {/* アセット: 計器盤の9スライス石板枠(panel.webp)。border-image未ロード時は下のborderColorがそのまま床(現状表示のまま) */}
            {prob && (
              <div style={{ display: 'inline-block', padding: '4px 26px', borderRadius: 6,
                border: '2px solid rgba(139,92,246,0.22)',
                borderImage: 'url(assets/god-another/panel.webp) 60 fill / 9px stretch', borderWidth: 9, borderStyle: 'solid' }}>
                <div className="md">{prob.text} = ?</div>
              </div>
            )}
            <input ref={inp} className="mi" type="number" inputMode="numeric" value={ans}
              onChange={e => {
                const v = e.target.value;
                setAns(v);
                if (v.length > 0 && prob) {
                  const ansStr = String(prob.answer);
                  if (v.length >= ansStr.length) {
                    check(v);
                  }
                }
              }} onKeyDown={e => e.key === 'Enter' && check(ans)} placeholder="答え" autoComplete="off" />
          </div>
        </>
      )}
      {phase === "done" && (
        <>
          <div style={{ fontSize: 44, margin: '16px 0' }}>🧮</div>
          <p style={{ fontSize: 18, fontWeight: 900, color: '#fbbf24' }}>🪙 {earned} コイン獲得！</p>
          <p style={{ fontSize: 12, opacity: 0.5 }}>正解数: {correct}問</p>
        </>
      )}
    </div>
  );
}

// ============================================================
// MATH HARD MULT/DIV GAME (計算ゲーム【上級】掛け算割り算 2桁×1桁, 2桁÷1桁)
// ============================================================
function MathHardMultGame({ onScore, onClose }) {
  const [phase, setPhase] = useState("ready");
  const [timeLeft, setTimeLeft] = useState(20);
  const [prob, setProb] = useState(null);
  const [ans, setAns] = useState("");
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [earned, setEarned] = useState(0);
  const [fb, setFb] = useState("");
  const inp = useRef(null);
  const timer = useRef(null);
  const st = useRef(null);

  const gen = () => {
    if (Math.random() > 0.5) {
      // 2桁(20-99) × 1桁(3-9)
      const a = 20 + Math.floor(Math.random() * 80);
      const b = 3 + Math.floor(Math.random() * 7); // 3-9
      return { text: `${a} × ${b}`, answer: a * b };
    } else {
      // 3桁 ÷ 1桁 (割り切れる問題のみ)
      const b = 3 + Math.floor(Math.random() * 7); // 3-9
      const quotient = 10 + Math.floor(Math.random() * 90); // 商が10-99
      const a = quotient * b;
      return { text: `${a} ÷ ${b}`, answer: quotient };
    }
  };

  const startGame = () => {
    setPhase("play"); setTimeLeft(30); setCorrect(0); setStreak(0); setEarned(0); setAns(""); setProb(gen()); setFb("");
    bgm.playLoop(BGM_CALC, 100);
    st.current = Date.now();
    timer.current = setInterval(() => {
      const rem = Math.max(0, 30 - (Date.now() - st.current) / 1000);
      setTimeLeft(rem);
      if (rem <= 0) { clearInterval(timer.current); bgm.stop(); sfx('gameFinish'); setPhase("done"); }
    }, 50);
    setTimeout(() => inp.current?.focus(), 100);
  };
  useEffect(() => () => { clearInterval(timer.current); bgm.stop(); }, []);
  useEffect(() => { if (phase === "done") { onScore(earned); const t = setTimeout(onClose, 2000); return () => clearTimeout(t); } }, [phase]);

  const check = (v) => {
    if (!prob) return;
    const n = parseInt(v);
    if (isNaN(n)) return;
    if (n === prob.answer) {
      const ns = streak + 1;
      const bonus = ns >= 4 ? 40 : 0;
      if (ns >= 4) sfx('correctStreak'); else sfx('correct');
      setCorrect(c => c + 1); setStreak(ns); setEarned(e => e + 80 + bonus); setFb(bonus > 0 ? "⭕+40" : "⭕");
    } else { sfx('wrong'); setStreak(0); setFb("❌"); }
    setAns(""); setProb(gen());
    setTimeout(() => setFb(""), 400);
    setTimeout(() => inp.current?.focus(), 50);
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div className="st" style={{ justifyContent: 'center' }}>✖️ 計算ゲーム【上級】掛け算割り算</div>
      {phase === "ready" && (
        <>
          <p style={{ fontSize: 12, opacity: 0.5, margin: '16px 0' }}>30秒間で大きな掛け算・割り算を解こう！<br/>1問正解 = 🪙80コイン（4連続で+40）</p>
          <button className="btn bp" onClick={startGame}>スタート！</button>
        </>
      )}
      {phase === "play" && (
        <>
          <div className="sr">
            <div className="sb">⏱️ {timeLeft.toFixed(1)}s</div>
            <div className="sb">✅ {correct}</div>
            <div className="sb">🔥 {streak}連続</div>
          </div>
          <div className="tb"><div className="tf" style={{ width: `${(timeLeft / 20) * 100}%` }} /></div>
          <div style={{ position: 'relative', marginTop: 16 }}>
            {fb && <div style={{ position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)', fontSize: 36 }}>{fb}</div>}
            {/* アセット: 計器盤の9スライス石板枠(panel.webp)。border-image未ロード時は下のborderColorがそのまま床(現状表示のまま) */}
            {prob && (
              <div style={{ display: 'inline-block', padding: '4px 26px', borderRadius: 6,
                border: '2px solid rgba(139,92,246,0.22)',
                borderImage: 'url(assets/god-another/panel.webp) 60 fill / 9px stretch', borderWidth: 9, borderStyle: 'solid' }}>
                <div className="md">{prob.text} = ?</div>
              </div>
            )}
            <input ref={inp} className="mi" type="number" inputMode="numeric" value={ans}
              onChange={e => {
                const v = e.target.value;
                setAns(v);
                if (v.length > 0 && prob) {
                  const ansStr = String(prob.answer);
                  if (v.length >= ansStr.length) {
                    check(v);
                  }
                }
              }} onKeyDown={e => e.key === 'Enter' && check(ans)} placeholder="答え" autoComplete="off" />
          </div>
        </>
      )}
      {phase === "done" && (
        <>
          <div style={{ fontSize: 44, margin: '16px 0' }}>✖️</div>
          <p style={{ fontSize: 18, fontWeight: 900, color: '#fbbf24' }}>🪙 {earned} コイン獲得！</p>
          <p style={{ fontSize: 12, opacity: 0.5 }}>正解数: {correct}問</p>
        </>
      )}
    </div>
  );
}

// ============================================================
// TIMING GAME (ルパンタイマー) - 体内時計チャレンジ
// ============================================================
const TIMING_TARGETS = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0];
const TIMING_BGM = [
  {n:220,b:0,d:0.2,t:'sine',v:0.03},{n:277,b:1,d:0.2,t:'sine',v:0.03},
  {n:330,b:2,d:0.2,t:'sine',v:0.03},{n:277,b:3,d:0.2,t:'sine',v:0.03},
  {n:247,b:4,d:0.2,t:'sine',v:0.03},{n:311,b:5,d:0.2,t:'sine',v:0.03},
  {n:370,b:6,d:0.3,t:'sine',v:0.035},{n:330,b:7,d:0.2,t:'sine',v:0.03},
  {n:147,b:0,d:0.6,t:'triangle',v:0.025},{n:165,b:4,d:0.6,t:'triangle',v:0.025},
];
const TOTAL_TAPS = 10;

function TimingGame({ onScore, onClose }) {
  const [phase, setPhase] = useState("ready");
  const [taps, setTaps] = useState([]);
  const [tapCount, setTapCount] = useState(0);
  const [coinEffects, setCoinEffects] = useState([]);
  const startRef = useRef(null);
  const endTimerRef = useRef(null);
  const tapsRef = useRef([]);
  tapsRef.current = taps;
  const lastTapTime = useRef(0);
  const ceid = useRef(0);

  const getScore = (diff) => {
    if (diff === 0) return { coins: 40, label: "PERFECT!", color: "#fbbf24" };
    if (diff <= 0.1) return { coins: 16, label: "GREAT!", color: "#4ade80" };
    if (diff <= 0.2) return { coins: 12, label: "GOOD!", color: "#60a5fa" };
    if (diff <= 0.4) return { coins: 8, label: "OK", color: "#a78bfa" };
    if (diff <= 0.5) return { coins: 4, label: "CLOSE", color: "#94a3b8" };
    return { coins: 0, label: "MISS", color: "#ef4444" };
  };

  const calcPerfectBonus = (tapList) => {
    const pc = tapList.filter(t => t.diff === 0).length;
    if (pc >= 10) return { bonus: 320, label: "ALL PERFECT!! +320" };
    if (pc >= 7) return { bonus: 80, label: "7 PERFECT! +80" };
    if (pc >= 5) return { bonus: 65, label: "5 PERFECT! +65" };
    if (pc >= 3) return { bonus: 40, label: "3 PERFECT +40" };
    return { bonus: 0, label: "" };
  };

  const finishGame = (tapList) => {
    clearTimeout(endTimerRef.current);
    bgm.stop(); sfx('gameFinish');
    while (tapList.length < TOTAL_TAPS) {
      const target = TIMING_TARGETS[tapList.length];
      tapList.push({ time: -1, target, diff: 99, coins: 0, label: "MISS", color: "#ef4444" });
    }
    setTaps(tapList);
    setPhase("done");
  };

  const startGame = () => {
    setPhase("playing"); setTaps([]); setTapCount(0);
    tapsRef.current = []; lastTapTime.current = 0;
    startRef.current = Date.now();
    bgm.playLoop(TIMING_BGM, 80);
    endTimerRef.current = setTimeout(() => finishGame([...tapsRef.current]), 12000);
  };

  const handleTap = () => {
    if (phase !== "playing") return;
    const now = Date.now();
    if (now - lastTapTime.current < 300) return;
    lastTapTime.current = now;
    const current = tapsRef.current;
    if (current.length >= TOTAL_TAPS) return;

    const elapsed = (now - startRef.current) / 1000;
    const tapTime = Math.round(elapsed * 10) / 10;
    const target = TIMING_TARGETS[current.length];
    const diff = Math.round(Math.abs(tapTime - target) * 10) / 10;
    const score = getScore(diff);

    if (diff === 0) {
      sfx('reveal10');
      // Gold coin slam effect for PERFECT
      const coins = [];
      for (let ci = 0; ci < 6; ci++) {
        coins.push({ id: ++ceid.current, x: 20 + Math.random() * 60, delay: ci * 60, size: 16 + Math.random() * 12 });
      }
      setCoinEffects(p => [...p, ...coins]);
      coins.forEach(c => setTimeout(() => setCoinEffects(p => p.filter(cc => cc.id !== c.id)), 800 + c.delay));
    } else if (diff <= 0.1) {
      sfx('correctStreak');
      // Smaller coin effect for GREAT
      const coins = [];
      for (let ci = 0; ci < 3; ci++) {
        coins.push({ id: ++ceid.current, x: 25 + Math.random() * 50, delay: ci * 80, size: 12 + Math.random() * 8 });
      }
      setCoinEffects(p => [...p, ...coins]);
      coins.forEach(c => setTimeout(() => setCoinEffects(p => p.filter(cc => cc.id !== c.id)), 700 + c.delay));
    } else if (diff <= 0.2) sfx('correct');
    else if (diff <= 0.5) playNote(330, 0.1, 'sine', 0.08);
    else sfx('wrong');

    const entry = { time: tapTime, target, diff, ...score };
    const newTaps = [...current, entry];
    setTaps(newTaps);
    tapsRef.current = newTaps;
    setTapCount(newTaps.length);

    if (newTaps.length >= TOTAL_TAPS) {
      setTimeout(() => finishGame(newTaps), 800);
    }
  };

  useEffect(() => () => { clearTimeout(endTimerRef.current); bgm.stop(); }, []);

  const baseCoins = taps.reduce((s, t) => s + t.coins, 0);
  const { bonus: perfectBonus, label: bonusLabel } = calcPerfectBonus(taps);
  const totalCoins = baseCoins + (phase === "done" ? perfectBonus : 0);

  useEffect(() => { if (phase === "done") { onScore(totalCoins); const t = setTimeout(onClose, 2000); return () => clearTimeout(t); } }, [phase]);

  return (
    <div style={{ textAlign: 'center' }}>
      <div className="st" style={{ justifyContent: 'center' }}>⏱️ ルパンタイマー</div>

      {phase === "ready" && (
        <>
          <p style={{ fontSize: 12, opacity: 0.5, margin: '16px 0' }}>
            スタートから頭の中で秒数を数えて<br/>
            1秒〜10秒のタイミングで10回タップ！<br/>
            表示は一切ナシ！体内時計勝負！
          </p>
          <div style={{ fontSize: 10, opacity: 0.4, margin: '8px 0', lineHeight: 1.8 }}>
            ぴったり=🪙50 / ±0.1s=🪙25 / ±0.2s=🪙15 / ±0.4s=🪙10 / ±0.5s=🪙5<br/>
            PERFECT 3個+50 / 5個+80 / 7個+150 / ALL+400
          </div>
          <button className="btn bp" onClick={startGame}>スタート！</button>
        </>
      )}

      {phase === "playing" && (
        <div>
          {/* Target indicators - 2 rows of 5 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginBottom: 20, maxWidth: 300, margin: '0 auto 20px' }}>
            {TIMING_TARGETS.map((t, i) => {
              const result = taps[i];
              const current = i === tapCount;
              return (
                <div key={i} style={{
                  width: 50, height: 46, borderRadius: 10, position: 'relative',
                  background: result ? (result.diff === 0 ? 'linear-gradient(180deg, rgba(255,215,0,0.15), rgba(255,215,0,0.05))' : `${result.color}15`) : current ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `2px solid ${result ? (result.diff === 0 ? '#ffd700' : result.color) : current ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: result && result.diff === 0 ? '0 0 10px rgba(255,215,0,0.3), inset 0 0 8px rgba(255,215,0,0.1)' : 'none',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}>
                  {result && result.diff === 0 && <div style={{ fontSize: 16, position: 'absolute', top: -2 }}>🪙</div>}
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 12, fontWeight: 900,
                    color: result ? (result.diff === 0 ? '#ffd700' : result.color) : current ? '#c084fc' : 'rgba(255,255,255,0.2)',
                    marginTop: result && result.diff === 0 ? 8 : 0 }}>
                    {t}s
                  </div>
                  {result && <div style={{ fontSize: 6, color: result.diff === 0 ? '#ffd700' : result.color, fontWeight: 700 }}>{result.label}</div>}
                </div>
              );
            })}
          </div>

          {/* Tap button */}
          <div style={{
            width: 180, height: 180, borderRadius: '50%', margin: '0 auto 16px',
            background: tapCount < TOTAL_TAPS ? 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(236,72,153,0.1))' : 'rgba(255,255,255,0.05)',
            border: `3px solid ${tapCount < TOTAL_TAPS ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.1)'}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: tapCount < TOTAL_TAPS ? 'pointer' : 'default',
            userSelect: 'none',
          }}
            onPointerDown={e => { e.preventDefault(); handleTap(); }}>
            <div style={{ fontSize: 36, marginBottom: 4 }}>👆</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#a78bfa' }}>
              {tapCount < TOTAL_TAPS ? `TAP (${tapCount}/${TOTAL_TAPS})` : '完了！'}
            </div>
          </div>

          {/* Falling coin effects */}
          {coinEffects.map(c => (
            <div key={c.id} style={{
              position: 'absolute', left: `${c.x}%`, top: '35%', fontSize: c.size,
              animation: `gemFall 700ms ease-out ${c.delay}ms forwards`,
              pointerEvents: 'none', zIndex: 20,
              filter: 'drop-shadow(0 0 4px rgba(255,215,0,0.5))',
            }}>🪙</div>
          ))}

          {/* Last tap result */}
          {taps.length > 0 && (() => {
            const last = taps[taps.length - 1];
            return (
              <div style={{ fontSize: 16, fontWeight: 900, color: last.color, animation: 'ri 0.3s ease-out',
                textShadow: last.diff === 0 ? '0 0 10px rgba(255,215,0,0.5)' : 'none' }}>
                {last.diff === 0 ? '🪙 ' : ''}{last.time}秒 → {last.label} +🪙{last.coins}
              </div>
            );
          })()}

          <div style={{ fontSize: 11, opacity: 0.3, marginTop: 12 }}>
            目を閉じて、心の中で数えよう...
          </div>
        </div>
      )}

      {phase === "done" && (
        <>
          <div style={{ fontSize: 44, margin: '16px 0' }}>⏱️</div>
          <p style={{ fontSize: 20, fontWeight: 900, color: '#fbbf24' }}>🪙 {totalCoins} コイン獲得！</p>

          {/* Perfect bonus */}
          {perfectBonus > 0 && (
            <div style={{ margin: '8px auto', padding: '6px 16px', borderRadius: 12, display: 'inline-block',
              background: perfectBonus >= 1000 ? 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(236,72,153,0.15))' : 'rgba(251,191,36,0.1)',
              border: `1px solid ${perfectBonus >= 1000 ? '#fbbf24' : 'rgba(251,191,36,0.3)'}`,
            }}>
              <span className={perfectBonus >= 1000 ? 'rank-rainbow' : ''} style={{ fontSize: 14, fontWeight: 900, color: '#fbbf24' }}>
                🏆 {bonusLabel}
              </span>
            </div>
          )}

          <div style={{ maxWidth: 340, margin: '12px auto' }}>
            {taps.map((r, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px',
                borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 12,
              }}>
                <span style={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 700, width: 32, color: '#a78bfa', fontSize: 11 }}>
                  {r.target}s
                </span>
                <span style={{ fontFamily: "'Orbitron',sans-serif", width: 42, fontSize: 11 }}>
                  {r.time >= 0 ? r.time + 's' : '-'}
                </span>
                <span style={{ width: 44, fontSize: 10, opacity: 0.5 }}>
                  {r.time >= 0 ? (r.diff === 0 ? '±0.0s' : `±${r.diff}s`) : '-'}
                </span>
                <span style={{ color: r.color, fontWeight: 700, flex: 1, textAlign: 'right', fontSize: 11 }}>
                  {r.label}
                </span>
                <span style={{ color: '#fbbf24', fontWeight: 700, width: 32, textAlign: 'right', fontSize: 11 }}>
                  +{r.coins}
                </span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, opacity: 0.5, marginTop: 8 }}>
            PERFECT: {taps.filter(r => r.diff === 0).length} ／
            GREAT: {taps.filter(r => r.diff > 0 && r.diff <= 0.1).length} ／
            GOOD: {taps.filter(r => r.diff > 0.1 && r.diff <= 0.2).length}
          </p>
        </>
      )}
    </div>
  );
}

// ============================================================
// GEM CATCH GAME (ジュエルキャッチ)
// ============================================================
// Shooting Gallery BGM: Upbeat action melody BPM140
const SHOOTING_BGM = [
  {n:262,b:0,d:0.12,t:'square',v:0.03},{n:330,b:0.5,d:0.12,t:'square',v:0.03},
  {n:392,b:1,d:0.12,t:'square',v:0.035},{n:330,b:1.5,d:0.12,t:'square',v:0.03},
  {n:294,b:2,d:0.12,t:'square',v:0.03},{n:370,b:2.5,d:0.12,t:'square',v:0.03},
  {n:440,b:3,d:0.15,t:'square',v:0.035},{n:392,b:3.5,d:0.12,t:'square',v:0.03},
  {n:262,b:4,d:0.12,t:'square',v:0.03},{n:349,b:4.5,d:0.12,t:'square',v:0.03},
  {n:392,b:5,d:0.12,t:'square',v:0.035},{n:349,b:5.5,d:0.12,t:'square',v:0.03},
  {n:330,b:6,d:0.12,t:'square',v:0.03},{n:294,b:6.5,d:0.12,t:'square',v:0.03},
  {n:262,b:7,d:0.25,t:'square',v:0.04},
  {n:131,b:0,d:0.3,t:'triangle',v:0.025},{n:147,b:2,d:0.3,t:'triangle',v:0.025},
  {n:131,b:4,d:0.3,t:'triangle',v:0.025},{n:165,b:6,d:0.3,t:'triangle',v:0.025},
];

// Coin Tower BGM: Upbeat stacking rhythm
const BGM_TOWER = [
  {n:262,b:0,d:0.1,t:'square',v:0.05},{n:330,b:0.5,d:0.1,t:'square',v:0.04},
  {n:392,b:1,d:0.1,t:'square',v:0.05},{n:330,b:1.5,d:0.1,t:'square',v:0.04},
  {n:294,b:2,d:0.1,t:'square',v:0.05},{n:370,b:2.5,d:0.1,t:'square',v:0.04},
  {n:440,b:3,d:0.1,t:'square',v:0.05},{n:370,b:3.5,d:0.1,t:'square',v:0.04},
  {n:330,b:4,d:0.1,t:'square',v:0.05},{n:392,b:4.5,d:0.1,t:'square',v:0.04},
  {n:494,b:5,d:0.12,t:'square',v:0.05},{n:392,b:5.5,d:0.1,t:'square',v:0.04},
  {n:262,b:6,d:0.1,t:'square',v:0.05},{n:330,b:6.5,d:0.1,t:'square',v:0.04},
  {n:392,b:7,d:0.15,t:'square',v:0.05},
  {n:131,b:0,d:0.4,t:'triangle',v:0.03},{n:147,b:2,d:0.4,t:'triangle',v:0.03},
  {n:165,b:4,d:0.4,t:'triangle',v:0.03},{n:131,b:6,d:0.4,t:'triangle',v:0.03},
];

const BUBBLE_BGM = [
  {n:392,b:0,d:0.15,t:'sine',v:0.02},{n:440,b:0.5,d:0.1,t:'sine',v:0.018},
  {n:494,b:1,d:0.15,t:'sine',v:0.02},{n:440,b:1.5,d:0.1,t:'sine',v:0.018},
  {n:523,b:2,d:0.15,t:'sine',v:0.022},{n:494,b:2.5,d:0.1,t:'sine',v:0.018},
  {n:440,b:3,d:0.2,t:'sine',v:0.022},{n:392,b:3.5,d:0.1,t:'sine',v:0.018},
  {n:349,b:4,d:0.15,t:'sine',v:0.02},{n:392,b:4.5,d:0.1,t:'sine',v:0.018},
  {n:440,b:5,d:0.15,t:'sine',v:0.02},{n:494,b:5.5,d:0.1,t:'sine',v:0.018},
  {n:523,b:6,d:0.2,t:'sine',v:0.022},{n:440,b:6.5,d:0.1,t:'sine',v:0.018},
  {n:392,b:7,d:0.3,t:'sine',v:0.025},
  {n:196,b:0,d:0.5,t:'triangle',v:0.015},{n:220,b:2,d:0.5,t:'triangle',v:0.015},
  {n:247,b:4,d:0.5,t:'triangle',v:0.015},{n:196,b:6,d:0.5,t:'triangle',v:0.015},
];

const BUBBLE_REWARDS = [0, 4, 8, 12, 16, 24, 40, 60, 88, 128, 176, 240];

const QUICKDRAW_BGM = [
  {n:220,b:0,d:0.25,t:'triangle',v:0.03},{n:208,b:1,d:0.25,t:'triangle',v:0.03},
  {n:196,b:2,d:0.25,t:'triangle',v:0.03},{n:208,b:3,d:0.25,t:'triangle',v:0.03},
  {n:220,b:4,d:0.25,t:'triangle',v:0.03},{n:262,b:5,d:0.2,t:'triangle',v:0.025},
  {n:247,b:6,d:0.25,t:'triangle',v:0.03},{n:220,b:7,d:0.4,t:'triangle',v:0.035},
  {n:110,b:0,d:0.3,t:'sine',v:0.025},{n:110,b:2,d:0.3,t:'sine',v:0.025},
  {n:131,b:4,d:0.3,t:'sine',v:0.025},{n:110,b:6,d:0.3,t:'sine',v:0.025},
];

const DRAW_REWARDS = [
  { maxMs: 200, coins: 104, label: '神速！', color: '#ffd700' },
  { maxMs: 250, coins: 84, label: '超速い！', color: '#4ade80' },
  { maxMs: 300, coins: 64, label: '速い！', color: '#60a5fa' },
  { maxMs: 350, coins: 44, label: 'まあまあ', color: '#a78bfa' },
  { maxMs: 550, coins: 24, label: '遅い...', color: '#94a3b8' },
  { maxMs: 9999, coins: 8, label: 'ギリギリ', color: '#64748b' },
];

const MEMORY_BGM = [
  {n:330,b:0,d:0.15,t:'sine',v:0.025},{n:392,b:0.5,d:0.1,t:'sine',v:0.02},
  {n:440,b:1,d:0.15,t:'sine',v:0.025},{n:392,b:1.5,d:0.1,t:'sine',v:0.02},
  {n:349,b:2,d:0.15,t:'sine',v:0.025},{n:440,b:2.5,d:0.1,t:'sine',v:0.02},
  {n:494,b:3,d:0.2,t:'sine',v:0.03},{n:440,b:3.5,d:0.1,t:'sine',v:0.02},
  {n:392,b:4,d:0.15,t:'sine',v:0.025},{n:330,b:4.5,d:0.1,t:'sine',v:0.02},
  {n:349,b:5,d:0.15,t:'sine',v:0.025},{n:392,b:5.5,d:0.1,t:'sine',v:0.02},
  {n:440,b:6,d:0.15,t:'sine',v:0.025},{n:494,b:6.5,d:0.1,t:'sine',v:0.02},
  {n:523,b:7,d:0.3,t:'sine',v:0.03},
  {n:165,b:0,d:0.5,t:'triangle',v:0.018},{n:196,b:2,d:0.5,t:'triangle',v:0.018},
  {n:220,b:4,d:0.5,t:'triangle',v:0.018},{n:165,b:6,d:0.5,t:'triangle',v:0.018},
];

const MEMORY_CARDS = [
  { id: 'A', icon: '💎', name: 'ダイヤモンド', color: '#60a5fa' },
  { id: 'B', icon: '👑', name: '王冠', color: '#fbbf24' },
  { id: 'C', icon: '🏺', name: '秘宝', color: '#e67e22' },
  { id: 'D', icon: '🔮', name: '水晶球', color: '#c084fc' },
  { id: 'E', icon: '⭐', name: '黄金の星', color: '#f59e0b' },
  { id: 'F', icon: '🗝️', name: '古代の鍵', color: '#4ade80' },
];

const GEM_BGM = [
  {n:196,b:0,d:0.15,t:'sine',v:0.04},{n:262,b:0.5,d:0.15,t:'sine',v:0.035},
  {n:330,b:1,d:0.15,t:'sine',v:0.04},{n:262,b:1.5,d:0.15,t:'sine',v:0.035},
  {n:220,b:2,d:0.15,t:'sine',v:0.04},{n:294,b:2.5,d:0.15,t:'sine',v:0.035},
  {n:349,b:3,d:0.15,t:'sine',v:0.04},{n:294,b:3.5,d:0.15,t:'sine',v:0.035},
  {n:247,b:4,d:0.15,t:'sine',v:0.04},{n:330,b:4.5,d:0.15,t:'sine',v:0.035},
  {n:392,b:5,d:0.2,t:'sine',v:0.045},{n:330,b:5.5,d:0.15,t:'sine',v:0.035},
  {n:262,b:6,d:0.15,t:'sine',v:0.04},{n:349,b:6.5,d:0.15,t:'sine',v:0.035},
  {n:392,b:7,d:0.3,t:'sine',v:0.045},
  {n:131,b:0,d:0.4,t:'triangle',v:0.03},{n:147,b:2,d:0.4,t:'triangle',v:0.03},
  {n:165,b:4,d:0.4,t:'triangle',v:0.03},{n:131,b:6,d:0.4,t:'triangle',v:0.03},
];

// ============================================================
// SHOOTING GALLERY GAME
// ============================================================
function ShootingGame({ onScore, onClose }) {
  const [phase, setPhase] = useState("ready");
  const [earned, setEarned] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [stats, setStats] = useState({ balloon: 0, target: 0, ufo: 0, gold: 0 });
  const [floats, setFloats] = useState([]);

  const canvasRef = useRef(null);
  const targetsRef = useRef([]);
  const earnedRef = useRef(0);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const statsRef = useRef({ balloon: 0, target: 0, ufo: 0, gold: 0 });
  const startRef = useRef(null);
  const rafRef = useRef(null);
  const spawnRef = useRef(null);
  const fid = useRef(0);
  const lastFrameRef = useRef(0);
  const particlesRef = useRef([]);
  const lastTapTimeRef = useRef(0);

  const DURATION = 20;
  const CANVAS_W = 300;
  const CANVAS_H = 400;

  const spawnTarget = (elapsed) => {
    const phase = elapsed / DURATION;
    const r = Math.random() * 100;
    let type, icon, size, fontSize, vx, vy, glow, coins, x, y;

    if (phase > 0.66 && r < 3) {
      // Gold star - only after 10s
      type = 'gold'; icon = '⭐'; size = 11; fontSize = 22; glow = '#fbbf24'; coins = 29;
      x = 30 + Math.random() * (CANVAS_W - 60);
      y = 30 + Math.random() * (CANVAS_H - 60);
      vx = (Math.random() - 0.5) * 2;
      vy = (Math.random() - 0.5) * 1.5;
    } else if (r < 3 + 12) {
      // UFO
      type = 'ufo'; icon = '🛸'; size = 15; fontSize = 30; glow = '#60a5fa'; coins = 14;
      const dir = Math.random() > 0.5 ? 1 : -1;
      x = dir > 0 ? -20 : CANVAS_W + 20;
      y = 30 + Math.random() * (CANVAS_H * 0.5);
      vx = dir * (3 + Math.random() * 2 + phase * 2);
      vy = 0;
    } else if (r < 3 + 12 + 25) {
      // Target
      type = 'target'; icon = '🎯'; size = 17; fontSize = 34; glow = '#f87171'; coins = 8;
      x = 30 + Math.random() * (CANVAS_W - 60);
      y = 50 + Math.random() * (CANVAS_H - 120);
      vx = 0; vy = 0;
    } else {
      // Balloon (50% cut in last 10 seconds)
      if (phase > 0.5 && Math.random() < 0.5) return;
      type = 'balloon'; icon = '🎈'; size = 20; fontSize = 40; glow = '#f472b6'; coins = 3;
      x = 20 + Math.random() * (CANVAS_W - 40);
      y = CANVAS_H + 20;
      vx = 0; vy = -(0.5 + Math.random() * 0.5 + phase * 0.5);
    }

    targetsRef.current.push({
      id: ++fid.current, type, icon, x, y, size, fontSize, vx, vy, glow, coins,
      spawnTime: Date.now(), alive: true
    });
  };

  const startGame = () => {
    setPhase("play"); setEarned(0); setTimeLeft(DURATION); setCombo(0); setMaxCombo(0);
    setStats({ balloon: 0, target: 0, ufo: 0, gold: 0 });
    earnedRef.current = 0; comboRef.current = 0; maxComboRef.current = 0;
    statsRef.current = { balloon: 0, target: 0, ufo: 0, gold: 0 };
    targetsRef.current = []; particlesRef.current = [];
    lastFrameRef.current = Date.now();
    startRef.current = Date.now();
    bgm.playLoop(SHOOTING_BGM, 140);

    // Spawn loop
    let spawnCount = 0;
    const beatMs = 60000 / 140;
    const scheduleSpawn = () => {
      if (!startRef.current) return;
      const elapsed = (Date.now() - startRef.current) / 1000;
      if (elapsed > DURATION - 0.5) return;
      const phase = elapsed / DURATION;

      // Spawn 1-4 targets based on difficulty
      const count = phase < 0.33 ? (Math.random() < 0.5 ? 1 : 2)
                  : phase < 0.66 ? (1 + Math.floor(Math.random() * 2.5))
                  : (2 + Math.floor(Math.random() * 2.5));
      for (let i = 0; i < count; i++) spawnTarget(elapsed);
      spawnCount++;

      const interval = phase < 0.33 ? beatMs * 1.2 : phase < 0.66 ? beatMs * 0.9 : beatMs * 0.7;
      spawnRef.current = setTimeout(scheduleSpawn, interval);
    };
    spawnRef.current = setTimeout(scheduleSpawn, 300);

    // Game loop
    const loop = () => {
      const now = Date.now();
      const dt = Math.min((now - lastFrameRef.current) / 1000, 0.05);
      lastFrameRef.current = now;
      const elapsed = (now - startRef.current) / 1000;
      const rem = Math.max(0, DURATION - elapsed);
      setTimeLeft(rem);
      const time = elapsed;

      // Update targets
      targetsRef.current.forEach(t => {
        if (!t.alive) return;
        const age = (now - t.spawnTime) / 1000;
        if (t.type === 'balloon') {
          t.y += t.vy * 60 * dt;
          t.x += Math.sin(age * 2) * 1.5 * dt * 60;
        } else if (t.type === 'target') {
          const spd = 1 + elapsed / DURATION;
          t.x += Math.sin(age * 3) * spd * dt * 60;
          t.y += Math.cos(age * 1.5) * 0.5 * dt * 60;
        } else if (t.type === 'ufo') {
          t.x += t.vx * dt * 60;
        } else if (t.type === 'gold') {
          t.x += (Math.sin(age * 5) * 2 + t.vx) * dt * 60;
          t.y += (Math.cos(age * 4) * 2 + t.vy) * dt * 60;
        }
      });
      // Remove off-screen
      targetsRef.current = targetsRef.current.filter(t => {
        if (!t.alive) return false;
        if (t.y < -50 || t.y > CANVAS_H + 50 || t.x < -50 || t.x > CANVAS_W + 50) return false;
        return true;
      });

      // Update particles
      particlesRef.current.forEach(p => {
        p.x += p.vx * dt * 60;
        p.y += p.vy * dt * 60;
        p.life -= dt;
      });
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);

      // Draw
      const cvs = canvasRef.current;
      if (cvs) {
        const ctx = cvs.getContext('2d');
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

        // Background
        ctx.fillStyle = 'rgba(6,6,15,0.85)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        // Stars background
        for (let i = 0; i < 20; i++) {
          const sx = (i * 47 + time * 3) % CANVAS_W;
          const sy = (i * 31 + 10) % CANVAS_H;
          ctx.fillStyle = `rgba(255,255,255,${0.1 + Math.sin(time * 2 + i) * 0.05})`;
          ctx.fillRect(sx, sy, 1, 1);
        }

        // Draw targets
        targetsRef.current.forEach(t => {
          if (!t.alive) return;
          // Glow
          ctx.save();
          ctx.globalAlpha = 0.3;
          ctx.shadowColor = t.glow;
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(t.x, t.y, t.size * 0.7, 0, Math.PI * 2);
          ctx.fillStyle = t.glow;
          ctx.fill();
          ctx.restore();
          // Emoji
          ctx.font = `${t.fontSize}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(t.icon, t.x, t.y);
        });

        // Draw particles
        particlesRef.current.forEach(p => {
          ctx.globalAlpha = Math.max(0, p.life / 0.3);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
      }

      if (rem > 0) {
        rafRef.current = requestAnimationFrame(loop);
      } else {
        clearTimeout(spawnRef.current);
        bgm.stop(); sfx('gameFinish');
        setPhase("done");
        setEarned(earnedRef.current);
        setStats({ ...statsRef.current });
        setMaxCombo(maxComboRef.current);
      }
    };
    rafRef.current = requestAnimationFrame(loop);
  };

  const handleTap = (e) => {
    if (phase !== "play") return;
    const now = Date.now();
    if (now - lastTapTimeRef.current < 50) return;
    lastTapTimeRef.current = now;
    const cvs = canvasRef.current;
    if (!cvs) return;
    const rect = cvs.getBoundingClientRect();
    const tapX = (e.clientX ?? e.touches?.[0]?.clientX ?? 0) - rect.left;
    const tapY = (e.clientY ?? e.touches?.[0]?.clientY ?? 0) - rect.top;
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const cx = tapX * scaleX;
    const cy = tapY * scaleY;

    let hit = null, hitDist = Infinity;
    targetsRef.current.forEach(t => {
      if (!t.alive) return;
      const dist = Math.sqrt((t.x - cx) ** 2 + (t.y - cy) ** 2);
      if (dist < t.size + 10 && dist < hitDist) { hit = t; hitDist = dist; }
    });

    if (hit) {
      hit.alive = false;
      let coins = hit.coins;
      if (hit.type === 'target' && hitDist <= 15) coins = 10;
      comboRef.current++;
      if (comboRef.current > maxComboRef.current) maxComboRef.current = comboRef.current;
      if (comboRef.current >= 10) coins += 8;
      else if (comboRef.current >= 5) coins += 3;
      earnedRef.current += coins;
      statsRef.current[hit.type]++;
      setEarned(earnedRef.current);
      setCombo(comboRef.current);
      setStats({ ...statsRef.current });

      // Sound
      if (hit.type === 'balloon') { playNote(600, 0.06, 'sine', 0.1); }
      else if (hit.type === 'target') { playNote(500, 0.08, 'sine', 0.12); }
      else if (hit.type === 'ufo') { playNote(800, 0.1, 'square', 0.08); playNote(600, 0.1, 'square', 0.06, 0.05); }
      else if (hit.type === 'gold') { sfx('correctStreak'); }

      // Particles
      for (let i = 0; i < 5; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = 1.5 + Math.random() * 2;
        particlesRef.current.push({
          x: hit.x, y: hit.y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
          color: hit.glow, size: 2 + Math.random() * 2, life: 0.3
        });
      }

      // Float
      const id = ++fid.current;
      const label = (hit.type === 'gold' ? '⭐' : hit.type === 'ufo' ? '🛸' : '') + ` +${coins}` + (comboRef.current >= 10 ? '🔥' : comboRef.current >= 5 ? '✨' : '');
      const color = hit.type === 'gold' ? '#fbbf24' : hit.type === 'ufo' ? '#60a5fa' : hit.type === 'target' ? '#f87171' : '#f472b6';
      setFloats(p => [...p, { id, label, color, x: (hit.x / CANVAS_W) * 100 }]);
      setTimeout(() => setFloats(p => p.filter(f => f.id !== id)), 600);
    } else {
      comboRef.current = 0;
      setCombo(0);
      sfx('wrong');
    }
  };

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    clearTimeout(spawnRef.current);
    bgm.stop();
  }, []);
  useEffect(() => { if (phase === "done") { onScore(earned); const t = setTimeout(onClose, 2000); return () => clearTimeout(t); } }, [phase]);

  return (
    <div style={{ textAlign: 'center' }}>
      <div className="st" style={{ justifyContent: 'center' }}>🎯 シューティングギャラリー</div>
      {phase === "ready" && (
        <>
          <p style={{ fontSize: 12, opacity: 0.5, margin: '16px 0' }}>
            動く的を撃ち落とせ！20秒間の射的チャレンジ<br/>
            空タップでコンボリセット！
          </p>
          <div style={{ fontSize: 10, opacity: 0.4, margin: '8px 0', lineHeight: 1.8 }}>
            🎈=🪙3 ／ 🎯=🪙7(中心10) ／ 🛸=🪙14 ／ ⭐=🪙28<br/>
            コンボ5連続+3 ／ 10連続+7
          </div>
          <button className="btn bp" onClick={startGame}>スタート！</button>
        </>
      )}
      {phase === "play" && (
        <div style={{ position: 'relative' }}>
          <div className="sr">
            <div className="sb">⏱️ {timeLeft.toFixed(1)}s</div>
            <div className="sb">🪙 {earned}</div>
            <div className="sb" style={{ color: combo >= 10 ? '#fbbf24' : combo >= 5 ? '#f472b6' : '#a78bfa' }}>
              {combo > 0 ? `🔥${combo}` : '-'}
            </div>
          </div>
          <div className="tb"><div className="tf" style={{ width: `${(timeLeft / DURATION) * 100}%` }} /></div>
          <div style={{ position: 'relative', marginTop: 8, display: 'inline-block' }}>
            <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
              style={{ borderRadius: 14, border: '1px solid rgba(167,139,250,0.2)', touchAction: 'none', maxWidth: '100%', cursor: 'crosshair' }}
              onPointerDown={e => { e.preventDefault(); handleTap(e); }} />
            {floats.map(f => (
              <div key={f.id} className="ft" style={{ color: f.color, left: `${f.x}%`, top: '50%', fontSize: 12, fontWeight: 900 }}>{f.label}</div>
            ))}
          </div>
        </div>
      )}
      {phase === "done" && (
        <>
          <div style={{ fontSize: 44, margin: '16px 0' }}>🎯</div>
          <p style={{ fontSize: 20, fontWeight: 900, color: '#fbbf24' }}>🪙 {earned} コイン獲得！</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, margin: '12px 0', fontSize: 13, flexWrap: 'wrap' }}>
            <div><span style={{ fontSize: 18 }}>🎈</span><br/>{stats.balloon}</div>
            <div><span style={{ fontSize: 18 }}>🎯</span><br/>{stats.target}</div>
            <div><span style={{ fontSize: 18 }}>🛸</span><br/>{stats.ufo}</div>
            <div><span style={{ fontSize: 18 }}>⭐</span><br/>{stats.gold}</div>
          </div>
          <p style={{ fontSize: 12, opacity: 0.5 }}>最大コンボ: 🔥{maxCombo}</p>
        </>
      )}
    </div>
  );
}

// ============================================================
// COIN TOWER GAME
// ============================================================
// A5: 積みブロックのスプライト画像(段ごとに3種循環)。無ければ現行のHSL矩形+🪙のまま(progressive enhancement)。
const TOWER_BLOCK_SRCS = ['assets/games/tower-block1.webp', 'assets/games/tower-block2.webp', 'assets/games/tower-block3.webp'];
const TOWER_BLOCK_IMGS = TOWER_BLOCK_SRCS.map(() => ({ img: null, loaded: false }));
let towerAssetsStarted = false;
function towerPreloadAssets() {
  if (towerAssetsStarted || typeof window === 'undefined') return;
  towerAssetsStarted = true;
  TOWER_BLOCK_SRCS.forEach((src, i) => {
    try {
      const img = new Image();
      img.onload = () => { TOWER_BLOCK_IMGS[i].loaded = true; };
      img.onerror = () => {};
      img.src = src;
      TOWER_BLOCK_IMGS[i].img = img;
    } catch (e) {}
  });
}
function CoinTowerGame({ onScore, onClose }) {
  const [phase, setPhase] = useState("ready");
  const [earned, setEarned] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [layers, setLayers] = useState(0);
  const [perfects, setPerfects] = useState(0);
  const [perfectStreak, setPerfectStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);

  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const stateRef = useRef(null);
  const earnedRef = useRef(0);
  const lastTapRef = useRef(0);
  const DURATION = 20;
  const CANVAS_W = 300;
  const CANVAS_H = 420;
  const BASE_W = 120;
  const BLOCK_H = 16;
  const BASE_Y = CANVAS_H - 30;

  // A5: ブロック画像を横タイルでdrawImage(丸角の形にクリップして描く)
  const drawTiledBlock = (ctx, img, rx, ry, w, h, r) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(rx + r, ry);
    ctx.lineTo(rx + w - r, ry);
    ctx.quadraticCurveTo(rx + w, ry, rx + w, ry + r);
    ctx.lineTo(rx + w, ry + h - r);
    ctx.quadraticCurveTo(rx + w, ry + h, rx + w - r, ry + h);
    ctx.lineTo(rx + r, ry + h);
    ctx.quadraticCurveTo(rx, ry + h, rx, ry + h - r);
    ctx.lineTo(rx, ry + r);
    ctx.quadraticCurveTo(rx, ry, rx + r, ry);
    ctx.closePath();
    ctx.clip();
    const iw = img.naturalWidth || h, ih = img.naturalHeight || h;
    const tileW = Math.max(4, h * (iw / ih));
    for (let tx = rx; tx < rx + w; tx += tileW) ctx.drawImage(img, tx, ry, tileW, h);
    ctx.restore();
  };

  const startGame = () => {
    setPhase("play"); setEarned(0); setTimeLeft(DURATION); setLayers(0); setPerfects(0); setPerfectStreak(0); setMaxStreak(0);
    earnedRef.current = 0;
    bgm.playLoop(BGM_TOWER, 150);
    startRef.current = Date.now();

    const state = {
      stack: [{ x: CANVAS_W / 2, w: BASE_W }], // base platform
      current: { x: CANVAS_W / 2, w: BASE_W, dir: 1 },
      speed: 1.5,
      layers: 0,
      perfects: 0,
      perfectStreak: 0,
      maxStreak: 0,
      earned: 0,
      gameOver: false,
      floats: [],
      fid: 0,
    };
    stateRef.current = state;

    const loop = () => {
      const now = Date.now();
      const elapsed = (now - startRef.current) / 1000;
      const rem = Math.max(0, DURATION - elapsed);
      setTimeLeft(rem);

      const s = stateRef.current;
      if (!s.gameOver && rem > 0) {
        // Swing speed increases with layers
        const speedMult = 1 + s.layers * 0.08;
        const swing = s.speed * speedMult;
        const top = s.stack[s.stack.length - 1];
        const halfRange = (CANVAS_W - s.current.w) / 2;
        s.current.x += s.current.dir * swing;
        const leftEdge = s.current.x - s.current.w / 2;
        const rightEdge = s.current.x + s.current.w / 2;
        if (rightEdge >= CANVAS_W - 10) { s.current.dir = -1; }
        if (leftEdge <= 10) { s.current.dir = 1; }
      }

      // Update floats
      s.floats = s.floats.filter(f => now - f.t < 700);

      // Draw
      const cvs = canvasRef.current;
      if (cvs) {
        const ctx = cvs.getContext('2d');
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

        // Background gradient
        const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
        bg.addColorStop(0, 'rgba(15,10,40,0.95)');
        bg.addColorStop(1, 'rgba(6,6,15,0.95)');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        // Calculate camera offset for scrolling
        const stackHeight = s.stack.length * BLOCK_H;
        const viewOffset = Math.max(0, stackHeight - (CANVAS_H - 100));

        // Draw stacked layers
        s.stack.forEach((layer, i) => {
          const y = BASE_Y - i * BLOCK_H + viewOffset;
          if (y < -BLOCK_H || y > CANVAS_H + BLOCK_H) return;
          const hue = (i * 12) % 360;
          const isPerfect = layer.perfect;
          const rx = layer.x - layer.w / 2;
          const ry = y - BLOCK_H;
          const r = 4;
          const blockImg = TOWER_BLOCK_IMGS[i % TOWER_BLOCK_IMGS.length];
          if (blockImg.loaded && blockImg.img) {
            drawTiledBlock(ctx, blockImg.img, rx, ry, layer.w, BLOCK_H, r);
            if (isPerfect) {
              ctx.save();
              ctx.strokeStyle = 'rgba(255,215,0,0.9)';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(rx + r, ry);
              ctx.lineTo(rx + layer.w - r, ry);
              ctx.quadraticCurveTo(rx + layer.w, ry, rx + layer.w, ry + r);
              ctx.lineTo(rx + layer.w, ry + BLOCK_H - r);
              ctx.quadraticCurveTo(rx + layer.w, ry + BLOCK_H, rx + layer.w - r, ry + BLOCK_H);
              ctx.lineTo(rx + r, ry + BLOCK_H);
              ctx.quadraticCurveTo(rx, ry + BLOCK_H, rx, ry + BLOCK_H - r);
              ctx.lineTo(rx, ry + r);
              ctx.quadraticCurveTo(rx, ry, rx + r, ry);
              ctx.stroke();
              ctx.restore();
            }
          } else {
            ctx.fillStyle = isPerfect
              ? `hsl(${hue}, 80%, 65%)`
              : `hsl(${hue}, 60%, 45%)`;
            ctx.shadowColor = isPerfect ? `hsl(${hue}, 90%, 70%)` : 'transparent';
            ctx.shadowBlur = isPerfect ? 10 : 0;
            ctx.beginPath();
            ctx.moveTo(rx + r, ry);
            ctx.lineTo(rx + layer.w - r, ry);
            ctx.quadraticCurveTo(rx + layer.w, ry, rx + layer.w, ry + r);
            ctx.lineTo(rx + layer.w, ry + BLOCK_H - r);
            ctx.quadraticCurveTo(rx + layer.w, ry + BLOCK_H, rx + layer.w - r, ry + BLOCK_H);
            ctx.lineTo(rx + r, ry + BLOCK_H);
            ctx.quadraticCurveTo(rx, ry + BLOCK_H, rx, ry + BLOCK_H - r);
            ctx.lineTo(rx, ry + r);
            ctx.quadraticCurveTo(rx, ry, rx + r, ry);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Coin emoji on wider blocks
            if (layer.w > 30) {
              ctx.font = `${Math.min(BLOCK_H - 2, 14)}px serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('🪙', layer.x, y - BLOCK_H / 2);
            }
          }
        });

        // Draw current swinging block
        if (!s.gameOver && rem > 0) {
          const cy = BASE_Y - s.stack.length * BLOCK_H + viewOffset - BLOCK_H;
          const rx = s.current.x - s.current.w / 2;
          const r = 4;
          const curImg = TOWER_BLOCK_IMGS[s.stack.length % TOWER_BLOCK_IMGS.length];
          if (curImg.loaded && curImg.img) {
            drawTiledBlock(ctx, curImg.img, rx, cy, s.current.w, BLOCK_H, r);
          } else {
            const hue = (s.stack.length * 12) % 360;
            ctx.fillStyle = `hsl(${hue}, 70%, 55%)`;
            ctx.shadowColor = `hsl(${hue}, 80%, 60%)`;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(rx + r, cy);
            ctx.lineTo(rx + s.current.w - r, cy);
            ctx.quadraticCurveTo(rx + s.current.w, cy, rx + s.current.w, cy + r);
            ctx.lineTo(rx + s.current.w, cy + BLOCK_H - r);
            ctx.quadraticCurveTo(rx + s.current.w, cy + BLOCK_H, rx + s.current.w - r, cy + BLOCK_H);
            ctx.lineTo(rx + r, cy + BLOCK_H);
            ctx.quadraticCurveTo(rx, cy + BLOCK_H, rx, cy + BLOCK_H - r);
            ctx.lineTo(rx, cy + r);
            ctx.quadraticCurveTo(rx, cy, rx + r, cy);
            ctx.fill();
            ctx.shadowBlur = 0;
            if (s.current.w > 30) {
              ctx.font = `${Math.min(BLOCK_H - 2, 14)}px serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('🪙', s.current.x, cy + BLOCK_H / 2);
            }
          }
        }

        // Draw floats
        s.floats.forEach(f => {
          const age = (now - f.t) / 700;
          ctx.globalAlpha = 1 - age;
          ctx.font = 'bold 14px "Orbitron", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = f.color;
          ctx.fillText(f.label, f.x, f.y - age * 50);
          ctx.globalAlpha = 1;
        });

        // Game over overlay
        if (s.gameOver) {
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
          ctx.font = 'bold 24px "Orbitron", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#ef4444';
          ctx.fillText('GAME OVER', CANVAS_W / 2, CANVAS_H / 2 - 10);
          ctx.font = '14px "Noto Sans JP", sans-serif';
          ctx.fillStyle = '#fff';
          ctx.fillText('幅がゼロになりました', CANVAS_W / 2, CANVAS_H / 2 + 20);
        }
      }

      if (rem > 0 && !s.gameOver) {
        rafRef.current = requestAnimationFrame(loop);
      } else {
        bgm.stop(); sfx('gameFinish');
        setPhase("done");
        setEarned(earnedRef.current);
        setLayers(s.layers);
        setPerfects(s.perfects);
        setMaxStreak(s.maxStreak);
      }
    };
    rafRef.current = requestAnimationFrame(loop);
  };

  const handleTap = () => {
    if (phase !== "play") return;
    const now = Date.now();
    if (now - lastTapRef.current < 100) return;
    lastTapRef.current = now;
    const s = stateRef.current;
    if (!s || s.gameOver) return;

    const top = s.stack[s.stack.length - 1];
    const curLeft = s.current.x - s.current.w / 2;
    const curRight = s.current.x + s.current.w / 2;
    const topLeft = top.x - top.w / 2;
    const topRight = top.x + top.w / 2;

    // Calculate overlap
    const overlapLeft = Math.max(curLeft, topLeft);
    const overlapRight = Math.min(curRight, topRight);
    const overlapW = overlapRight - overlapLeft;

    const PERFECT_THRESHOLD = 5;
    const offset = Math.abs(s.current.x - top.x);
    const isPerfect = offset <= PERFECT_THRESHOLD;

    let coins = 0;
    let label = '';
    let color = '';

    if (isPerfect) {
      // PERFECT: full width recovery
      const newW = BASE_W;
      const newX = (overlapLeft + overlapRight) / 2;
      s.stack.push({ x: top.x, w: newW, perfect: true });
      s.perfects++;
      s.perfectStreak++;
      if (s.perfectStreak > s.maxStreak) s.maxStreak = s.perfectStreak;
      coins = 26;
      let bonus = 0;
      if (s.perfectStreak >= 10) bonus = 67;
      else if (s.perfectStreak >= 5) bonus = 26;
      else if (s.perfectStreak >= 3) bonus = 13;
      coins += bonus;
      label = bonus > 0 ? `PERFECT! +${coins}` : `PERFECT! +26`;
      color = '#fbbf24';
      sfx('correctStreak');
    } else if (overlapW > 0) {
      // Normal hit: trim width
      const newX = (overlapLeft + overlapRight) / 2;
      s.stack.push({ x: newX, w: overlapW, perfect: false });
      s.perfectStreak = 0;
      coins = 13;
      label = `+13`;
      color = '#a78bfa';
      sfx('correct');
    } else {
      // Missed completely
      s.gameOver = true;
      s.perfectStreak = 0;
      sfx('hit');
      setEarned(earnedRef.current);
      setLayers(s.layers);
      setPerfects(s.perfects);
      setMaxStreak(s.maxStreak);
      return;
    }

    s.layers++;
    s.earned += coins;
    earnedRef.current += coins;
    setEarned(earnedRef.current);
    setLayers(s.layers);
    setPerfects(s.perfects);
    setPerfectStreak(s.perfectStreak);
    setMaxStreak(s.maxStreak);

    // Add float
    const stackY = BASE_Y - s.stack.length * BLOCK_H + Math.max(0, s.stack.length * BLOCK_H - (CANVAS_H - 100));
    s.floats.push({ label, color, x: s.current.x, y: stackY, t: Date.now(), id: ++s.fid });

    // Prepare next block with the new top's width
    const newTop = s.stack[s.stack.length - 1];
    if (newTop.w <= 2) {
      s.gameOver = true;
      return;
    }
    s.current = { x: CANVAS_W / 2, w: newTop.w, dir: s.layers % 2 === 0 ? 1 : -1 };
  };

  useEffect(() => { towerPreloadAssets(); }, []);
  useEffect(() => () => { cancelAnimationFrame(rafRef.current); bgm.stop(); }, []);
  useEffect(() => { if (phase === "done") { onScore(earned); const t = setTimeout(onClose, 2000); return () => clearTimeout(t); } }, [phase]);

  return (
    <div style={{ textAlign: 'center' }}>
      <div className="st" style={{ justifyContent: 'center' }}>🪙 コインタワー</div>
      {phase === "ready" && (
        <>
          <p style={{ fontSize: 12, opacity: 0.5, margin: '16px 0' }}>
            左右に揺れるコインをタップで積み上げよう！20秒<br/>
            はみ出すと幅が削れる。PERFECTで幅が全回復！
          </p>
          <div style={{ fontSize: 10, opacity: 0.4, margin: '8px 0', lineHeight: 1.8 }}>
            1段=🪙10 ／ PERFECT=🪙20<br/>
            3連続P+10 ／ 5連続P+20 ／ 10連続P+50
          </div>
          <button className="btn bp" onClick={startGame}>スタート！</button>
        </>
      )}
      {phase === "play" && (
        <div style={{ position: 'relative' }}>
          <div className="sr">
            <div className="sb">⏱️ {timeLeft.toFixed(1)}s</div>
            <div className="sb">🪙 {earned}</div>
            <div className="sb">📦 {layers}段</div>
            <div className="sb" style={{ color: perfectStreak >= 5 ? '#fbbf24' : perfectStreak >= 3 ? '#f472b6' : '#a78bfa' }}>
              {perfectStreak > 0 ? `✨${perfectStreak}連P` : '-'}
            </div>
          </div>
          <div className="tb"><div className="tf" style={{ width: `${(timeLeft / DURATION) * 100}%` }} /></div>
          <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
            style={{ borderRadius: 14, border: '1px solid rgba(167,139,250,0.2)', touchAction: 'none', maxWidth: '100%', marginTop: 8, cursor: 'pointer' }}
            onPointerDown={e => { e.preventDefault(); handleTap(); }} />
        </div>
      )}
      {phase === "done" && (
        <>
          <div style={{ fontSize: 44, margin: '16px 0' }}>🏗️</div>
          <p style={{ fontSize: 20, fontWeight: 900, color: '#fbbf24' }}>🪙 {earned} コイン獲得！</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, margin: '12px 0', fontSize: 13 }}>
            <div><span style={{ color: '#a78bfa', fontWeight: 700 }}>段数</span><br/>{layers}</div>
            <div><span style={{ color: '#fbbf24', fontWeight: 700 }}>PERFECT</span><br/>{perfects}</div>
            <div><span style={{ color: '#f472b6', fontWeight: 700 }}>最大連続P</span><br/>{maxStreak}</div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// MEMORY SPEED GAME (神経衰弱スピード)
// ============================================================
function MemoryGame({ onScore, onClose }) {
  const [phase, setPhase] = useState("ready");
  const [cards, setCards] = useState([]);
  const [revealed, setRevealed] = useState([]);
  const [matched, setMatched] = useState([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [misses, setMisses] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [clearTime, setClearTime] = useState(null);
  const timerRef = useRef(null);
  const lockRef = useRef(false);

  const initCards = () => {
    const deck = [];
    MEMORY_CARDS.forEach(mc => {
      deck.push({ pairId: mc.id, icon: mc.icon, color: mc.color, state: 'hidden' });
      deck.push({ pairId: mc.id, icon: mc.icon, color: mc.color, state: 'hidden' });
    });
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck.map((c, i) => ({ ...c, index: i }));
  };

  const startGame = () => {
    const newCards = initCards();
    setPhase("play"); setCards(newCards); setRevealed([]); setMatched([]);
    setMisses(0); setTimeLeft(30); setClearTime(null);
    lockRef.current = false;
    const now = Date.now();
    setStartTime(now);
    bgm.playLoop(MEMORY_BGM, 100);
    timerRef.current = setInterval(() => {
      const rem = Math.max(0, 30 - (Date.now() - now) / 1000);
      setTimeLeft(rem);
      if (rem <= 0) { clearInterval(timerRef.current); bgm.stop(); sfx('gameFinish'); setPhase("done"); }
    }, 50);
  };

  useEffect(() => () => { clearInterval(timerRef.current); bgm.stop(); }, []);

  const matchedRef = useRef([]);
  matchedRef.current = matched;

  const handleCardTap = (index) => {
    if (phase !== "play" || lockRef.current) return;
    const c = cards[index];
    if (!c || c.state !== 'hidden') return;

    playNote(600 + Math.random() * 200, 0.05, 'sine', 0.06);

    const newCards = cards.map((card, i) => i === index ? { ...card, state: 'revealed' } : card);
    setCards(newCards);

    const newRevealed = [...revealed, index];
    setRevealed(newRevealed);

    if (newRevealed.length === 2) {
      lockRef.current = true;
      const [first, second] = newRevealed;
      if (newCards[first].pairId === newCards[second].pairId) {
        setTimeout(() => {
          setCards(prev => prev.map((card, i) => (i === first || i === second) ? { ...card, state: 'matched' } : card));
          setRevealed([]);
          lockRef.current = false;
          sfx('correctStreak');
          const nextMatched = [...matchedRef.current, newCards[first].pairId];
          setMatched(nextMatched);
          if (nextMatched.length >= 6) {
            clearInterval(timerRef.current);
            const elapsed = Math.round((Date.now() - startTime) / 100) / 10;
            setClearTime(elapsed);
            bgm.stop(); sfx('gameFinish');
            setPhase("done");
          }
        }, 100);
      } else {
        setMisses(m => m + 1);
        sfx('wrong');
        setTimeout(() => {
          setCards(prev => prev.map((card, i) => (i === first || i === second) ? { ...card, state: 'hidden' } : card));
          setRevealed([]);
          lockRef.current = false;
        }, 600);
      }
    }
  };

  const pairReward = matched.length * 40;
  const timeBonus = clearTime !== null ? (clearTime <= 12 ? 400 : clearTime <= 15 ? 300 : clearTime <= 20 ? 150 : clearTime <= 25 ? 100 : 0) : 0;
  const totalReward = pairReward + timeBonus;

  useEffect(() => { if (phase === "done") { onScore(totalReward); const t = setTimeout(onClose, 2000); return () => clearTimeout(t); } }, [phase]);

  return (
    <div style={{ textAlign: 'center' }}>
      <div className="st" style={{ justifyContent: 'center' }}>🃏 神経衰弱スピード</div>
      {phase === "ready" && (
        <>
          <p style={{ fontSize: 12, opacity: 0.5, margin: '16px 0' }}>
            12枚のカードを最速で全ペア揃えろ！<br/>
            1ペア = 🪙40
          </p>
          <div style={{ fontSize: 10, opacity: 0.4, margin: '8px 0', lineHeight: 1.8 }}>
            タイムボーナス: 12秒以内+400 ／ 15秒以内+300 ／ 20秒以内+150 ／ 25秒以内+100
          </div>
          <button className="btn bp" onClick={startGame}>スタート！</button>
        </>
      )}
      {phase === "play" && (
        <div>
          <div className="sr">
            <div className="sb">⏱️ {timeLeft.toFixed(1)}s</div>
            <div className="sb">💎 {matched.length}/6</div>
            <div className="sb">🪙 {pairReward}</div>
          </div>
          <div className="tb"><div className="tf" style={{ width: `${(timeLeft / 30) * 100}%` }} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 80px)', gap: 8, justifyContent: 'center', marginTop: 16 }}>
            {cards.map((card, i) => (
              <div key={i} onClick={() => handleCardTap(i)} className={card.state === 'revealed' ? 'card-flip' : card.state === 'matched' ? 'card-match' : ''}
                style={{
                  width: 80, height: 90, borderRadius: 12, position: 'relative', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: card.state === 'hidden' ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                  ...(card.state === 'hidden' ? {
                    background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(236,72,153,0.15))',
                    border: '2px solid rgba(167,139,250,0.3)',
                    fontSize: 28,
                  } : card.state === 'revealed' ? {
                    background: `radial-gradient(circle, ${card.color}30, rgba(0,0,0,0.3))`,
                    border: `2px solid ${card.color}80`,
                    boxShadow: `0 0 12px ${card.color}40`,
                    fontSize: 36,
                  } : {
                    background: 'rgba(74,222,128,0.1)',
                    border: '2px solid rgba(74,222,128,0.3)',
                    fontSize: 36,
                    opacity: 0.5,
                  }),
                }}>
                {card.state === 'hidden' && (
                  <img src="assets/games/mem-back.webp" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
                    onError={e => { e.currentTarget.style.display = 'none'; }} />
                )}
                <span style={{ position: 'relative', zIndex: 1 }}>{card.state === 'hidden' ? '❓' : card.icon}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 11, opacity: 0.4 }}>ミス: {misses}回</div>
        </div>
      )}
      {phase === "done" && (
        <>
          <div style={{ fontSize: 44, margin: '16px 0' }}>🃏</div>
          {clearTime !== null ? (
            <>
              <p style={{ fontSize: 20, fontWeight: 900, color: '#fbbf24' }}>🪙 {totalReward} コイン獲得！</p>
              <div style={{ margin: '12px 0', fontSize: 13 }}>
                <div>ペア報酬: 6 × 40 = 🪙{pairReward}</div>
                {timeBonus > 0 && <div style={{ color: '#4ade80', fontWeight: 700 }}>タイムボーナス: {clearTime}秒 → +🪙{timeBonus}</div>}
              </div>
              <p style={{ fontSize: 12, opacity: 0.5 }}>クリアタイム: {clearTime}秒 ／ ミス: {misses}回</p>
            </>
          ) : (
            <>
              <p style={{ fontSize: 16, fontWeight: 900, color: '#ef4444', marginBottom: 8 }}>⏰ タイムアップ！</p>
              <p style={{ fontSize: 20, fontWeight: 900, color: '#fbbf24' }}>🪙 {totalReward} コイン獲得！</p>
              <div style={{ margin: '12px 0', fontSize: 13 }}>
                <div>揃えたペア: {matched.length}/6 × 40 = 🪙{pairReward}</div>
                <div style={{ fontSize: 11, opacity: 0.5 }}>（全ペア揃えるとタイムボーナス！）</div>
              </div>
              <p style={{ fontSize: 12, opacity: 0.5 }}>ミス: {misses}回</p>
            </>
          )}
        </>
      )}
    </div>
  );
}

function _BubbleGame_REMOVED() { /* removed */ }
function BubbleGame_PLACEHOLDER({ onDone }) {
  const [phase, setPhase] = useState("ready");
  const [bubbles, setBubbles] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [playTime, setPlayTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [growId, setGrowId] = useState(null);
  const timerRef = useRef(null);

  const BUBBLE_COLORS_SAFE = ['#93c5fd','#60a5fa','#3b82f6','#2563eb','#1d4ed8','#1e40af'];
  const BUBBLE_COLORS_DANGER = ['#fbbf24','#f59e0b','#ef4444','#dc2626','#b91c1c','#991b1b'];
  const bubbleColor = (taps) => taps <= 4 ? BUBBLE_COLORS_SAFE[Math.min(taps, 5)] : BUBBLE_COLORS_DANGER[Math.min(taps - 5, 5)];
  const bubbleSize = (taps) => 50 + taps * 8;

  const startGame = () => {
    setPhase("play");
    setBubbles(Array.from({ length: 9 }, (_, i) => ({ id: i, taps: 0, popped: false })));
    const now = Date.now();
    setStartTime(now); setElapsed(0); setPlayTime(null);
    bgm.playLoop(BUBBLE_BGM, 110);
    timerRef.current = setInterval(() => setElapsed((Date.now() - now) / 1000), 100);
  };

  const finishGame = () => {
    clearInterval(timerRef.current);
    bgm.stop(); sfx('gameFinish');
    setPlayTime(((Date.now() - startTime) / 1000).toFixed(1));
    setPhase("done");
  };

  useEffect(() => () => { clearInterval(timerRef.current); bgm.stop(); }, []);

  const handleBubbleTap = (id) => {
    if (phase !== "play") return;
    setBubbles(prev => {
      const next = prev.map(b => ({ ...b }));
      const b = next[id];
      if (b.popped) return prev;
      b.taps++;
      const chance = b.taps <= 5 ? 0 : (b.taps - 5) * 0.1;
      if (Math.random() < chance) {
        b.popped = true;
        sfx('wrong');
      } else {
        if (b.taps <= 5) {
          playNote(300 + b.taps * 80, 0.06, 'sine', 0.06);
        } else {
          playNote(400 + b.taps * 60, 0.08, 'triangle', 0.08);
          playNote(200, 0.15, 'sine', 0.03);
        }
      }
      next[id] = b;
      return next;
    });
    setGrowId(id);
    setTimeout(() => setGrowId(null), 150);
  };

  const currentScore = useMemo(() =>
    bubbles.reduce((s, b) => s + (b.popped ? 0 : (BUBBLE_REWARDS[Math.min(b.taps, BUBBLE_REWARDS.length - 1)] || 0)), 0),
  [bubbles]);

  const poppedCount = bubbles.filter(b => b.popped).length;
  const maxTaps = bubbles.length > 0 ? Math.max(...bubbles.map(b => b.taps)) : 0;

  useEffect(() => { if (phase === "done") { onScore(currentScore); const t = setTimeout(onClose, 2000); return () => clearTimeout(t); } }, [phase]);

  return (
    <div style={{ textAlign: 'center' }}>
      <div className="st" style={{ justifyContent: 'center' }}>🫧 バブルポップ</div>
      {phase === "ready" && (
        <>
          <p style={{ fontSize: 12, opacity: 0.5, margin: '16px 0' }}>
            9個のバブルをタップで膨らませろ！<br/>
            4回までは安全。5回目から破裂リスク！<br/>
            大きいほど高報酬。でも破裂したら0点！
          </p>
          <div style={{ fontSize: 10, opacity: 0.4, margin: '8px 0', lineHeight: 1.8 }}>
            ×4=🪙16 ／ ×6=🪙40 ／ ×8=🪙88 ／ ×10=🪙176
          </div>
          <button className="btn bp" onClick={startGame}>スタート！</button>
        </>
      )}
      {phase === "play" && (
        <div>
          <div className="sr">
            <div className="sb">⏱️ {elapsed.toFixed(1)}s</div>
            <div className="sb">🪙 {currentScore}</div>
            <div className="sb">💥 {poppedCount}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 100px)', gap: 12, justifyContent: 'center', marginTop: 16, placeItems: 'center' }}>
            {bubbles.map(b => {
              const sz = b.popped ? 50 : bubbleSize(b.taps);
              const col = bubbleColor(b.taps);
              return (
                <div key={b.id} style={{ width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
                  <div onClick={() => handleBubbleTap(b.id)}
                    className={b.popped ? 'bubble-pop' : (growId === b.id ? 'bubble-grow' : '') + (b.taps >= 5 && !b.popped ? ' bubble-danger' : '')}
                    style={{
                      width: sz, height: sz, borderRadius: '50%',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      cursor: b.popped ? 'default' : 'pointer',
                      transition: 'width 0.15s, height 0.15s, background 0.15s',
                      position: 'relative',
                      ...(b.popped ? {
                        background: 'rgba(255,255,255,0.05)',
                        border: '2px dashed rgba(255,255,255,0.1)',
                        opacity: 0.3,
                      } : {
                        background: `radial-gradient(circle at 35% 35%, ${col}80, ${col})`,
                        border: `2px solid ${col}`,
                        boxShadow: `0 0 ${8 + b.taps * 3}px ${col}50`,
                      }),
                    }}>
                    {b.popped ? (
                      <span style={{ fontSize: 20 }}>💥</span>
                    ) : (
                      <>
                        <span style={{ fontSize: 12 + b.taps * 2 }}>🫧</span>
                        <span style={{ fontSize: 10, fontWeight: 900, fontFamily: "'Orbitron',sans-serif",
                          color: b.taps >= 5 ? '#fff' : 'rgba(255,255,255,0.7)' }}>×{b.taps}</span>
                        {b.taps >= 5 && (
                          <span style={{ fontSize: 8, color: '#fbbf24', marginTop: 1 }}>🪙{BUBBLE_REWARDS[Math.min(b.taps, BUBBLE_REWARDS.length - 1)]}</span>
                        )}
                      </>
                    )}
                    {b.taps >= 5 && !b.popped && (
                      <div style={{ position: 'absolute', bottom: -14, fontSize: 8, color: b.taps >= 9 ? '#ef4444' : '#fbbf24', fontWeight: 700 }}>
                        ⚠️{(b.taps - 4) * 10}%
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <button className="btn bp" onClick={finishGame}
            style={{ width: '100%', marginTop: 20, fontSize: 16, padding: '14px 0',
              background: 'linear-gradient(135deg, #4ade80, #22c55e)' }}>
            🎯 スコア確定！（現在: 🪙{currentScore}）
          </button>
        </div>
      )}
      {phase === "done" && (
        <>
          <div style={{ fontSize: 44, margin: '16px 0' }}>🫧</div>
          <p style={{ fontSize: 20, fontWeight: 900, color: '#fbbf24' }}>🪙 {currentScore} コイン獲得！</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, maxWidth: 280, margin: '12px auto' }}>
            {bubbles.map(b => (
              <div key={b.id} style={{ padding: '6px 4px', borderRadius: 8,
                background: b.popped ? 'rgba(239,68,68,0.1)' : 'rgba(74,222,128,0.1)',
                border: `1px solid ${b.popped ? 'rgba(239,68,68,0.2)' : 'rgba(74,222,128,0.2)'}`,
                fontSize: 11, textAlign: 'center' }}>
                {b.popped ? <span>💥 0</span> : <span>🫧×{b.taps}=🪙{BUBBLE_REWARDS[Math.min(b.taps, BUBBLE_REWARDS.length - 1)]}</span>}
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, opacity: 0.5, marginTop: 8 }}>
            生存: {9 - poppedCount}/9 ／ 最大膨らみ: ×{maxTaps} ／ 時間: {playTime}秒
          </p>
        </>
      )}
    </div>
  );
}

// ============================================================
// QUICK DRAW GUNMAN GAME (早撃ちガンマン)
// ============================================================
function QuickDrawGame({ onScore, onClose }) {
  const [phase, setPhase] = useState("ready");
  const [round, setRound] = useState(0);
  const [results, setResults] = useState([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [drawTime, setDrawTime] = useState(null);
  const [waitText, setWaitText] = useState('');
  const [lastResult, setLastResult] = useState(null);
  // Full-scene image per phase (progressive enhancement). Loads only when the asset actually exists;
  // until then this stays false and the existing emoji rendering is unaffected.
  const [sceneLoaded, setSceneLoaded] = useState({ 1: false, 2: false, 3: false });

  const lastTapRef = useRef(0);
  const startRef = useRef(null);
  const waitTimerRef = useRef(null);
  const fakeTimerRef = useRef(null);
  const timeoutRef = useRef(null);
  const timerRef = useRef(null);
  const resultsRef = useRef([]);
  const phaseRef = useRef("ready");
  const roundRef = useRef(0);
  phaseRef.current = phase;

  const TOTAL_ROUNDS = 6;
  const TIMEOUT_MS = 2000;

  const getReward = (ms) => {
    for (const r of DRAW_REWARDS) {
      if (ms < r.maxMs) return r;
    }
    return { coins: 10, label: 'ギリギリ', color: '#64748b' };
  };

  const clearAllTimers = () => {
    clearTimeout(waitTimerRef.current);
    clearTimeout(fakeTimerRef.current);
    clearTimeout(timeoutRef.current);
  };

  const handleRoundResult = (coins, label, color, type) => {
    setPhase("result");
    phaseRef.current = "result";
    const entry = { coins, label, color, type, round: roundRef.current };
    resultsRef.current = [...resultsRef.current, entry];
    setResults([...resultsRef.current]);
    setLastResult(entry);

    // Dynamic result display time based on remaining time
    const elapsedR = startRef.current ? (Date.now() - startRef.current) / 1000 : 0;
    const remainR = TOTAL_ROUNDS - (roundRef.current + 1);
    const resultDelay = remainR > 0 && (23 - elapsedR) < remainR * 3 ? 600 : 1200;
    setTimeout(() => {
      if (roundRef.current + 1 >= TOTAL_ROUNDS) {
        clearInterval(timerRef.current);
        clearAllTimers();
        bgm.stop(); sfx('gameFinish');
        setPhase("done");
        phaseRef.current = "done";
      } else {
        roundRef.current++;
        setRound(roundRef.current);
        startRound();
      }
    }, resultDelay);
  };

  const startRound = () => {
    setPhase("waiting");
    phaseRef.current = "waiting";
    setDrawTime(null);
    setLastResult(null);

    const texts = ['まだだ...', 'じっと待て...', '集中...', '来るぞ...', '油断するな...', '息を止めろ...'];
    setWaitText(texts[Math.floor(Math.random() * texts.length)]);

    // Calculate wait time dynamically to ensure 6 rounds fit in 23 seconds
    const elapsed = startRef.current ? (Date.now() - startRef.current) / 1000 : 0;
    const remainingRounds = TOTAL_ROUNDS - roundRef.current;
    const timeLeft23 = Math.max(0, 23 - elapsed);
    const timePerRound = remainingRounds > 0 ? timeLeft23 / remainingRounds : 3;
    // Each round needs: waitTime + reaction(~0.5s) + result(1.2s) = ~waitTime + 1.7s
    const maxWait = Math.max(0.8, timePerRound - 1.7);
    const waitTime = 800 + Math.random() * Math.min(maxWait * 1000 - 800, 2200);

    waitTimerRef.current = setTimeout(() => {
      setPhase("draw");
      phaseRef.current = "draw";
      setDrawTime(Date.now());
      playNote(800, 0.1, 'square', 0.1);
      playNote(1000, 0.08, 'square', 0.08, 0.05);

      // Dynamic timeout based on remaining time
      const elapsedNow = startRef.current ? (Date.now() - startRef.current) / 1000 : 0;
      const dynTimeout = Math.max(800, Math.min(TIMEOUT_MS, (23 - elapsedNow) * 500));
      timeoutRef.current = setTimeout(() => {
        if (phaseRef.current === "draw") {
          sfx('wrong');
          handleRoundResult(0, 'タイムアウト', '#ef4444', 'timeout');
        }
      }, dynTimeout);
    }, waitTime);
  };

  const startGame = () => {
    setRound(0); roundRef.current = 0;
    setResults([]); resultsRef.current = [];
    setTimeLeft(25);
    startRef.current = Date.now();
    bgm.playLoop(QUICKDRAW_BGM, 70);

    timerRef.current = setInterval(() => {
      const rem = Math.max(0, 25 - (Date.now() - startRef.current) / 1000);
      setTimeLeft(rem);
      if (rem <= 0) {
        clearInterval(timerRef.current);
        clearAllTimers();
        bgm.stop(); sfx('gameFinish');
        setPhase("done"); phaseRef.current = "done";
      }
    }, 50);

    startRound();
  };

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) return;
    lastTapRef.current = now;
    const p = phaseRef.current;

    if (p === "waiting") {
      clearAllTimers();
      sfx('wrong');
      handleRoundResult(0, 'お手つき！', '#ef4444', 'early');
      return;
    }

    if (p === "draw") {
      clearTimeout(timeoutRef.current);
      const reactionMs = now - drawTime;
      const reward = getReward(reactionMs);
      if (reactionMs < 250) {
        playNote(1200, 0.08, 'sine', 0.1); playNote(1600, 0.1, 'sine', 0.08, 0.04);
      } else if (reactionMs < 500) {
        playNote(800, 0.08, 'sine', 0.08);
      } else {
        playNote(500, 0.06, 'sine', 0.06);
      }
      handleRoundResult(reward.coins, reward.label + ' ' + (reactionMs / 1000).toFixed(2) + '秒', reward.color, 'hit');
    }
  };

  useEffect(() => () => { clearInterval(timerRef.current); clearAllTimers(); bgm.stop(); }, []);

  const currentTotal = results.reduce((s, r) => s + r.coins, 0);
  const perfectBonus = results.length >= TOTAL_ROUNDS && results.every(r => r.type === 'hit' && parseInt(r.label) < 250) ? 80 : 0;
  // Simpler perfect check
  const allFast = results.length >= TOTAL_ROUNDS && results.filter(r => r.type === 'hit').length === TOTAL_ROUNDS &&
    results.every(r => { const m = r.label.match(/(\d+\.\d+)秒/); return m && parseFloat(m[1]) < 0.25; });
  const totalWithBonus = currentTotal + (allFast ? 80 : 0);

  useEffect(() => { if (phase === "done") { onScore(totalWithBonus); const t = setTimeout(onClose, 2000); return () => clearTimeout(t); } }, [phase]);

  return (
    <div style={{ textAlign: 'center' }}>
      <div className="st" style={{ justifyContent: 'center' }}>🔫 早撃ちガンマン</div>
      {phase === "ready" && (
        <>
          <p style={{ fontSize: 12, opacity: 0.5, margin: '16px 0' }}>
            ピッと鳴ったら最速でタップ！<br/>25秒以内に全6ラウンド！
          </p>
          <div style={{ fontSize: 10, opacity: 0.4, margin: '8px 0', lineHeight: 1.8 }}>
            神速(&lt;0.2s)=🪙104 ／ 超速い(&lt;0.25s)=🪙84<br/>
            速い(&lt;0.3s)=🪙64 ／ まあまあ(&lt;0.35s)=🪙44
          </div>
          <button className="btn bp" onClick={startGame}>スタート！</button>
        </>
      )}
      {["waiting","draw","result"].includes(phase) && (
        <div onPointerDown={e => { e.preventDefault(); handleTap(); }}
          style={{ minHeight: 350, display: 'flex', flexDirection: 'column', alignItems: 'center',
            cursor: 'pointer', userSelect: 'none', touchAction: 'none', position: 'relative' }}>
          <div className="sr" style={{ width: '100%' }}>
            <div className="sb">⏱️ {timeLeft.toFixed(1)}s</div>
            <div className="sb">🎯 {round + 1}/{TOTAL_ROUNDS}</div>
            <div className="sb">🪙 {currentTotal}</div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, position: 'relative', zIndex: 0, width: '100%' }}>
            {/* Full-scene art per phase, laid behind the emoji/text (404 -> stays hidden, emoji unaffected) */}
            {phase === "waiting" && (
              <img src="assets/games/qd-scene1.webp" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: -1, display: sceneLoaded[1] ? 'block' : 'none' }}
                onLoad={() => setSceneLoaded(p => ({ ...p, 1: true }))} onError={() => setSceneLoaded(p => ({ ...p, 1: false }))} />
            )}
            {phase === "draw" && (
              <img src="assets/games/qd-scene2.webp" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: -1, display: sceneLoaded[2] ? 'block' : 'none' }}
                onLoad={() => setSceneLoaded(p => ({ ...p, 2: true }))} onError={() => setSceneLoaded(p => ({ ...p, 2: false }))} />
            )}
            {phase === "result" && (
              <img src="assets/games/qd-scene3.webp" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: -1, display: sceneLoaded[3] ? 'block' : 'none' }}
                onLoad={() => setSceneLoaded(p => ({ ...p, 3: true }))} onError={() => setSceneLoaded(p => ({ ...p, 3: false }))} />
            )}
            {phase === "waiting" && (
              <>
                {!sceneLoaded[1] && <div style={{ fontSize: 60 }}>🧍</div>}
                <div style={{ fontSize: 14, opacity: 0.5 }}>{waitText}</div>
                <div style={{ fontSize: 11, opacity: 0.3 }}>⚡ 振り返ったら撃て！</div>
              </>
            )}
            {phase === "draw" && (
              <div className="draw-flash" style={{ padding: 20, borderRadius: 16 }}>
                {!sceneLoaded[2] && <div style={{ fontSize: 70 }}>🤠🔫</div>}
                <div className="draw-text" style={{ fontSize: 28, fontWeight: 900, color: '#ef4444',
                  textShadow: '0 0 16px rgba(239,68,68,0.6)' }}>💥 DRAW!!</div>
              </div>
            )}
            {phase === "result" && lastResult && (
              <>
                {!sceneLoaded[3] && <div style={{ fontSize: 50 }}>{lastResult.type === 'hit' ? '😵' : lastResult.type === 'timeout' ? '🤠😤' : '🧍❌'}</div>}
                <div style={{ fontSize: 18, fontWeight: 900, color: lastResult.color }}>{lastResult.label}</div>
                <div style={{ fontSize: 14, color: '#fbbf24' }}>+🪙{lastResult.coins}</div>
              </>
            )}
          </div>
        </div>
      )}
      {phase === "done" && (
        <>
          <div style={{ fontSize: 44, margin: '16px 0' }}>🔫</div>
          <p style={{ fontSize: 20, fontWeight: 900, color: '#fbbf24' }}>🪙 {totalWithBonus} コイン獲得！</p>
          {allFast && <div style={{ fontSize: 12, color: '#ffd700', fontWeight: 700 }}>🏆 パーフェクトボーナス +🪙100</div>}
          <div style={{ maxWidth: 320, margin: '12px auto' }}>
            {results.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px',
                borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 12 }}>
                <span style={{ width: 24, opacity: 0.4 }}>R{i + 1}</span>
                <span style={{ flex: 1, color: r.color, fontWeight: 700 }}>{r.type === 'hit' ? '⚡' : '❌'} {r.label}</span>
                <span style={{ color: '#fbbf24', fontWeight: 700 }}>+🪙{r.coins}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// GEM CATCH GAME (ジュエルキャッチ)