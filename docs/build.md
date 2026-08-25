# ビルド手順(build.md)

`src/*.js` を編集したら、必ずこの手順でbundleを作り直してからコミットする。

## 使い方

```
cd tools/build && npm install    # 初回のみ(node_modulesはgitignore対象・毎クローンで必要)
node tools/build/build.js        # ビルド(リポジトリルートで実行)
node tools/build/build.js --check   # 検査のみ(pre-pushフックが使う。生成はしない)
```

`node`コマンドはリポジトリのルートから実行する(`tools/build/build.js`は内部で自分のいる場所からルートを逆算するので、カレントディレクトリがどこでも実害はないが、上記が基本形)。

## 何が起きるか

1. `src/*.js` をファイル名順(01→09)に連結する
2. Babelで変換する: `@babel/preset-env`(targets: chrome 40)+ `@babel/preset-react`(classic runtime)。JSXも古い構文まで含めてコンパイル
3. 変換後のコードをMD5ハッシュ化し、先頭8桁を使って `bundle.<hash>.js` を書き出す
4. `index.html` の `<script src="bundle...">` 参照行を新しいハッシュ名に書き換える
5. 世代整理: `bundle.*.js` を新しい順に**5世代だけ**残し、それより古いものを削除(prune)

ビルド1回の完了ログ例: `built bundle.xxxxxxxx.js (NNN KB, src 9ファイル) / index.html 参照更新済み`

## --check と pre-pushフック

`.git/hooks/pre-push`(ローカルのみ・**gitで管理されないファイル**)が、pushの直前に `node tools/build/build.js --check` を自動実行する。

- 検査内容: 現在の `bundle.<hash>.js` が実在するか、`index.html` の参照が一致しているか
- 不一致なら `check FAILED` でpushそのものを止める
- 一致していれば `check OK` でpushを通す

このフックのおかげで「srcだけ直してbundle再生成を忘れたままpushする」事故を機械的に防いでいる。

## トラブル時の対処

- **`check FAILED` / bundleが古いと言われた** → `node tools/build/build.js` を実行し、生成された `bundle.<新hash>.js` と更新された `index.html` を両方コミットに含める(古い世代のbundleは自動でpruneされるので、削除されたファイルもコミットに含めてよい)
- **新規クローンでpushしてもフックが働かない** → `.git/hooks/` はgit管理外のディレクトリのため、`clone`しただけの環境には `pre-push` が存在しない。現状、自動セットアップスクリプトは無い。既存環境の `.git/hooks/pre-push` の内容を手動でコピーし、実行権限を付ける必要がある
- **`tools/build/build.js` が `@babel/core` 等でエラーになる** → `tools/build/node_modules` が無い(gitignore対象)。`cd tools/build && npm install` を先に実行する
- **src 1ファイルが5,000行を超えた** → build.jsが警告を出すだけで止まりはしない(一律バックストップ規約)。分割するかどうかは可読性で判断する

## 設計判断の記録

**なぜ事前コンパイル(ビルド時にJSX変換)にしたか**
従来はbabel-standaloneがブラウザ上で毎回JSXを変換していた。事前コンパイルに切り替えたことで、ローカル実測でページ起動(DOMContentLoaded)が約13秒→474msに短縮した。

**なぜES5相当(preset-env targets chrome 40)まで落とすか**
旧babel-standaloneは`const`/`let`などもかなり古い構文まで変換していた。元のコードには「宣言前参照」(TDZ = Temporal Dead Zone)が潜在しており、それが強めの変換によって偶然動いていた実例がある(MonsterGacha内の`crownBonus`)。新しいビルドで挙動を変えないために、旧環境と同じレベルまで変換するchrome 40ターゲットを選んでいる。潜在するTDZそのものの根治は別件として`docs/backlog.md`に送っている。

**なぜハッシュ名で世代管理するか**
GitHub Pagesの`index.html`キャッシュは最大10分残ることがある。ファイル名を固定(`bundle.js`)にしていると、古い`index.html`が新しい`bundle.js`を読みにいって新旧コードが混在する事故が起きうる。ハッシュ名(`bundle.<hash>.js`)にして世代を残しておけば、古い`index.html`が生きていても対になる旧bundleがそのまま存在するため混在しない。新しい順に5世代を残し、それより古いものは自動削除する。
