import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Landmark,
  HandCoins,
  Wallet,
  Building,
  UsersRound,
  FileCheck,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Banknote,
  PanelLeftClose,
  PanelLeftOpen,
  DatabaseBackup,
} from 'lucide-react';
import { useAuth } from '../lib/useAuth';
import MigrationModal from './MigrationModal';
import { getLocalDataStatus } from '../lib/migrateLocalStorage';

interface NavLink {
  type: 'link';
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

interface NavSubGroup {
  type: 'subgroup';
  label: string;
  icon: typeof LayoutDashboard;
  children: NavLink[];
}

interface NavGroup {
  type: 'group';
  label: string;
  icon: typeof LayoutDashboard;
  children: (NavLink | NavSubGroup)[];
}

type NavItem = NavLink | NavGroup;

const navItems: NavItem[] = [
  { type: 'link', to: '/', label: 'Dashboard', icon: LayoutDashboard },
  {
    type: 'group',
    label: 'Data Hibah',
    icon: HandCoins,
    children: [
      { type: 'link', to: '/bansos', label: 'Bansos Masyarakat', icon: Users },
      {
        type: 'subgroup',
        label: 'Bantuan Keuangan',
        icon: Banknote,
        children: [
          { type: 'link', to: '/dana-desa', label: 'Dana Desa (DD)', icon: Landmark },
          { type: 'link', to: '/add', label: 'Alokasi Dana Desa', icon: Landmark },
          { type: 'link', to: '/bkk', label: 'Bantuan Keuangan Khusus', icon: Wallet },
          { type: 'link', to: '/bk-reguler', label: 'Bantuan Keuangan Reguler', icon: Wallet },
        ],
      },
      {
        type: 'subgroup',
        label: 'Hibah Lembaga',
        icon: Building2,
        children: [
          { type: 'link', to: '/lembaga-khusus', label: 'Lembaga Khusus', icon: Building2 },
          { type: 'link', to: '/lembaga-reguler', label: 'Lembaga Reguler', icon: Building },
        ],
      },
      { type: 'link', to: '/hibah-kelompok', label: 'Hibah Kelompok', icon: UsersRound },
    ],
  },
  { type: 'link', to: '/legalitas', label: 'Legalitas', icon: FileCheck },
];

function getAllLinks(items: (NavLink | NavSubGroup)[]): NavLink[] {
  const links: NavLink[] = [];
  for (const item of items) {
    if (item.type === 'link') links.push(item);
    else links.push(...item.children);
  }
  return links;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [dataHibahOpen, setDataHibahOpen] = useState(true);
  const [openSubGroups, setOpenSubGroups] = useState<Record<string, boolean>>({ 'Bantuan Keuangan': true, 'Hibah Lembaga': true });
  const toggleSubGroup = (label: string) => setOpenSubGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  const location = useLocation();
  const { user, signOut, isAdmin } = useAuth();
  const handleSignOut = () => {
    void signOut();
  };

  const [migrationOpen, setMigrationOpen] = useState(false);
  const [localDataCount, setLocalDataCount] = useState(0);
  useEffect(() => {
    if (!isAdmin) return;
    const update = () => {
      const s = getLocalDataStatus();
      setLocalDataCount(s.hibahCount + s.legalitasCount);
    };
    update();
    window.addEventListener('storage', update);
    return () => window.removeEventListener('storage', update);
  }, [isAdmin, migrationOpen]);

  const sidebarWidth = collapsed ? 'w-[68px]' : 'w-72';
  const mainMargin = collapsed ? 'lg:ml-[68px]' : 'lg:ml-72';

  const renderNavLink = (link: NavLink, indented = false) => {
    const Icon = link.icon;
    const isActive = location.pathname === link.to;
    return (
      <Link
        key={link.to}
        to={link.to}
        onClick={() => setSidebarOpen(false)}
        title={collapsed ? link.label : undefined}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
          isActive
            ? 'bg-primary-500/20 text-primary-300'
            : 'text-slate-400 hover:bg-teal-800/30 hover:text-slate-200'
        } ${indented ? '' : ''} ${collapsed ? 'justify-center' : ''}`}
      >
        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary-400' : ''}`} />
        {!collapsed && link.label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary-600" />
          <span className="font-bold text-gray-800">Si-CAMBAH</span>
        </div>
        <div className="w-9" />
      </div>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full ${sidebarWidth} bg-gradient-to-b from-cyan-900 via-teal-900 to-emerald-950 text-white transform transition-all duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 flex flex-col`}
      >
        {/* Header */}
        <div className={`border-b border-teal-800 ${collapsed ? 'p-3' : 'p-5'}`}>
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${collapsed ? 'justify-center w-full' : 'gap-3'}`}>
              <div className={`${collapsed ? 'w-9 h-9' : 'w-10 h-10'} bg-primary-500 rounded-xl flex items-center justify-center shadow-lg shrink-0`}>
                <BookOpen className={`${collapsed ? 'w-4 h-4' : 'w-5 h-5'} text-white`} />
              </div>
              {!collapsed && (
                <div>
                  <h1 className="font-bold text-lg text-white">Si-CAMBAH</h1>
                  <p className="text-xs text-slate-400">Catatan & Manajemen Hibah</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-teal-800"
            >
              <X className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 ${collapsed ? 'p-2' : 'p-3'} space-y-1 overflow-y-auto`}>
          {navItems.map((item) => {
            if (item.type === 'group') {
              const Icon = item.icon;
              const allLinks = getAllLinks(item.children);
              const isChildActive = allLinks.some((c) => location.pathname === c.to);

              if (collapsed) {
                return (
                  <div key={item.label} className="space-y-1">
                    <div
                      className={`flex items-center justify-center px-3 py-2 rounded-xl text-sm font-medium ${
                        isChildActive ? 'bg-teal-800/50 text-white' : 'text-slate-300'
                      }`}
                      title={item.label}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                    </div>
                    {allLinks.map((link) => renderNavLink(link))}
                  </div>
                );
              }

              return (
                <div key={item.label}>
                  <button
                    onClick={() => setDataHibahOpen(!dataHibahOpen)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isChildActive
                        ? 'bg-teal-800/50 text-white'
                        : 'text-slate-300 hover:bg-teal-800/30 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </div>
                    {dataHibahOpen ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  {dataHibahOpen && (
                    <div className="mt-1 ml-3 pl-3 border-l border-teal-800 space-y-0.5">
                      {item.children.map((child) => {
                        if (child.type === 'subgroup') {
                          const SIcon = child.icon;
                          const isSubActive = child.children.some((c) => location.pathname === c.to);
                          const isSubOpen = openSubGroups[child.label] ?? true;
                          return (
                            <div key={child.label}>
                              <button
                                onClick={() => toggleSubGroup(child.label)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                  isSubActive
                                    ? 'bg-teal-800/40 text-white'
                                    : 'text-slate-400 hover:bg-teal-800/30 hover:text-slate-200'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <SIcon className={`w-4 h-4 ${isSubActive ? 'text-primary-400' : ''}`} />
                                  {child.label}
                                </div>
                                {isSubOpen ? (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5" />
                                )}
                              </button>
                              {isSubOpen && (
                                <div className="mt-0.5 ml-3 pl-3 border-l border-teal-800/50 space-y-0.5">
                                  {child.children.map((subLink) => renderNavLink(subLink, true))}
                                </div>
                              )}
                            </div>
                          );
                        }
                        return renderNavLink(child);
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary-500/20 text-primary-300'
                    : 'text-slate-300 hover:bg-teal-800/30 hover:text-white'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary-400' : ''}`} />
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>

        {/* Toggle + User */}
        <div className="border-t border-teal-800">
          {/* Collapse/Expand button - desktop only */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-full items-center justify-center gap-2 px-3 py-2.5 text-slate-400 hover:text-white hover:bg-teal-800/30 transition-colors text-xs font-medium"
            title={collapsed ? 'Tampilkan sidebar' : 'Sembunyikan sidebar'}
          >
            {collapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <>
                <PanelLeftClose className="w-4 h-4" />
                <span>Sembunyikan</span>
              </>
            )}
          </button>

          {/* Migration prompt — admin only, only when local data exists */}
          {isAdmin && localDataCount > 0 && !collapsed && (
            <button
              onClick={() => setMigrationOpen(true)}
              className="w-full flex items-center gap-2 px-3 py-2 mx-0 mb-1 text-xs font-medium text-amber-300 hover:text-amber-200 hover:bg-amber-900/20 transition-colors"
              title="Ada data di localStorage browser ini — pindahkan ke Supabase"
            >
              <DatabaseBackup className="w-4 h-4 shrink-0" />
              <span className="text-left flex-1 truncate">
                Migrasi {localDataCount} data lokal
              </span>
            </button>
          )}
          {isAdmin && localDataCount > 0 && collapsed && (
            <button
              onClick={() => setMigrationOpen(true)}
              className="w-full flex items-center justify-center p-2 text-amber-300 hover:text-amber-200 hover:bg-amber-900/20 transition-colors"
              title={`Migrasi ${localDataCount} data lokal ke Supabase`}
            >
              <DatabaseBackup className="w-4 h-4" />
            </button>
          )}

          {/* User info */}
          {user && (
            <div className={`${collapsed ? 'p-2' : 'p-4'} border-t border-teal-800/50`}>
              <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
                {!collapsed && (
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.nama}</p>
                    <p className="text-xs text-slate-400 capitalize">{user.role}</p>
                  </div>
                )}
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-lg hover:bg-teal-800 text-slate-400 hover:text-red-400 transition-colors"
                  title="Keluar"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      <MigrationModal
        isOpen={migrationOpen}
        onClose={() => setMigrationOpen(false)}
      />

      <main className={`${mainMargin} pt-16 lg:pt-0 min-h-screen transition-all duration-200`}>
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
