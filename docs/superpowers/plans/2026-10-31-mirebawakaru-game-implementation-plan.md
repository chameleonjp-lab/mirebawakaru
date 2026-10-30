# ミレバワカル 実装計画表（Implementation Plan）

> **実装担当へ：** この計画を実行する際は `superpowers:executing-plans`、または明示的に担当を分ける指示がある場合は `superpowers:subagent-driven-development` に沿って、各作業を確認してから進める。`- [ ]` は未着手を表す。今回のPRでは実装を開始しない。

**Goal:** 基本33系統の錯視4択を描画し、重複のない10問の正解数と合計回答時間を記録するゲームを作る。基本33問の採用後に確認済みの派生を追加する。

**Architecture:** 問題原稿から実行用の4候補のデータを作り、描画・採点・答え合わせが同じデータを参照する。出題抽選、進行、時間、保存を独立させる。既存の図解資料を保持し、ゲームは別の入口と分割ファイルで作る。

**Tech Stack:** HTML、CSS、JavaScriptの標準モジュール、Canvas 2D。実行時の外部ライブラリは使わない。純粋な判定の検査はNode.jsの標準テスト、画面検査はPlaywrightを開発用に使う提案とする。バージョンは実装時の環境と提供状況を確認し、固定して記録する。

**Spec:** [ミレバワカル 要件仕様書](../specs/2026-10-31-mirebawakaru-game-requirements.md)。原稿は [questions-v1.json](../../question-bank/questions-v1.json)。実装前に両方を読む。

作成日：2026-10-31（日本時間）。基準コミット：`aa0185a3bd739275653c12aaf4b55a165b97051a`。全タスクは未着手。要件仕様書2.2の提案を含むレビュー用の計画であり、採用済みの実装を示すものではない。

## Global Constraints（すべての作業に適用）

- 1プレイは10問、各問は4択にする。
- 正解数を優先し、同じ正解数なら合計回答時間が短い記録を上位にする。
- 問いは「長いのは？」「大きいのは？」「赤いのは？」のように短くする。
- まず、異なる33系統の基本問題を1問ずつ作る。
- 基本33問の後に、色・線の配置・問い・正解を変えるバリエーションを増やす。
- 基本33問がすべて採用されるまで第1段階は未完了とする。
- 初回の追加目標は各系統1派生以上とする。基本33問に33派生を足した計66形以上を第2段階の確認目標にする。
- ゲームは同一サイト内のファイルで動かし、外部の画像・フォント・解析・データベースを必須にしない。
- ユーザーが決めた条件と今回の作成者の提案を区別する。提案の変更は仕様と計画へ反映する。
- mainへ直接変更しない。代理マージ・自動マージ・公開設定の有効化をしない。有料サービスを新たに実行しない。

## Review Focus（見落としやすい条件）

| 条件 | 期待する動作 | 検査を置くタスク |
| --- | --- | --- |
| 候補の入替え・問いの反転 | 画面の図と内部識別子・正解・解説が一致し、正解が1つ | T01・T02・T09 |
| 準備中の入力・連打・古いイベント | 1問につき1回答だけを受理し、次の問題へ入力を持ち越さない | T05 |
| 背景化・回転・100ミリ秒超の描画間隔 | 参考記録へ一方向に変更し、自己ベストを更新しない | T04・T05・T07 |
| 色の合成・縮小・端の切り抜き | 対象の内部色と図形の比較条件が保たれ、4候補を読める | T03・T04・T08 |
| 保存拒否・破損・旧版・図の条件変更 | 現在の結果を失わず、別の版を比較せず、当時の図で答え合わせできる | T06・T07・T09 |

## 1. 実装の順序と完了条件

期間や工数は、描画の試作と実機確認前なので見積もらない。次の表は順序と依存関係を示す。実装時に完了した作業だけ、根拠のリンクと日付を追記する。

