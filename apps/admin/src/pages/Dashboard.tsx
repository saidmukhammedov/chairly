import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Users,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { format } from 'date-fns';

interface DashboardData {
  todayAppointmentsCount: number;
  upcomingAppointmentsCount: number;
  completedAppointmentsCount: number;
  cancelledAppointmentsCount: number;
  completedRevenue: number;
  expectedRevenue: number;
  activeBarbersCount: number;
  currency: string;
  todaySchedule: Array<{
    id: string;
    bookingReference: string;
    customerName: string;
    customerPhone?: string;
    barberName: string;
    serviceName: string;
    servicePrice: number;
    status: string;
    startTime: string;
    endTime: string;
  }>;
  recentAppointments: Array<{
    id: string;
    bookingReference: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    barberName: string;
    serviceName: string;
    servicePrice: number;
    status: string;
    startTime: string;
    createdAt: string;
  }>;
}

export const Dashboard: React.FC = () => {
  const { currentShopId, currentMembership } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    if (!currentShopId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<DashboardData>(`/dashboard/shop/${currentShopId}`);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentShopId]);

  const formatCurrency = (val: number) => {
    return `${val.toLocaleString()} ${data?.currency || 'UZS'}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-chairly-border/40 rounded-xl w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-chairly-border p-6" />
          ))}
        </div>
        <div className="h-96 bg-white rounded-2xl border border-chairly-border p-6" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-chairly-border">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-chairly-dark mb-1">Failed to load statistics</h3>
        <p className="text-sm text-chairly-muted mb-4">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="inline-flex items-center gap-2 px-4 py-2 bg-chairly-terracotta-500 text-white rounded-xl text-sm font-medium hover:bg-chairly-terracotta-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-chairly-dark">
            Business Overview
          </h2>
          <p className="text-sm text-chairly-muted mt-0.5">
            Real-time appointment metrics and schedule for {currentMembership?.shopName}
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-chairly-border hover:bg-chairly-panel rounded-xl text-xs font-semibold text-chairly-dark shadow-2xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-chairly-muted" />
          Refresh Stats
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Completed Revenue */}
        <div className="bg-white p-6 rounded-2xl border border-chairly-border shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between text-chairly-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed Revenue</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-chairly-dark tracking-tight">
            {formatCurrency(data.completedRevenue)}
          </div>
          <p className="text-xs text-chairly-muted mt-2">
            Expected upcoming: <span className="font-semibold text-chairly-dark">{formatCurrency(data.expectedRevenue)}</span>
          </p>
        </div>

        {/* Appointments Today */}
        <div className="bg-white p-6 rounded-2xl border border-chairly-border shadow-2xs">
          <div className="flex items-center justify-between text-chairly-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Today's Bookings</span>
            <div className="p-2 bg-chairly-terracotta-50 text-chairly-terracotta-600 rounded-xl">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-chairly-dark tracking-tight">
            {data.todayAppointmentsCount}
          </div>
          <p className="text-xs text-chairly-muted mt-2">
            Total upcoming on schedule: <span className="font-semibold text-chairly-dark">{data.upcomingAppointmentsCount}</span>
          </p>
        </div>

        {/* Completed vs Cancelled */}
        <div className="bg-white p-6 rounded-2xl border border-chairly-border shadow-2xs">
          <div className="flex items-center justify-between text-chairly-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed / Cancelled</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-chairly-dark tracking-tight flex items-baseline gap-2">
            <span className="text-emerald-600">{data.completedAppointmentsCount}</span>
            <span className="text-chairly-subtle text-base font-normal">/</span>
            <span className="text-rose-500 text-lg font-medium">{data.cancelledAppointmentsCount}</span>
          </div>
          <p className="text-xs text-chairly-muted mt-2">Historical bookings breakdown</p>
        </div>

        {/* Active Barbers */}
        <div className="bg-white p-6 rounded-2xl border border-chairly-border shadow-2xs">
          <div className="flex items-center justify-between text-chairly-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Barbers</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-chairly-dark tracking-tight">
            {data.activeBarbersCount}
          </div>
          <p className="text-xs text-chairly-muted mt-2">Staff taking bookings</p>
        </div>
      </div>

      {/* Today's Schedule Table */}
      <div className="bg-white rounded-2xl border border-chairly-border shadow-2xs overflow-hidden">
        <div className="px-6 py-5 border-b border-chairly-border flex items-center justify-between bg-chairly-bg/30">
          <div>
            <h3 className="font-bold text-chairly-dark text-base">Today's Appointments</h3>
            <p className="text-xs text-chairly-muted mt-0.5">
              Live schedule for {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <span className="px-2.5 py-1 bg-chairly-panel rounded-lg text-xs font-semibold text-chairly-dark">
            {data.todaySchedule.length} appointments
          </span>
        </div>

        {data.todaySchedule.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-10 h-10 text-chairly-subtle mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-chairly-dark">No appointments scheduled today</p>
            <p className="text-xs text-chairly-muted mt-1">
              New online bookings or manual walk-in reservations will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-chairly-bg/50 border-b border-chairly-border text-[11px] uppercase tracking-wider text-chairly-muted font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Time</th>
                  <th className="px-6 py-3.5">Ref</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Service</th>
                  <th className="px-6 py-3.5">Barber</th>
                  <th className="px-6 py-3.5">Price</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-chairly-border">
                {data.todaySchedule.map((appt) => (
                  <tr key={appt.id} className="hover:bg-chairly-bg/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-chairly-dark whitespace-nowrap">
                      {format(new Date(appt.startTime), 'HH:mm')} - {format(new Date(appt.endTime), 'HH:mm')}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-chairly-terracotta-600">
                      {appt.bookingReference}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-chairly-dark">{appt.customerName}</p>
                      {appt.customerPhone && (
                        <p className="text-xs text-chairly-muted">{appt.customerPhone}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-chairly-dark">
                      {appt.serviceName}
                    </td>
                    <td className="px-6 py-4 text-chairly-muted">
                      {appt.barberName}
                    </td>
                    <td className="px-6 py-4 font-semibold text-chairly-dark">
                      {appt.servicePrice.toLocaleString()} {data.currency}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={appt.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Activity List */}
      <div className="bg-white rounded-2xl border border-chairly-border shadow-2xs overflow-hidden">
        <div className="px-6 py-5 border-b border-chairly-border">
          <h3 className="font-bold text-chairly-dark text-base">Recent Booking Activity</h3>
          <p className="text-xs text-chairly-muted mt-0.5">Latest appointments recorded across all dates</p>
        </div>
        <div className="divide-y divide-chairly-border">
          {data.recentAppointments.map((appt) => (
            <div key={appt.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-chairly-bg/30 transition-colors">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-chairly-panel border border-chairly-border flex items-center justify-center font-bold text-xs text-chairly-dark shrink-0">
                  {appt.bookingReference}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-chairly-dark truncate">{appt.customerName}</p>
                    <StatusBadge status={appt.status} />
                  </div>
                  <p className="text-xs text-chairly-muted truncate mt-0.5">
                    {appt.serviceName} with <span className="font-medium text-chairly-dark">{appt.barberName}</span> • Scheduled for {format(new Date(appt.startTime), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="font-bold text-chairly-dark text-sm">
                  {appt.servicePrice.toLocaleString()} {data.currency}
                </p>
                <p className="text-[11px] text-chairly-muted">
                  Booked {format(new Date(appt.createdAt), 'MMM d, HH:mm')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
