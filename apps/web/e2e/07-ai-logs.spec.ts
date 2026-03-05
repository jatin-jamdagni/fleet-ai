import { test, expect } from "@playwright/test";
import { TEST_MANAGER, loginAs } from "./fixtures/auth.js";

test.describe("AI Logs", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_MANAGER);
    await page.goto("/ai");
  });

  test("AI logs page renders health status", async ({ page }) => {
    const healthResponse = page.waitForResponse((res) =>
      res.url().includes("/ai/health") && res.request().method() === "GET"
    );
    await expect(page.getByText("AI ASSISTANT")).toBeVisible();
    await expect((await healthResponse).status()).toBe(200);
    await expect(page.getByText("ENGINE")).toBeVisible();
  });

  test("shows query count in header", async ({ page }) => {
    await expect(page.locator("p").filter({ hasText: /queries/i })).toBeVisible();
  });

  test("table headers are correct", async ({ page }) => {
    await expect(page.getByText("TIME")).toBeVisible();
    await expect(page.getByText("DRIVER")).toBeVisible();
    await expect(page.getByText("QUESTION")).toBeVisible();
    await expect(page.getByText("LATENCY")).toBeVisible();
  });
});
