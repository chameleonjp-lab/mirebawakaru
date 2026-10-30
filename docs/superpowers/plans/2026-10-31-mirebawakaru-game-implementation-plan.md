# ミレバワカル 実装計画表（Implementation Plan）

> **実装担当へ：** この計画を実行する際は `superpowers:executing-plans`、または明示的に担当を分ける指示がある場合は `superpowers:subagent-driven-development` に沿って、各作業を確認してから進める。PR #3時点の手順を保持し、末尾の実施記録と公開タスクT11を今回の追加指示として適用する。

**Goal:** 最初は基本33問の仕組み・描画・答え合わせを確認できる画面と10問の確認用プレイを作る。この段階は成績を保存しない。確認結果を整理した後、本番準備で問題がなかった種類の追加と記録機能へ進む。

**Architecture:** 問題原稿から実行用の4候補を作り、描画・判定・答え合わせが同じデータを参照する。初期は一時状態だけを使い、保存処理を接続しない。確認用の出題と本番への採用条件を分け、既存資料を保持する。

**Tech Stack:** HTML、CSS、JavaScriptの標準モジュール、Canvas 2D。実行時の外部ライブラリは使わない。純粋な判定の検査はNode.jsの標準テスト、画面検査はPlaywrightを開発用に使う提案とする。バージョンは実装時の環境と提供状況を確認し、固定して記録する。

**Spec:** [ミレバワカル 要件仕様書](../specs/2026-10-31-mirebawakaru-game-requirements.md)。原稿は [questions-v1.json](../../question-bank/questions-v1.json)。実装前に両方を読む。

作成日：2026-10-31（日本時間）。基準コミット：`aa0185a3bd739275653c12aaf4b55a165b97051a`。以上は資料PR #3の作成時点の基準。今回の実装基準mainは `a3ce6a9356e6db0d2499a0335c878e1946b68fd5`。下表と末尾へ実施結果を反映した。実装検査の通過と本番への採用を区別する。

## Global Constraints（すべての作業に適用）

- 1プレイは10問、各問は4択にする。
- 正解数を優先し、同じ正解数なら合計回答時間が短い記録を上位にする。
- 問いは「長いのは？」「大きいのは？」「赤いのは？」のように短くする。
- まず、異なる33系統の基本問題を1問ずつ作る。
- 基本33問の後に、色・線の配置・問い・正解を変えるバリエーションを増やす。
- まず基本33問を確認し、採用可・要修正・保留と理由を整理する。全33問の合格を報告や本番準備の必須条件にしない。
- 初期段階は成績を保存せず、自己ベスト・履歴・ランキングを作らない。
- 本番準備では問題がなかった種類だけを増やし、記録方式を決めて実装する。
- 各系統1派生・計66形の案は全33系統に問題がなかった場合に限る。無条件の目標数にしない。
- ゲームは同一サイト内のファイルで動かし、外部の画像・フォント・解析・データベースを必須にしない。
- ユーザーが決めた条件と今回の作成者の提案を区別する。提案の変更は仕様と計画へ反映する。
- mainへ直接変更しない。代理マージ・自動マージをしない。今回の明示指示によりPages／Actionsの公開設定・ワークフローを対象に含む。有料サービスを新たに実行しない。

## Review Focus（見落としやすい条件）

| 条件 | 期待する動作 | 検査を置くタスク |
| --- | --- | --- |
| 候補の入替え・問いの反転 | 画面の図と内部識別子・正解・解説が一致し、正解が1つ | T01・T02・T09 |
| 準備中の入力・連打・古いイベント | 1問につき1回答だけを受理し、次の問題へ入力を持ち越さない | T05 |
| 背景化・回転・100ミリ秒超の描画間隔 | 中断後の時間を参考扱いにし、初期段階では成績を一切保存しない | T04・T05・T06 |
| 色の合成・縮小・端の切り抜き | 対象の内部色と図形の比較条件が保たれ、4候補を読める | T03・T04・T08 |
| 初期画面・再読み込み・ホーム・再開始 | 成績保存APIや通信を呼ばず、一時データを破棄する | T05・T06・T10 |
| 未確認・要修正・派生数の偏り | 確認用では未確認を表示でき、本番と派生追加は採用可の種類に限る | T01・T02・T08・T09 |

## 1. 実装の順序と完了条件

期間や工数は描画と実機確認前なので見積もらない。実装時に完了した作業だけ根拠と日付を追記する。T番号は既存計画の参照を保つため維持し、実行順は依存関係に従う。T07の記録機能はT08の確認結果を整理した後へ移す。

