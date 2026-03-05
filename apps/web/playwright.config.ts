import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir:   "./e2e",
  fullyParallel: false,  // run serially to avoid DB state conflicts
  forbidOnly: !!process.env.CI,
  retries:    process.env.CI ? 2 : 0,
  workers:    1,
  reporter:   process.env.CI ? "github" : "html",

  use: {
    baseURL:     process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173",
    trace:       "on-first-retry",
    screenshot:  "only-on-failure",
    video:       "retain-on-failure",
    headless:    true,
  },

  projects: [
    {
      name:   "chromium",
      use:    { ...devices["Desktop Chrome"] },
    },
  ],

  // Start dev server before tests
  webServer: process.env.CI
    ? undefined
    : {
        command:       "bun dev",
        url:           "http://localhost:5173",
        reuseExistingServer: true,
        timeout:       30_000,
      },
});