import { test as setup } from "@playwright/test";
import path from "path";
import { TEST_USER } from "../fixtures/data";

const authFile = path.join(__dirname, "../.auth/user.json");

setup("authenticate as test user", async ({ page }) => {
  await page.goto("/login");

  await page.fill("#email", TEST_USER.email);
  await page.fill("#password", TEST_USER.password);
  await page.click('button[type="submit"]');

  // Wait for redirect to the dashboard
  await page.waitForURL("/", { timeout: 15_000 });

  // Persist the authenticated session for all other tests
  await page.context().storageState({ path: authFile });
});
