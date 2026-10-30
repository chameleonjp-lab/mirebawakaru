/** Transient only. Instances, frames and answers are discarded by abort. */
export function createSession({ instances, clock }) {
  let state = {
      phase: "preparing",
      instances: [...instances],
      index: 0,
      answers: [],
      reference: false,
      interruptions: [],
    },
    enabled = false,
    first = null;
  return {
    getState() {
      return structuredClone(state);
    },
    didRender() {
      if (state.phase !== "preparing") return;
      const began = clock.start();
      state.phase = "question";
      enabled = state.instances[state.index].questionId !== "Q32";
      return began;
    },
    didPresent(snapshot) {
      if (
        state.phase !== "question" ||
        state.instances[state.index].questionId !== "Q32" ||
        !snapshot?.flash
      )
        return;
      first ??= structuredClone(snapshot);
      enabled = true;
    },
    submitAnswer({ questionIndex, choiceId, receivedAt, snapshot }) {
      const q = state.instances[state.index];
      if (
        state.phase !== "question" ||
        !enabled ||
        questionIndex !== state.index ||
        !q.choices.some((c) => c.choiceId === choiceId)
      )
        return "ignored";
      const answerMs = clock.stop(receivedAt);
      if (!Number.isFinite(answerMs) || answerMs < 0) {
        this.interrupt("計時値が不正");
        return "ignored";
      }
      enabled = false;
      state.answers.push({
        questionIndex,
        choiceId,
        correct: choiceId === q.correctChoiceId,
        answerMs,
        snapshot: structuredClone(first ?? snapshot ?? null),
      });
      state.phase =
        state.answers.length === state.instances.length ? "result" : "between";
      return "accepted";
    },
    prepareQuestion() {
      if (state.phase !== "between") return;
      state.index++;
      state.phase = "preparing";
      enabled = false;
      first = null;
      clock.reset();
    },
    interrupt(reason) {
      if (!["preparing", "question"].includes(state.phase)) return;
      clock.stop();
      enabled = false;
      state.phase = "interrupted";
      state.reference = true;
      state.interruptions.push(reason);
    },
    resumeReference() {
      if (state.phase !== "interrupted") return;
      clock.reset();
      enabled = false;
      first = null;
      state.phase = "preparing";
    },
    abort() {
      clock.reset();
      enabled = false;
      first = null;
      state = {
        phase: "home",
        instances: [],
        index: 0,
        answers: [],
        reference: false,
        interruptions: [],
      };
    },
  };
}
