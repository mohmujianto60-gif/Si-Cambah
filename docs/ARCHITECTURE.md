# Si-CAMBAH — Arsitektur

Dokumen ini menjelaskan keputusan-keputusan arsitektur dan pola-pola yang dipakai di Si-CAMBAH.

---

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       Browser (React)                       │
│                                                             │
│   ┌──────────────┐    ┌──────────────┐   ┌──────────────┐   │
│   │ Auth (login) │    │  Data Pages  │   │ ManajemenUser│   │
│   │              │    │              │   │  (admin)     │   │
│   └──────┬───────┘    └──────┬───────┘   └──────┬───────┘   │
│          │                   │                  │           │
│          ▼                   ▼                  ▼           │
│   ┌─────────────────────────────────────────────────────┐   │
│   │     supabase.ts (Supabase JS client, PKCE flow)     │   │
│   └────────────┬────────────────────────┬───────────────┘   │
└────────────────│────────────────────────│───────────────────┘
                 │                        │
                 │ HTTPS                  │ HTTPS
                 ▼                        ▼
┌─────────────────────────────────────────────────────────────┐
│                         Supabase                            │
│                                                             │
│   ┌──────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│   │  Auth        │  │  Postgres        │  │ Edge Function│  │
│   │  (JWT,       │  │  (hibah,         │  │ admin-users  │  │
│   │   metadata)  │  │   legalitas,     │  │ (Deno)       │  │
│   │              │  │   RLS policies)  │  │              │  │
│   └──────────────┘  └──────────────────┘  └──────┬───────┘  │
│                                                  │          │
│                              ┌───────────────────▼───────┐  │
│                              │ Admin Auth API            │  │
│                              │ (service_role, internal)  │  │
│                              └───────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Frontend

### Stack

- **React 19** + **TypeScript (strict)**
- **Vite 8** sebagai build tool
- **Tailwind CSS v4** (token-based theming via CSS custom properties di `src/index.css`)
- **React Router v7** dengan `HashRouter` — pakai hash routing supaya tidak perlu konfigurasi rewrite di hosting statis

### Auth flow

- `src/lib/supabase.ts` — Singleton Supabase client dengan **PKCE flow** untuk OAuth (lebih aman daripada implicit flow)
- `src/lib/authContext.tsx` — `AuthProvider` yang subscribe ke `supabase.auth.onAuthStateChange`, expose `user`, `session`, `isAdmin`, `signIn`, `signOut`
- `src/lib/useAuth.ts` — Hook `useAuth()` + tipe-tipe (`AuthUser`, `Role`)
- `App.tsx` — Auth gate: kalau belum login → `<Login />`; kalau ada session recovery (dari reset password link) → `<ResetPassword />`; lainnya → `<Layout />` + routes

### Role-based access

User Supabase punya `user_metadata.role` — string `"admin"` atau `"operator"` (atau `null` → diperlakukan sebagai operator).

- Sidebar nav item bisa di-flag `adminOnly: true` → filter di `Layout.tsx`
- Halaman `ManajemenUser` check `useAuth().isAdmin` di top-level, return panel "Akses Ditolak" kalau bukan admin
- **Tapi** UI gate ini cuma kosmetik — security beneran ada di **RLS policies di Postgres** dan **JWT check di Edge Function**

### State management

- **Tidak pakai library state management** (Redux, Zustand, dll) — overkill untuk app size ini
- **Async data fetching** pakai custom hook `useAsyncData<T>` di `src/lib/useAsyncData.ts` — return `{ data, loading, error, reload }`
- **Toast notifications** pakai `react-hot-toast`

---

## Data Model

### Pendekatan: **single table + JSONB**

Daripada bikin 9 tabel terpisah untuk setiap kategori (Bansos, BKK, DD, dll), kita pakai **1 tabel `hibah`** dengan kolom `kategori` (enum-like text) dan kolom `details` (JSONB) untuk field spesifik.

**Kenapa single table?**

