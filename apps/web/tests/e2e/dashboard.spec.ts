import { test, expect } from "@playwright/test";
import { TOTAL_ORDERS, TOTAL_SPENT } from "../fixtures/data";

// Use wide date range to capture all 10 seeded orders
const FROM = "2026-03-01";
const TO = "2026-04-14";

test.describe("Dashboard page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/?from=${FROM}&to=${TO}`);
    await page.waitForLoadState("networkidle");
  });

  test("shows the dashboard heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("shows summary cards with seeded data", async ({ page }) => {
    // Total Spent card shows the exact seeded total
    const totalSpent = `$${TOTAL_SPENT.toFixed(2)}`;
    await expect(page.getByText(totalSpent)).toBeVisible();

    // Orders count card — use first() in case "10" also appears elsewhere
    await expect(page.getByText(String(TOTAL_ORDERS)).first()).toBeVisible();
  });

  test("shows the spending chart section", async ({ page }) => {
    await expect(page.getByText("Spending Over Time")).toBeVisible();
  });

  test("shows the top sellers chart section", async ({ page }) => {
    await expect(page.getByText("Top Sellers")).toBeVisible();
  });

  test("shows the recent orders table with seeded orders", async ({ page }) => {
    await expect(page.getByText("Recent Orders")).toBeVisible();
    // The most recent seeded order has aliOrderId ORDER001
    await expect(page.getByText("ORDER001")).toBeVisible();
  });

  test("orders in the table link to AliExpress", async ({ page }) => {
    const link = page.locator('a[href*="aliexpress.com"]').first();
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", /aliexpress\.com\/p\/order\/detail/);
  });

  test("shows seller names in the recent orders table", async ({ page }) => {
    // GreatStore has 2 orders; use first() to avoid strict-mode violation
    await expect(page.getByText("GreatStore").first()).toBeVisible();
  });

  test("date range filter is visible", async ({ page }) => {
    // DateRangeFilter renders with date inputs
    await expect(page.locator("input[type='date']").first()).toBeVisible();
  });
});
