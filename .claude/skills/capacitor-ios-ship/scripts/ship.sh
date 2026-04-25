#!/usr/bin/env bash
# ship.sh — single-command end-to-end ship pipeline for the Capacitor iOS app.
#
#   preflight → install deps → cap sync → bump build → bootstrap signing →
#   archive → upload → poll until VALID → optionally submit for App Store review.
#
# Default target is TestFlight. No simulator, no UI.
#
# Run from apps/mobile/ (where capacitor.config.ts lives).
#
# Usage:
#   cd apps/mobile
#   ./scripts/ship.sh                                       # → TestFlight
#   ./scripts/ship.sh --target production --release-notes "Fixes..." \
#                     --release-type AFTER_APPROVAL         # → App Store review
#
# Flags:
#   --target testflight|production           default: testflight
#   --release-notes "..."                    en-US whatsNew (production only)
#   --release-type MANUAL|AFTER_APPROVAL|SCHEDULED  default: MANUAL
#   --release-date 2026-04-26T08:00:00-07:00 required for SCHEDULED
#   --skip-preflight                         skip preflight checks
#   --skip-sync                              skip `npx cap sync ios`
#   --skip-bump                              skip CURRENT_PROJECT_VERSION bump
#   --bundle-id <id>                         override the auto-detected bundle id
#
# Exits non-zero on any failure. Re-running is safe (each step is idempotent
# except --skip-bump should be set when re-running after a successful archive).

set -euo pipefail

TARGET="testflight"
RELEASE_NOTES=""
RELEASE_TYPE="MANUAL"
RELEASE_DATE=""
SKIP_PREFLIGHT=0
SKIP_SYNC=0
SKIP_BUMP=0
BUNDLE_ID_OVERRIDE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)         TARGET="$2"; shift 2 ;;
    --release-notes)  RELEASE_NOTES="$2"; shift 2 ;;
    --release-type)   RELEASE_TYPE="$2"; shift 2 ;;
    --release-date)   RELEASE_DATE="$2"; shift 2 ;;
    --skip-preflight) SKIP_PREFLIGHT=1; shift ;;
    --skip-sync)      SKIP_SYNC=1; shift ;;
    --skip-bump)      SKIP_BUMP=1; shift ;;
    --bundle-id)      BUNDLE_ID_OVERRIDE="$2"; shift 2 ;;
    -h|--help) sed -n '1,30p' "$0"; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

case "$TARGET" in testflight|production) ;;
  *) echo "--target must be testflight or production" >&2; exit 2 ;;
esac

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Working-directory contract: must be apps/mobile/
[[ -f capacitor.config.ts || -f capacitor.config.json ]] \
  || { echo "Run from apps/mobile/ (no capacitor.config.* in $(pwd))" >&2; exit 1; }
[[ -d ios/App/App.xcworkspace ]] \
  || { echo "Missing ios/App/App.xcworkspace — run 'npx cap add ios' first." >&2; exit 1; }

# 1. Preflight
if (( SKIP_PREFLIGHT == 0 )); then
  echo "▸ [1/7] Preflight"
  "$SCRIPT_DIR/preflight.sh"
fi

# 2. Install deps (npm workspaces — install from monorepo root)
echo "▸ [2/7] Install dependencies"
( cd ../.. && npm install --silent )

# 3. Cap sync
if (( SKIP_SYNC == 0 )); then
  echo "▸ [3/7] Cap sync iOS"
  npx cap sync ios
fi

# 4. Bump build number
if (( SKIP_BUMP == 0 )); then
  echo "▸ [4/7] Bump build number"
  "$SCRIPT_DIR/bump-build.sh"
fi

# 5. Bootstrap iOS signing from 1Password
echo "▸ [5/7] Bootstrap iOS signing"
"$SCRIPT_DIR/bootstrap-ios-signing.sh"
# shellcheck disable=SC1091
source .env.signing

# 6. Archive + upload
echo "▸ [6/7] Archive and upload"
"$SCRIPT_DIR/archive-and-upload.sh"

# Resolve bundle id from project.pbxproj for polling
BUNDLE_ID="${BUNDLE_ID_OVERRIDE:-$(grep -m1 'PRODUCT_BUNDLE_IDENTIFIER = ' \
  ios/App/App.xcodeproj/project.pbxproj | awk '{print $3}' | tr -d ';')}"
[[ -n "$BUNDLE_ID" ]] || { echo "Could not resolve bundle id" >&2; exit 1; }

# 7. Wait until VALID (or timeout — bounded by poll-build.sh kill switches)
echo "▸ [7/7] Wait for App Store Connect processing"
"$SCRIPT_DIR/poll-build.sh" "$BUNDLE_ID" --watch --timeout 1800 --interval 30

if [[ "$TARGET" == "testflight" ]]; then
  echo
  echo "✅ Build is live on TestFlight."
  exit 0
fi

# Production: submit for App Store review
echo "▸ Submit for App Store review"
VERSION=$(grep -m1 'MARKETING_VERSION = ' \
  ios/App/App.xcodeproj/project.pbxproj | awk '{print $3}' | tr -d ';')
[[ -n "$VERSION" ]] || { echo "Could not resolve MARKETING_VERSION" >&2; exit 1; }

ARGS=("$BUNDLE_ID" "$VERSION" --release-type "$RELEASE_TYPE")
[[ -n "$RELEASE_NOTES" ]] && ARGS+=(--release-notes "$RELEASE_NOTES")
[[ -n "$RELEASE_DATE"  ]] && ARGS+=(--release-date  "$RELEASE_DATE")
"$SCRIPT_DIR/submit-for-review.sh" "${ARGS[@]}"

echo
echo "✅ Submitted $VERSION for App Store review (releaseType=$RELEASE_TYPE)."
