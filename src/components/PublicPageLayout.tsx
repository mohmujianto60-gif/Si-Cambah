import { Link } from 'react-router-dom';
import { BookOpen, ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

interface PublicPageLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

/**
 * Wrapper layout untuk halaman publik (privacy / terms / tentang) yang
 * tidak butuh autentikasi. Header sederhana + back-link ke /login,
 * footer dengan tahun + tagline.
 */
export default function PublicPageLayout({
  title,
  subtitle,
  children,
}: PublicPageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-cyan-50 via-teal-50 to-emerald-50 dark:bg-transparent">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            to="/login"
            className="flex items-center gap-2 text-cyan-700 hover:text-cyan-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Kembali</span>
          </Link>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary-600" />
            <span className="font-bold text-gray-800">Si-CAMBAH</span>
          </div>
          <span className="w-16" />
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {title}
          </h1>
          {subtitle && (
            <p className="text-gray-500 mt-2 text-sm sm:text-base">{subtitle}</p>
          )}
        </div>

        <article className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm p-6 sm:p-8 prose prose-sm sm:prose-base max-w-none text-gray-700 leading-relaxed">
          {children}
        </article>
      </main>

      <footer className="border-t border-gray-200 bg-white/60 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Si-CAMBAH — Bapperida</p>
          <nav className="flex items-center gap-4">
            <Link to="/tentang" className="hover:text-cyan-700">
              Tentang
            </Link>
            <Link to="/privacy" className="hover:text-cyan-700">
              Kebijakan Privasi
            </Link>
            <Link to="/terms" className="hover:text-cyan-700">
              Syarat Penggunaan
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
