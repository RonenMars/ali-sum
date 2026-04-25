---
name: capacitor-ios-ship
description: >
  Build and ship the Capacitor iOS app at apps/mobile/ to TestFlight (or
  promote to App Store) via local CLI only — no Xcode UI, no Organizer,
  no App Store Connect website clicks. The ship pipeline (preflight →
  install → cap sync → bump build → archive → upload → poll →
  optionally submit) runs as a single command, defaults to TestFlight,
  and can target App Store production via a flag. Apple authentication
  is via App Store Connect API key (.p8) pulled from 1Password CLI. Use
  this skill whenever the user wants to ship the iOS app, upload to
  TestFlight, submit for App Store review, bump the build number, debug
  an `xcodebuild` archive failure, set up signing on a fresh machine,
  or audit the deploy pipeline. Triggers: "ship", "TestFlight",
  "submit to App Store", "archive", "upload to App Store Connect",
  "bump build", "fresh machine setup", "CocoaPods error".
---

# Capacitor iOS Ship (CLI-only)

Every step is non-interactive shell. No Xcode windows, no App Store
Connect website. Apple talks to us via the ASC REST API and `xcodebuild`'s
API-key flags.

## Contents

- [Quick start](#quick-start)
- [Architecture](#architecture)
- [One-time setup](#one-time-setup)
- [The ship pipeline](#the-ship-pipeline)
- [Capacitor gotchas](#capacitor-gotchas)
- [Anti-patterns](#anti-patterns)
- [Troubleshooting](#troubleshooting)
- [Rules](#rules)

## Quick start

```bash
eval "$(op signin)"                                # 1Password CLI (one-time per shell)
cd apps/mobile
../../.claude/skills/capacitor-ios-ship/scripts/ship.sh    # → TestFlight (default)

# Promote a build to App Store review:
../../.claude/skills/capacitor-ios-ship/scripts/ship.sh \
  --target production \
  --release-notes "Fixes login bug" \
  --release-type AFTER_APPROVAL
```

Optional: add an npm alias in `apps/mobile/package.json` so the workflow is one command:

```json
"scripts": {
  "ship": "../../.claude/skills/capacitor-ios-ship/scripts/ship.sh"
}
```

Then: `npm -w apps/mobile run ship`.

The script:

1. **Preflight** — runs every prerequisite check, fails loud if anything is off.
2. **Install deps** — npm at the monorepo root (npm workspaces).
3. **Cap sync** — `npx cap sync ios` to copy `www/` and refresh Pods.
4. **Bump build** — increments `CURRENT_PROJECT_VERSION` in `project.pbxproj` (Apple rejects re-uploads with the same build number).
5. **Bootstrap signing** — pulls ASC API key + Team ID from 1Password, renders `ExportOptions.plist`, writes `.env.signing`.
6. **Archive + upload** — `xcodebuild archive` then `xcodebuild -exportArchive` with `destination=upload`.
7. **Poll** — watches `processingState` until `VALID` (or hard-fails after 30 min).
8. *(production only)* **Submit for review** — App Store Connect REST API.

## Architecture

The skill is a thin spec; the canonical implementation is the `scripts/`
folder beside this file. Run scripts directly from `apps/mobile/`. Each
script is independent and idempotent — `ship.sh` just chains them.

| Script | Role |
|--------|------|
| `ship.sh` | Top-level orchestrator. The only command users typically run. |
| `preflight.sh` | Every prerequisite check, fails loud. Standalone too. |
| `bootstrap-ios-signing.sh` | Pulls API key + Team ID from 1Password, writes `.p8`, renders plist, emits `.env.signing`. |
| `bump-build.sh` | Increments `CURRENT_PROJECT_VERSION` in both Debug and Release configs of `project.pbxproj`. |
| `archive-and-upload.sh` | `xcodebuild archive` + `xcodebuild -exportArchive --destination=upload`. |
| `asc-jwt.sh` | Mints a 19-min ES256 JWT for ASC API requests. |
| `poll-build.sh` | Watches `processingState` with 7 independent kill switches. `--timeout` hard-capped at 1800 s. |
| `submit-for-review.sh` | App Store Connect REST API: resolve app+build → create version → attach build → set `whatsNew` → submit. |
| `ExportOptions.template.plist` | `op inject` template — `team_id` substituted at bootstrap time. |

Working directory contract: every script assumes `pwd` is `apps/mobile/`
and bails loud if `capacitor.config.ts` or `ios/App/App.xcworkspace`
is missing.

## One-time setup

### Apple side (manual, but truly one-time)

1. **Apple Developer Program membership** ($99/yr) — free Personal Team cannot upload to TestFlight.
2. **App Store Connect API key** at App Store Connect → Users and Access → Integrations → App Store Connect API. Role: App Manager (or higher). Download the `.p8` *immediately* (only chance). Record Key ID + Issuer ID.
3. **Register the app** in App Store Connect with bundle ID `com.alisum.app`.
4. **Register the bundle ID** at developer.apple.com → Identifiers (also one-time).

### 1Password (vault of your choice)

Create an item titled **`AppStoreConnect`** (type: API Credential) with these custom fields:

| Field | Value |
|-------|-------|
| `key_id` | ASC API Key ID |
| `issuer_id` | Issuer UUID |
| `team_id` | Apple Developer Team ID (10 chars) — `xcodebuild -showBuildSettings ... \| awk '/DEVELOPMENT_TEAM/ {print $3}'` |
| `auth_key_b64` | base64 of the `.p8`: `base64 -i AuthKey_<KEYID>.p8 \| pbcopy` |

Override the item path with `OP_ITEM=op://<vault>/<item>` if needed. The
default in the bootstrap script is `op://MyDevSecrets/AppStoreConnect`.

### Project side

The repo's `apps/mobile/.gitignore` already excludes `ios/App/Pods/` and
Xcode user data. Add these for the ship pipeline:

```
build/
.env.signing
*.p8
```

The template plist references `op://MyDevSecrets/AppStoreConnect/team_id`
— edit if your vault is named differently.

### Without 1Password

If you don't use 1Password, replace the four `op read ...` calls in
`bootstrap-ios-signing.sh` with environment variables (`ASC_KEY_ID`,
`ASC_ISSUER_ID`, `ASC_TEAM_ID`, `ASC_KEY_PATH`) and substitute
`team_id` in `ExportOptions.template.plist` manually. The remaining
scripts only need `.env.signing` to be sourced — they don't care where
it came from.

## The ship pipeline

Each script is independent. You can run any step alone:

```bash
cd apps/mobile
SKILL=../../.claude/skills/capacitor-ios-ship/scripts

$SKILL/preflight.sh                                    # any time
$SKILL/bump-build.sh                                   # CURRENT_PROJECT_VERSION += 1
$SKILL/bump-build.sh --marketing 0.2.0                 # also set MARKETING_VERSION
$SKILL/bootstrap-ios-signing.sh                        # refresh secrets
source .env.signing
$SKILL/archive-and-upload.sh                           # archive + upload only
$SKILL/poll-build.sh com.alisum.app --watch            # watch processing
$SKILL/submit-for-review.sh com.alisum.app 0.2.0 \
  --release-notes "..." --release-type AFTER_APPROVAL  # promote to App Store
```

## Capacitor gotchas

These are mobile-specific and easy to miss:

- **`server.url` in `capacitor.config.ts` is what ships.** If it points at a Vercel preview URL, that preview will be the production app's content. Verify it's the prod URL before archiving.
- **Run `npx cap sync ios` before any archive.** The www/ contents and Pods get out of date the moment the web app or `package.json` changes. `ship.sh` does this automatically.
- **`MARKETING_VERSION` and `CURRENT_PROJECT_VERSION` live in `project.pbxproj`**, not `Info.plist`. Info.plist references them via `$(MARKETING_VERSION)` / `$(CURRENT_PROJECT_VERSION)`.
- **Build number must monotonically increase per (bundle id, marketing version)**. `bump-build.sh` enforces this; do not skip it on re-uploads.
- **Privacy manifest at the App target level is required**. Apple's submission validator complains if `ios/App/App/PrivacyInfo.xcprivacy` is missing or not added to the App target's Resources phase. Capacitor framework ships its own; the app needs its own too.
- **Apple Development vs Distribution signing** — the local archive can be Apple-Development-signed and still upload fine: `xcodebuild -exportArchive` with `signingStyle=automatic` + API-key auth re-signs for Distribution at export time.
- **dSYM warnings for Capacitor framework dSYMs** during upload are non-blocking. Apple accepts the build; only crashes inside the framework won't symbolicate.
- **Paths with spaces break `xcodebuild`** — keep the project under a space-free path on disk.

## Anti-patterns

Refuse or warn against:

- ❌ "Open Xcode and click Archive" — use `xcodebuild archive`.
- ❌ "Upload via Transporter" / "Distribute App in Organizer" — use `xcodebuild -exportArchive` with `destination=upload`.
- ❌ "Sign in with Apple ID" — use API key (`.p8`) + `-allowProvisioningUpdates`.
- ❌ Committing `.env.signing`, `build/`, or `*.p8`. The `.gitignore` covers all three.
- ❌ Pinning Xcode betas (signing breaks unpredictably). Stick to GM unless the user explicitly requested a beta.
- ❌ Manually editing `CURRENT_PROJECT_VERSION` in `project.pbxproj`. Use `bump-build.sh` so both Debug and Release configs stay in sync.
- ❌ Storing `.p8` in plaintext outside Keychain / 1Password. The bootstrap script materializes it with `umask 077` and `chmod 600` for a reason.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `account is not signed in` from `op` | New shell, no session | `eval "$(op signin)"` (interactive) — or set `OP_SERVICE_ACCOUNT_TOKEN` |
| Bootstrap dies on PEM sanity check | `.p8` field stripped of newlines (single-line text field) | Re-encode: `base64 -i AuthKey_*.p8` and store in `auth_key_b64` |
| Archive OK, export fails: `Error Downloading App Information` | App not registered in App Store Connect for this bundle id | Register bundle id at developer.apple.com → Identifiers, then create the app at appstoreconnect.apple.com → My Apps → `+`. One-time UI step (no public API for first-time bundle id registration). |
| Archive succeeds, upload rejected: "Invalid Bundle Structure" | Stale Pods after `package.json` change | `npx cap sync ios` then re-archive |
| `processingState=INVALID` | App Store Connect rejected the binary | `curl …/v1/builds/<id>` for reason; common: missing privacy manifest, deprecated APIs |
| `Build number must be greater than X` | Forgot to bump | `bump-build.sh` then re-archive |
| `xcodebuild` hangs at signing | Distribution profile missing | Pass `-allowProvisioningUpdates` + the API-key flags (the scripts already do this) |
| `CocoaPods out of sync` warning | Lockfile drift | `cd ios/App && pod install --repo-update` |
| WebView shows wrong URL after install | `capacitor.config.ts` `server.url` points at preview | Edit `capacitor.config.ts`, run `npx cap sync ios`, re-archive |

## Rules

- **Every command must be non-interactive CLI.** Never instruct the user to open Xcode, the Organizer, or the App Store Connect website. If a step seems to require UI today, document the App Store Connect REST API call instead.
- **Default target is TestFlight.** Production submission is opt-in via `--target production`.
- **Apple auth is API key (`.p8`) only.** No Apple ID prompts. Always pass `-allowProvisioningUpdates` + `-authenticationKey*` flags to `xcodebuild`.
- **Secrets live in 1Password** (or env vars for CI), materialized at bootstrap. The scripts use `umask 077` + `chmod 600` for the `.p8`. Never inline secrets in markdown, scripts, or commits.
- **`cap sync ios` runs before every archive** unless the user explicitly skips it. It's cheap and idempotent.
- **The script files are canonical.** This document is a spec; `scripts/*` is the implementation. Don't paraphrase script contents inline — link instead.
