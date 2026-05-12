-- =========================================================================
-- Si-CAMBAH database schema (PR 3)
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query).
--
-- This file is idempotent — safe to re-run. It creates:
--   - hibah        : single table for all 8 hibah categories, with JSONB
--                    "details" column for category-specific fields
--   - legalitas    : Surat Keputusan registry
--   - set_updated_at() trigger function to keep `updated_at` fresh
--   - is_admin()   : helper that reads role from JWT user_metadata
--   - RLS policies : admin = full access, operator = read all + write own
-- =========================================================================

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.hibah (
  id          uuid primary key default gen_random_uuid(),
  kategori    text not null check (kategori in (
    'bansos_masyarakat',
    'dana_desa',
    'alokasi_dana_desa',
    'bkk',
    'bk_reguler',
    'lembaga_khusus',
    'lembaga_reguler',
    'hibah_kelompok'
  )),
  tahun       integer not null check (tahun between 1900 and 2200),
  keterangan  text not null default '',
  status      text not null default 'draft' check (status in ('draft', 'confirmed')),
  details     jsonb not null default '{}'::jsonb,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_hibah_kategori   on public.hibah(kategori);
create index if not exists idx_hibah_tahun      on public.hibah(tahun);
create index if not exists idx_hibah_status     on public.hibah(status);
create index if not exists idx_hibah_created_by on public.hibah(created_by);
create index if not exists idx_hibah_created_at on public.hibah(created_at desc);
create index if not exists idx_hibah_details    on public.hibah using gin (details);

create table if not exists public.legalitas (
  id          uuid primary key default gen_random_uuid(),
  nomor_sk    text not null,
  judul       text not null,
  tanggal     date,
  link_gdrive text not null default '',
  keterangan  text not null default '',
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_legalitas_nomor_sk   on public.legalitas(nomor_sk);
create index if not exists idx_legalitas_tanggal    on public.legalitas(tanggal desc);
create index if not exists idx_legalitas_created_at on public.legalitas(created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_hibah_updated_at on public.hibah;
create trigger trg_hibah_updated_at
  before update on public.hibah
  for each row execute function public.set_updated_at();

drop trigger if exists trg_legalitas_updated_at on public.legalitas;
create trigger trg_legalitas_updated_at
  before update on public.legalitas
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Role helper — reads `role` claim from JWT, returns true if admin.
-- Used by RLS policies so we don't have to repeat the JWT lookup everywhere.
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
      or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.hibah     enable row level security;
alter table public.legalitas enable row level security;

-- hibah ---------------------------------------------------------------------
drop policy if exists hibah_select on public.hibah;
create policy hibah_select on public.hibah
  for select to authenticated
  using (true);

drop policy if exists hibah_insert on public.hibah;
create policy hibah_insert on public.hibah
  for insert to authenticated
  with check (created_by = auth.uid());

-- Admin can update any row. Operator can update only rows they created
-- AND only while they are still in `draft` (confirmed rows are locked).
drop policy if exists hibah_update on public.hibah;
create policy hibah_update on public.hibah
  for update to authenticated
  using (
    public.is_admin()
    or (created_by = auth.uid() and status = 'draft')
  )
  with check (
    public.is_admin()
    or (created_by = auth.uid())
  );

drop policy if exists hibah_delete on public.hibah;
create policy hibah_delete on public.hibah
  for delete to authenticated
  using (public.is_admin());

-- legalitas -----------------------------------------------------------------
drop policy if exists legalitas_select on public.legalitas;
create policy legalitas_select on public.legalitas
  for select to authenticated
  using (true);

drop policy if exists legalitas_insert on public.legalitas;
create policy legalitas_insert on public.legalitas
  for insert to authenticated
  with check (created_by = auth.uid());

drop policy if exists legalitas_update on public.legalitas;
create policy legalitas_update on public.legalitas
  for update to authenticated
  using (public.is_admin() or created_by = auth.uid())
  with check (public.is_admin() or created_by = auth.uid());

drop policy if exists legalitas_delete on public.legalitas;
create policy legalitas_delete on public.legalitas
  for delete to authenticated
  using (public.is_admin());