| 段階 | タスク | 依存 | 成果物 | 完了条件 | 状態 |
| --- | --- | --- | --- | --- | --- |
| 33問の確認 | T01 原稿と実行データの契約 | なし | 原稿検査、データ型、確認状態 | 33系統・4候補・一意正解と色条件を検査できる | 実装・自動検査済み |
| 33問の確認 | T02 抽選・判定・一時的な再現 | T01 | 確認用10問、正解、候補順 | 重複なし。確認用と本番用の採用条件を分離 | 実装・自動検査済み |
| 33問の確認 | T03 静止27問の描画 | T01・T02 | Q01〜Q27、単問指定の確認用一覧 | 作図値との一致と4択の表示を確認できる | 実装・自動検査済み |
| 33問の確認 | T04 動く6問の描画 | T01・T02 | Q28〜Q33、時計、実提示の一時状態 | 同時刻・Q32同期・遅延検知を確認 | 実装・自動検査済み |
| 33問の確認 | T05 画面と確認用10問 | T02〜T04 | ホーム、準備、出題、中断、結果 | 未採用も確認でき、連打を防ぎ、保存・送信しない | 実装・自動検査済み |
| 33問の確認 | T06 答え合わせ・その場の採点と時間 | T03〜T05 | 原図と確認図、その場の結果 | 正解を確かめ、再開始時に一時データを捨てる | 実装・自動検査済み |
| 33問の確認 | T08 33問の評価と採用判断 | T01〜T06 | 全33問の採用可・要修正・保留と理由 | 未検証を合格にせず、問題のある種類を区別できる | 実装・自動検査済み |
| 初期の引き渡し | T10 確認結果と実装PR | T08の評価報告 | 実装、確認結果、未確認と修正対象 | 初期の保存なしを確認し、完了と合格を区別する | 実装PR作成・本人マージ待ち |
| 本番準備 | T09 問題がなかった種類の追加 | T08の評価報告。本番準備への着手 | 採用可の種類から選んだ派生 | 親と派生が採用条件を満たし、件数は確認結果に応じる | 後続・未着手 |
| 本番準備 | T07 記録仕様の具体化と実装 | T08の評価報告、記録方式の決定 | 決定した方式の成績保存と検査 | 記録仕様に従い、本番採用対象と整合する | 後続・未着手 |

T03とT04はT02後に独立して進められるが、担当分けは必須ではない。第1段階はT01〜T06・T08・初期のT10だけを実行する。T07・T09を初期PRの完了条件や依存に入れない。

全33問について結果を整理することと、全33問が合格することは分ける。実機確認できない項目は保留とし、検証済みとは説明しない。本番用は採用可の系統が10以上必要。10未満の間も単問確認は続けられる。

## 2. 予定するファイル構成

ここにあるパスは当初の構成案である。今回の実際の構成の集約と対応は末尾に記載する。既存の `source/`、完成HTML、Word、ZIP、問題原稿は保持する。

| パス | 担当する内容 |
| --- | --- |
| `index.html`、`game/styles.css`、`game/main.js`、`game/ui.js` | ゲームの入口、表示、起動、画面の操作 |
| `game/model.js`、`game/bank.js` | データ型、版番号、原稿から作る実行用の基本問題 |
| `game/rules.js`、`game/random.js`、`game/sampling.js` | 正解導出、再現できる乱数、系統と候補の抽選 |
| `game/session.js`、`game/clock.js` | 画面状態、回答の確定、計測、中断 |
| `game/render/common.js`、`game/render/static.js`、`game/render/motion.js` | 共通座標、静止・動きの4候補の描画 |
| `game/review.js`、`game/results.js` | 初期：答え合わせ、その場の集計と比較。成績は保存しない |
| `game/storage.js`（方式により変更） | 後続の本番準備：記録方式を決めた後にのみ作成 |
| `game/acceptance.json` | 初期：33問の確認結果と採用判断 |
| `game/variants.js` | 後続の本番準備：採用可の種類から選んだ派生のみ登録 |
| `dev/question-gallery.html`、`dev/question-gallery.js` | 全問・全派生を指定して確認する開発用一覧。通常プレイと別にする |
| `tests/*.test.js`、`tests/browser/*.spec.js`、`playwright.config.js` | 判定・進行・保存なしの自動検査と画面確認。保存機能のテストは後続で追加 |
| `package.json`、`package-lock.json`、`scripts/serve.mjs` | 開発用の実行コマンド、固定した依存、静的な確認サーバー |
| `docs/verification/base-33.md`、`docs/verification/variants.md` | 問題ごとの根拠、実機と自動確認の区別 |
| `README.md`、`docs/verification/release-checklist.md` | 起動方法、資料の入口、引き渡しの確認記録 |

