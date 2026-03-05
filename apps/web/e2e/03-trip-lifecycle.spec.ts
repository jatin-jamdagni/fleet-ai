import { test, expect } from "@playwright/test";
import { TEST_MANAGER, loginAs } from "./fixtures/auth.js";

test.describe("Trip Lifecycle", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_MANAGER);
    await page.goto("/trips");
    await expect(page).toHaveURL("/trips");
  });

  test("manager sees active trips page", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "TRIPS" })).toBeVisible();
    await expect(page.getByText("ALL")).toBeVisible();
    await expect(page.getByText("ACTIVE")).toBeVisible();
    await expect(page.getByText("COMPLETED")).toBeVisible();
    await expect(page.getByText("FORCE_ENDED")).toBeVisible();
  });

  test("filter shows only active trips", async ({ page }) => {
    const filteredResponse = page.waitForResponse((res) => {
      if (!res.url().includes("/trips/all") || res.request().method() !== "GET") {
        return false;
      }
      return new URL(res.url()).searchParams.get("status") === "ACTIVE";
    });
    await page.getByText("ACTIVE").click();
    await expect((await filteredResponse).status()).toBe(200);

    const noRecords = page.getByText("No records found");
    if (await noRecords.isVisible().catch(() => false)) {
      return;
    }

    await expect(page.locator("tbody").getByText("ACTIVE").first()).toBeVisible();
    await expect(page.locator("tbody").getByText("COMPLETED")).toHaveCount(0);
    await expect(page.locator("tbody").getByText("FORCE_ENDED")).toHaveCount(0);
  });

  test("force-end an active trip", async ({ page }) => {
    await page.getByText("ACTIVE").click();
    const forceEndBtn = page.locator("text=FORCE END").first();
    if (await forceEndBtn.count() === 0) {
      test.skip();
      return;
    }

    const forceEndResponse = page.waitForResponse((res) =>
      res.url().includes("/force-end") && res.request().method() === "POST"
    );
    page.once("dialog", (dialog) => dialog.accept());
    await forceEndBtn.click();
    await expect((await forceEndResponse).status()).toBe(200);
  });

  test("completed trip shows invoice amount", async ({ page }) => {
    const filteredResponse = page.waitForResponse((res) => {
      if (!res.url().includes("/trips/all") || res.request().method() !== "GET") {
        return false;
      }
      return new URL(res.url()).searchParams.get("status") === "COMPLETED";
    });
    await page.getByText("COMPLETED").click();
    await expect((await filteredResponse).status()).toBe(200);
    await expect(page.getByText("INVOICE")).toBeVisible();

    const noRecords = page.getByText("No records found");
    if (await noRecords.isVisible().catch(() => false)) {
      return;
    }

    await expect(page.locator("tbody tr").first()).toBeVisible();
  });
});
