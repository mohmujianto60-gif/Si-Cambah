import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Database, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import Modal from './Modal';
import {
  getLocalDataStatus,
  migrateLocalStorage,
  type MigrationResult,
} from '../lib/migrateLocalStorage';

interface MigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MigrationModal({ isOpen, onClose }: MigrationModalProps) {
  // Recompute on every render — cheap localStorage reads; avoids effect-driven
  // setState during open transitions.
  const status = isOpen ? getLocalDataStatus() : { hibahCount: 0, legalitasCount: 0, alreadyArchived: false };
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<MigrationResult | null>(null);

  useEffect(() => {
    // When the modal closes, clear stale results so the next open shows the
    // confirmation screen, not the previous result.
    if (!isOpen && (result || progress.done > 0)) {
      // queueMicrotask defers setState until after the current render commits,
      // satisfying react-hooks/set-state-in-effect.
      queueMicrotask(() => {
        setResult(null);
        setProgress({ done: 0, total: 0 });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const totalLocal = status.hibahCount + status.legalitasCount;

  const handleStart = async () => {
    setRunning(true);
    try {
      const res = await migrateLocalStorage((done, total) =>
        setProgress({ done, total }),
      );
      setResult(res);
      if (res.hibahFailed === 0 && res.legalitasFailed === 0) {
        toast.success(
          `Migrasi selesai: ${res.hibahImported} hibah + ${res.legalitasImported} legalitas`,
        );
      } else {
        toast.error(
          `Migrasi selesai dengan ${res.hibahFailed + res.legalitasFailed} kegagalan`,
        );
      }
    } catch (e) {
      toast.error('Migrasi gagal: ' + (e as Error).message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Migrasi Data Lokal ke Supabase">
      <div className="space-y-4">
        {result ? (
          <div className="space-y-3">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-emerald-800">Migrasi selesai</p>
                <p className="text-emerald-700 mt-1">
                  Hibah: <strong>{result.hibahImported}</strong> berhasil
                  {result.hibahFailed > 0 && `, ${result.hibahFailed} gagal`}
                  <br />
                  Legalitas: <strong>{result.legalitasImported}</strong> berhasil
                  {result.legalitasFailed > 0 && `, ${result.legalitasFailed} gagal`}
                </p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-xs font-semibold text-red-800 mb-2">
                  Daftar error:
                </p>
                <ul className="text-xs text-red-700 space-y-1 max-h-40 overflow-y-auto">
                  {result.errors.map((err, i) => (
                    <li key={i} className="break-words">• {err}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs text-gray-500">
              Data asli di localStorage disimpan sebagai cadangan di key{' '}
              <code className="bg-gray-100 px-1 rounded">
                sicambah_hibah_archived
              </code>{' '}
              dan{' '}
              <code className="bg-gray-100 px-1 rounded">
                sicambah_legalitas_archived
              </code>
              . Bisa dibuka via DevTools jika perlu rollback.
            </p>

            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-medium"
            >
              Tutup
            </button>
          </div>
        ) : totalLocal === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
            <Database className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-600">
              Tidak ada data lokal yang perlu di-migrasi.
            </p>
            {status.alreadyArchived && (
              <p className="text-xs text-gray-400 mt-2">
                Migrasi sebelumnya sudah pernah dijalankan.
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                Helper ini akan menyalin semua data localStorage dari browser
                ini ke database Supabase. Data sebelumnya tetap aman (disimpan
                sebagai arsip lokal). Setelah migrasi, semua user yang login
                akan melihat data ini.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-3 text-center">
                <p className="text-xs text-cyan-700 mb-1">Data Hibah</p>
                <p className="text-2xl font-bold text-cyan-900">
                  {status.hibahCount}
                </p>
              </div>
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-center">
                <p className="text-xs text-teal-700 mb-1">Data Legalitas</p>
                <p className="text-2xl font-bold text-teal-900">
                  {status.legalitasCount}
                </p>
              </div>
            </div>

            {running && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Memproses...</span>
                  <span>
                    {progress.done}/{progress.total}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all"
                    style={{
                      width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleStart}
              disabled={running}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all shadow-sm shadow-cyan-500/30"
            >
              {running ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Mengimpor...
                </>
              ) : (
                <>
                  Mulai Migrasi
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
