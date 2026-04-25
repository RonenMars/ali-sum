#!/usr/bin/env bash
# Mint a short-lived ES256 JWT for the App Store Connect API.
# Reads ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_PATH from env (`source .env.signing`).
# Prints the JWT on stdout. Token life: 19 min (under Apple's 20-min cap).

set -euo pipefail

: "${ASC_KEY_ID:?ASC_KEY_ID not set — source .env.signing}"
: "${ASC_ISSUER_ID:?ASC_ISSUER_ID not set — source .env.signing}"
: "${ASC_KEY_PATH:?ASC_KEY_PATH not set — source .env.signing}"
[[ -r "$ASC_KEY_PATH" ]] || { echo "Cannot read .p8 at $ASC_KEY_PATH" >&2; exit 1; }

NOW=$(date +%s); EXP=$((NOW + 1140))
b64url() { openssl base64 -A | tr '+/' '-_' | tr -d '='; }

HEADER=$(printf '{"alg":"ES256","kid":"%s","typ":"JWT"}' "$ASC_KEY_ID" | b64url)
PAYLOAD=$(printf '{"iss":"%s","iat":%s,"exp":%s,"aud":"appstoreconnect-v1"}' \
  "$ASC_ISSUER_ID" "$NOW" "$EXP" | b64url)
# JWT/JWS ES256 requires signature in IEEE P1363 format (raw r||s, 64 bytes
# for P-256). `openssl dgst -sign` emits DER-encoded ASN.1, so convert with
# a stdlib-only Python step. Apple's REST API rejects DER with NOT_AUTHORIZED.
SIG=$(printf '%s.%s' "$HEADER" "$PAYLOAD" \
  | openssl dgst -sha256 -binary -sign "$ASC_KEY_PATH" \
  | python3 -c '
import sys
der = sys.stdin.buffer.read()
# DER ECDSA-Sig-Value: 30 <tot> 02 <rlen> <r> 02 <slen> <s>
assert der[0] == 0x30
i = 2
assert der[i] == 0x02; rlen = der[i+1]; r = der[i+2:i+2+rlen]; i += 2 + rlen
assert der[i] == 0x02; slen = der[i+1]; s = der[i+2:i+2+slen]
def fix(x):
    if len(x) > 32: x = x[-32:]   # strip leading zero(s) added by ASN.1 INTEGER
    return x.rjust(32, b"\0")
sys.stdout.buffer.write(fix(r) + fix(s))
' | b64url)

printf '%s.%s.%s\n' "$HEADER" "$PAYLOAD" "$SIG"
