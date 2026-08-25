// ============================================================
// DATA: 5 Types × 11 Ranks (★1-10 + ★MAX) = 55 Monsters
// ============================================================
const TYPES = [
  { id: "gem", name: "宝石", emoji: "💎", color: "#3498db" },
  { id: "gold", name: "黄金遺産", emoji: "👑", color: "#f1c40f" },
  { id: "relic", name: "古代秘宝", emoji: "🏺", color: "#e67e22" },
  { id: "art", name: "芸術品", emoji: "🎨", color: "#e74c3c" },
  { id: "space", name: "宇宙の秘宝", emoji: "🛸", color: "#9b59b6" },
  { id: "kingdom", name: "王国", emoji: "🏰", color: "#8b5cf6" },
];

// ★6-10=元の1/2, ★5=3%, ★4=8%, 残り87.12%を★1-3に配分
const RARITIES = [
  { rank: 1, label: "コモン", color: "#8e9aab", rate: 37 },
  { rank: 2, label: "アンコモン", color: "#a3b18a", rate: 29 },
  { rank: 3, label: "レア", color: "#2ecc71", rate: 21.6536 },
  { rank: 4, label: "Sレア", color: "#3498db", rate: 8 },
  { rank: 5, label: "SSレア", color: "#9b59b6", rate: 3 },
  { rank: 6, label: "ウルトラ", color: "#e67e22", rate: 0.8 },
  { rank: 7, label: "エピック", color: "#ff4757", rate: 0.4 },
  { rank: 8, label: "レジェンド", color: "#c8d6e5", rate: 0.11 },
  { rank: 9, label: "ミシカル", color: "#ffd700", rate: 0.0244 },
  { rank: 10, label: "ゴッド", color: "#ff6b81", rate: 0.012 },
  { rank: 11, label: "★MAX", color: "#ffffff", rate: 0 },
  { rank: 12, label: "CONGRATULATIONS", color: "#fffacd", rate: 0 },
];

