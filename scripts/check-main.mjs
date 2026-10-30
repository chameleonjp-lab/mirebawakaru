import { appendFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
export function checkFreshness({ event, ref, sha, latest }) {
  if (
    !["push", "workflow_dispatch"].includes(event) ||
    ref !== "refs/heads/main"
  )
    return { allowed: false, reason: "mainのpush／手動実行以外は配備しません" };
  if (!/^[0-9a-f]{40}$/.test(sha) || sha !== latest)
    return {
      allowed: false,
      reason: `古いSHAを配備しません: expected=${sha}, latest=${latest}`,
    };
  return { allowed: true, reason: `検査済みmain ${sha}` };
}
export async function readMainSha({ signal } = {}) {
  const r = await fetch(
    `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/git/ref/heads/main`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      },
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(15000)])
        : AbortSignal.timeout(15000),
    },
  );
  if (!r.ok) throw Error(`main SHA確認に失敗 (${r.status})`);
  return (await r.json()).object.sha;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const result = checkFreshness({
    event: process.env.GITHUB_EVENT_NAME,
    ref: process.env.GITHUB_REF,
    sha: process.env.GITHUB_SHA,
    latest: await readMainSha(),
  });
  console.log(result.reason);
  await appendFile(process.env.GITHUB_OUTPUT, `allowed=${result.allowed}\n`);
  if (process.env.GITHUB_STEP_SUMMARY)
    await appendFile(
      process.env.GITHUB_STEP_SUMMARY,
      `### 配備直前のSHA確認\n${result.reason}\n`,
    );
}
