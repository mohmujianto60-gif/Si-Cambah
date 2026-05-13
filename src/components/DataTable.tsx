import { useState, useMemo } from 'react';
import {
  Search,
  Trash2,
  Edit3,
  Eye,
  CheckCircle,
  Upload,
  Plus,
  AlertTriangle,
  Download,
  FileDown,
  FileText,
  Calendar,
  Filter,
  RotateCcw,
  Database,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/useAuth';
import {
  deleteHibah,
  confirmHibah,
  revertHibah,
  bulkDeleteHibah,
  bulkUpdateStatus,
} from '../lib/hibahService';
import { downloadTemplate, exportToExcel, exportToPDF } from '../lib/exportUtils';
import { formatRupiah } from '../lib/format';
import Modal from './Modal';
import type { Hibah } from '../types/hibah';

type ColumnFormat = 'rupiah' | 'tahun';

export interface Column {
  key: string;
  label: string;
  format?: ColumnFormat;
  render?: (value: unknown, row: Hibah) => React.ReactNode;
}

interface DataTableProps {
  title: string;
  subtitle: string;
  data: Hibah[];
  loading?: boolean;
  columns: Column[];
  onAdd: () => void;
  onImport: () => void;
  onEdit?: (item: Hibah) => void;
  onRefresh: () => void;
  searchPlaceholder?: string;
  exportFilename?: string;
}

function applyFormat(value: unknown, format?: ColumnFormat): React.ReactNode {
  if (value === undefined || value === null || value === '') return '-';
  if (format === 'rupiah') return formatRupiah(value);
  if (format === 'tahun') return String(value);
  return String(value);
}

export default function DataTable({
  title,
  subtitle,
  data,
  loading = false,
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
  const [filterStatus, setFilterStatus] = useState<'' | 'draft' | 'confirmed'>('');
  const [selectedItem, setSelectedItem] = useState<Hibah | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Bulk-action state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    for (const row of data) {
      if (row.tahun) years.add(row.tahun);
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [data]);

  const fname = exportFilename || title.replace(/[^a-zA-Z0-9]/g, '_');

  const filtered = useMemo(() => {
    return data.filter((row) => {
      if (filterYear && row.tahun !== Number(filterYear)) return false;
      if (filterStatus && row.status !== filterStatus) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return JSON.stringify(row).toLowerCase().includes(q);
    });
  }, [data, filterYear, filterStatus, search]);

  // selectedRows derives from intersection with `filtered`, so stale ids
  // (rows that disappear after a filter change or refresh) are ignored.
  // No effect needed to clean up state.
  const selectedRows = useMemo(
    () => filtered.filter((r) => selectedIds.has(r.id)),
    [filtered, selectedIds],
  );
  const visibleSelectedCount = selectedRows.length;
  const allSelected =
    filtered.length > 0 && visibleSelectedCount === filtered.length;
  const someSelected = visibleSelectedCount > 0 && !allSelected;
  // Operator hanya bisa menghapus draft mereka sendiri lewat RLS. Untuk
  // UI bulk action, kita izinkan semua operator-actions kalau admin,
  // atau hanya rows draft kalau bukan admin.
  const bulkDeletableCount = isAdmin
    ? selectedRows.length
    : selectedRows.filter((r) => r.status === 'draft').length;
  const bulkConfirmableCount = selectedRows.filter(
    (r) => r.status === 'draft',
  ).length;
  const bulkRevertableCount = isAdmin
    ? selectedRows.filter((r) => r.status === 'confirmed').length
    : 0;

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds(() => {
      if (allSelected) return new Set();
      return new Set(filtered.map((r) => r.id));
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const renderCell = (col: Column, row: Hibah): React.ReactNode => {
    const value = (row as unknown as Record<string, unknown>)[col.key];
    if (col.render) return col.render(value, row);
    return applyFormat(value, col.format);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteHibah(id);
      setDeleteConfirm(null);
      onRefresh();
      toast.success('Data berhasil dihapus');
    } catch (err) {
      toast.error('Gagal menghapus: ' + (err as Error).message);
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await confirmHibah(id);
      onRefresh();
      toast.success('Data berhasil dikonfirmasi');
    } catch (err) {
      toast.error('Gagal mengonfirmasi: ' + (err as Error).message);
    }
  };

  const handleRevert = async (id: string) => {
    try {
      await revertHibah(id);
      onRefresh();
      toast.success('Status dikembalikan ke draft');
    } catch (err) {
      toast.error('Gagal mengembalikan: ' + (err as Error).message);
    }
  };

  const handleBulkDelete = async () => {
    const deletableIds = (isAdmin
      ? selectedRows
      : selectedRows.filter((r) => r.status === 'draft')
    ).map((r) => r.id);
    if (deletableIds.length === 0 || bulkBusy) return;
    setBulkBusy(true);
    try {
      const count = await bulkDeleteHibah(deletableIds);
      setBulkDeleteOpen(false);
      clearSelection();
      onRefresh();
      if (count === 0) {
        toast.error('Tidak ada data yang dihapus (mungkin tidak punya izin).');
      } else {
        toast.success(`${count} data berhasil dihapus`);
      }
    } catch (err) {
      toast.error('Gagal menghapus: ' + (err as Error).message);
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkConfirm = async () => {
    const draftIds = selectedRows
      .filter((r) => r.status === 'draft')
      .map((r) => r.id);
    if (draftIds.length === 0 || bulkBusy) return;
    setBulkBusy(true);
    try {
      const count = await bulkUpdateStatus(draftIds, 'confirmed');
      clearSelection();
      onRefresh();
      toast.success(`${count} data dikonfirmasi`);
    } catch (err) {
      toast.error('Gagal mengonfirmasi: ' + (err as Error).message);
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkRevert = async () => {
    const confirmedIds = selectedRows
      .filter((r) => r.status === 'confirmed')
      .map((r) => r.id);
    if (confirmedIds.length === 0 || bulkBusy) return;
    setBulkBusy(true);
    try {
      const count = await bulkUpdateStatus(confirmedIds, 'draft');
      clearSelection();
      onRefresh();
      toast.success(`${count} data dikembalikan ke draft`);
    } catch (err) {
      toast.error('Gagal mengembalikan: ' + (err as Error).message);
    } finally {
      setBulkBusy(false);
    }
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

  const hasFilters = filterYear || filterStatus || search;

  return (
    <div className="space-y-5 animate-page-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <p className="text-gray-500 text-sm">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleDownloadTemplate}
            className="px-3 py-2 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 hover:-translate-y-0.5 active:scale-95 text-xs font-medium flex items-center gap-1.5 transition-all"
            title="Unduh template Excel untuk import"
          >
            <Download className="w-3.5 h-3.5" />
            Template
          </button>
          <button
            onClick={onImport}
            className="px-3 py-2 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 hover:-translate-y-0.5 active:scale-95 text-xs font-medium flex items-center gap-1.5 transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            Import
          </button>
          <button
            onClick={handleExportExcel}
            disabled={filtered.length === 0}
            className="px-3 py-2 border border-green-300 text-green-700 rounded-xl hover:bg-green-50 hover:-translate-y-0.5 active:scale-95 disabled:opacity-40 disabled:hover:translate-y-0 text-xs font-medium flex items-center gap-1.5 transition-all"
          >
            <FileDown className="w-3.5 h-3.5" />
            Excel
          </button>
          <button
            onClick={handleExportPDF}
            disabled={filtered.length === 0}
            className="px-3 py-2 border border-red-300 text-red-700 rounded-xl hover:bg-red-50 hover:-translate-y-0.5 active:scale-95 disabled:opacity-40 disabled:hover:translate-y-0 text-xs font-medium flex items-center gap-1.5 transition-all"
          >
            <FileText className="w-3.5 h-3.5" />
            PDF
          </button>
          <button
            onClick={onAdd}
            className="px-3 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 hover:-translate-y-0.5 active:scale-95 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm shadow-cyan-500/30"
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
        <div className="relative w-full sm:w-44">
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
        <div className="relative w-full sm:w-44">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as '' | 'draft' | 'confirmed')}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all text-sm bg-white appearance-none cursor-pointer"
          >
            <option value="">Semua Status</option>
            <option value="draft">Draft</option>
            <option value="confirmed">Dikonfirmasi</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-gray-500">
          {loading
            ? 'Memuat data...'
            : `Menampilkan ${filtered.length} dari ${data.length} data`}
        </p>
        {visibleSelectedCount > 0 && (
          <div className="inline-flex items-center gap-2 bg-cyan-50 border border-cyan-200 rounded-xl px-2.5 py-1.5 shadow-sm animate-fade-in">
            <span className="text-xs font-semibold text-cyan-800">
              {visibleSelectedCount} dipilih
            </span>
            <span className="h-4 w-px bg-cyan-200" />
            {bulkConfirmableCount > 0 && (
              <button
                onClick={handleBulkConfirm}
                disabled={bulkBusy}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title={`Konfirmasi ${bulkConfirmableCount} data draft`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Konfirmasi ({bulkConfirmableCount})
              </button>
            )}
            {bulkRevertableCount > 0 && (
              <button
                onClick={handleBulkRevert}
                disabled={bulkBusy}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-orange-700 hover:bg-orange-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title={`Kembalikan ${bulkRevertableCount} data ke draft`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Kembalikan ({bulkRevertableCount})
              </button>
            )}
            {bulkDeletableCount > 0 && (
              <button
                onClick={() => setBulkDeleteOpen(true)}
                disabled={bulkBusy}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title={`Hapus ${bulkDeletableCount} data`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus ({bulkDeletableCount})
              </button>
            )}
            <button
              onClick={clearSelection}
              disabled={bulkBusy}
              className="inline-flex items-center gap-1 px-1.5 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              title="Batal pilih semua"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-sm p-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              {columns.slice(0, 5).map((_, j) => (
                <div
                  key={j}
                  className="h-5 bg-gray-100 rounded flex-1 animate-pulse"
                  style={{ animationDelay: `${i * 80 + j * 40}ms` }}
                />
              ))}
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-12 text-center text-gray-500 animate-fade-in">
          {hasFilters ? (
            <>
              <Search className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">Tidak ada data yang cocok dengan filter</p>
              <p className="text-sm text-gray-400 mt-1">Coba ubah kata kunci, tahun, atau status filter.</p>
            </>
          ) : (
            <>
              <Database className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium text-gray-700">Belum ada data {title}</p>
              <p className="text-sm text-gray-400 mt-1 mb-5">
                Mulai dengan menambahkan data baru atau import dari Excel.
              </p>
              <div className="flex justify-center gap-2 flex-wrap">
                <button
                  onClick={onAdd}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 active:scale-95 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-all shadow-sm shadow-cyan-500/30"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Data
                </button>
                <button
                  onClick={onImport}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 active:scale-95 text-sm font-medium flex items-center gap-2 transition-all"
                >
                  <Upload className="w-4 h-4" />
                  Import Excel
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-100 bg-gray-50">
                    <th className="pl-4 pr-1 py-3 w-10">
                      <label
                        className="flex items-center justify-center cursor-pointer"
                        title={allSelected ? 'Batal pilih semua' : 'Pilih semua'}
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 focus:ring-offset-0 cursor-pointer"
                          checked={allSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = someSelected;
                          }}
                          onChange={toggleAll}
                          aria-label="Pilih semua"
                        />
                      </label>
                    </th>
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
                  {filtered.map((row) => {
                    const isSelected = selectedIds.has(row.id);
                    return (
                    <tr
                      key={row.id}
                      className={`border-b border-gray-50 transition-colors ${
                        isSelected
                          ? 'bg-cyan-50/60'
                          : 'hover:bg-cyan-50/40'
                      }`}
                    >
                      <td className="pl-4 pr-1 py-3 w-10">
                        <label
                          className="flex items-center justify-center cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 focus:ring-offset-0 cursor-pointer"
                            checked={isSelected}
                            onChange={() => toggleOne(row.id)}
                            aria-label={`Pilih baris ${row.id}`}
                          />
                        </label>
                      </td>
                      {columns.map((col) => (
                        <td key={col.key} className="px-4 py-3 text-sm text-gray-700 max-w-[200px] truncate">
                          {renderCell(col, row)}
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            row.status === 'confirmed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              row.status === 'confirmed' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
                            }`}
                          />
                          {row.status === 'confirmed' ? 'Dikonfirmasi' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <button
                            onClick={() => setSelectedItem(row)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 active:scale-95 transition-all"
                            title="Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => onEdit?.(row)}
                              className="p-1.5 rounded-lg hover:bg-yellow-50 text-gray-400 hover:text-yellow-600 active:scale-95 transition-all"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                          {row.status === 'draft' && (
                            <button
                              onClick={() => handleConfirm(row.id)}
                              className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 active:scale-95 transition-all"
                              title="Konfirmasi"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {isAdmin && row.status === 'confirmed' && (
                            <button
                              onClick={() => handleRevert(row.id)}
                              className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-orange-600 active:scale-95 transition-all"
                              title="Kembalikan ke draft"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                          {(isAdmin || row.status === 'draft') && (
                            <button
                              onClick={() => setDeleteConfirm(row.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 active:scale-95 transition-all"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {filtered.map((row) => {
              const isSelected = selectedIds.has(row.id);
              return (
              <div
                key={row.id}
                className={`backdrop-blur-sm rounded-2xl border p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all ${
                  isSelected
                    ? 'bg-cyan-50/80 border-cyan-200'
                    : 'bg-white/80 border-white/50'
                }`}
              >
                <div className="flex justify-between items-start mb-2 gap-2">
                  <label
                    className="flex items-center justify-center shrink-0 mt-0.5 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 focus:ring-offset-0 cursor-pointer"
                      checked={isSelected}
                      onChange={() => toggleOne(row.id)}
                      aria-label={`Pilih baris ${row.id}`}
                    />
                  </label>
                  <div className="space-y-1 min-w-0 pr-2 flex-1">
                    {columns.slice(0, 2).map((col) => (
                      <p key={col.key} className="text-sm">
                        <span className="text-gray-500">{col.label}: </span>
                        <span className="font-medium text-gray-800 break-words">
                          {renderCell(col, row)}
                        </span>
                      </p>
                    ))}
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                      row.status === 'confirmed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        row.status === 'confirmed' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
                      }`}
                    />
                    {row.status === 'confirmed' ? 'Dikonfirmasi' : 'Draft'}
                  </span>
                </div>
                <div className="flex justify-end gap-1 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedItem(row)}
                    className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 active:scale-95 transition-all"
                    title="Detail"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => onEdit?.(row)}
                      className="p-2 rounded-lg hover:bg-yellow-50 text-gray-400 hover:text-yellow-600 active:scale-95 transition-all"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                  {row.status === 'draft' && (
                    <button
                      onClick={() => handleConfirm(row.id)}
                      className="p-2 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 active:scale-95 transition-all"
                      title="Konfirmasi"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  {isAdmin && row.status === 'confirmed' && (
                    <button
                      onClick={() => handleRevert(row.id)}
                      className="p-2 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-orange-600 active:scale-95 transition-all"
                      title="Kembalikan ke draft"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  {(isAdmin || row.status === 'draft') && (
                    <button
                      onClick={() => setDeleteConfirm(row.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 active:scale-95 transition-all"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        </>
      )}

      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title="Detail Data"
        maxWidth="max-w-lg"
      >
        {selectedItem && (
          <div className="space-y-3">
            {columns.map((col) => (
              <div key={col.key}>
                <p className="text-xs text-gray-500">{col.label}</p>
                <p className="text-sm font-medium text-gray-800 break-words">
                  {renderCell(col, selectedItem)}
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
              <p className="text-sm font-medium text-gray-800 whitespace-pre-wrap">
                {selectedItem.keterangan || '-'}
              </p>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Hapus Data?"
        maxWidth="max-w-sm"
      >
        <div className="text-center -mt-2">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-sm text-gray-500 mb-6">Data yang dihapus tidak dapat dikembalikan.</p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 active:scale-95 text-sm font-medium transition-all"
            >
              Batal
            </button>
            <button
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-sm font-medium transition-all"
            >
              Ya, Hapus
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={bulkDeleteOpen}
        onClose={() => !bulkBusy && setBulkDeleteOpen(false)}
        title={`Hapus ${bulkDeletableCount} Data?`}
        maxWidth="max-w-sm"
      >
        <div className="text-center -mt-2">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-sm text-gray-500 mb-6">
            {bulkDeletableCount} data akan dihapus permanen. Aksi ini tidak dapat dikembalikan.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setBulkDeleteOpen(false)}
              disabled={bulkBusy}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 active:scale-95 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Batal
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkBusy}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {bulkBusy ? 'Menghapus...' : `Ya, Hapus ${bulkDeletableCount}`}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
