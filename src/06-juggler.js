// ============================================================
// JUGGLER GAME (300 seconds slot machine game)
// ============================================================
// 重量バッファ(生成コストが高い音)の定義とキャッシュ。startGame時にidleで1本ずつ事前生成する。
// 未生成のまま呼ばれた場合は従来どおりその場で同期生成する(フォールバック)。音色・音量は synth 版と同一。
const jugBufs = {};
let jugWarmStarted = false;
const JUG_SND = {
  puchun: [0.3, (s,ch)=>{return(Math.sin(2*Math.PI*(9000*Math.exp(-s*16)+150)*s)*0.55*Math.exp(-s*7)+Math.sin(2*Math.PI*14000*s)*0.1*Math.exp(-s*35)+Math.sin(2*Math.PI*60*s)*0.5*Math.exp(-s*20)+(Math.random()*2-1)*0.4*Math.exp(-s*25))*0.85;}],
  godGong: [5.0, (s,ch)=>{const f0=55;return(Math.sin(2*Math.PI*f0*s)*0.5*Math.exp(-s*0.5)+Math.sin(2*Math.PI*f0*2*s)*0.35*Math.exp(-s*0.7)+Math.sin(2*Math.PI*f0*3*s)*0.2*Math.exp(-s*0.9)+Math.sin(2*Math.PI*f0*4*s)*0.12*Math.exp(-s*1.1)+Math.sin(2*Math.PI*f0*6*s)*0.06*Math.exp(-s*1.5)+Math.sin(2*Math.PI*f0*8*s*(1+0.003*Math.sin(2*Math.PI*2.5*s)))*0.04*Math.exp(-s*0.5)+Math.exp(-s*6)*(Math.random()*2-1)*0.7+Math.sin(2*Math.PI*27.5*s)*0.3*Math.exp(-s*0.8))*(ch===0?0.65:0.6);}],
  godCoins: [2.5, (s,ch)=>{let v=0;for(let n=0;n<24;n++){const o=n*0.06,f=1600+n*160+(ch*70);if(s>o)v+=Math.sin(2*Math.PI*f*(s-o))*Math.exp(-(s-o)*3)*0.07;}return v*0.9;}],
};
function jugMakeBuf(dur, fn) {
  const a = audioCtx; if (!a) return null;
  const sr = a.sampleRate, buf = a.createBuffer(2, Math.max(1, Math.floor(sr * dur)), sr);
  for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < d.length; i++) d[i] = fn(i / sr, ch); }
  return buf;
}
function jugPlay(key, vol) {
  const a = audioCtx; if (!a) return;
  if (a.state === 'suspended') a.resume();
  let b = jugBufs[key];
  if (!b) { const g = JUG_SND[key]; if (!g) return; b = jugBufs[key] = jugMakeBuf(g[0], g[1]); if (!b) return; }
  const bs = a.createBufferSource(); bs.buffer = b;
  const gn = a.createGain(); gn.gain.value = vol == null ? 1 : vol;
  bs.connect(gn); gn.connect(a.destination); bs.start(a.currentTime);
}
// 事前生成はidle時に1件ずつ(playing中の一括生成を避ける)
function jugWarmup() {
  if (!audioCtx || jugWarmStarted) return; jugWarmStarted = true;
  const keys = Object.keys(JUG_SND);
  const ric = (typeof window !== 'undefined' && window.requestIdleCallback) ? (f) => window.requestIdleCallback(f, { timeout: 400 }) : (f) => setTimeout(f, 16);
  let i = 0;
  const step = () => {
    if (i >= keys.length) return;
    const k = keys[i++];
    try { if (!jugBufs[k]) jugBufs[k] = jugMakeBuf(JUG_SND[k][0], JUG_SND[k][1]); } catch (e) {}
    ric(step);
  };
  ric(step);
}
function JugglerGame({ onScore, onClose }) {
  const [phase, setPhase] = useState("ready");
  const [gameN, setGameN] = useState(0);
  const [timeLeft, setTimeLeft] = useState(180);
  const [coins, setCoins] = useState(0);
  const [bigC, setBigC] = useState(0);
  const [barC, setBarC] = useState(0);
  const [godC, setGodC] = useState(0);
  const [spinCount, setSpinCount] = useState(0);
  const spinCountRef = useRef(0);
  const [history, setHistory] = useState([]);
  const [jugRen, setJugRen] = useState(0);
  const jugRenRef = useRef(0);
  const [msg, setMsg] = useState('');
  const [msgColor, setMsgColor] = useState('#333');
  const [locked, setLocked] = useState(false);
  const [lampStyle, setLampStyle] = useState({});
  const [shaking, setShaking] = useState(false);
  const [crtActive, setCrtActive] = useState(false);
  const crtActiveRef = useRef(false);
  const crtStartRef = useRef(0);
  const crtBarRef = useRef(null);
  const crtLineRef = useRef(null);
  const crtDotRef = useRef(null);
  const [flashAlpha, setFlashAlpha] = useState(0);
  const [screenGlow, setScreenGlow] = useState('none');
  const [lampMainText, setLampMainText] = useState('GOGO!');
  const [lampMainSize, setLampMainSize] = useState('min(22vw,100px)');
  const [lampSubText, setLampSubText] = useState('CHANCE');
  const timerRef = useRef(null);
  const lampRef = useRef(null);
  const lampTypeRef = useRef('off');
  const lampStartRef = useRef(null);
  const lockedRef = useRef(false);
  const phaseRef = useRef('ready');
  const coinsRef = useRef(0);
  const gameNRef = useRef(0);
  const tapCountRef = useRef(0);
  // アセット: 筐体外装(bezel/pediment/basestrip)はゴッドアナザーと共有のGA_ASSETSを読むだけ(登録・プリロード自体は共有関数呼び出しのみ・定義は書き換えない)
  const [, setGaTick] = useState(0);   // アセットが1つロードされた時だけ再レンダーする(GodAnotherGameと同じ作法)
  useEffect(() => {
    gaPreloadAssets();
    const off = gaOnAsset(() => setGaTick(t => t + 1));
    return off;
  }, []);
  // アセット: GOGOランプ(未配置前提の新規パス)。off/on両方ロードできた時だけ画像に置換、片方でも404なら現行のテキスト+CSSグローが床のまま
  const [jugLampReady, setJugLampReady] = useState(false);
  useEffect(() => {
    let alive = true, offOk = false, onOk = false;
    const mark = () => { if (alive && offOk && onOk) setJugLampReady(true); };
    const imgOff = new Image(); imgOff.onerror = () => {}; imgOff.onload = () => { offOk = true; mark(); }; imgOff.src = 'assets/games/jug-lamp-off.webp';
    const imgOn = new Image(); imgOn.onerror = () => {}; imgOn.onload = () => { onOk = true; mark(); }; imgOn.src = 'assets/games/jug-lamp-on.webp';
    return () => { alive = false; };
  }, []);

  const BIG_P = 1/200, BAR_P = 1/200, GOD_P = 1/4096, TOTAL = 180;

  const synth = (dur, fn, vol=0.7) => {
    const a = audioCtx; if (!a) return; if (a.state==='suspended') a.resume();
    const sr=a.sampleRate, buf=a.createBuffer(2, sr*dur, sr);
    for(let ch=0;ch<2;ch++){const d=buf.getChannelData(ch);for(let i=0;i<d.length;i++)d[i]=fn(i/sr,ch);}
    const bs=a.createBufferSource();bs.buffer=buf;const g=a.createGain();g.gain.value=vol;bs.connect(g);g.connect(a.destination);bs.start(a.currentTime);
  };
  const jTone = (f,st,dur,vol=0.25,type='sine') => {
    const a=audioCtx;if(!a)return;
    const o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.value=f;
    g.gain.setValueAtTime(vol,a.currentTime+st);g.gain.exponentialRampToValueAtTime(0.001,a.currentTime+st+dur);
    o.connect(g);g.connect(a.destination);o.start(a.currentTime+st);o.stop(a.currentTime+st+dur);
  };
  const sndTap = () => synth(0.06,(s)=>{return(Math.sin(2*Math.PI*4000*s)*Math.exp(-s*60)*0.4+Math.sin(2*Math.PI*1200*s)*Math.exp(-s*40)*0.2)*0.6;},0.12);
  const sndGakon = () => synth(0.8,(s,ch)=>{const at=Math.exp(-s*40)*0.9;return(Math.sin(2*Math.PI*220*s+Math.sin(2*Math.PI*440*s)*0.5)*at+(Math.sin(2*Math.PI*880*s)*0.2+Math.sin(2*Math.PI*1320*s)*0.15+Math.sin(2*Math.PI*1760*s)*0.08)*Math.exp(-s*8)+Math.sin(2*Math.PI*55*s)*0.6*Math.exp(-s*20)+Math.sin(2*Math.PI*165*s)*0.25*Math.exp(-s*4)+(Math.random()*2-1)*0.4*Math.exp(-s*30))*(ch===0?0.55:0.5);},0.9);
  // 4 normal hit sound patterns (BIG/REG共通)
  const sndHit1 = () => { sndGakon(); [523,659,784,1047,1319,1568].forEach((f,i)=>jTone(f,0.25+i*0.12,0.5,0.22)); jTone(131,0.1,1.0,0.12); };
  const sndHit2 = () => { synth(0.15,(s)=>(Math.random()*2-1)*Math.exp(-s*20)*0.6,0.5); [784,988,1175,1568].forEach((f,i)=>jTone(f,0.1+i*0.08,0.3,0.18)); };
  const sndHit3 = () => { jTone(65,0,0.4,0.15,'sawtooth'); synth(0.12,(s)=>(Math.random()*2-1)*Math.exp(-s*25)*0.5,0.4); [659,831,988].forEach((f,i)=>jTone(f,0.15+i*0.1,0.4,0.2)); };
  const sndHit4 = () => { synth(0.5,(s,ch)=>{const sw=Math.sin(2*Math.PI*(800+400*Math.sin(2*Math.PI*6*s))*s)*0.3*Math.exp(-s*3);const bell=Math.sin(2*Math.PI*1200*s)*0.2*Math.exp(-s*4);return(sw+bell)*(ch===0?0.55:0.5);},0.6); [440,659,880,1100].forEach((f,i)=>jTone(f,0.2+i*0.1,0.35,0.16)); };
  const hitSounds = [sndHit1, sndHit2, sndHit3, sndHit4];
  // 3 BIG確定音 (派手な専用サウンド)
  const sndBigKakutei1 = () => { // ジャグラーガール風：派手な上昇アルペジオ+ゴング
    sndGakon(); synth(0.2,(s)=>(Math.random()*2-1)*Math.exp(-s*15)*0.5,0.6);
    [262,330,392,494,587,698,831,988,1175,1397,1568].forEach((f,i)=>jTone(f,0.15+i*0.06,0.4,0.2));
    jTone(98,0.05,0.8,0.15,'sawtooth'); jTone(1568,0.85,1.0,0.12); jTone(2093,0.95,0.8,0.08);
  };
  const sndBigKakutei2 = () => { // 重低音バン+高速上昇+シンバル
    synth(0.25,(s)=>(Math.random()*2-1)*Math.exp(-s*12)*0.7,0.8);
    jTone(55,0,0.5,0.2,'sawtooth'); jTone(110,0.05,0.4,0.15,'sawtooth');
    [392,494,587,698,831,988,1175,1397,1568,1760,2093].forEach((f,i)=>jTone(f,0.2+i*0.04,0.3,0.18));
    synth(1.0,(s)=>(Math.random()*2-1)*0.15*Math.exp(-s*2),0.3);
  };
  const sndBigKakutei3 = () => { // トリプルチャイム+壮大和音
    [523,659,784].forEach((f,i)=>jTone(f,i*0.12,0.3,0.2));
    [1047,1319,1568].forEach((f,i)=>jTone(f,0.4+i*0.08,0.5,0.22));
    jTone(65,0.3,0.6,0.12,'sawtooth'); sndGakon();
    setTimeout(() => { [784,988,1175,1568,2093].forEach((f,i)=>jTone(f,i*0.06,0.6,0.15)); }, 600);
  };
  const bigKakuteiSounds = [sndBigKakutei1, sndBigKakutei2, sndBigKakutei3];
  const sndCoinsJ = (n=10) => synth(1.4,(s,ch)=>{let v=0;for(let i=0;i<n;i++){const off=i*(1.0/n),f=2000+i*220+(ch*100);if(s>off)v+=Math.sin(2*Math.PI*f*(s-off))*Math.exp(-(s-off)*5)*0.1;}return v*0.85;},0.65);
  // 重量音は jugBufs のキャッシュから再生(未生成ならjugPlay内でその場生成)
  const sndPuchun = () => jugPlay('puchun', 1.0);
  const sndGodGong = () => jugPlay('godGong', 1.0);
  const sndGodCoins = () => jugPlay('godCoins', 0.8);

  const fmtT = (s) => { const m=Math.floor(s/60); return m+':'+(s%60<10?'0':'')+s%60; };
  const fmtP = (g,h) => h===0?'1/ -':'1/'+Math.round(g/h);

  const resetLamp = () => {
    // Don't cancel RAF - let the loop keep running, it will see 'off' and skip
    lampTypeRef.current = 'off'; lampStartRef.current = null;
    setLampStyle({}); setShaking(false); setScreenGlow('none');
    setLampMainText('GOGO!'); setLampMainSize('min(22vw,100px)'); setLampSubText('CHANCE');
  };

  const computeLamp = (h,s,l,p,a) => ({
    glow: `radial-gradient(circle,hsla(${h},${s}%,${l+15}%,${a*1.1}) 0%,hsla(${h},${s}%,${l+5}%,${a*0.5}) 30%,hsla(${h},${s*0.7}%,${l-10}%,${a*0.08}) 65%,transparent 88%)`,
    textColor: `hsla(${h},${s}%,${l+25}%,${0.9+0.1*p})`,
    textShadow: `0 0 15px hsla(${h},${s}%,${l+10}%,${0.9*p}),0 0 40px hsla(${h},${s}%,${l}%,${0.5*p}),0 0 80px hsla(${h},${s*0.8}%,${l-5}%,${0.2*p})`,
    subColor: `hsla(${h},${s}%,${l+10}%,${0.4*p})`, subShadow: `0 0 8px hsla(${h},${s}%,${l}%,${0.3*p})`,
    border: `hsla(${h},${s}%,${l-5}%,${0.3+0.5*p})`, boxShadow: `0 0 25px hsla(${h},${s}%,${l-5}%,${0.3*p})`,
    ringBorder: `hsla(${h},${s}%,${l-5}%,${0.15+0.2*p})`, bg: '#040404',
    sg: `radial-gradient(circle at 50% 45%,hsla(${h},${s}%,${l-10}%,${a*0.1}) 0%,transparent 60%)`,
  });

  // Main game loop: timer + lamp animation via requestAnimationFrame
  useEffect(() => {
    if (phase !== "playing" && phase !== "done") return;
    let running = true;
    let lastTimerUpdate = 0;
    const loop = (ts) => {
      if (!running) return;
      // CRT(ぷちゅん): 固定div3枚を ref で持ち、座標とopacityだけRAFで更新(再レンダーなし)
      if (crtActiveRef.current) {
        const ce = performance.now() - crtStartRef.current;
        const cb = crtBarRef.current, cl = crtLineRef.current, cd = crtDotRef.current;
        if (cb && cl && cd) {
          if (ce < 160) {
            const p = ce / 160, h = 100 * (1 - p);
            cb.style.display = 'block'; cb.style.height = Math.max(h, 0.5) + '%'; cb.style.top = (50 - h / 2) + '%';
            cl.style.display = 'none'; cd.style.display = 'none';
          } else if (ce < 280) {
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
      // Timer update (every second)
      if (phaseRef.current === 'playing' && startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const newTimeLeft = Math.max(0, TOTAL - elapsed);
        if (newTimeLeft !== timeLeftRef.current) {
          timeLeftRef.current = newTimeLeft;
          setTimeLeft(newTimeLeft);
          if (newTimeLeft <= 0) {
            phaseRef.current = 'done'; setPhase("done"); setMsg('TIME UP'); setMsgColor('#666'); resetLamp();
          }
        }
      }
      const lt = lampTypeRef.current;
      if (lt === 'off') { lampRef.current = requestAnimationFrame(loop); return; }
      if (!lampStartRef.current) lampStartRef.current = ts;
      const e = (ts - lampStartRef.current) / 1000;
      let st = {};
      // === REG (BAR) 3 patterns ===
      if (lt === 'bar') { const p=0.82+0.18*Math.sin(e*4.5),a=0.6+0.35*p; st=computeLamp(340,75,50,p,a); }
      else if (lt === 'bar2') { // 青紫の静かな点灯
        const p=0.7+0.3*Math.sin(e*3),a=0.5+0.3*p; st=computeLamp(260,70,45,p,a); }
      else if (lt === 'bar3') { // 緑のゆっくり脈動
        const p=0.65+0.35*Math.sin(e*2.5),a=0.55+0.35*p; st=computeLamp(120,80,42,p,a); }
      // === BIG 8 patterns ===
      else if (lt === 'rainbow') { const h=(e*140)%360,p=0.72+0.28*Math.sin(e*6.5),a=0.65+0.3*p; st=computeLamp(h,100,55,p,a); }
      else if (lt === 'white') { const p=0.6+0.4*Math.sin(e*11),a=0.7+0.25*p;
        st={glow:`radial-gradient(circle,rgba(255,255,255,${a}) 0%,rgba(220,220,255,${a*0.35}) 35%,transparent 80%)`,textColor:`rgba(255,255,255,${0.92+0.08*p})`,textShadow:`0 0 22px rgba(255,255,255,${0.95*p}),0 0 55px rgba(210,210,255,${0.5*p})`,subColor:`rgba(255,255,255,${0.5*p})`,subShadow:'none',border:`rgba(255,255,255,${0.4+0.5*p})`,boxShadow:`0 0 30px rgba(255,255,255,${0.35*p})`,ringBorder:`rgba(255,255,255,${0.2+0.3*p})`,bg:'#040404',sg:`radial-gradient(circle at 50% 45%,rgba(255,255,255,${0.12*p}) 0%,transparent 55%)`}; }
      else if (lt === 'flicker') { const on=Math.sin(e*225)>0;
        if(on){const p=0.78+0.22*Math.sin(e*6),a=0.65*p+0.25;st=computeLamp(335,100,53,p,a);}
        else{st={glow:'none',textColor:'rgba(255,255,255,0.02)',textShadow:'none',subColor:'rgba(255,255,255,0.02)',subShadow:'none',border:'#0e0e0e',boxShadow:'none',ringBorder:'transparent',bg:'#040404',sg:'none'};}
      }
      else if (lt === 'grad') { const p=0.75+0.25*Math.sin(e*5);const h1=(e*65)%360,h2=(h1+120)%360,h3=(h1+240)%360,a=0.6+0.35*p;
        st={glow:`conic-gradient(from ${e*50}deg,hsla(${h1},100%,55%,${a}),hsla(${h2},100%,52%,${a*0.85}),hsla(${h3},100%,50%,${a*0.7}),hsla(${h1},100%,55%,${a}))`,textColor:`hsla(${h1},100%,82%,${0.9+0.1*p})`,textShadow:`0 0 20px hsla(${h1},100%,62%,${0.9*p}),0 0 50px hsla(${h2},100%,52%,${0.4*p})`,subColor:`hsla(${h2},100%,68%,${0.4*p})`,subShadow:'none',border:`hsla(${h1},100%,48%,${0.4+0.4*p})`,boxShadow:`0 0 25px hsla(${h1},100%,45%,${0.3*p})`,ringBorder:`hsla(${h2},100%,48%,${0.2+0.2*p})`,bg:'#040404',sg:`conic-gradient(from ${e*50}deg at 50% 45%,hsla(${h1},100%,35%,${0.08*p}),hsla(${h2},100%,30%,${0.05*p}),transparent)`}; }
      else if (lt === 'pulse') { // 赤の高速パルス
        const p=0.5+0.5*Math.abs(Math.sin(e*8)),a=0.8*p; st=computeLamp(0,100,55,p,a); }
      else if (lt === 'aurora') { // オーロラ（青緑〜紫）
        const h=180+60*Math.sin(e*1.5),p=0.7+0.3*Math.sin(e*4),a=0.6+0.3*p; st=computeLamp(h,85,50,p,a); }
      else if (lt === 'fire') { // 炎（赤→オレンジ→黄）
        const h=10+25*Math.sin(e*7),p=0.75+0.25*Math.sin(e*9),a=0.7+0.25*p; st=computeLamp(h,100,52,p,a); }
      else if (lt === 'god') { const fc=Math.floor(e*60);const on=Math.sin(fc*0.7)>0,p=0.7+0.3*Math.sin(e*14);
        if(on){const hue=(e*150)%50,a=0.85+0.15*p;
          st={glow:`radial-gradient(circle,rgba(255,255,255,${a}) 0%,hsla(${42+hue},100%,58%,${a*0.55}) 25%,transparent 80%)`,textColor:`rgba(255,${225+30*p|0},${115+40*p|0},1)`,textShadow:`0 0 25px rgba(255,215,0,1),0 0 60px rgba(255,180,0,0.7),0 0 100px rgba(255,255,255,0.4)`,subColor:`rgba(255,215,0,${0.7*p})`,subShadow:'none',border:`rgba(255,215,0,${0.6+0.35*p})`,boxShadow:`0 0 40px rgba(255,215,0,0.5),0 0 80px rgba(255,180,0,0.2)`,ringBorder:`rgba(255,215,0,${0.4+0.4*p})`,bg:`radial-gradient(circle,rgba(35,28,0,1) 0%,#040404 60%)`,sg:`radial-gradient(circle at 50% 45%,rgba(255,215,0,${0.2*p}) 0%,rgba(255,180,0,${0.08*p}) 20%,transparent 65%)`};
        }else{st={glow:'radial-gradient(circle,rgba(255,255,255,0.08) 0%,transparent 50%)',textColor:'rgba(255,215,0,0.2)',textShadow:'0 0 6px rgba(255,200,0,0.1)',subColor:'rgba(255,215,0,0.1)',subShadow:'none',border:'rgba(255,215,0,0.12)',boxShadow:'none',ringBorder:'rgba(255,215,0,0.06)',bg:'#040404',sg:`radial-gradient(circle at 50% 45%,rgba(255,200,0,0.02) 0%,transparent 30%)`};}
      }
      setLampStyle(st); setScreenGlow(st.sg || 'none');
      lampRef.current = requestAnimationFrame(loop);
    };
    lampRef.current = requestAnimationFrame(loop);
    return () => { running = false; if (lampRef.current) cancelAnimationFrame(lampRef.current); };
  }, [phase]);

  const startTimeRef = useRef(null);
  const timeLeftRef = useRef(TOTAL);

  const startGame = () => {
    jugWarmup(); // 重量バッファの事前生成(既に開始済みなら何もしない)
    setPhase("playing"); phaseRef.current = 'playing';
    setGameN(0); setTimeLeft(TOTAL); setCoins(0); setBigC(0); setBarC(0); setGodC(0);
    setMsg(''); setLocked(false); lockedRef.current = false;
    coinsRef.current = 0; gameNRef.current = 0; tapCountRef.current = 0; spinCountRef.current = 0; setSpinCount(0);
    setHistory([]); jugRenRef.current = 0; setJugRen(0);
    startTimeRef.current = Date.now(); timeLeftRef.current = TOTAL;
    resetLamp();
    bgm.stop();
  };

  const onHit = (type) => {
    setLocked(true); lockedRef.current = true; resetLamp(); lampStartRef.current = null;
    const hitAt = spinCountRef.current;
    // Juguren (combo): hit within 100 spins = combo continues
    let newJugRen;
    if (hitAt <= 100) { newJugRen = jugRenRef.current + 1; } else { newJugRen = 1; }
    jugRenRef.current = newJugRen; setJugRen(newJugRen);
    // Multiplier: base + 1G連ボーナス(+1.0 if hitAt===1)
    const baseMult = 1 + (newJugRen - 1) * 0.1; // 1.0, 1.1, 1.2...
    const jugMult = hitAt === 1 ? baseMult + 1.0 : baseMult; // 1G連: +1.0 added
    const is1Gren = hitAt === 1;
    spinCountRef.current = 0; setSpinCount(0);
    // Add to history (max 30), track consecutive 1G streak
    setHistory(prev => {
      let streak1G = 0;
      if (is1Gren) {
        streak1G = 1;
        for (const h of prev) { if (h.is1G) streak1G++; else break; }
      }
      const entry = { type, at: hitAt, jugRen: newJugRen, is1G: is1Gren, streak1G };
      const next = [entry, ...prev];
      return next.slice(0, 30);
    });
    // 1G連: 雷のような激しいサウンド
    if (is1Gren) {
      synth(0.8, (s, ch) => {
        const thunder = (Math.random()*2-1) * Math.exp(-s*3) * 0.7;
        const crack = Math.sin(2*Math.PI*80*s) * Math.exp(-s*5) * 0.5;
        const rumble = Math.sin(2*Math.PI*40*s*(1+Math.random()*0.3)) * Math.exp(-s*1.5) * 0.4;
        const zap = Math.sin(2*Math.PI*(8000*Math.exp(-s*12))*s) * Math.exp(-s*8) * 0.3;
        return (thunder + crack + rumble + zap) * (ch===0 ? 0.6 : 0.55);
      }, 1.0);
      [1568, 1976, 2349, 2793, 3136].forEach((f, i) => jTone(f, 0.05 + i*0.03, 0.2, 0.15));
      setFlashAlpha(0.8); setTimeout(() => setFlashAlpha(0), 120);
      setShaking(true); setTimeout(() => setShaking(false), 500);
    }
    // Juguren escalating sound effects (louder with each consecutive hit)
    if (newJugRen >= 2) {
      const intensity = Math.min(newJugRen, 5);
      // Progressive escalation: more notes, higher pitch, louder
      const baseVol = 0.1 + intensity * 0.04;
      const baseFreqs = [523, 659, 784, 988, 1175, 1397, 1568, 1760, 2093];
      const noteCount = 3 + intensity * 2; // 5,7,9,11,13
      for (let i = 0; i < noteCount && i < baseFreqs.length; i++) {
        jTone(baseFreqs[i], 0.05 + i * 0.04, 0.25 + intensity * 0.05, baseVol);
      }
      if (intensity >= 3) { synth(0.15, (s) => (Math.random()*2-1)*Math.exp(-s*18)*0.4, 0.3 + intensity * 0.1); } // crash noise
      if (intensity >= 4) { jTone(65, 0, 0.5, 0.12 + intensity * 0.02, 'sawtooth'); } // sub bass
      if (intensity >= 5) { // max intensity: full orchestra
        [2093, 2349, 2637, 3136].forEach((f, i) => jTone(f, 0.3 + i * 0.05, 0.3, 0.06));
        synth(0.3, (s) => (Math.random()*2-1)*Math.exp(-s*8)*0.3, 0.4);
      }
    }

    if (type === 'god') {
      crtStartRef.current = performance.now(); crtActiveRef.current = true; setCrtActive(true); sndPuchun();
      setTimeout(() => {
        crtActiveRef.current = false; setCrtActive(false); setFlashAlpha(0.7);
        lampTypeRef.current = 'god'; setLampMainText('GOD'); setLampMainSize('min(30vw,130px)'); setLampSubText('JACKPOT'); setShaking(true);
        sndGodGong();
        setTimeout(() => setFlashAlpha(0), 100);
        setTimeout(() => { setFlashAlpha(0.4); setTimeout(() => setFlashAlpha(0), 80); }, 800);
        setTimeout(() => { setFlashAlpha(0.4); setTimeout(() => setFlashAlpha(0), 80); }, 1600);
        setTimeout(() => { if (phaseRef.current !== 'playing' && phaseRef.current !== 'done') return; sndGodCoins(); const earn = Math.round(2000 * jugMult); coinsRef.current += earn; setCoins(coinsRef.current); setGodC(g=>g+1); setMsgColor('#ffd700'); setMsg('👑 GOD +' + earn.toLocaleString() + (is1Gren ? ' 1G連!' : '') + (jugMult > 1 ? ' ×' + jugMult.toFixed(1) : '') + ' 👑'); }, 3500);
        setTimeout(() => { lockedRef.current = false; setLocked(false); resetLamp(); setMsg(''); }, 5000);
      }, 850);
      return;
    }
    const bigPatterns = ['rainbow', 'bar', 'grad', 'white', 'flicker', 'pulse', 'aurora', 'fire'];
    const barPatterns = ['bar', 'bar2', 'bar3'];
    if (type === 'big') {
      lampTypeRef.current = bigPatterns[Math.floor(Math.random() * 8)];
      // BIG: 30% chance BIG確定音, 50% normal sound, 20% silent
      const sndRoll = Math.random();
      if (sndRoll < 0.3) { bigKakuteiSounds[Math.floor(Math.random() * 3)](); }
      else if (sndRoll < 0.8) { hitSounds[Math.floor(Math.random() * 4)](); }
      // BIG only: 20% chance flash + 20% chance shake
      if (Math.random() < 0.2) { setFlashAlpha(0.6); setTimeout(() => setFlashAlpha(0), 80); }
      if (Math.random() < 0.2) { setShaking(true); setTimeout(() => setShaking(false), 400); }
    } else {
      lampTypeRef.current = barPatterns[Math.floor(Math.random() * 3)];
      const sndRoll = Math.random();
      if (sndRoll < 0.6) { hitSounds[Math.floor(Math.random() * 4)](); }
    }
    const gs = type === 'big' ? 2.0 : 1.0;
    setTimeout(() => {
      if (phaseRef.current !== 'playing' && phaseRef.current !== 'done') return;
      // コインシャワー音は削除済み
      const baseCoins = type === 'big' ? 800 : 200;
      const earn = Math.round(baseCoins * jugMult);
      coinsRef.current += earn; setCoins(coinsRef.current);
      const jugLabel = (is1Gren ? ' 1G連!' : '') + (jugMult > 1 ? ' ジャグ連' + newJugRen + ' ×' + jugMult.toFixed(1) : '');
      if (type === 'big') { setBigC(b=>b+1); setMsgColor('#ff3366'); setMsg('★★ BIG +' + earn + jugLabel + ' ★★'); }
      else { setBarC(b=>b+1); setMsgColor('#ffc040'); setMsg('★ REG +' + earn + jugLabel + ' ★'); }
    }, (gs - 0.5) * 1000);
    setTimeout(() => { lockedRef.current = false; setLocked(false); resetLamp(); setMsg(''); }, type === 'big' ? 2300 : 1300);
  };

  const doSpin = () => {
    if (lockedRef.current || phaseRef.current !== 'playing') return;
    // 同時タップ禁止: 1タップずつ
    if (tapCountRef.current > 0) return;
    tapCountRef.current = 1;
    setTimeout(() => { tapCountRef.current = 0; }, 150);
    gameNRef.current++; setGameN(gameNRef.current); spinCountRef.current++; setSpinCount(spinCountRef.current);
    coinsRef.current -= 1; setCoins(coinsRef.current); sndTap(); setMsg('');
    // Reset juguren if over 100 spins without hit
    if (spinCountRef.current > 100 && jugRenRef.current > 0) { jugRenRef.current = 0; setJugRen(0); }
    const r = Math.random();
    if (r < GOD_P) onHit('god');
    else if (r < GOD_P + BIG_P) onHit('big');
    else if (r < GOD_P + BIG_P + BAR_P) onHit('bar');
  };

  useEffect(() => () => { if (lampRef.current) cancelAnimationFrame(lampRef.current); }, []);
  useEffect(() => { if (phase === "done") { onScore(coinsRef.current); const t = setTimeout(onClose, 3000); return () => clearTimeout(t); } }, [phase]);

  const ls = lampStyle;
  const totalC = bigC + barC + godC;
  // アセット: 筐体パーツ(未ロードなら null = 現行のSVG/CSSがそのまま残る。ゴッドアナザーと同じ読み方)
  const bezelOn = gaAssetLoaded('bezel');
  const bezelSty = bezelOn ? {
    borderWidth: GA_ASSETS.bezel.width, borderStyle: 'solid', borderColor: 'transparent',
    borderImageSource: `url("${gaAssetSrc('bezel')}")`,
    borderImageSlice: gaAssetSlice('bezel', GA_ASSETS.bezel.slice),
    borderImageRepeat: 'stretch',
  } : null;
  const pedimentOn = gaAssetLoaded('pediment');
  const basestripOn = gaAssetLoaded('basestrip');

  return (
    <div style={{ textAlign: 'center', background: '#030305', minHeight: '60vh', borderRadius: 12, padding: 0, position: 'relative', overflow: 'hidden' }}>
      {/* Screen glow */}
      <div style={{ position: 'absolute', inset: 0, background: screenGlow, pointerEvents: 'none', zIndex: 0 }} />
      {/* Screen flash */}
      {flashAlpha > 0 && <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: flashAlpha, pointerEvents: 'none', zIndex: 50 }} />}
      {/* CRT(ぷちゅん): div3枚をrefで持ち、RAFループが毎フレーム座標とopacityを更新する */}
      {crtActive && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000', pointerEvents: 'none' }}>
          <div ref={crtBarRef} style={{ position: 'absolute', left: 0, right: 0, height: '100%', top: '0%', background: '#fff' }} />
          <div ref={crtLineRef} style={{ position: 'absolute', height: 2, top: '50%', transform: 'translateY(-50%)', left: '0%', right: '0%', background: '#fff', boxShadow: '0 0 20px #fff', opacity: 1, display: 'none' }} />
          <div ref={crtDotRef} style={{ position: 'absolute', width: 6, height: 6, borderRadius: '50%', background: '#fff', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', opacity: 1, boxShadow: '0 0 12px #fff', display: 'none' }} />
        </div>
      )}

      {phase === "ready" && (
        <div style={{ padding: '40px 20px' }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#2aee2a', fontFamily: "'Courier New',monospace", marginBottom: 12, textShadow: '0 0 10px rgba(42,238,42,0.5)' }}>🎰 ジャグラー</div>
          <p style={{ fontSize: 11, opacity: 0.5, margin: '12px 0', lineHeight: 1.8, color: '#888' }}>
            画面タップでレバーON！<br/>GOGOランプが光れば大当たり！<br/>100G以内の連続ボーナスでジャグ連！<br/>制限時間: 3分
          </p>
          <button className="btn bp" onClick={startGame} style={{ background: 'linear-gradient(135deg, #cc0022, #ee3355)' }}>START</button>
        </div>
      )}

      {(phase === "playing" || phase === "done") && (
        <>
          {phase === "playing" && <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 40, touchAction: 'none', overscrollBehavior: 'none' }}
            onPointerDown={e => { e.preventDefault(); doSpin(); }}
            onTouchMove={e => { /* React18はtouch系をpassive登録するためpreventDefaultは無効(警告が出るだけ)。スクロール抑止は touchAction:'none' が担当 */ }}
            onTouchStart={e => { }} />}

          <div style={{ background: '#060806', borderBottom: '1px solid #1a2a1a', padding: '6px 8px 5px', position: 'relative', zIndex: 41, pointerEvents: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                <span style={{ fontSize: 9, color: '#2a6a2a', fontWeight: 600, letterSpacing: 1, fontFamily: "'Courier New',monospace" }}>ボーナス間</span>
                <span style={{ fontSize: 34, fontWeight: 800, color: spinCount >= 500 ? '#ff2222' : spinCount >= 200 ? '#ff9922' : '#2aee2a', fontFamily: "'Courier New',monospace", lineHeight: 1, textShadow: spinCount >= 500 ? '0 0 10px rgba(255,34,34,0.5)' : '0 0 10px rgba(42,238,42,0.5)' }}>{spinCount}</span>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 7, color: '#2a6a2a', fontWeight: 600, letterSpacing: 1, fontFamily: "'Courier New',monospace" }}>GAME</div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Courier New',monospace", lineHeight: 1.1, color: '#2aee2a', textShadow: '0 0 6px rgba(42,238,42,0.3)' }}>{gameN}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 7, color: '#2a6a2a', fontWeight: 600, letterSpacing: 1, fontFamily: "'Courier New',monospace" }}>TIME</div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Courier New',monospace", lineHeight: 1.1, color: timeLeft <= 10 ? '#ff2222' : '#2aee2a', textShadow: timeLeft <= 10 ? '0 0 8px rgba(255,34,34,0.6)' : '0 0 6px rgba(42,238,42,0.3)' }}>{fmtT(timeLeft)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 7, color: '#2a6a2a', fontWeight: 600, letterSpacing: 1, fontFamily: "'Courier New',monospace" }}>COIN</div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Courier New',monospace", lineHeight: 1.1, color: '#eecc22', textShadow: '0 0 6px rgba(238,204,34,0.3)' }}>{coins.toLocaleString()}</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 2 }}>
              {[
                { label: 'GOD', val: godC, prob: fmtP(gameN, godC), color: '#ffd700', probColor: '#bb8800' },
                { label: 'BIG', val: bigC, prob: fmtP(gameN, bigC), color: '#ff2244', probColor: '#bb1133' },
                { label: 'REG', val: barC, prob: fmtP(gameN, barC), color: '#ff9922', probColor: '#bb7711' },
                { label: '合算', val: totalC, prob: fmtP(gameN, totalC), color: '#22ccee', probColor: '#1199bb' },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, background: '#080a08', border: '1px solid #152515', borderRadius: 5, padding: '4px 2px 3px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.5, fontFamily: "'Courier New',monospace", color: s.color, textShadow: `0 0 6px ${s.color}44`, marginBottom: 1 }}>{s.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Courier New',monospace", lineHeight: 1, color: s.color, textShadow: `0 0 6px ${s.color}44` }}>{s.val}</div>
                  <div style={{ fontSize: 9, fontFamily: "'Courier New',monospace", marginTop: 1, color: s.probColor, opacity: 0.75 }}>{s.prob}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1,
            padding: (pedimentOn || basestripOn) ? '30px 4px 22px' : '16px 4px', pointerEvents: 'none' }}>
            <div style={{ position: 'relative', width: '92%', maxWidth: 380 }}>
              {/* アセット: 筐体外装(bezel/pediment/basestrip)。未ロードなら何も足さず現状表示のまま */}
              {pedimentOn && (
                <img src={gaAssetSrc('pediment')} alt="" aria-hidden="true"
                  style={{ position: 'absolute', left: 0, top: -24, width: '100%', height: 'auto', display: 'block', zIndex: 0, pointerEvents: 'none' }} />
              )}
              {basestripOn && (
                <img src={gaAssetSrc('basestrip')} alt="" aria-hidden="true"
                  style={{ position: 'absolute', left: 0, bottom: -18, width: '100%', height: 'auto', display: 'block', zIndex: 0, pointerEvents: 'none' }} />
              )}
              <div style={{ width: '100%', aspectRatio: '16/10', borderRadius: bezelSty ? 0 : 20, position: 'relative', zIndex: 1,
                background: ls.bg || '#040404', border: `3px solid ${ls.border || '#0e0e0e'}`, overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                boxShadow: ls.boxShadow || 'none',
                animation: shaking ? 'shake 0.15s linear infinite' : 'none',
                ...(bezelSty || {}) }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: bezelSty ? 0 : 20, boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8)', pointerEvents: 'none', zIndex: 3 }} />
                <div style={{ position: 'absolute', inset: 0, background: ls.glow || 'none', pointerEvents: 'none', zIndex: 1 }} />
                {/* アセット: GOGOランプ(未配置前提)。off/on両方ロードできた時だけ画像に置換、404なら現行のテキスト+CSSグローが床 */}
                {jugLampReady && lampMainText === 'GOGO!' ? (
                  <img src={lampTypeRef.current === 'off' ? 'assets/games/jug-lamp-off.webp' : 'assets/games/jug-lamp-on.webp'} alt="GOGO"
                    style={{ position: 'relative', zIndex: 2, width: 'min(58vw,210px)', height: 'auto', display: 'block',
                      filter: (lampTypeRef.current !== 'off' && ls.border) ? `drop-shadow(0 0 18px ${ls.border})` : 'none' }} />
                ) : (
                  <div style={{ fontSize: lampMainSize, fontWeight: 900, letterSpacing: '0.1em', color: ls.textColor || 'rgba(255,255,255,0.02)',
                    zIndex: 2, fontStyle: 'italic', lineHeight: 1, textAlign: 'center', textShadow: ls.textShadow || 'none' }}>{lampMainText}</div>
                )}
                <div style={{ position: 'absolute', bottom: 'min(2.5vw,12px)', fontSize: 'min(3.2vw,14px)', color: ls.subColor || 'rgba(255,255,255,0.02)',
                  zIndex: 2, letterSpacing: 5, fontWeight: 700, textShadow: ls.subShadow || 'none' }}>{lampSubText}</div>
                <div style={{ position: 'absolute', inset: -5, borderRadius: 25, border: `2px solid ${ls.ringBorder || 'transparent'}`,
                  pointerEvents: 'none', zIndex: 4 }} />
              </div>
            </div>
          </div>

          {/* Juguren display */}
          {jugRen >= 2 && (
            <div style={{ textAlign: 'center', pointerEvents: 'none', position: 'relative', zIndex: 41, marginBottom: 2 }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#ff4466', letterSpacing: 2, textShadow: '0 0 8px rgba(255,68,102,0.5)' }}>
                🔥 ジャグ連 {jugRen} ×{(1 + (jugRen - 1) * 0.1).toFixed(1)}
              </span>
            </div>
          )}

          {/* History - 10 per row, max 30 */}
          {history.length > 0 && (
            <div style={{ padding: '2px 8px', pointerEvents: 'none', position: 'relative', zIndex: 41 }}>
              {[0, 10, 20].map(rowStart => {
                const row = history.slice(rowStart, rowStart + 10);
                if (row.length === 0) return null;
                return (
                  <div key={rowStart} style={{ display: 'flex', gap: 2, justifyContent: 'center', marginBottom: 2 }}>
                    {row.map((h, i) => (
                      <div key={rowStart + i} style={{ fontSize: 9, padding: '2px 4px', borderRadius: 4, fontFamily: "'Courier New',monospace", fontWeight: 800,
                        position: 'relative',
                        background: h.is1G
                          ? 'linear-gradient(135deg, rgba(255,107,107,0.25), rgba(255,209,61,0.25), rgba(107,255,107,0.25), rgba(107,197,255,0.25), rgba(208,107,255,0.25))'
                          : h.type === 'god' ? 'rgba(255,215,0,0.2)' : h.type === 'big' ? 'rgba(255,34,68,0.15)' : 'rgba(255,153,34,0.12)',
                        color: h.is1G ? '#fff' : h.type === 'god' ? '#ffd700' : h.type === 'big' ? '#ff2244' : '#ff9922',
                        textShadow: h.is1G ? '0 0 6px rgba(255,215,0,0.8)' : 'none',
                        border: h.is1G
                          ? '1px solid rgba(255,215,0,0.5)'
                          : `1px solid ${h.type === 'god' ? 'rgba(255,215,0,0.3)' : h.type === 'big' ? 'rgba(255,34,68,0.2)' : 'rgba(255,153,34,0.15)'}` }}>
                        {h.type === 'god' ? 'G' : h.type === 'big' ? 'B' : 'R'}{h.at}
                        {h.is1G && <span style={{ color: '#ffee00' }}>⚡</span>}
                        {h.jugRen >= 2 && !h.is1G && <span style={{ color: '#ff4466' }}>★</span>}
                        {h.jugRen >= 2 && (
                          <span style={{ position: 'absolute', top: -5, right: -4, fontSize: 7, fontWeight: 900,
                            color: '#fff',
                            background: h.is1G
                              ? 'linear-gradient(135deg, #ff6b6b, #ffd93d, #6bff6b, #6bc5ff, #d06bff)'
                              : 'rgba(255,68,102,0.8)',
                            borderRadius: 4, padding: '0 2px', lineHeight: 1.3,
                            textShadow: '0 0 4px rgba(0,0,0,0.5)' }}>×{h.jugRen}</span>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ padding: '4px 12px', textAlign: 'center', pointerEvents: 'none', position: 'relative', zIndex: 41 }}>
            <div style={{ fontSize: 14, fontWeight: 700, minHeight: 18, marginBottom: 4, color: msgColor, letterSpacing: 1 }}>{msg}</div>
            {phase === "playing" && <div style={{ fontSize: 9, color: '#444', marginBottom: 4 }}>どこでもタップでレバーON</div>}
          </div>

          {phase === "done" && (
            <div style={{ margin: '4px 12px', padding: '8px 10px', background: 'rgba(10,10,15,0.95)', border: '1px solid #1a1a1a', borderRadius: 8, textAlign: 'left', pointerEvents: 'none', position: 'relative', zIndex: 41 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2, textAlign: 'center', color: '#ffd700', letterSpacing: 2 }}>★ RESULT ★</div>
              <div style={{ fontSize: 11, color: '#888', lineHeight: 1.8 }}>
                ゲーム数：<b style={{ color: '#ddd' }}>{gameN}G</b><br/>
                GOD：<b style={{ color: '#ddd' }}>{godC}回</b>（{fmtP(gameN, godC)}）<br/>
                BIG：<b style={{ color: '#ddd' }}>{bigC}回</b>（{fmtP(gameN, bigC)}） ／ REG：<b style={{ color: '#ddd' }}>{barC}回</b>（{fmtP(gameN, barC)}）<br/>
                合算：<b style={{ color: '#ddd' }}>{totalC}回</b>（{fmtP(gameN, totalC)}）<br/>
                獲得コイン：<b style={{ color: '#ddd' }}>{coins.toLocaleString()}枚</b>
              </div>
            </div>
          )}
        </>
      )}

      <style>{`@keyframes shake{0%,100%{transform:translate(0)}10%{transform:translate(-4px,3px)}30%{transform:translate(4px,-3px)}50%{transform:translate(-3px,4px)}70%{transform:translate(3px,-2px)}90%{transform:translate(-2px,3px)}}`}</style>
    </div>
  );
}
