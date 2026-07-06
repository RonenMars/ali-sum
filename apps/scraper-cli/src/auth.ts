import { chromium, BrowserContext } from "playwright";
import { PROFILE_DIR, ALI_USERNAME, ALI_PASSWORD, ensureDataDir } from "./config";

export const ORDERS_URL = "https://www.aliexpress.com/p/order/index.html";
const LOGIN_URL = "https://login.aliexpress.com/";

async function isLoggedIn(context: BrowserContext): Promise<boolean> {
  const page = await context.newPage();
  try {
    await page.goto(ORDERS_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    // Login redirects back to a login.aliexpress.com URL when the session is missing/expired.
    return !page.url().includes("login.aliexpress.com");
  } finally {
    await page.close();
  }
}

async function autoLogin(context: BrowserContext): Promise<void> {
  if (!ALI_USERNAME || !ALI_PASSWORD) {
    throw new Error(
      "Not logged in and no stored AliExpress session was found. Either:\n" +
        "  1. Run `npm run login` once and sign in manually in the browser window that opens, or\n" +
        "  2. Set ALI_SUM_ALIEXPRESS_USERNAME / ALI_SUM_ALIEXPRESS_PASSWORD for automatic login " +
        "(fragile — AliExpress may still require solving a CAPTCHA or device verification).",
    );
  }

  const page = await context.newPage();
  try {
    await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded" });
    await page.fill("input[name='loginId']", ALI_USERNAME);
    await page.fill("input[name='password']", ALI_PASSWORD);
    await page.click("button[type='submit']");
    await page.waitForURL((url) => !url.toString().includes("login.aliexpress.com"), { timeout: 60000 });
  } finally {
    await page.close();
  }
}

export async function openAuthenticatedContext(options: { headless: boolean }): Promise<BrowserContext> {
  ensureDataDir();
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: options.headless,
    viewport: { width: 1280, height: 900 },
  });

  if (!(await isLoggedIn(context))) {
    if (options.headless) {
      await context.close();
      throw new Error(
        "Not logged into AliExpress in the persistent profile. Run `npm run login` (headed) once first, " +
          "or set ALI_SUM_ALIEXPRESS_USERNAME/PASSWORD to allow headless auto-login.",
      );
    }
    await autoLogin(context);
  }

  return context;
}