| 段階 | タスク | 依存 | 成果物 | 完了条件 | 状態 |
| --- | --- | --- | --- | --- | --- |
| 基本33問 | T01 原稿と実行データの契約 | なし | 原稿の検査、実行データ型、採用記録のひな形 | 33系統・各4候補・一意正解と色条件を検査できる | 未着手 |
| 基本33問 | T02 抽選・判定・再現 | T01 | 10問の出題データ、正解導出、再現情報 | 系統重複なし、候補順変更後も判定が一致 | 未着手 |
| 基本33問 | T03 静止27問の描画 | T01・T02 | Q01〜Q27、共通描画、確認用一覧 | 各問が作図値と一致し、縦横サイズで読める候補になる | 未着手 |
| 基本33問 | T04 動く6問の描画 | T01・T02 | Q28〜Q33、同じ時計、提示状態の保存 | 同時刻・Q32の同期・遅延検知を確認 | 未着手 |
| 基本33問 | T05 画面と10問の進行 | T02〜T04 | ホーム、準備、出題、中断、結果 | 有効な10回答で終了し、連打や中断でも状態が壊れない | 未着手 |
| 基本33問 | T06 答え合わせ | T03〜T05 | 全10問の原図・自分の答え・確認操作 | 実際に出した図と同時刻の状態から正解を確かめられる | 未着手 |
| 基本33問 | T07 時間・自己ベスト・保存 | T05・T06 | 時間集計、比較、端末内の保存 | 同点条件、参考記録、保存拒否と旧版の扱いが一致 | 未着手 |
| 基本33問 | T08 33問の採用と端末確認 | T01〜T07 | 33問の確認表、画面・操作の証拠 | 全33問に描画・答え合わせ・iPhone縦横の根拠がある | 未着手 |
| 派生追加 | T09 確認済みの派生追加 | T08で全33問採用 | 各系統1派生以上、計66形以上 | 問い・図・答えを一緒に変更し、同じ採用条件を満たす | 未着手 |
| 引き渡し | T10 回帰確認と実装PR | T08。派生を含むPRはT09も必要 | 変更説明、確認結果、未完了事項 | 実装をレビューでき、未確認を完了扱いしていない | 未着手 |

T03とT04はT02後に独立して進められるが、担当分けは必須ではない。T05は未採用問題を使う開発確認として先に確認できる。通常プレイへの採用はT08まで認めない。

## 2. 予定するファイル構成

ここにあるファイルは今後作る予定であり、この資料PRでは作らない。既存の `source/`、完成HTML、Word、ZIP、問題原稿は保持する。

| パス | 担当する内容 |
| --- | --- |
| `index.html`、`game/styles.css`、`game/main.js`、`game/ui.js` | ゲームの入口、表示、起動、画面の操作 |
| `game/model.js`、`game/bank.js` | データ型、版番号、原稿から作る実行用の基本問題 |
| `game/rules.js`、`game/random.js`、`game/sampling.js` | 正解導出、再現できる乱数、系統と候補の抽選 |
| `game/session.js`、`game/clock.js` | 画面状態、回答の確定、計測、中断 |
| `game/render/common.js`、`game/render/static.js`、`game/render/motion.js` | 共通座標、静止・動きの4候補の描画 |
| `game/review.js`、`game/results.js`、`game/storage.js` | 答え合わせ、集計・比較、保存と読み出し |
| `game/variants.js`、`game/acceptance.json` | 派生の登録、問題ごとの確認結果と採用条件 |
| `dev/question-gallery.html`、`dev/question-gallery.js` | 全問・全派生を指定して確認する開発用一覧。通常プレイと別にする |
| `tests/*.test.js`、`tests/browser/*.spec.js`、`playwright.config.js` | 判定・進行の自動検査と画面の確認 |
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
| `Acceptance` | `questionId`、`variantId`、原稿・描画・見え方・縦・横・動きの各 `pending/pass/fail/not_applicable`、根拠へのパス。通常採用条件を満たすかは関数で導出する |
| `QuestionInstance` | `Question`の全描画条件、候補の表示順、`correctChoiceId`、乱数の開始値、問題ごとの再現情報。作成後に変更しない |
| `FrameSnapshot` | 全4候補の同時刻、図形座標・位相、Q32の印の表示状態と初回提示位置。画像の大量保存は不要 |
| `Answer` | `questionIndex`、`choiceId`、正誤、未丸めの `answerMs`、答え合わせに必要な同時刻の状態 |
| `RunResult` | 10問の `instances/answers`、`correctCount`、`totalAnswerMs`、`eligible`、`ineligibleReasons`、版番号、完了日時 |

## 4. タスクごとの作業

### T01：原稿の検査と実行データの契約

**Files:** 作成 `game/model.js`、`game/bank.js`、`game/acceptance.json`、`tests/bank.test.js`、`package.json`。参照 `docs/question-bank/questions-v1.json`。

**Interfaces:** `validateDesignBank(raw): ValidationReport`、`loadBaseQuestions(raw): Question[]`、`isEligible(acceptance, mode): boolean`。`ValidationReport` はエラーの問題IDと理由を持つ。後続は原稿のラベルを直接採点に使わず、変換後の `Choice` を使う。

