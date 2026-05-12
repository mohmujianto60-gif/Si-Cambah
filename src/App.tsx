import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './lib/authContext';
import { useAuth } from './lib/useAuth';
import Layout from './components/Layout';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import BansosMasyarakat from './pages/BansosMasyarakat';
import DanaDesa from './pages/DanaDesa';
import AlokasiDanaDesa from './pages/AlokasiDanaDesa';
import BKKPage from './pages/BKK';
import BKRegulerPage from './pages/BKReguler';
import LembagaKhususPage from './pages/LembagaKhusus';
import LembagaRegulerPage from './pages/LembagaReguler';
import HibahKelompokPage from './pages/HibahKelompok';
import LegalitasPage from './pages/Legalitas';
import ManajemenUser from './pages/ManajemenUser';
import AuditLog from './pages/AuditLog';

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-900 via-teal-800 to-emerald-900">
      <div className="flex flex-col items-center gap-3 text-white/80">
        <span className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        <p className="text-sm">Memuat sesi...</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <FullScreenLoader />;
  }

  // The reset-password route is reachable while authenticated (recovery
  // session) or unauthenticated (with helpful notice). Render it first so
  // the auth gate below doesn't bounce the user back to login.
  if (location.pathname === '/reset-password') {
    return <ResetPassword />;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/bansos" element={<BansosMasyarakat />} />
        <Route path="/dana-desa" element={<DanaDesa />} />
        <Route path="/add" element={<AlokasiDanaDesa />} />
        <Route path="/bkk" element={<BKKPage />} />
        <Route path="/bk-reguler" element={<BKRegulerPage />} />
        <Route path="/lembaga-khusus" element={<LembagaKhususPage />} />
        <Route path="/lembaga-reguler" element={<LembagaRegulerPage />} />
        <Route path="/hibah-kelompok" element={<HibahKelompokPage />} />
        <Route path="/legalitas" element={<LegalitasPage />} />
        <Route path="/manajemen-user" element={<ManajemenUser />} />
        <Route path="/audit-log" element={<AuditLog />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { borderRadius: '12px', fontSize: '14px' },
          }}
        />
      </AuthProvider>
    </HashRouter>
  );
}

export default App;
