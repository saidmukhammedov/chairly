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
          <div className="w-8 h-8 border-3 border-chairly-terracotta-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-chairly-muted">{t('common.loading')}</p>
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
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-chairly-border shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-chairly-dark">
            {t('common.status') === 'Holat' ? 'Biriktirilgan sartaroshxona topilmadi' : 'No Barbershop Assigned'}
          </h2>
          <p className="text-sm text-chairly-muted leading-relaxed">
            {t('common.status') === 'Holat'
              ? 'Hisobingizga hali birorta ham sartaroshxona biriktirilmagan. Iltimos platforma administratori bilan bog‘laning.'
              : 'Your account does not currently have staff or manager permissions for any active barbershop. Please contact the platform owner.'}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2.5 bg-chairly-terracotta-500 text-white rounded-xl text-xs font-semibold hover:bg-chairly-terracotta-600 transition-colors"
            >
              {t('common.status') === 'Holat' ? 'Yangilash' : 'Refresh'}
            </button>
            <button
              onClick={logout}
              className="px-4 py-2.5 bg-chairly-bg border border-chairly-border text-chairly-dark rounded-xl text-xs font-semibold hover:bg-chairly-panel transition-colors"
            >
              {t('nav.logout')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const mobileNavItems = isPlatformOwner
    ? [
        { label: t('nav.dashboard'), path: '/', icon: LayoutDashboard },
        { label: t('nav.applications'), path: '/applications', icon: FileText },
        { label: t('nav.barbershopNetwork'), path: '/shops', icon: Building2 },
        { label: t('nav.appointments'), path: '/appointments', icon: Calendar },
      ]
    : [
        { label: t('nav.dashboard'), path: '/', icon: LayoutDashboard },
        { label: t('nav.appointments'), path: '/appointments', icon: Calendar },
        { label: t('nav.services'), path: '/services', icon: Scissors },
        { label: t('nav.staff'), path: '/staff', icon: UserCheck },
      ];

  return (
    <div className="min-h-screen bg-chairly-bg flex flex-col lg:flex-row">
      {/* Desktop Sidebar (hidden on mobile/tablet) */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Top Header (hidden on desktop) */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-chairly-border px-3 py-2.5 flex items-center justify-between shadow-2xs safe-area-pt">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-chairly-terracotta-500 text-white flex items-center justify-center font-bold text-base shadow-2xs">
            C
          </div>
          <div>
            <span className="text-sm font-bold text-chairly-dark tracking-tight leading-tight block">
              Chairly
            </span>
            {isPlatformOwner ? (
              <span className="text-[9px] font-bold text-amber-800 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                👑 Platform Owner
              </span>
            ) : (
              <span className="text-[9px] font-medium text-chairly-terracotta-700 bg-chairly-terracotta-50 px-1 py-0.2 rounded">
                Staff
              </span>
            )}
          </div>
        </div>

        {/* Right actions: active shop pill, notification bell, language selector & drawer trigger */}
        <div className="flex items-center gap-1.5">
          {memberships.length > 0 && (
            <div className="relative">
              <select
                value={currentShopId || ''}
                onChange={(e) => switchShop(e.target.value)}
                className="appearance-none bg-chairly-bg border border-chairly-border rounded-lg pl-2 pr-5 py-1 text-[11px] font-semibold text-chairly-dark max-w-[110px] sm:max-w-[150px] truncate focus:outline-hidden"
              >
                {memberships.map((m) => (
                  <option key={m.shopId} value={m.shopId}>
                    {m.shopName}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-chairly-muted absolute right-1 top-2 pointer-events-none" />
            </div>
          )}

          <NotificationsBell />
          <LanguageSelector />

          <Link
            to="/profile"
            className="w-8 h-8 rounded-full bg-chairly-terracotta-100 text-chairly-terracotta-700 font-bold text-xs flex items-center justify-center border border-chairly-terracotta-200"
            title={t('nav.profile')}
          >
            {user?.firstName?.[0] || 'U'}
          </Link>

          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="p-1.5 rounded-xl text-chairly-dark hover:bg-chairly-panel transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Slide-Over Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative ml-auto w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-left">
            {/* Drawer Header */}
            <div className="p-4 border-b border-chairly-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-chairly-terracotta-500 text-white flex items-center justify-center font-bold text-base shadow-2xs">
                  C
                </div>
                <span className="font-bold text-chairly-dark text-base">Chairly</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-chairly-bg border border-chairly-border flex items-center justify-center text-chairly-muted hover:text-chairly-dark"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Shop Switcher in Drawer */}
            {memberships.length > 0 && (
              <div className="p-4 bg-chairly-bg border-b border-chairly-border">
                <label className="text-[10px] uppercase tracking-wider text-chairly-muted font-bold block mb-1.5">
                  {t('nav.barbershops')}
                </label>
                <div className="relative">
                  <select
                    value={currentShopId || ''}
                    onChange={(e) => {
                      switchShop(e.target.value);
                      setMobileDrawerOpen(false);
                    }}
                    className="w-full appearance-none bg-white border border-chairly-border rounded-xl pl-8 pr-8 py-2 text-xs font-semibold text-chairly-dark shadow-2xs"
                  >
                    {memberships.map((m) => (
                      <option key={m.shopId} value={m.shopId}>
                        {m.shopName}
                      </option>
                    ))}
                  </select>
                  <Building2 className="w-3.5 h-3.5 text-chairly-muted absolute left-2.5 top-2.5 pointer-events-none" />
                  <ChevronDown className="w-3.5 h-3.5 text-chairly-muted absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Nav Links */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
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
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all min-h-[44px] ${
                      isActive
                        ? 'bg-chairly-terracotta-50 text-chairly-terracotta-600'
                        : 'text-chairly-muted hover:text-chairly-dark hover:bg-chairly-panel'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </NavLink>
                );
              })}

              {/* Owner-Specific Links */}
              {isPlatformOwner && (
                <div className="pt-2 mt-2 border-t border-chairly-border space-y-1">
                  <NavLink
                    to="/applications"
                    onClick={() => setMobileDrawerOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                        isActive
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
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
                      `flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                        isActive
                          ? 'bg-chairly-terracotta-100 text-chairly-terracotta-900 border border-chairly-terracotta-300'
                          : 'bg-chairly-panel hover:bg-chairly-border text-chairly-dark border border-chairly-border'
                      }`
                    }
                  >
                    <Building2 className="w-4 h-4 text-chairly-terracotta-600" />
                    {t('nav.barbershopNetwork')}
                  </NavLink>
                </div>
              )}
            </nav>

            {/* User Profile & Sign Out Footer */}
            <div className="p-4 border-t border-chairly-border flex items-center justify-between">
              <Link
                to="/profile"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center gap-2.5 min-w-0 flex-1"
              >
                <div className="w-8 h-8 rounded-full bg-chairly-terracotta-100 text-chairly-terracotta-700 font-bold text-xs flex items-center justify-center shrink-0">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-chairly-dark truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-[10px] text-chairly-muted truncate">{user?.phone || user?.email}</p>
                </div>
              </Link>
              <button
                onClick={logout}
                title={t('nav.logout')}
                className="p-2 rounded-lg text-chairly-muted hover:text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 overflow-y-auto pb-24 lg:pb-8 w-full max-w-full overflow-x-hidden">
        {/* Desktop Header bar with Notifications & Language Selector */}
        <div className="hidden lg:flex items-center justify-between pb-5 mb-6 border-b border-chairly-border">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-chairly-muted">
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

      {/* Mobile Bottom Navigation Bar (Fixed for quick touch access) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-chairly-border px-2 py-1.5 flex items-center justify-around lg:hidden shadow-lg safe-area-pb">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all min-h-[44px] min-w-[56px] ${
                isActive
                  ? 'text-chairly-terracotta-600 font-bold'
                  : 'text-chairly-muted hover:text-chairly-dark'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
            </NavLink>
          );
        })}

        {/* More button */}
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-chairly-muted hover:text-chairly-dark transition-all min-h-[44px] min-w-[56px]"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-medium tracking-tight">{t('common.more')}</span>
        </button>
      </nav>
    </div>
  );
};