const MONSTERS = {
  gem: [
    { name: "石ころ", icon: "🪨", desc: "道端に落ちてる小石", img: "assets/items/it-gem-01.webp" },
    { name: "アメジスト", icon: "🟣", desc: "パワーストーン屋の定番", img: "assets/items/it-gem-02.webp" },
    { name: "翡翠", icon: "🟢", desc: "宝石店の入門ジュエリー", img: "assets/items/it-gem-03.webp" },
    { name: "サファイア", icon: "🔵", desc: "婚約指輪クラスの青い石", img: "assets/items/it-gem-04.webp" },
    { name: "ルビー", icon: "🔴", desc: "高級ジュエリーの赤い宝石", img: "assets/items/it-gem-05.webp" },
    { name: "エメラルド", icon: "💚", desc: "セレブの首飾りに輝く石", img: "assets/items/it-gem-06.webp" },
    { name: "ブラックオパール", icon: "🖤", desc: "コレクター垂涎の虹色の石", img: "assets/items/it-gem-07.webp" },
    { name: "ダイヤモンド", icon: "💎", desc: "一生モノの最高の輝き", img: "assets/items/it-gem-08.webp" },
    { name: "ピンクダイヤ", icon: "✨", desc: "世界に数個の希少石", img: "assets/items/it-gem-09.webp" },
    { name: "永遠の輝石", icon: "🌟", desc: "伝説の超越宝石", img: "assets/items/it-gem-10.webp" },
    { name: "神々の宝玉", icon: "💫", desc: "宇宙を創った究極の石", img: "max-gem.webp" },
  ],
  gold: [
    { name: "銅貨", icon: "🪙", desc: "古い1円玉みたいな銅貨", img: "assets/items/it-gold-01.webp" },
    { name: "銀のスプーン", icon: "🥄", desc: "アンティーク食器", img: "assets/items/it-gold-02.webp" },
    { name: "金貨", icon: "💰", desc: "ずっしり重い金貨", img: "assets/items/it-gold-03.webp" },
    { name: "金塊", icon: "🧱", desc: "銀行の金庫に眠る金塊", img: "assets/items/it-gold-04.webp" },
    { name: "黄金の聖杯", icon: "🏆", desc: "教会の宝物庫の聖杯", img: "assets/items/it-gold-05.webp" },
    { name: "プラチナの王冠", icon: "💍", desc: "王族の装飾品", img: "assets/items/it-gold-06.webp" },
    { name: "王の錫杖", icon: "🔱", desc: "国王の権力の象徴", img: "assets/items/it-gold-07.webp" },
    { name: "戴冠の大冠", icon: "👑", desc: "戴冠式に使われた至宝", img: "assets/items/it-gold-08.webp" },
    { name: "黄金の玉座", icon: "🪑", desc: "帝国の玉座そのもの", img: "assets/items/it-gold-09.webp" },
    { name: "全世界の王笏", icon: "☀️", desc: "全大陸を治めた王の杖", img: "assets/items/it-gold-10.webp" },
    { name: "天帝の至宝", icon: "🔆", desc: "神が座した黄金の玉座", img: "max-gold.webp" },
  ],
  relic: [
    { name: "欠けた土器", icon: "🫙", desc: "畑から出てきた破片", img: "assets/items/it-relic-01.webp" },
    { name: "錆びた古代コイン", icon: "🪙", desc: "フリマで見つけた古銭", img: "assets/items/it-relic-02.webp" },
    { name: "封印の巻物", icon: "📜", desc: "読めない古代文字の巻物", img: "assets/items/it-relic-03.webp" },
    { name: "黄金の仮面", icon: "🎭", desc: "博物館の目玉展示品", img: "assets/items/it-relic-04.webp" },
    { name: "ファラオの指輪", icon: "💍", desc: "エジプト王の遺品", img: "assets/items/it-relic-05.webp" },
    { name: "不死鳥の羽根", icon: "🪶", desc: "本当に存在した証拠", img: "assets/items/it-relic-06.webp" },
    { name: "賢者の石", icon: "⚗️", desc: "錬金術の最終到達点", img: "assets/items/it-relic-07.webp" },
    { name: "時空の砂時計", icon: "⏳", desc: "時間を操る古代装置", img: "assets/items/it-relic-08.webp" },
    { name: "創世の書", icon: "📖", desc: "世界の始まりが記された書", img: "assets/items/it-relic-09.webp" },
    { name: "万物の起源石", icon: "🌌", desc: "全ての物質の始まり", img: "assets/items/it-relic-10.webp" },
    { name: "アトランティスの核", icon: "🕳️", desc: "失われた文明の究極エネルギー", img: "max-relic.webp" },
  ],
  art: [
    { name: "子供の絵", icon: "🖍️", desc: "冷蔵庫に貼るやつ", img: "assets/items/it-art-01.webp" },
    { name: "陶芸の皿", icon: "🍽️", desc: "陶芸教室の作品", img: "assets/items/it-art-02.webp" },
    { name: "骨董の花瓶", icon: "🏺", desc: "鑑定団に出せるレベル", img: "assets/items/it-art-03.webp" },
    { name: "名匠のバイオリン", icon: "🎻", desc: "コンサート級の名器", img: "assets/items/it-art-04.webp" },
    { name: "印象派の油絵", icon: "🖼️", desc: "美術館に展示される一枚", img: "assets/items/it-art-05.webp" },
    { name: "大理石の彫刻", icon: "🏛️", desc: "ルーヴル級の彫刻", img: "assets/items/it-art-06.webp" },
    { name: "ストラディバリウス", icon: "🎵", desc: "数億円の伝説の名器", img: "assets/items/it-art-07.webp" },
    { name: "モナリザ級名画", icon: "🎨", desc: "国宝・門外不出の絵画", img: "assets/items/it-art-08.webp" },
    { name: "ミケランジェロの天井画", icon: "🌈", desc: "人類史の頂点の芸術", img: "assets/items/it-art-09.webp" },
    { name: "神殿の壁画", icon: "🌠", desc: "神が描いたとされる壁画", img: "assets/items/it-art-10.webp" },
    { name: "創造神の傑作", icon: "✴️", desc: "宇宙そのものが作品", img: "max-art.webp" },
  ],
  space: [
    { name: "隕石のカケラ", icon: "☄️", desc: "庭に落ちてきた隕石片", img: "assets/items/it-space-01.webp" },
    { name: "月の石", icon: "🌑", desc: "アポロが持ち帰った石", img: "assets/items/it-space-02.webp" },
    { name: "火星のクリスタル", icon: "🔴", desc: "火星探査で発見された結晶", img: "assets/items/it-space-03.webp" },
    { name: "星間コンパス", icon: "🧭", desc: "異星文明の航海道具", img: "assets/items/it-space-04.webp" },
    { name: "異星の水晶球", icon: "🔮", desc: "宇宙人の通信装置", img: "assets/items/it-space-05.webp" },
    { name: "暗黒物質の結晶", icon: "🟣", desc: "科学を超えた未知の物質", img: "assets/items/it-space-06.webp" },
    { name: "ワープコア", icon: "⚛️", desc: "光速を超えるエンジンの核", img: "assets/items/it-space-07.webp" },
    { name: "恒星のコア", icon: "🌞", desc: "太陽の心臓部そのもの", img: "assets/items/it-space-08.webp" },
    { name: "銀河の心臓", icon: "🌀", desc: "銀河系の中心エネルギー", img: "assets/items/it-space-09.webp" },
    { name: "ビッグバンの種", icon: "💥", desc: "宇宙誕生の瞬間そのもの", img: "assets/items/it-space-10.webp" },
    { name: "全次元の鍵", icon: "🗝️", desc: "全並行宇宙を開く究極の鍵", img: "max-space.webp" },
  ],
  kingdom: [
    { name: "村の地図", icon: "🗺️", desc: "手書きの村の見取り図", img: "assets/items/it-kingdom-01.webp" },
    { name: "城下町の鍵", icon: "🗝️", desc: "古い町の門の鍵", img: "assets/items/it-kingdom-02.webp" },
    { name: "騎士の紋章", icon: "🛡️", desc: "名もなき騎士の盾", img: "assets/items/it-kingdom-03.webp" },
    { name: "領主の印章", icon: "📜", desc: "小さな領地の証明書", img: "assets/items/it-kingdom-04.webp" },
    { name: "王城の設計図", icon: "🏰", desc: "城を建てた建築家の遺産", img: "assets/items/it-kingdom-05.webp" },
    { name: "女王の王冠", icon: "👸", desc: "一国を治めた女王の冠", img: "assets/items/it-kingdom-06.webp" },
    { name: "帝国の勅令", icon: "⚖️", desc: "大陸を支配した帝国の法典", img: "assets/items/it-kingdom-07.webp" },
    { name: "征服王の剣", icon: "⚔️", desc: "世界を征した王の愛剣", img: "assets/items/it-kingdom-08.webp" },
    { name: "黄金都市の鍵", icon: "🌟", desc: "エルドラドへの入口", img: "assets/items/it-kingdom-09.webp" },
    { name: "全大陸の盟約書", icon: "🌐", desc: "世界統一の条約原本", img: "assets/items/it-kingdom-10.webp" },
    { name: "天空王国の玉座", icon: "☁️", desc: "神々が座した天上の王座", img: "max-kingdom.webp" },
  ],
};

