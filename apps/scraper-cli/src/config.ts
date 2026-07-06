import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", ".data");

export const PROFILE_DIR = join(DATA_DIR, "chrome-profile");
const TOKEN_FILE = join(DATA_DIR, "token");

export const API_BASE = process.env.ALI_SUM_API_BASE || "http://localhost:3000";

// AliExpress credentials for optional auto-login. Unset by default — the
// recommended flow is a one-time manual login into the persistent profile
// (see auth.ts). Auto-login is a fallback for headless-only environments and
// is more fragile (CAPTCHA/2FA can block it same as manual login would).
export const ALI_USERNAME = process.env.ALI_SUM_ALIEXPRESS_USERNAME || "";
export const ALI_PASSWORD = process.env.ALI_SUM_ALIEXPRESS_PASSWORD || "";

export function getToken(): string {
  const envToken = process.env.ALI_SUM_TOKEN;
  if (envToken) return envToken;

  if (existsSync(TOKEN_FILE)) {
    return readFileSync(TOKEN_FILE, "utf8").trim();
  }

  throw new Error(
    "No API token found. Set ALI_SUM_TOKEN, or generate a token from the web app " +
      "(Settings > Extension Token, same token the browser extension uses) and save it with:\n" +
      `  mkdir -p ${DATA_DIR} && echo '<token>' > ${TOKEN_FILE}`,
  );
}

export function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

export function saveToken(token: string): void {
  ensureDataDir();
  writeFileSync(TOKEN_FILE, token.trim(), "utf8");
}
