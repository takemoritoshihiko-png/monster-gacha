# 引き継ぎメモ: 計器盤AI装飾帯(backlog #15)の途中状態

作成: 2026-08-24(PC画面最適化を優先するため中断)

## どこまでやったか
1. backlog #15(計器盤へのAI装飾帯・現状はSVG角飾り`GaCorners`のみ)が未対応であることをコードで確認済み
   - 対象: `index.html` 9083行付近の主計器パネル(className="ga-panel")と、その下のGOD/冥王/紫7/合算の4枚パネル
2. 竹森氏のGemini Pro(gemini.google.com)で生成を発注済み・**画像は生成中のまま中断**
   - チャットURL: https://gemini.google.com/app/5a44a1928272c77c
   - プロンプト: 横長の装飾パネル/古代ギリシャ神殿様式/暗い青銅の地+縁だけ細い金のメアンダー帯+四隅の金装飾/中央は無地(数字を重ねるため)/文字なし/白背景禁止/実機模倣禁止

## 再開手順
1. 上記チャットURLを開く→生成済み画像を確認(不良ならリテイク上限2回)
2. ダウンロード→`assets/god-another/panel.webp` にsharpでWebP化(scratchpadのwebp-toolに変換環境あり。黒点補正 .linear(1.08,-8) は背景画で使った実績値)
3. GA_ASSETS(index.html 7710行付近)に `panel: { file: 'panel.webp' }` を追加+プリロードリストに'panel'追加
4. 主計器パネルの背景に適用(gaAssetLoaded('panel')でロード時のみ・border-imageまたはbackground+低透明度。未ロード時は現行CSSが床=既存のprogressive enhancement様式に従う)
5. Babelチェック→目視→push→このメモを削除し、backlog #15を対応済みに更新