// ★12 Congratulations items (3 tiers, collection-wide)
const CONGRATS_TIERS = [
  { key: 'cg1_12', name: "永劫の至宝", icon: "👑", desc: "★MAX全6種を集めた究極の証", tier: 1, tierLabel: "Tier 1", tierColor: "#ffd700" },
  { key: 'cg2_12', name: "永劫の至宝・虹", icon: "🌈", desc: "★MAX全6種×3を極めし者の証", tier: 2, tierLabel: "Tier 2", tierColor: "#ff69b4" },
  { key: 'cg3_12', name: "永劫の至宝・極", icon: "💠", desc: "裏アイテム全66種を制覇せし者の証", tier: 3, tierLabel: "Tier 3", tierColor: "#00ffcc" },
];

const SELL_VALUES = [1, 2, 4, 8, 15, 30, 60, 150, 400, 1000, 5000, 50000];
// 資産価値（円）: ★1=1,000円～★MAX=400億円, ★12=1,000億円
const POWER_VALUES = [1000, 10000, 100000, 500000, 2500000, 12000000, 60000000, 300000000, 1500000000, 8000000000, 30000000000, 100000000000];

// 円表示フォーマット（カンマ区切り数字）
function formatYen(n) {
  return n.toLocaleString() + '円';
}
const GACHA_COST_1 = 20;
const GACHA_COST_10 = 200;
const GACHA_COST_40 = 800;