`static.js` は分野ごとの描画登録を持つ。大きくなる場合は `game/render/static/length.js`、`shape.js`、`light.js`、`color.js`、`contour.js` へ分割する。描画の入口の契約は変えない。

## 3. 隣接する処理の契約

以下はJavaScriptのデータ形を示す設計上の型名。型を説明するコメント（JSDoc）で共有する。仕様にない数字を描画関数内へ隠さない。

| 型 | 必須の項目 |
| --- | --- |
| `Choice` | `choiceId`、`metricValue`、`geometry`、必要なら `fillRgb`。原稿A〜Dに由来する固定IDを持ち、表示ラベルと分ける |
| `Question` | `questionId`、`familyId`、`variantId`、`prompt`、`targetHint`、`rendererKey`、`choices[4]`、`rule`、`reviewSpec`、`versions` |
| `Rule` | `kind: max/min/equals/nonzero`、`metric`、`equals`の場合は `targetValue`。色の条件は登録済みの `colorPredicateId` で扱う |
| `Acceptance` | `questionId`、`variantId`、原稿・描画・見え方・縦・横・動きの各 `pending/pass/fail/not_applicable`、根拠、評価結論 `qualified/revise/hold` と理由。本番採用可かを確認値から導出する |
| `QuestionInstance` | `Question`の全描画条件、候補の表示順、`correctChoiceId`、乱数の開始値、問題ごとの再現情報。作成後に変更しない |
| `FrameSnapshot` | 全4候補の同時刻、図形座標・位相、Q32の印の表示状態と初回提示位置。画像の大量保存は不要 |
| `Answer` | `questionIndex`、`choiceId`、正誤、未丸めの `answerMs`、答え合わせに必要な同時刻の状態 |
| `RunResult` | 現プレイの10問の `instances/answers`、`correctCount`、`totalAnswerMs`、中断理由、版番号。初期はメモリー内のみで、ホーム・再開始・再読み込み後へ残さない |

## 4. タスクごとの作業

### T01：原稿の検査と実行データの契約

**Files:** 作成 `game/model.js`、`game/bank.js`、`game/acceptance.json`、`tests/bank.test.js`、`package.json`。参照 `docs/question-bank/questions-v1.json`。

**Interfaces:** `validateDesignBank(raw): ValidationReport`、`loadBaseQuestions(raw): Question[]`、`isEligible(acceptance, mode): boolean`。`ValidationReport` はエラーの問題IDと理由を持つ。後続は原稿のラベルを直接採点に使わず、変換後の `Choice` を使う。

- [ ] `tests/bank.test.js` に33問・33系統、分野数9/7/5/4/2/6、全問4候補、重複IDなし、判定の一意性を検査するテストを書く。Q22〜Q25は値の真偽と実際のRGB条件の一致を検査する。データ不足、未知の判定規則、色条件の不一致はエラーにする。
- [ ] `node --test tests/bank.test.js` を実行し、実装前に契約の未定義で失敗することを確認する。
- [ ] 原稿を変換する処理を作る。原稿検査を実行した欄だけpassにし、描画・見え方・実機欄はpending、静止問題の動き欄は対象外にする。未検証の合格は書き込まない。
- [ ] 同じコマンドを実行して全テストが通ることを確認する。`isEligible(acceptance, 'production')` は必要欄が未確認ならfalse、`'verification'` は原稿検査passの未採用問題を確認対象にできることを含める。どのモードも不正な数値データを許可しない。
- [ ] 対象ファイルを指定してコミットする。メッセージ案：`feat: define quiz data contract and bank validation`。

### T02：判定、出題抽選、候補順、再現

**Files:** 作成 `game/rules.js`、`game/random.js`、`game/sampling.js`、`tests/rules.test.js`、`tests/sampling.test.js`。

**Interfaces:** T01の `Question/Choice` を入力にする。`solveQuestion(question): choiceId`、`createRng(seed): () => number`、`createRun({questions, acceptance, seed, mode}): QuestionInstance[10]`。疑似乱数のアルゴリズムを固定し、変更時は出題規則の版を上げる。

