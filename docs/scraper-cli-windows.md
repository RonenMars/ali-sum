# Running the scraper CLI on Windows

`apps/scraper-cli` works on Windows. It uses Node.js, Playwright's Chromium,
and a profile stored in the repository, so it does not depend on the Chrome
extension or on macOS tooling.

## Prerequisites

- A supported Node.js version and the repository dependencies (`npm install`)
- An ali-sum API token from **Settings → Extension Token**
- An AliExpress account that can sign in interactively once

Install Playwright's Chromium from the repository root:

```powershell
npx playwright install chromium
```

## One-time setup

Set the production API base for the current PowerShell session:

```powershell
$env:ALI_SUM_API_BASE = "https://ali-sum.vercel.app"
```

Save the API token without committing it:

```powershell
New-Item -ItemType Directory -Force -Path apps/scraper-cli/.data
[System.IO.File]::WriteAllText(
  "apps/scraper-cli/.data/token",
  "<your-extension-token>",
  [System.Text.UTF8Encoding]::new($false)
)
```

Open the persistent Playwright browser profile and sign in to AliExpress:

```powershell
npm -w apps/scraper-cli run login
```

Close that browser only after the login succeeds. The session is retained in
`apps/scraper-cli/.data/chrome-profile` for later headless runs.

## Run

Run an incremental sync headlessly:

```powershell
$env:ALI_SUM_API_BASE = "https://ali-sum.vercel.app"
npm -w apps/scraper-cli run sync
```

Use a visible browser while investigating a login challenge or CAPTCHA:

```powershell
$env:ALI_SUM_API_BASE = "https://ali-sum.vercel.app"
npm -w apps/scraper-cli run sync:headed
```

Use `sync:full` only when a complete historical re-scan is intentional.
Normal runs use the server-side terminal-order watermark and stop when they
reach already-closed history.

## Schedule with Task Scheduler

Create a Task Scheduler task that runs while the Windows user session is
logged in. Configure its action as:

```text
Program/script: powershell.exe
Arguments: -NoProfile -Command "$env:ALI_SUM_API_BASE='https://ali-sum.vercel.app'; & 'C:\\Program Files\\nodejs\\npm.cmd' -w apps/scraper-cli run sync"
Start in: C:\\path\\to\\ali-sum
```

Keep the token in `.data/token`, or make `ALI_SUM_TOKEN` available to the task
through a secure local mechanism. The local profile and token are credentials:
do not commit or copy them between machines.
