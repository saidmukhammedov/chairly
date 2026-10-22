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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, memberships, currentShopId, currentMembership, switchShop, logout, login } = useAuth();

  const handleQuickSwitch = async (email: string) => {
    try {
      await login(email, 'chairly123');
      window.location.reload();
    } catch (err: any) {
      alert('Quick switch failed: ' + err.message);
    }
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Appointments', path: '/appointments', icon: Calendar },
    { label: 'Services', path: '/services', icon: Scissors },
    { label: 'Staff & Barbers', path: '/staff', icon: UserCheck },
    { label: 'Customers', path: '/customers', icon: Users },
    { label: 'Shop Settings', path: '/settings', icon: Settings },
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
          {user?.role === 'OWNER' ? (
            <span className="text-[10px] font-bold tracking-wide uppercase text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
              👑 Website Owner
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
          Active Barbershop
        </label>
        <div className="relative">
          <select
            value={currentShopId || ''}
            onChange={(e) => switchShop(e.target.value)}
            className="w-full appearance-none bg-white border border-chairly-border rounded-lg pl-8 pr-8 py-2 text-sm font-medium text-chairly-dark focus:outline-none focus:ring-2 focus:ring-chairly-terracotta-500/20 focus:border-chairly-terracotta-500 cursor-pointer shadow-2xs"
          >
            {memberships.map((m) => (
              <option key={m.shopId} value={m.shopId}>
                {m.shopName}
              </option>
            ))}
          </select>
          <Building2 className="w-4 h-4 text-chairly-muted absolute left-2.5 top-2.5 pointer-events-none" />
          <ChevronDown className="w-4 h-4 text-chairly-muted absolute right-2.5 top-2.5 pointer-events-none" />
        </div>
        {currentMembership && (
          <div className="mt-1.5 text-xs text-chairly-muted flex items-center justify-between">
            <span>Role:</span>
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
      </nav>

      {/* Quick Switch Demo Accounts */}
      <div className="p-3 border-t border-chairly-border bg-chairly-bg/30">
        <span className="text-[10px] uppercase font-bold tracking-wider text-chairly-muted block mb-1.5 px-1">
          Switch Demo Account
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => handleQuickSwitch('customer@chairly.app')}
            className="px-2 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-chairly-border rounded-lg text-[11px] font-semibold text-center transition-all shadow-2xs"
            title="Switch to Demo Customer Portal"
          >
            👤 Customer
          </button>
          <button
            type="button"
            onClick={() =>
              handleQuickSwitch(
                user?.email === 'admin@chairly.app' ? 'owner@chopchop.uz' : 'admin@chairly.app'
              )
            }
            className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold text-center transition-all border shadow-2xs ${
              user?.email === 'admin@chairly.app'
                ? 'bg-white hover:bg-chairly-panel text-chairly-dark border-chairly-border'
                : 'bg-white hover:bg-amber-50 text-amber-800 border-amber-200'
            }`}
            title="Switch between Shop Admin and Website Owner"
          >
            {user?.email === 'admin@chairly.app' ? '💈 Shop Admin' : '👑 Owner'}
          </button>
        </div>
      </div>

      {/* Staff Profile & Logout */}
      <div className="p-4 border-t border-chairly-border bg-chairly-bg/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-chairly-panel border border-chairly-border flex items-center justify-center font-medium text-sm text-chairly-dark shrink-0">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-chairly-dark truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-chairly-muted truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            className="p-1.5 rounded-lg text-chairly-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
