import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { Save, AlertTriangle } from 'lucide-react';
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
import { formatRupiah } from '../lib/format';
import type { Hibah, KategoriHibah, DuplicateWarning } from '../types/hibah';

interface FieldDef {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'textarea' | 'select';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  colSpan?: number;
  format?: 'rupiah' | 'tahun';
  step?: string;
  min?: number;
}

interface GenericHibahPageProps {
  kategori: KategoriHibah;
  title: string;
  subtitle: string;
  fields: FieldDef[];
  searchPlaceholder?: string;
  checkDup?: (
    form: Record<string, string | number>,
    editId?: string,
  ) => Promise<DuplicateWarning[]> | DuplicateWarning[];
}

export default function GenericHibahPage({
  kategori,
  title,
  subtitle,
  fields,
  searchPlaceholder,
  checkDup,
}: GenericHibahPageProps) {
  const emptyForm: Record<string, string | number> = {};
  for (const f of fields) {
    emptyForm[f.name] = f.type === 'number' ? 0 : f.name === 'tahun' ? new Date().getFullYear() : '';
  }
  if (!emptyForm['tahun']) emptyForm['tahun'] = new Date().getFullYear();

  const fetcher = useCallback(() => getHibahList(kategori), [kategori]);
  const { data, loading, refresh } = useAsyncData<Hibah[]>(fetcher, []);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editItem, setEditItem] = useState<Hibah | null>(null);
  const [form, setForm] = useState<Record<string, string | number>>(emptyForm);
  const [dupWarnings, setDupWarnings] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const columns = fields
    .filter((f) => f.type !== 'textarea')
    .map((f) => ({
      key: f.name,
      label: f.label,
      ...(f.format ? { format: f.format } : {}),
    }));

  const handleChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    const field = fields.find((f) => f.name === name);
    const newForm = { ...form, [name]: field?.type === 'number' || name === 'tahun' ? Number(value) : value };
    setForm(newForm);

    try {
      if (checkDup) {
        const warnings = await checkDup(newForm, editItem?.id);
        setDupWarnings(warnings.map((w) => w.message));
      } else {
        const autoCheck = await checkDuplicates({
          ...newForm,
          kategori,
          id: editItem?.id,
        } as unknown as Partial<Hibah>);
        setDupWarnings(autoCheck.map((w) => w.message));
      }
    } catch {
      // Don't surface duplicate check errors — they're informational only.
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      if (editItem) {
        await updateHibah(editItem.id, form as Partial<Hibah>);
        toast.success('Data berhasil diperbarui');
      } else {
        await createHibah({
          ...form,
          kategori,
          status: 'draft',
        } as CreateHibahInput);
        toast.success('Data berhasil ditambahkan');
      }
      setShowForm(false);
      setEditItem(null);
      setForm({ ...emptyForm });
      setDupWarnings([]);
      refresh();
    } catch (err) {
      toast.error('Gagal menyimpan: ' + (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: Hibah) => {
    setEditItem(item);
    const newForm: Record<string, string | number> = {};
    for (const f of fields) {
      newForm[f.name] = (item as unknown as Record<string, unknown>)[f.name] as string | number ?? '';
    }
    setForm(newForm);
    setDupWarnings([]);
    setShowForm(true);
  };

  const handleImport = async (rows: Record<string, string>[]) => {
    const toastId = toast.loading(`Mengimport ${rows.length} data...`);
    let count = 0;
    let failed = 0;
    for (const row of rows) {
      try {
        const importForm: Record<string, string | number> = {};
        for (const f of fields) {
          const val = row[f.label] || row[f.name] || '';
          importForm[f.name] = f.type === 'number' || f.name === 'tahun' ? Number(val) || 0 : val;
        }
        await createHibah({
          ...importForm,
          kategori,
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
        title={title}
        subtitle={subtitle}
        data={data}
        loading={loading}
        columns={columns}
        onAdd={() => { setEditItem(null); setForm({ ...emptyForm }); setDupWarnings([]); setShowForm(true); }}
        onImport={() => setShowImport(true)}
        onEdit={handleEdit}
        onRefresh={refresh}
        searchPlaceholder={searchPlaceholder}
      />

      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditItem(null); }}
        title={editItem ? `Edit ${title}` : `Tambah ${title}`}
      >
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
            {fields.map((f) => {
              if (f.type === 'textarea') return null;
              const span = f.colSpan === 2 ? 'sm:col-span-2' : '';
              return (
                <div key={f.name} className={span}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  {f.type === 'select' && f.options ? (
                    <select
                      name={f.name}
                      value={String(form[f.name])}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm bg-white"
                    >
                      {f.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name={f.name}
                      type={f.type === 'number' ? 'number' : 'text'}
                      required={f.required}
                      value={form[f.name]}
                      onChange={handleChange}
                      placeholder={f.placeholder}
                      step={f.step}
                      min={f.min}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm"
                    />
                  )}
                  {f.format === 'rupiah' && Number(form[f.name]) > 0 && (
                    <p className="text-xs text-gray-500 mt-1">{formatRupiah(form[f.name])}</p>
                  )}
                </div>
              );
            })}
          </div>
          {fields.some((f) => f.type === 'textarea') && fields.filter((f) => f.type === 'textarea').map((f) => (
            <div key={f.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <textarea
                name={f.name}
                value={String(form[f.name])}
                onChange={handleChange}
                rows={2}
                placeholder={f.placeholder}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm resize-none"
              />
            </div>
          ))}
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
        expectedColumns={fields.map((f) => f.label)}
      />
    </>
  );
}
