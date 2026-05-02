import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ImportModal from '../components/ImportModal';
import { getHibahList, createHibah, updateHibah, checkDuplicates } from '../lib/hibahService';
import { useAuth } from '../lib/authContext';
import type { Hibah, BansosMasyarakat as BansosType } from '../types/hibah';
import { AlertTriangle, Save } from 'lucide-react';

const columns = [
  { key: 'nik', label: 'NIK' },
  { key: 'nama', label: 'Nama' },
  { key: 'alamat', label: 'Alamat' },
  { key: 'bentuk_bansos', label: 'Bentuk Bansos' },
  { key: 'nomor_sk', label: 'No. SK' },
  { key: 'opd_pelaksana', label: 'OPD Pelaksana' },
  { key: 'tahun', label: 'Tahun' },
];

const emptyForm = {
  nik: '', nama: '', alamat: '', bentuk_bansos: '', keterangan: '',
  nomor_sk: '', opd_pelaksana: '', tahun: new Date().getFullYear(),
};

export default function BansosMasyarakatPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Hibah[]>(() => getHibahList('bansos_masyarakat'));
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editItem, setEditItem] = useState<BansosType | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [dupWarnings, setDupWarnings] = useState<string[]>([]);

  const refresh = useCallback(() => setData(getHibahList('bansos_masyarakat')), []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newForm = { ...form, [name]: name === 'tahun' ? Number(value) : value };
    setForm(newForm);

    if (name === 'nik' && value.length >= 6) {
      const warnings = checkDuplicates({
        kategori: 'bansos_masyarakat', nik: value, id: editItem?.id,
      } as Partial<Hibah>);
      setDupWarnings(warnings.map((w) => w.message));
    } else if (name === 'nik') {
      setDupWarnings([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editItem) {
      updateHibah(editItem.id, { ...form } as Partial<Hibah>);
      toast.success('Data berhasil diperbarui');
    } else {
      createHibah({
        ...form,
        kategori: 'bansos_masyarakat',
        status: 'draft',
        created_by: user?.username || '',
      } as Omit<Hibah, 'id' | 'created_at' | 'updated_at'>);
      toast.success('Data berhasil ditambahkan');
    }
    setShowForm(false);
    setEditItem(null);
    setForm(emptyForm);
    setDupWarnings([]);
    refresh();
  };

  const handleEdit = (item: Hibah) => {
    const d = item as BansosType;
    setEditItem(d);
    setForm({
      nik: d.nik, nama: d.nama, alamat: d.alamat, bentuk_bansos: d.bentuk_bansos,
      keterangan: d.keterangan, nomor_sk: d.nomor_sk, opd_pelaksana: d.opd_pelaksana, tahun: d.tahun,
    });
    setShowForm(true);
  };

  const handleImport = (rows: Record<string, string>[]) => {
    let count = 0;
    for (const row of rows) {
      createHibah({
        kategori: 'bansos_masyarakat',
        nik: row['NIK'] || row['nik'] || '',
        nama: row['Nama'] || row['nama'] || '',
        alamat: row['Alamat'] || row['alamat'] || '',
        bentuk_bansos: row['Bentuk Bansos'] || row['bentuk_bansos'] || '',
        keterangan: row['Keterangan'] || row['keterangan'] || '',
        nomor_sk: row['Nomor SK'] || row['nomor_sk'] || '',
        opd_pelaksana: row['OPD Pelaksana'] || row['opd_pelaksana'] || '',
        tahun: Number(row['Tahun'] || row['tahun']) || new Date().getFullYear(),
        status: 'draft',
        created_by: user?.username || '',
      } as Omit<Hibah, 'id' | 'created_at' | 'updated_at'>);
      count++;
    }
    toast.success(`${count} data berhasil diimport`);
    refresh();
  };

  return (
    <>
      <DataTable
        title="Bansos Masyarakat"
        subtitle="Data penerima bantuan sosial masyarakat"
        data={data}
        columns={columns}
        onAdd={() => { setEditItem(null); setForm(emptyForm); setDupWarnings([]); setShowForm(true); }}
        onImport={() => setShowImport(true)}
        onEdit={handleEdit}
        onRefresh={refresh}
        searchPlaceholder="Cari berdasarkan NIK, nama, atau alamat..."
      />

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditItem(null); }} title={editItem ? 'Edit Data Bansos' : 'Tambah Data Bansos'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {dupWarnings.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-1">
              {dupWarnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-red-700">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NIK</label>
              <input name="nik" required value={form.nik} onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm" placeholder="Nomor Induk Kependudukan" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
              <input name="nama" required value={form.nama} onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm" placeholder="Nama penerima" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
              <input name="alamat" required value={form.alamat} onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm" placeholder="Alamat lengkap" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bentuk Bansos</label>
              <input name="bentuk_bansos" required value={form.bentuk_bansos} onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm" placeholder="Jenis bantuan" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nomor SK</label>
              <input name="nomor_sk" value={form.nomor_sk} onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm" placeholder="Nomor surat keputusan" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">OPD Pelaksana</label>
              <input name="opd_pelaksana" value={form.opd_pelaksana} onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm" placeholder="Nama OPD" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
              <input name="tahun" type="number" required value={form.tahun} onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
            <textarea name="keterangan" value={form.keterangan} onChange={handleChange} rows={2}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm resize-none" placeholder="Catatan tambahan" />
          </div>
          <button type="submit" className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium flex items-center gap-2">
            <Save className="w-4 h-4" />{editItem ? 'Simpan Perubahan' : 'Simpan'}
          </button>
        </form>
      </Modal>

      <ImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImport={handleImport}
        expectedColumns={['NIK', 'Nama', 'Alamat', 'Bentuk Bansos', 'Keterangan', 'Nomor SK', 'OPD Pelaksana', 'Tahun']}
      />
    </>
  );
}
