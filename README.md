# Si-CAMBAH — Sistem Catatan dan Manajemen Hibah

Aplikasi web untuk mencatat dan mengelola data hibah pemerintahan. Dibangun dengan React 19, TypeScript, Tailwind CSS v4, dan Supabase (Auth + Postgres + Edge Functions).

> **Cara mulai paling cepat:** ikuti [`docs/SETUP.md`](docs/SETUP.md) — panduan end-to-end dari clone repo sampai aplikasi siap dipakai (~25 menit).

---

## Fitur

### Autentikasi
- Login Email/Password + Google OAuth via Supabase Auth (PKCE flow)
- Forgot password & reset password via email
- Role-based access: **Admin** (full access) & **Operator** (terbatas)

### Manajemen Data
- **8 Kategori Data Hibah** — Bansos Masyarakat, Dana Desa, Alokasi Dana Desa, Bantuan Keuangan Khusus (BKK), Bantuan Keuangan Reguler, Hibah Lembaga (Khusus & Reguler), Hibah Kelompok
- **Legalitas** — Manajemen Surat Keputusan (SK) dengan preview Google Drive
- **Dashboard** — Statistik total data, kategori aktif, tahun tercatat, penerima bansos; rekap per kategori & per tahun
- **Filter Tahun & Status** di setiap kategori
- **Deteksi Duplikat** — NIK, kombinasi nama+alamat (Lembaga Reguler), kombinasi kelompok (Hibah Kelompok)
- **Import / Export** — Template Excel/CSV, Import dari Excel/CSV, Export ke Excel & PDF per kategori

### Multi-User & Data Terpusat
- Data tersimpan di **Supabase Postgres** (bukan localStorage lagi) — bisa diakses dari device manapun
- **Row Level Security (RLS)** — admin baca/tulis semua; operator hanya yang dia buat sendiri
- **Helper Import dari localStorage** — kalau ada data legacy di browser, bisa di-push ke Postgres sekali tekan

### Manajemen User (admin-only)
- List semua user dari Supabase Auth
- Tambah user baru (email + password + role + nama)
- Edit role admin↔operator, ubah nama, ganti password
- Kirim email reset password ke user lain
- Hapus user (dengan self-protection: admin tidak bisa hapus diri sendiri)

---

## Tech Stack

- **React 19** + **TypeScript** — UI framework
- **Vite 8** — Build tool
- **Tailwind CSS v4** — Styling (token-based theming)
- **React Router v7** (HashRouter) — Routing
- **Supabase JS v2** — Auth (PKCE flow) + Postgres queries + Edge Function invoke
- **Lucide React** — Icon set
- **React Hot Toast** — Notifications
- **xlsx**, **jsPDF + jspdf-autotable** — Export Excel & PDF
- **Deno** — Runtime untuk Edge Function `admin-users`

---

## Memulai

### Cara cepat

```bash
# 1. Clone & install
git clone https://github.com/mohmujianto60-gif/Si-Cambah.git
cd Si-Cambah
npm install

# 2. Setup env
cp .env.example .env
# edit .env, isi VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY

# 3. Run
npm run dev
```

**Tapi sebelum app jalan, kamu perlu Supabase project + run SQL migration + bikin admin pertama.** Ikuti [`docs/SETUP.md`](docs/SETUP.md) untuk panduan lengkap.

### Build untuk produksi

```bash
npm run build       # output ke dist/
npm run preview     # serve dist/ di localhost:4173 untuk smoke test
```

### Lint & type-check

```bash
npm run lint        # ESLint
npm run build       # vite build sekaligus type-check via tsc -b
```

---

## Dokumentasi

- [`docs/SETUP.md`](docs/SETUP.md) — Panduan setup end-to-end (Supabase, Auth, env vars, deploy Edge Function)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Arsitektur app, data model, RLS, Edge Function design
- [`docs/MIGRATIONS.md`](docs/MIGRATIONS.md) — Cara menjalankan dan menulis SQL migration
- [`supabase/functions/admin-users/README.md`](supabase/functions/admin-users/README.md) — Detail Edge Function `admin-users`