// ============================================================
// 種族セット効果(コレクションボーナス)
// 1種族の★1〜★10(10種)を全て所持すると、その種族の効果が常時発動する(countは1でよい/★MAX不要)。
// 効果値を変えるときはここだけを直す(表示ラベルと実装が同じ定数を見るのでズレが起きない)。
// ============================================================
const SET_BONUS_EFFECTS = {
  gem:     { label: 'ガチャコイン 5%引き',      discount: 0.05 },
  gold:    { label: 'コイン自動回復 +25%',      rate: 0.25 },
  relic:   { label: 'ログインボーナス +20%',    rate: 0.20 },
  art:     { label: 'ミニゲーム獲得コイン +5%', rate: 0.05 },
  space:   { label: '裏アイテム 出現率 +10%',   rate: 0.10 },
  kingdom: { label: 'ミッション貢献 +10%',      rate: 0.10 },
};

// コレクションから種族ごとの発動状態を求める純関数。{ gem:true, gold:false, ... }
function computeSetBonuses(coll) {
  const s = {};
  TYPES.forEach(t => {
    let complete = true;
    for (let r = 1; r <= 10; r++) {
      const it = coll && coll[`${t.id}_${r}`];
      if (!it || !(it.count > 0)) { complete = false; break; }
    }
    s[t.id] = complete;
  });
  return s;
}

// ============================================================
// スコアキーの世代交代(ランキングリセットの仕組み)
// 配点スケールを大きく変えたゲームは、スコアの記録・表示キーを新世代に切り替える。
// 旧スコアは旧キーに残置(自動バックアップ)され、端末に残る旧自己ベストの同期でも
// 新ランキングが汚染されない。playCounts・ミッションは元のgameIdのまま。
// 2026-08-25: godAnother 第8次(配点60%化)で godAnother2 に世代交代=ランキング一斉リセット。
// ============================================================
const SCORE_KEY_MAP = { godAnother: 'godAnother2' };
const scoreKeyOf = (gid) => SCORE_KEY_MAP[gid] || gid;

// ガチャ費用の唯一の算出口。ボタン表示・コイン不足判定・pull()の支払いは必ずこれを通す
// (表示と実支払いのズレを構造的に作らないため)。
function gachaCostFor(n, setBonuses) {
  const base = n === 40 ? GACHA_COST_40 : n === 10 ? GACHA_COST_10 : GACHA_COST_1;
  const off = (setBonuses && setBonuses.gem) ? SET_BONUS_EFFECTS.gem.discount : 0;
  return Math.round(base * (1 - off));
}

function getChestType(rank) {
  if (rank >= 8) return "rainbow";
  if (rank >= 5) return "gold";
  if (rank >= 3) return "silver";
  return "wood";
}

// 合成: 必要数(★1-2=2体, ★3-9=3体)。コレクション用に各1個は残す
const getSynthReq = (rank) => rank <= 2 ? 2 : 3;