| Aspek | Single table + JSONB | 9 tabel terpisah |
|---|---|---|
| RLS policies | 1 set policies untuk `hibah` (read/write/delete) | 9x policies, identik tapi harus duplicate |
| Dashboard "total per kategori" | 1 query `select kategori, count(*) from hibah group by kategori` | UNION 9 SELECT, slow + verbose |
| Tambah kategori baru | Tambah string baru di TS enum + label di Sidebar | Bikin tabel baru + RLS + types + form |
| Type safety di frontend | Diskriminasi via field `kategori`, tipe per kategori tetap aman | Strong typing per tabel |
| Schema validation di DB | Limited (JSONB tidak strict) | Strong (column-level types) |

Trade-off type safety di DB worth it untuk kesederhanaan operasional.

### Tabel `hibah`

```sql
create table hibah (
  id uuid primary key default gen_random_uuid(),
  kategori text not null check (kategori in (
    'bansos_masyarakat', 'dana_desa', 'alokasi_dana_desa',
    'bantuan_keuangan_khusus', 'bantuan_keuangan_reguler',
    'hibah_lembaga_khusus', 'hibah_lembaga_reguler', 'hibah_kelompok'
  )),
  tahun integer not null,
  keterangan text,
  status text not null default 'draft' check (status in ('draft', 'dikonfirmasi')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);
```

Index: `(kategori, tahun)`, `(created_by)`, GIN on `details` untuk search dalam JSONB.

### Tabel `legalitas`

Terpisah karena struktur beda jauh (SK dengan tahun, nomor SK, URL Drive, dll). Detail lihat `supabase/migrations/001_hibah_schema.sql`.

### Row Level Security (RLS)

Aktif di kedua tabel. Policies (per tabel):

```sql
-- SELECT: admin = all rows; operator = rows they created
create policy "hibah_select" on hibah for select using (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  or created_by = auth.uid()
);

-- INSERT: any authenticated user, but created_by harus auth.uid()
create policy "hibah_insert" on hibah for insert with check (
  auth.uid() is not null and created_by = auth.uid()
);

-- UPDATE: admin = any row; operator = only their own
create policy "hibah_update" on hibah for update using (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  or created_by = auth.uid()
);

-- DELETE: admin only
create policy "hibah_delete" on hibah for delete using (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);
```

**Penting:** RLS check di Postgres berdasarkan JWT yang dikirim frontend. Anon key punya JWT minimal, authenticated user punya JWT dengan claims termasuk `user_metadata`. RLS otomatis enforce ini — frontend tidak bisa bypass.

### Helper migrasi `localStorage` → Postgres

`src/lib/migrateLocalStorage.ts` — kalau ada data lama di localStorage dari versi PR <3, admin bisa klik tombol "Import data lokal" di sidebar → batch insert ke Postgres → clear localStorage.

---

## Edge Function `admin-users`

### Kenapa butuh Edge Function?

Operasi Manajemen User (list semua user, ubah role, hapus user) butuh **service_role key** Supabase — full-power admin key. Kalau service_role key disimpan di frontend, siapapun bisa hapus data semua user.

**Solusi**: jalankan operasi admin di server-side (Deno Edge Function), service_role key di-inject otomatis oleh Supabase ke runtime function. Frontend cuma kirim user JWT (anon) ke function.

### Authorization

Function ini di-deploy dengan `--no-verify-jwt` (Supabase tidak validate JWT secara otomatis), tapi function **manual verifikasi**:

1. Baca header `Authorization: Bearer <user-jwt>`
2. Decode JWT (cuma payload, signature tidak di-verify karena Supabase auth sudah validasi sebelumnya untuk anon access)
3. Cek `user_metadata.role` === `'admin'`
4. Kalau bukan admin → return `403 Forbidden`
5. Kalau admin → execute pakai admin Supabase client (service_role)

### Self-protection

- Admin **tidak bisa demote diri sendiri** (`user.id === caller.id && newRole !== 'admin'` → 400)
- Admin **tidak bisa delete diri sendiri** (`user.id === caller.id` di DELETE → 400)

### Endpoints

| Method | Path | Action |
|---|---|---|
| `GET` | `/admin-users` | List semua user (mapped: id, email, nama, role, created_at, last_sign_in_at, email_confirmed_at, provider) |
| `POST` | `/admin-users` | Create user `{ email, password, role, nama }` |
| `PATCH` | `/admin-users/:id` | Update `{ role?, nama?, password? }` |
| `DELETE` | `/admin-users/:id` | Hapus user |
| `POST` | `/admin-users/:id/reset` | Kirim password reset email |

