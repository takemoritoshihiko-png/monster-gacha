# CODEBASE MAP — monster-gacha

読む人: 次セッションのAI + 竹森氏。「このリポジトリ、今どうなってる？」を1画面〜数画面で把握するための地図。正本はコードそのもの。ここは道案内。

最終更新: 2026-08-25(案C リファクタリング直後)

## 1. リポジトリ全体図(1画面で)

```
src/*.js (9ファイル・人が編集する唯一の場所)
     │  node tools/build/build.js
     ▼
bundle.<md5先頭8>.js  ← 生成物。直接編集禁止
     ▲ <script src="...">で参照
index.html (30行。参照1行以外はFirebase初期化とフォント読込のみ)
```

- **本番 = GitHub Pages・masterブランチ直結**。push = 即本番反映(サブエージェントのpushは禁止)
- **Firebase RTDB(`rankings`/`weeklyRankings`/`dailyRankings`)は実データ**。ニックネームを入れて遊ぶとランキングに書き込まれる
- `docs/` — この地図の他に `god-another-spec.md`(ゴッドアナザー正本仕様)、`backlog.md`(保留リスト、追記型)
- `assets/` — 画像・音声・動画(詳細は3章)
- `tools/build/` — ビルドスクリプト一式。使い方は `docs/build.md` 参照。`node_modules/` は `.gitignore` 対象
- `.git/hooks/pre-push` — push前に `node tools/build/build.js --check` を強制するローカルフック(git管理外。新規クローンには存在しない)

## 2. src 9ファイルの中身

行数は実測(`wc -l`)。

### 01-core.js(458行) — shim・サウンドエンジン・メインBGM
- 音合成の基礎関数: `playNote` / `playSweep` / `playChord` / `playNoise`
- `class BGMPlayer` とそのインスタンス `bgm`(効果音用の簡易シーケンサ)
- メインBGM再生系: `mainBgmAudio`(`bgm-main.mp3`)、`mainBgmControl`、`bgmRealVol`
- 効果音プリセット `BGM_TAP` / `BGM_CALC`、ディスパッチャ `sfx(name)`

### 02-data.js(375行) — ゲームデータ定数 + 共通ヘルパ
- マスタデータ: `TYPES` / `RARITIES` / `MONSTERS`(★1〜MAXの図鑑データ) / `CONGRATS_TIERS` / `SELL_VALUES` / `POWER_VALUES`
- 表示ヘルパ: `formatYen` / `getChestType` / `renderItemIcon` / `renderLockIcon` / `renderCoinIcon` / `renderMedalIcon` / `renderStars` / `itemIconGlow` / `handleItemImgError`
- 合成ロジック: `getSynthReq` / `computeSynthCandidates` / `runSynthCascade`
- **ガチャ抽選の本体はここ**: `rollRarity` / `getCrownLevel` / `rollMonster`、裏図鑑 `URA_ITEMS` / `URA_PROBABILITY` / `rollUraItem`

### 03-gacha-missions.js(811行) — CSS定数 + デイリーミッション
- 4〜751行目がほぼ全て `CSS`(全体スタイル定義の巨大テンプレート文字列。747行)
- 752行目以降: `getLocalDate` / `getWeekId` / `DAILY_MISSION_POOL` / `generateDailyMissions`
- 注意: ファイル名に反して「ガチャ抽選」の実体は02-data.jsにある(このファイルはCSSとミッションのみ)

### 04-app.js(3,355行) — MonsterGacha本体(シェル/ホーム/ガチャ画面)
- ただ1つの巨大コンポーネント `function MonsterGacha()`
- セーブ管理: スロット選択(`slotId`/`slotPreviews`)・ロード・削除・自動セーブ(30秒毎)・ギフト受信チェック
- 画面ルーター: `screen` state(`home`/`gacha`/`minigame`/`collection`/`synth`/`history`/`ranking`等)と切替関数 `nav()`
- ガチャ演出: 宝箱開封アニメーション(★ランクごとの開封タイミング差)・レアリティ演出音・MAX図鑑到達のファンファーレ・CONGRATSムービー分岐(`CONGRATS_MOVIE`)
- MAX所持追跡(3段階)

### 05-games-a.js(2,366行) — ミニゲーム前半(連打〜早撃ち)
- `TapGame` / `KukuGame`(九九) / `MathMidGame` / `MathEasyGame` / `MathHardAddGame` / `MathHardMultGame`
- `TimingGame`(タイミング連打) / `ShootingGame`(早撃ち) / `CoinTowerGame`(+`towerPreloadAssets`) / `MemoryGame`(神経衰弱) / `QuickDrawGame`
- `_BubbleGame_REMOVED` / `BubbleGame_PLACEHOLDER` — 撤去済みゲームの残骸(未使用)

### 06-juggler.js(566行) — ジャグラー
- `JugglerGame` 本体 + 専用サウンド: `jugMakeBuf` / `jugPlay` / `jugWarmup`

