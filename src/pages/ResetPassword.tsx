import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, KeyRound, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/useAuth';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { status, updatePassword, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  // The reset link puts the user into a temporary "recovery" session.
  // If they're not authenticated yet (link expired / opened in another browser),
  // we let them know so they can request a new link.
  const inRecoverySession = status === 'authenticated';

  useEffect(() => {
    if (status === 'loading') return;
    // If user reached this page without a recovery session and not logged in
    // we just show a notice — no automatic redirect.
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password minimal 8 karakter');
      return;
    }
    if (password !== confirm) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }
    setLoading(true);
    const { error } = await updatePassword(password);
    if (error) {
      toast.error(error);
      setLoading(false);
      return;
    }
    toast.success('Password berhasil diubah. Silakan login ulang.');
    await signOut();
    setLoading(false);
    navigate('/login', { replace: true });
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center p-4 bg-gradient-to-br from-cyan-900 via-teal-800 to-emerald-900">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cyan-400/20 blur-3xl animate-pulse"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-emerald-400/20 blur-3xl animate-pulse"
        style={{ animationDelay: '1.5s' }}
      />

      <div className="relative w-full max-w-md animate-page-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-cyan-500/40 ring-1 ring-white/30">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Si-CAMBAH</h1>
          <p className="text-cyan-100/80 mt-1 text-sm">Atur password baru</p>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 ring-1 ring-white/40">
          {!inRecoverySession ? (
            <div className="space-y-3 text-sm text-gray-600">
              <p className="font-medium text-gray-900">Sesi reset tidak aktif</p>
              <p>
                Link reset password sudah kedaluwarsa atau dibuka di browser/perangkat berbeda dari
                permintaan awal.
              </p>
              <Link
                to="/login"
                className="inline-block mt-2 text-primary-600 hover:text-primary-700 hover:underline"
              >
                Minta link baru →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password baru
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={show ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Minimal 8 karakter"
                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 active:scale-90 transition-all"
                    aria-label={show ? 'Sembunyikan' : 'Lihat'}
                  >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Konfirmasi password
                </label>
                <input
                  id="confirm-password"
                  type={show ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Ulangi password"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !password || !confirm}
                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 active:scale-[0.99] disabled:opacity-60 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    Simpan password baru
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
