import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createClock } from "../game/clock.js";
import { createSession } from "../game/session.js";
import { summarizeRun, compareResults, formatTime } from "../game/results.js";
import { buildReview } from "../game/review.js";
import { loadBaseQuestions } from "../game/bank.js";
import { createInstance } from "../game/sampling.js";
import {
  buildMotionFrame,
  createPresentation,
  commitPresentation,
} from "../game/render/motion.js";
const bank = loadBaseQuestions(
    JSON.parse(readFileSync("docs/question-bank/questions-v1.json")),
  ),
  instances = bank.slice(0, 10).map((q) => createInstance(q));
test("clock excludes preparation and review, counts observation; first valid answer only", () => {
  let now = 100;
  const clock = createClock({ now: () => now }),
    s = createSession({ instances, clock });
  assert.equal(
    s.submitAnswer({ questionIndex: 0, choiceId: "Q01:A", receivedAt: now }),
    "ignored",
  );
  now = 500;
  s.didRender();
  now = 812.345;
  assert.equal(
    s.submitAnswer({ questionIndex: 0, choiceId: "Q01:A", receivedAt: now }),
    "accepted",
  );
  assert.equal(s.getState().answers[0].answerMs, 312.345);
  assert.equal(
    s.submitAnswer({ questionIndex: 0, choiceId: "Q01:A", receivedAt: now }),
    "ignored",
  );
  assert.equal(s.getState().phase, "between");
  s.prepareQuestion();
  assert.equal(s.getState().phase, "preparing");
  now = 1000;
  s.didRender();
  assert.equal(
    s.submitAnswer({ questionIndex: 0, choiceId: "Q01:A", receivedAt: now }),
    "ignored",
  );
  assert.equal(
    s.submitAnswer({ questionIndex: 1, choiceId: "unknown", receivedAt: now }),
    "ignored",
  );
  for (let i = 1; i < 10; i++) {
    s.submitAnswer({
      questionIndex: i,
      choiceId: instances[i].correctChoiceId,
      receivedAt: 1100 + i,
    });
    if (i < 9) {
      s.prepareQuestion();
      s.didRender();
    }
  }
  assert.equal(s.getState().phase, "result");
  assert.equal(s.getState().answers.length, 10);
  s.abort();
  assert.equal(s.getState().answers.length, 0);
  assert.equal(s.getState().instances.length, 0);
});
test("Q32 starts clock before enabling; early inputs not reserved; rendering failure interrupts", () => {
  let now = 0;
  const q = createInstance(bank[31]),
    s = createSession({
      instances: [q],
      clock: createClock({ now: () => now }),
    });
  s.didRender();
  now = 599;
  assert.equal(
    s.submitAnswer({
      questionIndex: 0,
      choiceId: q.correctChoiceId,
      receivedAt: now,
    }),
    "ignored",
  );
  const p = createPresentation(),
    f = buildMotionFrame(q, 617, p);
  commitPresentation(p, f);
  now = 617;
  s.didPresent(p.first);
  assert.equal(
    s.submitAnswer({
      questionIndex: 0,
      choiceId: q.correctChoiceId,
      receivedAt: 700,
    }),
    "accepted",
  );
  assert.equal(s.getState().answers[0].answerMs, 700);
  assert.equal(s.getState().answers[0].snapshot.elapsedMs, 617);
  const failed = createSession({
    instances: [q],
    clock: createClock({ now: () => now }),
  });
  failed.didRender();
  failed.interrupt("描画失敗");
  assert.equal(failed.getState().phase, "interrupted");
  assert.equal(
    failed.submitAnswer({
      questionIndex: 0,
      choiceId: q.correctChoiceId,
      receivedAt: 1000,
    }),
    "ignored",
  );
});
test("interruptions retain confirmed answers, reset current timer and permanently mark reference", () => {
  let now = 0;
  const s = createSession({
    instances,
    clock: createClock({ now: () => now }),
  });
  s.didRender();
  s.submitAnswer({ questionIndex: 0, choiceId: "Q01:A", receivedAt: 50 });
  s.prepareQuestion();
  s.didRender();
  for (const reason of ["背景化", "回転", "比較領域変更", "描画遅延"]) {
    s.interrupt(reason);
    assert.equal(s.getState().phase, "interrupted");
    s.resumeReference();
    assert.equal(s.getState().answers.length, 1);
    assert.equal(s.getState().phase, "preparing");
    now += 1000;
    s.didRender();
  }
  assert.equal(s.getState().reference, true);
  assert.equal(s.getState().interruptions.length, 4);
  s.submitAnswer({
    questionIndex: 1,
    choiceId: "Q02:B",
    receivedAt: now + 123.4,
  });
  assert.ok(Math.abs(s.getState().answers[1].answerMs - 123.4) < 1e-9);
});
test("results require ten valid answers, round only sum, correct count wins, integer-ms tie", () => {
  const answers = instances.map((q, i) => ({
    questionIndex: i,
    choiceId: q.correctChoiceId,
    answerMs: 1000.049,
  }));
  const r = summarizeRun(instances, answers);
  assert.equal(r.correctCount, 10);
  assert.equal(r.totalAnswerMs, 10000);
  assert.equal(formatTime(r.totalAnswerMs), "10.000");
  assert.equal(
    compareResults(
      { correctCount: 8, totalAnswerMs: 30000 },
      { correctCount: 7, totalAnswerMs: 10000 },
    ),
    -1,
  );
  assert.equal(
    compareResults(
      { correctCount: 8, totalAnswerMs: 30001 },
      { correctCount: 8, totalAnswerMs: 30000 },
    ),
    1,
  );
  assert.equal(compareResults(r, { ...r }), 0);
  assert.throws(() => summarizeRun(instances, answers.slice(1)));
  for (const bad of [-1, NaN, Infinity])
    assert.throws(() =>
      summarizeRun(
        instances,
        answers.map((a, i) => (i ? a : { ...a, answerMs: bad })),
      ),
    );
  assert.throws(() =>
    summarizeRun(
      instances,
      answers.map((a, i) => (i ? a : { ...a, choiceId: "Q02:B" })),
    ),
  );
});
test("review uses frozen played instance, regenerates common 0/1000 only for explanatory model; Q32 actual first frame", () => {
  for (const q0 of bank) {
    const q = createInstance(q0);
    const state = createPresentation();
    const f = buildMotionFrameIf(q, state);
    const a = {
      choiceId: q.choices[0].choiceId,
      answerMs: 80,
      snapshot: state.first ?? f,
    };
    const review = buildReview(q, a);
    assert.equal(review.instance, q);
    assert.equal(
      review.correctLabel,
      "ABCD"[q.choices.findIndex((c) => c.choiceId === q.correctChoiceId)],
    );
    if (["Q28", "Q33"].includes(q.questionId)) {
      assert.equal(review.from.elapsedMs, 0);
      assert.equal(review.to.elapsedMs, 1000);
      assert.match(review.note, /再生成/);
    }
    if (q.questionId === "Q32") assert.equal(review.to.elapsedMs, 617);
  }
  function buildMotionFrameIf(q, p) {
    if (!q.motion) return null;
    const f = buildMotionFrame(q, 617, p);
    commitPresentation(p, f);
    return f;
  }
});
