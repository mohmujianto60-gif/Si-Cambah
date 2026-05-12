-- =========================================================================
-- Si-CAMBAH audit log (PR 6)
-- Run this in Supabase SQL Editor AFTER 001_hibah_schema.sql.
--
-- This file is idempotent — safe to re-run. It creates:
--   - audit_log table  : append-only log of insert/update/delete/confirm/revert
--   - log_audit_event() : trigger function that copies row state into audit_log
--   - Triggers on hibah and legalitas tables that auto-record changes
--   - RLS policies     : admin = SELECT all rows; nobody can INSERT/UPDATE/DELETE
--                        directly (triggers run via SECURITY DEFINER, bypass RLS)
-- =========================================================================

-- ---------------------------------------------------------------------------
-- audit_log table
-- ---------------------------------------------------------------------------
--
-- One row per change. Stored in append-only style:
--   - INSERT events: new_data populated, old_data null
--   - UPDATE events: both populated; client/UI can compute diff
--   - DELETE events: old_data populated, new_data null
--
-- The `action` column distinguishes:
--   - 'insert', 'update', 'delete' (DML-level)
--   - 'confirm', 'revert'          (semantic, set by the app via status change)
--
-- For status transitions, we use a CASE in the trigger to emit
-- 'confirm' / 'revert' instead of generic 'update' when the only change
-- is the `status` column. This makes audit log easier to read for users.

create table if not exists public.audit_log (
  id           bigserial primary key,
  table_name   text not null,
  record_id    uuid not null,
  action       text not null check (action in (
    'insert', 'update', 'delete', 'confirm', 'revert'
  )),
  actor_id     uuid references auth.users(id) on delete set null,
  actor_email  text,
  actor_nama   text,
  actor_role   text,
  old_data     jsonb,
  new_data     jsonb,
  changed_at   timestamptz not null default now()
);

create index if not exists idx_audit_log_table_record on public.audit_log(table_name, record_id);
create index if not exists idx_audit_log_actor       on public.audit_log(actor_id);
create index if not exists idx_audit_log_action      on public.audit_log(action);
create index if not exists idx_audit_log_changed_at  on public.audit_log(changed_at desc);

-- ---------------------------------------------------------------------------
-- log_audit_event() trigger function
-- ---------------------------------------------------------------------------
--
-- Called from AFTER INSERT/UPDATE/DELETE triggers on hibah and legalitas.
-- Reads JWT user metadata to capture WHO made the change.
--
-- Special handling: when only the `status` column changed on hibah,
-- emit 'confirm' (draft → confirmed) or 'revert' (confirmed → draft)
-- instead of 'update' for cleaner audit history.

create or replace function public.log_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action     text;
  v_actor_id   uuid;
  v_actor_meta jsonb;
  v_actor_email text;
  v_actor_nama text;
  v_actor_role text;
  v_old_status text;
  v_new_status text;
begin
  -- Capture actor from JWT
  v_actor_id := auth.uid();
  v_actor_meta := coalesce(auth.jwt() -> 'user_metadata', '{}'::jsonb);
  v_actor_email := auth.jwt() ->> 'email';
  v_actor_nama := v_actor_meta ->> 'nama';
  v_actor_role := coalesce(v_actor_meta ->> 'role', 'operator');

  -- Determine action type
  if (tg_op = 'INSERT') then
    v_action := 'insert';
  elsif (tg_op = 'DELETE') then
    v_action := 'delete';
  elsif (tg_op = 'UPDATE') then
    -- Check for status-only change (confirm/revert)
    -- Only applies to hibah table which has the `status` column
    if tg_table_name = 'hibah' then
      v_old_status := (to_jsonb(OLD) ->> 'status');
      v_new_status := (to_jsonb(NEW) ->> 'status');

      if v_old_status is distinct from v_new_status
         and to_jsonb(NEW) - 'updated_at' - 'status' = to_jsonb(OLD) - 'updated_at' - 'status'
      then
        if v_old_status = 'draft' and v_new_status = 'confirmed' then
          v_action := 'confirm';
        elsif v_old_status = 'confirmed' and v_new_status = 'draft' then
          v_action := 'revert';
        else
          v_action := 'update';
        end if;
      else
        v_action := 'update';
      end if;
    else
      v_action := 'update';
    end if;
  end if;

  insert into public.audit_log (
    table_name, record_id, action,
    actor_id, actor_email, actor_nama, actor_role,
    old_data, new_data
  ) values (
    tg_table_name,
    case tg_op when 'DELETE' then (OLD.id) else (NEW.id) end,
    v_action,
    v_actor_id, v_actor_email, v_actor_nama, v_actor_role,
    case tg_op when 'INSERT' then null else to_jsonb(OLD) end,
    case tg_op when 'DELETE' then null else to_jsonb(NEW) end
  );

  -- Triggers don't care about return value for AFTER triggers, but plpgsql requires it
  return case tg_op when 'DELETE' then OLD else NEW end;
end;
$$;

-- ---------------------------------------------------------------------------
-- Triggers on hibah and legalitas
-- ---------------------------------------------------------------------------

drop trigger if exists trg_hibah_audit on public.hibah;
create trigger trg_hibah_audit
  after insert or update or delete on public.hibah
  for each row execute function public.log_audit_event();

drop trigger if exists trg_legalitas_audit on public.legalitas;
create trigger trg_legalitas_audit
  after insert or update or delete on public.legalitas
  for each row execute function public.log_audit_event();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
--
-- audit_log is admin-only-readable, fully write-protected from clients.
-- The only way to insert is via the trigger function which runs SECURITY DEFINER.

alter table public.audit_log enable row level security;

drop policy if exists audit_log_select on public.audit_log;
create policy audit_log_select on public.audit_log
  for select to authenticated
  using (public.is_admin());

-- Explicitly block direct INSERT/UPDATE/DELETE from authenticated users.
-- (No policy = no access in RLS, but we're being explicit for clarity.)
drop policy if exists audit_log_no_direct_insert on public.audit_log;
create policy audit_log_no_direct_insert on public.audit_log
  for insert to authenticated
  with check (false);

drop policy if exists audit_log_no_update on public.audit_log;
create policy audit_log_no_update on public.audit_log
  for update to authenticated
  using (false);

drop policy if exists audit_log_no_delete on public.audit_log;
create policy audit_log_no_delete on public.audit_log
  for delete to authenticated
  using (false);
