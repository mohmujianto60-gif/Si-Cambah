export type KategoriHibah =
  | 'bansos_masyarakat'
  | 'dana_desa'
  | 'alokasi_dana_desa'
  | 'bkk'
  | 'bk_reguler'
  | 'lembaga_khusus'
  | 'lembaga_reguler'
  | 'hibah_kelompok';

export const KATEGORI_LABELS: Record<KategoriHibah, string> = {
  bansos_masyarakat: 'Bansos Masyarakat',
  dana_desa: 'Dana Desa (DD)',
  alokasi_dana_desa: 'Alokasi Dana Desa (ADD)',
  bkk: 'Bantuan Keuangan Khusus (BKK)',
  bk_reguler: 'Bantuan Keuangan Reguler',
  lembaga_khusus: 'Hibah Lembaga Khusus',
  lembaga_reguler: 'Hibah Lembaga Reguler',
  hibah_kelompok: 'Hibah Kelompok',
};

export const KATEGORI_COLORS: Record<KategoriHibah, string> = {
  bansos_masyarakat: '#06b6d4',
  dana_desa: '#10b981',
  alokasi_dana_desa: '#34d399',
  bkk: '#f59e0b',
  bk_reguler: '#fb923c',
  lembaga_khusus: '#a78bfa',
  lembaga_reguler: '#c084fc',
  hibah_kelompok: '#f43f5e',
};

export type KategoriKelompok = 'petani' | 'peternak' | 'nelayan';

export interface BaseHibah {
  id: string;
  kategori: KategoriHibah;
  tahun: number;
  keterangan: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  status: 'draft' | 'confirmed';
}

export interface BansosMasyarakat extends BaseHibah {
  kategori: 'bansos_masyarakat';
  nik: string;
  nama: string;
  alamat: string;
  bentuk_bansos: string;
  nomor_sk: string;
  opd_pelaksana: string;
}

export interface DanaDesa extends BaseHibah {
  kategori: 'dana_desa';
  nama_desa: string;
  alamat: string;
  bentuk_hibah: string;
  nomor_sk: string;
}

export interface AlokasiDanaDesa extends BaseHibah {
  kategori: 'alokasi_dana_desa';
  nama_desa: string;
  alamat: string;
  bentuk_hibah: string;
  nomor_sk: string;
}

export interface BKK extends BaseHibah {
  kategori: 'bkk';
  nama_desa: string;
  alamat: string;
  proyek_kegiatan: string;
  anggaran: number;
  asal_usulan: string;
}

export interface BKReguler extends BaseHibah {
  kategori: 'bk_reguler';
  bentuk_bk: string;
  total_anggaran: number;
  sumber_anggaran: string;
}

export interface LembagaKhusus extends BaseHibah {
  kategori: 'lembaga_khusus';
  nama_lembaga: string;
  alamat: string;
  bentuk_hibah: string;
  nomor_sk: string;
  opd_pelaksana: string;
}

export interface LembagaReguler extends BaseHibah {
  kategori: 'lembaga_reguler';
  nama_lembaga: string;
  alamat: string;
  bentuk_hibah: string;
  nomor_sk: string;
  opd_pelaksana: string;
}

export interface HibahKelompok extends BaseHibah {
  kategori: 'hibah_kelompok';
  nama_kelompok: string;
  alamat: string;
  bentuk_hibah: string;
  kategori_kelompok: KategoriKelompok;
  nomor_sk: string;
  opd_pelaksana: string;
}

export type Hibah =
  | BansosMasyarakat
  | DanaDesa
  | AlokasiDanaDesa
  | BKK
  | BKReguler
  | LembagaKhusus
  | LembagaReguler
  | HibahKelompok;

export interface Legalitas {
  id: string;
  nomor_sk: string;
  judul: string;
  tanggal: string;
  link_gdrive: string;
  keterangan: string;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'admin' | 'operator';

export interface User {
  id: string;
  email: string;
  nama: string;
  role: UserRole;
  avatar_url?: string | null;
  created_at: string;
}

export interface DuplicateWarning {
  type: 'nik' | 'nama_alamat' | 'kelompok';
  message: string;
  existingData: Hibah;
}
