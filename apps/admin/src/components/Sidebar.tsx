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
    <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col h-screen fixed left-0 top-0 z-30 antialiased">
      {/* Brand Header */}
      <div className="p-5 border-b border-zinc-200 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-black tracking-[0.25em] uppercase text-black">
            CHAIRLY
          </h1>
          <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold mt-0.5">
            {isPlatformOwner ? 'Platform Owner' : 'Shop Management'}
          </p>
        </div>
        {isPlatformOwner && (
          <span className="text-[9px] font-bold tracking-wider uppercase text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-sm">
            👑 Owner
          </span>
        )}
      </div>

      {/* Shop Switcher */}
      {memberships.length > 0 && (
        <div className="p-3.5 border-b border-zinc-200 bg-zinc-50/60">
          <label className="text-[9px] uppercase tracking-[0.15em] text-zinc-400 font-bold block mb-1">
            {t('nav.barbershops')}
          </label>
          <div className="relative">
            <select
              value={currentShopId || ''}
              onChange={(e) => switchShop(e.target.value)}
              className="w-full appearance-none bg-white border border-zinc-300 rounded-md pl-7 pr-7 py-1.5 text-xs font-semibold text-zinc-900 shadow-2xs focus:outline-hidden cursor-pointer"
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

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <span className="text-[9px] uppercase tracking-[0.15em] text-zinc-400 font-bold px-2 py-1 block">
          Navigation
        </span>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-black text-white shadow-2xs'
                    : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          );
        })}

        {/* Platform Owner Exclusive Menu Items */}
        {isPlatformOwner && (
          <div className="pt-3 mt-3 border-t border-zinc-200 space-y-1">
            <span className="text-[9px] uppercase tracking-[0.15em] text-zinc-400 font-bold px-2 py-1 block">
              Platform Administration
            </span>
            <NavLink
              to="/applications"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-amber-100 text-amber-950 border border-amber-300'
                    : 'bg-amber-50/80 text-amber-900 border border-amber-200/80 hover:bg-amber-100'
                }`
              }
            >
              <FileText className="w-4 h-4 text-amber-700" />
              {t('nav.applications')}
            </NavLink>

            <NavLink
              to="/shops"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-bold transition-all ${
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

      {/* Staff Profile & Logout */}
      <div className="p-3.5 border-t border-zinc-200 bg-zinc-50/60">
        <div className="flex items-center justify-between">
          <NavLink
            to="/profile"
            className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity"
            title={t('nav.profile')}
          >
            <div className="w-8 h-8 rounded-md bg-black text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <>
                  {user?.firstName?.[0] || 'U'}
                  {user?.lastName?.[0] || ''}
                </>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-zinc-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] text-zinc-500 font-mono truncate">
                {user?.phone ? formatPhone(user.phone) : user?.email}
              </p>
            </div>
          </NavLink>
          <button
            onClick={logout}
            title={t('nav.logout')}
            className="p-1.5 rounded-md text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
