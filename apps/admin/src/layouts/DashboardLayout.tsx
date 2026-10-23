import React, { useState } from 'react';
import { Outlet, Navigate, NavLink, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Scissors,
  Users,
  UserCheck,
  Settings,
  LogOut,
  Building2,
  ChevronDown,
  Menu,
  X,
  User,
  FileText,
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { CustomerPortal } from '../pages/CustomerPortal';
import { useTranslation } from '../i18n';
import { LanguageSelector } from '../i18n/LanguageSelector';
import { NotificationsBell } from '../components/NotificationsBell';

export const DashboardLayout: React.FC = () => {
  const { user, isLoading, currentShopId, memberships, switchShop, logout, currentMembership } = useAuth();
  const { t } = useTranslation();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-chairly-bg flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold tracking-wider uppercase text-zinc-500">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If logged in as customer, show dedicated customer portal
  if (user.role === 'CUSTOMER') {
    return <CustomerPortal />;
  }

  const isPlatformOwner = user.email === 'admin@chairly.app' || (user.role === 'OWNER' && user.email === 'admin@chairly.app');

  // If staff/admin has no shop assigned and is not platform owner, show unassigned message
  if (!currentShopId && !isPlatformOwner) {
    return (
      <div className="min-h-screen bg-chairly-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-xl border border-zinc-200 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-lg bg-zinc-100 text-black flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900 tracking-tight">
            {t('common.status') === 'Holat' ? 'Biriktirilgan sartaroshxona topilmadi' : 'No Barbershop Assigned'}
          </h2>
          <p className="text-xs text-zinc-600 leading-relaxed">
            {t('common.status') === 'Holat'
              ? 'Hisobingizga hali birorta ham sartaroshxona biriktirilmagan. Iltimos platforma administratori bilan bog‘laning.'
              : 'Your account does not currently have staff or manager permissions for any active barbershop. Please contact the platform owner.'}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-black text-white rounded-md text-xs font-semibold hover:bg-zinc-800 transition-colors"
            >
              {t('common.status') === 'Holat' ? 'Yangilash' : 'Refresh'}
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 bg-zinc-100 border border-zinc-200 text-zinc-900 rounded-md text-xs font-semibold hover:bg-zinc-200 transition-colors"
            >
              {t('nav.logout')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-chairly-bg flex flex-col lg:flex-row antialiased">
      {/* Desktop Sidebar (hidden on mobile/tablet) */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Top Header (Sleek, Minimal, Sharp) */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <Link
            to="/"
            onClick={() => setMobileDrawerOpen(false)}
            className="text-sm font-black tracking-[0.2em] uppercase text-black hover:text-zinc-600 transition-colors"
            title="CHAIRLY - Asosiy sahifa"
          >
            CHAIRLY
          </Link>
          {isPlatformOwner ? (
            <span className="text-[9px] font-bold tracking-wider uppercase text-amber-900 bg-amber-50 px-2 py-0.5 rounded-sm border border-amber-200">
              Platform Owner
            </span>
          ) : (
            <span className="text-[9px] font-bold tracking-wider uppercase text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-sm border border-zinc-200 truncate max-w-[120px]">
              {currentMembership?.shopName || 'Staff'}
            </span>
          )}
        </div>

        {/* Right actions: Notifications & Hamburger Button only */}
        <div className="flex items-center gap-2">
          <NotificationsBell />
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="w-9 h-9 rounded-md bg-zinc-100 hover:bg-zinc-200 text-black flex items-center justify-center transition-colors"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile Slide-Over Drawer (Houses All Navigation Elegantly) */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative ml-auto w-5/6 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 border-l border-zinc-200 animate-slide-left">
            {/* Drawer Header */}
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
              <Link
                to="/"
                onClick={() => setMobileDrawerOpen(false)}
                className="font-black text-sm tracking-[0.2em] uppercase text-black hover:text-zinc-600 transition-colors"
                title="CHAIRLY - Asosiy sahifa"
              >
                CHAIRLY
              </Link>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="w-7 h-7 rounded-md bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User Info Card in Drawer */}
            <div className="p-4 bg-zinc-50 border-b border-zinc-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-black text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {user?.firstName?.[0] || 'U'}
                  {user?.lastName?.[0] || ''}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-zinc-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-[11px] text-zinc-500 font-mono truncate">{user?.phone || user?.email}</p>
                </div>
              </div>

              {/* Active Shop Selector if multiple */}
              {memberships.length > 0 && (
                <div className="mt-3 pt-3 border-t border-zinc-200/80">
                  <span className="text-[9px] uppercase tracking-[0.15em] text-zinc-500 font-bold block mb-1">
                    {t('nav.barbershops')}
                  </span>
                  <div className="relative">
                    <select
                      value={currentShopId || ''}
                      onChange={(e) => {
                        switchShop(e.target.value);
                        setMobileDrawerOpen(false);
                      }}
                      className="w-full appearance-none bg-white border border-zinc-300 rounded-md pl-7 pr-7 py-1.5 text-xs font-semibold text-zinc-900 shadow-2xs focus:outline-hidden"
                    >
                      {memberships.map((m) => (
                        <option key={m.shopId} value={m.shopId}>
                          {m.shopName}
                        </option>
                      ))}
                    </select>
                    <Building2 className="w-3.5 h-3.5 text-zinc-500 absolute left-2 top-2 pointer-events-none" />
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-2 top-2 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              <span className="text-[9px] uppercase tracking-[0.15em] text-zinc-400 font-bold px-2 py-1 block">
                Menu
              </span>

              {[
                { label: t('nav.dashboard'), path: '/', icon: LayoutDashboard },
                { label: t('nav.appointments'), path: '/appointments', icon: Calendar },
                { label: t('nav.services'), path: '/services', icon: Scissors },
                { label: t('nav.staff'), path: '/staff', icon: UserCheck },
                { label: t('nav.customers'), path: '/customers', icon: Users },
                { label: t('nav.settings'), path: '/settings', icon: Settings },
                { label: t('nav.profile'), path: '/profile', icon: User },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-black text-white shadow-2xs'
                        : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </NavLink>
                );
              })}

              {/* Owner-Specific Links */}
              {isPlatformOwner && (
                <div className="pt-3 mt-3 border-t border-zinc-200 space-y-1">
                  <span className="text-[9px] uppercase tracking-[0.15em] text-zinc-400 font-bold px-2 py-1 block">
                    Platform Management
                  </span>
                  <NavLink
                    to="/applications"
                    onClick={() => setMobileDrawerOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-amber-100 text-amber-950 border border-amber-300'
                          : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                      }`
                    }
                  >
                    <FileText className="w-4 h-4 text-amber-700" />
                    {t('nav.applications')}
                  </NavLink>
                  <NavLink
                    to="/shops"
                    onClick={() => setMobileDrawerOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-zinc-900 text-white'
                          : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200'
                      }`
                    }
                  >
                    <Building2 className="w-4 h-4 text-zinc-700" />
                    {t('nav.barbershopNetwork')}
                  </NavLink>
                </div>
              )}
            </nav>

            {/* Language & Sign Out Drawer Footer */}
            <div className="p-4 border-t border-zinc-200 bg-zinc-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Til / Язык</span>
                <LanguageSelector />
              </div>

              <button
                onClick={() => {
                  setMobileDrawerOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                {t('nav.logout')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area (Liberated on mobile with NO bottom bar) */}
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 overflow-y-auto pb-12 lg:pb-8 w-full max-w-full overflow-x-hidden">
        {/* Desktop Header bar with Notifications & Language Selector */}
        <div className="hidden lg:flex items-center justify-between pb-5 mb-6 border-b border-zinc-200">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold tracking-wide text-zinc-500 uppercase">
              {isPlatformOwner ? '👑 Platform Owner Admin' : currentMembership?.shopName || 'Staff Portal'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <NotificationsBell />
            <LanguageSelector />
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  );
};
