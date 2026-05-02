# Hibah App - Aplikasi Pencatatan Hibah

Aplikasi web untuk mencatat dan mengelola data hibah. Dibangun dengan React, TypeScript, Tailwind CSS, dan Supabase.

## Fitur

- **Dashboard** — Ringkasan statistik hibah (total, nilai, aktif, selesai)
- **Tambah Hibah** — Form input data hibah (pemberi, penerima, jumlah, jenis, status)
- **Daftar Hibah** — Tabel/kartu dengan pencarian, filter, edit, hapus, dan detail
- **Responsif** — Tampilan optimal di desktop maupun mobile
- **Mode Offline** — Bisa digunakan tanpa Supabase (data disimpan di localStorage)

## Tech Stack

- **React** + **TypeScript** — UI framework
- **Vite** — Build tool
- **Tailwind CSS v4** — Styling
- **Supabase** — Database (PostgreSQL)
- **React Router** — Routing
- **Lucide React** — Icons
- **React Hot Toast** — Notifications

## Memulai

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Supabase (Opsional)

Jika ingin menggunakan Supabase:

1. Buat project di [supabase.com](https://supabase.com)
2. Jalankan SQL dari file `supabase-schema.sql` di SQL Editor Supabase
3. Salin file `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

4. Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` dari Settings > API di dashboard Supabase

> Tanpa konfigurasi Supabase, aplikasi tetap berjalan menggunakan localStorage.

### 3. Jalankan Aplikasi

```bash
npm run dev
```

Buka http://localhost:5173 di browser.

### 4. Build untuk Produksi

```bash
npm run build
```

## Struktur Project

```
src/
├── components/      # Komponen UI reusable
│   ├── Layout.tsx   # Layout utama dengan sidebar
│   ├── StatCard.tsx  # Kartu statistik dashboard
│   └── HibahForm.tsx # Form input/edit hibah
├── pages/           # Halaman-halaman aplikasi
│   ├── Dashboard.tsx
│   ├── TambahHibah.tsx
│   └── DaftarHibah.tsx
├── lib/             # Utilitas dan service
│   ├── supabase.ts  # Konfigurasi Supabase client
│   └── hibahService.ts # CRUD operations
├── types/           # TypeScript types
│   └── hibah.ts
├── App.tsx          # Router setup
├── main.tsx         # Entry point
└── index.css        # Tailwind CSS config
```

## License

MIT