- [ ] `tests/bank.test.js` に33問・33系統、分野数9/7/5/4/2/6、全問4候補、重複IDなし、判定の一意性を検査するテストを書く。Q22〜Q25は値の真偽と実際のRGB条件の一致を検査する。データ不足、未知の判定規則、色条件の不一致はエラーにする。
- [ ] `node --test tests/bank.test.js` を実行し、実装前に契約の未定義で失敗することを確認する。
- [ ] 原稿を変換する処理を作る。採用結果の初期値はすべて未確認にし、静止問題の動き欄だけを対象外にする。基本原稿に仮の合格を書き込まない。
- [ ] 同じコマンドを実行して全テストが通ることを確認する。`isEligible` は必要な確認が1つでも未確認ならfalseを返すことを含める。
- [ ] 対象ファイルを指定してコミットする。メッセージ案：`feat: define quiz data contract and bank validation`。

### T02：判定、出題抽選、候補順、再現

**Files:** 作成 `game/rules.js`、`game/random.js`、`game/sampling.js`、`tests/rules.test.js`、`tests/sampling.test.js`。

**Interfaces:** T01の `Question/Choice` を入力にする。`solveQuestion(question): choiceId`、`createRng(seed): () => number`、`createRun({questions, acceptance, seed, mode}): QuestionInstance[10]`。疑似乱数のアルゴリズムを固定し、変更時は出題規則の版を上げる。

- [ ] 最大・最小・一致・0以外を扱う正解テストを書く。正解0個と複数個は例外にする。全24通りの候補順でQ01〜Q33の内部正解が変わらず、表示ラベルだけが対応して変わることを検査する。
- [ ] 同じ開始値・版で同じ10問になる、系統が重複しない、確認済みだけを選ぶ、有効系統が10未満なら開始不可、派生の多い系統を先に重く選ばないことを検査する。全系統の配列を偏りのない交換法で並べ替えて先頭10個を選ぶ構造を検査し、標本数の偶然だけで合否を決めない。
- [ ] `node --test tests/rules.test.js tests/sampling.test.js` の失敗を確認してから、上記3ファイルを実装する。配置制約のある系統は確認済み配置だけを抽選し、内部IDからA〜Dへの対応表を作る。
- [ ] 同じコマンドで全テストが通ることを確認する。`QuestionInstance` の全条件を複製・固定し、後から元のデータを更新しても変わらないことを含める。
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

**Files:** 作成 `index.html`、`game/main.js`、`game/ui.js`、`game/styles.css`、`game/session.js`、`tests/session.test.js`、`tests/browser/session.spec.js`。

**Interfaces:** `createSession({instances, clock}): Session`。`Session` は `prepareQuestion/didRender/submitAnswer/interrupt/resumeReference/abort/getState` を持つ。`submitAnswer({questionIndex, choiceId, receivedAt}): accepted|ignored`。`interrupt(reason)` は参考記録への変更を取り消せない。画面は仕様書4の状態だけを使う。

- [ ] 準備→出題→確定→次の準備、10回答後だけ結果、同じ問題の2回答目を無視、古い `questionIndex` の入力を無視、準備中の入力を無視するテストを書く。
- [ ] 背景化・回転・比較領域変更・描画失敗で中断し、続行時は回答済みを保持、現在問だけ初期化、参考記録のままになるテストを書く。開始前の回転は通常の準備へ戻し、寸法が変わらないブラウザバーの変化は中断理由にしない。
- [ ] `node --test tests/session.test.js` の失敗を確認してから、T02の出題、T03/T04の描画、T04の時計を接続する。初回描画前に計測・回答を有効にしない。回答はボタンの押下完了で確定し、タッチの開始と完了の間の画面変更を無効にする。
- [ ] Q32だけは初期描画後から計時し、初回実提示後に回答を有効にする。599ミリ秒の入力は無視し、先行タップを予約しない。初回実提示後に受理した回答では600ミリ秒以上の待ち時間を含める境界テストを追加する。計時と回答受付を別々の状態として扱う。
- [ ] `npm run test:browser -- tests/browser/session.spec.js` で10問の流れ、連打、回転、背景化、ホームへの終了、再読み込みを確認する。静止問題だけの練習を通常記録から分離する。
- [ ] 単体・画面検査の合格後にコミットする。案：`feat: implement ten-question game flow and interruptions`。

### T06：全10問の答え合わせ

**Files:** 作成 `game/review.js`、`tests/review.test.js`、`tests/browser/review.spec.js`。更新 `game/ui.js`。

**Interfaces:** `buildReview(instance, answer): ReviewModel`、`renderReview(ctx, reviewModel, mode): void`。`mode` は `original/proof`。T03の同じ `Scene` とT04の `FrameSnapshot` を使い、最新の問題バンクから図を引き直さない。