// ============================================================
// ★MAX進化 = プリズム(煌)
// 同種の★MAX(<typeId>_11)×3 → 「<★MAX名>・煌」1個(コレクションキー <typeId>_11k)
// 資産価値は★MAX3個分を保つ(進化で総資産が減らない)。Tier判定も実効数(_11 + 3×_11k)で数える。
// ============================================================
const PRISM_SUFFIX = '_11k';
const PRISM_MERGE = 3;               // ★MAX3個 → 煌1個
const PRISM_NAME_SUFFIX = '・煌';
const isPrismKey = (k) => typeof k === 'string' && k.slice(-4) === PRISM_SUFFIX;

// count値の取り出し(圧縮形 {key:count} / 展開形 {key:{count}} の両方に対応)
const countOf = (v) => (typeof v === 'number' ? v : (v && v.count) || 0);

// コレクション1エントリ(key,count)の資産価値。煌は★MAX3個分として数える。
function entryPower(key, count, rank) {
  const r = typeof rank === 'number' ? rank : parseInt(String(key).split('_')[1]);
  const base = POWER_VALUES[r - 1] || 0;
  return base * (count || 0) * (isPrismKey(key) ? PRISM_MERGE : 1);
}

// アイテムオブジェクト1個あたりの資産価値(モーダル等の単価表示用)。
function itemUnitPower(item) {
  if (!item) return 0;
  return (POWER_VALUES[item.rank - 1] || 0) * (item.prism ? PRISM_MERGE : 1);
}

// 種族ごとの★MAX実効所持数 = _11.count + 3 × _11k.count。
// Tier判定(congratsTier)・★MAXリロール適格判定・展示の所持判定の正本。
function maxEffCount(coll, typeId) {
  if (!coll) return 0;
  return countOf(coll[typeId + '_11']) + countOf(coll[typeId + PRISM_SUFFIX]) * PRISM_MERGE;
}

// ★MAX×3 → 煌 の合成候補。意思を持ってやる特別操作のため一撃合成(runSynthCascade)には含めない。
function computePrismCandidates(coll) {
  const out = [];
  TYPES.forEach(type => {
    const c = countOf((coll || {})[type.id + '_11']);
    if (c >= PRISM_MERGE) {
      out.push({ special: 'prism', key: type.id + '_11', typeId: type.id, rank: 11, targetRank: 11,
        req: PRISM_MERGE, count: c, synthCount: Math.floor(c / PRISM_MERGE) });
    }
  });
  return out;
}

// 任意のコレクション状態から合成候補を列挙する純関数(一撃合成の連鎖計算にも使う)
function computeSynthCandidates(coll) {
  const candidates = [];
  TYPES.forEach(type => {
    for (let rank = 1; rank <= 9; rank++) {
      const req = getSynthReq(rank);
      const key = `${type.id}_${rank}`;
      const item = coll[key];
      if (item && item.count >= req + 1) {
        candidates.push({ key, typeId: type.id, rank, count: item.count, synthCount: Math.floor((item.count - 1) / req), targetRank: rank + 1, req });
      }
    }
  });
  // ★10: total across ALL types (keep 1 per type)
  let total10 = 0;
  TYPES.forEach(t => { const it = coll[`${t.id}_10`]; if (it && it.count > 1) total10 += it.count - 1; });
  if (total10 >= 3) {
    candidates.push({ special: 'star10', rank: 10, total10, synthCount: Math.floor(total10 / 3), targetRank: 11, req: 3 });
  }
  return candidates.sort((a, b) => {
    if (a.rank !== b.rank) return b.rank - a.rank;
    if (a.special) return -1; if (b.special) return 1;
    return TYPES.findIndex(t => t.id === a.typeId) - TYPES.findIndex(t => t.id === b.typeId);
  });
}

