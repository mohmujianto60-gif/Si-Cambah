import PublicPageLayout from '../components/PublicPageLayout';

export default function Privacy() {
  return (
    <PublicPageLayout
      title="Kebijakan Privasi"
      subtitle="Terakhir diperbarui: 1 Mei 2026"
    >
      <p>
        Aplikasi <strong>Si-CAMBAH</strong> (Catatan & Manajemen Hibah)
        dikelola oleh <strong>Bapperida (Badan Perencanaan Pembangunan, Riset, dan Inovasi Daerah)</strong>{' '}
        sebagai alat bantu pencatatan internal penerima hibah dan bantuan
        keuangan. Kebijakan Privasi ini menjelaskan informasi apa yang kami
        kumpulkan, mengapa kami mengumpulkannya, dan bagaimana kami
        menggunakannya.
      </p>

      <h2>1. Lingkup Aplikasi</h2>
      <p>
        Si-CAMBAH adalah aplikasi <em>internal pemerintah daerah</em> yang
        diperuntukkan bagi staf dengan akun resmi (admin & operator). Aplikasi
        ini bukan layanan publik dan tidak dimaksudkan untuk diakses oleh
        masyarakat umum.
      </p>

      <h2>2. Data yang Kami Kumpulkan</h2>
      <p>Kami mengumpulkan dua jenis data utama:</p>

      <h3>2.1 Data Akun Pengguna (staf)</h3>
      <ul>
        <li>Nama lengkap pengguna</li>
        <li>Alamat email institusi atau email yang ditunjuk</li>
        <li>
          Peran (role): <em>admin</em> atau <em>operator</em>
        </li>
        <li>Waktu login terakhir & metadata sesi (untuk keamanan)</li>
        <li>
          Token autentikasi (bila login dengan kredensial Google, kami hanya
          menyimpan token sesi yang dikeluarkan Google — bukan password Google
          Anda)
        </li>
      </ul>

      <h3>2.2 Data Operasional (penerima hibah)</h3>
      <ul>
        <li>
          Nama, NIK, alamat, dan informasi kontak penerima bantuan/hibah yang
          dicatat dalam aplikasi
        </li>
        <li>
          Nominal anggaran, tahun anggaran, kategori bantuan, dan keterangan
          terkait
        </li>
        <li>
          Status dokumen (draft / confirmed), riwayat perubahan (audit log),
          dan identitas pengguna yang mencatat
        </li>
      </ul>
      <p>
        <strong>Data operasional bukanlah data publik.</strong> Kami
        memperlakukannya sebagai informasi yang wajib dilindungi sesuai
        ketentuan perundang-undangan tentang perlindungan data pribadi yang
        berlaku di Indonesia (termasuk UU No. 27 Tahun 2022 tentang
        Pelindungan Data Pribadi).
      </p>

      <h2>3. Bagaimana Kami Menggunakan Data</h2>
      <ul>
        <li>
          Memudahkan pencatatan, pencarian, dan pelaporan penerima hibah dan
          bantuan keuangan secara terpusat
        </li>
        <li>
          Menyediakan rekapitulasi statistik internal (per kategori, per
          tahun, per status) untuk kebutuhan perencanaan & evaluasi
        </li>
        <li>
          Menjaga akuntabilitas melalui audit log: siapa mencatat apa, kapan,
          dan perubahannya bagaimana
        </li>
        <li>
          Mengelola akses (login, reset password, peran) bagi staf yang
          berwenang
        </li>
      </ul>
      <p>
        Kami <strong>tidak</strong> menggunakan data ini untuk profiling
        komersial, iklan, atau dibagikan ke pihak ketiga di luar kebutuhan
        operasional pemerintah.
      </p>

      <h2>4. Dasar Hukum Pemrosesan</h2>
      <p>Pemrosesan data dilakukan atas dasar:</p>
      <ul>
        <li>
          Pelaksanaan tugas dalam rangka kepentingan umum oleh penyelenggara
          pemerintahan daerah
        </li>
        <li>
          Pemenuhan kewajiban hukum (pelaporan keuangan & pencatatan
          administratif)
        </li>
        <li>
          Persetujuan eksplisit dari staf pengguna saat membuat akun atau
          login pertama kali
        </li>
      </ul>

      <h2>5. Penyimpanan & Keamanan</h2>
      <ul>
        <li>
          Data disimpan di basis data Postgres yang dikelola Supabase, dengan
          enkripsi <em>at rest</em> dan <em>in transit</em> (TLS).
        </li>
        <li>
          Akses ke data diatur melalui Row Level Security (RLS): admin
          memiliki akses penuh; operator hanya bisa melihat data yang ia
          masukkan sendiri.
        </li>
        <li>
          Operasi administratif (manajemen pengguna) berjalan di server-side
          (Edge Function) sehingga kredensial sensitif tidak terekspos ke
          browser.
        </li>
        <li>
          Audit log mencatat seluruh perubahan data utama (create / update /
          delete / status change) — admin dapat menelusuri riwayat sewaktu-
          waktu.
        </li>
      </ul>

      <h2>6. Hak Subjek Data</h2>
      <p>
        Subjek data (penerima bantuan, staf) memiliki hak untuk:
      </p>
      <ul>
        <li>Meminta akses atas data pribadinya yang tercatat</li>
        <li>Meminta koreksi data yang tidak akurat</li>
        <li>
          Meminta penghapusan data (kecuali wajib disimpan untuk kepentingan
          arsip atau pelaporan keuangan)
        </li>
        <li>Mengajukan keberatan atas pemrosesan tertentu</li>
      </ul>
      <p>
        Permohonan dapat disampaikan melalui kanal resmi Bapperida (lihat
        bagian Kontak di bawah).
      </p>

      <h2>7. Retensi Data</h2>
      <p>
        Data operasional disimpan selama:
      </p>
      <ul>
        <li>Periode aktif penyaluran hibah/bantuan, dan</li>
        <li>
          Masa retensi arsip kearsipan pemerintah daerah (umumnya 5–10 tahun
          tergantung jenis dokumen).
        </li>
      </ul>
      <p>
        Data akun pengguna dapat dinonaktifkan atau dihapus oleh admin saat
        staf yang bersangkutan tidak lagi memiliki kewenangan menggunakan
        aplikasi.
      </p>

      <h2>8. Cookie & Local Storage</h2>
      <p>
        Aplikasi menggunakan <code>localStorage</code> browser hanya untuk
        menyimpan:
      </p>
      <ul>
        <li>
          Token sesi autentikasi (agar Anda tidak perlu login ulang setiap
          membuka aplikasi)
        </li>
        <li>Preferensi tema (mode gelap / terang)</li>
      </ul>
      <p>
        Kami tidak menggunakan cookie pihak ketiga, pelacak analitik, atau
        skrip iklan.
      </p>

      <h2>9. Perubahan Kebijakan</h2>
      <p>
        Kebijakan ini dapat diperbarui dari waktu ke waktu untuk
        menyesuaikan dengan perubahan regulasi atau fitur aplikasi. Versi
        terbaru akan selalu tersedia di halaman ini, dengan tanggal
        pembaruan tercantum di bagian atas.
      </p>

      <h2>10. Kontak</h2>
      <p>
        Pertanyaan, keluhan, atau permohonan terkait data pribadi dapat
        disampaikan ke:
      </p>
      <p>
        <strong>Bapperida — Sekretariat</strong>
        <br />
        Email: <em>(silakan isi dengan email resmi instansi)</em>
        <br />
        Alamat:{' '}
        <em>(silakan isi dengan alamat resmi kantor Bapperida)</em>
      </p>

      <hr />
      <p className="text-sm text-gray-500">
        Catatan: Dokumen ini merupakan template generik yang disusun untuk
        keperluan operasional Si-CAMBAH. Tim hukum/legal instansi disarankan
        meninjau ulang dan menyesuaikan kontennya dengan kebijakan internal
        masing-masing daerah sebelum dipublikasikan secara resmi.
      </p>
    </PublicPageLayout>
  );
}
