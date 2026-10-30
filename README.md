# ミレバワカル — 基本33問の確認用ページと図解資料

目の錯覚や関連する視覚現象を、ブラウザゲームに役立つ形で整理した資料です。

## 確認用ページ

- 入口：<https://chameleonjp-lab.github.io/mirebawakaru/>
- 単問一覧／指定：<https://chameleonjp-lab.github.io/mirebawakaru/dev/question-gallery.html?q=Q01>
- [33問の描画・採用状態](./docs/verification/base-33.md) ／ [検査・公開・再実行と障害対応](./docs/verification/release-checklist.md)

初回実装PRのマージ前は**実装・公開準備済み／マージ待ち**です。URLの記載は公開完了を意味しません。本人がmainへマージするとActionsが検査し、成功時だけPagesへ自動反映します。後続PRも同じ手順です。

その場の正解数・合計回答時間・答え合わせのみ。ホーム・新規プレイ・再読み込みで破棄し、成績や再現情報は保存・送信しません。自己ベスト、履歴、登録名、ランキング、DB、派生問題はありません。

```sh
npm ci
npx playwright install --with-deps chromium webkit
npm test
npm run test:browser
npm run dev -- --host 127.0.0.1 --port 4173 --prefix /mirebawakaru/
# http://127.0.0.1:4173/mirebawakaru/
```

実行時は標準ブラウザ機能だけを使います。検査用依存はlockfileで固定しています。

```sh
npm run build
node scripts/serve.mjs --root dist --prefix /mirebawakaru/ --port 4174
# 別ターミナル
TEST_BASE_URL=http://127.0.0.1:4174/mirebawakaru/ npm run test:browser
PAGE_URL=http://127.0.0.1:4174/mirebawakaru/ npm run verify:published
```

## 元の資料を開く
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

[基本33問の問題原稿とバリエーション方針](./docs/question-bank/README.md)を追加しています。問い・4択・正解・図の構成を定義した資料です。基本33問の確認用画面・アニメーションを実装しています。採用判断と実機確認は[確認表](./docs/verification/base-33.md)で保留と区別しています。

## ゲームの要件と実装計画

[要件仕様書](./docs/superpowers/specs/2026-10-31-mirebawakaru-game-requirements.md)には、決定済みの条件と作成者の提案を分けて、初期の33問の仕組み確認、成績保存なし、10問の進行と答え合わせ、本番準備への移行条件をまとめています。

[実装計画表](./docs/superpowers/plans/2026-10-31-mirebawakaru-game-implementation-plan.md)には、まず33問を確認し、問題がなかった種類の追加と記録機能を本番準備で扱う順序、依存関係、予定ファイル、検査、完了条件を記載しています。今回の実装・自動公開準備の差分と実施結果を末尾へ追記しています。初期段階は成績を保存しません。各系統1派生・計66形の案は、全33系統に問題がなかった場合に限ります。

## 限界と注意
資料は世界中の全錯視を網羅した目録ではありません。「体験」「条件付き体験」「模式図」を区別しています。効果の感じ方には個人差があり、認知能力や健康への効果は保証しません。

## 元のファイルについて

作成した完成HTML・Word文書・資料一式ZIPを、元のファイル形式のまま収録しています。ZIPには元の編集用コード・解説データ・HTMLとWord文書の作成スクリプトも含まれています。

完成HTML・Word文書・ZIPは、保存済みの原本とGit Blob SHAが一致することを確認しています。ZIP内のHTMLとWord文書も、それぞれ単体ファイルと同一です。



