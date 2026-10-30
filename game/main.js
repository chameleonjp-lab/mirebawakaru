import { validateDesignBank } from "./bank.js";
import { createInstance, createRun } from "./sampling.js";
import { createClock } from "./clock.js";
import { createSession } from "./session.js";
import { summarizeRun, formatTime } from "./results.js";
import { buildReview } from "./review.js";
import {
  buildStaticScene,
  renderStatic,
  metricFromGeometry,
} from "./render/static.js";
import {
  buildMotionFrame,
  createPresentation,
  commitPresentation,
  renderMotion,
  frameGapExceeded,
} from "./render/motion.js";
import { beginCanvas } from "./render/common.js";
const $ = (id) => document.getElementById(id),
  app = $("app"),
  canvas = $("scene"),
  gallery = !!document.body.dataset.gallery;
const asset = (path) => new URL(path, import.meta.url),
  reduced = matchMedia("(prefers-reduced-motion: reduce)"),
  wide = () =>
    matchMedia("(min-width:700px) and (orientation:landscape)").matches;
let bank = [],
  acceptance = [],
  report = [],
  session = null,
  current = null,
  presentation = createPresentation(),
  frame = null,
  review = null,
  reviewIndex = 0,
  reveal = false,
  overlay = false,
  raf = 0,
  epoch = 0,
  last = null,
  startTime = null,
  readyTime = Infinity,
  phase = "loading",
  pointer = null;