// 一撃合成: 合成で生まれたアイテムがさらに合成可能なら、可能な限り連鎖して一気に合成する。
// ドライラン(simulate=true)では乱択(★MAXの種族)だけが実行時と異なり得るが、件数・消費数は決定的。
function runSynthCascade(startColl, onMaxCreated) {
  let n = { ...startColl };
  const rareItems = [];
  let totalSynths = 0;
  let passes = 0;
  for (let guard = 0; guard < 30; guard++) {
    const candidates = computeSynthCandidates(n);
    if (candidates.length === 0) break;
    passes++;
    candidates.forEach(c => {
      if (c.special === 'star10') {
        let rem = c.synthCount * 3;
        for (const tp of TYPES) {
          if (rem <= 0) break;
          const k = `${tp.id}_10`;
          if (n[k] && n[k].count > 1) {
            const take = Math.min(n[k].count - 1, rem);
            n[k] = { ...n[k], count: n[k].count - take };
            rem -= take;
          }
        }
        for (let i = 0; i < c.synthCount; i++) {
          const rt = TYPES[Math.floor(Math.random() * TYPES.length)];
          const nm = MONSTERS[rt.id][10]; const nr = RARITIES[10];
          const nk = `${rt.id}_11`;
          if (n[nk]) n[nk] = { ...n[nk], count: n[nk].count + 1 };
          else n[nk] = { ...nm, typeId: rt.id, typeName: rt.name, typeEmoji: rt.emoji, typeColor: rt.color, rank: 11, rarity: nr, count: 1 };
          rareItems.push({ icon: nm.icon, name: nm.name, rank: 11, rarity: nr, count: 1, img: nm.img });
          if (onMaxCreated) onMaxCreated(nm);
        }
        totalSynths += c.synthCount;
      } else {
        const avail = n[c.key]?.count || 0;
        const sc = Math.floor((avail - 1) / c.req);
        if (sc <= 0) return;
        const left = avail - sc * c.req;
        n[c.key] = { ...n[c.key], count: left };
        const tp = TYPES.find(t => t.id === c.typeId);
        const nm = MONSTERS[c.typeId][c.targetRank - 1]; const nr = RARITIES[c.targetRank - 1];
        const nk = `${c.typeId}_${c.targetRank}`;
        if (n[nk]) n[nk] = { ...n[nk], count: n[nk].count + sc };
        else n[nk] = { ...nm, typeId: c.typeId, typeName: tp.name, typeEmoji: tp.emoji, typeColor: tp.color, rank: c.targetRank, rarity: nr, count: sc };
        if (c.targetRank >= 9) {
          rareItems.push({ icon: nm.icon, name: nm.name, rank: c.targetRank, rarity: nr, count: sc, img: nm.img });
        }
        totalSynths += sc;
      }
    });
  }
  return { coll: n, rareItems, totalSynths, passes };
}

