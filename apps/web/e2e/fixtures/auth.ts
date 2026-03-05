import { type Page } from "@playwright/test";

export const TEST_MANAGER = {
  email:    "manager@demo.fleet",
  password: "Manager123!",
  name:     "Demo Manager",
};

export const TEST_DRIVER = {
  email:    "driver@demo.fleet",
  password: "Driver123!",
  name:     "Demo Driver",
};

export async function loginAs(
  page: Page,
  user: { email: string; password: string }
) {
  await page.goto("/login");
  await page.getByPlaceholder("manager@fleet.company").fill(user.email);
  await page.getByPlaceholder("••••••••").fill(user.password);
  const loginResponse = page.waitForResponse((res) =>
    res.url().includes("/auth/login") && res.request().method() === "POST"
  );
  await page.getByRole("button", { name: /sign in/i }).click();
  if (!(await loginResponse).ok()) {
    throw new Error(`E2E login failed for ${user.email}`);
  }
  await page.waitForURL("/");
}

export async function logout(page: Page) {
  await page.getByText("→ LOGOUT").click();
  await page.waitForURL("/login");
}
