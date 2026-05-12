# Si-CAMBAH — Sistem Catatan dan Manajemen Hibah

Aplikasi web untuk mencatat dan mengelola data hibah pemerintahan. Dibangun dengan React, TypeScript, Tailwind CSS v4, dan opsional Supabase.

## Fitur

- **Dashboard** — Ringkasan statistik (total data, kategori aktif, tahun tercatat, penerima bansos), rekap per kategori, rekap per tahun.
- **8 Kategori Data Hibah** — Bansos Masyarakat, Bantuan Keuangan (Dana Desa, Alokasi Dana Desa, BKK, BK Reguler), Hibah Lembaga (Khusus & Reguler), Hibah Kelompok.
- **Legalitas** — Manajemen Surat Keputusan (SK) dengan preview Google Drive.
- **Role Admin & Operator** — Operator hanya input/draft & konfirmasi, Admin bisa edit, hapus, dan revert status.
- **Import / Export** — Setiap kategori punya tombol Unduh Template, Import Excel/CSV, Export ke Excel & PDF.
- **Filter Tahun** — Filter per kategori berdasarkan tahun.
- **Deteksi Duplikat** — Peringatan otomatis untuk NIK Bansos, kombinasi nama+alamat (Lembaga Reguler), dan kombinasi kelompok (Hibah Kelompok).
- **Mode Offline** — Berjalan di localStorage tanpa Supabase.

## Tech Stack

- **React 19** + **TypeScript** — UI framework
- **Vite 8** — Build tool
- **Tailwind CSS v4** — Styling
- **React Router v7** (HashRouter) — Routing
- **Lucide React** — Icons
- **React Hot Toast** — Notifications
- **xlsx**, **jsPDF + jspdf-autotable** — Export Excel & PDF
- **Supabase** — Database (opsional)

## Login

| Role     | Username | Password    |
| -------- | -------- | ----------- |
| Admin    | admin    | admin123    |
| Operator | operator | operator123 |

> Akun di atas dibuat otomatis saat aplikasi pertama dijalankan. Ganti password lewat menu User Management (rilis berikutnya) untuk produksi.

## Memulai

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Supabase (Opsional)

Tanpa Supabase, aplikasi tetap berjalan menggunakan localStorage browser.

Jika ingin pakai Supabase:

1. Buat project di [supabase.com](https://supabase.com).
2. Jalankan `supabase-schema.sql` di SQL Editor (catatan: schema saat ini masih versi awal — akan di-update saat integrasi Supabase Auth).
3. Salin `.env.example` menjadi `.env`:

   ```bash
   cp .env.example .env
   ```

4. Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` dari **Settings → API**.

### 3. Jalankan Aplikasi

```bash
npm run dev
```

Buka http://localhost:5173 di browser.

### 4. Build untuk Produksi

```bash
npm run build
npm run preview   # preview hasil build
```

## Struktur Project

```
src/
├── components/      # Komponen UI reusable
│   ├── Layout.tsx       # Sidebar + main wrapper
│   ├── DataTable.tsx    # Tabel data dengan search, filter tahun, export
│   ├── Modal.tsx        # Modal generik
│   ├── ImportModal.tsx  # Import Excel/CSV
│   └── StatCard.tsx     # Kartu statistik dashboard
├── pages/           # Halaman-halaman aplikasi
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── BansosMasyarakat.tsx
│   ├── DanaDesa.tsx
│   ├── AlokasiDanaDesa.tsx
│   ├── BKK.tsx
│   ├── BKReguler.tsx
│   ├── LembagaKhusus.tsx
│   ├── LembagaReguler.tsx
│   ├── HibahKelompok.tsx
│   ├── Legalitas.tsx
│   └── GenericHibahPage.tsx   # Komponen generic untuk kategori sederhana
├── lib/
│   ├── authContext.tsx  # AuthProvider
│   ├── useAuth.ts       # useAuth hook + AuthContext
│   ├── hibahService.ts  # CRUD operations (localStorage)
│   ├── exportUtils.ts   # Export Excel & PDF, template downloader
│   ├── format.ts        # Util format Rupiah, tanggal, dsb
│   └── supabase.ts      # Supabase client (opsional)
├── types/
│   └── hibah.ts         # TypeScript types
├── App.tsx              # Router setup
├── main.tsx             # Entry point
└── index.css            # Tailwind theme & global style
```

## Roadmap

- [ ] Migrasi auth ke Supabase Auth (Email/Password + Google OAuth)
- [ ] User Management (admin-only)
- [ ] Audit log
- [ ] Dark mode toggle
- [ ] Bulk actions (delete/confirm batch)
- [ ] Filter status (draft/confirmed)
- [ ] Backup & restore data ke file JSON

## License

MIT
