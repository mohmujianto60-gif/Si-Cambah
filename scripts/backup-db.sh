#!/usr/bin/env bash
# Backup database Si-CAMBAH ke file SQL via Supabase CLI.
#
# Pre-requisite:
#   - Supabase CLI sudah ter-install (npm install -g supabase)
#   - Sudah `supabase login`
#   - Sudah `supabase link --project-ref <project-ref>` di repo ini
#
# Cara pakai:
#   bash scripts/backup-db.sh                  # backup ke backups/backup-YYYY-MM-DD-HHMM.sql
#   bash scripts/backup-db.sh custom-name.sql  # backup ke file dengan nama spesifik
#
# Output: file SQL dump yang bisa di-restore via `psql < file.sql`

set -euo pipefail

if ! command -v supabase >/dev/null 2>&1; then
  echo "✗ Supabase CLI tidak ter-install."
  echo ""
  echo "Install dulu:"
  echo "  npm install -g supabase"
  echo "  supabase login"
  echo "  supabase link --project-ref <project-ref>"
  exit 1
fi

mkdir -p backups

if [ $# -gt 0 ]; then
  OUTPUT="$1"
else
  TIMESTAMP=$(date +"%Y-%m-%d-%H%M")
  OUTPUT="backups/backup-${TIMESTAMP}.sql"
fi

echo "→ Backup database ke $OUTPUT..."

# --data-only = jangan dump schema (kita pakai migration files untuk schema)
# Tanpa flag = dump schema + data
supabase db dump -f "$OUTPUT"

SIZE=$(du -h "$OUTPUT" | cut -f1)
echo "✓ Backup selesai: $OUTPUT ($SIZE)"
echo ""
echo "Untuk restore (HATI-HATI, ini overwrite database):"
echo "  psql \"\$DATABASE_URL\" -f $OUTPUT"
echo ""
echo "Atau pakai psql langsung dengan connection string Supabase:"
echo "  psql \"postgresql://postgres:[password]@[host]:5432/postgres\" -f $OUTPUT"