- [ ] 最大・最小・一致・0以外を扱う正解テストを書く。正解0個と複数個は例外にする。全24通りの候補順でQ01〜Q33の内部正解が変わらず、表示ラベルだけが対応して変わることを検査する。
- [ ] 同じ開始値・版で同じ10問になる、系統が重複しない、確認用は原稿検査passの基本形を選べる、本番用は採用可だけを選ぶ、有効系統が10未満なら10問プレイを開始しない、派生の多い系統を先に重く選ばないことを検査する。全系統の配列を偏りのない交換法で並べ替えて先頭10個を選ぶ構造を検査し、標本数の偶然だけで合否を決めない。
- [ ] `node --test tests/rules.test.js tests/sampling.test.js` の失敗を確認してから、上記3ファイルを実装する。配置制約のある系統は確認済み配置だけを抽選し、内部IDからA〜Dへの対応表を作る。
- [ ] 同じコマンドで全テストが通ることを確認する。`QuestionInstance` の全条件を複製・固定し、後から元のデータを更新しても変わらないことを含める。再現情報は初期段階で保存APIへ渡さない。
- [ ] コミットする。案：`feat: add reproducible quiz sampling and answer rules`。

### T03：静止27問を4択として描く

**Files:** 作成 `game/render/common.js`、`game/render/static.js`、`dev/question-gallery.html`、`dev/question-gallery.js`、`tests/static-scenes.test.js`、`tests/browser/static-scenes.spec.js`、`scripts/serve.mjs`、`playwright.config.js`。更新 `package.json`、作成 `package-lock.json`。

**Interfaces:** `buildStaticScene(instance): Scene`、`renderStatic(ctx, scene, {reveal, layout}): void`。`Scene` は背景と対象を分けた全候補の図形・色・共通倍率を持つ。T06も同じ `Scene` を使う。確認用一覧は問題ID・派生ID・候補順を指定できる。

- [ ] Q01〜Q27ごとに「描画する対象の実寸・角度・面積・内部色が原稿と一致する」検査を書く。Q05/Q09の面積、Q10の接続誤差、Q15の閉じた円、Q18の合成後の色、Q19/Q20/Q26/Q27の実線・実点の有無を個別に検査する。
- [ ] `node --test tests/static-scenes.test.js` の失敗を確認し、共通座標と27問の図形生成・描画を実装する。既存の作図関数を参考にする場合も、2対象の同寸法を使う説明図は4択用に組み直す。原資料を上書きしない。
- [ ] 画面検査の手順を `package.json` に定義する。`npm run dev -- --host 127.0.0.1 --port 4173` は `scripts/serve.mjs` でリポジトリ内の静的ファイルだけを配信する。`npm run test:browser -- tests/browser/static-scenes.spec.js` で必要時にこのサーバーを起動できるよう設定する。
- [ ] 402×700、393×852、852×393で全27問を開き、4候補が領域に収まることと対象内部の色を検査する。画面画像も保存して人が対象とラベルを読めるか確認する。画像を撮れただけで錯視の効果を合格にしない。
- [ ] 単体・画面検査を再実行し、結果を `docs/verification/base-33.md` へ追記する。採用状態のiPhone欄は未確認のまま保持してコミットする。案：`feat: render 27 static illusion questions`。

### T04：動く6問と提示の同期

**Files:** 作成 `game/render/motion.js`、`game/clock.js`、`tests/motion-scenes.test.js`、`tests/clock.test.js`、`tests/browser/motion-scenes.spec.js`。更新 `dev/question-gallery.js`。

**Interfaces:** `buildMotionFrame(instance, elapsedMs, presentationState): FrameSnapshot`、`renderMotion(ctx, frame, layout): void`、`createClock({now}): Clock`。`Clock` は `start/stop/read` を持ち、注入した単調時計で検査できる。Q32の `presentationState` は実描画で確定した提示時刻と座標を保持する。

- [ ] Q28の角速度、Q29/Q30の振幅、Q31の右=1・下=2・左=3・上=4、Q33の一定速度を同じ2時刻で検査する。30/60/120回毎秒の更新列でも、同じ経過時間で同じ座標になることを検査する。
- [ ] Q32はt=0で印なし、599で印なし、600以後の最初の描画で4候補同時に提示し、提示開始から80ミリ秒で終わるテストを書く。次の基準時刻は2400、その次は4200。正解のずれ0、誤答の-24/24/36、移動3.2以内、全提示中の重なり、領域内、最初の実提示状態の保存を検査する。
- [ ] Q32はt=0から計時し、初回実提示状態を保存するまで回答受付を有効にしないテストを加える。初回の印の描画に失敗した場合は、回答可能へ進まず中断を通知する。
- [ ] `node --test tests/motion-scenes.test.js tests/clock.test.js` の失敗を確認してから実装する。Q31の印が隠れない観察区間を用意し、Q33の領域端でのリセットは通常の移動と混同しない表示にする。
- [ ] 描画間隔101ミリ秒なら中断を通知し、100ミリ秒以下ではその理由だけでは中断しない境界テストを加える。Q32の遅れた最初の提示でも予定時刻の座標を誤って保存しないことを検査する。
- [ ] `npm run test:browser -- tests/browser/motion-scenes.spec.js` で6問の同時刻描画と停止を確認する。数値と画面の根拠を記録し、コミットする。案：`feat: add six synchronized motion questions`。

