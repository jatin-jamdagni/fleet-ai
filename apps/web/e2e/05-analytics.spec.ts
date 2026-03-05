import { test, expect } from "@playwright/test";
import { TEST_MANAGER, loginAs } from "./fixtures/auth.js";

test.describe("Analytics Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_MANAGER);
    await page.goto("/analytics");
  });

  test("analytics page loads with KPI stats", async ({ page }) => {
    await expect(page.getByText("ANALYTICS")).toBeVisible();
    await expect(page.getByText("TRIPS THIS MONTH")).toBeVisible();
    await expect(page.getByText("DISTANCE THIS MONTH")).toBeVisible();
    await expect(page.getByText("REVENUE THIS MONTH")).toBeVisible();
    await expect(page.getByText("AVG TRIP DISTANCE")).toBeVisible();
  });

  test("range picker switches correctly", async ({ page }) => {
    const ranges = ["7D", "30D", "90D", "12M"];

    for (const r of ranges) {
      await page.getByRole("button", { name: r, exact: true }).click();
      await expect(page.getByText("ANALYTICS")).toBeVisible();
    }
  });

  test("revenue chart section is present", async ({ page }) => {
    await expect(page.getByText("Revenue")).toBeVisible();
    await expect(page.getByText("Paid Invoice Revenue Over Time")).toBeVisible();
  });

  test("distance chart section is present", async ({ page }) => {
    await expect(page.getByText("Distance")).toBeVisible();
    await expect(page.getByText("Kilometres Driven Over Time")).toBeVisible();
  });

  test("driver leaderboard section is present", async ({ page }) => {
    await expect(page.getByText("Leaderboard by Distance")).toBeVisible();
    // Header columns
    await expect(page.getByText("DRIVER")).toBeVisible();
    await expect(page.getByText("REVENUE")).toBeVisible();
  });

  test("vehicle utilization section is present", async ({ page }) => {
    await expect(page.getByText("Utilization & Efficiency")).toBeVisible();
    await expect(page.getByText("EFFICIENCY")).toBeVisible();
  });

  test("CSV download button is present", async ({ page }) => {
    await expect(page.getByRole("button", { name: /csv/i })).toBeVisible();
  });

  test("CSV export endpoint responds", async ({ page }) => {
    const csvResponse = page.waitForResponse((res) =>
      res.url().includes("/analytics/export/trips.csv") && res.request().method() === "GET"
    );
    await page.getByRole("button", { name: /csv/i }).click();
    const response = await csvResponse;
    await expect(response.status()).toBe(200);
  });
});
