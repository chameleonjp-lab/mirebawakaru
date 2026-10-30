import { readFile, appendFile } from "node:fs/promises";
import { chromium } from "playwright";
import { verifyBytes, pollRelease } from "./publication.mjs";
import { readMainSha } from "./check-main.mjs";
const url = process.env.PAGE_URL ?? process.argv[2],
  dir = process.env.ARTIFACT_DIR ?? "dist";
if (!url) throw Error("PAGE_URL or URL argument is required");
const base = url.endsWith("/") ? url : url + "/",
  expected = JSON.parse(await readFile(`${dir}/release.json`, "utf8")),
  expectedSha = expected.sha;
const latestSha = process.env.GITHUB_ACTIONS ? readMainSha : undefined;
async function readManifest() {
  const r = await fetch(
    new URL(`release.json?expected=${expectedSha}&at=${Date.now()}`, base),
    { cache: "no-store", signal: AbortSignal.timeout(10000) },
  );
  if (!r.ok) throw Error(`manifest HTTP ${r.status}`);
  return r.json();
}
async function checkBrowser() {
  const browser = await chromium.launch(),
    page = await browser.newPage({ viewport: { width: 393, height: 852 } }),
    errors = [],
    loaded = new Set(),
    pending = [],
    root = new URL(base);
  page.setDefaultTimeout(10000);
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("requestfailed", (r) => errors.push(`通信失敗 ${r.url()}`));
  page.on("response", (response) => {
    const u = new URL(response.url());
    if (u.origin !== root.origin || !u.pathname.startsWith(root.pathname)) {
      errors.push(`外部通信 ${u}`);
      return;
    }
    const path =
      decodeURIComponent(u.pathname.slice(root.pathname.length)) ||
      "index.html";
    pending.push(
      (async () => {
        if (response.status() !== 200)
          throw Error(`HTTP ${response.status()} ${path}`);
        const hash = expected.files[path];
        if (!hash) throw Error(`成果物にない参照 ${path}`);
        verifyBytes(await response.body(), hash);
        loaded.add(path);
      })().catch((e) => errors.push(`${path}: ${e.message}`)),
    );
  });
  try {
    await page.goto(base);
    await page.waitForFunction(
      () => document.querySelector("#app")?.dataset.phase === "home",
    );
    if (
      (await page.locator('meta[name="build-sha"]').getAttribute("content")) !==
      expectedSha
    )
      throw Error("HTML SHA mismatch");
    await page.locator("#reduce-motion").check();
    await page.locator("#start").click();
    for (let i = 0; i < 10; i++) {
      await page.locator('[data-answer="A"]').click();
      if (i < 9) await page.locator("#next").click();
    }
    await page.locator("#review-open").click();
    await page.locator("#proof").click();
    await page.goto(new URL("dev/question-gallery.html?q=Q32", base).href);
    await page.locator("#load-question").click();
    await page.locator('[data-answer="A"]').click();
    await page.locator("#proof").click();
    if (
      !(await page
        .locator("#explanation")
        .textContent()
        .then((s) => s.includes("実提示")))
    )
      throw Error("Q32 review missing");
    await page.waitForLoadState("networkidle");
    await Promise.all(pending);
    for (const p of [
      "index.html",
      "dev/question-gallery.html",
      `_releases/${expectedSha}/game/main.js`,
      `_releases/${expectedSha}/game/styles.css`,
      `_releases/${expectedSha}/game/acceptance.json`,
      `_releases/${expectedSha}/docs/question-bank/questions-v1.json`,
    ])
      if (!loaded.has(p)) throw Error(`ブラウザ未読込 ${p}`);
    if (errors.length) throw Error(errors.join("\n"));
    return loaded.size;
  } finally {
    await browser.close();
  }
}
try {
  const result = await pollRelease({
    expectedSha,
    latestSha,
    read: async () => {
      const m = await readManifest();
      if (m.sha === expectedSha) {
        if (JSON.stringify(m) !== JSON.stringify(expected))
          throw Error("manifest content mismatch");
        const count = await checkBrowser();
        if ((await readManifest()).sha !== expectedSha)
          throw Error("検査中に公開SHAが変更");
        m.browserVerifiedCount = count;
      }
      return m;
    },
    onAttempt: () =>
      console.log(
        `照合を試行: ${expectedSha} (15秒間隔・最大5分。混在ファイルは成功扱いしません)`,
      ),
  });
  if (result.status === "superseded") {
    console.log(
      `Superseded by main ${result.latest}; this run does NOT confirm the successor.`,
    );
    if (process.env.GITHUB_STEP_SUMMARY)
      await appendFile(
        process.env.GITHUB_STEP_SUMMARY,
        `### 公開後検査: 後続mainへ移行\n期待SHA ${expectedSha} はmain ${result.latest} に置き換わりました。新しい版の確認成功として扱いません。後続実行を確認してください。\n`,
      );
  } else {
    if (latestSha && (await latestSha()) !== expectedSha)
      throw Error("公開後検査中にmainが変更。後続実行の確認が必要です");
    const count = result.manifest.browserVerifiedCount;
    console.log(
      `Browser verified ${count} actual HTML/JS/CSS/JSON resources at ${base}, SHA ${expectedSha}`,
    );
    if (process.env.GITHUB_STEP_SUMMARY)
      await appendFile(
        process.env.GITHUB_STEP_SUMMARY,
        `### 公開後の画面確認済み\nSHA: \`${expectedSha}\`\nURL: ${base}\n入口・10問・答え合わせ・単問Q32をブラウザで操作し、実際に読み込んだ${count}ファイルを検査成果物のSHA-256と照合しました。iPhone実機確認ではありません。\n`,
      );
  }
} catch (e) {
  if (process.env.GITHUB_STEP_SUMMARY)
    await appendFile(
      process.env.GITHUB_STEP_SUMMARY,
      `### 公開後検査失敗\n配備済みの可能性があります。期待SHA: ${expectedSha}\n${e.message}\n通常の修正PRまたはrevert PRで修正し、mainの最新実行を再実行してください。\n`,
    );
  throw e;
}
