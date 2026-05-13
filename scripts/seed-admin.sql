-- Skrip untuk mempromosikan user existing menjadi admin Si-CAMBAH.
--
-- Cara pakai:
--   1. Pastikan user-nya sudah dibuat lewat Authentication → Users → Add user di Supabase Dashboard.
--   2. Ganti placeholder email & nama di bawah.
--   3. Buka Supabase Dashboard → SQL Editor → New query → paste skrip ini → Run.
--   4. Verifikasi: jalankan SELECT di bawah.
--
-- CATATAN: Skrip ini cuma update kolom raw_user_meta_data di auth.users.
-- Tidak ada efek samping ke tabel lain. Aman re-run.

-- 1. Promote user jadi admin (ganti email & nama)
update auth.users
set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object(
         'role', 'admin',
         'nama', 'Nama Admin'   -- ganti dengan nama lengkap admin
       )
where email = 'admin@example.com';  -- ganti dengan email admin

-- 2. Verifikasi hasil
select id, email, raw_user_meta_data
from auth.users
where email = 'admin@example.com';  -- ganti dengan email admin yang sama

-- =======================================================================
-- VARIASI: Kalau mau demote admin balik jadi operator
-- =======================================================================
-- update auth.users
-- set raw_user_meta_data = raw_user_meta_data || '{"role": "operator"}'::jsonb
-- where email = 'admin@example.com';

-- =======================================================================
-- VARIASI: Lihat semua user beserta role-nya
-- =======================================================================
-- select
--   email,
--   raw_user_meta_data ->> 'nama' as nama,
--   coalesce(raw_user_meta_data ->> 'role', 'operator') as role,
--   created_at,
--   last_sign_in_at
-- from auth.users
-- order by created_at desc;
