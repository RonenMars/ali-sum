#!/usr/bin/env bash
# archive-and-upload.sh — archive the Capacitor iOS app and upload to
# TestFlight in two non-interactive xcodebuild calls. Apple processes the
# build (~5–15 min) and it appears in TestFlight once `processingState`
# flips to VALID.
#
# Run from apps/mobile/. Requires `.env.signing` (from
# bootstrap-ios-signing.sh) sourced first.

set -euo pipefail

: "${ASC_KEY_ID:?source .env.signing first}"
: "${ASC_ISSUER_ID:?source .env.signing first}"
: "${ASC_KEY_PATH:?source .env.signing first}"
: "${EXPORT_OPTIONS_PLIST:?source .env.signing first}"

WORKSPACE="${WORKSPACE:-ios/App/App.xcworkspace}"
SCHEME="${SCHEME:-App}"
[[ -d "$WORKSPACE" ]] || { echo "No workspace at $WORKSPACE" >&2; exit 1; }

ARCHIVE_PATH="${ARCHIVE_PATH:-build/App.xcarchive}"
mkdir -p "$(dirname "$ARCHIVE_PATH")" build/export

echo "▸ Archive  $WORKSPACE → $ARCHIVE_PATH"
xcodebuild \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath "$ARCHIVE_PATH" \
  -allowProvisioningUpdates \
  -authenticationKeyPath "$ASC_KEY_PATH" \
  -authenticationKeyID "$ASC_KEY_ID" \
  -authenticationKeyIssuerID "$ASC_ISSUER_ID" \
  archive | tee build/archive.log

echo
echo "▸ Upload to App Store Connect (destination=upload)"
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportOptionsPlist "$EXPORT_OPTIONS_PLIST" \
  -exportPath build/export \
  -allowProvisioningUpdates \
  -authenticationKeyPath "$ASC_KEY_PATH" \
  -authenticationKeyID "$ASC_KEY_ID" \
  -authenticationKeyIssuerID "$ASC_ISSUER_ID" | tee build/upload.log

BUNDLE_ID=$(grep -m1 'PRODUCT_BUNDLE_IDENTIFIER = ' \
  ios/App/App.xcodeproj/project.pbxproj | awk '{print $3}' | tr -d ';')
echo
echo "✓ Uploaded. Apple is processing — poll with:"
echo "  ./scripts/poll-build.sh $BUNDLE_ID --watch"