### T05：ホームから10問の終了まで

**Files:** 作成 `index.html`、`game/main.js`、`game/ui.js`、`game/styles.css`、`game/session.js`、`tests/session.test.js`、`tests/browser/session.spec.js`、`tests/browser/no-persistence.spec.js`。

**Interfaces:** `createSession({instances, clock}): Session`。`Session` は `prepareQuestion/didRender/submitAnswer/interrupt/resumeReference/abort/getState` を持つ。`submitAnswer({questionIndex, choiceId, receivedAt}): accepted|ignored`。`interrupt(reason)` は時間を参考扱いへ変更する。確認用と明示し、画面は仕様書4の状態を使う。

- [ ] 準備→出題→確定→次の準備、10回答後だけ結果、同じ問題の2回答目を無視、古い `questionIndex` の入力を無視、準備中の入力を無視するテストを書く。
- [ ] 背景化・回転・比較領域変更・描画失敗で中断し、続行時は回答済みを保持、現在問だけ初期化、時間は参考扱いのままになるテストを書く。開始前の回転は通常の準備へ戻し、寸法が変わらないブラウザバーの変化は中断理由にしない。
- [ ] `node --test tests/session.test.js` の失敗を確認してから、T02の出題、T03/T04の描画、T04の時計を接続する。初回描画前に計測・回答を有効にしない。回答はボタンの押下完了で確定し、タッチの開始と完了の間の画面変更を無効にする。
- [ ] Q32だけは初期描画後から計時し、初回実提示後に回答を有効にする。599ミリ秒の入力は無視し、先行タップを予約しない。初回実提示後に受理した回答では600ミリ秒以上の待ち時間を含める境界テストを追加する。計時と回答受付を別々の状態として扱う。
- [ ] `npm run test:browser -- tests/browser/session.spec.js` で10問の流れ、連打、回転、背景化、ホームへの終了、再読み込みを確認する。静止問題だけの確認用プレイを表示上で分ける。採用待ちの基本形も確認用として動かせることを検査する。
- [ ] 起動・回答・結果・答え合わせ・中断・ホーム・再開始・再読み込みで、成績や再現情報の保存・送信を行わないテストを書く。localStorage/sessionStorage/IndexedDB/Cookieの書込みと、成績送信の通信がないことを確認する。現在プレイを捨てた後に前の回答を参照できないことを検査する。
- [ ] `npm run test:browser -- tests/browser/session.spec.js tests/browser/no-persistence.spec.js` で検査し、コミットする。案：`feat: implement verification-only quiz flow without records`。

### T06：答え合わせ・その場の採点と時間

**Files:** 作成 `game/review.js`、`game/results.js`、`tests/review.test.js`、`tests/results.test.js`、`tests/browser/review.spec.js`。更新 `game/ui.js`。

**Interfaces:** `buildReview(instance, answer): ReviewModel`、`renderReview(ctx, reviewModel, mode): void`。`mode` は `original/proof`。T03の同じ `Scene` とT04の `FrameSnapshot` を使い、最新の問題バンクから図を引き直さない。`summarizeRun(instances, answers, meta): RunResult` と `compareResults(a,b): -1|0|1`（aが上位なら-1）は一時データの計算だけを担当し、保存処理を持たない。