// Star display: rarity color, 6th onwards brighter+glow for counting
// Render item icon: AI画像(正方形タイル絵)を優先し、404などで読めない時は従来の絵文字へ自動フォールバック。
// 画像は<img>と絵文字<span>を常に両方描画し、onErrorでimgを隠してspanを出す(壊れ画像アイコンを出さない)。
// 描画方式(cover + 角丸)は max-*.png 時代から不変。item.imgが無いアイテムは従来通り絵文字のみ。
const ITEM_GLOW_LEGACY = 'drop-shadow(0 0 8px rgba(255,215,0,0.6)) drop-shadow(0 0 16px rgba(255,255,255,0.3)) brightness(1.1)';
function itemIconGlow(rank) {
  if (typeof rank !== 'number') return ITEM_GLOW_LEGACY; // rank不明: 従来の金色影を維持
  if (rank >= 10) return 'drop-shadow(0 0 6px rgba(255,107,129,0.75)) drop-shadow(0 0 14px rgba(107,197,255,0.5)) drop-shadow(0 0 24px rgba(208,107,255,0.4)) brightness(1.12)';
  if (rank >= 8) return 'drop-shadow(0 0 7px rgba(255,215,0,0.6)) drop-shadow(0 0 15px rgba(255,255,255,0.28)) brightness(1.08)';
  if (rank >= 5) return 'drop-shadow(0 0 5px rgba(255,215,0,0.3)) brightness(1.04)';
  return 'none';
}
function handleItemImgError(e) {
  const img = e.currentTarget;
  img.style.display = 'none';
  const fb = img.nextSibling;
  if (fb) fb.style.display = 'inline-block';
}
function renderItemIcon(item, size = 40, extraStyle = {}) {
  if (!item) return null;
  if (item.img) {
    return React.createElement('span', { style: { display: 'inline-block', lineHeight: 0 } },
      React.createElement('img', { key: 'img:' + item.img, src: item.img, alt: item.name,
        onError: handleItemImgError,
        style: { width: size, height: size, borderRadius: size * 0.2, objectFit: 'cover', display: 'block',
          filter: itemIconGlow(item.rank), ...extraStyle } }),
      React.createElement('span', { key: 'fb:' + item.img,
        style: { display: 'none', fontSize: size, lineHeight: 1 } }, item.icon)
    );
  }
  return React.createElement('span', { style: { fontSize: size, ...extraStyle } }, item.icon);
}

// 金の錠前アイコン(未取得表示)。画像404時はonErrorで従来の🔒絵文字にフォールバック
function renderLockIcon(size = 24) {
  return React.createElement('span', { style: { display: 'inline-block', lineHeight: 0 } },
    React.createElement('img', { key: 'exlock', src: 'assets/ui/ex-lock.webp', alt: '',
      onError: e => { const n = e.currentTarget.nextSibling; if (n) n.style.display = 'inline'; e.currentTarget.style.display = 'none'; },
      style: { width: size, height: size, objectFit: 'contain', display: 'block', mixBlendMode: 'screen' } }),
    React.createElement('span', { key: 'exlockfb', style: { display: 'none', fontSize: size, lineHeight: 1 } }, '🔒')
  );
}

// 金貨アイコン。画像404時はonErrorで従来の🪙絵文字にフォールバック
function renderCoinIcon(size = 15) {
  return React.createElement('span', { style: { display: 'inline-block', lineHeight: 0, flexShrink: 0 } },
    React.createElement('img', { key: 'hdcoin', src: 'assets/ui/hd-coin.webp', alt: '',
      onError: e => { const s = e.currentTarget.nextSibling; if (s) s.style.display = 'inline'; e.currentTarget.style.display = 'none'; },
      style: { width: size, height: size, objectFit: 'contain', display: 'block', mixBlendMode: 'screen' } }),
    React.createElement('span', { key: 'hdcoinfb', style: { display: 'none', fontSize: size - 1, lineHeight: 1 } }, '🪙')
  );
}

// 金銀銅メダル画像(1=金/2=銀/3=銅)。画像404時はonErrorで従来の絵文字にフォールバック
function renderMedalIcon(n, emoji, size = 14) {
  return React.createElement('span', { style: { display: 'inline-block', lineHeight: 0 } },
    React.createElement('img', { key: 'medal' + n, src: 'assets/ui/medal-' + n + '.webp', alt: '',
      onError: e => { const s = e.currentTarget.nextSibling; if (s) s.style.display = 'inline'; e.currentTarget.style.display = 'none'; },
      style: { width: size, height: size, objectFit: 'contain', display: 'block' } }),
    React.createElement('span', { key: 'medalfb' + n, style: { display: 'none', fontSize: size - 3, lineHeight: 1 } }, emoji)
  );
}

