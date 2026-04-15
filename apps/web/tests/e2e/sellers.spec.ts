import { test, expect } from "@playwright/test";

test.describe("Sellers page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sellers");
    await page.waitForLoadState("networkidle");
  });

  test("shows the Sellers heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Sellers" })).toBeVisible();
  });

  test("shows the top sellers chart section", async ({ page }) => {
    await expect(page.getByText("Top Sellers by Spending")).toBeVisible();
  });

  test("shows the all sellers table", async ({ page }) => {
    await expect(page.getByText("All Sellers")).toBeVisible();
  });

  test("table has correct headers", async ({ page }) => {
    await expect(page.getByRole("columnheader", { name: "Seller" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Orders" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Total Spent" })).toBeVisible();
  });

  test("shows all 5 seeded sellers", async ({ page }) => {
    for (const seller of ["GreatStore", "TechShop", "FancyGoods", "BudgetDeals", "QuickShip"]) {
      await expect(page.getByRole("cell", { name: seller })).toBeVisible();
    }
  });

  test("shows order counts per seller", async ({ page }) => {
    // Each seller has exactly 2 orders in the seed data
    const cells = page.getByRole("cell", { name: "2" });
    await expect(cells.first()).toBeVisible();
  });

  test("shows total spent per seller", async ({ page }) => {
    // GreatStore: $45.99 + $156.00 = $201.99
    await expect(page.getByText("$201.99")).toBeVisible();
  });
});