- [ ] 全33問で原図と確認図の対象寸法・内部色が変わらないテストを書く。背景・補助図形の除去、同じ始点への移動、重ね合わせだけで説明する条件を検査する。
- [ ] Q28/Q33は固定モデルの共通t=0とt=1000ミリ秒から確認図を再生成し、短時間回答でも動きを説明できるテストを書く。Q32は最初の実提示フレームを使い、提示前の回答が保存されないことを検査する。問い・選択・正解・各時間と、そのときの候補ラベルの一致を検査する。
- [ ] `node --test tests/review.test.js` の失敗を確認後、原図と確認図の切替、前後移動、結果へ戻る処理を実装する。解説を見ても回答時間は変えない。
- [ ] `npm run test:browser -- tests/browser/review.spec.js` と確認用一覧で全33問の説明を確認する。静止問題の「背景を消したら色も変わる」、動く問題の「別の時刻を比較する」を失敗として検出する。
- [ ] 8正解30000ミリ秒が7正解10000ミリ秒より上、同正解なら短い方が上、同じ整数ミリ秒なら同点を検査する。各問の小数は合算後だけ丸め、10未満の回答・負値・有限でない時間・不正選択を完了結果にしない。Q32の待ち時間を含め、解説を見ても合計が変わらないことを検査する。
- [ ] `node --test tests/review.test.js tests/results.test.js` と画面検査で、過去の自己ベスト・履歴を参照せず、その場の結果からだけ答え合わせできることを確認してコミットする。案：`feat: add transient results and reproducible answer review`。

### T07：本番準備で記録仕様を決めて実装する（後続）

**着手条件:** T08で33問の確認結果を整理し、本番準備に進む段階で、保存先・項目・自己ベストや順位の扱いを仕様化する。初期の仕組み確認には含めず、T05/T06/T08の依存にしない。

**Files:** 後続の記録仕様が決まった後で `game/storage.js` または選んだ方式の保存処理、`tests/storage.test.js` を作成する。保存先による追加ファイルと画面検査は、その仕様と同じPRで確定する。初期PRに仮の保存キー・接続先を置かない。

**Interfaces:** T06の `RunResult` と、本番で採用した問題・版を入力にする。保存側は集計を独自に変えない。ブラウザ内保存かオンライン保存かは現時点で固定しない。

- [ ] 保存先、項目、保持範囲、参考扱いの結果、版の変更、名前・順位の要否、失敗時の表示を、本番準備の仕様として決める。初期案だった「最新1件・自己ベスト5件」は確定条件にしない。
- [ ] 決まった仕様に対応するファイル・操作の契約・検査コマンドを本タスクへ追記してから保存処理を実装する。この段階で未決の接続先を推測して作らない。
- [ ] 本番採用外の系統を含む結果、未完了、不正な時間・選択、版の不整合、保存拒否・通信失敗を、決めた記録仕様に従って検査する。現在の表示と答え合わせは失敗しても失わない。
- [ ] 実際に保存できることと、再読み込み後の扱いを確認し、根拠を付けて本番準備用PRにまとめる。これは将来の作業であり、初期の保存なし検査を省略する理由にしない。

### T08：33問の仕組みを確認し、採用可・要修正・保留に分ける

**Files:** 更新 `game/acceptance.json`、`game/styles.css`、必要な描画ファイル。作成・更新 `docs/verification/base-33.md`、`tests/browser/mobile-layout.spec.js`。

**Interfaces:** T01の `Acceptance` を使う。全33問に `questionId/variantId/versions`、確認項目、日時、ブラウザ、表示寸法、根拠、結論と理由を付ける。必要欄がすべてpassのときだけqualified、明確な不備があればrevise、未確認が残ればholdとする。reviseがある場合はその理由を優先して示す。

- [ ] 自動サイズ確認で402×700、393×852、852×393、4候補、ボタン44×44以上、文字の目標寸法、横スクロールなし、図の比較にスクロール不要を検査する。静止問題だけの確認用プレイにも保存処理がないことを確認する。
- [ ] `npm run test:browser -- tests/browser/mobile-layout.spec.js` を実行して根拠を残す。数値が一意でも判別できない、錯視としての題材が伝わらない、答え合わせで確認できない問題は要修正にする。原稿を変える場合は同じPRに理由を残す。
- [ ] iPhone 17 ProのSafari実機で33問を縦横で確認し、対象、正解確認、見え方、Q31の印、Q32の提示と中断を検査する。実機を使えない欄は未確認・保留とし、端末サイズ再現で代用しない。
- [ ] 全33IDの結論と理由を整理する。全33合格を報告の必須条件にせず、問題があったものを除いた採用可の一覧も出す。未確認が残る場合は「検証完了」と説明しない。
- [ ] 合格1件、要修正1件、保留1件を含む採用表を使い、本番抽選は合格だけ、確認用表示では未採用も数値条件を満たす範囲で見られることを検査する。合格系統が10未満なら本番10問を開始せず、派生数で系統数を水増ししない。
- [ ] `npm test` と `npm run test:browser` を実行してコミットする。案：`test: assess 33 base question mechanisms without score records`。不合格・保留を合格に変えて初期作業を終えた扱いにしない。

### T09：本番向けに、問題がなかった種類の派生を増やす（後続）

