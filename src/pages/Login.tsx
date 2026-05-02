import { useState } from 'react';
import { BookOpen, LogIn, Eye, EyeOff, Mail, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/useAuth';

type View = 'login' | 'forgot';

export default function Login() {
  const { signInWithPassword, signInWithGoogle, resetPasswordForEmail } = useAuth();
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signInWithPassword(email.trim(), password);
    if (error) {
      toast.error(error === 'Invalid login credentials' ? 'Email atau password salah' : error);
    } else {
      toast.success('Login berhasil!');
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error(error);
      setGoogleLoading(false);
    }
    // On success, browser is redirected to Google; no need to clear loading.
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    const { error } = await resetPasswordForEmail(resetEmail.trim());
    if (error) {
      toast.error(error);
    } else {
      toast.success('Link reset password sudah dikirim ke email kamu.');
      setView('login');
      setResetEmail('');
    }
    setResetLoading(false);
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
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.06),transparent_60%)]"
      />

      <div className="relative w-full max-w-md animate-page-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-cyan-500/40 ring-1 ring-white/30">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Si-CAMBAH</h1>
          <p className="text-cyan-100/80 mt-1 text-sm">Sistem Catatan dan Manajemen Hibah</p>
        </div>

        {view === 'login' ? (
          <form
            onSubmit={handleSubmit}
            className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 space-y-5 ring-1 ring-white/40"
          >
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setView('forgot')}
                  className="text-xs text-primary-600 hover:text-primary-700 hover:underline"
                >
                  Lupa password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 active:scale-90 transition-all"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading || !email || !password}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 active:scale-[0.99] disabled:opacity-60 disabled:hover:from-cyan-600 disabled:hover:to-teal-600 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Masuk
                </>
              )}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 uppercase tracking-wide">atau</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading || googleLoading}
              className="w-full py-3 bg-white border border-gray-300 hover:bg-gray-50 active:scale-[0.99] disabled:opacity-60 text-gray-700 font-medium rounded-xl transition-all flex items-center justify-center gap-3 shadow-sm"
            >
              {googleLoading ? (
                <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
              ) : (
                <GoogleLogo className="w-5 h-5" />
              )}
              Masuk dengan Google
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleReset}
            className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 space-y-5 ring-1 ring-white/40"
          >
            <button
              type="button"
              onClick={() => setView('login')}
              className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </button>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">Reset password</h2>
              <p className="text-sm text-gray-500 mt-1">
                Masukkan email kamu — kami akan kirim link untuk membuat password baru.
              </p>
            </div>

            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                id="reset-email"
                type="email"
                required
                autoComplete="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={resetLoading || !resetEmail}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 active:scale-[0.99] disabled:opacity-60 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30"
            >
              {resetLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Kirim link reset
                </>
              )}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-cyan-100/60 mt-6">
          © {new Date().getFullYear()} Si-CAMBAH
        </p>
      </div>
    </div>
  );
}

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M21.35 11.1H12v3.2h5.35c-.23 1.4-1.6 4.1-5.35 4.1-3.22 0-5.85-2.66-5.85-5.95S8.78 6.5 12 6.5c1.83 0 3.06.78 3.76 1.45l2.57-2.47C16.86 3.95 14.66 3 12 3 6.99 3 2.95 7.04 2.95 12.05 2.95 17.06 6.99 21.1 12 21.1c6.93 0 9.2-4.86 9.2-9.36 0-.63-.07-1.1-.16-1.56z"
        fill="#4285F4"
      />
      <path
        d="M3.96 7.32 6.6 9.27c.72-1.79 2.42-3.07 4.4-3.07 1.84 0 3.07.78 3.77 1.45l2.57-2.47C15.86 3.95 13.66 3 11 3 7.45 3 4.4 5.06 3.96 7.32z"
        fill="#EA4335"
      />
      <path
        d="M12 21.1c2.6 0 4.78-.86 6.37-2.34l-2.93-2.4c-.79.55-1.86.94-3.44.94-2.65 0-4.9-1.74-5.7-4.16l-2.66 2.05C5.1 18.85 8.27 21.1 12 21.1z"
        fill="#34A853"
      />
      <path
        d="M21.35 11.1H12v3.2h5.35c-.23 1.4-1.04 2.55-2.27 3.36l2.93 2.4c1.7-1.57 2.79-3.9 2.79-6.95 0-.63-.07-1.1-.16-1.56z"
        fill="#FBBC05"
      />
    </svg>
  );
}
