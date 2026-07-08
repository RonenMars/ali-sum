import { openAuthenticatedContext, ORDERS_URL } from "./auth";
import { runSync } from "./sync";
import { logger } from "./logger";

const args = process.argv.slice(2);
const loginOnly = args.includes("--login-only");
const fullSync = args.includes("--full");

async function main() {
  if (loginOnly) {
    logger.info("Opening browser for manual AliExpress login. Close the window when done.");
    const context = await openAuthenticatedContext({ headless: false });
    const page = context.pages()[0] ?? (await context.newPage());
    if (page.url() === "about:blank") {
      await page.goto(ORDERS_URL, { waitUntil: "domcontentloaded" });
    }
    await page.waitForEvent("close", { timeout: 0 }).catch(() => {});
    await context.close();
    logger.info("Login window closed.");
    return;
  }

  const headless = process.env.ALI_SUM_HEADED !== "1";
  logger.info({ headless, fullSync }, "Starting scraper-cli run");
  const context = await openAuthenticatedContext({ headless });
  try {
    const page = context.pages()[0] ?? (await context.newPage());
    await runSync(page, { fullSync });
  } finally {
    await context.close();
  }
}

main().catch((err) => {
  logger.error({ err }, "Sync failed");
  process.exitCode = 1;
});
