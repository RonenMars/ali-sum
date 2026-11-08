import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { openAuthenticatedContext, ORDERS_URL } from "./auth";
import { ensureDataDir, PROFILE_DIR } from "./config";
import { createPlaywrightAdapter } from "./adapters/playwright-adapter";
import { detectCaptcha } from "../../extension/content/scraper-core";

const SELECTORS = [
  ".order-item",
  "[class*='order-item']",
  "[class*='OrderItem']",
  "[class*='order-list']",
  "[class*='OrderList']",
  "a[href*='order']",
  "#root",
  "iframe",
  "#baxia-dialog-content",
  ".baxia-dialog",
  "#nc_1_wrapper",
  ".nc-container",
  "input[name='loginId']",
  "[class*='login']",
];

async function main() {
  ensureDataDir();
  const headless = process.env.ALI_SUM_HEADED !== "1";
  const outDir = join(PROFILE_DIR, "..");
  console.log(JSON.stringify({ headless, ORDERS_URL, outDir }, null, 2));

  const context = await openAuthenticatedContext({ headless });
  const page = context.pages()[0] ?? (await context.newPage());
  const adapter = createPlaywrightAdapter(page);

  try {
    await page.goto(ORDERS_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
    const found = await adapter.waitForSelector(".order-item", 20000);
    // Extra settle time for SPA / lazy render
    await page.waitForTimeout(5000);

    const counts: Record<string, number> = {};
    for (const sel of SELECTORS) {
      counts[sel] = await page.locator(sel).count().catch(() => -1);
    }

    const bodyText = (await page.locator("body").innerText().catch(() => "")).slice(0, 2500);
    const html = await page.content();
    const captcha = await detectCaptcha(adapter);

    const classHits = await page.evaluate(() => {
      const classes = new Set<string>();
      for (const el of Array.from(document.querySelectorAll("[class]")).slice(0, 5000)) {
        for (const c of el.className.toString().split(/\s+/)) {
          if (/order/i.test(c)) classes.add(c);
        }
      }
      return Array.from(classes).sort().slice(0, 80);
    });

    const report = {
      finalUrl: page.url(),
      title: await page.title(),
      waitForOrderItem: found,
      captcha,
      counts,
      orderRelatedClasses: classHits,
      bodyTextPreview: bodyText,
    };

    const reportPath = join(outDir, "diagnose-report.json");
    const htmlPath = join(outDir, "diagnose-page.html");
    const shotPath = join(outDir, "diagnose-page.png");

    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    writeFileSync(htmlPath, html);
    await page.screenshot({ path: shotPath, fullPage: true });

    console.log(JSON.stringify(report, null, 2));
    console.log(`Wrote ${reportPath}`);
    console.log(`Wrote ${htmlPath} (${html.length} bytes)`);
    console.log(`Wrote ${shotPath}`);
  } finally {
    await context.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
