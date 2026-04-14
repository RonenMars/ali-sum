import path from "path";
import { defineConfig, devices } from "@playwright/test";

const TEST_DB_URL = `file:${path.resolve(__dirname, "test.db")}`;
const AUTH_SECRET = "playwright-test-secret-32chars!!";
const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

// Make the database URL available to globalSetup before the server starts
process.env.TEST_DATABASE_URL = TEST_DB_URL;

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/global-setup.ts",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],

  webServer: {
    command: `npm run dev -- --port ${PORT} --webpack`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL: TEST_DB_URL,
      AUTH_SECRET,
      AUTH_URL: BASE_URL,
      NODE_ENV: "development",
    },
  },
});
