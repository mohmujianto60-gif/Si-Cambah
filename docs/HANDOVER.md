# Si-CAMBAH — Dokumen Serah Terima (HANDOVER)

> **Versi**: 1.0 — Mei 2026
> **Status aplikasi**: Production-ready, di-deploy di Vercel
> **Pemilik repo**: [@mohmujianto60-gif](https://github.com/mohmujianto60-gif)

Dokumen ini merangkum **segalanya** tentang Si-CAMBAH yang sudah dibangun, dari arsitektur hingga prosedur operasional. Tujuannya supaya:
- Pemilik aplikasi (Moh Mujianto) bisa mengelola tanpa tergantung developer
- Developer/staf TI lain bisa take-over kalau diperlukan
- Setup baru di akun/server lain bisa diulang dari nol dalam <30 menit

---

## 1. Ringkasan Aplikasi

**Si-CAMBAH** (Sistem Catatan & Manajemen Hibah) adalah aplikasi web untuk Bapperida Bangkalan dalam mengelola data hibah pemerintah daerah. Mencatat 8 kategori hibah, melacak status (draft → siap-konfirmasi → terkonfirmasi), menampilkan dashboard rekap, dan menyediakan jejak audit lengkap.

### Fitur Utama
- **8 Kategori Hibah**: Bansos Masyarakat, BK Reguler, BKK, Bantuan Keuangan, Hibah Lembaga (Pendidikan, Tempat Ibadah, Ormas), Hibah Kelompok
- **Multi-user dengan role**: Admin (akses penuh) & Operator (input data sendiri)
- **Authentikasi**: Email/Password + Google OAuth
- **Dashboard interaktif**: Pie/Bar/Line chart (Recharts), filter tahun, export PNG/PDF
- **Audit Log**: Auto-rekam siapa/kapan/apa untuk semua perubahan data
- **Bulk Actions**: Multi-select untuk konfirmasi/hapus banyak data sekaligus
- **Dark Mode**: Toggle terang/gelap, persist di browser
- **Halaman Publik**: `/privacy`, `/terms`, `/tentang` (tidak butuh login)

---

## 2. URL & Endpoint Penting

### Production
| Resource | URL |
|---|---|
| **Web App (Vercel)** | https://si-cambah.vercel.app |
| **Privacy Policy** | https://si-cambah.vercel.app/#/privacy |
| **Terms of Service** | https://si-cambah.vercel.app/#/terms |
| **Tentang** | https://si-cambah.vercel.app/#/tentang |
| **GitHub Repo** | https://github.com/mohmujianto60-gif/Si-Cambah |
| **Supabase Project** | https://seumbgunusztrbxpnrge.supabase.co |
| **Supabase Dashboard** | https://supabase.com/dashboard/project/seumbgunusztrbxpnrge |

### Preview lama (masih hidup, opsional)
- Devin Preview: https://dist-unmsptrp.devinapps.com (akan terus jalan selama secret store Devin masih punya kredensial Supabase)

---

## 3. Tech Stack

| Layer | Tech |
|---|---|
| **Frontend** | React 19 + TypeScript + Vite + Tailwind CSS v4 |
| **UI Library** | Custom components + Lucide icons + Recharts |
| **State** | React Context (auth, theme) + localStorage |
| **Routing** | react-router-dom (HashRouter — kompatibel dengan static hosting) |
| **Backend (BaaS)** | Supabase (Postgres + Auth + Edge Functions + RLS) |
| **Server-side logic** | Deno Edge Function untuk admin operations |
| **Deploy** | Vercel (auto-deploy dari GitHub branch `devin/initial-setup`) |
| **PDF Export** | jsPDF + jspdf-autotable |
| **Image Export** | html2canvas |

---

## 4. Arsitektur Singkat

### Database (Postgres @ Supabase)

```
┌─────────────────────────────────────────────────────────┐
│  hibah  (single table + JSONB per kategori)             │
│  ├─ id, kategori (enum), tahun, status                  │
│  ├─ created_by, updated_by (FK ke auth.users)           │
│  └─ details (JSONB) — bervariasi per kategori           │
├─────────────────────────────────────────────────────────┤
│  legalitas  (dokumen pendukung per hibah)               │
│  ├─ id, hibah_id (FK), tipe_dokumen, file_url           │
│  └─ created_at                                          │
├─────────────────────────────────────────────────────────┤
│  audit_log  (jejak semua perubahan, di-trigger Postgres)│
│  ├─ id, user_id, action (insert/update/delete)          │
│  ├─ table_name, row_id                                  │
│  ├─ old_values, new_values (JSONB)                      │
│  └─ created_at                                          │
└─────────────────────────────────────────────────────────┘
```

**Single-table + JSONB**: Daripada bikin 8 tabel terpisah per kategori (yang akan banyak duplikasi schema), kita pakai 1 tabel `hibah` dengan kolom `details` JSONB yang fleksibel. Setiap kategori validate schema-nya di sisi frontend (TypeScript types). Lebih simple, lebih fleksibel kalau ada penambahan field.

### Row Level Security (RLS)
Setiap query dari frontend otomatis di-filter Postgres berdasarkan role user:
- **Admin** (`raw_user_meta_data.role = 'admin'`): full CRUD ke semua row
- **Operator** (default): bisa INSERT, hanya bisa SELECT/UPDATE row yang dia buat (`created_by = auth.uid()`)

### Edge Function `admin-users`
Deno function untuk operasi admin yang butuh `service_role` key (sensitive). Kode di `supabase/functions/admin-users/index.ts`. Endpoint:
- `GET /functions/v1/admin-users` — list semua user
- `POST /functions/v1/admin-users` — create user baru
- `PATCH /functions/v1/admin-users/:id` — update role / metadata
- `POST /functions/v1/admin-users/:id/reset-password` — kirim reset password email
- `DELETE /functions/v1/admin-users/:id` — hapus user

Verifikasi JWT dilakukan di dalam function (cek caller adalah admin) — toggle "Verify JWT with legacy secret" di Supabase WAJIB **OFF**.

### Authentication Flow
- **Email/Password**: Standard Supabase auth, password disimpan hashed di `auth.users`
- **Google OAuth**: Via OAuth Client di Google Cloud Console → redirect ke Supabase callback → Supabase issue session JWT → frontend simpen di localStorage
- **Role detection**: `raw_user_meta_data.role` atau `raw_app_meta_data.role` (di-cek di `src/lib/authContext.tsx`)

---

## 5. Kredensial & Akses

> ⚠️ **PENTING**: Dokumen ini TIDAK menyimpan password/secret apapun secara plaintext. Lokasi sebenarnya di-list di bawah.

### Akun yang relevan
| Service | Login | Owner |
|---|---|---|
| GitHub | https://github.com/mohmujianto60-gif | Moh Mujianto |
| Supabase | https://supabase.com (login via Google `mohmujianto60@gmail.com`) | Moh Mujianto |
| Vercel | https://vercel.com (login via GitHub) | Moh Mujianto |
| Google Cloud | https://console.cloud.google.com (OAuth Client untuk Si-CAMBAH) | Moh Mujianto |

### Admin pertama Si-CAMBAH
- Email: `bapperidabkl@gmail.com`
- Nama: `Bapperida Bangkalan`
- Role: `admin`
- Password: di-set saat user creation (lihat Section 7)

### Secret/Key yang harus dijaga
| Secret | Lokasi penyimpanan | Sensitivitas |
|---|---|---|
| `VITE_SUPABASE_URL` | Vercel env vars + Devin secret store | Publik (boleh di-share) |
| `VITE_SUPABASE_ANON_KEY` | Vercel env vars + Devin secret store | Publik (anon key dirancang public) |
| `SUPABASE_SERVICE_ROLE_KEY` | **HANYA di Supabase, auto-inject ke Edge Function** — JANGAN di-copy keluar | **SANGAT SENSITIF** — full database access |
| `SUPABASE_DB_PASSWORD` | Disimpan saat create project (one-time) | Sensitif — untuk akses CLI/psql |
| Google OAuth Client Secret | Disimpan di Supabase Auth → Providers → Google | Sensitif |

---

## 6. Operasional — Hal-hal yang sering Anda lakukan

### A. Menambah Pengguna Baru

#### Option A1 — Via UI Manajemen User (paling mudah, untuk Admin)
1. Login sebagai admin di https://si-cambah.vercel.app
2. Sidebar → **Manajemen User**
3. Klik **+ Tambah User** (kanan atas)
4. Isi form: email, password sementara, nama, role (admin/operator)
5. Klik Simpan
6. Beritahu user email + password sementara via channel pribadi (WA/email)
7. User login pertama kali, sebaiknya langsung ganti password via Forgot Password flow

#### Option A2 — Via Google OAuth (user signup sendiri)
1. Berikan link https://si-cambah.vercel.app ke user
2. User klik "Masuk dengan Google" → pilih akun Google mereka
3. Login otomatis sebagai operator (default)
4. Admin promote ke admin via Manajemen User → klik user → ubah role

### B. Promote User Operator ke Admin

#### Via UI:
1. Manajemen User → klik user yang mau di-promote → tombol pensil/edit → ubah role ke "admin" → Save
2. User logout & login ulang

#### Via SQL (kalau UI bermasalah):
```sql
set role postgres;

update auth.users
set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object('role', 'admin')
where email = 'EMAIL_USER@example.com';

reset role;
```
Paste ini di Supabase SQL Editor → Run. User logout & login ulang.

### C. Reset Password User

#### Via UI (Admin):
1. Manajemen User → klik user → tombol kunci/key icon → "Kirim email reset password"
2. User dapat email, klik link, set password baru

#### Self-service (User sendiri):
1. Halaman Login → "Lupa password?" → masukkan email → cek inbox → klik link → set baru

### D. Backup Database

#### Manual (rekomendasi mingguan):
```bash
# Install Supabase CLI (sekali saja)
npm install -g supabase

# Login
supabase login

# Link ke project
supabase link --project-ref seumbgunusztrbxpnrge

# Dump database
supabase db dump -f backup-$(date +%Y%m%d).sql

# File backup-YYYYMMDD.sql tersimpan di working dir — backup ke Google Drive / Dropbox
```

Skrip helper: `scripts/backup-db.sh` di repo.

#### Otomatis (Supabase Pro plan):
- Upgrade Supabase ke Pro ($25/bulan) → otomatis daily backup retained 7 hari
- Atau setup cron job di server-mu sendiri yang panggil `supabase db dump`

### E. Update Aplikasi (deploy fitur baru)

1. Buat perubahan di kode (lokal / GitHub web editor / Devin)
2. Push ke branch `devin/initial-setup` di GitHub
3. Vercel auto-detect push → build → deploy
4. Tunggu ~1-2 menit
5. Reload https://si-cambah.vercel.app di browser
6. Kalau ada masalah, Vercel auto-keep deploy lama yang masih live — bisa rollback via Vercel Dashboard → Deployments → klik deploy lama → "Promote to Production"

### F. Monitor Penggunaan

- **Supabase**: Dashboard → Reports → cek jumlah row, DB size, request count, auth events
- **Vercel**: Dashboard → Analytics → cek pageview, response time, top pages
- **Google Cloud**: APIs & Services → OAuth consent screen → cek user count yang login Google

---

## 7. Setup Ulang dari Nol (Disaster Recovery)

Skenario: akun Supabase di-hack/dihapus, atau kamu mau pindah ke akun/region lain.

**Waktu: ~30 menit**

### Step 1: Setup Supabase baru
1. Buat project baru di https://supabase.com/dashboard (region Singapore)
2. SQL Editor → Run `supabase/migrations/001_hibah_schema.sql`
3. SQL Editor → Run `supabase/migrations/002_audit_log.sql`
4. Authentication → URL Configuration:
   - Site URL: `https://si-cambah.vercel.app`
   - Redirect URLs: `https://si-cambah.vercel.app/**`
5. Authentication → Providers → Google → ON, paste Client ID + Secret dari Google Cloud
6. Authentication → Users → Add user (admin pertama), set raw_user_meta_data `{"role":"admin"}`
7. Edge Functions → Deploy `admin-users`, paste isi `supabase/functions/admin-users/index.ts`, toggle "Verify JWT" OFF

### Step 2: Update Vercel env vars
1. Vercel project → Settings → Environment Variables
2. Update `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` ke nilai project Supabase baru
3. Deployments → klik 3 dots → **Redeploy** (atau push commit kosong ke GitHub)

### Step 3: Update Google Cloud
1. Google Cloud → APIs & Services → Credentials → OAuth Client → Authorized redirect URIs
2. Tambah: `https://<PROJECT-REF-BARU>.supabase.co/auth/v1/callback`
3. URL lama boleh dihapus

### Step 4: Test
1. Buka https://si-cambah.vercel.app
2. Login admin → semua fitur jalan

Detail panduan setup dengan screenshot lebih lengkap: lihat [`docs/SETUP.md`](./SETUP.md).

---

## 8. Pengembangan Lanjutan

### Saran Roadmap (kalau mau dikembangkan ke depan)

| Prioritas | Fitur |
|---|---|
| Tinggi | Custom domain `cambah.bapperida.go.id` (gantikan `si-cambah.vercel.app`) — butuh kerja sama IT Bapperida |
| Tinggi | Backup otomatis ke Google Drive (cron job + supabase db dump) |
| Sedang | Export Excel per kategori (selain PDF) |
| Sedang | Notifikasi WhatsApp/Email saat status hibah berubah |
| Sedang | Multi-tenant (kalau mau dipakai Bapperida kabupaten/kota lain) |
| Rendah | Mobile app (React Native, reuse hooks) |
| Rendah | Filter & search lanjutan di tabel kategori |

### Cara mengembangkan

#### Option 1 — Edit langsung di GitHub (perubahan kecil)
1. Buka file di github.com/mohmujianto60-gif/Si-Cambah → klik pensil
2. Edit → commit → Vercel auto re-deploy

#### Option 2 — Lokal di laptop
```bash
git clone https://github.com/mohmujianto60-gif/Si-Cambah.git
cd Si-Cambah
npm install
cp .env.example .env  # isi 2 variabel Supabase
npm run dev           # buka localhost:3000
```
Edit di VS Code → commit → push → Vercel auto-deploy.

#### Option 3 — Pakai Devin
Buka sesi Devin baru, kasih task ("tolong tambahin fitur X"). Devin clone repo, edit, buat PR. Kamu review & merge.

#### Option 4 — Hire developer lain
Beri akses Collaborator: GitHub repo → Settings → Collaborators → Add. Atau hand-off lengkap dengan transfer ownership.

### Struktur Folder Repo

```
Si-Cambah/
├── src/
│   ├── App.tsx                  # Routes utama + auth gate
│   ├── components/              # Komponen UI reusable (DataTable, Modal, ChartCard, dll)
│   ├── lib/                     # Logic non-UI (Supabase client, auth context, services)
│   │   ├── supabase.ts          # Inisialisasi Supabase client
│   │   ├── authContext.tsx      # Auth state + role derivation
│   │   ├── hibahService.ts      # CRUD hibah
│   │   ├── auditLogService.ts   # Read audit log
│   │   └── ...
│   ├── pages/                   # Halaman utama (Dashboard, kategori, Login, dll)
│   └── index.css                # Tailwind + global styles
├── supabase/
│   ├── migrations/              # SQL migration (urut: 001, 002)
│   └── functions/admin-users/   # Edge Function (Deno)
├── docs/
│   ├── SETUP.md                 # Panduan setup detail
│   ├── ARCHITECTURE.md          # Penjelasan arsitektur
│   ├── MIGRATIONS.md            # Cara nulis migration baru
│   └── HANDOVER.md              # Dokumen ini
├── scripts/
│   ├── check-supabase.sh        # Verify env + DNS + koneksi
│   ├── seed-admin.sql           # Promote user jadi admin
│   └── backup-db.sh             # Backup database
└── package.json
```

---

## 9. Troubleshooting

### "Failed to fetch" saat login
**Penyebab umum**: Browser cache (loading bundle JS lama yang point ke URL Supabase yang sudah ganti).
**Fix**: Clear browsing data → Cached files & images → All time. Atau buka di Incognito.

### "Email atau password salah" padahal yakin benar
**Penyebab**:
1. User belum dikonfirmasi (waktu create user, tidak centang "Auto Confirm User")
2. Email/Password sign-in disabled di Supabase

**Fix**:
1. Supabase Authentication → Users → klik user → cek field "Email confirmed at" — kalau kosong, klik "Confirm user"
2. Authentication → Providers → Email → toggle ON

### Halaman Manajemen User error "Pastikan Edge Function admin-users sudah di-deploy"
**Penyebab**: Edge Function belum di-deploy, atau "Verify JWT" toggle masih ON.
**Fix**: Deploy ulang Edge Function (lihat Section 7 / docs/SETUP.md), pastikan "Verify JWT with legacy secret" OFF.

### Login Google → "redirect_uri_mismatch"
**Penyebab**: URL callback Supabase belum di-add ke Google Cloud OAuth Client.
**Fix**: Google Cloud → Credentials → OAuth Client → Authorized redirect URIs → add `https://seumbgunusztrbxpnrge.supabase.co/auth/v1/callback`.

### "Google hasn't verified this app" warning saat login Google
**Penyebab**: OAuth consent screen belum diverifikasi sepenuhnya oleh Google.
**Fix sederhana**: User klik "Advanced" → "Go to Si-CAMBAH (unsafe)" — aplikasi tetap aman, cuma Google belum review.
**Fix permanen**: Submit untuk verifikasi (proses 2-4 minggu, butuh domain verification).

### Vercel deploy gagal dengan "Build failed"
**Penyebab umum**:
1. TypeScript error → cek logs di Vercel
2. Env vars hilang/typo → cek Settings → Environment Variables
**Fix**: Re-deploy dengan fix dari logs. Atau rollback ke deploy terakhir yang sukses.

### Database query lambat
**Penyebab**: Banyak data + tidak ada index.
**Fix**: Supabase SQL Editor → tambahkan index di kolom yang sering di-filter:
```sql
create index hibah_kategori_idx on hibah(kategori);
create index hibah_tahun_idx on hibah((details->>'tahun'));
```

---

## 10. Limit & Cost (Free Tier)

### Supabase Free Plan
- Database: 500 MB
- Bandwidth: 5 GB/bulan
- Auth users: 50,000
- Edge Function invocations: 500K/bulan
- **Risk**: Project auto-pause kalau idle >1 minggu, auto-delete kalau paused >90 hari

**Pencegahan**: Login Supabase Dashboard minimal 1x/minggu (cukup buka, tidak harus klik). Atau upgrade ke Pro ($25/bulan) untuk no pause + daily backup.

### Vercel Hobby Plan
- Bandwidth: 100 GB/bulan
- Build minutes: 6,000/bulan
- Function executions: unlimited (di Hobby plan, fair use)
- Tidak ada auto-pause

### Google Cloud (OAuth)
- 100% gratis selama untuk OAuth login (tidak ada quota berarti untuk basic scopes)

**Estimasi total cost**: **Rp 0/bulan** selama dalam batas free tier. Untuk Bapperida (estimasi <500 user, <10K data hibah/tahun), free tier akan cukup untuk **bertahun-tahun**.

---

## 11. Kontak & Pendukung

- **Pemilik**: Moh Mujianto — `mohmujianto60@gmail.com`
- **GitHub Repo**: https://github.com/mohmujianto60-gif/Si-Cambah
- **Dokumentasi tambahan**:
  - [SETUP.md](./SETUP.md) — Panduan setup detail
  - [ARCHITECTURE.md](./ARCHITECTURE.md) — Penjelasan arsitektur teknis
  - [MIGRATIONS.md](./MIGRATIONS.md) — Cara nulis SQL migration baru
- **Supabase support**: https://supabase.com/support
- **Vercel support**: https://vercel.com/support
- **Devin (untuk pengembangan lanjut)**: https://app.devin.ai

---

## 12. Riwayat Pengembangan

Aplikasi ini dibangun dengan 9 PR di GitHub (semua sudah di-merge ke branch default `devin/initial-setup`):

| PR | Judul | Inti perubahan |
|---|---|---|
| 1 | Bug fixes & UI polish | Stabilisasi fondasi (Layout, formatting, sidebar, modal) |
| 2 | Auth Supabase | Pindah dari localStorage ke Supabase Auth (Email + Google) |
| 3 | Data Supabase + RLS | Pindah dari localStorage ke Postgres dengan RLS |
| 4 | Manajemen User | UI admin + Edge Function `admin-users` |
| 5 | Dokumentasi & DX | docs/SETUP, ARCHITECTURE, MIGRATIONS + scripts helper |
| 6 | Audit Log | Tabel audit_log + triggers + halaman /audit-log |
| 7 | Charts | Recharts (Pie/Bar/Line) + export PNG/SVG |
| 8 | Polish | Bulk actions + dark mode + PDF rekap |
| 9 | Halaman publik | /privacy, /terms, /tentang (siap publish OAuth) |

Detail per PR tersedia di tab Pull Requests di GitHub repo.

---

**Dokumen versi 1.0 — Mei 2026. Update bila ada perubahan signifikan.**
