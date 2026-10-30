# ミレバワカル — 目の錯覚の図解資料

目の錯覚や関連する視覚現象を、ブラウザゲームに役立つ形で整理した資料です。

## 最初に開く
**[図解ガイド（完成HTML）](./visual-illusion-atlas.html)** — 単体で動くHTMLです。外部の画像やコードを読み込みません（出典リンクを開く場合は通信が必要です）。

## 収録範囲
- 錯視・関連現象：10分類、80項目
- 理論・説明の枠組み：12項目
- 図解・答え合わせ・検索・分類・条件変更
- 再生と停止ができる動く例：24項目

## ファイル構成
| ファイル | 用途 |
| --- | --- |
| [visual-illusion-atlas.html](./visual-illusion-atlas.html) | 完成版の図解と操作画面 |
| [visual-illusion-guide.docx](./visual-illusion-guide.docx) | 錯視の種類・理論・出典をまとめたWord原本 |
| [visual-illusion-guide.md](./visual-illusion-guide.md) | Word文書の文章版 |
| [visual-illusion-materials.zip](./visual-illusion-materials.zip) | 完成HTML・Word原本・元の編集用コード・作成スクリプトなど全16ファイル |
| [catalog.json](./catalog.json) | 80項目、説明枠組み、参照資料のデータ |
| [source/page-template.html](./source/page-template.html) | 分割した編集用HTML |
| source/atlas.css | 表示スタイル |
| source/data.js | 解説情報 |
| source/renderers.js | 描画と動き |
| source/app.js | 操作処理 |

完成版はそのままブラウザで開けます。編集する場合は `source/page-template.html` を使えます。

## ゲーム用の基本問題

[基本33問の問題原稿とバリエーション方針](./docs/question-bank/README.md)を追加しています。問い・4択・正解・図の構成を定義した資料です。実際の問題画面やアニメーションは未実装です。

## ゲームの要件と実装計画

[要件仕様書](./docs/superpowers/specs/2026-10-31-mirebawakaru-game-requirements.md)には、決定済みの条件と作成者の提案を分けて、10問の進行、採点、計測、中断、答え合わせ、端末内の記録、iPhoneでの確認条件をまとめています。

[実装計画表](./docs/superpowers/plans/2026-10-31-mirebawakaru-game-implementation-plan.md)には、基本33問の実装から確認済みの派生追加までの順序、依存関係、予定ファイル、検査、完了条件を記載しています。いずれも実装前のレビュー用資料です。

## 限界と注意
資料は世界中の全錯視を網羅した目録ではありません。「体験」「条件付き体験」「模式図」を区別しています。効果の感じ方には個人差があり、認知能力や健康への効果は保証しません。

## 元のファイルについて

作成した完成HTML・Word文書・資料一式ZIPを、元のファイル形式のまま収録しています。ZIPには元の編集用コード・解説データ・HTMLとWord文書の作成スクリプトも含まれています。

完成HTML・Word文書・ZIPは、保存済みの原本とGit Blob SHAが一致することを確認しています。ZIP内のHTMLとWord文書も、それぞれ単体ファイルと同一です。


