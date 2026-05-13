import { useCallback, useMemo, useState } from 'react';
import {
  BarChart3,
  Users,
  TrendingUp,
  FileText,
  Sparkles,
  AlertCircle,
  PieChart as PieIcon,
  LineChart as LineIcon,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  getStats,
  getAvailableYears,
  type HibahStats,
} from '../lib/hibahService';
import { useAsyncData } from '../lib/useAsyncData';
import {
  KATEGORI_LABELS,
  KATEGORI_COLORS,
  type KategoriHibah,
} from '../types/hibah';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import { useAuth } from '../lib/useAuth';

interface DashboardData {
  stats: HibahStats;
  years: number[];
}

const EMPTY: DashboardData = {
  stats: { byKategori: {}, byTahun: {}, byKategoriTahun: {}, total: 0 },
  years: [],
};

// Custom tooltip for charts — bersih, branded, dengan format yang konsisten.
interface TooltipPayloadItem {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string;
  payload?: Record<string, unknown>;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      {label !== undefined && (
        <div className="font-semibold text-gray-800 mb-1 border-b border-gray-100 pb-1">
          {label}
        </div>
      )}
      <div className="space-y-1">
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">{entry.name}:</span>
            <span className="font-medium text-gray-800">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');

  const fetcher = useCallback(async (): Promise<DashboardData> => {
    const [stats, years] = await Promise.all([
      getStats(),
      getAvailableYears(),
    ]);
    return { stats, years };
  }, []);

  const { data, loading, error } = useAsyncData<DashboardData>(
    fetcher,
    EMPTY,
    { errorPrefix: 'Gagal memuat statistik' },
  );

  const { stats, years } = data;

  // Pie chart data — kategori composition (filtered by selected year if any).
  // `name` = label bahasa Indonesia (untuk tooltip & legend); `slug` = kategori key.
  const pieData = useMemo(() => {
    if (selectedYear === 'all') {
      return (Object.entries(stats.byKategori) as [KategoriHibah, number][])
        .filter(([, count]) => count > 0)
        .map(([kat, count]) => ({
          slug: kat,
          name: KATEGORI_LABELS[kat],
          value: count,
          color: KATEGORI_COLORS[kat],
        }));
    }
    return (
      Object.entries(stats.byKategoriTahun) as [
        KategoriHibah,
        Record<number, number>,
      ][]
    )
      .map(([kat, byYear]) => ({
        kategori: kat,
        count: byYear[selectedYear as number] ?? 0,
      }))
      .filter((d) => d.count > 0)
      .map(({ kategori, count }) => ({
        slug: kategori,
        name: KATEGORI_LABELS[kategori],
        value: count,
        color: KATEGORI_COLORS[kategori],
      }));
  }, [stats.byKategori, stats.byKategoriTahun, selectedYear]);

  // Bar chart — total per kategori (with year filter applied)
  const barData = useMemo(() => {
    return pieData.map((d) => ({
      kategori: d.name,
      count: d.value,
      color: d.color,
    }));
  }, [pieData]);

  // Line chart — trend per tahun (total semua kategori per tahun)
  const lineData = useMemo(() => {
    return years
      .slice()
      .sort((a, b) => a - b)
      .map((year) => ({
        tahun: year.toString(),
        total: stats.byTahun[year] ?? 0,
      }));
  }, [years, stats.byTahun]);

