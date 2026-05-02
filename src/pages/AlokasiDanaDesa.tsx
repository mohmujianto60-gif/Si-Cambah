import GenericHibahPage from './GenericHibahPage';

export default function AlokasiDanaDesa() {
  return (
    <GenericHibahPage
      kategori="alokasi_dana_desa"
      title="Alokasi Dana Desa (ADD)"
      subtitle="Data penerima Alokasi Dana Desa"
      fields={[
        { name: 'nama_desa', label: 'Nama Desa', required: true, placeholder: 'Nama desa' },
        { name: 'alamat', label: 'Alamat', required: true, placeholder: 'Kecamatan / Kabupaten', colSpan: 2 },
        { name: 'bentuk_hibah', label: 'Bentuk Hibah', required: true, placeholder: 'Jenis hibah' },
        { name: 'nomor_sk', label: 'Nomor SK', placeholder: 'Nomor surat keputusan' },
        { name: 'tahun', label: 'Tahun', type: 'number', required: true },
        { name: 'keterangan', label: 'Keterangan', type: 'textarea', placeholder: 'Catatan tambahan' },
      ]}
    />
  );
}
