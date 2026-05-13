#!/usr/bin/env bash
# Verifikasi konfigurasi Supabase untuk Si-CAMBAH.
#
# Cek:
#   1. File .env ada dan terisi VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY
#   2. URL bisa di-resolve (DNS)
#   3. Endpoint /auth/v1/health bisa di-reach dengan anon key
#
# Cara pakai:
#   bash scripts/check-supabase.sh

set -u

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASS=0
FAIL=0

step() {
  echo -e "${BLUE}→${NC} $1"
}

ok() {
  echo -e "  ${GREEN}✓${NC} $1"
  PASS=$((PASS + 1))
}

fail() {
  echo -e "  ${RED}✗${NC} $1"
  FAIL=$((FAIL + 1))
}

warn() {
  echo -e "  ${YELLOW}⚠${NC} $1"
}

echo "=========================================="
echo "  Si-CAMBAH — Supabase Config Check"
echo "=========================================="
echo ""

# === Cek 1: File .env ===
step "Cek file .env"
if [ ! -f ".env" ]; then
  fail "File .env tidak ditemukan di working directory ($(pwd))"
  echo ""
  echo "  Fix: copy template lalu isi kredensial Supabase:"
  echo "    cp .env.example .env"
  echo "    # lalu edit .env, isi VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY"
  exit 1
fi
ok ".env ditemukan"

# Load .env
set -a
# shellcheck disable=SC1091
source .env
set +a

# === Cek 2: Env vars ===
step "Cek env vars"
if [ -z "${VITE_SUPABASE_URL:-}" ]; then
  fail "VITE_SUPABASE_URL kosong / tidak terdefinisi"
else
  ok "VITE_SUPABASE_URL = $VITE_SUPABASE_URL"
fi

if [ -z "${VITE_SUPABASE_ANON_KEY:-}" ]; then
  fail "VITE_SUPABASE_ANON_KEY kosong / tidak terdefinisi"
elif [[ ! "$VITE_SUPABASE_ANON_KEY" =~ ^eyJ ]]; then
  warn "VITE_SUPABASE_ANON_KEY tidak dimulai dengan 'eyJ' (bukan format JWT?)"
  warn "Pastikan kamu copy anon key (bukan service_role atau JWT lain)"
else
  KEY_PREFIX="${VITE_SUPABASE_ANON_KEY:0:20}"
  KEY_LEN=${#VITE_SUPABASE_ANON_KEY}
  ok "VITE_SUPABASE_ANON_KEY = ${KEY_PREFIX}... (panjang $KEY_LEN char)"
fi

if [ $FAIL -gt 0 ]; then
  echo ""
  echo -e "${RED}✗ Gagal: env vars belum lengkap${NC}"
  echo "  Fix: edit .env, lalu jalankan ulang skrip ini."
  exit 1
fi

# === Cek 3: URL format ===
step "Cek format URL"
if [[ ! "$VITE_SUPABASE_URL" =~ ^https://[a-z0-9]+\.supabase\.co$ ]]; then
  warn "URL bukan format standar 'https://<project-ref>.supabase.co' — mungkin custom domain?"
else
  ok "URL format valid"
fi

# === Cek 4: DNS resolution ===
step "Cek DNS resolution"
HOST="${VITE_SUPABASE_URL#https://}"
HOST="${HOST%%/*}"

if command -v getent >/dev/null 2>&1; then
  if getent hosts "$HOST" >/dev/null 2>&1; then
    ok "$HOST resolve ke IP"
  else
    fail "$HOST tidak bisa di-resolve (DNS error)"
    echo ""
    echo "  Kemungkinan penyebab:"
    echo "  - Project Supabase sudah di-delete (kosongkan org → check Dashboard)"
    echo "  - Typo di VITE_SUPABASE_URL"
    echo "  - Ada masalah jaringan / DNS server"
    exit 1
  fi
elif command -v host >/dev/null 2>&1; then
  if host "$HOST" >/dev/null 2>&1; then
    ok "$HOST resolve ke IP"
  else
    fail "$HOST tidak bisa di-resolve (DNS error)"
    exit 1
  fi
else
  warn "getent / host tidak tersedia — skip DNS check"
fi

# === Cek 5: Reach endpoint ===
step "Cek endpoint /auth/v1/health"
if ! command -v curl >/dev/null 2>&1; then
  warn "curl tidak tersedia — skip endpoint check"
else
  HTTP_CODE=$(curl -sS -m 10 -o /tmp/sb-health.txt -w "%{http_code}" \
    "$VITE_SUPABASE_URL/auth/v1/health" \
    -H "apikey: $VITE_SUPABASE_ANON_KEY" 2>&1 || echo "ERR")

  if [ "$HTTP_CODE" = "200" ]; then
    ok "Auth endpoint reachable (HTTP 200)"
  elif [ "$HTTP_CODE" = "ERR" ]; then
    fail "curl gagal connect ke endpoint"
    exit 1
  else
    warn "Auth endpoint return HTTP $HTTP_CODE (expected 200) — project mungkin paused?"
    if [ -s /tmp/sb-health.txt ]; then
      echo "  Response body:"
      head -c 300 /tmp/sb-health.txt | sed 's/^/    /'
      echo ""
    fi
  fi
fi

# === Cek 6: Tabel hibah ada? ===
step "Cek tabel 'hibah' di database (via REST API)"
if ! command -v curl >/dev/null 2>&1; then
  warn "curl tidak tersedia — skip table check"
else
  HTTP_CODE=$(curl -sS -m 10 -o /tmp/sb-hibah.txt -w "%{http_code}" \
    "$VITE_SUPABASE_URL/rest/v1/hibah?limit=1" \
    -H "apikey: $VITE_SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" 2>&1 || echo "ERR")

  if [ "$HTTP_CODE" = "200" ]; then
    ok "Tabel 'hibah' bisa di-query (RLS allow anonymous SELECT)"
  elif [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
    ok "Tabel 'hibah' ada (RLS block anonymous SELECT — normal)"
  elif [ "$HTTP_CODE" = "404" ]; then
    fail "Tabel 'hibah' belum ada — SQL migration belum di-run"
    echo ""
    echo "  Fix: buka Supabase Dashboard → SQL Editor"
    echo "    paste isi supabase/migrations/001_hibah_schema.sql → Run"
    exit 1
  else
    warn "Unexpected HTTP $HTTP_CODE saat query tabel hibah"
    if [ -s /tmp/sb-hibah.txt ]; then
      echo "  Response body:"
      head -c 300 /tmp/sb-hibah.txt | sed 's/^/    /'
      echo ""
    fi
  fi
fi

echo ""
echo "=========================================="
if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}✓ Semua cek dasar lulus ($PASS passed)${NC}"
  echo ""
  echo "Step berikutnya:"
  echo "  - npm run dev    # development server"
  echo "  - npm run build  # production build"
else
  echo -e "${RED}✗ $FAIL cek gagal, $PASS lulus${NC}"
  exit 1
fi
echo "=========================================="
