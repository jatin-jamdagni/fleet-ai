import { test, expect } from "@playwright/test";
import { TEST_MANAGER, loginAs } from "./fixtures/auth.js";

test.describe("Team Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_MANAGER);
    await page.goto("/team");
  });

  test("team page loads with stats", async ({ page }) => {
    await expect(page.getByText("TEAM")).toBeVisible();
    await expect(page.getByText("TOTAL")).toBeVisible();
    await expect(page.getByText("MANAGERS")).toBeVisible();
    await expect(page.getByText("DRIVERS")).toBeVisible();
  });

  test("invite modal opens and has fields", async ({ page }) => {
    await page.getByRole("button", { name: /invite/i }).click();

    await expect(page.getByText("INVITE TEAM MEMBER")).toBeVisible();
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByText("DRIVER")).toBeVisible();
    await expect(page.getByText("FLEET_MANAGER")).toBeVisible();
  });

  test("invite a new driver", async ({ page }) => {
    const email = `driver-${Date.now()}@e2e.test`;

    await page.getByRole("button", { name: /invite/i }).click();
    await page.getByLabel(/full name/i).fill("E2E Driver");
    await page.getByLabel(/email/i).fill(email);
    await page.getByRole("button", { name: "DRIVER", exact: true }).click();
    const inviteResponse = page.waitForResponse((res) =>
      res.url().includes("/users/invite") && res.request().method() === "POST"
    );
    await page.getByRole("button", { name: /send invite/i }).click();
    await expect((await inviteResponse).status()).toBe(201);
    await expect(page.getByText(email)).toBeVisible();
  });

  test("existing users appear in table", async ({ page }) => {
    const noRecords = page.getByText("No records found");
    if (await noRecords.isVisible().catch(() => false)) {
      return;
    }
    await expect(page.locator("table tbody tr").first()).toBeVisible();
  });
});
