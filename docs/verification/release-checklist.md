# 確認用ページの検査・公開手順

対象は**基本33問の確認用ページ**。成績保存・派生追加・本番の採用完了ではない。
基準main: `a3ce6a9356e6db0d2499a0335c878e1946b68fd5`。

## 公開の状態

| 段階 | 今回の状態 | 根拠 |
| --- | --- | --- |
| 実装・成果物 | 準備済み | ゲーム、検査、選択コピーのビルド、SHA別の参照先とハッシュ一覧 |
| 実装PR | 本人のマージ待ち | mainへ直接push・代理マージ・自動マージをしない |
| PR事前検査 | PRのChecks／Actions参照 | 検査のみ。本番配備は呼ばない |
| Pages配備成功 | 初回はマージ後に確認 | workflowのDeploy tested artifactステップとdeployment ID |
| 実URLの画面確認 | 初回はマージ後に確認 | 同じ配備ジョブの公開後検査。HTTP 200だけでは成功にしない |
| iPhone 17 Pro Safari実機 | 保留・未実施 | 自動WebKitのサイズ再現とは別 |

実行履歴: <https://github.com/chameleonjp-lab/mirebawakaru/actions/workflows/pages.yml>。
初回実装PRが未マージの時点では、**実Pagesの配備SHA・配備実行履歴はまだない**。ローカル成果物を配信して実行した公開後検査を、実URLの確認成功と混同しない。

## 既存設定の読取り結果

2026-10-30 UTC（2026-10-31 JST）に認証済みGitHub連携・CLIで取得した。

- Pages: `build_type=workflow`、公開元表示はmain `/`、`cname=null`、HTTPS有効。
- URL: <https://chameleonjp-lab.github.io/mirebawakaru/>。
- `github-pages` 環境: mainだけを許可するcustom branch policy。必須レビュアー、待機タイマーなし。既存の保護は変更・回避していない。
- Actions workflows: 0件。既存資料の `visual-illusion-atlas.html` は404だった。ビルドはその相対パスと元ファイルの内容を保持する。
- リポジトリのActions全体設定を読むAPIは `403 Resource not accessible by integration`。PRのワークフロー起動結果を最後に確認する。現時点で新しいPAT・秘密値・有料契約は不要。Pages方式の変更は既にworkflowだったため不要。

PRで検査が自動起動しない場合に限る、一度限りのiPhoneからの確認：Safariでリポジトリを開く → `…`／Settings（見つからなければ「デスクトップ用Webサイトを表示」）→ Actions → General → Actions permissions で公式actionsを許可。既存の組織ポリシーを勝手に解除しない。Settings → Pages → Build and deployment → Source が **GitHub Actions** であることを確認する。Environments → github-pages → Deployment branches は **main** を許可する。必須承認が追加されていた場合は回避せず、完全自動反映を妨げる設定として報告する。

通常運用では、PRごとの手動デプロイやCodexへの再依頼は不要。

## 事前検査と成果物

```sh
npm ci
npx playwright install --with-deps chromium webkit
npm test
npm run test:browser
npm run build
node scripts/serve.mjs --root dist --prefix /mirebawakaru/ --port 4174
# 別ターミナル
TEST_BASE_URL=http://127.0.0.1:4174/mirebawakaru/ npm run test:browser
PAGE_URL=http://127.0.0.1:4174/mirebawakaru/ npm run verify:published
```

ローカルのビルドはクリーンなコミットで行う。CIではcheckoutもビルドも `github.sha` に固定する。dirtyな開発ビルドは実コミットからの正式配備根拠にしない。

`dist/` はルート全体のコピーではなく、ゲーム、実行用JSON、入口・単問ページ、既存のHTML・Word・ZIP・原稿・出典資料を選択して集める。`node_modules`、`.git`、テスト結果、ローカル設定は含めない。`index.html` と `dev/question-gallery.html` は `_releases/<SHA>/game/` を参照し、JSのimportとJSON読み込みも同じ版の配下に解決する。既存資料のURLとバイトを保持する。

`release.json` と `_releases/<SHA>/manifest.json` にSHAとファイルハッシュ一覧を持つ（manifest自身の循環ハッシュは含めない）。ページの版表示だけを更新して旧コードを読む状態は、公開後の本文照合で失敗となる。

## ワークフローと古い版の防止

`.github/workflows/pages.yml`:

1. `pull_request`（main向け）は読取り権限だけの `verify`。全単体・ブラウザ検査、ビルド、公開成果物をサブパス配信した検査、公式Pages artifactアップロードを行う。本番配備はしない。
2. mainの`push`、mainの`workflow_dispatch`は同じ検査が成功してから `needs: verify` の `deploy` へ進む。検査・ビルドが失敗／キャンセルなら配備ジョブを呼ばない。
3. 検査した同一SHAをcheckoutし、**同じ実行で検査したPages artifactをダウンロード**する。最新mainを別途checkout／再ビルドして混ぜない。
4. `pages-production` の同時実行範囲に配備と公開後検査を入れる。`cancel-in-progress: false`、`queue: max`。PRにはこのグループを付けない。公式仕様のキュー上限は100件。
5. 配備直前の `check-main.mjs` がAPIでmain SHAを読む。対象SHAと一致しない、またはイベント・refがmain公開条件を満たさない場合は公開しない。
6. 公式`deploy-pages`成功後、`verify-published.mjs`が最大5分／15秒間隔でmanifestと画面・実読込ファイルを照合する。混在・例外・通信失敗は成功扱いにしない。
7. 後続mainに置き換わったときは「後続へ移行」であり、旧実行の画面確認成功ではない。最新mainの実行を参照する。配備前から古いものはそもそも配備しない。

