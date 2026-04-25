#!/usr/bin/env bash
# preflight.sh — non-interactive prerequisite check for the Capacitor iOS
# ship pipeline. Run from apps/mobile/.
#
# Runs every check in turn, prints PASS/FAIL per row, exits non-zero on the
# first failure with a remediation hint.
#
# Usage:
#   ./scripts/preflight.sh                  # all checks
#   SKIP_SECRETS=1 ./scripts/preflight.sh   # skip 1Password / ASC checks

set -euo pipefail

SKIP_SECRETS="${SKIP_SECRETS:-0}"

ok=0; fail=0
log_pass() { printf '  \033[32m✓\033[0m %s\n' "$1"; ok=$((ok + 1)); }
log_fail() { printf '  \033[31m✗\033[0m %s\n     fix: %s\n' "$1" "$2"; fail=$((fail + 1)); }

check() { # check "label" "command" "fix-hint"
  if eval "$2" >/dev/null 2>&1; then log_pass "$1"; else log_fail "$1" "$3"; fi
}

echo "▸ Toolchain"
check "Node.js >= 20"             "node -v | grep -E '^v(2[0-9]|[3-9][0-9])\.'" "brew install node || nvm install 20"
check "jq installed"              "command -v jq"                              "brew install jq"
check "openssl available"         "command -v openssl"                         "ships with macOS — broken install?"

echo
echo "▸ iOS toolchain"
check "Xcode CLT installed"       "xcode-select -p"                            "xcode-select --install"
check "iOS SDK present"           "xcrun --sdk iphoneos --show-sdk-path"       "xcodebuild -downloadPlatform iOS"
check "Simulator runtime"         "xcrun simctl list runtimes -j | jq -e '.runtimes[] | select(.name | startswith(\"iOS\"))'" "xcodebuild -downloadPlatform iOS"
check "CocoaPods installed"       "command -v pod"                             "brew install cocoapods"

echo
echo "▸ Project"
check "Run from apps/mobile/"     "[[ -f capacitor.config.ts || -f capacitor.config.json ]]" "cd apps/mobile"
check "iOS project exists"        "[[ -d ios/App/App.xcworkspace ]]"           "npx cap add ios (then commit)"
check "Privacy manifest present"  "[[ -f ios/App/App/PrivacyInfo.xcprivacy ]]" "create ios/App/App/PrivacyInfo.xcprivacy and add to App target"
check "Bundle id resolvable"      "grep -q 'PRODUCT_BUNDLE_IDENTIFIER = ' ios/App/App.xcodeproj/project.pbxproj" "set PRODUCT_BUNDLE_IDENTIFIER in Xcode → Signing & Capabilities"
check "Monorepo lockfile present" "[[ -f ../../package-lock.json ]]"           "commit package-lock.json at repo root"

if [[ "$SKIP_SECRETS" != "1" ]]; then
  echo
  echo "▸ Ship secrets (set SKIP_SECRETS=1 to bypass)"
  check "1Password CLI installed" "command -v op"                              "brew install --cask 1password-cli"
  check "1Password signed in"     "op whoami"                                  "eval \"\$(op signin)\" — or set OP_SERVICE_ACCOUNT_TOKEN for CI"
fi

echo
if (( fail == 0 )); then
  printf '\033[32m%d/%d checks passed.\033[0m\n' "$ok" "$((ok + fail))"
  exit 0
else
  printf '\033[31m%d/%d checks failed.\033[0m Fix the rows marked ✗ then re-run.\n' "$fail" "$((ok + fail))"
  exit 1
fi
