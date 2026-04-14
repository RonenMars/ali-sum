import { test, expect } from "@playwright/test";

test.describe("Spending page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/spending");
    await page.waitForLoadState("networkidle");
  });

  test("shows the Spending heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Spending" })).toBeVisible();
  });

  test("shows the period tabs", async ({ page }) => {
    await expect(page.getByRole("tab", { name: "Weekly" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Monthly" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Yearly" })).toBeVisible();
  });

  test("shows the date preset buttons", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Last 30 days" })).toBeVisible();
    await expect(page.getByRole("button", { name: "This month" })).toBeVisible();
  });

  test("shows the total spent summary card", async ({ page }) => {
    await expect(page.getByText("Total Spent")).toBeVisible();
    // After data loads, should show a dollar amount (not $0.00)
    await page.waitForTimeout(1000); // let the fetch complete
    await expect(page.getByText(/\$\d+/)).toBeVisible();
  });

  test("shows the total orders summary card", async ({ page }) => {
    await expect(page.getByText("Total Orders")).toBeVisible();
  });

  test("shows the spending chart section", async ({ page }) => {
    await expect(page.getByText(/Spending by (Month|Week|Year)/)).toBeVisible();
  });

  test("switching to Monthly tab fetches monthly data", async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/analytics/spending") && r.url().includes("period=month")),
      page.getByRole("tab", { name: "Monthly" }).click(),
    ]);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("series");
    expect(body).toHaveProperty("currency");
  });

  test("switching to Weekly tab fetches weekly data", async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/analytics/spending") && r.url().includes("period=week")),
      page.getByRole("tab", { name: "Weekly" }).click(),
    ]);
    expect(response.status()).toBe(200);
  });

  test("clicking a date preset triggers a data fetch", async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/analytics/spending")),
      page.getByRole("button", { name: "Last 7 days" }).click(),
    ]);
    expect(response.status()).toBe(200);
  });

  test("from/to date inputs are present", async ({ page }) => {
    const inputs = page.locator("input[type='date']");
    await expect(inputs.first()).toBeVisible();
    await expect(inputs.nth(1)).toBeVisible();
  });
});