Frontend invoke via `supabase.functions.invoke('admin-users', { method, body })` di `src/lib/userManagementService.ts`.

---

## Build & Deploy

### Build

```bash
npm run build
```

Output: `dist/` — static files (HTML + JS + CSS). Tidak ada server-side rendering, semua client-side.

### Deploy frontend

Frontend bisa di-deploy ke hosting statis manapun:
- **Devin** (auto-deploy via tooling)
- **Vercel** / **Netlify** / **Cloudflare Pages** — connect GitHub repo, set env vars, auto-build
- **GitHub Pages** — perlu `vite.config.ts` adjust `base` path
- **S3 + CloudFront** — manual upload `dist/`

Env vars yang perlu di-set di platform deploy:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Deploy Edge Function

Lihat [`supabase/functions/admin-users/README.md`](../supabase/functions/admin-users/README.md).

---

## Keputusan yang dipertimbangkan tapi tidak dipakai

### Mengapa **HashRouter**, bukan **BrowserRouter**?

HashRouter pakai URL fragment (`/#/dashboard`) → tidak butuh server-side rewrite untuk SPA routing. Cocok untuk hosting statis sederhana. Trade-off: URL agak jelek, SEO kurang ramah (tapi app ini private, tidak butuh SEO).

### Mengapa **PKCE flow**, bukan **implicit flow**?

PKCE lebih aman untuk SPA — tidak ada access token di URL fragment, tidak bocor di history browser, lebih tahan XSS. Supabase JS v2 default pakai implicit, kita switch ke PKCE di `supabase.ts`.

### Mengapa **bukan service_role key di env**?

Service_role key bypass RLS — kalau bocor (mis. lewat XSS, atau commit ke git, atau di-extract dari bundle), siapapun bisa hapus/baca data semua user. Kita pakai pendekatan **anon key di frontend + Edge Function untuk admin ops** supaya service_role tidak pernah keluar dari Supabase backend.

### Mengapa **bukan TanStack Query / SWR**?

App ini relatif sederhana — kebanyakan fetch sekali pas page load. Custom hook `useAsyncData` cukup dan tidak nambah bundle size. Kalau nanti app lebih kompleks (banyak invalidation logic, caching, dll), bisa migrate ke TanStack Query.

### Mengapa **bukan Prisma / Drizzle ORM**?

Supabase JS client sudah cukup untuk query Postgres (`supabase.from('hibah').select()...`). ORM untuk app size segini overkill, dan ORM tidak otomatis taat RLS — perlu wrapper tambahan.

---

## Pola yang dipakai berulang

### Async data loading pattern

```typescript
const { data, loading, error, reload } = useAsyncData(async () => {
  return await hibahService.list({ kategori: 'bansos_masyarakat' });
});

if (loading) return <Skeleton />;
if (error) return <ErrorPanel error={error} onRetry={reload} />;
return <DataTable rows={data} />;
```

### Service layer pattern

Setiap modul fitur punya `*Service.ts` di `src/lib/`:
- `hibahService.ts` — CRUD untuk tabel `hibah` + `legalitas`
- `userManagementService.ts` — Wrapper invoke Edge Function `admin-users`

Service functions selalu async, return clean data atau throw `Error` dengan message yang user-friendly. UI cukup pakai try/catch atau `useAsyncData` untuk handle.

### Modal pattern

`src/components/Modal.tsx` — modal generik dengan ESC + backdrop close, fokus trap, accessibility (aria-modal, role=dialog). Setiap form (create/edit/delete) pakai modal ini.

---

## Catatan keamanan

1. **Service_role key tidak pernah ada di frontend** — disimpan di Supabase backend, di-inject ke Edge Function via env var
2. **Anon key boleh public** — tidak bisa bypass RLS, cuma izinkan akses sesuai policies
3. **JWT validation di Edge Function** — admin-users function manual cek `role: admin` di JWT payload
4. **Self-protection di backend** — admin tidak bisa demote/delete diri sendiri (mencegah lockout)
5. **HTTPS required** — Supabase + hosting deploy harus HTTPS, jangan deploy HTTP untuk produksi
6. **Password requirements** — minimum di Supabase Auth settings (default 6 char, recommend naikkan ke 8+)
