import GenericHibahPage from './GenericHibahPage';

export default function LembagaRegulerPage() {
  return (
    <GenericHibahPage
      kategori="lembaga_reguler"
      title="Hibah Lembaga Reguler"
      subtitle="Data hibah lembaga reguler — tidak boleh diberikan setiap tahun"
      fields={[
        { name: 'nama_lembaga', label: 'Nama Lembaga', required: true, placeholder: 'Nama lembaga' },
        { name: 'alamat', label: 'Alamat', required: true, placeholder: 'Alamat lembaga', colSpan: 2 },
        { name: 'bentuk_hibah', label: 'Bentuk Hibah', required: true, placeholder: 'Jenis hibah' },
        { name: 'nomor_sk', label: 'No. SK', placeholder: 'Nomor surat keputusan' },
        { name: 'opd_pelaksana', label: 'OPD Pelaksana', placeholder: 'Nama OPD' },
        { name: 'tahun', label: 'Tahun', type: 'number', required: true },
        { name: 'keterangan', label: 'Keterangan', type: 'textarea', placeholder: 'Catatan tambahan' },
      ]}
      searchPlaceholder="Cari berdasarkan nama lembaga atau alamat..."
    />
  );
}
