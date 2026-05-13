import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  History,
  Search,
  RefreshCw,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  MinusCircle,
  Pencil,
  CheckCircle2,
  Undo2,
  User,
  Clock,
  Filter,
  X,
  Database,
} from 'lucide-react';
import { useAuth } from '../lib/useAuth';
import { useAsyncData } from '../lib/useAsyncData';
import {
  listAuditLog,
  computeDiff,
  formatValue,
  type AuditAction,
  type AuditLogEntry,
  type AuditLogFilter,
  type AuditLogPage,
  type AuditTable,
} from '../lib/auditLogService';

const PAGE_SIZE = 25;

const TABLE_LABEL: Record<AuditTable, string> = {
  hibah: 'Data Hibah',
  legalitas: 'Legalitas / SK',
};

const ACTION_LABEL: Record<AuditAction, string> = {
  insert: 'Tambah',
  update: 'Edit',
  delete: 'Hapus',
  confirm: 'Konfirmasi',
  revert: 'Revert',
};

const ACTION_COLOR: Record<AuditAction, string> = {
  insert: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  update: 'bg-amber-100 text-amber-700 border-amber-200',
  delete: 'bg-rose-100 text-rose-700 border-rose-200',
  confirm: 'bg-sky-100 text-sky-700 border-sky-200',
  revert: 'bg-violet-100 text-violet-700 border-violet-200',
};

function ActionIcon({
  action,
  className,
}: {
  action: AuditAction;
  className?: string;
}) {
  const cls = className ?? 'w-4 h-4';
  switch (action) {
    case 'insert':
      return <PlusCircle className={cls} />;
    case 'delete':
      return <MinusCircle className={cls} />;
    case 'update':
      return <Pencil className={cls} />;
    case 'confirm':
      return <CheckCircle2 className={cls} />;
    case 'revert':
      return <Undo2 className={cls} />;
    default:
      return <History className={cls} />;
  }
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}

function summarize(entry: AuditLogEntry): string {
  const data = entry.new_data ?? entry.old_data ?? {};
  const kategori = (data as Record<string, unknown>).kategori as
    | string
    | undefined;
  const tahun = (data as Record<string, unknown>).tahun as number | undefined;
  const nomor = (data as Record<string, unknown>).nomor_sk as
    | string
    | undefined;
  const judul = (data as Record<string, unknown>).judul as string | undefined;

  if (entry.table_name === 'hibah') {
    const parts: string[] = [];
    if (kategori) parts.push(kategori);
    if (tahun) parts.push(`tahun ${tahun}`);
    return parts.length ? parts.join(' · ') : 'Hibah';
  }
  if (entry.table_name === 'legalitas') {
    const parts: string[] = [];
    if (nomor) parts.push(`SK ${nomor}`);
    if (judul) parts.push(judul);
    return parts.length ? parts.join(' · ') : 'Legalitas';
  }
  return entry.record_id.slice(0, 8);
}

interface AuditRowProps {
  entry: AuditLogEntry;
}

