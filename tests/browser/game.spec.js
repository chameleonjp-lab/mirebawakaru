import { test, expect } from "@playwright/test";
const sizes = [
  { width: 402, height: 700 },
  { width: 393, height: 852 },
  { width: 852, height: 393 },
];
async function openQuestion(page, id, order = "ABCD") {
  await page.goto(`dev/question-gallery.html?q=${id}&order=${order}`);
  await expect(page.locator("#load-question")).toBeEnabled();
  await page.locator("#load-question").click();
  await expect(page.locator("#app")).toHaveAttribute("data-phase", "question");
}
async function answer(page) {
  await expect(page.locator('[data-answer="A"]')).toBeEnabled();
  await page.locator('[data-answer="A"]').click();
}
test("33 scenes render and review at all requested sizes without comparison scrolling or script/network failures", async ({
  page,
}, info) => {
  test.setTimeout(180000);
  const failures = [];
  page.on("pageerror", (e) => failures.push(e.message));
  page.on("requestfailed", (r) => failures.push(r.url()));
  for (const size of sizes) {
    await page.setViewportSize(size);
    for (let n = 1; n <= 33; n++) {
      const id = `Q${String(n).padStart(2, "0")}`;
      await openQuestion(page, id);
      await expect(page.locator("canvas")).toBeVisible();
      await expect(page.locator("#prompt")).not.toBeEmpty();
      if (id === "Q32")
        await expect(page.locator('[data-answer="A"]')).toBeEnabled();
      const boxes = await page
        .locator("canvas, [data-answer]")
        .evaluateAll((es) =>
          es.map((e) => {
            const b = e.getBoundingClientRect();
            return { x: b.x, y: b.y, w: b.width, h: b.height };
          }),
        );
      for (const b of boxes) {
        expect(b.x).toBeGreaterThanOrEqual(0);
        expect(b.y).toBeGreaterThanOrEqual(0);
        expect(b.x + b.w).toBeLessThanOrEqual(size.width + 0.5);
        expect(b.y + b.h).toBeLessThanOrEqual(size.height + 0.5);
      }
      for (const b of boxes.slice(1)) {
        expect(b.w).toBeGreaterThanOrEqual(44);
        expect(b.h).toBeGreaterThanOrEqual(44);
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await answer(page);
      await expect(page.locator("#feedback")).toContainText("正解");
      await page.locator("#proof").click();
      await expect(page.locator("#proof")).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      if ([1, 5, 9, 15, 18, 22, 26, 28, 31, 32, 33].includes(n))
        await page.screenshot({
          path: info.outputPath(`${size.width}-${id}.png`),
        });
    }
  }
  expect(failures).toEqual([]);
});
test("colour interior pixels match fixed RGB before and after proof, even after shuffling", async ({
  page,
}) => {
  await page.setViewportSize(sizes[0]);
  const expected = {
    Q17: [
      [140, 140, 140],
      [134, 134, 134],
      [128, 128, 128],
      [146, 146, 146],
    ],
    Q18: [
      [144, 144, 144],
      [136, 136, 136],
      [160, 160, 160],
      [152, 152, 152],
    ],
    Q22: [
      [110, 150, 126],
      [110, 132, 156],
      [186, 104, 104],
      [132, 132, 132],
    ],
    Q23: [
      [215, 230, 245],
      [245, 245, 245],
      [230, 240, 210],
      [245, 220, 205],
    ],
    Q24: [
      [218, 242, 248],
      [255, 255, 255],
      [255, 255, 255],
      [255, 255, 255],
    ],
    Q25: [
      [110, 150, 126],
      [156, 110, 110],
      [132, 132, 132],
      [104, 128, 186],
    ],
  };
  for (const [id, want] of Object.entries(expected)) {
    await openQuestion(page, id, "DCBA");
    const pixels = () =>
      page.locator("canvas").evaluate(
        (canvas, { id }) => {
          const ctx = canvas.getContext("2d");
          return [0, 1, 2, 3].map((i) => {
            let x = 120,
              y = 120;
            if (id === "Q18") {
              x = 110;
              y = 90;
            }
            if (id === "Q22") y = 72;
            return [
              ...ctx.getImageData(
                Math.round((((i % 2) * 250 + 5 + x) * canvas.width) / 500),
                Math.round(
                  ((Math.floor(i / 2) * 230 + y) * canvas.height) / 460,
                ),
                1,
                1,
              ).data,
            ].slice(0, 3);
          });
        },
        { id },
      );
    expect(await pixels()).toEqual(want);
    await answer(page);
    await page.locator("#proof").click();
    expect(await pixels()).toEqual(want);
  }
});
test("ten questions, double input ignored, review, home/reload discard, reduced motion", async ({
  page,
}) => {
  await page.goto("./");
  await page.locator("#reduce-motion").check();
  await page.locator("#start").click();
  const ids = [];
  for (let i = 0; i < 10; i++) {
    await expect(page.locator("#app")).toHaveAttribute(
      "data-phase",
      "question",
    );
    const id = await page.locator("#question-id").textContent();
    ids.push(id);
    expect(Number(id.slice(1))).toBeLessThan(28);
    await answer(page);
    if (i < 9) {
      await expect(page.locator("#next")).toBeVisible();
      await page.locator('[data-answer="A"]').click({ force: true });
      await expect(page.locator("#counter")).toContainText(`${i + 1} / 10`);
      await page.locator("#next").click();
    }
  }
  expect(new Set(ids).size).toBe(10);
  await expect(page.locator("#score")).toContainText("/ 10");
  await expect(page.locator("#total-time")).toHaveText(/^\d+\.\d{3} 秒/);
  await page.locator("#review-open").click();
  await expect(page.locator("#feedback")).toContainText("正解");
  await page.locator("#proof").click();
  await page.locator("#home").click();
  await expect(page.locator("#app")).toHaveAttribute("data-phase", "home");
  await page.reload();
  await expect(page.locator("#result")).toBeHidden();
});
test("Q32 waits for actual flash; motion/resize/background interruptions and reference continuation", async ({
  page,
}) => {
  await page.clock.install();
  await openQuestion(page, "Q32");
  await expect(page.locator('[data-answer="A"]')).toBeDisabled();
  await page.clock.runFor(560);
  await expect(page.locator('[data-answer="A"]')).toBeDisabled();
  await page.locator('[data-answer="A"]').dispatchEvent("click");
  await page.clock.runFor(100);
  await expect(page.locator('[data-answer="A"]')).toBeEnabled();
  await answer(page);
  await expect(page.locator("#explanation")).toContainText("実提示");
  await openQuestion(page, "Q28");
  await page.locator("#pause").click();
  await expect(page.locator("#interrupted")).toBeVisible();
  await page.locator("#resume").click();
  await expect(page.locator("#status")).toContainText("参考");
  await page.clock.runFor(32);
  await expect(page.locator("#app")).toHaveAttribute("data-phase", "question");
  await page.setViewportSize(sizes[2]);
  await page.clock.runFor(32);
  await expect(page.locator("#interrupted")).toBeVisible();
  await page.locator("#resume").click();
  await page.evaluate(() =>
    document.dispatchEvent(new Event("visibilitychange")),
  );
  await expect(page.locator("#interrupted")).toBeVisible();
});
test("invalid question IDs, bad data and nonunique answers are visible and never substituted", async ({
  page,
}) => {
  await page.goto("dev/question-gallery.html?q=Q99");
  await expect(page.locator("#errors")).toContainText("Q99");
  await page.route("**/questions-v1.json", async (route) => {
    const response = await route.fetch(),
      b = await response.json();
    b.questions[0].baseline.choices[1].value = 106;
    await route.fulfill({ json: b });
  });
  await page.goto("dev/question-gallery.html?q=Q01");
  await expect(page.locator("#errors")).toContainText("Q01");
  await page.locator("#load-question").click();
  await expect(page.locator("#errors")).toContainText("正解が2個");
  await expect(page.locator('[data-answer="A"]')).toBeDisabled();
});
test("storage, cookies and outbound results never used through full run and interruption", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.forbidden = [];
    for (const name of ["setItem", "removeItem", "clear"])
      Storage.prototype[name] = function () {
        window.forbidden.push("Storage." + name);
        throw Error("storage forbidden");
      };
    indexedDB.open = () => {
      window.forbidden.push("indexedDB");
      throw Error("db forbidden");
    };
    Object.defineProperty(document, "cookie", {
      get: () => "",
      set: () => {
        window.forbidden.push("cookie");
      },
    });
    navigator.sendBeacon = () => {
      window.forbidden.push("beacon");
      return false;
    };
  });
  const requests = [];
  page.on("request", (r) =>
    requests.push({ method: r.method(), url: r.url(), body: r.postData() }),
  );
  await page.goto("./");
  await page.locator("#reduce-motion").check();
  await page.locator("#start").click();
  for (let i = 0; i < 10; i++) {
    await answer(page);
    if (i < 9) await page.locator("#next").click();
  }
  await page.locator("#review-open").click();
  await page.locator("#proof").click();
  await page.locator("#home").click();
  await page.locator("#start").click();
  await page.locator("#pause").click();
  await page.locator("#resume").click();
  await page.locator("#home").click();
  expect(await page.evaluate(() => window.forbidden)).toEqual([]);
  expect(requests.every((r) => r.method === "GET" && r.body === null)).toBe(
    true,
  );
  expect(
    requests.every((r) => new URL(r.url).origin === new URL(page.url()).origin),
  ).toBe(true);
});
test("home clears rendered answer/time data and reduced-motion changes cannot resume an animated question", async ({
  page,
}) => {
  await openQuestion(page, "Q01");
  await answer(page);
  await page.goto("./");
  await page.locator("#reduce-motion").check();
  await page.locator("#start").click();
  for (let i = 0; i < 10; i++) {
    await answer(page);
    if (i < 9) await page.locator("#next").click();
  }
  await page.locator("#review-open").click();
  await page.locator("#home").click();
  await expect(page.locator("#feedback")).toBeEmpty();
  await expect(page.locator("#score")).toBeEmpty();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openQuestion(page, "Q28");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("#interrupted")).toBeVisible();
  await page.locator("#resume").click();
  await expect(page.locator('[data-answer="A"]')).toBeDisabled();
  await expect(page.locator("#app")).not.toHaveAttribute(
    "data-phase",
    "question",
  );
});

test("selecting another gallery ID while interrupted clears stale controls and resumes with that exact ID", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await openQuestion(page, "Q28");
  await page.locator("#pause").click();
  await page.locator("#question-select").selectOption("Q02");
  await expect(page.locator("#interrupted")).toBeHidden();
  await expect(page.locator('[data-answer="A"]')).toBeDisabled();
  await page.locator("#load-question").click();
  await expect(page.locator("#app")).toHaveAttribute("data-phase", "question");
  await expect(page.locator("#question-id")).toHaveText("Q02");
  await answer(page);
  await expect(page.locator("#feedback")).toContainText("正解");
  expect(errors).toEqual([]);
});
