import { useEffect, useState } from 'react';
import { BarChart3, Users, TrendingUp, FileText, Sparkles } from 'lucide-react';
import { getStats, getAvailableYears, DATA_CHANGE_EVENT } from '../lib/hibahService';
import { KATEGORI_LABELS, KATEGORI_COLORS, type KategoriHibah } from '../types/hibah';
import StatCard from '../components/StatCard';
import { useAuth } from '../lib/useAuth';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(() => getStats());
  const [years, setYears] = useState(() => getAvailableYears());

  useEffect(() => {
    const onChange = () => {
      setStats(getStats());
      setYears(getAvailableYears());
    };
    window.addEventListener(DATA_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(DATA_CHANGE_EVENT, onChange);
  }, []);

  const kategoriEntries = Object.entries(stats.byKategori) as [KategoriHibah, number][];
  const maxCount = Math.max(...Object.values(stats.byKategori), 1);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 11) return 'Selamat pagi';
    if (h < 15) return 'Selamat siang';
    if (h < 19) return 'Selamat sore';
    return 'Selamat malam';
  })();

  return (
    <div className="space-y-8 animate-page-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-700 to-teal-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            {greeting}{user?.nama ? `, ${user.nama}` : ''} — ringkasan data penerima hibah.
          </p>
        </div>
        {stats.total > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-50 border border-cyan-200/70 text-cyan-700 text-xs font-medium shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            {stats.total} total data tercatat
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Data" value={stats.total} icon={FileText} color="blue" />
        <StatCard
          title="Kategori Aktif"
          value={Object.keys(stats.byKategori).length}
          icon={BarChart3}
          color="green"
        />
        <StatCard
          title="Tahun Tercatat"
          value={years.length}
          icon={TrendingUp}
          color="yellow"
        />
        <StatCard
          title="Penerima Bansos"
          value={stats.byKategori['bansos_masyarakat'] || 0}
          icon={Users}
          color="red"
        />
      </div>

      {/* By Category Chart */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">Rekap per Kategori</h2>
        {kategoriEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Belum ada data — mulai input data untuk melihat statistik</p>
          </div>
        ) : (
          <div className="space-y-3">
            {kategoriEntries.map(([kat, count]) => (
              <div key={kat} className="flex items-center gap-3">
                <div className="w-40 sm:w-56 text-sm text-gray-600 shrink-0 truncate">
                  {KATEGORI_LABELS[kat]}
                </div>
                <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                  <div
                    className="h-full rounded-full flex items-center px-3 transition-all duration-700 shadow-sm"
                    style={{
                      width: `${Math.max((count / maxCount) * 100, 10)}%`,
                      background: `linear-gradient(135deg, ${KATEGORI_COLORS[kat]}cc, ${KATEGORI_COLORS[kat]})`,
                    }}
                  >
                    <span className="text-xs font-bold text-white drop-shadow-sm">{count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* By Year */}
      {years.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Rekap per Tahun</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {years.map((year) => {
              const yearData = stats.byKategoriTahun;
              const yearCategories = Object.entries(yearData)
                .filter(([, byYear]) => byYear[year])
                .map(([kat, byYear]) => ({
                  kategori: kat as KategoriHibah,
                  count: byYear[year],
                }));
              const yearTotal = yearCategories.reduce((s, c) => s + c.count, 0);

              return (
                <div
                  key={year}
                  className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-gray-800 text-lg">{year}</h3>
                    <span className="px-2.5 py-0.5 bg-cyan-100 text-cyan-700 rounded-full text-xs font-semibold">{yearTotal} data</span>
                  </div>
                  <div className="space-y-1.5">
                    {yearCategories.map((c) => (
                      <div key={c.kategori} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full shadow-sm"
                            style={{ backgroundColor: KATEGORI_COLORS[c.kategori] }}
                          />
                          <span className="text-gray-600 text-xs">{KATEGORI_LABELS[c.kategori]}</span>
                        </div>
                        <span className="font-semibold text-gray-800 text-xs">{c.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
