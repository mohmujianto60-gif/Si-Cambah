import { useCallback, useState } from 'react';
import { Search, Plus, Eye, Edit3, Trash2, Save, X, AlertTriangle, FileCheck, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import {
  getLegalitasList,
  createLegalitas,
  updateLegalitas,
  deleteLegalitas,
} from '../lib/hibahService';
import { useAsyncData } from '../lib/useAsyncData';
import { useAuth } from '../lib/useAuth';
import type { Legalitas as LegalitasType } from '../types/hibah';

const emptyForm = { nomor_sk: '', judul: '', tanggal: '', link_gdrive: '', keterangan: '' };

function getGDriveEmbedUrl(url: string): string | null {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
  const match2 = url.match(/id=([a-zA-Z0-9_-]+)/);
  if (match2) return `https://drive.google.com/file/d/${match2[1]}/preview`;
  return null;
}

export default function LegalitasPage() {
  const { isAdmin } = useAuth();
  const fetcher = useCallback(() => getLegalitasList(), []);
  const { data, loading, refresh } = useAsyncData<LegalitasType[]>(fetcher, []);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<LegalitasType | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [previewItem, setPreviewItem] = useState<LegalitasType | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filtered = data.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return l.nomor_sk.toLowerCase().includes(q) || l.judul.toLowerCase().includes(q);
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      if (editItem) {
        await updateLegalitas(editItem.id, form);
        toast.success('Data berhasil diperbarui');
      } else {
        await createLegalitas(form);
        toast.success('Data berhasil ditambahkan');
      }
      setShowForm(false);
      setEditItem(null);
      setForm(emptyForm);
      refresh();
    } catch (err) {
      toast.error('Gagal menyimpan: ' + (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: LegalitasType) => {
    setEditItem(item);
    setForm({
      nomor_sk: item.nomor_sk, judul: item.judul, tanggal: item.tanggal,
      link_gdrive: item.link_gdrive, keterangan: item.keterangan,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLegalitas(id);
      setDeleteConfirm(null);
      refresh();
      toast.success('Data berhasil dihapus');
    } catch (err) {
      toast.error('Gagal menghapus: ' + (err as Error).message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Legalitas</h1>
          <p className="text-gray-500 text-sm">Kelola Surat Keputusan (SK) dengan link Google Drive</p>
        </div>
        <button
          onClick={() => { setEditItem(null); setForm(emptyForm); setShowForm(true); }}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Tambah SK
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Cari berdasarkan nomor SK atau judul..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all text-sm"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="aspect-[4/3] bg-gray-100 animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 bg-gray-100 rounded w-2/3 animate-pulse" />
                <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
          <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Belum ada data legalitas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const embedUrl = getGDriveEmbedUrl(item.link_gdrive);
            return (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {embedUrl ? (
                  <div className="aspect-[4/3] bg-gray-100">
                    <iframe src={embedUrl} className="w-full h-full" title={item.judul} />
                  </div>
                ) : (
                  <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center">
                    <FileCheck className="w-16 h-16 text-gray-300" />
                  </div>
                )}
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-gray-800 text-sm truncate">{item.judul}</h3>
                  <p className="text-xs text-gray-500">SK: {item.nomor_sk}</p>
                  <p className="text-xs text-gray-500">Tanggal: {item.tanggal}</p>
                  {item.keterangan && <p className="text-xs text-gray-400 truncate">{item.keterangan}</p>}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <a
                      href={item.link_gdrive}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Buka di Google Drive
                    </a>
                    <div className="flex gap-0.5">
                      <button onClick={() => setPreviewItem(item)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600">
                        <Eye className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <button onClick={() => handleEdit(item)} className="p-1.5 rounded-lg hover:bg-yellow-50 text-gray-400 hover:text-yellow-600">
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                      {isAdmin && (
                        <button onClick={() => setDeleteConfirm(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditItem(null); }} title={editItem ? 'Edit Surat Keputusan' : 'Tambah Surat Keputusan'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nomor SK</label>
              <input name="nomor_sk" required value={form.nomor_sk} onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm" placeholder="Nomor SK" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
              <input name="tanggal" type="date" required value={form.tanggal} onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Judul</label>
              <input name="judul" required value={form.judul} onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm" placeholder="Judul surat keputusan" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Link Google Drive</label>
              <input name="link_gdrive" required value={form.link_gdrive} onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm" placeholder="https://drive.google.com/file/d/..." />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
            <textarea name="keterangan" value={form.keterangan} onChange={handleChange} rows={2}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm resize-none" placeholder="Catatan tambahan" />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium flex items-center gap-2"
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

      {/* Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <div>
                <h2 className="font-semibold text-gray-800">{previewItem.judul}</h2>
                <p className="text-xs text-gray-500">SK: {previewItem.nomor_sk}</p>
              </div>
              <button onClick={() => setPreviewItem(null)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 min-h-[500px]">
              {getGDriveEmbedUrl(previewItem.link_gdrive) ? (
                <iframe
                  src={getGDriveEmbedUrl(previewItem.link_gdrive)!}
                  className="w-full h-full min-h-[500px]"
                  title={previewItem.judul}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <p>Preview tidak tersedia. <a href={previewItem.link_gdrive} target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">Buka di Google Drive</a></p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Hapus Data?</h3>
            <p className="text-sm text-gray-500 mb-6">Data yang dihapus tidak dapat dikembalikan.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium">Batal</button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
