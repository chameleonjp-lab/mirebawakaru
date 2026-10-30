import { buildStaticScene } from "./render/static.js";
import { buildMotionFrame } from "./render/motion.js";
export function buildReview(instance, answer) {
  const label = (id) =>
    "ABCD"[instance.choices.findIndex((c) => c.choiceId === id)];
  let from = null,
    to = null,
    note = instance.reviewSpec;
  if (instance.motion) {
    if (instance.questionId === "Q32") {
      if (!answer.snapshot?.flash)
        throw new Error("Q32: 初回実提示状態がありません");
      to = answer.snapshot;
      note +=
        " ブラウザへ渡した初回実提示の状態です。物理的な発光時刻の測定ではありません。";
    } else {
      from = buildMotionFrame(instance, 0);
      to = buildMotionFrame(instance, 1000);
      note +=
        " 共通t=0・t=1000msのモデルから再生成した説明図です。この2時刻を実際に見せたという意味ではありません。";
    }
  }
  return {
    instance,
    answer,
    correctLabel: label(instance.correctChoiceId),
    answerLabel: label(answer.choiceId),
    scene: buildStaticScene(instance),
    from,
    to,
    note,
  };
}
