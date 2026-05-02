import { useState, useMemo } from 'react';
import { Search, Trash2, Edit3, Eye, X, CheckCircle, Upload, Plus, AlertTriangle, Download, FileDown, FileText, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/authContext';
import { deleteHibah, confirmHibah } from '../lib/hibahService';
import { downloadTemplate, exportToExcel, exportToPDF } from '../lib/exportUtils';
import type { Hibah } from '../types/hibah';

interface Column {
  key: string;
  label: string;
  render?: (value: unknown, row: Hibah) => React.ReactNode;
}

interface DataTableProps {
  title: string;
  subtitle: string;
  data: Hibah[];
  columns: Column[];
  onAdd: () => void;
  onImport: () => void;
  onEdit?: (item: Hibah) => void;
  onRefresh: () => void;
  searchPlaceholder?: string;
  exportFilename?: string;
}

export default function DataTable({
  title,
  subtitle,
  data,
  columns,
  onAdd,
  onImport,
  onEdit,
  onRefresh,
  searchPlaceholder = 'Cari data...',
  exportFilename,
}: DataTableProps) {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [filterYear, setFilterYear] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<Hibah | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    for (const row of data) {
      if (row.tahun) years.add(row.tahun);
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [data]);

  const fname = exportFilename || title.replace(/[^a-zA-Z0-9]/g, '_');

  const filtered = data.filter((row) => {
    if (filterYear && row.tahun !== Number(filterYear)) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return JSON.stringify(row).toLowerCase().includes(q);
  });

  const handleDelete = (id: string) => {
    deleteHibah(id);
    setDeleteConfirm(null);
    onRefresh();
    toast.success('Data berhasil dihapus');
  };

  const handleConfirm = (id: string) => {
    confirmHibah(id);
    onRefresh();
    toast.success('Data berhasil dikonfirmasi');
  };

  const getFieldValue = (row: Hibah, key: string): unknown => {
    return (row as unknown as Record<string, unknown>)[key];
  };

  const handleDownloadTemplate = () => {
    downloadTemplate(columns, fname);
    toast.success('Template berhasil diunduh');
  };

  const handleExportExcel = () => {
    exportToExcel(filtered, columns, fname);
    toast.success('Data berhasil diekspor ke Excel');
  };

  const handleExportPDF = () => {
    exportToPDF(filtered, columns, title, fname);
    toast.success('Data berhasil diekspor ke PDF');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <p className="text-gray-500 text-sm">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleDownloadTemplate}
            className="px-3 py-2 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Unduh template Excel untuk import"
          >
            <Download className="w-3.5 h-3.5" />
            Template
          </button>
          <button
            onClick={onImport}
            className="px-3 py-2 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Import
          </button>
          <button
            onClick={handleExportExcel}
            disabled={filtered.length === 0}
            className="px-3 py-2 border border-green-300 text-green-700 rounded-xl hover:bg-green-50 disabled:opacity-40 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" />
            Excel
          </button>
          <button
            onClick={handleExportPDF}
            disabled={filtered.length === 0}
            className="px-3 py-2 border border-red-300 text-red-700 rounded-xl hover:bg-red-50 disabled:opacity-40 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            PDF
          </button>
          <button
            onClick={onAdd}
            className="px-3 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all text-sm"
          />
        </div>
        <div className="relative w-full sm:w-48">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all text-sm bg-white appearance-none cursor-pointer"
          >
            <option value="">Semua Tahun</option>
            {availableYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Menampilkan {filtered.length} dari {data.length} data
      </p>

      {filtered.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-12 text-center text-gray-400">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Tidak ada data ditemukan</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-100 bg-gray-50">
                    {columns.map((col) => (
                      <th key={col.key} className="px-4 py-3 font-medium whitespace-nowrap">
                        {col.label}
                      </th>
                    ))}
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      {columns.map((col) => (
                        <td key={col.key} className="px-4 py-3 text-sm text-gray-700 max-w-[200px] truncate">
                          {col.render
                            ? col.render(getFieldValue(row, col.key), row)
                            : String(getFieldValue(row, col.key) ?? '-')}
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            row.status === 'confirmed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {row.status === 'confirmed' ? 'Dikonfirmasi' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <button
                            onClick={() => setSelectedItem(row)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => onEdit?.(row)}
                              className="p-1.5 rounded-lg hover:bg-yellow-50 text-gray-400 hover:text-yellow-600 transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                          {row.status === 'draft' && (
                            <button
                              onClick={() => handleConfirm(row.id)}
                              className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
                              title="Konfirmasi"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {(isAdmin || row.status === 'draft') && (
                            <button
                              onClick={() => setDeleteConfirm(row.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {filtered.map((row) => (
              <div key={row.id} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div className="space-y-1">
                    {columns.slice(0, 2).map((col) => (
                      <p key={col.key} className="text-sm">
                        <span className="text-gray-500">{col.label}: </span>
                        <span className="font-medium text-gray-800">
                          {col.render
                            ? col.render(getFieldValue(row, col.key), row)
                            : String(getFieldValue(row, col.key) ?? '-')}
                        </span>
                      </p>
                    ))}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      row.status === 'confirmed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {row.status === 'confirmed' ? 'Dikonfirmasi' : 'Draft'}
                  </span>
                </div>
                <div className="flex justify-end gap-1 pt-2 border-t border-gray-100">
                  <button onClick={() => setSelectedItem(row)} className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600">
                    <Eye className="w-4 h-4" />
                  </button>
                  {isAdmin && (
                    <button onClick={() => onEdit?.(row)} className="p-2 rounded-lg hover:bg-yellow-50 text-gray-400 hover:text-yellow-600">
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                  {row.status === 'draft' && (
                    <button onClick={() => handleConfirm(row.id)} className="p-2 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  {(isAdmin || row.status === 'draft') && (
                    <button onClick={() => setDeleteConfirm(row.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Detail Data</h2>
              <button onClick={() => setSelectedItem(null)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              {columns.map((col) => (
                <div key={col.key}>
                  <p className="text-xs text-gray-500">{col.label}</p>
                  <p className="text-sm font-medium text-gray-800">
                    {col.render
                      ? col.render(getFieldValue(selectedItem, col.key), selectedItem)
                      : String(getFieldValue(selectedItem, col.key) ?? '-')}
                  </p>
                </div>
              ))}
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p className="text-sm font-medium text-gray-800">
                  {selectedItem.status === 'confirmed' ? 'Dikonfirmasi' : 'Draft'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tahun</p>
                <p className="text-sm font-medium text-gray-800">{selectedItem.tahun}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Keterangan</p>
                <p className="text-sm font-medium text-gray-800">{selectedItem.keterangan || '-'}</p>
              </div>
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
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
