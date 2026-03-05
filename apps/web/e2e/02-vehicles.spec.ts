import { test, expect } from "@playwright/test";
import { TEST_MANAGER, loginAs } from "./fixtures/auth.js";

async function createVehicleFromModal(page: import("@playwright/test").Page, plate: string, make = "Toyota") {
  await page.getByRole("button", { name: /add vehicle/i }).click();
  await expect(page.getByRole("heading", { name: "ADD VEHICLE" })).toBeVisible();
  await page.getByLabel(/license plate/i).fill(plate);
  await page.getByLabel(/make/i).fill(make);
  await page.getByLabel(/model/i).fill("Hilux");
  await page.getByLabel(/year/i).fill("2023");
  await page.getByLabel(/cost/i).fill("2.50");
  const createResponse = page.waitForResponse((res) =>
    res.url().includes("/vehicles") && res.request().method() === "POST"
  );
  await page.getByRole("button", { name: /add vehicle/i }).last().click();
  await expect((await createResponse).status()).toBe(201);
}

test.describe("Vehicle Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_MANAGER);
    await page.goto("/vehicles");
    await expect(page).toHaveURL("/vehicles");
  });

  test("vehicles page loads with stats", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "FLEET" })).toBeVisible();
    await expect(page.getByText("TOTAL")).toBeVisible();
    await expect(page.getByText("ACTIVE")).toBeVisible();
    await expect(page.getByText("IN TRIP")).toBeVisible();
  });

  test("creates a new vehicle", async ({ page }) => {
    const plate = `E2E-${Date.now().toString().slice(-5)}`;
    await createVehicleFromModal(page, plate);
    await expect(page.getByText(plate)).toBeVisible();
  });

  test("vehicle plate is auto-uppercased", async ({ page }) => {
    const rawPlate = `lower-${Date.now().toString().slice(-6)}`;
    await createVehicleFromModal(page, rawPlate, "Ford");
    await expect(page.getByText(rawPlate.toUpperCase())).toBeVisible();
  });

  test("search filters vehicles", async ({ page }) => {
    const plate = `SRCH-${Date.now().toString().slice(-5)}`;
    await createVehicleFromModal(page, plate, "Toyota");
    await page.locator("input[placeholder*='Search']").fill(plate);
    await expect(page.locator("tbody tr", { hasText: plate }).first()).toBeVisible();
  });

  test("deletes a vehicle", async ({ page }) => {
    const plate = `DEL-${Date.now().toString().slice(-5)}`;
    await createVehicleFromModal(page, plate, "Ford");
    const row = page.locator("tbody tr", { hasText: plate }).first();
    await expect(row).toBeVisible();
    const deleteResponse = page.waitForResponse((res) =>
      res.url().includes("/vehicles/") && res.request().method() === "DELETE"
    );
    page.once("dialog", (dialog) => dialog.accept());
    await row.getByText("DELETE").click();
    await expect((await deleteResponse).status()).toBe(200);
    await expect(row).toHaveCount(0);
  });
});
