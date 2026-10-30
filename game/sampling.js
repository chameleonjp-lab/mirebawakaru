import { solveQuestion } from "./rules.js";
import { isEligible } from "./bank.js";
export function createRng(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function shuffle(items, rng) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function freeze(o) {
  if (o && typeof o === "object") {
    Object.values(o).forEach(freeze);
    Object.freeze(o);
  }
  return o;
}
export function createInstance(q, order = [0, 1, 2, 3]) {
  if (
    order.length !== 4 ||
    new Set(order).size !== 4 ||
    order.some((x) => !Number.isInteger(x) || x < 0 || x > 3)
  )
    throw new Error("候補順が不正");
  const copy = structuredClone(q);
  copy.choices = order.map((i) => copy.choices[i]);
  copy.correctChoiceId = solveQuestion(copy);
  return freeze(copy);
}
export function createRun({
  questions,
  acceptance,
  seed,
  mode = "verification",
  reducedMotion = false,
}) {
  const rng = createRng(seed),
    families = new Map();
  for (const q of questions) {
    if (reducedMotion && q.motion) continue;
    if (
      !isEligible(
        acceptance.find((a) => a.questionId === q.questionId),
        mode,
      )
    )
      continue;
    solveQuestion(q);
    if (!families.has(q.familyId)) families.set(q.familyId, []);
    families.get(q.familyId).push(q);
  }
  if (families.size < 10)
    throw new Error(
      `有効な系統が${families.size}件です。10系統必要です。単問確認を利用してください。`,
    );
  return shuffle([...families.values()], rng)
    .slice(0, 10)
    .map((list) => {
      const q = list[Math.floor(rng() * list.length)];
      return createInstance({ ...q, seed }, shuffle([0, 1, 2, 3], rng));
    });
}
