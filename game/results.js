export function summarizeRun(instances, answers, meta = {}) {
  if (instances.length !== 10 || answers.length !== 10)
    throw new Error("10回答が必要");
  let correctCount = 0,
    total = 0;
  answers.forEach((a, i) => {
    const q = instances[i];
    if (
      a.questionIndex !== i ||
      !q.choices.some((c) => c.choiceId === a.choiceId) ||
      !Number.isFinite(a.answerMs) ||
      a.answerMs < 0
    )
      throw new Error("回答が不正");
    if (q.correctChoiceId === a.choiceId) correctCount++;
    total += a.answerMs;
  });
  return {
    correctCount,
    totalAnswerMs: Math.round(total),
    reference: !!meta.reference,
    interruptions: [...(meta.interruptions ?? [])],
  };
}
export const compareResults = (a, b) =>
  a.correctCount !== b.correctCount
    ? Math.sign(b.correctCount - a.correctCount)
    : Math.sign(a.totalAnswerMs - b.totalAnswerMs);
export const formatTime = (ms) => (ms / 1000).toFixed(3);
