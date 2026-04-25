#!/usr/bin/env bash
# bump-build.sh — increment CURRENT_PROJECT_VERSION in project.pbxproj.
# Optionally also set MARKETING_VERSION via --marketing X.Y.Z.
#
# Apple rejects re-uploads of an existing (bundle id, marketing version,
# build number) tuple, so the build number must monotonically increase.
#
# Run from apps/mobile/. Edits both Debug and Release configs in lockstep.
#
# Usage:
#   ./scripts/bump-build.sh                     # build += 1
#   ./scripts/bump-build.sh --marketing 0.2.0   # build += 1 AND marketing → 0.2.0

set -euo pipefail

PBX="ios/App/App.xcodeproj/project.pbxproj"
[[ -f "$PBX" ]] || { echo "Not at apps/mobile/ — $PBX missing" >&2; exit 1; }

NEW_MARKETING=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --marketing) NEW_MARKETING="$2"; shift 2 ;;
    -h|--help) sed -n '1,15p' "$0"; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

# Read current build number from the first occurrence (Debug == Release in our project)
CUR=$(grep -m1 'CURRENT_PROJECT_VERSION = ' "$PBX" | awk '{print $3}' | tr -d ';')
[[ "$CUR" =~ ^[0-9]+$ ]] || { echo "Unexpected CURRENT_PROJECT_VERSION: $CUR" >&2; exit 1; }
NEXT=$((CUR + 1))

# Verify both configs are in sync before bumping (fail loud if drifted)
SYNC_COUNT=$(grep -c "CURRENT_PROJECT_VERSION = ${CUR};" "$PBX")
(( SYNC_COUNT == 2 )) || {
  echo "Expected exactly 2 matching CURRENT_PROJECT_VERSION lines, found $SYNC_COUNT." >&2
  echo "Debug and Release configs may have drifted — fix manually before bumping." >&2
  exit 1; }

sed -i '' "s/CURRENT_PROJECT_VERSION = ${CUR};/CURRENT_PROJECT_VERSION = ${NEXT};/g" "$PBX"
echo "✓ CURRENT_PROJECT_VERSION: $CUR → $NEXT"

if [[ -n "$NEW_MARKETING" ]]; then
  [[ "$NEW_MARKETING" =~ ^[0-9]+\.[0-9]+(\.[0-9]+)?$ ]] \
    || { echo "--marketing must be X.Y or X.Y.Z" >&2; exit 2; }
  CUR_MKT=$(grep -m1 'MARKETING_VERSION = ' "$PBX" | awk '{print $3}' | tr -d ';')
  sed -i '' "s/MARKETING_VERSION = ${CUR_MKT};/MARKETING_VERSION = ${NEW_MARKETING};/g" "$PBX"
  echo "✓ MARKETING_VERSION: $CUR_MKT → $NEW_MARKETING"
fi