### 07-godanother.js(2,066行) — ゴッドアナザー(音・アセット・本体)
- 専用サウンドエンジン: `gaTrack` / `gaStopScheduled` / `gaMakeBuf` / `gaGetBus` / `gaEnsureReverb` / `gaPlay` / `gaWarmup` / `gaSpinLoopStart/Stop/Set` / `gaOrgan` / `gaSaw` / `gaChoir` / `gaGodFanfare`
- アセット登録・プリロード: `GA_ASSETS` / `GA_ASSET_IMGS` / `gaAssetState` / `gaPreloadAssets` / `gaAssetSrc` / `gaAssetLoaded`
- 装飾コンポーネント: `GaDefs`(SVG defs) / `GaMeterStyles` / `GaCorners`
- ゲーム本体: `GodAnotherGame`
- **正本仕様は `docs/god-another-spec.md`**(抽選テーブル・期待値実測はそちらが正)

### 08-games-b.js(1,918行) — ミニゲーム後半(バッティング〜ジュエル)
- `BattingGame` / `CoinRunnerGame` / `ChainBurstGame`(+`cbPreloadAssets`) / `PinballGame`(+`pinPreloadAssets`) / `GemCatchGame`(+`gcPreloadAssets`)

### 09-views.js(1,406行) — 展示室・合成・履歴・ランキング + マウント
- `SpendForm`(コイン消費) / `CollectionView`(展示室) / `SynthView`(合成) / `GameHistoryScreen` / `RankingScreen`
- 末尾: `ReactDOM.createRoot(...)` — アプリのマウント処理(エントリーポイント)

## 3. assetsフォルダの規約

- `assets/ui/` — シェルUI(ヘッダー`hd-*`・ナビ`ico-*`・ゲーム選択アイコン`gi-*`・景品`spend-*`・メダル`medal-*`等)。金彫金/青銅の統一デザイン言語
- `assets/god-another/` — ゴッドアナザー専用(背景`bg`・筐体`bezel`/`basestrip`/`pediment`/`panel`・図柄`sym-*`・カットイン`cutin-*`・降臨ムービー`god-movie.mp4`/`hades-movie.mp4`/`violet-movie.mp4`)
- `assets/games/` — 各ミニゲームのスプライト・背景。ファイル名は各ゲームコード冒頭のコメントに予約済み(未生成分は`docs/backlog.md`の保留リスト参照)
- `assets/items/` — 宝物アイコン。`it-<種族>-<01〜10>.webp`(種族=gem/gold/art/space/kingdom/relic、計60枚)
- `assets/gacha/` — 宝箱開封4コマ`chest-<種>-f1〜f4.webp`(種=wood/silver/gold/rainbow)+カットイン`cut-r8/9/10.webp`
- **ルート直下レガシー(混在に注意)**: 旧世代の画像・音声・動画。全部が死んでいるわけではない
  - **現役(コードから参照あり・実測grep済み)**: `bg.jpg` / `bgm-main.mp3` / `btn-gacha.webp` / `chest-{wood,silver,gold,rainbow}.png`と`.webp`(両方・別UI箇所で使い分け) / `nav-{home,gacha,game,collection,synth}.webp`(ボトムナビ) / `nav-game.png`(ミニゲーム画面見出しのみ・webp版と別枠) / `max-{art,gem,gold,kingdom,relic,space}.webp` / `congrats-tier1.mp4`
  - **孤児化(コードから参照なし・実測grep済み)**: `nav-{home,gacha,collection,synth}.png` / `btn-gacha.png` / `max-{art,gem,gold,kingdom,relic,space}.png` / `congrats-tier1-s.mp4` / `restore-yukarin.html`(一度きりの復旧ツール)。削除は本タスクのスコープ外につき未実施
  - `CONGRATS_MOVIE`(04-app.js)は`tier2`/`tier3`のmp4も参照するが実ファイルは無い(`docs/backlog.md`の保留リストどおり・404フォールバック設計)

## 4. 触る前に読む注意

1. **コード編集は必ず `src/*.js` に対して行う**。`bundle*.js` と `index.html` のbundle参照行は生成物・直接編集禁止。編集後は `node tools/build/build.js` を実行してbundleを再生成しコミットに含める(手順は `docs/build.md`)
2. **Firebase(`rankings`/`weeklyRankings`/`dailyRankings`)は本番実データ**。動作確認はニックネーム未入力で行う(実プレイ端末のブラウザプロファイルに接続してしまうこともあるので要注意)
3. ゴッドアナザーの抽選テーブル・演出仕様に触るときは `docs/god-another-spec.md` を先に読む(正本はそちら)
4. 保留・既知の未解決事項は `docs/backlog.md`(追記型・削除しない)
5. `.git/hooks/pre-push` はpush前にbundle鮮度を機械検査するが、git管理外のためこのリポジトリを新規クローンした環境には存在しない(詳細は `docs/build.md`)