**着手条件:** T08で33問の結果を整理し、本番準備に進む段階で追加対象を選ぶ。全33問の合格は必須にしない。親がqualifiedの種類だけを追加対象とする。

**Files:** 後続で `game/variants.js`、`tests/variants.test.js`、`docs/verification/variants.md` を作成。必要な `game/bank.js`、`game/acceptance.json`、描画ファイルと問題原稿を更新する。初期PRでは派生を実装しない。

**Interfaces:** `loadVariants(): Question[]` は基本形と同じ契約を使う。追加対象の `familyId/variantId` の一覧を確認結果から決め、T02は本番用に採用可の系統→確認済みの派生の順で選ぶ。

- [ ] 追加する種類と件数を確認結果から決め、一覧にする。全33系統に問題がなかった場合だけ、各1派生・計66形の案を検討できる。33系統すべてから必ず派生させる検査や、無条件の66形検査を作らない。
- [ ] 親が要修正・保留の派生を登録できない、全追加形が4候補・正解1つ、問いの反転時に図の1対3も変わるテストを書く。ラベル入替えだけを追加件数に数えない。
- [ ] `node --test tests/variants.test.js` の失敗を確認後、決めた有限の追加形を実装する。未検査の色や数値を無制限に生成せず、問い・実値・背景・配置・正解をセットで定義する。
- [ ] 追加形ごとに描画・答え合わせ・見え方・iPhone縦横・動きをT08と同じ基準で確認する。親の合格だけで派生を合格にしない。
- [ ] 検査を実行し、追加前後の採用数と根拠を本番準備用PRへ記載する。記録機能も同じPRに含める場合はT07の仕様と検査も満たす。

### T10：初期の確認結果と実装PRを引き渡す

**Files:** 更新 `README.md`。作成 `docs/verification/release-checklist.md`。必要な修正は対応タスクへ戻す。

**Interfaces:** 初期はT01〜T06・T08の結果をまとめる。T07の保存やT09の派生は初期の依存にしない。

- [ ] 既存資料を保持し、単問指定、確認用10問、その場の結果、答え合わせを操作できることを確認する。ゲームから成績保存APIや送信を呼ばないことを検査する。
- [ ] `npm test` と `npm run test:browser` を実行する。10問、中断、単問再確認、連打、ホーム、再開始、再読み込みと一時状態の破棄を通す。使えない環境の検査は未実施として残す。
- [ ] 全33問の採用可・要修正・保留と理由、実際の確認範囲、残る修正を記載する。全問合格や66形追加、自己ベスト保存を初期PRの完了条件にしない。
- [ ] 「基本33問の仕組み確認・保存なし」と分かるPRを作る。後続の本番準備に渡す候補一覧を添え、未検証を完了と説明しない。main直接変更、代理マージ、自動マージはしない。今回追加のT11により確認用ページの自動公開を準備する。
- [ ] 将来の本番引き渡しではT09の追加形とT07の記録機能も対象にして回帰確認する。初期用の確認画面をそのまま本番完成と呼ばない。

## 5. 要件から作業への対応

| 要件 | 実装タスク | 主な確認 |
| --- | --- | --- |
| R01・R05・R14・R16・R20 | T01・T03・T04・T06・T08 | 33問の仕組み、正解根拠、採用可・要修正・保留 |
| R02・R04・R07 | T01・T03・T05 | 10問、4候補、短い問い、対象の補足 |
| R03・R09 | T04・T05・T06 | 一時的な計時、観察時間、正解数優先と同点 |
| R06・R17・R22 | 後続T09 | 問題がなかった種類だけを追加。66形は条件付きの案 |
| R08・R15 | T02・T06、後続T09 | 重複なし、候補の対応、その場の再現、モード別抽選 |
| R10 | T05・T06 | 10問後の答え合わせ。単問確認は別枠 |
| R11・R12・R21（初期） | T05・T06・T10 | 成績保存なし、中断後は時間参考、一時状態の破棄 |
| R21（本番） | 後続T07 | 本番採用対象と整合する記録仕様と保存 |
| R13・R18 | T05・T08 | iPhone縦横、静止だけの確認、停止と終了 |
| R19 | T03・T10 | 同一サイト内で起動。外部依存や成績送信が不要 |

## 6. この資料PRの確認と後続

最新の指示R20〜R22に従い、初期段階を基本33問の仕組み確認へ絞った。旧計画の端末内保存をT07として本番準備へ移し、その場の集計はT06へ残した。T09は採用可の種類だけを追加する後続作業にし、全33問合格・無条件66形の条件を外した。

