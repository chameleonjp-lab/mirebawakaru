import { createHash } from "node:crypto";
export function verifyBytes(bytes, expected) {
  const actual = createHash("sha256").update(bytes).digest("hex");
  if (actual !== expected)
    throw Error(`hash mismatch: expected=${expected}, actual=${actual}`);
  return true;
}
export async function pollRelease({
  expectedSha,
  read,
  latestSha,
  now = () => Date.now(),
  sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
  intervalMs = 15000,
  maxWaitMs = 300000,
  onAttempt = () => {},
}) {
  const start = now(),
    controller = new AbortController();
  let last = "";
  const deadlineError = () => new Error(`反映確認の期限を超えました: ${last}`);
  async function withinDeadline(operation) {
    const remaining = maxWaitMs - (now() - start);
    if (remaining <= 0) throw deadlineError();
    let timer;
    try {
      const result = await Promise.race([
        operation({ signal: controller.signal, remainingMs: remaining }),
        new Promise((_, reject) => {
          timer = setTimeout(() => {
            controller.abort(deadlineError());
            reject(deadlineError());
          }, remaining);
        }),
      ]);
      if (now() - start >= maxWaitMs) {
        controller.abort(deadlineError());
        throw deadlineError();
      }
      return result;
    } finally {
      clearTimeout(timer);
    }
  }
  for (;;) {
    onAttempt();
    if (latestSha) {
      const latest = await withinDeadline(latestSha);
      if (latest !== expectedSha)
        return { status: "superseded", expectedSha, latest };
    }
    try {
      const manifest = await withinDeadline(read);
      if (manifest.sha === expectedSha) return { status: "matched", manifest };
      last = `公開SHA=${manifest.sha}`;
    } catch (e) {
      last = e.message;
    }
    if (now() - start >= maxWaitMs || controller.signal.aborted)
      throw deadlineError();
    await sleep(Math.min(intervalMs, maxWaitMs - (now() - start)));
  }
}
