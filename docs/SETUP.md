# Si-CAMBAH — Tutorial Setup Lengkap

Dokumen ini panduan **end-to-end** untuk setup Si-CAMBAH dari nol — dari clone repo sampai aplikasi siap dipakai di browser. Cocok juga kalau kamu pindah akun Supabase, deploy ulang ke server lain, atau setelah project Supabase di-pause / di-delete.

> **Estimasi total waktu:** ~25 menit
> **Pre-requisite:** akun Supabase (gratis), akun Google Cloud (gratis, opsional untuk login Google), Node.js v18+ kalau mau run lokal.

---

## Daftar isi

1. [Clone repo & install dependencies](#langkah-0--clone-repo--install-dependencies)
2. [Buat Supabase project baru](#langkah-1--buat-supabase-project-baru-3-menit)
3. [Copy URL & anon key](#langkah-2--copy-url--anon-key-30-detik)
4. [Jalankan SQL migration](#langkah-3--jalankan-sql-migration-1-menit)
5. [Konfigurasi Auth URLs](#langkah-4--konfigurasi-authentication-urls-1-menit)
6. [Aktifkan provider Email & Google](#langkah-5--aktifkan-provider-email--google-3-menit)
7. [Buat user admin pertama](#langkah-6--buat-user-admin-pertama-2-menit)
8. [Pasang env vars di aplikasi](#langkah-7--pasang-env-vars-di-aplikasi-1-menit)
9. [Deploy Edge Function admin-users](#langkah-8--deploy-edge-function-admin-users-5-menit)
10. [Test login & fitur](#langkah-9--test-login--fitur-2-menit)
11. [Troubleshooting](#troubleshooting)
12. [Pencegahan & maintenance](#pencegahan--maintenance)

---

## Langkah 0 — Clone repo & install dependencies

```bash
git clone https://github.com/mohmujianto60-gif/Si-Cambah.git
cd Si-Cambah
npm install
cp .env.example .env
```

Kita isi `.env` di [Langkah 7](#langkah-7--pasang-env-vars-di-aplikasi-1-menit) setelah Supabase ready.

---

## Pre-flight checklist

- [ ] Punya akses Supabase Dashboard ([supabase.com/dashboard](https://supabase.com/dashboard))
- [ ] Punya akses Google Cloud Console ([console.cloud.google.com](https://console.cloud.google.com)) — opsional, hanya kalau mau aktifkan login Google
- [ ] Browser sembarang (Chrome / Firefox / Edge), tidak perlu install plugin

---

## Langkah 1 — Buat Supabase project baru (~3 menit)

1. Buka **https://supabase.com/dashboard** dan login
2. Pastikan kamu di organization yang benar (lihat dropdown kiri atas). Kalau pakai 1 akun, biasanya cuma 1 org saja.
3. Klik tombol hijau **"+ New project"** (kanan atas)
4. Isi form:
   - **Name**: `si-cambah` (atau `si-cambah-prod`, terserah)
   - **Database Password**: klik **"Generate password"** → tampilan password muncul → klik **icon copy** → **paste & simpan** di Notes / password manager kamu
     > ⚠️ Password ini dipakai kalau nanti kamu mau connect ke database via `psql` atau Supabase CLI. Untuk app sekarang tidak dipakai. **Tetap simpan**, kalau hilang harus reset password.
   - **Region**: pilih **Southeast Asia (Singapore)** — paling dekat dari Indonesia, latency terendah
   - **Pricing Plan**: **Free**
5. Klik **"Create new project"**
6. Tunggu **~2–3 menit**. Halaman akan tampil banner kuning "Setting up your project..." → setelah selesai, banner hilang, dashboard project muncul.

---

## Langkah 2 — Copy URL & anon key (~30 detik)

1. Di project baru, sidebar kiri paling bawah → klik icon **⚙ (gear)** → **Project Settings**
2. Submenu **"API"**
3. Catat 2 nilai ini ke Notes sementara:

   **Project URL**
   ```
   https://xxxxxxxxxx.supabase.co
   ```
   (`xxxxxxxxxx` adalah project ref, beda dari project lama)

   **Project API keys → anon public**
   ```
   eyJhbGciOiJIUzI1NiIs...
   ```
   (string panjang dimulai `eyJ`, panjangnya ~250 karakter)

   > ⚠️ Di bawah ada juga **`service_role` (secret)** — **JANGAN COPY ITU**. Service_role boleh tahu hanya Edge Function (Supabase inject otomatis). Kalau service_role bocor ke frontend, **siapapun bisa hapus data semua user**.

---

## Langkah 3 — Jalankan SQL migration (~1 menit)

Ini bikin tabel `hibah`, `legalitas`, dan policies Row Level Security.

1. Sidebar kiri → icon **`</>` (SQL Editor)**
2. Klik **"+ New query"** kanan atas
3. Buka di browser tab baru: **https://raw.githubusercontent.com/mohmujianto60-gif/Si-Cambah/devin/initial-setup/supabase/migrations/001_hibah_schema.sql**
4. **Ctrl+A → Ctrl+C** (select all + copy) seluruh isinya
5. Balik ke tab Supabase SQL Editor → klik di area query → **Ctrl+V** (paste)
6. Klik tombol **"Run"** kanan bawah (atau Ctrl+Enter)
7. Harus muncul **"Success. No rows returned"** di bawah

### Verifikasi

- Sidebar kiri → **Table Editor** (icon meja)
- Harus muncul 2 tabel: **`hibah`** dan **`legalitas`**
- Klik salah satu → di header tabel ada icon **🔒 (lock)** dengan tulisan "RLS enabled" — artinya Row Level Security aktif
- Tabel kosong (0 rows) — normal, ini fresh install

---

## Langkah 4 — Konfigurasi Authentication URLs (~1 menit)

Ini supaya app boleh redirect kembali ke domainnya setelah login.

1. Sidebar kiri → **Authentication** (icon person)
2. Submenu **"URL Configuration"**
3. **Site URL** → isi URL hostname app kamu **tanpa trailing slash**. Contoh:
   - Local dev: `http://localhost:5173`
   - Devin preview: `https://dist-unmsptrp.devinapps.com`
   - Custom domain: `https://si-cambah.bapperida.example.com`
4. **Redirect URLs** → klik **"Add URL"** → isi URL hostname + `/**` wildcard. Contoh:
   ```
   https://dist-unmsptrp.devinapps.com/**
   ```
   > Wildcard `/**` penting — supaya redirect ke `/#/reset-password`, `/#/`, dll semua diizinkan. Bisa add **lebih dari satu** Redirect URL kalau app deploy di beberapa env (mis. localhost untuk dev + URL preview).
5. Klik **Save**

---

## Langkah 5 — Aktifkan provider Email & Google (~3 menit)

### 5a. Email provider (sudah default ON)

1. **Authentication → Providers**
2. Scroll ke **Email** — pastikan toggle **ON** (biasanya sudah ON by default)
3. **Confirm email**: bebas — kalau **ON**, user yang signup harus klik link konfirmasi email; kalau **OFF**, langsung bisa login. Untuk testing internal, **OFF** lebih praktis.
4. Save kalau ada perubahan.

### 5b. Google OAuth provider (opsional, kalau mau tombol "Masuk dengan Google")

1. Di halaman **Providers**, scroll cari **Google**
2. Klik untuk expand → toggle **ON**
3. Field yang harus diisi:
   - **Client ID (for OAuth)**: dari OAuth Client di Google Cloud Console (lihat langkah 5c kalau belum punya). Format: `xxxxxxx.apps.googleusercontent.com`.
   - **Client Secret (for OAuth)**: dari tempat yang sama (klik OAuth Client → "Show secret" atau download JSON)
4. Field **Callback URL (for OAuth)** muncul (read-only) — copy URL ini, formatnya:
   ```
   https://<project-ref>.supabase.co/auth/v1/callback
   ```
   (`<project-ref>` adalah string unik project Supabase kamu)
5. Klik **Save**

### 5c. Setup Google OAuth Client di Google Cloud

**Kalau belum pernah** setup OAuth Client:

1. Buka **https://console.cloud.google.com** → pilih project (atau buat project baru)
2. **APIs & Services → OAuth consent screen**:
   - **User Type**: External → Create
   - **App information**: nama app, support email, developer email
   - Scopes: pakai basic saja (`openid`, `userinfo.email`, `userinfo.profile`)
   - Kalau masih Testing mode, tambah email staf di **Test users**
   - Save and Continue di tiap step
3. **APIs & Services → Credentials → + Create Credentials → OAuth client ID**:
   - **Application type**: Web application
   - **Name**: `Si-CAMBAH Web`
   - **Authorized JavaScript origins**: URL hostname app (mis. `https://dist-unmsptrp.devinapps.com`)
   - **Authorized redirect URIs**: paste callback URL dari langkah 5b.4
   - Create → modal muncul dengan **Client ID** & **Client Secret** → copy keduanya, paste ke langkah 5b.3
4. Save di Supabase

**Kalau sudah pernah** setup tapi pindah Supabase project (project ref berubah):

1. Buka **https://console.cloud.google.com**
2. APIs & Services → **Credentials** → klik nama OAuth 2.0 Client ID yang sudah ada
3. Section **Authorized redirect URIs**:
   - Hapus URI Supabase lama (kalau ada)
   - Klik **"+ ADD URI"** → paste URL callback baru dari langkah 5b.4
4. Section **Authorized JavaScript origins**:
   - Pastikan ada URL hostname app kamu
   - Kalau belum, **"+ ADD URI"** → tambah
5. Scroll ke bawah → **Save**

> ⚠️ Setelah save, perubahan butuh **~5 menit** untuk propagate di Google. Kalau test login Google langsung error, tunggu sebentar.

---

## Langkah 6 — Buat user admin pertama (~2 menit)

Karena fresh project, tidak ada user. Kita buat admin pakai akun email/password (lebih cepat daripada via Google).

1. **Authentication → Users**
2. Klik **"Add user" → "Create new user"**
3. Isi:
   - **Email**: email kamu (mis. `mohmujianto60@gmail.com`)
   - **Password**: password kuat (8+ karakter, mixed case, angka)
   - **Auto Confirm User**: **CENTANG** ☑ — supaya tidak perlu klik link email
4. Klik **Create user**

### Set metadata role = admin

1. Di tabel Users, **klik baris user yang baru kamu buat** → panel detail terbuka
2. Scroll cari section **"User Meta Data"** atau **"Raw user meta data"** (biasanya di tengah panel) → klik tombol **edit (pensil)** di sebelahnya
3. Editor JSON muncul → isi (ganti nama sesuai user):
   ```json
   {
     "role": "admin",
     "nama": "Nama Admin"
   }
   ```
4. **Save**

### Alternatif: pakai skrip SQL

Kalau UI Studio susah dicari, jalankan SQL ini di SQL Editor (ganti email & nama):

```sql
update auth.users
set raw_user_meta_data = raw_user_meta_data
    || '{"role":"admin","nama":"Nama Admin"}'::jsonb
where email = 'admin@example.com';
```

Lalu verify:

```sql
select email, raw_user_meta_data
from auth.users
where email = 'admin@example.com';
```

Harus muncul row dengan `raw_user_meta_data` berisi `role` dan `nama`.

> 💡 Skrip helper siap pakai ada di `scripts/seed-admin.sql` — tinggal edit email & nama lalu run.

---

## Langkah 7 — Pasang env vars di aplikasi (~1 menit)

Edit file `.env` di root repo (yang dibuat di Langkah 0):

```env
VITE_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

Ganti placeholder dengan nilai dari [Langkah 2](#langkah-2--copy-url--anon-key-30-detik).

Verifikasi `.env` terbaca:
```bash
bash scripts/check-supabase.sh
```
(Skrip ini cek `.env` terisi & coba reach Supabase URL.)

### Pakai Devin

Kasih kredensial ke Devin via secret prompts. Devin akan inject otomatis saat build.

### Deploy ke Vercel / Netlify / Cloudflare Pages

Set 2 env var di dashboard masing-masing platform (Settings → Environment Variables). **JANGAN commit `.env`** — sudah di `.gitignore`.

---

## Langkah 8 — Deploy Edge Function `admin-users` (~5 menit)

Untuk halaman **Manajemen User** (PR 4) bekerja, Edge Function harus deployed.

### Cara A — Via Supabase Dashboard (paling cepat, GUI)

1. Sidebar kiri → **Edge Functions** (icon petir)
2. Klik **"Deploy a new function"** (atau "+ Create a new function")
3. Isi:
   - **Function name**: `admin-users` — **HARUS PERSIS** nama ini (frontend hardcode)
   - **Verify JWT with legacy secret**: toggle **OFF** ☐ (function ini verify JWT manual untuk return 403 yang clean)
4. Editor code muncul → hapus isi default
5. Buka di tab baru: **https://raw.githubusercontent.com/mohmujianto60-gif/Si-Cambah/devin/initial-setup/supabase/functions/admin-users/index.ts**
6. Ctrl+A → Ctrl+C → balik ke Supabase, paste ke editor
7. Klik **"Deploy function"** kanan atas
8. Tunggu ~30 detik. Selesai → status function = **"Active"**

### Cara B — Via Supabase CLI (untuk re-deploy berkali-kali)

```bash
# Install CLI (1x saja)
npm install -g supabase

# Login (1x saja)
supabase login
# (browser terbuka, klik authorize)

# Link ke project (1x per project)
supabase link --project-ref <project-ref-baru>
# project-ref ada di URL dashboard, mis. https://supabase.com/dashboard/project/abcdefg → "abcdefg"

# Deploy (run dari root repo Si-Cambah)
cd /path/to/Si-Cambah
supabase functions deploy admin-users --no-verify-jwt
```

`--no-verify-jwt` **wajib** (function verify JWT sendiri).

### Verifikasi function bisa di-call

1. Sidebar **Edge Functions** → klik `admin-users`
2. Tab **"Logs"** — masih kosong, normal (belum di-call)
3. Login ke app → klik nav **"Manajemen User"** → kalau berhasil, list user (cuma kamu doang) muncul. Kalau gagal, baca error message — biasanya "Edge Function tidak ditemukan" atau "Verify JWT enabled".

---

## Langkah 9 — Test login & fitur (~2 menit)

### Run lokal

```bash
npm run dev
```

Buka **http://localhost:5173** di browser.

### Atau build & preview

```bash
npm run build
npm run preview
```

Buka URL yang ditampilkan (biasanya `http://localhost:4173`).

### Smoke test

1. Halaman login muncul dengan form email/password + tombol Google (kalau aktifkan provider Google)
2. Login pakai email + password admin dari [Langkah 6](#langkah-6--buat-user-admin-pertama-2-menit)
3. Berhasil masuk → sidebar tampil nama admin dengan badge role **admin**
4. Dashboard tampil (0 data, normal untuk fresh setup)
5. Klik nav **"Manajemen User"** di sidebar bawah → list user muncul (cuma 1: kamu sendiri)
6. Coba **"Tambah User"** → email `test@example.com` + password `testpass123` + role operator → submit → list refresh, user baru muncul
7. Buka halaman kategori (mis. Bansos) → form input data → kalau bisa simpan, **semua working**
8. Logout → login ulang sebagai operator (test@example.com) → coba akses `/#/manajemen-user` → harus tampil "Akses Ditolak"

---

## Troubleshooting

### "Pastikan tabel hibah sudah dibuat" / Dashboard error merah
→ Langkah 3 belum jalan / gagal. Re-run SQL migration. File-nya idempoten (aman re-run).

### "Pastikan Edge Function admin-users sudah di-deploy"
→ Langkah 8 belum jalan, atau nama function salah (harus persis `admin-users`).

### Login Google "redirect_uri_mismatch"
→ Langkah 5c belum / belum propagate. Pastikan URL callback Supabase baru sudah di-add di Google Cloud, tunggu ~5 menit.

### Login Email "Invalid login credentials"
→ User belum auto-confirm, atau password salah. Cek di Authentication → Users → klik user → field `email_confirmed_at` harus terisi. Kalau kosong, klik **"Confirm email"** dari menu titik tiga.

### List user kosong padahal ada user
→ Edge Function deployed tapi tidak terbaca. Cek tab **Logs** di Edge Functions → cari error. Biasanya "Verify JWT enabled" (toggle off-kan di settings function).

### `npm install -g supabase` butuh sudo / permission denied
→ Linux/Mac: pakai `sudo npm install -g supabase`, atau install via brew (`brew install supabase/tap/supabase`). Windows: pakai scoop (`scoop install supabase`).

### Lupa password admin
→ Authentication → Users → klik user → menu titik tiga → **"Send password recovery"** → cek email
→ Atau menu titik tiga → **"Reset password..."** → set password baru langsung di dashboard

---

## Checklist akhir

- [ ] Project Supabase aktif
- [ ] Tabel `hibah` + `legalitas` + RLS policies ready (verify di Table Editor)
- [ ] Auth provider Email aktif (Google opsional)
- [ ] Admin pertama dibuat dengan metadata `role=admin`
- [ ] `.env` di app terisi
- [ ] Aplikasi deploy / running
- [ ] Edge Function `admin-users` deployed
- [ ] Login admin works, halaman Manajemen User works

---

## Pencegahan & maintenance

Supaya project tidak hilang lagi:

1. **Project free tier butuh aktivitas mingguan** — minimal buka Supabase Dashboard 1x/minggu. Tidak harus ngapa-ngapain, cuma login & buka halaman project sudah cukup untuk reset counter idle. Project free tier yang idle >7 hari → di-pause; paused >90 hari → di-**delete permanen**.

2. **Backup berkala** — pakai skrip `scripts/backup-db.sh` (jalankan manual atau setup cron job). Atau via Supabase CLI:
   ```bash
   supabase db dump -f backup-$(date +%Y%m%d).sql
   ```

3. **JANGAN klik Settings → General → Delete project** kecuali memang mau. Tombolnya ada konfirmasi ketik nama project, jadi susah ke-pencet, tapi double-check.

4. **Upgrade ke Pro plan ($25/bulan/org)** kalau project ini mau dipakai produksi serius — project Pro plan tidak kena auto-pause / auto-delete.

5. **Multi-environment** — kalau punya staging & production, buat **2 Supabase project terpisah**, jangan share 1 project. Data production tidak tercampur dengan test data.
