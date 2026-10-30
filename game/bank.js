import { makeGeometry, metricFromGeometry } from "./render/static.js";
import { solveQuestion, colorPredicate } from "./rules.js";
const metrics = [
  "logical_length",
  "radius",
  "area",
  "endpoint_distance",
  "segment_distance",
  "projected_area",
  "join_error",
  "angle_difference",
  "curve_amplitude",
  "aspect_ratio",
  "line_angle",
  "radial_growth_per_turn",
  "center_angle",
  "gray_level",
  "added_band",
  "painted_dark_dot",
  "red_category",
  "neutral_white",
  "center_fill",
  "blue_category",
  "painted_triangle_edge",
  "painted_circle_edge",
  "angular_speed",
  "center_motion_amplitude",
  "point_motion_amplitude",
  "marker_direction_code",
  "flash_initial_offset",
  "linear_speed",
];
const rendererMetrics = [
  "logical_length",
  "logical_length",
  "radius",
  "radius",
  "area",
  "logical_length",
  "endpoint_distance",
  "segment_distance",
  "projected_area",
  "join_error",
  "angle_difference",
  "curve_amplitude",
  "aspect_ratio",
  "line_angle",
  "radial_growth_per_turn",
  "center_angle",
  "gray_level",
  "gray_level",
  "added_band",
  "painted_dark_dot",
  "gray_level",
  "red_category",
  "neutral_white",
  "center_fill",
  "blue_category",
  "painted_triangle_edge",
  "painted_circle_edge",
  "angular_speed",
  "center_motion_amplitude",
  "point_motion_amplitude",
  "marker_direction_code",
  "flash_initial_offset",
  "linear_speed",
];
function convert(q) {
  if (
    !/^Q(0[1-9]|[12][0-9]|3[0-3])$/.test(q.id) ||
    !/^F\d{2}$/.test(q.family_id)
  )
    throw new Error("問題ID／系統IDが不正");
  if (!q.prompt || !q.target_hint || !q.scene_design || !q.sources?.length)
    throw new Error("原稿・出典が不足");
  const b = q.baseline;
  if (!b || !metrics.includes(b.metric)) throw new Error("未知の判定値");
  if (rendererMetrics[Number(q.id.slice(1)) - 1] !== b.metric)
    throw new Error("描画と判定値の種類が不一致");
  if (b.choices?.length !== 4) throw new Error("4候補が必要");
  if (
    new Set(b.choices.map((c) => c.label)).size !== 4 ||
    b.choices.some((c) => !["A", "B", "C", "D"].includes(c.label))
  )
    throw new Error("候補IDが不正");
  const choices = b.choices.map((c, i) => {
    if (!Number.isFinite(c.value)) throw new Error("有限の判定値が必要");
    const ranges = {
      logical_length: [1, 160],
      radius: [1, 80],
      area: [1, 15000],
      endpoint_distance: [1, 160],
      segment_distance: [1, 160],
      projected_area: [1, 15000],
      join_error: [0, 30],
      angle_difference: [-20, 20],
      curve_amplitude: [-20, 20],
      aspect_ratio: [0.5, 1.5],
      line_angle: [-20, 20],
      radial_growth_per_turn: [-25, 25],
      center_angle: [-20, 20],
      angular_speed: [-30, 30],
      center_motion_amplitude: [0, 10],
      point_motion_amplitude: [0, 10],
      linear_speed: [1, 20],
    };
    const range = ranges[b.metric];
    if (range && (c.value < range[0] || c.value > range[1]))
      throw new Error("作図の安全範囲外");
    if (q.id === "Q31" && ![1, 2, 3, 4].includes(c.value))
      throw new Error("方向コードが不正");
    if (q.id === "Q32" && c.value !== [-24, 24, 36, 0][i])
      throw new Error("Q32基本形のずれが不正");
    if (b.unit === "boolean" && ![0, 1].includes(c.value))
      throw new Error("真偽値が不正");
    if (b.unit === "0_to_255" && (c.value < 0 || c.value > 255))
      throw new Error("灰色が範囲外");
    if (
      [
        "logical_length",
        "radius",
        "area",
        "endpoint_distance",
        "segment_distance",
        "projected_area",
        "aspect_ratio",
        "linear_speed",
      ].includes(b.metric) &&
      c.value <= 0
    )
      throw new Error("寸法・速度は正数");
    if (
      [
        "red_category",
        "blue_category",
        "neutral_white",
        "center_fill",
      ].includes(b.metric) &&
      Number(colorPredicate(b.metric, c.fill_rgb)) !== c.value
    )
      throw new Error("色条件と値が不一致");
    const geometry = makeGeometry(q.id, c.value, i, c.fill_rgb),
      actual = metricFromGeometry(q.id, geometry);
    if (Math.abs(actual - c.value) > 1e-7)
      throw new Error(`作図値の不一致 ${actual} / ${c.value}`);
    return { choiceId: `${q.id}:${c.label}`, geometry };
  });
  if (q.id === "Q32") {
    const m = b.motion_constraints;
    if (
      !m ||
      m.speed !== 40 ||
      m.point_radius !== 6 ||
      m.flash_line_width !== 2 ||
      m.flash_duration_ms !== 80 ||
      m.first_flash_delay_ms !== 600 ||
      m.repeat_period_ms !== 1800 ||
      m.minimum_wrong_initial_offset !== 24 ||
      m.maximum_travel_during_flash !== 3.2
    )
      throw new Error("Q32同期条件が不正");
  }
  const result = {
    questionId: q.id,
    familyId: q.family_id,
    variantId: "base",
    category: q.category,
    title: q.title,
    prompt: q.prompt,
    targetHint: q.target_hint,
    rendererKey: q.id,
    motion: q.category === "motion",
    choices,
    rule: {
      kind: b.correct_rule,
      metric: b.metric,
      targetValue: b.target_value,
    },
    reviewSpec: q.answer_explanation,
    sceneDesign: q.scene_design,
    sources: q.sources,
    versions: { bank: 1, rules: 1, renderer: 1 },
  };
  solveQuestion(result);
  return result;
}
export function validateDesignBank(raw) {
  const errors = [],
    questions = [],
    seen = new Set(),
    families = new Set();
  if (!Array.isArray(raw?.questions))
    return {
      errors: [{ questionId: "bank", reason: "問題配列がありません" }],
      questions,
    };
  for (const q of raw.questions) {
    try {
      if (seen.has(q.id) || families.has(q.family_id))
        throw new Error("重複ID／系統");
      seen.add(q.id);
      families.add(q.family_id);
      questions.push(convert(q));
    } catch (e) {
      errors.push({ questionId: q?.id ?? "unknown", reason: e.message });
    }
  }
  if (raw.questions.length !== 33)
    errors.push({ questionId: "bank", reason: "基本33問が必要" });
  return { errors, questions };
}
export function loadBaseQuestions(raw) {
  return validateDesignBank(raw).questions;
}
export function isEligible(a, mode = "verification") {
  if (!a || a.checks?.manuscript !== "pass") return false;
  if (mode === "verification") return true;
  const required = ["manuscript", "render", "visual", "portrait", "landscape"];
  if (
    a.conclusion !== "qualified" ||
    !required.every((key) => a.checks[key] === "pass")
  )
    return false;
  const knownStatic = /^Q(0[1-9]|1[0-9]|2[0-7])$/.test(a.questionId ?? "");
  if (
    a.checks.motion !== "pass" &&
    !(knownStatic && a.checks.motion === "not_applicable")
  )
    return false;
  return Object.values(a.checks).every(
    (v) => v === "pass" || (v === "not_applicable" && knownStatic),
  );
}