function renderStars(rank) {
  if (rank === 12) return <span className="rank-congrats" style={{ letterSpacing: 2 }}>CONGRATS</span>;
  if (rank === 11) return <span className="rank-diamond" style={{ letterSpacing: 2 }}>★MAX</span>;
  const rColor = RARITIES[rank - 1]?.color || '#fbbf24';
  // 6th star onward: use a brighter accent color (no blur/glow)
  const accentColors = {
    '#8e9aab': '#d0dae5', '#a3b18a': '#d4e8b0', '#2ecc71': '#80ffb0',
    '#3498db': '#80d4ff', '#9b59b6': '#d4a0f0', '#e67e22': '#ffcc44',
    '#ff4757': '#ff99a8', '#c8d6e5': '#ffffff', '#ffd700': '#ffff88',
    '#ff6b81': '#ffc0cc',
  };
  const accent = accentColors[rColor] || '#ffffff';
  const stars = [];
  for (let i = 0; i < Math.min(rank, 10); i++) {
    stars.push(<span key={i} style={{
      color: i >= 5 ? accent : rColor,
    }}>★</span>);
  }
  return <span style={{ letterSpacing: 1 }}>{stars}</span>;
}

function rollRarity(crownBonus) {
  const bonus = crownBonus || 1;
  const adjusted = RARITIES.map(r => {
    if (r.rank >= 7 && r.rank <= 10) return { ...r, rate: r.rate * bonus };
    return r;
  });
  // Adjust ★1 to keep total at 100%
  const totalOther = adjusted.filter(r => r.rank !== 1).reduce((s, r) => s + r.rate, 0);
  adjusted[0] = { ...adjusted[0], rate: Math.max(0, 100 - totalOther) };
  const r = Math.random() * 100;
  let cum = 0;
  for (const rarity of adjusted) {
    cum += rarity.rate;
    if (r < cum) return rarity.rank;
  }
  return 1;
}

function getCrownLevel(bonus) {
  const pct = (bonus - 1) * 100;
  if (pct >= 40) return 'super';
  if (pct >= 20) return 'major';
  if (pct > 0) return 'up';
  return null;
}

// ============================================================
// URA (HIDDEN) ITEMS - 66 shadow versions of all items
// ============================================================
const URA_ITEMS = (() => {
  const items = [];
  TYPES.forEach(type => {
    for (let rank = 1; rank <= 11; rank++) {
      const m = MONSTERS[type.id][rank - 1];
      if (!m) continue;
      items.push({
        id: `ura_${type.id}_${rank}`,
        name: `裏.${m.name}`,
        icon: m.icon,
        img: m.img,
        typeId: type.id,
        typeName: type.name,
        typeEmoji: type.emoji,
        typeColor: type.color,
        rank: rank,
        value: rank * 400000000, // rank × 4億円
      });
    }
  });
  return items;
})();
const URA_PROBABILITY = 16384; // 1/16384 per item in pool

// Roll for ura item: probability changes based on how many obtained
// 0-19 obtained (pool 66-47): 1/32768 per item
// 20-63 obtained (pool 46-3): 1/16384 per item
// 64-65 obtained (pool 2-1): 1/8192 per item
// Expected total: ~71,800 pulls to complete all 66
// probMult: 当選確率の倍率(未指定/1=従来どおり。spaceのセット効果で1.1)。
// 当選確率は uraPool.length / prob なので、確率をx倍するには分母をxで割る。
function rollUraItem(uraPool, probMult) {
  if (!uraPool || uraPool.length === 0) return null;
  const obtained = URA_ITEMS.length - uraPool.length;
  const base = obtained < 20 ? 32768 : uraPool.length <= 2 ? 8192 : 16384;
  const prob = Math.max(1, Math.round(base / (probMult > 0 ? probMult : 1)));
  const roll = Math.floor(Math.random() * prob);
  if (roll >= uraPool.length) return null;
  return uraPool[roll];
}

function rollMonster(crownBonus) {
  const rank = rollRarity(crownBonus);
  const type = TYPES[Math.floor(Math.random() * TYPES.length)];
  const m = MONSTERS[type.id][rank - 1];
  return { ...m, typeId: type.id, typeName: type.name, typeEmoji: type.emoji, typeColor: type.color, rank, rarity: RARITIES[rank - 1] };
}