  const totalAfterFilter = pieData.reduce((s, d) => s + d.value, 0);

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
            {greeting}
            {user?.nama ? `, ${user.nama}` : ''} — ringkasan data penerima
            hibah.
          </p>
        </div>
        {!loading && stats.total > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-50 border border-cyan-200/70 text-cyan-700 text-xs font-medium shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            {stats.total} total data tercatat
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">
            <p className="font-semibold">Gagal memuat statistik</p>
            <p className="mt-1 text-red-700">{error}</p>
            <p className="mt-2 text-xs text-red-600">
              Pastikan tabel <code>hibah</code> sudah dibuat di Supabase
              dengan menjalankan SQL{' '}
              <code>supabase/migrations/001_hibah_schema.sql</code>.
            </p>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-sm animate-pulse"
            />
          ))
        ) : (
          <>
            <StatCard
              title="Total Data"
              value={stats.total}
              icon={FileText}
              color="blue"
            />
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
          </>
        )}
      </div>

      {/* Filter tahun */}
      {!loading && years.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-gray-500">Filter tahun:</span>
          <button
            onClick={() => setSelectedYear('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              selectedYear === 'all'
                ? 'bg-cyan-100 text-cyan-700 border-cyan-300'
                : 'bg-white text-gray-600 border-gray-200 hover:border-cyan-200'
            }`}
          >
            Semua
          </button>
          {years
            .slice()
            .sort((a, b) => b - a)
            .map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  selectedYear === year
                    ? 'bg-cyan-100 text-cyan-700 border-cyan-300'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-cyan-200'
                }`}
              >
                {year}
              </button>
            ))}
        </div>
      )}

      {/* Charts grid */}
      {!loading && stats.total === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-sm p-12 text-center text-gray-400">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium text-gray-600">Belum ada data</p>
          <p className="text-sm mt-1">
            Mulai input data hibah untuk melihat statistik & grafik.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Pie Chart */}
          <ChartCard
            title={
              selectedYear === 'all'
                ? 'Komposisi Kategori'
                : `Komposisi Kategori — Tahun ${selectedYear}`
            }
            subtitle={
              totalAfterFilter > 0
                ? `${totalAfterFilter} total data ${selectedYear === 'all' ? '' : `pada ${selectedYear}`}`
                : undefined
            }
            exportFilename={`komposisi-kategori${selectedYear === 'all' ? '' : `-${selectedYear}`}`}
          >
            {loading ? (
              <div className="h-80 flex items-center justify-center text-gray-400 text-sm">
                <PieIcon className="w-6 h-6 animate-pulse mr-2" />
                Memuat chart...
              </div>
            ) : pieData.length === 0 ? (
              <div className="h-80 flex flex-col items-center justify-center text-gray-400 text-sm">
                <PieIcon className="w-8 h-8 opacity-50 mb-2" />
                Tidak ada data pada filter ini
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={55}
                    paddingAngle={2}
                    label={({ percent }) =>
                      percent && percent > 0.05
                        ? `${(percent * 100).toFixed(0)}%`
                        : ''
                    }
                    labelLine={false}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.slug} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', lineHeight: '1.5' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Bar Chart — kategori counts */}
          <ChartCard
            title={
              selectedYear === 'all'
                ? 'Jumlah per Kategori'
                : `Jumlah per Kategori — Tahun ${selectedYear}`
            }
            subtitle="Total data tercatat per kategori hibah"
            exportFilename={`jumlah-kategori${selectedYear === 'all' ? '' : `-${selectedYear}`}`}
          >
            {loading ? (
              <div className="h-80 flex items-center justify-center text-gray-400 text-sm">
                <BarChart3 className="w-6 h-6 animate-pulse mr-2" />
                Memuat chart...
              </div>
            ) : barData.length === 0 ? (
              <div className="h-80 flex flex-col items-center justify-center text-gray-400 text-sm">
                <BarChart3 className="w-8 h-8 opacity-50 mb-2" />
                Tidak ada data pada filter ini
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={barData}
                  margin={{ top: 5, right: 16, bottom: 60, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="kategori"
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                    height={70}
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: 'rgba(6, 182, 212, 0.05)' }}
                  />
                  <Bar dataKey="count" name="Jumlah" radius={[6, 6, 0, 0]}>
                    {barData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Line Chart — trend per tahun (full width) */}
          {years.length > 0 && (
            <ChartCard
              title="Tren Data per Tahun"
              subtitle="Total data hibah tercatat tiap tahun"
              exportFilename="tren-per-tahun"
              className="lg:col-span-2"
            >
              {loading ? (
                <div className="h-72 flex items-center justify-center text-gray-400 text-sm">
                  <LineIcon className="w-6 h-6 animate-pulse mr-2" />
                  Memuat chart...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart
                    data={lineData}
                    margin={{ top: 10, right: 30, bottom: 5, left: 0 }}
                  >
                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#14b8a6" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="tahun"
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      allowDecimals={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="Total"
                      stroke="url(#trendGradient)"
                      strokeWidth={3}
                      dot={{ fill: '#06b6d4', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          )}
        </div>
      )}
    </div>
  );
}