初期の一時データは答え合わせまでメモリー内に保持するだけであり、プレイヤーの成績を保存する機能とは分ける。一方、問題ごとの確認根拠・不具合・採用判断は開発資料として残す。

PR #3は文書の修正だけを行った。今回の実装・検査・公開準備と、未実施の実機確認は下記実施記録で区別する。後続の初期実装PRはT01〜T06・T08・初期T10を対象とする。

Q32の計時と回答受付の分離、初回実提示状態の保持、Q28/Q33の説明用2時刻の再生成という既存条件は維持する。文書の変更で原稿の問題数や正解値を変えない。


## 7. 今回の実施記録（基本33問の確認用）

今回の基準mainは `a3ce6a9356e6db0d2499a0335c878e1946b68fd5`。元の計画のチェックボックスは当初の作業手順として保持し、完了根拠を以下にまとめる。

| タスク | 今回の状態・根拠 |
| --- | --- |
| T01 | 実装。33問・33系統・4候補・RGB分類・描画安全範囲・不正IDの報告を検査 |
| T02 | 実装。Mulberry32＋Fisher–Yates、10系統の重複なし、全24候補順の一意正解・固定モデルを検査 |
| T03 | 静止27問を個別に作図。共通倍率、面積・接続・角度・円と渦・色・実線・実点を検査 |
| T04 | 動く6問を同じ時計で描画。Q32実提示保持、600/1800/80ms、100ms超遅延、Q31追跡、Q33共通再提示を検査 |
| T05 | 単問確認・10問・中断・続行・連打・古い入力・軽減設定を実装。保存・送信なしを検査 |
| T06 | 原図／確認図・重ね合わせ・各問の答え・時間。合算後整数msへ丸める集計を検査 |
| T08 | 自動検査と33問の評価報告を作成。見え方とiPhone実機は保留。全問を採用可と扱わない |
| 初期T10 | 実装、検査、成果物、公開手順、実装PRを引き渡す。本人のマージ待ち |
| T07／T09 | 後続。成績保存・派生追加は実装しない |

**構成の調整理由:** 転送だけのui/model/random等を分けず、仕様15の単位へ集約し、作図値の二重管理を避けた。旧契約名に対応する検査は `tests/bank.test.js`、`scenes.test.js`、`session.test.js`、`deployment.test.js` と `tests/browser/game.spec.js` にまとめた。

### T11：Pagesの初回公開・後続マージ時の自動反映（今回追加）

**Files:** `.github/workflows/pages.yml`、`scripts/build.mjs`、`serve.mjs`、`check-main.mjs`、`workflow-policy.mjs`、`lint-workflow.mjs`、`publication.mjs`、`verify-published.mjs`、`tests/deployment.test.js`、`docs/verification/release-checklist.md`。

- PRは読取り権限の事前検査のみ。mainのpush／mainのworkflow_dispatchは同一SHAを検査・ビルド後、公式Pages Actionsへ成果物を渡す。
- 配備は `needs: verify`、イベントとrefと成功結果の条件、配備直前のmain SHA照合、配備＋公開後検査の共通キューで保護する。PRで本番の同時実行を中断しない。古い再実行を除外し、待機中の最新実行を置換しない `queue: max` を使う。
- 公開先は既存GitHub Pages、独自ドメインなし。既存の資料とURL構造を保持し、必要なファイルだけ選んで配信する。実行用JSONはSHA付きの版ディレクトリにも置く。
- サブパス `/mirebawakaru/` の成果物を配信し、全画面検査と公開後検査の処理を事前実行する。
- 公開後検査はmanifest・実HTML/JS/CSS/JSONのバイト・操作を照合する。15秒間隔／最大5分、不一致・例外・通信失敗は成功にせず、期待SHAを後続SHAの成功と混同しない。
- YAML解析＋実際の条件式評価でPR、失敗／キャンセル、非main手動、古いSHA、同一SHA成功を検査する。actionlint 1.7.12は公式の新しいqueue属性を未認識のため、queueを独立した必須ポリシー検査で確認し、その他の構文・式をactionlintへ渡す。実行時のqueue設定は削除しない。
- 本人のマージ前に実公開は行わない。実Pages配備と実URL確認の初回実行はマージ後のworkflowが担当する。事前検査と実配備の結果を別々に記載する。

Pages公開元は既にworkflow方式、配備環境はmainのみ許可で必須承認なし。Actions全体設定のAPIは連携権限で403のため、実装PRの検査が起動することも確認する。変更が必要なら保護を回避せず一度限りの具体手順を引き渡す。