`queue: max`により、古い再実行が最新の待機ジョブを消すデフォルトのsingleキューの問題を避ける。実行順がSHA順でなくても直前照合で古い版へ戻さない。mainが配備の直後に進んだ場合、既に配備済みの旧版を成功の根拠にせず、後続実行が最新mainを反映する。

## 自動公開の検査結果の区分

`tests/deployment.test.js` はYAMLそのものを解析し、実際のjob/step条件式をイベント行列で評価する。安全条件の欠落を含む変異も拒否する。freshnessのAPI応答に対応する関数も直接検査する。GitHub側の権限・OIDC・配備基盤を模擬検査だけで成功したとは扱わない。

| 条件 | 事前の自動検査 | 実GitHub配備 |
| --- | --- | --- |
| PRから配備不可 | 条件式評価で確認 | PRの実行でdeployがskipになることを確認 |
| main検査／ビルド失敗・キャンセルで配備不可 | `needs`・成功結果・順序・mandatory stepの検査 | 故意に失敗版をmainへマージする試験はしない |
| 非mainから手動配備不可 | ref/event行列で確認 | 本番配備は呼ばずに検査 |
| 古いSHAの再実行で配備不可 | freshness一致／不一致と条件式を確認 | 初回配備前に古い版の公開試験はしない |
| main成功時は同一SHAの成果物 | checkout、build、artifactの経路とハッシュを確認 | 本人のマージ後が初回の実配備 |
| JS/CSS/JSONの混在、タイムアウト | 本文ハッシュ不一致・有限回の再試行を確認 | 実URLをworkflowが照合 |

YAML構文追加検査: actionlint **1.7.12**（公式バイナリSHA-256 `8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8`）。この版は公式ドキュメントの新しい `concurrency.queue` 属性を未認識。`npm run lint:workflow` は、まず実YAMLのqueue:maxを必須ポリシーとして検査し、この属性だけを取り除いた入力をactionlintへ渡す。実際のworkflowや公開条件を緩和しない。YAML解析・式の行列検査は `npm test` に含む。

## 固定した公式Actions

実装時にGitHub公式リポジトリのタグをAPIで確認し、40桁SHAに固定した。

| Action | 確認した版 | 固定SHA |
| --- | --- | --- |
| actions/checkout | v5 | fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09 |
| actions/setup-node | v6 | 249970729cb0ef3589644e2896645e5dc5ba9c38 |
| actions/configure-pages | v6.0.0 | 45bfe0192ca1faeb007ade9deae92b16b8254a0d |
| actions/upload-pages-artifact | v5.0.0 | fc324d3547104276b827a68afc52ff2a11cc49c9 |
| actions/download-artifact | v5 | 634f93cb2916e3fdff6788551b99b062d0335ce0 |
| actions/deploy-pages | v5.0.1 | 368f82528645a54fb793d4d04e342629a3f51346 |

Node 24.19.0、Playwright 1.64.1、yaml 2.9.1。ブラウザ配布版もPlaywrightのlockされた版が決める。

## 障害時と再実行

- **事前検査／ビルド失敗:** 配備していないので既存公開を維持。Actionsの失敗ステップとログを見る。問題を通常の修正PRで直し、本人がmainへマージする。一時的な基盤エラーなら最新mainの実行のRe-run failed jobs／Re-run all jobs、またはActions → Verify and publish review page → Run workflow → branch **main**。
- **配備失敗:** 公開切替の有無をdeploymentと実URLの`release.json`で確認する。権限・Pages方式・main環境許可を確認。必須承認は回避しない。修正後、最新mainの実行を再実行する。古いSHAの再実行はfreshnessで配備されない。
- **公開後検査失敗:** 配備自体は成功している可能性がある。「配備成功／利用確認失敗」と記載し、期待SHA、実際のmanifest、読込ハッシュ不一致、通信／実行例外をログで確認。反映待ちは最大5分で終わる。成功扱いへ変更しない。
- **公開したコードの不具合:** 通常の修正PR、またはGitHubのRevertで**revert PR**を作り本人がマージする。その新しいmain SHAを通常のワークフローが検査・配備する。mainの履歴を書き換えず、以前の古いrunから上書き公開しない。
- **連続マージ:** 最終的にmain先頭SHAのrunのサマリーを確認する。古いrunの「後続へ移行」は新しいrunの成功を意味しない。キューが100件を超えた／Actions障害で最新がキャンセルされたときは最新mainのRun workflowを一度再実行する。

公式資料:

- <https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages>
- <https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site>
- <https://docs.github.com/en/actions/using-jobs/using-concurrency>（queue:max・FIFOの説明）
