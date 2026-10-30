import { parse } from "yaml";
import { checkFreshness } from "./check-main.mjs";
function requirePolicy(ok, message) {
  if (!ok) throw Error(`Workflow policy: ${message}`);
}
export function validateWorkflow(input) {
  const w = typeof input === "string" ? parse(input) : input;
  const { verify: v, deploy: d } = w.jobs;
  requirePolicy(
    JSON.stringify(w.on.pull_request?.branches) === '["main"]' &&
      JSON.stringify(w.on.push?.branches) === '["main"]',
    "main triggers",
  );
  requirePolicy(
    Object.hasOwn(w.on, "workflow_dispatch") &&
      !Object.hasOwn(w.on, "pull_request_target"),
    "safe triggers",
  );
  for (const event of ["push", "pull_request"])
    requirePolicy(
      Object.keys(w.on[event]).every((k) => k === "branches"),
      "no path filters",
    );
  requirePolicy(
    JSON.stringify(w.permissions) === '{"contents":"read"}' &&
      JSON.stringify(v.permissions) === '{"contents":"read"}',
    "read only validation",
  );
  requirePolicy(
    d.permissions.contents === "read" &&
      d.permissions.pages === "write" &&
      d.permissions["id-token"] === "write" &&
      Object.keys(d.permissions).length === 3,
    "deploy permissions",
  );
  requirePolicy(
    Array.isArray(d.needs) && d.needs.includes("verify"),
    "verified dependency",
  );
  requirePolicy(
    d.concurrency.group === "pages-production" &&
      d.concurrency["cancel-in-progress"] === false &&
      d.concurrency.queue === "max",
    "serialized deployment and postcheck, no pending eviction",
  );
  requirePolicy(
    !w.concurrency && !v.concurrency,
    "PR cannot cancel deployment",
  );
  requirePolicy(d.environment.name === "github-pages", "pages environment");
  for (const job of Object.values(w.jobs)) {
    requirePolicy(!job["continue-on-error"], "no ignored job errors");
    for (const step of job.steps) {
      requirePolicy(!step["continue-on-error"], "no ignored step errors");
      if (step.uses)
        requirePolicy(/@[a-f0-9]{40}$/.test(step.uses), "pin action commit");
      if (step.uses?.startsWith("actions/checkout@"))
        requirePolicy(
          step.with.ref === "${{ github.sha }}" &&
            step.with["persist-credentials"] === false,
          "same SHA checkout",
        );
    }
  }
  const order = (job, predicate) => job.steps.findIndex(predicate),
    unit = order(v, (s) => s.run === "npm test"),
    browser = order(v, (s) => s.run === "npm run test:browser"),
    build = order(v, (s) => s.run === "npm run build"),
    artifactCheck = order(
      v,
      (s) => s.name === "Test publication artifact on repository subpath",
    ),
    upload = order(v, (s) =>
      s.uses?.startsWith("actions/upload-pages-artifact@"),
    );
  requirePolicy(
    unit >= 0 &&
      browser > unit &&
      build > browser &&
      artifactCheck > build &&
      upload > artifactCheck,
    "test/build/upload order",
  );
  requirePolicy(!v.steps.some((s) => s.if), "all verification steps mandatory");
  const guard = order(d, (s) => s.run === "node scripts/check-main.mjs"),
    deploy = order(d, (s) => s.uses?.startsWith("actions/deploy-pages@")),
    post = order(d, (s) => s.run === "npm run verify:published");
  requirePolicy(
    guard >= 0 && deploy === guard + 1 && post === deploy + 1,
    "guard immediately precedes deploy then public check",
  );
  requirePolicy(
    d.steps[guard].id === "fresh" && d.steps[deploy].id === "deployment",
    "guard output bound",
  );
  return w;
}
// Evaluate the YAML conditions themselves against the event/result matrix. Only this limited expression grammar is accepted.
function condition(source, context) {
  const expression = source?.replace(/^\$\{\{\s*|\s*\}\}$/g, "");
  if (!expression || !/^[a-zA-Z0-9_.' /()=!&|-]+$/.test(expression))
    throw Error("Unsupported workflow expression");
  return Function(
    "github",
    "needs",
    "steps",
    `"use strict";return !!(${expression});`,
  )(context.github, context.needs, context.steps);
}
export function evaluateWorkflow(w, { event, ref, result, sha, latest }) {
  const ctx = {
    github: { event_name: event, ref, sha },
    needs: { verify: { result } },
    steps: {
      fresh: {
        outputs: {
          allowed: String(checkFreshness({ event, ref, sha, latest }).allowed),
        },
      },
      deployment: { outcome: "success" },
    },
  };
  const eligible = condition(w.jobs.deploy.if, ctx),
    deployStep = w.jobs.deploy.steps.find((s) => s.id === "deployment"),
    post = w.jobs.deploy.steps.find(
      (s) => s.run === "npm run verify:published",
    );
  return {
    deploy: eligible && condition(deployStep.if, ctx),
    postcheck:
      eligible && condition(deployStep.if, ctx) && condition(post.if, ctx),
  };
}
