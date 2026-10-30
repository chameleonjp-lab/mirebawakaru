import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  evaluateWorkflow,
  validateWorkflow,
} from "../scripts/workflow-policy.mjs";
import { checkFreshness } from "../scripts/check-main.mjs";
import { pollRelease, verifyBytes } from "../scripts/publication.mjs";
const sha = "1".repeat(40),
  newSha = "2".repeat(40);
test("workflow YAML enforces PR/read-only, main/success dependencies, main dispatch, SHA guard and serialized postcheck", async () => {
  const yaml = await readFile(".github/workflows/pages.yml", "utf8");
  const wf = validateWorkflow(yaml);
  for (const [event, ref, result, latest, want] of [
    ["pull_request", "refs/pull/4/merge", "success", sha, false],
    ["push", "refs/heads/main", "failure", sha, false],
    ["push", "refs/heads/main", "cancelled", sha, false],
    ["workflow_dispatch", "refs/heads/feature", "success", sha, false],
    ["workflow_dispatch", "refs/heads/main", "success", newSha, false],
    ["push", "refs/heads/main", "success", sha, true],
    ["workflow_dispatch", "refs/heads/main", "success", sha, true],
  ]) {
    assert.equal(
      evaluateWorkflow(wf, { event, ref, result, sha, latest }).deploy,
      want,
      `${event}/${ref}/${result}/${latest}`,
    );
  }
  for (const mutate of [
    (w) => (w.jobs.deploy.needs = []),
    (w) => (w.jobs.deploy.permissions.contents = "write"),
    (w) => (w.jobs.verify["continue-on-error"] = true),
    (w) => (w.on.push.paths = ["game/**"]),
    (w) => (w.jobs.deploy.concurrency["cancel-in-progress"] = true),
    (w) => w.jobs.deploy.steps.reverse(),
  ]) {
    const w = structuredClone(wf);
    mutate(w);
    assert.throws(() => validateWorkflow(w));
  }
  assert.equal(
    checkFreshness({ event: "push", ref: "refs/heads/main", sha, latest: sha })
      .allowed,
    true,
  );
  assert.equal(
    checkFreshness({
      event: "push",
      ref: "refs/heads/main",
      sha,
      latest: newSha,
    }).allowed,
    false,
  );
});
test("build allowlist preserves materials, subpath references and exact byte hashes; never publishes workspace", async () => {
  const dir = await mkdtemp(join(tmpdir(), "quiz-build-")),
    out = join(dir, "site");
  const r = spawnSync(process.execPath, ["scripts/build.mjs", "--out", out], {
    env: { ...process.env, BUILD_SHA: sha },
    encoding: "utf8",
  });
  assert.equal(r.status, 0, r.stderr);
  const m = JSON.parse(await readFile(join(out, "release.json")));
  assert.equal(m.sha, sha);
  assert.ok(m.files["index.html"]);
  assert.ok(m.files[`_releases/${sha}/game/main.js`]);
  assert.ok(m.files[`_releases/${sha}/docs/question-bank/questions-v1.json`]);
  for (const [path, hash] of Object.entries(m.files)) {
    assert.equal(
      createHash("sha256")
        .update(await readFile(join(out, path)))
        .digest("hex"),
      hash,
    );
    assert.ok(
      !/(node_modules|\.git|tests|test-results|\.superpowers)/.test(path),
    );
  }
  for (const file of [
    "visual-illusion-atlas.html",
    "visual-illusion-guide.docx",
    "visual-illusion-materials.zip",
    "source/renderers.js",
    "docs/question-bank/questions-v1.md",
  ])
    assert.deepEqual(await readFile(join(out, file)), await readFile(file));
  const html = await readFile(join(out, "dev/question-gallery.html"), "utf8");
  assert.ok(html.includes(`../_releases/${sha}/game/main.js`));
  assert.ok(!html.includes('src="/'));
  assert.ok(html.includes(`content="${sha}"`));
  const dirs = await readdir(out);
  assert.ok(!dirs.includes("node_modules"));
  assert.ok(!dirs.includes("tests"));
});
test("published bytes: mixed assets fail, retries bounded, latest successor distinct from old success", async () => {
  const bytes = Buffer.from("expected js"),
    hash = createHash("sha256").update(bytes).digest("hex");
  assert.equal(verifyBytes(bytes, hash), true);
  assert.throws(() => verifyBytes(Buffer.from("stale js"), hash), /hash/);
  let attempts = 0,
    time = 0;
  await assert.rejects(
    pollRelease({
      expectedSha: sha,
      latestSha: async () => sha,
      read: async () => ({ sha: "old" }),
      now: () => time,
      sleep: async (ms) => {
        time += ms;
      },
      intervalMs: 15,
      maxWaitMs: 60,
      onAttempt: () => attempts++,
    }),
    /期限/,
  );
  assert.equal(attempts, 5);
  const superseded = await pollRelease({
    expectedSha: sha,
    latestSha: async () => newSha,
    read: async () => ({ sha: newSha }),
    sleep: async () => {
      throw Error("must not wait");
    },
  });
  assert.equal(superseded.status, "superseded");
  const ok = await pollRelease({
    expectedSha: sha,
    latestSha: async () => sha,
    read: async () => ({ sha }),
    intervalMs: 1,
  });
  assert.equal(ok.status, "matched");
});

test("publication rejects a matching response after deadline and bounds stalled asynchronous checks", async () => {
  let time = 0;
  await assert.rejects(
    pollRelease({
      expectedSha: sha,
      read: async () => {
        time = 300001;
        return { sha };
      },
      now: () => time,
      sleep: async () => {},
      maxWaitMs: 300000,
    }),
    /期限/,
  );
  const start = Date.now();
  let signal;
  await assert.rejects(
    pollRelease({
      expectedSha: sha,
      read: ({ signal: s }) => {
        signal = s;
        return new Promise(() => {});
      },
      maxWaitMs: 30,
    }),
    /期限/,
  );
  assert.ok(signal.aborted);
  assert.ok(Date.now() - start < 1000);
});