---

## Struktur Project

```
Si-Cambah/
├── docs/                          # Dokumentasi
│   ├── SETUP.md                       # Panduan setup end-to-end
│   ├── ARCHITECTURE.md                # Penjelasan arsitektur
│   └── MIGRATIONS.md                  # Panduan SQL migration
├── scripts/                       # Helper scripts
│   ├── check-supabase.sh              # Verifikasi env vars & koneksi Supabase
│   ├── seed-admin.sql                 # SQL untuk set role admin di user metadata
│   └── backup-db.sh                   # Dump database via Supabase CLI
├── src/
│   ├── components/                # Komponen UI reusable
│   │   ├── Layout.tsx                 # Sidebar + main wrapper
│   │   ├── DataTable.tsx              # Tabel data dengan search, filter, export
│   │   ├── Modal.tsx                  # Modal generik (ESC + backdrop close)
│   │   ├── MigrationModal.tsx         # Import data dari localStorage ke Supabase
│   │   └── ...
│   ├── pages/                     # Halaman aplikasi
│   │   ├── Login.tsx                  # Email/Password + Google OAuth + Forgot Password
│   │   ├── ResetPassword.tsx          # Halaman reset password (dari email link)
│   │   ├── Dashboard.tsx              # Dashboard stats & rekap
│   │   ├── BansosMasyarakat.tsx       # Halaman kategori spesifik
│   │   ├── BKK.tsx, BKReguler.tsx     # ...
│   │   ├── GenericHibahPage.tsx       # Template halaman untuk 5 kategori lain
│   │   ├── Legalitas.tsx              # Manajemen SK
│   │   └── ManajemenUser.tsx          # Halaman admin-only kelola Supabase users
│   ├── lib/
│   │   ├── authContext.tsx            # AuthProvider (Supabase session)
│   │   ├── useAuth.ts                 # useAuth hook + AuthContext types
│   │   ├── supabase.ts                # Supabase client (PKCE flow)
│   │   ├── hibahService.ts            # CRUD operations (Supabase Postgres)
│   │   ├── migrateLocalStorage.ts     # Migrasi data lama dari localStorage
│   │   ├── userManagementService.ts   # Invoke Edge Function admin-users
│   │   ├── useAsyncData.ts            # Hook generik untuk loading + error states
│   │   ├── exportUtils.ts             # Export Excel & PDF, template downloader
│   │   └── format.ts                  # Util format Rupiah, tanggal
│   ├── types/
│   │   └── hibah.ts                   # TypeScript types (kategori, status, dll)
│   ├── App.tsx                        # Router + auth gate
│   ├── main.tsx                       # Entry point
│   └── index.css                      # Tailwind theme & global style
├── supabase/
│   ├── migrations/
│   │   └── 001_hibah_schema.sql       # Tabel hibah + legalitas + RLS policies
│   └── functions/
│       └── admin-users/
│           ├── index.ts               # Edge Function (Deno) wrap Supabase Admin Auth API
│           └── README.md              # Deploy instructions
├── .env.example                       # Template env vars
├── package.json
└── README.md                          # File ini
```

---

## Roadmap

- [x] PR 1 — Bug fixes & UI polish
- [x] PR 2 — Migrasi auth ke Supabase (Email/Password + Google OAuth)
- [x] PR 3 — Migrasi data ke Supabase Postgres + RLS
- [x] PR 4 — Manajemen User (admin-only UI)
- [ ] PR 5 — Audit log (siapa/aksi/kapan/before-after) dengan trigger Postgres
- [ ] PR 6 — Charts asli (Recharts) di Dashboard
- [ ] PR 7 — Polish lain: dark mode, bulk actions, export PDF rekap, filter tahun di Dashboard
- [ ] PR 8 — Privacy policy + Terms + halaman Tentang (untuk go-public)

---

## Kontribusi

Pull request welcome. Untuk perubahan besar, buka issue dulu untuk diskusi.

Sebelum push:

```bash
npm run lint     # harus exit 0
npm run build    # harus exit 0
```

---

## License

MIT
