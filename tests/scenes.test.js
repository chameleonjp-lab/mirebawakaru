import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { loadBaseQuestions } from "../game/bank.js";
import {
  buildStaticScene,
  metricFromGeometry,
  proofGeometry,
} from "../game/render/static.js";
import {
  buildMotionFrame,
  createPresentation,
  commitPresentation,
  frameGapExceeded,
} from "../game/render/motion.js";
const raw = JSON.parse(readFileSync("docs/question-bank/questions-v1.json"));
const bank = () => loadBaseQuestions(raw);
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} ≠ ${b}`);
test("all 27 actual scenes retain manuscript length/area/angle/colour/topology, proof does not rescale or recolour", () => {
  for (const q of bank().slice(0, 27)) {
    const s = buildStaticScene(q);
    assert.equal(s.candidates.length, 4);
    for (let i = 0; i < 4; i++) {
      const c = s.candidates[i];
      assert.equal(c.choiceId, q.choices[i].choiceId);
      close(
        metricFromGeometry(q.questionId, c.geometry),
        raw.questions.find((r) => r.id === q.questionId).baseline.choices[i]
          .value,
      );
      const p = proofGeometry(q.questionId, c.geometry);
      close(
        metricFromGeometry(q.questionId, p),
        metricFromGeometry(q.questionId, c.geometry),
      );
      assert.deepEqual(p.fillRgb, c.geometry.fillRgb);
      assert.ok(
        c.geometry.targets.length > 0 ||
          ["Q20", "Q26", "Q27"].includes(q.questionId),
      );
    }
  }
  const get = (id) => bank().find((q) => q.questionId === id).choices;
  close(
    (get("Q05")[0].geometry.sector.angle *
      (get("Q05")[0].geometry.sector.outer ** 2 -
        get("Q05")[0].geometry.sector.inner ** 2)) /
      2,
    11025,
  );
  const p = get("Q09")[0].geometry.targets[0].points;
  close(
    Math.abs(
      p.reduce(
        (s, a, i) => s + a[0] * p[(i + 1) % 4][1] - a[1] * p[(i + 1) % 4][0],
        0,
      ) / 2,
    ),
    10816,
  );
  assert.deepEqual(
    get("Q18").map((c) => c.geometry.fillRgb),
    [
      [152, 152, 152],
      [160, 160, 160],
      [136, 136, 136],
      [144, 144, 144],
    ],
  );
  const circles = get("Q15").map((c) => c.geometry.path);
  close(
    Math.hypot(
      circles[2][0][0] - circles[2].at(-1)[0],
      circles[2][0][1] - circles[2].at(-1)[1],
    ),
    0,
  );
  assert.ok(
    Math.hypot(
      circles[0][0][0] - circles[0].at(-1)[0],
      circles[0][0][1] - circles[0].at(-1)[1],
    ) > 8,
  );
});
test("six motion models share elapsed time; equal times independent of frame rate", () => {
  for (const q of bank().slice(27)) {
    const a = buildMotionFrame(q, 0, createPresentation());
    const b = buildMotionFrame(q, 1000, createPresentation());
    assert.ok(b.candidates.every((c) => c.elapsedMs === 1000));
    for (const fps of [30, 60, 120]) {
      for (let i = 0; i < fps; i++)
        buildMotionFrame(q, (1000 * i) / fps, createPresentation());
      assert.deepEqual(buildMotionFrame(q, 1000, createPresentation()), b);
    }
    if (q.questionId === "Q28")
      assert.deepEqual(
        b.candidates.map((c) => c.angle),
        [0, 0, 0, 9],
      );
    if (q.questionId === "Q31")
      assert.deepEqual(
        b.candidates.map((c) => [c.dx, c.dy]),
        [
          [-20, 0],
          [0, -20],
          [20, 0],
          [0, 20],
        ],
      );
    if (q.questionId === "Q33")
      assert.deepEqual(
        b.candidates.map(
          (c) => c.x - a.candidates.find((d) => d.choiceId === c.choiceId).x,
        ),
        [18, 12, 14, 16],
      );
  }
  const q29 = bank()[28],
    q30 = bank()[29];
  assert.deepEqual(
    buildMotionFrame(q29, 750).candidates.map((c) => c.dx),
    [5, 0, 0, 0],
  );
  assert.deepEqual(
    buildMotionFrame(q30, 750).candidates.map((c) => c.dx),
    [0, 5, 0, 0],
  );
  assert.equal(frameGapExceeded(0, 100), false);
  assert.equal(frameGapExceeded(0, 101), true);
});
test("Q32 actual presentation is committed only after rendering; 80ms hold, repeat schedule, wrong choices never overlap", () => {
  const q = bank()[31],
    state = createPresentation();
  assert.equal(buildMotionFrame(q, 599, state).flash, false);
  assert.equal(state.first, null);
  const f = buildMotionFrame(q, 617, state);
  assert.ok(f.flash);
  assert.equal(f.presentationStart, 617);
  assert.equal(state.first, null);
  commitPresentation(state, f);
  assert.equal(state.first.elapsedMs, 617);
  for (const t of [617, 640, 696.999]) {
    const frame = buildMotionFrame(q, t, state);
    assert.ok(frame.flash);
    assert.equal(frame.presentationStart, 617);
    for (let i = 0; i < 4; i++) {
      const c = frame.candidates[i];
      assert.ok(c.x > 6 && c.x < 234);
      assert.ok(c.markX > 1 && c.markX < 239);
      if (i === 3) assert.ok(Math.abs(c.x - c.markX) <= 3.2);
      else assert.ok(Math.abs(c.x - c.markX) > 7);
    }
  }
  assert.equal(buildMotionFrame(q, 697, state).flash, false);
  assert.equal(buildMotionFrame(q, 2399, state).flash, false);
  const second = buildMotionFrame(q, 2411, state);
  assert.ok(second.flash);
  commitPresentation(state, second);
  assert.equal(state.first.elapsedMs, 617);
  assert.equal(state.current.start, 2411);
  assert.ok(buildMotionFrame(q, 4200, state).flash);
});
test("Q33 resets all candidates in one common blank interval, never a visible return or per-speed reset", () => {
  const q = bank()[32];
  for (const t of [0, 1000, 7999])
    assert.ok(buildMotionFrame(q, t).candidates.every((c) => !c.resetting));
  for (const t of [8000, 8300, 8999])
    assert.ok(buildMotionFrame(q, t).candidates.every((c) => c.resetting));
  assert.deepEqual(
    buildMotionFrame(q, 9000).candidates.map((c) => c.wrappedX),
    [40, 40, 40, 40],
  );
});
