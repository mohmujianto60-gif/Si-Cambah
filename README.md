# Si-CAMBAH — Sistem Catatan dan Manajemen Hibah

Aplikasi web untuk mencatat dan mengelola data hibah pemerintahan. Dibangun dengan React, TypeScript, Tailwind CSS v4, dan Supabase Auth.

## Fitur

- **Autentikasi via Supabase Auth** — Login Email/Password + Google OAuth, lengkap dengan flow lupa password & reset password via email.
- **Dashboard** — Ringkasan statistik (total data, kategori aktif, tahun tercatat, penerima bansos), rekap per kategori, rekap per tahun.
- **8 Kategori Data Hibah** — Bansos Masyarakat, Bantuan Keuangan (Dana Desa, Alokasi Dana Desa, BKK, BK Reguler), Hibah Lembaga (Khusus & Reguler), Hibah Kelompok.
- **Legalitas** — Manajemen Surat Keputusan (SK) dengan preview Google Drive.
- **Role Admin & Operator** — Operator input/draft & konfirmasi, Admin bisa edit, hapus, dan revert status.
- **Import / Export** — Tombol Unduh Template, Import Excel/CSV, Export ke Excel & PDF per kategori.
- **Filter Tahun & Status** — Filter setiap kategori berdasarkan tahun & status (draft / dikonfirmasi).
- **Deteksi Duplikat** — Peringatan otomatis untuk NIK, kombinasi nama+alamat (Lembaga Reguler), dan kombinasi kelompok (Hibah Kelompok).

## Tech Stack

- **React 19** + **TypeScript** — UI framework
- **Vite 8** — Build tool
- **Tailwind CSS v4** — Styling
- **React Router v7** (HashRouter) — Routing
- **Supabase JS v2** — Auth (PKCE flow) & database
- **Lucide React** — Icons
- **React Hot Toast** — Notifications
- **xlsx**, **jsPDF + jspdf-autotable** — Export Excel & PDF

## Memulai

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Supabase (Wajib)

1. Buat project di [supabase.com](https://supabase.com).
2. Salin `.env.example` menjadi `.env`:

   ```bash
   cp .env.example .env
   ```

3. Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` dari **Settings → API**.

### 3. Aktifkan Provider Auth di Supabase

#### Email / Password

- Dashboard Supabase → **Authentication → Providers → Email** → pastikan `Enabled`.
- Untuk development, matikan `Confirm email` agar tidak perlu verifikasi tiap user baru.

#### Google OAuth (opsional, rekomendasi)

1. Buat OAuth Client di [Google Cloud Console](https://console.cloud.google.com):
   - **APIs & Services → OAuth consent screen** → setup `External` user type, isi `App name`, scopes `openid`, `userinfo.email`, `userinfo.profile`, dan tambahkan email staf sebagai `Test users`.
   - **APIs & Services → Credentials → Create OAuth client ID** → `Web application`.
   - Pada **Authorized redirect URIs**, paste URL `Callback URL (for OAuth)` yang ada di Supabase **Authentication → Providers → Google**.
2. Salin `Client ID` & `Client Secret` ke Supabase **Authentication → Providers → Google**, aktifkan toggle, simpan.

### 4. Buat Akun Admin Pertama

1. Dashboard Supabase → **Authentication → Users → Add user → Create new user**.
2. Isi email & password, tandai `Auto Confirm User`.
3. Klik user → **User metadata** → set `{ "role": "admin", "nama": "Nama Lengkap" }`.

User tanpa metadata `role=admin` otomatis berperan sebagai `operator`.

### 5. Jalankan Aplikasi

```bash
npm run dev
```

Buka http://localhost:5173 di browser.

### 6. Build untuk Produksi

```bash
npm run build
npm run preview   # preview hasil build
```

## Struktur Project

```
src/
├── components/      # Komponen UI reusable
│   ├── Layout.tsx       # Sidebar + main wrapper
│   ├── DataTable.tsx    # Tabel data dengan search, filter, export
│   ├── Modal.tsx        # Modal generik (ESC + backdrop close)
│   ├── ImportModal.tsx  # Import Excel/CSV
│   └── StatCard.tsx     # Kartu statistik dashboard
├── pages/           # Halaman aplikasi
│   ├── Login.tsx        # Email/Password + Google OAuth + Forgot Password
│   ├── ResetPassword.tsx
│   ├── Dashboard.tsx
│   ├── Bansos|DanaDesa|AlokasiDanaDesa|BKK|BKReguler|LembagaKhusus|LembagaReguler|HibahKelompok|Legalitas
│   └── GenericHibahPage.tsx
├── lib/
│   ├── authContext.tsx  # AuthProvider (Supabase)
│   ├── useAuth.ts       # useAuth hook + AuthContext + types
│   ├── supabase.ts      # Supabase client (PKCE flow)
│   ├── hibahService.ts  # CRUD operations (localStorage)
│   ├── exportUtils.ts   # Export Excel & PDF, template downloader
│   └── format.ts        # Util format Rupiah, tanggal
├── types/
│   └── hibah.ts         # TypeScript types
├── App.tsx              # Router + auth gate
├── main.tsx             # Entry point
└── index.css            # Tailwind theme & global style
```

## Roadmap

- [x] Migrasi auth ke Supabase Auth (Email/Password + Google OAuth)
- [ ] Migrasi data hibah dari localStorage ke Supabase Postgres + Row Level Security
- [ ] User Management (admin-only)
- [ ] Audit log
- [ ] Dark mode toggle
- [ ] Bulk actions (delete/confirm batch)
- [ ] Backup & restore data ke file JSON

## License

MIT
