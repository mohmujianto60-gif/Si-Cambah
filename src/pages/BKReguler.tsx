import GenericHibahPage from './GenericHibahPage';

export default function BKRegulerPage() {
  return (
    <GenericHibahPage
      kategori="bk_reguler"
      title="Bantuan Keuangan Reguler"
      subtitle="Data Bantuan Keuangan Reguler"
      fields={[
        { name: 'bentuk_bk', label: 'Bentuk BK', required: true, placeholder: 'Bentuk bantuan keuangan' },
        { name: 'total_anggaran', label: 'Total Anggaran', type: 'number', required: true, placeholder: 'Jumlah anggaran' },
        { name: 'sumber_anggaran', label: 'Sumber Anggaran', required: true, placeholder: 'Sumber anggaran' },
        { name: 'tahun', label: 'Tahun', type: 'number', required: true },
        { name: 'keterangan', label: 'Keterangan', type: 'textarea', placeholder: 'Catatan tambahan' },
      ]}
    />
  );
}
