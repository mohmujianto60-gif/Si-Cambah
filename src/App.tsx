import { HashRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './lib/authContext';
import { useAuth } from './lib/useAuth';
import Layout from './components/Layout';
import Login from './pages/Login';
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

function AppRoutes() {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
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
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { borderRadius: '12px', fontSize: '14px' },
          }}
        />
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
