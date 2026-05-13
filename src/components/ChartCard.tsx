import { useRef, useState, type ReactNode } from 'react';
import { Download, ImageDown, Code2, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { downloadChartPng, downloadChartSvg } from '../lib/chartExport';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  exportFilename?: string;
  /** When false (default true), hides the export menu. */
  exportable?: boolean;
  children: ReactNode;
  /** Additional className for the outer card. */
  className?: string;
}

/**
 * Reusable card wrapper for a single chart.
 * Includes:
 *  - title + optional subtitle
 *  - "Unduh" dropdown menu (PNG, SVG) using a ref to the chart container
 *
 * The chart itself is passed as `children` and renders inside a ref'd div.
 */
export default function ChartCard({
  title,
  subtitle,
  exportFilename,
  exportable = true,
  children,
  className = '',
}: ChartCardProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const baseFilename =
    exportFilename ??
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const handlePng = async () => {
    if (!chartRef.current || exporting) return;
    setMenuOpen(false);
    setExporting(true);
    try {
      await downloadChartPng(chartRef.current, `${baseFilename}.png`);
      toast.success('PNG berhasil diunduh');
    } catch (err) {
      toast.error('Gagal export PNG: ' + (err as Error).message);
    } finally {
      setExporting(false);
    }
  };

  const handleSvg = () => {
    if (!chartRef.current || exporting) return;
    setMenuOpen(false);
    setExporting(true);
    try {
      downloadChartSvg(chartRef.current, `${baseFilename}.svg`);
      toast.success('SVG berhasil diunduh');
    } catch (err) {
      toast.error('Gagal export SVG: ' + (err as Error).message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-sm p-5 ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        {exportable && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              onBlur={() => setTimeout(() => setMenuOpen(false), 120)}
              disabled={exporting}
              className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-cyan-700 bg-gray-50 hover:bg-cyan-50 border border-gray-200 hover:border-cyan-200 rounded-lg px-2.5 py-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <Download className="w-3.5 h-3.5" />
              Unduh
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handlePng}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-cyan-50 text-left"
                >
                  <ImageDown className="w-3.5 h-3.5 text-cyan-600" />
                  PNG
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleSvg}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-cyan-50 text-left"
                >
                  <Code2 className="w-3.5 h-3.5 text-emerald-600" />
                  SVG
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div ref={chartRef} className="bg-white rounded-xl">
        {children}
      </div>
    </div>
  );
}
