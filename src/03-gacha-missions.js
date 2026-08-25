// ============================================================
// STYLES
// ============================================================
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700;900&family=Orbitron:wght@400;700;900&family=Rajdhani:wght@600;700&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }
.G {
  font-family: 'Noto Sans JP', sans-serif;
  width: 100%; min-height: 100vh;
  background: #06060f; color: #e0e0e0;
  overflow-x: hidden; position: relative;
}
.G::before {
  content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background:
    radial-gradient(ellipse at 30% 10%, rgba(139,92,246,0.18) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 80%, rgba(236,72,153,0.12) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(14,165,233,0.06) 0%, transparent 70%);
}
.G::after {
  content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background-image: radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 40px 40px;
}
/* ===== シェルUI: 黄金の宝物庫トーン(青銅+金彫金) ===== */
.hdr {
  position: sticky; top: 0; z-index: 100;
  max-width: 480px; margin: 0 auto;
  background:
    radial-gradient(130% 200% at 50% -70%, rgba(201,168,76,0.12), transparent 62%),
    linear-gradient(180deg, #141009 0%, #0c0906 55%, #060506 100%);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border-bottom: none;
  box-shadow: 0 2px 12px rgba(0,0,0,0.65);
  padding: 8px 14px; display: flex; align-items: center; justify-content: space-between;
}
/* 微細ノイズ(金の粉じん)。装飾のみでクリック不可 */
.hdr::before {
  content: ''; position: absolute; inset: 0; pointer-events: none; opacity: 0.45;
  background-image: radial-gradient(rgba(255,235,180,0.05) 1px, transparent 1px);
  background-size: 3px 3px;
}
/* 下端の金グラデライン(帯の縁取り) */
.hdr::after {
  content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 1px; pointer-events: none;
  background: linear-gradient(90deg, transparent, rgba(201,168,76,0.65) 14%, rgba(240,214,145,0.95) 50%, rgba(201,168,76,0.65) 86%, transparent);
}
.hdr > div { position: relative; z-index: 1; }
.hdr-t {
  font-family: 'Cinzel', 'Orbitron', serif; font-size: 15px; font-weight: 700;
  background: linear-gradient(180deg, #f8ecc4 0%, #dcba68 44%, #a8842f 58%, #f2e0aa 100%);
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
  letter-spacing: 2.5px; white-space: nowrap;
  filter: drop-shadow(0 1px 1px rgba(0,0,0,0.8));
}
.hdr-logo { height: 22px; width: auto; display: block;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.6)); }
.hdr-slot {
  font-family: 'Rajdhani', 'Orbitron', sans-serif; font-size: 10px; font-weight: 700;
  letter-spacing: 1.5px; color: #e6cd90; line-height: 1.35;
  background: linear-gradient(180deg, #2b2215, #16110a);
  border: 1px solid rgba(201,168,76,0.5);
  border-radius: 4px; padding: 2px 7px;
  box-shadow: inset 0 1px 0 rgba(240,214,145,0.18), 0 0 6px rgba(201,168,76,0.14);
  text-shadow: 0 0 5px rgba(201,168,76,0.35);
}
.hdr-ib {
  display: inline-flex; align-items: center; justify-content: center;
  width: 30px; height: 30px; padding: 0; flex-shrink: 0;
  background: linear-gradient(180deg, #251d12, #120e08);
  border: 1px solid rgba(201,168,76,0.42); border-radius: 7px;
  color: #e6cd90; font-size: 14px; line-height: 1; cursor: pointer;
  box-shadow: inset 0 1px 0 rgba(240,214,145,0.14), 0 1px 3px rgba(0,0,0,0.6);
  transition: all 0.2s;
}
.hdr-ib:hover { border-color: rgba(240,214,145,0.75); box-shadow: inset 0 1px 0 rgba(240,214,145,0.24), 0 0 9px rgba(201,168,76,0.3); }
.hdr-ib.off { color: rgba(205,193,170,0.3); border-color: rgba(150,130,90,0.25); }
.hdr-ib.off img { opacity: 0.45; }
.hdr-ib img { width: 20px; height: 20px; object-fit: contain; display: block; mix-blend-mode: screen; }
.coin {
  display: flex; align-items: center; gap: 6px;
  background: linear-gradient(180deg, #241c11 0%, #15100a 55%, #1e170d 100%);
  border: 1px solid rgba(201,168,76,0.48);
  border-radius: 6px; padding: 3px 11px;
  font-family: 'Orbitron', sans-serif; font-weight: 700; font-size: 13px; color: #f2e0aa;
  letter-spacing: 0.5px;
  box-shadow: inset 0 1px 0 rgba(240,214,145,0.16), inset 0 -3px 7px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.5);
  text-shadow: 0 0 6px rgba(201,168,76,0.35);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px;
}
.coin img { width: 15px; height: 15px; object-fit: contain; display: block; flex-shrink: 0; }
.cnt { position: relative; z-index: 1; padding: 16px; padding-bottom: 90px; }
.nav {
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 480px; z-index: 100;
  background:
    radial-gradient(130% 220% at 50% 150%, rgba(201,168,76,0.11), transparent 62%),
    linear-gradient(180deg, #110d07 0%, #0a0806 58%, #060506 100%);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border-top: none;
  display: flex; justify-content: space-around; padding: 5px 0 7px;
  border-radius: 14px 14px 0 0;
  box-shadow: 0 -3px 16px rgba(0,0,0,0.65);
}
/* 上端の金グラデライン */
.nav::before {
  content: ''; position: absolute; left: 10px; right: 10px; top: 0; height: 1px; pointer-events: none;
  background: linear-gradient(90deg, transparent, rgba(201,168,76,0.6) 12%, rgba(240,214,145,0.95) 50%, rgba(201,168,76,0.6) 88%, transparent);
}
.nb {
  background: none; border: none; color: rgba(190,170,120,0.5);
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  font-size: 11px; font-family: 'Noto Sans JP', sans-serif; font-weight: 700;
  letter-spacing: 0.15em;
  cursor: pointer; padding: 4px 8px 6px; transition: all 0.3s;
  position: relative;
}
.nb.act { color: #f2e0aa; text-shadow: 0 0 8px rgba(201,168,76,0.5); }
.nb img { pointer-events: none; }
.nb-l { line-height: 1; padding-left: 0.15em; }
/* アクティブタブ下部の金インジケータ */
.nb-ind {
  position: absolute; left: 50%; transform: translateX(-50%); bottom: 0;
  width: 22px; height: 2px; border-radius: 1px; pointer-events: none;
  background: linear-gradient(90deg, transparent, #f2e0aa, transparent);
  box-shadow: 0 0 6px rgba(240,214,145,0.85);
}
/* 画面見出し(展示室/合成 共通) */
.scrh {
  text-align: center; margin: 0 -16px 16px; padding: 16px 16px 13px; position: relative;
  background: linear-gradient(180deg, rgba(26,20,11,0.8), rgba(10,8,6,0.35));
  border-bottom: 1px solid rgba(201,168,76,0.28);
}
.scrh-k { font-family: 'Rajdhani', sans-serif; font-size: 9px; font-weight: 700;
  letter-spacing: 5px; color: rgba(201,168,76,0.6); margin-bottom: 5px; }
.scrh-t {
  font-family: 'Cinzel', 'Orbitron', 'Noto Sans JP', sans-serif; font-size: 21px; font-weight: 700;
  letter-spacing: 6px; line-height: 1.25;
  background: linear-gradient(180deg, #f8ecc4 0%, #dcba68 46%, #a8842f 60%, #f2e0aa 100%);
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.75));
}
.scrh-r { display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 7px; }
.scrh-d { width: 72px; height: 9px; flex-shrink: 0; opacity: 0.75;
  background: url(assets/ui/divider.webp) center/contain no-repeat; }
.scrh-d.f { transform: scaleX(-1); }
.scrh-s { font-size: 10px; color: rgba(232,213,163,0.6); letter-spacing: 1px; white-space: nowrap; }
/* 通知バナー(青銅+金の帯) */
.gbanner {
  position: fixed; top: 54px; left: 50%; transform: translateX(-50%); z-index: 300;
  max-width: min(92vw, 430px);
  background: linear-gradient(180deg, #2b2215 0%, #171108 58%, #221a0f 100%);
  border: 1px solid rgba(201,168,76,0.6);
  border-radius: 6px; padding: 7px 20px;
  font-size: 13px; font-weight: 700; color: #f2e0aa; letter-spacing: 0.5px;
  text-align: center; line-height: 1.5;
  box-shadow: inset 0 1px 0 rgba(240,214,145,0.18), 0 5px 20px rgba(0,0,0,0.6), 0 0 14px rgba(201,168,76,0.16);
  animation: ri 0.3s ease-out;
}
.gbanner .gb-k { font-family: 'Rajdhani', sans-serif; font-size: 9px; letter-spacing: 4px;
  color: rgba(201,168,76,0.7); margin-bottom: 3px; }
.gbanner .gb-sub { font-size: 10px; color: rgba(232,213,163,0.55); margin-top: 4px; font-weight: 400; }
/* 金プレート(称号バッジ・メダル帯 共通) */
.gplate {
  display: inline-flex; align-items: center; gap: 6px;
  background: linear-gradient(180deg, #2b2215, #17110a);
  border: 1px solid rgba(201,168,76,0.45); border-radius: 6px;
  box-shadow: inset 0 1px 0 rgba(240,214,145,0.14), 0 1px 4px rgba(0,0,0,0.5);
}
.btn {
  border: none; border-radius: 14px; padding: 12px 24px;
  font-family: 'Noto Sans JP', sans-serif; font-size: 15px; font-weight: 700;
  cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px;
  position: relative; overflow: hidden;
}
.btn:active { transform: scale(0.95); }
.btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
.bp {
  background: linear-gradient(135deg, #f59e0b, #ec4899);
  color: #fff; box-shadow: 0 4px 20px rgba(245,158,11,0.3), 0 0 40px rgba(236,72,153,0.15);
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}
.bp:hover { box-shadow: 0 6px 30px rgba(245,158,11,0.4), 0 0 60px rgba(236,72,153,0.2); }
/* ガチャ「引く」ボタン(金彫金+宝石面): 10連=サファイア/40連=ルビー。メイン(大=.gpb-lg)/連続(小=.gpb-sm)共通。
   予約アセット(assets/ui/btn-p10.webp・btn-p40.webp)が404の場合はJSX側onErrorでimgを消し、この.gpb-bg以下の金彫金CSSがそのまま床になる */
.gpb {
  position: relative; overflow: hidden; border: none; border-radius: 12px; padding: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
  background: linear-gradient(180deg, #241c11 0%, #15100a 55%, #1e170d 100%);
  box-shadow: inset 0 1px 0 rgba(240,214,145,0.16), inset 0 -3px 8px rgba(0,0,0,0.7), 0 3px 12px rgba(0,0,0,0.55);
}
.gpb::before {
  content: ''; position: absolute; inset: 0; z-index: 2; pointer-events: none; border-radius: inherit;
  border: 2px solid rgba(201,168,76,0.55);
}
.gpb10 { box-shadow: inset 0 1px 0 rgba(240,214,145,0.16), inset 0 -3px 8px rgba(0,0,0,0.7), 0 3px 14px rgba(37,99,235,0.32); }
.gpb10::before { border-color: rgba(96,165,250,0.6); }
.gpb40 { box-shadow: inset 0 1px 0 rgba(240,214,145,0.16), inset 0 -3px 8px rgba(0,0,0,0.7), 0 3px 14px rgba(220,38,38,0.32); }
.gpb40::before { border-color: rgba(248,113,113,0.6); }
.gpb:hover:not(:disabled) { filter: brightness(1.08); }
.btn.gpb:active:not(:disabled) { transform: translateY(1px); box-shadow: inset 0 1px 0 rgba(240,214,145,0.1), inset 0 -1px 4px rgba(0,0,0,0.7), 0 1px 4px rgba(0,0,0,0.4); }
.gpb-bg { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
.gpb10 .gpb-bg { background: radial-gradient(120% 160% at 50% -20%, rgba(96,165,250,0.35), transparent 60%), linear-gradient(180deg, #1c2a44 0%, #101a2c 60%, #182338 100%); }
.gpb40 .gpb-bg { background: radial-gradient(120% 160% at 50% -20%, rgba(248,113,113,0.32), transparent 60%), linear-gradient(180deg, #3a1414 0%, #200b0b 60%, #2c0f0f 100%); }
.gpb-img { position: absolute; inset: 0; z-index: 1; width: 100%; height: 100%; object-fit: cover; }
.gpb-shine {
  position: absolute; inset: 0; z-index: 3; pointer-events: none;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent);
  background-size: 200% 100%; animation: gradShift 3s ease infinite;
}
.gpb-label {
  position: relative; z-index: 4; font-family: 'Orbitron', 'Noto Sans JP', sans-serif; font-weight: 900;
  color: #f8ecc4; letter-spacing: 1px; text-shadow: 0 1px 2px rgba(0,0,0,0.85), 0 0 10px rgba(0,0,0,0.5);
}
.gpb-cost {
  position: relative; z-index: 4; font-family: 'Rajdhani', sans-serif; font-weight: 700;
  color: rgba(248,230,190,0.78); text-shadow: 0 1px 2px rgba(0,0,0,0.8);
}
.gpb-lg { min-height: 86px; padding: 0 12px; }
.gpb-lg .gpb-label { font-size: 25px; letter-spacing: 2px; text-shadow: 0 2px 3px rgba(0,0,0,0.9), 0 0 14px rgba(0,0,0,0.6); }
.gpb-lg .gpb-cost { font-size: 12px; }
.gpb-sm { min-height: 64px; padding: 0 22px; }
.gpb-sm .gpb-label { font-size: 19px; letter-spacing: 1.5px; }
.gpb-sm .gpb-cost { font-size: 10px; }
.bs {
  background: rgba(50,45,65,0.6); border: 1px solid rgba(139,92,246,0.2); color: #ccc;
  backdrop-filter: blur(4px);
}
.bs:hover { background: rgba(80,60,140,0.3); border-color: rgba(139,92,246,0.4); }
.bd { background: linear-gradient(135deg, #ef4444, #b91c1c); color: #fff; }
.st { font-size: 18px; font-weight: 900; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }

/* Home hero */
.hero-bg {
  position: relative; margin: -16px -16px 0; padding: 32px 16px 24px;
  background: url('bg.jpg') center top / cover no-repeat;
  border-bottom: 1px solid rgba(139,92,246,0.15);
  overflow: hidden;
}
.hero-bg::before {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.2) 50%, rgba(6,6,15,0.85) 100%);
}
.hero-orb {
  position: absolute; border-radius: 50%; filter: blur(40px); pointer-events: none; opacity: 0.4;
  animation: orbFloat 8s ease-in-out infinite;
}
@keyframes orbFloat {
  0%,100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-15px) scale(1.1); }
}
.hero-icon {
  font-size: 72px; position: relative; z-index: 1;
  animation: heroIconFloat 3s ease-in-out infinite;
  filter: drop-shadow(0 0 30px rgba(139,92,246,0.4));
}
@keyframes heroIconFloat {
  0%,100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
.hero-title {
  font-family: 'Orbitron', sans-serif; font-size: 28px; font-weight: 900;
  background: linear-gradient(135deg, #c084fc, #f472b6, #fbbf24, #a78bfa);
  background-size: 300% 300%;
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  animation: gradShift 4s ease infinite;
  letter-spacing: 3px; margin-top: 12px; position: relative; z-index: 1;
}
@keyframes gradShift {
  0%,100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
.hero-sub {
  font-family: 'Rajdhani', sans-serif; font-size: 14px; color: rgba(196,132,252,0.6);
  letter-spacing: 6px; margin-top: 4px; position: relative; z-index: 1;
}

/* Odometer */
.odo-wrap {
  margin: 20px 0 16px; position: relative; z-index: 1;
}
.odo-label {
  font-family: 'Rajdhani', sans-serif; font-size: 11px; color: rgba(251,191,36,0.5);
  letter-spacing: 4px; margin-bottom: 8px;
}
.odo-digits { display: flex; justify-content: center; gap: 5px; }
.odo-d {
  width: 36px; height: 50px;
  background: linear-gradient(180deg, rgba(15,15,30,0.95) 0%, rgba(22,22,44,0.95) 49%, rgba(10,10,25,0.95) 50%, rgba(18,18,36,0.95) 100%);
  border: 1px solid rgba(139,92,246,0.25);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Orbitron', sans-serif; font-size: 24px; font-weight: 900;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04);
  transition: color 0.3s, border-color 0.3s, box-shadow 0.3s;
}
.odo-d.lit {
  color: #fbbf24; border-color: rgba(245,158,11,0.4);
  box-shadow: 0 4px 12px rgba(0,0,0,0.4), 0 0 15px rgba(245,158,11,0.15), inset 0 1px 0 rgba(255,255,255,0.04);
  text-shadow: 0 0 10px rgba(245,158,11,0.5);
}
.odo-d.dim { color: rgba(139,92,246,0.15); }

/* Stat cards */
.stat-cards {
  display: flex; gap: 10px; justify-content: center; margin: 16px 0;
  position: relative; z-index: 1;
}
.stat-card {
  flex: 1; max-width: 140px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(139,92,246,0.12);
  border-radius: 14px; padding: 12px 8px;
  text-align: center; backdrop-filter: blur(4px);
}
.stat-card-val {
  font-family: 'Orbitron', sans-serif; font-size: 18px; font-weight: 900;
  color: #c084fc;
}
.stat-card-label {
  font-size: 10px; color: rgba(255,255,255,0.35); margin-top: 2px;
}

/* Menu buttons */
.menu-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
  max-width: 340px; margin: 20px auto 0; position: relative; z-index: 1;
}
.menu-card {
  background: linear-gradient(180deg, rgba(40,35,50,0.85), rgba(25,20,35,0.9));
  border: 1px solid rgba(139,92,246,0.2);
  border-radius: 14px; padding: 16px 8px;
  text-align: center; cursor: pointer; transition: all 0.25s;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05);
}
.menu-card:hover {
  border-color: rgba(139,92,246,0.4);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(139,92,246,0.25), 0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05);
}
.menu-card-icon { font-size: 30px; margin-bottom: 6px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)); }
.menu-card-label { font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.85); }
.menu-card.primary {
  grid-column: 1 / -1;
  background: linear-gradient(180deg, rgba(40,35,50,0.85), rgba(25,20,35,0.9));
  border-color: rgba(139,92,246,0.2);
}
.menu-card.primary:hover {
  border-color: rgba(139,92,246,0.4);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(139,92,246,0.25), 0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05);
}
@keyframes menuShimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Gacha */
.gs { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.cr { display: grid; gap: 6px; width: 100%; max-width: 440px; }
.chest {
  width: 78px; height: 78px; display: flex; align-items: center; justify-content: center;
  font-size: 50px; animation: cb 1.5s ease-in-out infinite; transition: transform 0.2s;
}
.chest-img { width: 76px; height: 76px; }
@keyframes cb { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
.chest.rbw { animation: cb 1.5s ease-in-out infinite, rbs 2s linear infinite; }
.chest.silver-chest { animation: cb 1.5s ease-in-out infinite; filter: drop-shadow(0 0 6px rgba(200,214,229,0.5)); }
.chest.gold-chest { animation: cb 1.5s ease-in-out infinite; filter: drop-shadow(0 0 8px rgba(255,215,0,0.5)); }

/* Chest styled boxes */
.chest-box {
  width: 56px; height: 56px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; font-weight: 900; position: relative;
  font-family: 'Orbitron', sans-serif;
}
.chest-box.wood-box {
  background: linear-gradient(135deg, #8B6914, #A0782C, #6B4F10);
  border: 2px solid #C4A54D; color: #F5E6C4;
  box-shadow: 0 4px 12px rgba(139,105,20,0.4), inset 0 1px 0 rgba(255,255,255,0.15);
}
.chest-box.silver-box {
  background: linear-gradient(135deg, #9EABBE, #D5DDE8, #B8C4D4, #E8EDF3, #A8B6C8);
  border: 2px solid #E8EDF3; color: #fff;
  box-shadow: 0 4px 18px rgba(200,214,229,0.5), 0 0 12px rgba(255,255,255,0.15), inset 0 1px 0 rgba(255,255,255,0.5);
  text-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.chest-box.gold-box {
  background: linear-gradient(135deg, #B8860B, #FFD700, #DAA520);
  border: 2px solid #FFE44D; color: #fff;
  box-shadow: 0 4px 18px rgba(255,215,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3);
}
.chest-box.rainbow-box {
  background: linear-gradient(135deg, #ff6b6b, #ffd93d, #6bff6b, #6bc5ff, #d06bff);
  background-size: 300% 300%;
  border: 2px solid rgba(255,255,255,0.6); color: #fff;
  box-shadow: 0 4px 20px rgba(255,107,107,0.3), 0 0 30px rgba(107,197,255,0.2);
  animation: rainbowBg 3s ease infinite;
}
@keyframes rainbowBg { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
@keyframes crownPulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 8px rgba(255,215,0,0.3); }
  50% { transform: scale(1.03); box-shadow: 0 0 16px rgba(255,215,0,0.5); }
}
@keyframes rbs { 0%{filter:hue-rotate(0deg)} 100%{filter:hue-rotate(360deg)} }
.rc {
  background: rgba(15,15,30,0.95); border-radius: 10px; padding: 6px 4px; text-align: center;
  border: 2px solid; animation: ri 0.25s ease-out; min-width: 0; overflow: hidden;
}
/* 40連: 8列×5行のコンパクト表示で1画面に収める(小画面の .chest 64px 指定より優先) */
.cr.cr-40 { gap: 4px !important; }
.cr-40 .chest { width: 40px !important; height: 40px !important; }
.cr-40 .chest img { width: 38px !important; height: 38px !important; border-radius: 7px !important; }
.cr-40 .rc { padding: 3px 2px !important; border-width: 1px !important; border-radius: 7px !important; width: 100%; }
@keyframes ri { 0%{transform:scale(0) rotateY(180deg);opacity:0} 100%{transform:scale(1) rotateY(0);opacity:1} }
/* 宝箱開封4コマ(A7 2026-08-25): 120ms×4で切り替わり、以降opacity:0のまま残る(pointer-events:noneなので操作に無影響) */
@keyframes chestFrame4 { 0%,24%{opacity:1} 25%,100%{opacity:0} }
.god { animation: gp 1s ease-in-out infinite; }
@keyframes gp { 0%,100%{box-shadow:0 0 20px rgba(255,255,255,0.3),0 0 60px rgba(139,92,246,0.3)} 50%{box-shadow:0 0 40px rgba(255,255,255,0.6),0 0 100px rgba(245,158,11,0.4)} }
.ci.god { background: rgba(255,215,0,0.08); border-color: rgba(255,255,255,0.4) !important; }

/* Rank color effects - ★6 Ultra */
.rank-ultra {
  color: #e67e22;
  text-shadow: 0 0 6px rgba(230,126,34,0.4), 0 0 12px rgba(230,126,34,0.2);
}
/* ★7 Epic */
.rank-epic {
  background: linear-gradient(90deg, #ff4757, #ff6b81, #ff4757);
  background-size: 200% 100%;
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  animation: rainbowText 3s linear infinite;
  filter: drop-shadow(0 0 4px rgba(255,71,87,0.4));
}
/* ★8 Legend */
.rank-silver {
  background: linear-gradient(90deg, #a8b6c8, #e8edf3, #c8d6e5, #e8edf3, #a8b6c8);
  background-size: 300% 100%;
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  animation: rainbowText 4s linear infinite;
  filter: drop-shadow(0 0 6px rgba(200,214,229,0.5)) drop-shadow(0 0 12px rgba(200,214,229,0.2));
}
/* ★9 Mythic */
.rank-gold {
  background: linear-gradient(90deg, #b8860b, #ffd700, #fff8dc, #ffd700, #b8860b);
  background-size: 300% 100%;
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  animation: rainbowText 3s linear infinite;
  filter: drop-shadow(0 0 8px rgba(255,215,0,0.6)) drop-shadow(0 0 16px rgba(255,215,0,0.2));
}
/* ★10 God */
.rank-rainbow {
  background: linear-gradient(90deg, #ff6b6b, #ffd93d, #6bff6b, #6bc5ff, #d06bff, #ff6b6b);
  background-size: 200% 100%;
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  animation: rainbowText 1.5s linear infinite;
  filter: drop-shadow(0 0 6px rgba(255,215,0,0.5));
}
@keyframes rainbowText { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
/* ★MAX */
.rank-diamond {
  background: linear-gradient(135deg, #fff, #ffd700, #fff, #ff69b4, #fff, #7b68ee, #fff);
  background-size: 400% 400%;
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  animation: diamondShift 2s ease infinite;
  filter: drop-shadow(0 0 8px rgba(255,215,0,0.8)) drop-shadow(0 0 16px rgba(255,255,255,0.4));
}
@keyframes diamondShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
/* ★12 CONGRATULATIONS */
.rank-congrats {
  background: linear-gradient(135deg, #ffd700, #fff, #ff69b4, #7b68ee, #00ffcc, #ffd700, #fff, #ff69b4);
  background-size: 600% 600%;
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  animation: congratsShift 3s ease infinite;
  filter: drop-shadow(0 0 12px rgba(255,215,0,1)) drop-shadow(0 0 24px rgba(255,105,180,0.7)) drop-shadow(0 0 36px rgba(123,104,238,0.5));
}
@keyframes congratsShift { 0%,100%{background-position:0% 50%} 33%{background-position:100% 0%} 66%{background-position:50% 100%} }
/* ★12 Tier3 Ultimate - distinct from rank-congrats */
.rank-ultimate {
  background: linear-gradient(135deg, #00ffcc, #fff, #7b68ee, #00ffcc, #ffd700, #ff69b4, #00ffcc, #fff);
  background-size: 800% 800%;
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  animation: ultimateShift 2s ease infinite;
  filter: drop-shadow(0 0 14px rgba(0,255,204,1)) drop-shadow(0 0 28px rgba(123,104,238,0.8)) drop-shadow(0 0 42px rgba(255,215,0,0.5));
}
@keyframes ultimateShift { 0%,100%{background-position:0% 0%} 25%{background-position:100% 50%} 50%{background-position:50% 100%} 75%{background-position:0% 50%} }
@keyframes congratsGlow {
  0%,100% { box-shadow: 0 0 20px rgba(255,215,0,0.4), 0 0 40px rgba(255,105,180,0.3), 0 0 60px rgba(123,104,238,0.2); }
  50% { box-shadow: 0 0 40px rgba(255,215,0,0.8), 0 0 80px rgba(255,105,180,0.5), 0 0 120px rgba(123,104,238,0.3); }
}

/* Card glow per rank */
.rc.rank6-card {
  border-color: #e67e22 !important;
  box-shadow: 0 0 12px rgba(230,126,34,0.25), 0 0 24px rgba(230,126,34,0.1) !important;
}
.rc.rank7-card {
  border-color: #ff4757 !important;
  box-shadow: 0 0 16px rgba(255,71,87,0.3), 0 0 32px rgba(255,71,87,0.1) !important;
  animation: rank7Pulse 2s ease-in-out infinite;
}
@keyframes rank7Pulse {
  0%,100% { box-shadow: 0 0 16px rgba(255,71,87,0.3), 0 0 32px rgba(255,71,87,0.1); }
  50% { box-shadow: 0 0 24px rgba(255,71,87,0.4), 0 0 40px rgba(255,71,87,0.15); }
}
.rc.rank8-card {
  border-color: #c8d6e5 !important;
  box-shadow: 0 0 20px rgba(200,214,229,0.35), 0 0 40px rgba(200,214,229,0.15) !important;
  animation: rank8Shine 3s ease-in-out infinite;
}
@keyframes rank8Shine {
  0%,100% { box-shadow: 0 0 20px rgba(200,214,229,0.35), 0 0 40px rgba(200,214,229,0.15); border-color: #a8b6c8; }
  50% { box-shadow: 0 0 30px rgba(232,237,243,0.5), 0 0 50px rgba(200,214,229,0.25); border-color: #e8edf3; }
}
.rc.rank9-card {
  border-color: #ffd700 !important;
  box-shadow: 0 0 25px rgba(255,215,0,0.4), 0 0 50px rgba(255,215,0,0.15), 0 0 80px rgba(255,215,0,0.05) !important;
  animation: rank9Glow 2.5s ease-in-out infinite;
}
@keyframes rank9Glow {
  0%,100% { box-shadow: 0 0 25px rgba(255,215,0,0.4), 0 0 50px rgba(255,215,0,0.15); border-color: #b8860b; }
  50% { box-shadow: 0 0 35px rgba(255,215,0,0.6), 0 0 60px rgba(255,215,0,0.25), 0 0 90px rgba(255,215,0,0.1); border-color: #ffd700; }
}
.rc.rank10-card {
  box-shadow: 0 0 30px rgba(255,107,129,0.4), 0 0 60px rgba(107,197,255,0.3), 0 0 90px rgba(208,107,255,0.2) !important;
  animation: rainbowGlow 2s ease-in-out infinite;
  border-width: 3px !important;
}
@keyframes rainbowGlow {
  0%,100% { box-shadow: 0 0 30px rgba(255,107,107,0.5), 0 0 60px rgba(255,209,61,0.3); border-color: #ff6b6b; }
  25% { box-shadow: 0 0 30px rgba(255,209,61,0.5), 0 0 60px rgba(107,255,107,0.3); border-color: #ffd93d; }
  50% { box-shadow: 0 0 30px rgba(107,255,107,0.5), 0 0 60px rgba(107,197,255,0.3); border-color: #6bff6b; }
  75% { box-shadow: 0 0 30px rgba(107,197,255,0.5), 0 0 60px rgba(208,107,255,0.3); border-color: #6bc5ff; }
}
.rc.rank11-card {
  box-shadow: 0 0 40px rgba(255,215,0,0.6), 0 0 80px rgba(255,255,255,0.3), 0 0 120px rgba(255,107,255,0.2) !important;
  animation: rank11Pulse 1.5s ease-in-out infinite;
  border: 3px solid #ffd700 !important;
  background: linear-gradient(160deg, rgba(30,20,50,0.95), rgba(50,30,20,0.95)) !important;
}
@keyframes rank11Pulse {
  0%,100% { box-shadow: 0 0 40px rgba(255,215,0,0.6), 0 0 80px rgba(255,255,255,0.3), 0 0 120px rgba(255,107,255,0.2); transform: scale(1); }
  50% { box-shadow: 0 0 60px rgba(255,215,0,0.8), 0 0 100px rgba(255,255,255,0.5), 0 0 150px rgba(255,107,255,0.3); transform: scale(1.03); }
}

/* Minigames */
.mgc {
  background: linear-gradient(180deg, rgba(50,45,65,0.7), rgba(35,30,48,0.85));
  border: 1px solid rgba(139,92,246,0.15);
  border-radius: 14px; padding: 18px; margin-bottom: 10px; cursor: pointer; transition: all 0.2s;
}
.mgc:hover { background: rgba(80,60,140,0.2); border-color: rgba(139,92,246,0.3); transform: translateX(4px); }
.tap {
  width: 180px; height: 180px; border-radius: 50%;
  background: radial-gradient(circle, #ec4899, #be185d);
  display: flex; align-items: center; justify-content: center; font-size: 56px;
  cursor: pointer; box-shadow: 0 8px 40px rgba(236,72,153,0.4);
  user-select: none; -webkit-user-select: none; transition: transform 0.05s;
}
.tap:active { transform: scale(0.92); }
.ft {
  position: absolute; font-weight: 900; font-size: 22px;
  pointer-events: none; animation: fu 0.8s ease-out forwards;
}
@keyframes fu { 0%{opacity:1;transform:translateY(0) scale(1)} 100%{opacity:0;transform:translateY(-70px) scale(1.4)} }
@keyframes gemFall { 0%{opacity:1;transform:translateY(0) rotate(0deg)} 60%{opacity:1} 100%{opacity:0;transform:translateY(120px) rotate(180deg)} }
.md { font-family: 'Orbitron', sans-serif; font-size: 34px; font-weight: 900; text-align: center; margin: 16px 0; color: #fbbf24; }
.mi {
  background: rgba(255,255,255,0.08); border: 2px solid rgba(139,92,246,0.25);
  border-radius: 12px; padding: 10px 16px; font-size: 22px; color: #fff;
  text-align: center; width: 180px; font-family: 'Orbitron', sans-serif; outline: none;
}
.mi:focus { border-color: #a78bfa; box-shadow: 0 0 20px rgba(139,92,246,0.2); }

/* Collection & Synth */
.cg { display: grid; grid-template-columns: repeat(auto-fill, minmax(72px, 1fr)); gap: 6px; }
.ci {
  aspect-ratio: 1; background: linear-gradient(180deg, rgba(50,45,65,0.85), rgba(30,25,42,0.9));
  border: 1px solid rgba(139,92,246,0.15);
  border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center;
  font-size: 26px; cursor: pointer; transition: all 0.2s; position: relative;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04);
}
.ci:hover { background: rgba(139,92,246,0.15); border-color: rgba(139,92,246,0.35); transform: scale(1.05); }
.ci.un { opacity: 0.2; cursor: default; }
.ci.un:hover { transform: none; background: linear-gradient(180deg, rgba(50,45,65,0.85), rgba(30,25,42,0.9)); }
.ic { position: absolute; top: 3px; right: 3px; background: rgba(0,0,0,0.7); border-radius: 6px; padding: 1px 4px; font-size: 9px; font-weight: 700; }
.cn { font-size: 7px; font-weight: 700; margin-top: 1px; text-align: center; line-height: 1.1; max-width: 100%; padding: 0 2px; }
.tb { width: 100%; height: 5px; background: rgba(50,45,65,0.4); border-radius: 3px; overflow: hidden; margin: 8px 0; }
.tf { height: 100%; border-radius: 3px; background: linear-gradient(90deg, #a78bfa, #c084fc); transition: width 0.1s linear; }
.sr { display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; margin: 8px 0; }
.sb { background: rgba(50,45,65,0.6); border: 1px solid rgba(139,92,246,0.15); border-radius: 8px; padding: 3px 10px; font-size: 12px; font-weight: 700; }
.tf2 { display: flex; gap: 5px; margin-bottom: 10px; flex-wrap: wrap; }
.tfb {
  background: linear-gradient(180deg, #241c11, #14100a);
  border: 1px solid rgba(201,168,76,0.32);
  border-radius: 6px; padding: 3px 10px; font-size: 11px; cursor: pointer;
  color: #cbb37e; transition: all 0.2s; font-family: 'Noto Sans JP', sans-serif; font-weight: 700;
  box-shadow: inset 0 1px 0 rgba(240,214,145,0.10);
}
.tfb:hover { border-color: rgba(240,214,145,0.6); color: #f2e0aa; }
.tfb.act {
  background: linear-gradient(180deg, #f4e2ac 0%, #d0aa50 55%, #b8913c 100%);
  border-color: rgba(255,240,200,0.85); color: #1a1206;
  box-shadow: 0 0 10px rgba(201,168,76,0.4), inset 0 1px 0 rgba(255,255,255,0.5);
}
.tfe { font-size: 12px; margin-right: 2px; line-height: 1; }

/* Modal */
.mo {
  position: fixed; inset: 0; background: rgba(0,0,0,0.85);
  display: flex; align-items: center; justify-content: center; z-index: 200; padding: 16px;
  backdrop-filter: blur(4px);
}
.mc {
  background: linear-gradient(160deg, rgba(30,25,50,0.98), rgba(20,15,35,0.98));
  border-radius: 20px; padding: 24px; max-width: 340px; width: 100%;
  text-align: center; border: 2px solid; animation: ri 0.3s ease-out;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
}

/* Synth */
.ss { display: flex; gap: 14px; align-items: center; justify-content: center; margin: 16px 0; }
.sl {
  width: 72px; height: 72px; border: 2px dashed rgba(139,92,246,0.25); border-radius: 14px;
  display: flex; align-items: center; justify-content: center; font-size: 32px;
  cursor: pointer; background: rgba(50,45,65,0.3); transition: all 0.2s;
}
.sl.fl { border-style: solid; background: rgba(80,60,140,0.2); }
.sgl { display: grid; grid-template-columns: repeat(auto-fill, minmax(65px, 1fr)); gap: 6px; margin-top: 12px; max-height: 280px; overflow-y: auto; }

/* ===== RESPONSIVE / MOBILE ===== */
html { -webkit-text-size-adjust: 100%; }
body { overscroll-behavior: none; }
.G { -webkit-tap-highlight-color: transparent; max-width: 480px; margin: 0 auto; }

@media (max-width: 380px) {
  .hero-title { font-size: 22px !important; letter-spacing: 2px !important; }
  .hero-icon { font-size: 56px !important; }
  .hero-sub { font-size: 12px !important; letter-spacing: 4px !important; }
  .odo-d { width: 30px !important; height: 42px !important; font-size: 20px !important; }
  .stat-cards { gap: 6px !important; }
  .stat-card { padding: 10px 4px !important; }
  .stat-card-val { font-size: 15px !important; }
  .menu-grid { gap: 6px !important; }
  .menu-card { padding: 12px 6px !important; }
  .menu-card-icon { font-size: 22px !important; }
  .menu-card-label { font-size: 11px !important; }
  .hdr-t { font-size: 12px !important; }
  .coin { font-size: 12px !important; padding: 3px 10px !important; }
  .cg { grid-template-columns: repeat(auto-fill, minmax(60px, 1fr)) !important; }
  .sgl { grid-template-columns: repeat(auto-fill, minmax(56px, 1fr)) !important; }
  .cr { gap: 8px !important; }
  .chest { width: 70px !important; height: 70px !important; font-size: 44px !important; }
  .chest-img { width: 68px !important; height: 68px !important; }
  .tap { width: 150px !important; height: 150px !important; font-size: 48px !important; }
  .md { font-size: 28px !important; }
  .mi { font-size: 20px !important; width: 160px !important; }
  .nb img { width: 34px !important; height: 34px !important; }
  .nb { font-size: 10px !important; padding: 4px 5px 6px !important; }
  .scrh-t { font-size: 18px !important; letter-spacing: 4px !important; }
  .scrh-d { width: 52px !important; }
}

@media (min-width: 381px) and (max-width: 480px) {
  .hero-title { font-size: 26px !important; }
}

/* Safe area for notched phones */
.nav { padding-bottom: max(8px, env(safe-area-inset-bottom)) !important; }
.hdr { padding-top: max(10px, env(safe-area-inset-top)) !important; }

/* Prevent zoom on input focus (iOS) */
input[type="number"] { font-size: 16px; }

/* Touch targets */
.btn { min-height: 44px; }
.nb { min-height: 44px; min-width: 44px; }
.mgc { min-height: 44px; }
.menu-card { min-height: 44px; }
.tfb { min-height: 32px; display: inline-flex; align-items: center; }
.ci { min-height: 60px; }

/* Rare effects */
@keyframes rareFlash {
  0% { opacity: 0; }
  30% { opacity: 1; }
  100% { opacity: 0; }
}
@keyframes rareShake {
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-4px, 2px); }
  20% { transform: translate(4px, -2px); }
  30% { transform: translate(-3px, -3px); }
  40% { transform: translate(3px, 3px); }
  50% { transform: translate(-2px, 1px); }
  60% { transform: translate(2px, -1px); }
  70% { transform: translate(-1px, 2px); }
  80% { transform: translate(1px, -2px); }
  90% { transform: translate(-1px, -1px); }
}
@keyframes rareRainbow {
  0% { filter: hue-rotate(0deg) brightness(1.2); }
  100% { filter: hue-rotate(360deg) brightness(1.2); }
}
@keyframes rareGodText {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
.rare-flash {
  position: fixed; inset: 0; z-index: 9999; pointer-events: none;
  animation: rareFlash 0.4s ease-out forwards;
}
.rare-shake { animation: rareShake 0.5s ease-out; }
.rare-rainbow { animation: rareRainbow 2s linear; }
.rare-god-text {
  animation: rareGodText 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
@keyframes synthMaxPulse {
  0%, 100% { box-shadow: 0 0 60px rgba(255,215,0,0.3), 0 0 120px rgba(255,107,255,0.2), inset 0 0 60px rgba(255,215,0,0.1); }
  50% { box-shadow: 0 0 100px rgba(255,215,0,0.6), 0 0 200px rgba(255,107,255,0.4), inset 0 0 100px rgba(255,215,0,0.2); }
}
@keyframes synthMaxRotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes synthMaxIcon {
  0% { transform: scale(0) rotate(-180deg); opacity: 0; }
  60% { transform: scale(1.3) rotate(10deg); opacity: 1; }
  80% { transform: scale(0.95) rotate(-3deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
@keyframes synthMaxBurst {
  0% { transform: scale(0); opacity: 1; }
  100% { transform: scale(3); opacity: 0; }
}
@keyframes synthGodIcon {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes cardFlip {
  0% { transform: scaleX(1); }
  50% { transform: scaleX(0); }
  100% { transform: scaleX(1); }
}
@keyframes cardMatch {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 0.5; }
}
.card-flip { animation: cardFlip 0.3s ease-in-out; }
.card-match { animation: cardMatch 0.4s ease-out; }
@keyframes bubblePop {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.5; }
  100% { transform: scale(0); opacity: 0; }
}
@keyframes bubbleGrow {
  0% { transform: scale(0.95); }
  50% { transform: scale(1.08); }
  100% { transform: scale(1); }
}
@keyframes bubbleDanger {
  0%, 100% { box-shadow: 0 0 8px rgba(239,68,68,0.3); }
  50% { box-shadow: 0 0 20px rgba(239,68,68,0.6); }
}
.bubble-pop { animation: bubblePop 0.4s ease-out forwards; }
.bubble-grow { animation: bubbleGrow 0.15s ease-out; }
.bubble-danger { animation: bubbleDanger 1s ease-in-out infinite; }
@keyframes drawFlash {
  0% { background: rgba(239,68,68,0); }
  20% { background: rgba(239,68,68,0.15); }
  100% { background: rgba(239,68,68,0); }
}
@keyframes enemyShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
@keyframes drawText {
  0% { transform: scale(0.5); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}
.draw-flash { animation: drawFlash 0.3s ease-out; }
.enemy-shake { animation: enemyShake 0.3s ease-in-out; }
.draw-text { animation: drawText 0.3s ease-out; }
`;

// Local date string (YYYY-MM-DD) - NOT UTC
function getLocalDate(date) {
  const d = date || new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function getWeekId() {
  const d = new Date();
  d.setHours(0,0,0,0);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return getLocalDate(d);
}

const DAILY_MISSION_POOL = [
  // 累積型ミッション（ローンチ直後は累積=デイリー）
  { type: 'gacha', text: 'ガチャを全員で{n}回引こう', targets: [1000, 2000, 3000], unit: '回' },
  { type: 'minigame', text: 'ミニゲームを全員で{n}回プレイ', targets: [100, 150, 200], unit: '回' },
  { type: 'synth', text: '合成を全員で{n}回使おう', targets: [500, 750, 1000], unit: '回' },
  { type: 'tap', text: '連打で全員合計{n}コイン稼ごう', targets: [5000, 10000, 20000], unit: 'コイン' },
  { type: 'timing', text: 'ルパンタイマーで全員合計{n}コイン', targets: [3000, 6000, 10000], unit: 'コイン' },
  { type: 'shooting', text: 'シューティングで全員合計{n}コイン', targets: [4000, 8000, 15000], unit: 'コイン' },
  { type: 'gift', text: 'ギフトを全員で{n}円分送ろう', targets: [100000000, 300000000, 600000000], unit: '円' },   // 2026-08-25竹森氏裁定: 旧5億/10億/20億は通常到達不能のため1億/3億/6億に引き下げ
  { type: 'quickdraw', text: '早撃ちガンマンで全員合計{n}コイン', targets: [3000, 6000, 12000], unit: 'コイン' },
  { type: 'memory', text: '神経衰弱で全員合計{n}コイン', targets: [2000, 4000, 8000], unit: 'コイン' },
  { type: 'godAnother', text: 'ゴッドアナザーで全員合計{n}コイン', targets: [30000, 60000, 120000], unit: 'コイン' },
  { type: 'juggler', text: 'ジャグラーで全員合計{n}コイン', targets: [10000, 20000, 40000], unit: 'コイン' },
];

function generateDailyMissions(dateStr) {
  // 累積型: 日付に関係なく固定の3ミッションセットを生成
  // ローンチ直後は累積=デイリーとして運用
  let seed = 0;
  for (let i = 0; i < dateStr.length; i++) seed += dateStr.charCodeAt(i) * (i + 1);
  // typeの全文字ハッシュ(先頭1文字だけだとgacha/gift/godAnotherが衝突して偏る)
  // 2026-08-24以前は旧ロジック維持(導入当日のミッション日中差替え=進捗リセットを防止)
  const legacy = dateStr <= '2026-08-24';
  const additive = dateStr <= '2026-08-25';   // 8/25の抽選結果を凍結(当日の日中差し替え=進捗孤児化を防止)
  const mix = (t) => { let h = 0; for (let j = 0; j < t.length; j++) h = (h * 31 + t.charCodeAt(j)) % 100003; return h; };
  // 2026-08-26以降は積型ハッシュ: 加算型は「mix値の円環を回転させるだけ」で組合せが9通りに固定される欠陥があった(2026-08-25裁定で根治)
  const keyOf = (t) => legacy ? (seed * 31 + t.charCodeAt(0)) % 100
    : additive ? (seed * 31 + mix(t)) % 100
    : ((seed + 1) * (mix(t) + 7)) % 100003;
  const shuffled = [...DAILY_MISSION_POOL].sort((a, b) => keyOf(a.type) - keyOf(b.type));
  // 毎日1枠は「全員の普段のプレイで必ず進む」汎用ミッションを確保する。
  // (2026-08-25事故: 抽選がsynth/shooting/giftに偏り、1日中ガチャ・ミニゲームを遊んでも3本とも0のままだった)
  const picked = shuffled.slice(0, 3);
  const ANCHOR_TYPES = ['gacha', 'minigame'];
  if (!picked.some(m => ANCHOR_TYPES.includes(m.type))) {
    const anchorType = ANCHOR_TYPES[seed % ANCHOR_TYPES.length];
    const anchor = DAILY_MISSION_POOL.find(m => m.type === anchorType);
    if (anchor) picked[2] = anchor;
  }
  return picked.map((m, i) => {
    const targetIdx = (seed + i) % m.targets.length;
    const target = m.targets[targetIdx];
    const displayTarget = m.type === 'gift' ? formatYen(target) : target.toLocaleString();
    return { ...m, target, text: m.text.replace('{n}', displayTarget), id: m.type + '_' + target };
  });
}
