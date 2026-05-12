import { useState } from 'react';
import { BookOpen, LogIn, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/useAuth';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const success = login(username, password);
      if (success) {
        toast.success('Login berhasil!');
      } else {
        toast.error('Username atau password salah');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center p-4 bg-gradient-to-br from-cyan-900 via-teal-800 to-emerald-900">
      {/* Animated soft blobs for depth */}
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

        <form
          onSubmit={handleSubmit}
          className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 space-y-5 ring-1 ring-white/40"
        >
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all text-sm"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
              Password
            </label>
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
            disabled={loading || !username || !password}
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

          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-start gap-2 text-xs text-gray-500">
              <ShieldCheck className="w-3.5 h-3.5 mt-0.5 text-cyan-600 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-medium text-gray-600">Akun demo:</p>
                <p><span className="font-semibold text-gray-700">Admin</span> — admin / admin123</p>
                <p><span className="font-semibold text-gray-700">Operator</span> — operator / operator123</p>
              </div>
            </div>
          </div>
        </form>

        <p className="text-center text-xs text-cyan-100/60 mt-6">
          © {new Date().getFullYear()} Si-CAMBAH
        </p>
      </div>
    </div>
  );
}