function AuditRow({ entry }: AuditRowProps) {
  const [expanded, setExpanded] = useState(false);
  const diffs = useMemo(
    () => computeDiff(entry.old_data, entry.new_data),
    [entry.old_data, entry.new_data],
  );

  const hasDetails = entry.old_data || entry.new_data;

  return (
    <>
      <tr
        className={`border-b border-gray-100 last:border-b-0 transition-colors ${
          hasDetails
            ? 'cursor-pointer hover:bg-cyan-50/40'
            : 'cursor-default'
        } ${expanded ? 'bg-cyan-50/60' : ''}`}
        onClick={() => hasDetails && setExpanded((v) => !v)}
      >
        <td className="px-3 py-2.5 align-top whitespace-nowrap text-xs text-gray-500">
          <Clock className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5 opacity-60" />
          {formatDateTime(entry.changed_at)}
        </td>
        <td className="px-3 py-2.5 align-top">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-gray-400" />
            <div>
              <div className="text-sm font-medium text-gray-700">
                {entry.actor_nama || entry.actor_email || 'Tidak diketahui'}
              </div>
              {entry.actor_email && entry.actor_nama && (
                <div className="text-[11px] text-gray-400 leading-tight">
                  {entry.actor_email}
                </div>
              )}
              {entry.actor_role && (
                <span className="inline-block mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 uppercase tracking-wide">
                  {entry.actor_role}
                </span>
              )}
            </div>
          </div>
        </td>
        <td className="px-3 py-2.5 align-top">
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${ACTION_COLOR[entry.action]}`}
          >
            <ActionIcon action={entry.action} className="w-3 h-3" />
            {ACTION_LABEL[entry.action]}
          </span>
        </td>
        <td className="px-3 py-2.5 align-top">
          <div className="flex items-center gap-1 text-sm text-gray-700">
            <Database className="w-3.5 h-3.5 text-gray-400" />
            {TABLE_LABEL[entry.table_name] ?? entry.table_name}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {summarize(entry)}
          </div>
          <div className="text-[10px] text-gray-400 font-mono mt-0.5">
            {entry.record_id.slice(0, 8)}…
          </div>
        </td>
        <td className="px-3 py-2.5 align-top w-8">
          {hasDetails && (
            <span className="text-cyan-600 text-xs font-medium">
              {expanded ? 'Tutup' : 'Detail'}
            </span>
          )}
        </td>
      </tr>
      {expanded && hasDetails && (
        <tr className="bg-cyan-50/30 border-b border-gray-100">
          <td colSpan={5} className="px-4 py-3">
            {entry.action === 'insert' && entry.new_data && (
              <div>
                <div className="text-xs font-semibold text-gray-600 mb-2">
                  Data yang ditambahkan
                </div>
                <DataKV data={entry.new_data} />
              </div>
            )}
            {entry.action === 'delete' && entry.old_data && (
              <div>
                <div className="text-xs font-semibold text-gray-600 mb-2">
                  Data yang dihapus
                </div>
                <DataKV data={entry.old_data} />
              </div>
            )}
            {(entry.action === 'update' ||
              entry.action === 'confirm' ||
              entry.action === 'revert') &&
              diffs.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-600 mb-2">
                    Perubahan ({diffs.length} field)
                  </div>
                  <div className="space-y-1.5">
                    {diffs.map((d) => (
                      <div
                        key={d.key}
                        className="grid grid-cols-[120px_1fr_1fr] gap-2 items-start text-xs"
                      >
                        <div className="font-medium text-gray-600 truncate">
                          {d.key}
                        </div>
                        <div className="text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-100 break-words">
                          {formatValue(d.before)}
                        </div>
                        <div className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 break-words">
                          {formatValue(d.after)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            {(entry.action === 'update' ||
              entry.action === 'confirm' ||
              entry.action === 'revert') &&
              diffs.length === 0 && (
                <div className="text-xs text-gray-500 italic">
                  Tidak ada perubahan field yang terdeteksi.
                </div>
              )}
          </td>
        </tr>
      )}
    </>
  );
}

function DataKV({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data).filter(
    ([k]) => !['updated_at', 'created_at'].includes(k),
  );
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
      {entries.map(([k, v]) => (
        <div
          key={k}
          className="flex flex-col bg-white/70 border border-gray-100 rounded px-2 py-1"
        >
          <span className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">
            {k}
          </span>
          <span className="text-xs text-gray-700 break-words">
            {formatValue(v)}
          </span>
        </div>
      ))}
    </div>
  );
}

interface FilterChipProps {
  label: string;
  onClear: () => void;
}

function FilterChip({ label, onClear }: FilterChipProps) {
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-cyan-50 text-cyan-700 border border-cyan-200 px-2 py-0.5 rounded-full">
      {label}
      <button
        onClick={onClear}
        className="hover:bg-cyan-100 rounded-full p-0.5"
        aria-label="Hapus filter"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

export default function AuditLog() {
  const { isAdmin } = useAuth();

  const [page, setPage] = useState(0);
  const [tableFilter, setTableFilter] = useState<AuditTable | ''>('');
  const [actionFilter, setActionFilter] = useState<AuditAction | ''>('');
  const [actorEmail, setActorEmail] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filter: AuditLogFilter = useMemo(
    () => ({
      table: tableFilter || null,
      action: actionFilter || null,
      actorEmail: actorEmail.trim() || null,
      startDate: startDate ? new Date(startDate).toISOString() : null,
      endDate: endDate ? new Date(endDate + 'T23:59:59').toISOString() : null,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    }),
    [tableFilter, actionFilter, actorEmail, startDate, endDate, page],
  );

  const fetcher = useCallback(() => {
    if (!isAdmin) {
      return Promise.resolve<AuditLogPage>({ entries: [], total: 0 });
    }
    return listAuditLog(filter);
  }, [filter, isAdmin]);

  const {
    data,
    loading,
    error,
    refresh,
  } = useAsyncData<AuditLogPage>(
    fetcher,
    { entries: [], total: 0 },
    { errorPrefix: 'Gagal memuat audit log' },
  );

  const resetFilters = () => {
    setTableFilter('');
    setActionFilter('');
    setActorEmail('');
    setStartDate('');
    setEndDate('');
    setPage(0);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-sm p-8 max-w-md text-center">
          <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-800">
            Akses Ditolak
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Halaman Audit Log hanya bisa diakses oleh admin.
          </p>
        </div>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
  const activeFilters: ReactNode[] = [];
  if (tableFilter)
    activeFilters.push(
      <FilterChip
        key="table"
        label={`Tabel: ${TABLE_LABEL[tableFilter]}`}
        onClear={() => {
          setTableFilter('');
          setPage(0);
        }}
      />,
    );
  if (actionFilter)
    activeFilters.push(
      <FilterChip
        key="action"
        label={`Aksi: ${ACTION_LABEL[actionFilter]}`}
        onClear={() => {
          setActionFilter('');
          setPage(0);
        }}
      />,
    );
  if (actorEmail.trim())
    activeFilters.push(
      <FilterChip
        key="actor"
        label={`User: ${actorEmail.trim()}`}
        onClear={() => {
          setActorEmail('');
          setPage(0);
        }}
      />,
    );
  if (startDate)
    activeFilters.push(
      <FilterChip
        key="start"
        label={`Dari: ${startDate}`}
        onClear={() => {
          setStartDate('');
          setPage(0);
        }}
      />,
    );
  if (endDate)
    activeFilters.push(
      <FilterChip
        key="end"
        label={`Sampai: ${endDate}`}
        onClear={() => {
          setEndDate('');
          setPage(0);
        }}
      />,
    );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <History className="w-6 h-6 text-cyan-600" />
            Audit Log
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Riwayat perubahan data — siapa, kapan, dan apa yang berubah.
          </p>
        </div>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-1.5 text-sm bg-white/80 backdrop-blur-sm hover:bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 hover:text-gray-800 transition-colors"
          disabled={loading}
        >
          <RefreshCw
            className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
          />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-sm p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
          <Filter className="w-4 h-4 text-gray-500" />
          Filter
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">
              Tabel
            </label>
            <select
              value={tableFilter}
              onChange={(e) => {
                setTableFilter(e.target.value as AuditTable | '');
                setPage(0);
              }}
              className="w-full text-sm bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-cyan-400"
            >
              <option value="">Semua</option>
              <option value="hibah">Data Hibah</option>
              <option value="legalitas">Legalitas / SK</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">
              Aksi
            </label>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value as AuditAction | '');
                setPage(0);
              }}
              className="w-full text-sm bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-cyan-400"
            >
              <option value="">Semua</option>
              <option value="insert">Tambah</option>
              <option value="update">Edit</option>
              <option value="delete">Hapus</option>
              <option value="confirm">Konfirmasi</option>
              <option value="revert">Revert</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">
              Email user
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={actorEmail}
                onChange={(e) => {
                  setActorEmail(e.target.value);
                  setPage(0);
                }}
                placeholder="contoh@email.com"
                className="w-full text-sm bg-white border border-gray-200 rounded-lg pl-7 pr-2 py-1.5 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">
              Dari tanggal
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(0);
              }}
              className="w-full text-sm bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-cyan-400"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">
              Sampai tanggal
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(0);
              }}
              className="w-full text-sm bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">Filter aktif:</span>
            {activeFilters}
            <button
              onClick={resetFilters}
              className="text-xs text-gray-500 hover:text-rose-600 underline ml-auto"
            >
              Reset semua
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-sm overflow-hidden">
        {loading && data.entries.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 opacity-60" />
            Memuat audit log...
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <ShieldAlert className="w-8 h-8 text-rose-400 mx-auto mb-2" />
            <p className="text-sm text-rose-600 font-medium">
              Gagal memuat audit log
            </p>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              {error}
            </p>
            <p className="text-xs text-gray-400 mt-3">
              Pastikan tabel <code className="font-mono">audit_log</code> sudah
              dibuat (jalankan{' '}
              <code className="font-mono">
                supabase/migrations/002_audit_log.sql
              </code>{' '}
              di SQL Editor).
            </p>
          </div>
        ) : data.entries.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">Belum ada catatan audit</p>
            <p className="text-xs mt-1">
              Catatan akan otomatis muncul setelah ada perubahan data hibah
              atau legalitas.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="px-3 py-2.5">Waktu</th>
                <th className="px-3 py-2.5">User</th>
                <th className="px-3 py-2.5">Aksi</th>
                <th className="px-3 py-2.5">Target</th>
                <th className="px-3 py-2.5 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {data.entries.map((entry) => (
                <AuditRow key={entry.id} entry={entry} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data.total > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div>
            Menampilkan {page * PAGE_SIZE + 1}–
            {Math.min((page + 1) * PAGE_SIZE, data.total)} dari{' '}
            <span className="font-medium text-gray-700">{data.total}</span>{' '}
            entri
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="inline-flex items-center gap-1 px-2 py-1 rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Sebelum
            </button>
            <span className="px-2 text-xs">
              Hal {page + 1} / {totalPages}
            </span>
            <button
              onClick={() =>
                setPage((p) => Math.min(totalPages - 1, p + 1))
              }
              disabled={page >= totalPages - 1 || loading}
              className="inline-flex items-center gap-1 px-2 py-1 rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Berikut
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
