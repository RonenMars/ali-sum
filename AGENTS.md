# ali-sum repository guidance

## Commands

- Web app: `npm -w apps/web run dev`, `npm -w apps/web run build`, and `npm -w apps/web run test:e2e`
- Extension: `npm -w apps/extension run build` and `npm -w apps/extension run watch`
- Scraper CLI: `npm -w apps/scraper-cli run login`, `sync`, `sync:headed`, and `sync:full`

## Scraper CLI

- The CLI is cross-platform; use `docs/scraper-cli-windows.md` for Windows setup and Task Scheduler.
- `ALI_SUM_API_BASE` defaults to `http://localhost:3000`; set it explicitly for a remote deployment.
- Never commit `apps/scraper-cli/.data/`: it contains the persistent AliExpress session and API token.
- Prefer incremental `sync`; use `sync:full` only for an intentional historical re-scan.

## Documentation

When changing scraper setup or scheduling, update the root README, `CLAUDE.md`, the scraper CLI README, and the platform-specific guide when applicable.
