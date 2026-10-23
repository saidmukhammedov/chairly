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
import { useTranslation } from '../i18n';
import { formatPhone } from '@chairly/shared';

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
  const { t } = useTranslation();
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
        <div className="h-6 bg-zinc-200 rounded-sm w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-lg border border-zinc-200 p-5" />
          ))}
        </div>
        <div className="h-72 bg-white rounded-lg border border-zinc-200 p-6" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-zinc-200 max-w-md mx-auto space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-zinc-900">Ma'lumotlarni yuklab bo'lmadi</h3>
        <p className="text-xs text-zinc-500">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-md text-xs font-semibold hover:bg-zinc-800 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {t('common.tryAgain')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl antialiased">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-zinc-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900">
            {t('dashboard.overview')}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            {currentMembership?.shopName} — {t('dashboard.overviewSubtitle')}
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-md text-xs font-semibold text-zinc-900 shadow-2xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-zinc-500" />
          {t('common.refresh')}
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Completed Revenue */}
        <div className="bg-white p-5 rounded-lg border border-zinc-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              {t('dashboard.completedRevenue')}
            </span>
            <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-md flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
            {formatCurrency(data.completedRevenue)}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1.5">
            Kutilayotgan: <span className="font-semibold text-zinc-900">{formatCurrency(data.expectedRevenue)}</span>
          </p>
        </div>

        {/* Appointments Today */}
        <div className="bg-white p-5 rounded-lg border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              {t('dashboard.todayBookings')}
            </span>
            <div className="w-7 h-7 bg-zinc-100 text-black rounded-md flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
            {data.todayAppointmentsCount}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1.5">
            Jadvaldagi barcha qabullar: <span className="font-semibold text-zinc-900">{data.upcomingAppointmentsCount}</span>
          </p>
        </div>

        {/* Completed vs Cancelled */}
        <div className="bg-white p-5 rounded-lg border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Bajarilgan / Bekor
            </span>
            <div className="w-7 h-7 bg-zinc-100 text-zinc-700 rounded-md flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight flex items-baseline gap-2">
            <span className="text-emerald-700">{data.completedAppointmentsCount}</span>
            <span className="text-zinc-300 font-normal">/</span>
            <span className="text-rose-600 font-bold">{data.cancelledAppointmentsCount}</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1.5">Barcha vaqtlar hisobi</p>
        </div>

        {/* Active Barbers */}
        <div className="bg-white p-5 rounded-lg border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              {t('dashboard.activeBarbers')}
            </span>
            <div className="w-7 h-7 bg-zinc-100 text-zinc-700 rounded-md flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
            {data.activeBarbersCount}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1.5">Qabul qiluvchi ustalar</p>
        </div>
      </div>

      {/* Today's Schedule List */}
      <div className="bg-white rounded-lg border border-zinc-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <div>
            <h3 className="font-bold text-zinc-900 text-sm sm:text-base">
              {t('dashboard.todaySchedule')}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {format(new Date(), 'EEEE, d MMMM yyyy')}
            </p>
          </div>
          <span className="px-2 py-0.5 bg-white border border-zinc-200 rounded-sm text-xs font-mono font-bold text-zinc-900">
            {data.todaySchedule.length} qabul
          </span>
        </div>

        {data.todaySchedule.length === 0 ? (
          <div className="p-10 text-center">
            <Clock className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-zinc-900">{t('dashboard.noTodayAppts')}</p>
            <p className="text-xs text-zinc-500 mt-1">
              Yangi onlayn buyurtmalar shu yerda avtomatik tarzda ko'rinadi.
            </p>
          </div>
        ) : (
          <div>
            {/* Mobile Card List (< sm) */}
            <div className="sm:hidden divide-y divide-zinc-100">
              {data.todaySchedule.map((appt) => (
                <div key={appt.id} className="p-4 space-y-2 hover:bg-zinc-50 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-black">
                        {appt.bookingReference}
                      </span>
                      <span className="text-zinc-300">•</span>
                      <span className="text-xs font-semibold text-zinc-700">
                        {format(new Date(appt.startTime), 'HH:mm')} - {format(new Date(appt.endTime), 'HH:mm')}
                      </span>
                    </div>
                    <StatusBadge status={appt.status} />
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-zinc-900 text-sm truncate">{appt.customerName}</p>
                      {appt.customerPhone && (
                        <p className="text-xs text-zinc-500 font-mono truncate">{formatPhone(appt.customerPhone)}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-zinc-900 text-sm">
                        {appt.servicePrice.toLocaleString()} {data.currency}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-zinc-500 pt-1 border-t border-zinc-100">
                    <span className="font-semibold text-zinc-800">{appt.serviceName}</span> • {appt.barberName}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (>= sm) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
                  <tr>
                    <th className="px-5 py-3">Vaqt</th>
                    <th className="px-5 py-3">Raqam</th>
                    <th className="px-5 py-3">Mijoz</th>
                    <th className="px-5 py-3">Xizmat</th>
                    <th className="px-5 py-3">Usta</th>
                    <th className="px-5 py-3">Narx</th>
                    <th className="px-5 py-3">Holat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {data.todaySchedule.map((appt) => (
                    <tr key={appt.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-zinc-900 whitespace-nowrap">
                        {format(new Date(appt.startTime), 'HH:mm')} - {format(new Date(appt.endTime), 'HH:mm')}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs font-bold text-black">
                        {appt.bookingReference}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-zinc-900">{appt.customerName}</p>
                        {appt.customerPhone && (
                          <p className="text-xs text-zinc-500 font-mono">{formatPhone(appt.customerPhone)}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-zinc-900">
                        {appt.serviceName}
                      </td>
                      <td className="px-5 py-3.5 text-zinc-600">
                        {appt.barberName}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-zinc-900">
                        {appt.servicePrice.toLocaleString()} {data.currency}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={appt.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity List */}
      <div className="bg-white rounded-lg border border-zinc-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-200">
          <h3 className="font-bold text-zinc-900 text-sm sm:text-base">
            {t('dashboard.recentActivity')}
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">Barcha sanalar bo'yicha so'nggi yozilishlar</p>
        </div>
        <div className="divide-y divide-zinc-100">
          {data.recentAppointments.map((appt) => (
            <div key={appt.id} className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-md bg-zinc-100 border border-zinc-200 flex items-center justify-center font-mono font-bold text-xs text-black shrink-0">
                  {appt.bookingReference?.slice(-3)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-zinc-900 text-xs sm:text-sm truncate">{appt.customerName}</p>
                    <StatusBadge status={appt.status} />
                  </div>
                  <p className="text-xs text-zinc-500 truncate mt-0.5">
                    {appt.serviceName} • <span className="font-medium text-zinc-800">{appt.barberName}</span> • {format(new Date(appt.startTime), 'd MMM, HH:mm')}
                  </p>
                </div>
              </div>
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-100">
                <p className="font-bold text-zinc-900 text-xs sm:text-sm">
                  {appt.servicePrice.toLocaleString()} {data.currency}
                </p>
                <p className="text-[10px] text-zinc-400">
                  {format(new Date(appt.createdAt), 'd MMM, HH:mm')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
