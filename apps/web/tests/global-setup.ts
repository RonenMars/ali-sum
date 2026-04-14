import path from "path";
import { execSync } from "child_process";

export default function globalSetup() {
  const dbUrl = process.env.TEST_DATABASE_URL!;
  const webDir = path.resolve(__dirname, "..");

  const env = { ...process.env, TEST_DATABASE_URL: dbUrl };
  const opts = { cwd: webDir, stdio: "inherit" as const, env };

  // 1. Push the SQLite schema (creates tables if they don't exist)
  execSync(
    "npx prisma db push --config=prisma.config.test.ts --accept-data-loss",
    opts
  );

  // 2. Seed test data — run in its own process so that the Prisma-generated
  //    ESM client (which uses import.meta.url) is loaded by tsx/Node natively
  //    rather than through Playwright's CJS compiler.
  execSync("npx tsx tests/seed.ts", opts);
}
