import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  timeout: 30000,
  workers: 2,
  fullyParallel: false,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.TEST_BASE_URL ?? "http://127.0.0.1:4173/mirebawakaru/",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    {
      name: "webkit",
      use: {
        browserName: "webkit",
        launchOptions: process.env.WEBKIT_EXECUTABLE_PATH
          ? { executablePath: process.env.WEBKIT_EXECUTABLE_PATH }
          : undefined,
      },
    },
  ],
  webServer: process.env.TEST_BASE_URL
    ? undefined
    : {
        command: "node scripts/serve.mjs --port 4173 --prefix /mirebawakaru/",
        url: "http://127.0.0.1:4173/mirebawakaru/",
        reuseExistingServer: !process.env.CI,
      },
});
