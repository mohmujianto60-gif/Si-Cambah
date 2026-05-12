import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ImportModal from '../components/ImportModal';
import {
  getHibahList,
  createHibah,
  updateHibah,
  checkDuplicates,
  type CreateHibahInput,
} from '../lib/hibahService';
import { useAsyncData } from '../lib/useAsyncData';
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
  const fetcher = useCallback(() => getHibahList('bansos_masyarakat'), []);
  const { data, loading, refresh } = useAsyncData<Hibah[]>(fetcher, []);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editItem, setEditItem] = useState<BansosType | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [dupWarnings, setDupWarnings] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const sanitized = name === 'nik' ? value.replace(/\D/g, '').slice(0, 16) : value;
    const newForm = { ...form, [name]: name === 'tahun' ? Number(value) : sanitized };
    setForm(newForm);

    if (name === 'nik' && sanitized.length >= 6) {
      try {
        const warnings = await checkDuplicates({
          kategori: 'bansos_masyarakat', nik: sanitized, id: editItem?.id,
        } as Partial<Hibah>);
        setDupWarnings(warnings.map((w) => w.message));
      } catch {
        // ignore
      }
    } else if (name === 'nik') {
      setDupWarnings([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (form.nik.length !== 16) {
      toast.error('NIK harus terdiri dari 16 digit');
      return;
    }
    setSubmitting(true);
    try {
      if (editItem) {
        await updateHibah(editItem.id, { ...form } as Partial<Hibah>);
        toast.success('Data berhasil diperbarui');
      } else {
        await createHibah({
          ...form,
          kategori: 'bansos_masyarakat',
          status: 'draft',
        } as CreateHibahInput);
        toast.success('Data berhasil ditambahkan');
      }
      setShowForm(false);
      setEditItem(null);
      setForm(emptyForm);
      setDupWarnings([]);
      refresh();
    } catch (err) {
      toast.error('Gagal menyimpan: ' + (err as Error).message);
    } finally {
      setSubmitting(false);
    }
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

  const handleImport = async (rows: Record<string, string>[]) => {
    const toastId = toast.loading(`Mengimport ${rows.length} data...`);
    let count = 0;
    let failed = 0;
    for (const row of rows) {
      try {
        await createHibah({
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
        } as CreateHibahInput);
        count++;
      } catch {
        failed++;
      }
    }
    if (failed > 0) {
      toast.error(`${count} berhasil, ${failed} gagal`, { id: toastId });
    } else {
      toast.success(`${count} data berhasil diimport`, { id: toastId });
    }
    refresh();
  };

  return (
    <>
      <DataTable
        title="Bansos Masyarakat"
        subtitle="Data penerima bantuan sosial masyarakat"
        data={data}
        loading={loading}
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
              <input
                name="nik"
                required
                value={form.nik}
                onChange={handleChange}
                placeholder="16 digit NIK"
                inputMode="numeric"
                pattern="[0-9]{16}"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm"
              />
              {form.nik.length > 0 && form.nik.length < 16 && (
                <p className="text-xs text-amber-600 mt-1">NIK harus 16 digit ({form.nik.length}/16)</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
              <input
                name="nama"
                required
                value={form.nama}
                onChange={handleChange}
                placeholder="Nama lengkap"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
              <input
                name="alamat"
                required
                value={form.alamat}
                onChange={handleChange}
                placeholder="Alamat lengkap"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bentuk Bansos</label>
              <input
                name="bentuk_bansos"
                required
                value={form.bentuk_bansos}
                onChange={handleChange}
                placeholder="Misal: Uang Rp. 500.000"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
              <input
                name="tahun"
                type="number"
                required
                value={form.tahun}
                onChange={handleChange}
                min={1900}
                max={2200}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nomor SK</label>
              <input
                name="nomor_sk"
                value={form.nomor_sk}
                onChange={handleChange}
                placeholder="Nomor Surat Keputusan"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">OPD Pelaksana</label>
              <input
                name="opd_pelaksana"
                value={form.opd_pelaksana}
                onChange={handleChange}
                placeholder="Nama OPD"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
            <textarea
              name="keterangan"
              value={form.keterangan}
              onChange={handleChange}
              rows={2}
              placeholder="Catatan tambahan"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-all shadow-sm shadow-cyan-500/30"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {editItem ? 'Simpan Perubahan' : 'Simpan'}
          </button>
        </form>
      </Modal>

      <ImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImport={handleImport}
        expectedColumns={['NIK', 'Nama', 'Alamat', 'Bentuk Bansos', 'Nomor SK', 'OPD Pelaksana', 'Tahun', 'Keterangan']}
      />
    </>
  );
}
