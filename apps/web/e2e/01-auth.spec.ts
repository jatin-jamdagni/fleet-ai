import { test, expect } from "@playwright/test";
import { loginAs, TEST_MANAGER } from "./fixtures/auth.js";


test.describe("Authentication", () => {

  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login"); 
    await expect(page.getByText("FLEET AI")).toBeVisible();
    await expect(page.getByText("DRIVER CONSOLE")).not.toBeVisible(); // web, not mobile
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("redirect to login when not authenticated", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/login");
  });

  test("redirect to login when accessing any protected route", async ({ page }) => {
    for (const route of ["/vehicles", "/trips", "/invoices", "/team", "/analytics"]) {
      await page.goto(route);
      await expect(page).toHaveURL("/login");
    }
  });

  test("login with valid manager credentials", async ({ page }) => {
    await loginAs(page, TEST_MANAGER);
    await expect(page).toHaveURL("/");
    await expect(page.getByText("FLEET OVERVIEW")).toBeVisible();
  });

  test("login shows error on wrong password", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("manager@fleet.company").fill(TEST_MANAGER.email);
    await page.getByPlaceholder("••••••••").fill("wrongpassword");
    const loginResponse = page.waitForResponse((res) =>
      res.url().includes("/auth/login") && res.request().method() === "POST"
    );
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect((await loginResponse).status()).toBe(401);
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/");
    await expect(page).toHaveURL("/login");
  });

  test("login shows error on unknown email", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("manager@fleet.company").fill("nobody@nowhere.com");
    await page.getByPlaceholder("••••••••").fill("somepassword");
    const loginResponse = page.waitForResponse((res) =>
      res.url().includes("/auth/login") && res.request().method() === "POST"
    );
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect((await loginResponse).status()).toBe(401);
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/");
    await expect(page).toHaveURL("/login");
  });

  test("logout clears session and redirects to login", async ({ page }) => {
    await loginAs(page, TEST_MANAGER);
    await page.getByRole("button", { name: /logout/i }).click();
    await expect(page).toHaveURL("/login");

    // Going back to dashboard should redirect to login
    await page.goto("/");
    await expect(page).toHaveURL("/login");
  });

  test("register page creates new organisation", async ({ page }) => {
    await page.goto("/register");

    const slug = `e2e-${Date.now()}`;
    await page.getByLabel(/organisation name/i).fill("E2E Test Org");
    await page.getByLabel(/organisation slug/i).fill(slug);
    await page.getByLabel(/your full name/i).fill("E2E Manager");
    await page.getByLabel(/email address/i).fill(`manager@${slug}.test`);
    await page.getByLabel(/password/i).fill("SecurePass123!");

    await page.getByRole("button", { name: /create organisation/i }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByText("FLEET OVERVIEW")).toBeVisible();
  });
});
