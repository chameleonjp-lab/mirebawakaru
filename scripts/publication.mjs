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
  const start = now();
  let last = "";
  for (;;) {
    onAttempt();
    if (latestSha) {
      const latest = await latestSha();
      if (latest !== expectedSha)
        return { status: "superseded", expectedSha, latest };
    }
    try {
      const manifest = await read();
      if (manifest.sha === expectedSha) return { status: "matched", manifest };
      last = `公開SHA=${manifest.sha}`;
    } catch (e) {
      last = e.message;
    }
    if (now() - start >= maxWaitMs)
      throw Error(`反映確認の期限を超えました: ${last}`);
    await sleep(Math.min(intervalMs, maxWaitMs - (now() - start)));
  }
}