function setPhase(p) {
  phase = p;
  app.dataset.phase = p;
}
function stop() {
  cancelAnimationFrame(raf);
  raf = 0;
  epoch++;
  pointer = null;
  disableAnswers();
}
function disableAnswers() {
  document
    .querySelectorAll("[data-answer]")
    .forEach((b) => (b.disabled = true));
}
function showError(text) {
  $("errors").hidden = false;
  $("errors").textContent = text;
}
function clearError() {
  $("errors").hidden = true;
  $("errors").textContent = "";
}
function hideScreens() {
  for (const id of [
    "home-screen",
    "question",
    "interrupted",
    "result",
    "loading",
  ])
    $(id).hidden = true;
}
function clearRun() {
  stop();
  session?.abort();
  session = null;
  current = null;
  frame = null;
  presentation = createPresentation();
  review = null;
  reviewIndex = 0;
  for (const id of [
    "feedback",
    "score",
    "total-time",
    "result-notes",
    "explanation",
    "metrics",
    "scene-design",
  ])
    $(id).textContent = "";
  $("sources").replaceChildren();
  canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
}
function home() {
  clearRun();
  hideScreens();
  $("gallery-controls").hidden = true;
  $("home-screen").hidden = false;
  setPhase("home");
  clearError();
}
function updateStatus() {
  const s = session?.getState();
  $("status").textContent =
    (s?.reference ? "時間は参考 · " : "") +
    (current?.questionId === "Q32" && !presentation.first
      ? "印が光ったら選べます"
      : current?.motion
        ? "動きを観察して選んでください"
        : "図を比べて選んでください");
}
function draw({ proof = false, model = null } = {}) {
  const { ctx, layout } = beginCanvas(canvas, wide());
  if (current.motion) {
    const f = model ?? frame ?? buildMotionFrame(current, 0);
    renderMotion(ctx, f, {
      layout,
      reveal: proof,
      from: proof ? review?.from : null,
    });
    canvas.dataset.elapsed = String(f.elapsedMs);
    canvas.dataset.flash = String(f.flash);
  } else
    renderStatic(ctx, buildStaticScene(current), {
      layout,
      reveal: proof,
      overlay,
    });
}
function interrupt(reason) {
  if (!["preparing", "question"].includes(phase) || !session) return;
  stop();
  session.interrupt(reason);
  hideScreens();
  $("interrupted").hidden = false;
  $("interruption-reason").textContent =
    `${current?.questionId ?? ""} · ${reason}`;
  setPhase("interrupted");
}
function prepare() {
  stop();
  const token = epoch;
  hideScreens();
  $("question").hidden = false;
  $("review-panel").hidden = true;
  $("next").hidden = true;
  $("pause").hidden = false;
  review = null;
  reveal = false;
  overlay = false;
  presentation = createPresentation();
  frame = null;
  last = null;
  startTime = null;
  const s = session.getState();
  current = s.instances[s.index];
  $("question-id").textContent = current.questionId;
  $("counter").textContent = gallery ? "単問確認" : `${s.index + 1} / 10`;
  $("prompt").textContent = current.prompt;
  $("hint").textContent = current.targetHint;
  canvas.setAttribute(
    "aria-label",
    `${current.questionId} ${current.prompt} A・B・C・Dの4候補`,
  );
  setPhase("preparing");
  updateStatus();
  const initialBox = $("stage").getBoundingClientRect();
  lastBox = `${initialBox.width.toFixed(1)}:${initialBox.height.toFixed(1)}`;
  try {
    frame = current.motion ? buildMotionFrame(current, 0, presentation) : null;
    draw();
  } catch (e) {
    interrupt(`初期描画失敗: ${e.message}`);
    return;
  }
  // The following animation frame is the common t=0, after the initial draw.
  raf = requestAnimationFrame((now) => {
    if (token !== epoch) return;
    try {
      if (current.motion) {
        frame = buildMotionFrame(current, 0, presentation);
        draw();
      }
      startTime = session.didRender();
      last = now;
      readyTime = performance.now();
      setPhase("question");
      syncAnswers();
      if (current.motion) raf = requestAnimationFrame((t) => tick(t, token));
    } catch (e) {
      interrupt(`描画失敗: ${e.message}`);
    }
  });
}
function syncAnswers() {
  const enabled =
    phase === "question" &&
    (current.questionId !== "Q32" || !!presentation.first);
  document
    .querySelectorAll("[data-answer]")
    .forEach((b) => (b.disabled = !enabled));
  updateStatus();
}
function tick(now, token) {
  if (token !== epoch || phase !== "question") return;
  if (frameGapExceeded(last, now)) {
    interrupt(`描画間隔が100msを超えました (${Math.round(now - last)}ms)`);
    return;
  }
  last = now;
  const elapsed = now - startTime;
  try {
    const pending = buildMotionFrame(current, elapsed, presentation);
    frame = pending;
    draw();
    commitPresentation(presentation, pending);
    if (presentation.first) {
      session.didPresent(presentation.first);
      if (
        readyTime !== Infinity &&
        document.querySelector("[data-answer]").disabled
      )
        readyTime = performance.now();
    }
    syncAnswers();
    raf = requestAnimationFrame((t) => tick(t, token));
  } catch (e) {
    interrupt(`描画失敗: ${e.message}`);
  }
}
function submit(button, event) {
  if (phase !== "question" || button.disabled || event.timeStamp < readyTime)
    return;
  // Pointer and keyboard start tokens prevent a press begun on the previous screen from carrying over.
  if (event.detail > 0) {
    if (
      !pointer ||
      pointer.epoch !== epoch ||
      pointer.button !== button.dataset.answer ||
      pointer.time < readyTime
    )
      return;
  } else if (
    pointer?.epoch !== epoch ||
    pointer.button !== button.dataset.answer ||
    pointer.time < readyTime
  )
    return;
  const s = session.getState(),
    choice = current.choices["ABCD".indexOf(button.dataset.answer)];
  pointer = null;
  if (
    session.submitAnswer({
      questionIndex: s.index,
      choiceId: choice.choiceId,
      receivedAt: performance.now(),
      snapshot: frame,
    }) !== "accepted"
  )
    return;
  stop();
  const done = session.getState();
  if (gallery) {
    showReview(0);
    $("retry").hidden = false;
  } else if (done.phase === "result") showResult();
  else {
    setPhase("between");
    $("status").textContent =
      "回答を確定しました。正解は10問後に確認できます。";
    $("pause").hidden = true;
    $("next").hidden = false;
  }
}
function startRun() {
  clearError();
  clearRun();
  try {
    const seed = crypto.getRandomValues(new Uint32Array(1))[0],
      instances = createRun({
        questions: bank,
        acceptance,
        seed,
        reducedMotion: reduced.matches || $("reduce-motion").checked,
      });
    session = createSession({ instances, clock: createClock() });
    $("gallery-controls").hidden = true;
    prepare();
  } catch (e) {
    home();
    showError(e.message);
  }
}
function galleryQuestion() {
  clearRun();
  clearError();
  const id = $("question-select").value,
    q = bank.find((q) => q.questionId === id);
  $("question").hidden = false;
  disableAnswers();
  if (!q) {
    showError(
      `${id}: ${report.find((e) => e.questionId === id)?.reason ?? "問題が見つかりません"}`,
    );
    setPhase("error");
    return;
  }
  if (reduced.matches && q.motion) {
    showError(
      `${id}: 動きを減らす設定では動く問題を採点しません。静止問題を選んでください。`,
    );
    setPhase("error");
    return;
  }
  const order = [...$("order-select").value].map((x) => "ABCD".indexOf(x));
  session = createSession({
    instances: [createInstance(q, order)],
    clock: createClock(),
  });
  prepare();
}
function showResult() {
  stop();
  hideScreens();
  $("result").hidden = false;
  setPhase("result");
  const s = session.getState(),
    result = summarizeRun(s.instances, s.answers, s);
  $("score").textContent = `${result.correctCount} / 10`;
  $("total-time").textContent =
    `${formatTime(result.totalAnswerMs)} 秒${result.reference ? "（参考）" : ""}`;
  $("result-notes").textContent = result.interruptions.length
    ? `中断: ${result.interruptions.join(" / ")}`
    : "読み込み・切替・解説は計時に含みません。";
}
function showReview(index) {
  stop();
  hideScreens();
  $("question").hidden = false;
  $("review-panel").hidden = false;
  $("pause").hidden = true;
  $("next").hidden = true;
  $("review-nav").hidden = gallery;
  $("retry").hidden = !gallery;
  setPhase("review");
  reviewIndex = index;
  const s = session.getState();
  current = s.instances[index];
  review = buildReview(current, s.answers[index]);
  reveal = false;
  overlay = false;
  $("question-id").textContent = current.questionId;
  $("counter").textContent = gallery ? "単問の答え合わせ" : `${index + 1} / 10`;
  $("prompt").textContent = current.prompt;
  $("hint").textContent = current.targetHint;
  $("status").textContent = "答え合わせ · 時間は加算されません";
  $("feedback").textContent =
    `選択 ${review.answerLabel} ／ 正解 ${review.correctLabel} · ${review.answer.choiceId === current.correctChoiceId ? "正解" : "不正解"} · ${formatTime(Math.round(review.answer.answerMs))} 秒`;
  $("explanation").textContent = review.note;
  $("metrics").textContent = current.choices
    .map(
      (c, i) =>
        `${"ABCD"[i]}: ${Number(metricFromGeometry(current.questionId, c.geometry).toFixed(6))}`,
    )
    .join(" ／ ");
  $("scene-design").textContent = current.sceneDesign;
  $("sources").replaceChildren(
    ...current.sources.map((s) => {
      const li = document.createElement("li"),
        a = document.createElement("a");
      a.href = s.url;
      a.textContent = s.title;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      li.append(a);
      return li;
    }),
  );
  $("proof").setAttribute("aria-pressed", "false");
  $("overlay").hidden = !["Q03", "Q05", "Q09"].includes(current.questionId);
  $("review-prev").disabled = index === 0;
  $("review-next").disabled = index === s.answers.length - 1;
  frame = review.to ?? null;
  draw();
}
function updateGallery() {
  const params = new URLSearchParams(location.search),
    id = params.get("q") ?? "Q01",
    order = params.get("order") ?? "ABCD";
  for (let n = 1; n <= 33; n++) {
    const key = `Q${String(n).padStart(2, "0")}`,
      q = bank.find((q) => q.questionId === key),
      option = document.createElement("option");
    option.value = key;
    option.textContent = `${key} ${q?.title ?? "エラー"}`;
    $("question-select").append(option);
  }
  const perms = (a) =>
    a.length
      ? a.flatMap((v, i) =>
          perms(a.filter((_, j) => j !== i)).map((p) => v + p),
        )
      : [""];
  for (const p of perms(["A", "B", "C", "D"])) {
    const o = document.createElement("option");
    o.value = p;
    o.textContent = p;
    $("order-select").append(o);
  }
  if (!/^Q(0[1-9]|[12][0-9]|3[0-3])$/.test(id))
    showError(`${id}: 未知の問題ID`);
  else $("question-select").value = id;
  if (perms(["A", "B", "C", "D"]).includes(order))
    $("order-select").value = order;
  else showError(`候補順 ${order} が不正`);
  $("acceptance-state").textContent =
    "採用判断: 保留 · 見え方・iPhone実機未確認";
  $("home-screen").hidden = true;
  $("gallery-controls").hidden = false;
  $("question").hidden = true;
  setPhase("gallery");
}
for (const button of document.querySelectorAll("[data-answer]")) {
  button.addEventListener("pointerdown", (e) => {
    if (phase === "question" && !button.disabled && e.isPrimary)
      pointer = {
        epoch,
        button: button.dataset.answer,
        time: performance.now(),
      };
  });
  button.addEventListener("pointercancel", () => (pointer = null));
  button.addEventListener("keydown", (e) => {
    if (["Enter", " "].includes(e.key) && !e.repeat && !button.disabled)
      pointer = {
        epoch,
        button: button.dataset.answer,
        time: performance.now(),
      };
  });
  button.addEventListener("click", (e) => submit(button, e));
}
$("home").onclick = () => (gallery ? location.assign("../") : home());
$("start").onclick = startRun;
$("restart").onclick = startRun;
$("restart-interrupted").onclick = () =>
  gallery ? galleryQuestion() : startRun();
