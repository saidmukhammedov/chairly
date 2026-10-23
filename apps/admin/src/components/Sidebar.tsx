import React from 'react';
import { NavLink } from 'react-router-dom';
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
  User,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n';
import { formatPhone } from '@chairly/shared';

export const Sidebar: React.FC = () => {
  const { user, memberships, currentShopId, currentMembership, switchShop, logout } = useAuth();
  const { t } = useTranslation();
  const isPlatformOwner = user?.email === 'admin@chairly.app' || (user?.role === 'OWNER' && user?.email === 'admin@chairly.app');

  const navItems = [
    { label: t('nav.dashboard'), path: '/', icon: LayoutDashboard },
    { label: t('nav.appointments'), path: '/appointments', icon: Calendar },
    { label: t('nav.services'), path: '/services', icon: Scissors },
    { label: t('nav.staff'), path: '/staff', icon: UserCheck },
    { label: t('nav.customers'), path: '/customers', icon: Users },
    { label: t('nav.settings'), path: '/settings', icon: Settings },
    { label: t('nav.profile'), path: '/profile', icon: User },
  ];

  return (
    <aside className="w-64 bg-white border-r border-chairly-border flex flex-col h-screen fixed left-0 top-0 z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-chairly-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-chairly-terracotta-500 text-white flex items-center justify-center font-bold text-xl shadow-sm">
          C
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-chairly-dark leading-tight">
            Chairly
          </h1>
          {isPlatformOwner ? (
            <span className="text-[10px] font-bold tracking-wide uppercase text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
              👑 {t('common.status') === 'Holat' ? 'Platforma Egasi' : 'Platform Owner'}
            </span>
          ) : (
            <span className="text-[10px] font-medium tracking-wide uppercase text-chairly-terracotta-600 bg-chairly-terracotta-50 px-1.5 py-0.5 rounded">
              Staff Portal
            </span>
          )}
        </div>
      </div>

      {/* Shop Switcher */}
      <div className="p-4 border-b border-chairly-border bg-chairly-bg/60">
        <label className="text-[11px] uppercase tracking-wider text-chairly-muted font-semibold block mb-1.5">
          {t('nav.barbershops')}
        </label>
        <div className="relative">
          <select
            value={currentShopId || ''}
            onChange={(e) => switchShop(e.target.value)}
            disabled={memberships.length === 0}
            className="w-full appearance-none bg-white border border-chairly-border rounded-lg pl-8 pr-8 py-2 text-sm font-medium text-chairly-dark focus:outline-none focus:ring-2 focus:ring-chairly-terracotta-500/20 focus:border-chairly-terracotta-500 cursor-pointer shadow-2xs disabled:opacity-60"
          >
            {memberships.length === 0 ? (
              <option value="">{t('common.noData')}</option>
            ) : (
              memberships.map((m) => (
                <option key={m.shopId} value={m.shopId}>
                  {m.shopName}
                </option>
              ))
            )}
          </select>
          <Building2 className="w-4 h-4 text-chairly-muted absolute left-2.5 top-2.5 pointer-events-none" />
          <ChevronDown className="w-4 h-4 text-chairly-muted absolute right-2.5 top-2.5 pointer-events-none" />
        </div>
        {currentMembership && (
          <div className="mt-1.5 text-xs text-chairly-muted flex items-center justify-between">
            <span>Rol:</span>
            <span className="font-semibold text-chairly-dark">{currentMembership.role}</span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-chairly-terracotta-50 text-chairly-terracotta-600 font-semibold'
                    : 'text-chairly-muted hover:text-chairly-dark hover:bg-chairly-panel'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          );
        })}

        {/* Platform Owner Exclusive Menu Items */}
        {isPlatformOwner && (
          <div className="pt-3 mt-3 border-t border-chairly-border space-y-1">
            <NavLink
              to="/applications"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-amber-50/80 text-amber-800 border border-amber-200/80 hover:bg-amber-100'
                }`
              }
            >
              <FileText className="w-5 h-5 text-amber-700" />
              {t('nav.applications')}
            </NavLink>

            <NavLink
              to="/shops"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-chairly-terracotta-100 text-chairly-terracotta-900 border border-chairly-terracotta-300'
                    : 'bg-chairly-panel hover:bg-chairly-border text-chairly-dark border border-chairly-border'
                }`
              }
            >
              <Building2 className="w-5 h-5 text-chairly-terracotta-600" />
              {t('nav.barbershopNetwork')}
            </NavLink>
          </div>
        )}
      </nav>

      {/* Staff Profile & Logout */}
      <div className="p-4 border-t border-chairly-border bg-chairly-bg/40">
        <div className="flex items-center justify-between">
          <NavLink
            to="/profile"
            className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity"
            title={t('nav.profile')}
          >
            <div className="w-9 h-9 rounded-full bg-chairly-terracotta-100 text-chairly-terracotta-700 border border-chairly-terracotta-200 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <>
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-chairly-dark truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[11px] text-chairly-muted truncate">
                {user?.phone ? formatPhone(user.phone) : user?.email}
              </p>
            </div>
          </NavLink>
          <button
            onClick={logout}
            title={t('nav.logout')}
            className="p-1.5 rounded-lg text-chairly-muted hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
