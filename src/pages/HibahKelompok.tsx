import GenericHibahPage from './GenericHibahPage';

export default function HibahKelompokPage() {
  return (
    <GenericHibahPage
      kategori="hibah_kelompok"
      title="Hibah Kelompok"
      subtitle="Data hibah kelompok (Petani / Peternak / Nelayan)"
      fields={[
        { name: 'nama_kelompok', label: 'Nama Kelompok', required: true, placeholder: 'Nama kelompok' },
        { name: 'alamat', label: 'Alamat', required: true, placeholder: 'Alamat kelompok', colSpan: 2 },
        { name: 'bentuk_hibah', label: 'Bentuk Hibah', required: true, placeholder: 'Jenis hibah' },
        {
          name: 'kategori_kelompok', label: 'Kategori', type: 'select', required: true,
          options: [
            { value: '', label: '-- Pilih Kategori --' },
            { value: 'petani', label: 'Petani' },
            { value: 'peternak', label: 'Peternak' },
            { value: 'nelayan', label: 'Nelayan' },
          ],
        },
        { name: 'nomor_sk', label: 'No. SK', placeholder: 'Nomor surat keputusan' },
        { name: 'opd_pelaksana', label: 'OPD Pelaksana', placeholder: 'Nama OPD' },
        { name: 'tahun', label: 'Tahun', type: 'number', required: true },
        { name: 'keterangan', label: 'Keterangan', type: 'textarea', placeholder: 'Catatan tambahan' },
      ]}
      searchPlaceholder="Cari berdasarkan nama kelompok, alamat, atau kategori..."
    />
  );
}
