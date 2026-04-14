import { test, expect } from "@playwright/test";

// Auth tests don't use the saved session — they test the login/register UI directly
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Login page", () => {
  test("shows the sign-in form", async ({ page }) => {
    await page.goto("/login");
    // CardTitle renders as a <div data-slot="card-title">, not an <h*>
    await expect(page.locator("[data-slot='card-title']").getByText("ali-sum")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });

  test("redirects to dashboard on valid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", "test@playwright.dev");
    await page.fill("#password", "Test1234!");
    await page.click('button[type="submit"]');
    await page.waitForURL("/", { timeout: 15_000 });
    await expect(page).toHaveURL("/");
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", "test@playwright.dev");
    await page.fill("#password", "wrongpassword");
    await page.click('button[type="submit"]');
    // Wait for the async sign-in call to resolve and show the error
    await expect(page.getByText("Invalid email or password")).toBeVisible({ timeout: 10_000 });
  });

  test("has a link to the register page", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Sign up" }).click();
    // Allow extra time for Next.js dev compilation of /register on first access
    await expect(page).toHaveURL("/register", { timeout: 30_000 });
  });
});

test.describe("Register page", () => {
  test("shows the registration form", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator("[data-slot='card-title']").getByText("ali-sum")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create Account" })).toBeVisible();
  });

  test("creates an account and auto-signs in", async ({ page }) => {
    await page.goto("/register");
    // Wait for React to have hydrated the email input — React attaches __reactFiber
    // keys to DOM elements after hydration. Without this, page.fill() sets the DOM
    // value but React's state stays empty, causing a traditional form submission.
    await page.waitForFunction(() => {
      const el = document.querySelector("#email");
      return el !== null && Object.keys(el).some((k) => k.startsWith("__react"));
    });
    await page.fill("#name", "New User");
    await page.fill("#email", "newuser@playwright.dev");
    await page.fill("#password", "NewPass123!");
    await page.click('button[type="submit"]');
    // Verify the dashboard renders (confirms auto sign-in worked)
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 20_000 });
  });

  test("shows error for duplicate email", async ({ page }) => {
    await page.goto("/register");
    await page.fill("#email", "test@playwright.dev"); // already seeded
    await page.fill("#password", "AnyPass123!");
    await page.click('button[type="submit"]');
    await expect(page.getByText(/email.*already/i).or(page.getByText(/already.*use/i))).toBeVisible({ timeout: 5_000 });
  });

  test("has a link back to the login page", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/login");
  });
});

test.describe("Auth guard", () => {
  test("redirects unauthenticated users to /login", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
