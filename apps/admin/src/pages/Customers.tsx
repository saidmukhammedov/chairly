import React, { useState, useEffect } from 'react';
import { Search, Users, Phone, Mail, Calendar, DollarSign, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { format } from 'date-fns';

interface CustomerRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalSpent: number;
  lastBookingDate: string;
}

export const Customers: React.FC = () => {
  const { currentShopId, currentMembership } = useAuth();
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchCustomers = async () => {
    if (!currentShopId) return;
    setIsLoading(true);
    try {
      let url = `/customers/shop/${currentShopId}`;
      if (search) {
        url += `?search=${encodeURIComponent(search)}`;
      }
      const res = await api.get<CustomerRecord[]>(url);
      setCustomers(res);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [currentShopId, search]);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-chairly-dark">
            Customer Directory
          </h2>
          <p className="text-sm text-chairly-muted mt-0.5">
            Client profiles, visit frequency, and historical spend at {currentMembership?.shopName}
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, email..."
            className="w-full bg-white border border-chairly-border rounded-xl pl-9 pr-3.5 py-2 text-xs text-chairly-dark focus:outline-none focus:ring-2 focus:ring-chairly-terracotta-500/20 focus:border-chairly-terracotta-500 shadow-2xs"
          />
          <Search className="w-3.5 h-3.5 text-chairly-muted absolute left-3 top-3" />
        </div>
      </div>

      {/* Customers Table */}
      {isLoading ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-chairly-border">
          <div className="w-8 h-8 border-3 border-chairly-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-chairly-muted">Loading customer directory...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-chairly-border">
          <Users className="w-12 h-12 text-chairly-subtle mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-bold text-chairly-dark mb-1">No customers found</h3>
          <p className="text-sm text-chairly-muted mb-4 max-w-sm mx-auto">
            Customers will appear here automatically as they book appointments with your barbershop.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-chairly-border shadow-2xs overflow-hidden">
          {/* Mobile Card List (< sm) */}
          <div className="sm:hidden divide-y divide-chairly-border">
            {customers.map((c) => (
              <div key={c.id} className="p-4 space-y-2.5 hover:bg-chairly-bg/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-chairly-panel border border-chairly-border flex items-center justify-center font-bold text-xs text-chairly-dark shrink-0">
                      {c.firstName[0]}
                      {c.lastName[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-chairly-dark text-sm truncate">
                        {c.firstName} {c.lastName}
                      </p>
                      <p className="text-xs text-chairly-muted truncate">{c.email}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-chairly-dark text-sm">
                      {c.totalSpent.toLocaleString()} UZS
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-chairly-border/60">
                  <div>
                    <span className="text-chairly-muted block">Phone</span>
                    <span className="font-medium text-chairly-dark">
                      {c.phone || 'None'}
                    </span>
                  </div>
                  <div>
                    <span className="text-chairly-muted block">Bookings</span>
                    <span className="font-medium text-chairly-dark">
                      {c.completedBookings} completed {c.cancelledBookings > 0 && <span className="text-rose-500">({c.cancelledBookings} cancelled)</span>}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-chairly-muted flex items-center justify-between">
                  <span>Last Visit: {format(new Date(c.lastBookingDate), 'MMM d, yyyy')}</span>
                  <span className="font-semibold text-chairly-dark">{c.totalBookings} total bookings</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table (>= sm) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-chairly-bg/50 border-b border-chairly-border text-[11px] uppercase tracking-wider text-chairly-muted font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Contact</th>
                  <th className="px-6 py-3.5">Total Bookings</th>
                  <th className="px-6 py-3.5">Completed</th>
                  <th className="px-6 py-3.5">Total Spent</th>
                  <th className="px-6 py-3.5 text-right">Last Visit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-chairly-border">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-chairly-bg/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-chairly-panel border border-chairly-border flex items-center justify-center font-bold text-xs text-chairly-dark">
                          {c.firstName[0]}
                          {c.lastName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-chairly-dark">
                            {c.firstName} {c.lastName}
                          </p>
                          <p className="text-xs text-chairly-muted">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-chairly-muted">
                      {c.phone || 'No phone recorded'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-chairly-dark">
                      {c.totalBookings}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-emerald-600">{c.completedBookings}</span>
                      {c.cancelledBookings > 0 && (
                        <span className="text-xs text-rose-500 ml-1.5">({c.cancelledBookings} cancelled)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-chairly-dark">
                      {c.totalSpent.toLocaleString()} UZS
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-chairly-muted whitespace-nowrap">
                      {format(new Date(c.lastBookingDate), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