- [ ] 全33問で原図と確認図の対象寸法・内部色が変わらないテストを書く。背景・補助図形の除去、同じ始点への移動、重ね合わせだけで説明する条件を検査する。
- [ ] Q28/Q33は固定モデルの共通t=0とt=1000ミリ秒から確認図を再生成し、短時間回答でも動きを説明できるテストを書く。Q32は最初の実提示フレームを使い、提示前の回答が保存されないことを検査する。問い・選択・正解・各時間と、そのときの候補ラベルの一致を検査する。
- [ ] `node --test tests/review.test.js` の失敗を確認後、原図と確認図の切替、前後移動、結果へ戻る処理を実装する。解説を見ても回答時間は変えない。
- [ ] `npm run test:browser -- tests/browser/review.spec.js` と確認用一覧で全33問の説明を確認する。静止問題の「背景を消したら色も変わる」、動く問題の「別の時刻を比較する」を失敗として検出する。
- [ ] 確認結果を追記してコミットする。案：`feat: add reproducible answer review for all questions`。

### T07：時間の集計、比較、端末内の保存

**Files:** 作成 `game/results.js`、`game/storage.js`、`tests/results.test.js`、`tests/storage.test.js`。更新 `game/ui.js`。

**Interfaces:** `summarizeRun(instances, answers, meta): RunResult`、`compareResults(a,b): -1|0|1`（aが上位なら-1）、`loadRecords(storage): Records`、`saveResult(storage,result): SaveOutcome`。`SaveOutcome` は `saved/skipped/failed` とユーザー向けの理由を持つ。

- [ ] 8正解30000ミリ秒が7正解10000ミリ秒より上、同正解なら短い方が上、同じ整数ミリ秒なら0を返す検査を書く。各問の小数を足して最後にだけ丸める。版の異なる比較は拒否し、10未満の回答・負値・有限でない時間・不正な選択を保存しない。
- [ ] 読み込み時間、解説時間を加算しない、Q32を待つ600ミリ秒と再提示待ち時間を含める、参考記録で自己ベストを変えないテストを書く。
- [ ] `node --test tests/results.test.js tests/storage.test.js` の失敗を確認し、最新完了1件と版別自己ベスト最大5件の保存を実装する。保存キーをこのゲーム固有にし、他のキーを消さない。古い版の自己ベストは上限を超える場合だけ最終更新の古い順に置き換える。
- [ ] 保存拒否、破損JSON、未知の版、過大な保存データ、妥当でない項目を検査する。読み出し対象の文字列は1メガバイトを上限とする提案とし、超過時はそのゲームの記録を読み込まず案内する。UIの結果は保存失敗でも保持する。
- [ ] 単体検査と画面での保存拒否を確認してコミットする。案：`feat: add score comparison and resilient local records`。

### T08：33問の採用、表示と実機の確認

**Files:** 更新 `game/acceptance.json`、`game/styles.css`、必要な描画ファイル。作成・更新 `docs/verification/base-33.md`、`tests/browser/mobile-layout.spec.js`。

**Interfaces:** T01の `isEligible` で通常プレイの対象を導出する。確認表は `questionId/variantId/versions` と結び付け、確認日、ブラウザ、表示寸法、根拠を持つ。

- [ ] 自動サイズ確認で402×700、393×852、852×393、4候補の表示、ボタン44×44以上、文字の目標寸法、横スクロールなし、図の比較にスクロール不要を検査する。動き軽減では静止問題だけの練習になり、通常自己ベストへ入らないことを検査する。
- [ ] `npm run test:browser -- tests/browser/mobile-layout.spec.js` を実行し、サイズの再現結果を保存する。数値が一意でも判別できない問題は採用せず、差・背景・配置を直し、原稿も変更した場合は同じPRで理由を残す。
- [ ] iPhone 17 ProのSafari実機で全33問を縦横で操作し、対象、正解確認、錯視の見え方、Q31の印、Q32の提示と中断を確認する。実機が使えなければ該当欄は未確認で止め、端末サイズの再現結果で代用しない。
- [ ] 全33問の原稿・描画・4択の見え方・縦・横・必要な動き欄が合格したときだけ通常プレイへの採用を反映する。採用前の開発確認は別URLで維持する。
- [ ] `npm test`（`node --test tests/*.test.js`）と `npm run test:browser` を実行し、証拠を添えてコミットする。案：`test: verify and qualify all 33 base questions`。未確認なら第1段階未完了と明記する。

### T09：基本33問の後に派生を追加する

**Files:** 作成 `game/variants.js`、`tests/variants.test.js`、`docs/verification/variants.md`。更新 `game/bank.js`、`game/acceptance.json`、各描画ファイルと原稿（変更が必要な場合）。

