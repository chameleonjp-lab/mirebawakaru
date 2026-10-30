import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  loadBaseQuestions,
  validateDesignBank,
  isEligible,
} from "../game/bank.js";
import { solveQuestion, colorPredicate } from "../game/rules.js";
import {
  createRun,
  createInstance,
  createRng,
  shuffle,
} from "../game/sampling.js";
const raw = JSON.parse(
  readFileSync(
    new URL("../docs/question-bank/questions-v1.json", import.meta.url),
  ),
);
const permutations = (a) =>
  a.length
    ? a.flatMap((v, i) =>
        permutations(a.filter((_, j) => i !== j)).map((p) => [v, ...p]),
      )
    : [[]];
test("33 independent families, categories, raw correctness and invalid data reasons", () => {
  const report = validateDesignBank(raw);
  assert.deepEqual(report.errors, []);
  const qs = loadBaseQuestions(raw);
  assert.equal(qs.length, 33);
  assert.equal(new Set(qs.map((q) => q.familyId)).size, 33);
  assert.deepEqual(
    Object.values(Object.groupBy(qs, (q) => q.category)).map((a) => a.length),
    [9, 7, 5, 4, 2, 6],
  );
  for (const q of qs) {
    assert.equal(q.choices.length, 4);
    assert.equal(
      solveQuestion(q),
      `${q.questionId}:${raw.questions.find((r) => r.id === q.questionId).baseline.correct_label}`,
    );
  }
  for (const mutate of [
    (b) => (b.questions[0].baseline.choices[0].value = NaN),
    (b) => (b.questions[0].baseline.correct_rule = "unknown"),
    (b) => b.questions[0].baseline.choices.pop(),
    (b) => (b.questions[0].baseline.choices[1].value = 106),
    (b) => (b.questions[0].id = b.questions[1].id),
    (b) => (b.questions[21].baseline.choices[1].fill_rgb = [100, 100, 100]),
  ]) {
    const b = structuredClone(raw);
    mutate(b);
    const r = validateDesignBank(b);
    assert.ok(r.errors.length);
    assert.ok(r.errors[0].questionId);
    assert.ok(r.errors[0].reason);
  }
});
test("final geometry derives correct IDs in all 24 orders; raw correct_label cannot fix answer", () => {
  const qs = loadBaseQuestions(raw);
  for (const q of qs)
    for (const order of permutations([0, 1, 2, 3])) {
      const i = createInstance(q, order);
      assert.equal(i.correctChoiceId, solveQuestion(q));
      assert.equal(
        i.choices[
          order.indexOf(
            q.choices.findIndex((c) => c.choiceId === i.correctChoiceId),
          )
        ].choiceId,
        i.correctChoiceId,
      );
      assert.ok(Object.isFrozen(i.choices[0].geometry));
    }
  const b = structuredClone(raw);
  b.questions[0].baseline.correct_label = "D";
  assert.equal(solveQuestion(loadBaseQuestions(b)[0]), "Q01:A");
  const q = structuredClone(qs[0]);
  q.rule.kind = "min";
  assert.equal(solveQuestion(q), "Q01:B");
  q.rule = { kind: "equals", targetValue: 987 };
  assert.throws(() => solveQuestion(q), /正解/);
  q.rule = { kind: "nonzero" };
  assert.throws(() => solveQuestion(q), /正解/);
});
test("RGB predicates enforce classification, not largest component", () => {
  assert.equal(colorPredicate("red_category", [130, 129, 128]), false);
  assert.equal(colorPredicate("red_category", [186, 104, 104]), true);
  assert.equal(colorPredicate("blue_category", [104, 128, 186]), true);
  assert.equal(colorPredicate("neutral_white", [245, 245, 245]), true);
  assert.equal(colorPredicate("neutral_white", [246, 245, 245]), false);
  assert.equal(colorPredicate("center_fill", [255, 255, 255]), false);
});
test("verification permits pending/revise, production requires all evidence; sample 10 distinct immutable families", () => {
  const qs = loadBaseQuestions(raw);
  const a = {
    checks: {
      manuscript: "pass",
      render: "pending",
      visual: "pending",
      portrait: "pending",
      landscape: "pending",
      motion: "not_applicable",
    },
    conclusion: "hold",
  };
  assert.ok(isEligible(a, "verification"));
  assert.ok(!isEligible(a, "production"));
  assert.ok(isEligible({ ...a, conclusion: "revise" }, "verification"));
  const accepted = {
    ...a,
    checks: Object.fromEntries(Object.keys(a.checks).map((k) => [k, "pass"])),
    conclusion: "qualified",
  };
  assert.ok(isEligible(accepted, "production"));
  const acceptance = qs.map((q) => ({ ...a, questionId: q.questionId }));
  const r = createRun({
    questions: qs,
    acceptance,
    seed: 42,
    mode: "verification",
  });
  assert.equal(r.length, 10);
  assert.equal(new Set(r.map((q) => q.familyId)).size, 10);
  assert.deepEqual(
    r,
    createRun({ questions: qs, acceptance, seed: 42, mode: "verification" }),
  );
  assert.throws(
    () => createRun({ questions: qs.slice(0, 9), acceptance, seed: 1 }),
    /10/,
  );
  assert.throws(
    () => createRun({ questions: qs, acceptance, seed: 1, mode: "production" }),
    /10/,
  );
  const before = structuredClone(r);
  qs[0].prompt = "mutated";
  assert.deepEqual(r, before);
  assert.equal(
    createRun({
      questions: loadBaseQuestions(raw),
      acceptance,
      seed: 1,
      reducedMotion: true,
    }).some((q) => q.motion),
    false,
  );
  const rng = createRng(42);
  assert.notEqual(rng(), rng());
  assert.deepEqual(
    shuffle([1, 2, 3, 4], () => 0),
    [2, 3, 4, 1],
  );
});
test("safety rejects mismatched renderer metrics, out of range geometry and invalid motion directions/offsets", () => {
  for (const [n, mutate] of [
    [0, (b) => (b.metric = "radius")],
    [2, (b) => (b.choices[0].value = 1e8)],
    [30, (b) => (b.choices[0].value = 5)],
    [31, (b) => (b.choices[0].value = -1)],
    [31, (b) => (b.motion_constraints.minimum_wrong_initial_offset = 1)],
  ]) {
    const b = structuredClone(raw);
    mutate(b.questions[n].baseline);
    assert.ok(
      validateDesignBank(b).errors.some(
        (e) => e.questionId === b.questions[n].id,
      ),
    );
  }
});
