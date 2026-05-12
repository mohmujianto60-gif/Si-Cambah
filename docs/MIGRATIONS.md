# Si-CAMBAH — SQL Migrations

Dokumen ini menjelaskan cara menjalankan dan menulis SQL migration untuk Supabase.

---

## File migration yang ada

| File | Deskripsi |
|---|---|
| `supabase/migrations/001_hibah_schema.sql` | Tabel `hibah` (single-table + JSONB) + tabel `legalitas` + RLS policies + indexes + triggers `updated_at` |

Migration berikutnya (future PR):

| File | Deskripsi |
|---|---|
| `supabase/migrations/002_audit_log.sql` | Tabel `audit_log` + triggers untuk auto-rekam create/update/delete |

---

## Cara menjalankan migration

### Cara A — Supabase Dashboard SQL Editor (paling cepat, 1x setup)

1. Buka Supabase Dashboard → **SQL Editor** → **+ New query**
2. Buka file migration di GitHub: https://github.com/mohmujianto60-gif/Si-Cambah/tree/devin/initial-setup/supabase/migrations
3. Klik file → klik tombol **"Copy raw file"** (icon clipboard kanan atas)
4. Paste ke SQL Editor → **Run** (Ctrl+Enter)
5. Harus muncul **"Success. No rows returned"**

Jalankan **berurutan**: 001 dulu, baru 002, dst.

### Cara B — Supabase CLI (untuk dev workflow)

```bash
# Install CLI (1x)
npm install -g supabase

# Login (1x)
supabase login

# Link ke project (1x per project)
supabase link --project-ref <project-ref>

# Run semua migration di folder supabase/migrations/
supabase db push
```

CLI track migration yang sudah di-apply di tabel internal `supabase_migrations.schema_migrations`, jadi aman re-run — yang sudah applied di-skip.

---

## Idempotency

Semua migration di Si-CAMBAH **idempoten** — aman di-run berkali-kali. Pakai:

- `create table if not exists` daripada `create table`
- `create index if not exists` daripada `create index`
- `do $$ ... if not exists ... $$;` untuk policies/triggers (Postgres tidak punya `if not exists` untuk policy/trigger native, jadi pakai `do` block)
- `create or replace function` untuk function

Kalau setengah jalan SQL error, fix error-nya, re-run seluruh file dari awal — tidak akan double-create.

---

## Cara menulis migration baru

### 1. Buat file baru di `supabase/migrations/`

Penamaan: `<3-digit-sequence>_<description>.sql` — mis. `002_audit_log.sql`.

### 2. Template

```sql
-- Migration 002: <Deskripsi>
-- Date: YYYY-MM-DD
-- Description: <Penjelasan apa yang di-create/diubah dan kenapa>

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists nama_tabel (
  id uuid primary key default gen_random_uuid(),
  -- ...
  created_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_nama_tabel_field on nama_tabel(field);

-- ============================================================
-- RLS POLICIES
-- ============================================================

alter table nama_tabel enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public'
    and tablename='nama_tabel' and policyname='nama_tabel_select'
  ) then
    create policy "nama_tabel_select" on nama_tabel for select using (
      -- ...
    );
  end if;
end $$;

-- ============================================================
-- TRIGGERS / FUNCTIONS
-- ============================================================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_nama_tabel_updated_at on nama_tabel;
create trigger trg_nama_tabel_updated_at
  before update on nama_tabel
  for each row execute function set_updated_at();
```

### 3. Test di project staging dulu

Sebelum apply ke production, test di Supabase project staging:
1. Buat project staging baru di Supabase (atau pakai yang existing kalau ada)
2. Jalankan SEMUA migration berurutan (001, 002, dst.) — fresh start
3. Verifikasi: tabel/index/policy/trigger tercipta sesuai ekspektasi
4. Test app dengan staging project (set env vars `.env.staging` atau di dashboard hosting)

### 4. Commit & PR

Migration file masuk PR yang sama dengan kode frontend yang pakai tabel baru. Reviewer harus apply migration di staging mereka sebelum approve.

### 5. Apply ke production

Setelah PR merged, **runner deploy harus apply migration ke production sebelum deploy frontend** (kalau frontend reference tabel yang belum ada, akan error).

Cara apply manual:
1. Buka Supabase Dashboard production
2. SQL Editor → paste file migration baru → Run
3. Verifikasi di Table Editor
4. Baru deploy frontend production

Atau pakai CI/CD dengan Supabase CLI:
```yaml
- run: supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
- run: supabase db push
```

---

## Reset database (untuk dev)

Kalau migration berantakan di Supabase project dev:

### Opsi 1 — Drop dan re-run (manual)

```sql
-- HATI-HATI: ini hapus SEMUA data
drop table if exists hibah cascade;
drop table if exists legalitas cascade;
drop function if exists set_updated_at cascade;
-- ... drop everything dari migrations
```

Lalu re-run migration 001, 002, dst.

### Opsi 2 — Reset project Supabase (paling bersih)

Settings → General → **Reset project** (di project Settings) — wipe seluruh database, kembali ke kondisi fresh. **HATI-HATI**: ireversibel.

### Opsi 3 — Buat project Supabase baru, switch env vars

Paling aman: project lama tetap, project baru fresh, switch `VITE_SUPABASE_URL` di env. Bonus: bisa rollback dengan switch balik.

---

## Backup sebelum migration besar

Selalu backup sebelum migration yang sentuh data existing:

```bash
# Via Supabase CLI
supabase db dump -f backup-pre-002.sql

# Atau pakai skrip helper di repo
bash scripts/backup-db.sh
```

Restore (kalau perlu):

```bash
supabase db reset --linked --no-seed   # wipe
psql "$(supabase status -o json | jq -r '.DB_URL')" -f backup-pre-002.sql
```

---

## Troubleshooting

### "permission denied for schema public"

Pastikan kamu **owner** project Supabase (bukan invited member dengan read-only access). SQL Editor by default jalan dengan privilege user dashboard (admin), tidak ada masalah.

### "policy ... already exists"

Migration belum idempoten. Wrap dalam `do $$ if not exists ... $$;` (lihat template di atas).

### Migration sukses tapi RLS tidak aktif

Pastikan baris `alter table X enable row level security;` ada di migration. Tanpa ini, policies tidak di-apply.

Cek di Supabase Dashboard → Table Editor → harus tampak icon **🔒 (lock)** di header tabel.

### Constraint violation saat insert

Migration ada `check (...)` constraint, tapi data lama yang kamu insert tidak match. Solusi:
1. Update data lama dulu sesuai constraint, baru jalankan migration; atau
2. Relax constraint di migration (kalau memang valid use case)

### Tabel sudah ada tapi struktur beda

Bisa terjadi kalau migration sebelumnya gagal di tengah. Cara aman:
1. Backup data: `select * from tabel` → export Excel/CSV via Dashboard
2. Drop tabel: `drop table tabel cascade;`
3. Re-run migration
4. Import data balik (kalau perlu)

---

## Untuk maintainer

- **Jangan edit migration yang sudah merged ke main** — bikin migration baru untuk perubahan
- **Migration sequence number unik & monotonic** — jangan loncat angka, jangan re-use number
- **Update `docs/MIGRATIONS.md` ini** kalau tambah file migration baru
- **Test fresh setup** — sesekali coba apply semua migration dari awal di project Supabase fresh, pastikan tidak ada ordering issue
