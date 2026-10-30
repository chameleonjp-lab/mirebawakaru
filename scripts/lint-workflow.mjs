import { readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { stringify } from "yaml";
import { validateWorkflow } from "./workflow-policy.mjs";
const w = validateWorkflow(
  await readFile(".github/workflows/pages.yml", "utf8"),
);
// actionlint 1.7.12 predates the documented queue:max key. Its semantics are mandatory above.
// Normalize ONLY this key for that parser; all triggers, permissions, conditions and steps stay intact.
delete w.jobs.deploy.concurrency.queue;
const dir = await mkdtemp(join(tmpdir(), "pages-lint-"));
try {
  const file = join(dir, "pages.yml");
  await writeFile(file, stringify(w));
  const result = spawnSync(
    process.env.ACTIONLINT ?? "actionlint",
    ["-shellcheck=", file],
    { stdio: "inherit" },
  );
  if (result.status !== 0) throw Error("actionlint failed");
  console.log(
    "YAML policy + actionlint passed (queue:max independently validated)",
  );
} finally {
  await rm(dir, { recursive: true, force: true });
}
