import PublicPageLayout from '../components/PublicPageLayout';
import {
  ShieldCheck,
  Database,
  History,
  Users,
  BarChart3,
  FileText,
} from 'lucide-react';

interface Feature {
  title: string;
  desc: string;
  icon: typeof ShieldCheck;
}

const features: Feature[] = [
  {
    title: 'Pencatatan terpusat',
    desc: 'Satu basis data untuk semua kategori hibah: bansos masyarakat, dana desa, ADD, bantuan keuangan khusus & reguler, hibah lembaga, hibah kelompok, dan legalitas.',
    icon: Database,
  },
  {
    title: 'Multi-pengguna dengan peran',
    desc: 'Admin mengelola seluruh data; operator hanya melihat dan mengelola data yang ia masukkan. Pemisahan akses berbasis Row Level Security di basis data.',
    icon: Users,
  },
  {
    title: 'Dashboard & statistik',
    desc: 'Ringkasan jumlah penerima per kategori, tren tahunan, dan distribusi anggaran. Bisa diunduh sebagai rekap PDF.',
    icon: BarChart3,
  },
  {
    title: 'Audit log',
    desc: 'Setiap perubahan tercatat otomatis: siapa, kapan, apa yang berubah. Admin dapat menelusuri riwayat data sewaktu-waktu.',
    icon: History,
  },
  {
    title: 'Ekspor data',
    desc: 'Data setiap kategori dapat diekspor ke Excel sebagai laporan atau backup, dan template Excel disediakan untuk impor data baru.',
    icon: FileText,
  },
  {
    title: 'Keamanan',
    desc: 'Autentikasi email & Google. Token sesi terenkripsi. Operasi administratif berjalan di server (Edge Function) sehingga kredensial sensitif tidak terekspos ke browser.',
    icon: ShieldCheck,
  },
];

export default function Tentang() {
  return (
    <PublicPageLayout
      title="Tentang Si-CAMBAH"
      subtitle="Catatan & Manajemen Hibah — Bapperida"
    >
      <p>
        <strong>Si-CAMBAH</strong> (akronim dari{' '}
        <em>Sistem Catatan & Manajemen Hibah</em>) adalah aplikasi internal
        yang dikelola oleh{' '}
        <strong>
          Bapperida — Badan Perencanaan Pembangunan, Riset, dan Inovasi
          Daerah
        </strong>
        . Aplikasi ini membantu staf mencatat, mengelola, dan merekapitulasi
        data penerima hibah serta bantuan keuangan secara terpusat dan
        akuntabel.
      </p>

      <h2>Tujuan</h2>
      <ul>
        <li>
          Mengganti pencatatan manual berbasis berkas Excel dan kertas dengan
          sistem digital terstruktur.
        </li>
        <li>
          Mendukung pelaporan kepada pimpinan, auditor, dan publik dengan
          data yang akurat & dapat ditelusuri.
        </li>
        <li>
          Memberikan dasar yang konsisten untuk perencanaan anggaran tahun
          berikutnya.
        </li>
        <li>
          Menjamin akuntabilitas penyaluran bantuan melalui audit log dan
          pembagian peran yang ketat.
        </li>
      </ul>

      <h2>Fitur Utama</h2>
      <div className="not-prose grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-sm p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-white" />
                </span>
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm mb-1">
                    {f.title}
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <h2>Teknologi</h2>
      <p>
        Si-CAMBAH dibangun dengan teknologi modern berbasis web:
      </p>
      <ul>
        <li>
          <strong>Frontend</strong>: React + TypeScript + Tailwind CSS +
          Recharts.
        </li>
        <li>
          <strong>Backend</strong>: Supabase (Postgres + Auth + Edge
          Functions) — kelola sendiri, data tersimpan di server yang
          dikendalikan instansi.
        </li>
        <li>
          <strong>Keamanan</strong>: TLS untuk seluruh komunikasi, Row
          Level Security di basis data, dan Edge Function untuk operasi
          administratif.
        </li>
      </ul>

      <h2>Lisensi & Sumber Terbuka</h2>
      <p>
        Kode sumber aplikasi dikelola di repositori internal instansi.
        Aplikasi ini tidak diperjualbelikan; pemanfaatan oleh instansi
        pemerintah daerah lain dimungkinkan dengan koordinasi tim
        Bapperida.
      </p>

      <h2>Kontak & Saran</h2>
      <p>
        Saran perbaikan, laporan bug, atau pertanyaan teknis dapat
        disampaikan melalui:
      </p>
      <p>
        <strong>Bapperida — Tim Sistem Informasi</strong>
        <br />
        Email: <em>(silakan isi dengan email tim TI Bapperida)</em>
        <br />
        Alamat:{' '}
        <em>(silakan isi dengan alamat resmi kantor Bapperida)</em>
      </p>

      <hr />
      <p className="text-sm text-gray-500">
        Catatan: Halaman ini merupakan template generik. Sesuaikan
        identitas instansi, email, dan deskripsi sesuai kebutuhan masing-
        masing daerah.
      </p>
    </PublicPageLayout>
  );
}
