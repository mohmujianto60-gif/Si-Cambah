import GenericHibahPage from './GenericHibahPage';

export default function BKKPage() {
  return (
    <GenericHibahPage
      kategori="bkk"
      title="Bantuan Keuangan Khusus (BKK)"
      subtitle="Data Bantuan Keuangan Khusus"
      fields={[
        { name: 'nama_desa', label: 'Nama Desa', required: true, placeholder: 'Nama desa' },
        { name: 'alamat', label: 'Alamat', required: true, placeholder: 'Kecamatan / Kabupaten', colSpan: 2 },
        { name: 'proyek_kegiatan', label: 'Proyek/Kegiatan', required: true, placeholder: 'Nama proyek atau kegiatan' },
        { name: 'anggaran', label: 'Anggaran', type: 'number', required: true, placeholder: 'Jumlah anggaran', format: 'rupiah', min: 0 },
        { name: 'asal_usulan', label: 'Asal Usulan', required: true, placeholder: 'Sumber usulan' },
        { name: 'tahun', label: 'Tahun', type: 'number', required: true },
        { name: 'keterangan', label: 'Keterangan', type: 'textarea', placeholder: 'Catatan tambahan' },
      ]}
    />
  );
}
