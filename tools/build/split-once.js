// 一度きりの機械的分割: index.html の <script type="text/babel"> 本体を、順序を変えずに src/*.js へ切り出す。
// 検証: 切り出したファイル群の連結が元のスクリプト本体と完全一致(バイト同一)であることを確認してから書き出す。
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const lines = html.split('\n');

// スクリプト境界を検出
const openIdx = lines.findIndex(l => l.includes('<script type="text/babel">'));
const closeIdx = lines.findIndex((l, i) => i > openIdx && l.trim() === '</script>');
if (openIdx < 0 || closeIdx < 0) { console.error('babel script block not found'); process.exit(1); }
const body = lines.slice(openIdx + 1, closeIdx); // スクリプト本体(タグ行を除く)
console.log(`babel block: lines ${openIdx + 2}..${closeIdx} (${body.length} lines)`);

// 分割点(元ファイルの行番号・各章の開始行)。境界は全てトップレベルの章バナー行。
const CUTS = [
  { at: 29, name: '01-core.js', label: 'shim + サウンドエンジン + BGM' },
  { at: 488, name: '02-data.js', label: 'ゲームデータ定数 + 共通ヘルパ' },
  { at: 864, name: '03-gacha-missions.js', label: 'ガチャ抽選 + CSS + デイリーミッション' },
  { at: 1676, name: '04-app.js', label: 'MonsterGacha 本体(シェル/ホーム/ガチャ画面)' },
  { at: 5032, name: '05-games-a.js', label: 'ミニゲーム前半(連打〜早撃ち)' },
  { at: 7399, name: '06-juggler.js', label: 'ジャグラー' },
  { at: 7966, name: '07-godanother.js', label: 'ゴッドアナザー(音/アセット/本体)' },
  { at: 10033, name: '08-games-b.js', label: 'ミニゲーム後半(バッティング〜ジュエル)' },
  { at: 11952, name: '09-views.js', label: '展示室/合成/履歴/ランキング + mount' },
];

// 元ファイル行番号 -> body 配列インデックス (body[0] = 元ファイル openIdx+2 行目)
const toBodyIdx = (fileLine) => fileLine - (openIdx + 2);

const pieces = [];
for (let i = 0; i < CUTS.length; i++) {
  const start = toBodyIdx(CUTS[i].at);
  const end = i + 1 < CUTS.length ? toBodyIdx(CUTS[i + 1].at) : body.length;
  if (start < 0 || end > body.length || start >= end) { console.error('bad cut', CUTS[i]); process.exit(1); }
  pieces.push({ ...CUTS[i], text: body.slice(start, end).join('\n') });
}

// 同一性検証: 連結 === 元本体
const rejoined = pieces.map(p => p.text).join('\n');
const original = body.join('\n');
if (rejoined !== original) {
  console.error('IDENTITY CHECK FAILED: 連結結果が元スクリプトと一致しない');
  process.exit(1);
}
console.log('identity check: OK (連結 = 元スクリプト本体, ' + original.length + ' chars)');

// src/ へ書き出し
const SRC = path.join(ROOT, 'src');
fs.mkdirSync(SRC, { recursive: true });
for (const p of pieces) {
  fs.writeFileSync(path.join(SRC, p.name), p.text, 'utf8');
  console.log(`src/${p.name}  (${p.text.split('\n').length} 行)  ${p.label}`);
}

// 新しい index.html: babel standalone の <script> 行を削除し、babel ブロックを bundle 参照に置換
const out = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('@babel/standalone')) continue;               // ランタイム変換を撤去
  if (i === openIdx) { out.push('  <script src="bundle.js"></script>'); continue; }  // 仮参照(build.jsがhash付きに更新)
  if (i > openIdx && i <= closeIdx) continue;                          // 旧ブロック本体を除去
  out.push(lines[i]);
}
fs.writeFileSync(path.join(ROOT, 'index.html'), out.join('\n'), 'utf8');
console.log('index.html rewritten (' + out.length + ' 行)');
