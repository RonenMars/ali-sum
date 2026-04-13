#!/usr/bin/env bash
set -euo pipefail

# ── Colours ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}▸ $*${RESET}"; }
success() { echo -e "${GREEN}✓ $*${RESET}"; }
warn()    { echo -e "${YELLOW}⚠ $*${RESET}"; }
error()   { echo -e "${RED}✗ $*${RESET}" >&2; exit 1; }
step()    { echo -e "\n${BOLD}── $* ──────────────────────────────────────${RESET}"; }

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$REPO_ROOT/apps/web"
EXT_DIR="$REPO_ROOT/apps/extension"
ENV_FILE="$WEB_DIR/.env"
ENV_EXAMPLE="$WEB_DIR/.env.example"

# ── 1. Prerequisites ───────────────────────────────────────────────────────────
step "Checking prerequisites"

if ! command -v node &>/dev/null; then
  error "Node.js not found. Install Node.js 18+ from https://nodejs.org"
fi

NODE_MAJOR=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
if [ "$NODE_MAJOR" -lt 18 ]; then
  error "Node.js 18+ required (found v$(node -v | tr -d v))"
fi
success "Node.js $(node -v)"

if ! command -v npm &>/dev/null; then
  error "npm not found"
fi
success "npm $(npm -v)"

# ── 2. Install dependencies ────────────────────────────────────────────────────
step "Installing dependencies"
cd "$REPO_ROOT"
npm install
success "Dependencies installed"

# ── 3. Environment setup ───────────────────────────────────────────────────────
step "Environment configuration"

if [ -f "$ENV_FILE" ]; then
  warn ".env already exists — skipping creation"
else
  cp "$ENV_EXAMPLE" "$ENV_FILE"
  info "Created apps/web/.env from .env.example"
fi

# Generate AUTH_SECRET if empty or placeholder
CURRENT_SECRET=$(grep -E '^AUTH_SECRET=' "$ENV_FILE" | cut -d'"' -f2 || true)
if [ -z "$CURRENT_SECRET" ]; then
  if command -v openssl &>/dev/null; then
    SECRET=$(openssl rand -base64 32)
  else
    SECRET=$(node -e "process.stdout.write(require('crypto').randomBytes(32).toString('base64'))")
  fi
  # Replace the AUTH_SECRET line
  if [[ "$OSTYPE" == darwin* ]]; then
    sed -i '' "s|^AUTH_SECRET=.*|AUTH_SECRET=\"$SECRET\"|" "$ENV_FILE"
  else
    sed -i "s|^AUTH_SECRET=.*|AUTH_SECRET=\"$SECRET\"|" "$ENV_FILE"
  fi
  success "AUTH_SECRET generated"
else
  success "AUTH_SECRET already set"
fi

# Check DATABASE_URL
CURRENT_DB=$(grep -E '^DATABASE_URL=' "$ENV_FILE" | cut -d'"' -f2 || true)
DEFAULT_PLACEHOLDER="postgresql://user:password@host/dbname"

if [ -z "$CURRENT_DB" ] || [[ "$CURRENT_DB" == *"user:password@host"* ]]; then
  echo ""
  echo -e "${YELLOW}DATABASE_URL is not set.${RESET}"
  echo "Get a free database at https://neon.tech, then paste the connection string below."
  echo "(Or press Enter to skip and set it manually in apps/web/.env later.)"
  echo ""
  read -rp "DATABASE_URL: " INPUT_DB
  if [ -n "$INPUT_DB" ]; then
    if [[ "$OSTYPE" == darwin* ]]; then
      sed -i '' "s|^DATABASE_URL=.*|DATABASE_URL=\"$INPUT_DB\"|" "$ENV_FILE"
    else
      sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"$INPUT_DB\"|" "$ENV_FILE"
    fi
    success "DATABASE_URL saved"
  else
    warn "Skipped — set DATABASE_URL in apps/web/.env before running migrations"
  fi
else
  success "DATABASE_URL already set"
fi

# ── 4. Database migration ──────────────────────────────────────────────────────
step "Running database migrations"

CURRENT_DB=$(grep -E '^DATABASE_URL=' "$ENV_FILE" | cut -d'"' -f2 || true)
if [ -z "$CURRENT_DB" ] || [[ "$CURRENT_DB" == *"user:password@host"* ]]; then
  warn "DATABASE_URL not configured — skipping migrations"
  warn "Run manually later: cd apps/web && npx prisma migrate dev"
else
  cd "$WEB_DIR"
  npx prisma migrate dev --name init 2>&1 | grep -v "^$" || true
  success "Migrations applied"
  cd "$REPO_ROOT"
fi

# ── 5. Build Chrome extension ──────────────────────────────────────────────────
step "Building Chrome extension"
npm -w apps/extension run build
success "Extension built → apps/extension/dist/"

# ── Done ───────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}Setup complete!${RESET}"
echo ""
echo -e "${BOLD}Next steps:${RESET}"
echo ""
echo -e "  ${CYAN}1. Start the web app${RESET}"
echo -e "     npm -w apps/web run dev"
echo -e "     → opens at http://localhost:3000"
echo ""
echo -e "  ${CYAN}2. Create an account${RESET}"
echo -e "     http://localhost:3000/register"
echo ""
echo -e "  ${CYAN}3. Load the extension in Chrome${RESET}"
echo -e "     • Go to chrome://extensions"
echo -e "     • Enable Developer mode"
echo -e "     • Load unpacked → select apps/extension/"
echo ""
echo -e "  ${CYAN}4. Generate and copy your API token${RESET}"
echo -e "     Dashboard → Settings → Generate Token"
echo ""
echo -e "  ${CYAN}5. Sync your AliExpress orders${RESET}"
echo -e "     • Paste token into extension popup → Connect"
echo -e "     • Visit https://www.aliexpress.com/p/order/index.html"
echo -e "     • Click Sync Now in the extension popup"
echo ""

read -rp "Start the web app now? [y/N] " START
if [[ "$START" =~ ^[Yy]$ ]]; then
  info "Starting dev server at http://localhost:3000 ..."
  npm -w apps/web run dev
fi
