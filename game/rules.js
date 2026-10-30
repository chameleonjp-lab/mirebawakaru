import { metricFromGeometry } from "./render/static.js";
export function colorPredicate(metric, rgb) {
  if (
    !Array.isArray(rgb) ||
    rgb.length !== 3 ||
    !rgb.every((x) => Number.isInteger(x) && x >= 0 && x <= 255)
  )
    throw new Error("RGBが不正");
  const [r, g, b] = rgb;
  switch (metric) {
    case "red_category":
      return r >= g + 32 && r >= b + 32;
    case "blue_category":
      return b >= r + 32 && b >= g + 32;
    case "neutral_white":
      return r === g && g === b && r >= 240;
    case "center_fill":
      return Math.max(...rgb.map((x) => Math.abs(x - 255))) >= 16;
    default:
      throw new Error(`未知の色条件 ${metric}`);
  }
}
export function solveQuestion(q) {
  const values = q.choices.map((c) =>
    metricFromGeometry(q.questionId, c.geometry),
  );
  if (!values.every(Number.isFinite))
    throw new Error(`${q.questionId}: 不正な判定値`);
  const { kind, targetValue } = q.rule;
  let matches;
  if (kind === "max" || kind === "min") {
    const target = Math[kind](...values);
    matches = values.map((v) => Math.abs(v - target) < 1e-7);
  } else if (kind === "equals")
    matches = values.map((v) => Math.abs(v - targetValue) < 1e-7);
  else if (kind === "nonzero") matches = values.map((v) => Math.abs(v) > 1e-7);
  else throw new Error(`${q.questionId}: 未知の判定規則 ${kind}`);
  if (matches.filter(Boolean).length !== 1)
    throw new Error(
      `${q.questionId}: 正解が${matches.filter(Boolean).length}個`,
    );
  return q.choices[matches.indexOf(true)].choiceId;
}
