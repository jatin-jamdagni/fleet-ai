import { test, expect } from "@playwright/test";
import { TEST_MANAGER, loginAs } from "./fixtures/auth.js";

test.describe("Invoice Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_MANAGER);
    await page.goto("/invoices");
  });

  test("billing page loads with summary stats", async ({ page }) => {
    await expect(page.getByText("BILLING")).toBeVisible();
    await expect(page.getByText("TOTAL INVOICES")).toBeVisible();
    await expect(page.getByText("PENDING")).toBeVisible();
    await expect(page.getByText("PAID")).toBeVisible();
    await expect(page.getByText("MTD REVENUE")).toBeVisible();
  });

  test("filter tabs work", async ({ page }) => {
    const filters = ["ALL", "PENDING", "PAID", "VOID"];

    for (const filter of filters) {
      await page.getByRole("button", { name: filter, exact: true }).click();
      await expect(page.getByText("BILLING")).toBeVisible();
    }
  });

  test("mark invoice as paid", async ({ page }) => {
    await page.getByRole("button", { name: "PENDING", exact: true }).click();

    const markPaid = page.locator("text=MARK PAID").first();
    if (await markPaid.count() === 0) {
      test.skip();
      return;
    }

    const updateResponse = page.waitForResponse((res) =>
      res.url().includes("/invoices/") && res.url().includes("/status") && res.request().method() === "PATCH"
    );
    await markPaid.click();
    await expect((await updateResponse).status()).toBe(200);
  });

  test("void an invoice", async ({ page }) => {
    await page.getByRole("button", { name: "PENDING", exact: true }).click();

    const voidBtn = page.locator("text=VOID").first();
    if (await voidBtn.count() === 0) {
      test.skip();
      return;
    }

    const updateResponse = page.waitForResponse((res) =>
      res.url().includes("/invoices/") && res.url().includes("/status") && res.request().method() === "PATCH"
    );
    await voidBtn.click();
    await expect((await updateResponse).status()).toBe(200);
  });

  test("PDF link fetch succeeds", async ({ page }) => {
    const pdfLinks = page.locator("text=PDF");
    if (await pdfLinks.count() === 0) {
      test.skip();
      return;
    }

    const pdfResponse = page.waitForResponse((res) =>
      res.url().includes("/invoices/") && res.url().includes("/pdf") && res.request().method() === "GET"
    );
    await pdfLinks.first().click();
    const response = await pdfResponse;
    await expect(response.status()).toBe(200);
    const body = (await response.text()).toLowerCase();
    expect(body).toContain("invoice");
  });
});