$("load-question").onclick = galleryQuestion;
$("retry").onclick = galleryQuestion;
$("next").onclick = () => {
  if (phase !== "between") return;
  session.prepareQuestion();
  prepare();
};
$("pause").onclick = () => interrupt("手動で停止");
$("resume").onclick = () => {
  if (current.motion && reduced.matches) {
    showError(
      "動きを減らす設定では動く問題を再開できません。ホームから静止問題だけで確認してください。",
    );
    return;
  }
  session.resumeReference();
  prepare();
};
$("review-open").onclick = () => showReview(0);
$("review-prev").onclick = () => showReview(reviewIndex - 1);
$("review-next").onclick = () => showReview(reviewIndex + 1);
$("back-result").onclick = showResult;
$("proof").onclick = () => {
  reveal = !reveal;
  overlay = false;
  $("proof").setAttribute("aria-pressed", String(reveal));
  draw({ proof: reveal, model: review.to });
};
$("overlay").onclick = () => {
  overlay = !overlay;
  reveal = true;
  $("proof").setAttribute("aria-pressed", "true");
  draw({ proof: true });
};
$("question-select").onchange = () => {
  stop();
  session?.abort();
  session = null;
  setPhase("gallery");
  $("question").hidden = true;
};
// Document visibility events suspend even if the browser has already become visible again.
document.addEventListener("visibilitychange", () =>
  interrupt("背景化・表示切替"),
);
window.addEventListener("pagehide", () => {
  clearRun();
});
window.addEventListener("pageshow", (e) => {
  if (e.persisted) home();
});
window.addEventListener("orientationchange", () => interrupt("画面回転"));
let lastBox = "";
new ResizeObserver(() => {
  const b = $("stage").getBoundingClientRect(),
    box = `${b.width.toFixed(1)}:${b.height.toFixed(1)}`;
  if (lastBox && box !== lastBox) {
    if (phase === "question") interrupt("比較領域の寸法変更");
    else if (phase === "review") draw({ proof: reveal, model: review?.to });
  }
  lastBox = box;
}).observe($("stage"));
reduced.addEventListener("change", () => {
  if (current?.motion) interrupt("動きを減らす設定が変更されました");
});
try {
  const fetchJSON = async (path) => {
    const r = await fetch(asset(path));
    if (!r.ok) throw new Error(`データ読込失敗: ${r.status} ${path}`);
    return r.json();
  };
  const [raw, a] = await Promise.all([
    fetchJSON("../docs/question-bank/questions-v1.json"),
    fetchJSON("./acceptance.json"),
  ]);
  const checked = validateDesignBank(raw);
  bank = checked.questions;
  report = checked.errors;
  acceptance = a.questions;
  $("loading").hidden = true;
  $("reduce-motion").checked = reduced.matches;
  $("version").textContent =
    `版: ${document.querySelector('meta[name="build-sha"]').content}`;
  if (gallery) updateGallery();
  else home();
  if (report.length)
    showError(report.map((e) => `${e.questionId}: ${e.reason}`).join("\n"));
} catch (e) {
  setPhase("error");
  $("loading").hidden = true;
  showError(e.message);
}
