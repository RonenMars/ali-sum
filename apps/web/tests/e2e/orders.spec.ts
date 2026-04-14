import { test, expect } from "@playwright/test";
import { TOTAL_ORDERS, SEED_ORDERS } from "../fixtures/data";

const FROM = "2026-03-01";
const TO = "2026-04-14";

test.describe("Orders page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/orders?from=${FROM}&to=${TO}`);
    await page.waitForLoadState("networkidle");
  });

  test("shows the Orders heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Orders" })).toBeVisible();
  });

  test("shows total order count", async ({ page }) => {
    await expect(page.getByText(`${TOTAL_ORDERS} orders`)).toBeVisible();
  });

  test("renders the order history table", async ({ page }) => {
    await expect(page.getByText("Order History")).toBeVisible();
    // Table headers
    await expect(page.getByRole("columnheader", { name: "Date" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Seller" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Total" })).toBeVisible();
  });

  test("lists all seeded orders", async ({ page }) => {
    for (const order of SEED_ORDERS) {
      await expect(page.getByText(order.aliOrderId)).toBeVisible();
    }
  });

  test("shows order statuses as badges", async ({ page }) => {
    // "completed" status maps to "Delivered" via getShippingStatus()
    await expect(page.getByText("Delivered").first()).toBeVisible();
  });

  test("order IDs link to AliExpress", async ({ page }) => {
    const link = page.locator('a[href*="aliexpress.com"]').first();
    await expect(link).toHaveAttribute("href", /aliexpress\.com\/p\/order\/detail/);
  });

  test("shows item counts per order", async ({ page }) => {
    // ORDER002 and ORDER008 both have 2 items; first() avoids strict-mode violation
    await expect(page.getByText("2 items").first()).toBeVisible();
  });

  test("shows formatted total amounts", async ({ page }) => {
    // ORDER001 = $45.99
    await expect(page.getByText("$45.99")).toBeVisible();
  });

  test("shows seller names", async ({ page }) => {
    // TechShop has 2 orders; first() avoids strict-mode violation
    await expect(page.getByText("TechShop").first()).toBeVisible();
  });
});