**Interfaces:** `loadVariants(): Question[]`。基本形と同じ `Question` の契約を使い、T02の `createRun` は系統→派生の順で選ぶ。派生も固有の `variantId` と全作図条件を持つ。

- [ ] T08で基本33問がすべて採用されていることを確認する。満たさない間は派生追加を完了対象へ進めない。
- [ ] 各系統1派生以上、基本形を含め66形以上、各4候補・正解1つを検査するテストを書く。問いを反転する派生では図の1対3も変える。候補のラベル入替えだけは派生数に数えない。
- [ ] `node --test tests/variants.test.js` の失敗を確認後、有限の確認候補を実装する。自由な乱数で未検査の色や数値を生成しない。基本形から問いまたは実際の判定値を変え、配色・配置の変更も各系統の条件に合わせて用意する。
- [ ] 全追加形の描画、答え合わせ、iPhone縦横、動きの条件をT08と同じ方法で確認し、根拠のある派生だけを採用する。旧プレイを読み出しても、保存済みの作図条件で同じ図を再現できることを検査する。
- [ ] 単体検査と全派生の画面確認を実行してコミットする。案：`feat: add qualified question and scene variations`。

### T10：回帰確認と実装PRの引き渡し

**Files:** 更新 `README.md`。作成 `docs/verification/release-checklist.md`。必要な修正だけを対応するタスクへ戻して加える。

**Interfaces:** 追加の実行機能を作らない。T01〜T08の採用記録、派生を含む場合はT09の記録、テスト結果をPR本文へ結び付ける。

- [ ] 既存資料のファイルが保持され、ゲーム入口と資料入口の両方を開けることを確認する。通常起動で外部画像・フォント・解析・データベースへ通信しないことを画面検査で確認する。
- [ ] `npm test`、`npm run test:browser` を実行する。失敗した項目を修正したら影響範囲を再確認する。ブラウザや実機を動かせない環境では実行した範囲と未実施を分けて記録する。
- [ ] 通常10問、参考記録、練習、同点、自己ベスト更新、保存失敗、再読み込み、答え合わせを1本の確認手順で通す。公開候補の版番号を固定する。
- [ ] 変更の理由、達成した採用数、実際に行った確認、未確認事項、公開前の残作業を記載したPRを作る。mainへの直接変更、代理マージ、自動公開の設定変更はしない。
- [ ] 未完了がある場合は「公開可」「実機確認済み」「全33問完了」と記載しない。ユーザーが後続作業を判断できる状態で引き渡す。

## 5. 要件から作業への対応

| 要件 | 実装タスク | 主な確認 |
| --- | --- | --- |
| R01・R05・R14・R16 | T01・T03・T04・T06・T08 | 33系統の描画と正解根拠、全採用記録 |
| R02・R04・R07 | T01・T03・T05 | 10問、4候補、短い問い、比較対象の補足 |
| R03・R09 | T04・T05・T07 | 各問の計時、観察時間、正解数優先、同点 |
| R06・R17 | T09 | 各系統1派生以上、計66形以上、問いと図と正解の同時変更 |
| R08・R15 | T02・T06・T09 | 系統重複なし、抽選順、候補対応、保存済み条件での再現 |
| R10 | T05・T06 | 10問終了後にだけ正解・解説を表示 |
| R11 | T04・T05・T07 | 中断後に通常記録へ戻らず、自己ベストに入らない |
| R12 | T07 | 端末の記録、保存失敗、旧版との分離 |
| R13・R18 | T05・T08 | iPhone縦横、練習と通常の分離、停止と終了 |
| R19 | T03・T10 | 同一サイト内で起動し、外部依存の通信が不要 |

## 6. この資料PRの確認と後続

このPRでは、原稿33問の数値・件数・参照、文書間リンク、要件と作業の対応を確認する。ゲームのテストコマンドは今後用意する予定であり、今回実行済みとは記載しない。

文書レビューで見つかった「Q32の提示前回答では答え合わせの状態がない」矛盾は、計時と受付を分ける仕様およびT04〜T06の境界検査へ反映した。Q28/Q33の説明用の2時刻も固定モデルから再生成する条件を追加した。

レビューでは、決定済みのR01〜R06を守り、R07〜R19の提案が目的に合うかを確認する。後続の実装着手は別の依頼で行う。実装PRはT01〜T08を基本33問の段階としてまとめ、T09を次の派生追加PRに分ける案とする。iPhoneの実機確認が残る場合も差分はレビュー可能なPRへまとめ、採用状態は未確認のまま残す。
