-- ============================================
-- Schema untuk Aplikasi Pencatatan Hibah
-- Jalankan SQL ini di Supabase SQL Editor
-- ============================================

-- Buat tabel hibah
CREATE TABLE IF NOT EXISTS hibah (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pemberi TEXT NOT NULL,
  penerima TEXT NOT NULL,
  jumlah NUMERIC NOT NULL DEFAULT 0,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  keterangan TEXT DEFAULT '',
  jenis_hibah TEXT NOT NULL DEFAULT 'uang' CHECK (jenis_hibah IN ('uang', 'barang', 'tanah', 'lainnya')),
  status TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'selesai', 'dibatalkan')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aktifkan Row Level Security (RLS)
ALTER TABLE hibah ENABLE ROW LEVEL SECURITY;

-- Policy: Izinkan semua operasi untuk pengguna anonim (untuk development)
-- CATATAN: Untuk produksi, sesuaikan policy ini dengan kebutuhan autentikasi
CREATE POLICY "Allow all operations" ON hibah
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index untuk performa pencarian
CREATE INDEX IF NOT EXISTS idx_hibah_pemberi ON hibah (pemberi);
CREATE INDEX IF NOT EXISTS idx_hibah_penerima ON hibah (penerima);
CREATE INDEX IF NOT EXISTS idx_hibah_status ON hibah (status);
CREATE INDEX IF NOT EXISTS idx_hibah_created_at ON hibah (created_at DESC);
