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
| [visual-illusion-guide.md](./visual-illusion-guide.md) | Word文書の文章版 |
| [catalog.json](./catalog.json) | 80項目、説明枠組み、参照資料のデータ |
| [source/page-template.html](./source/page-template.html) | 分割した編集用HTML |
| source/atlas.css | 表示スタイル |
| source/data.js | 解説情報 |
| source/renderers.js | 描画と動き |
| source/app.js | 操作処理 |

完成版はそのままブラウザで開けます。編集する場合は `source/page-template.html` を使えます。

## 限界と注意
資料は世界中の全錯視を網羅した目録ではありません。「体験」「条件付き体験」「模式図」を区別しています。効果の感じ方には個人差があり、認知能力や健康への効果は保証しません。

## 元のファイルについて
元のWord文書（DOCX）と全素材ZIPは、この変更では元のファイル形式のままGitHubへ転送できていません。Word文書の文章版と、完成HTMLから取り出した編集用コード・データは収録しています。元のDOCXとZIPはChatGPTライブラリに保存されており、別途追加が必要です。
