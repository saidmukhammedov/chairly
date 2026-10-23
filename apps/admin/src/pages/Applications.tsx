import React, { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  User,
  Phone,
  MapPin,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n';
import api from '../services/api';
import { Modal } from '../components/Modal';
import { formatPhone } from '@chairly/shared';

interface ApplicationItem {
  id: string;
  shopName: string;
  applicantName: string;
  applicantPhone: string;
  city: string;
  address: string;
  shopPhone: string;
  description: string;
  logoUrl?: string;
  coverImageUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  approvedShopId?: string;
  createdAt: string;
  updatedAt: string;
}

export const Applications: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isPlatformOwner = user?.email === 'admin@chairly.app';

  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected Detail Modal
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Reject Action Modal
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchApplications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<{
        applications: ApplicationItem[];
        counts: { total: number; pending: number; approved: number; rejected: number };
      }>(`/applications?status=${activeFilter}`);
      setApplications(res.applications);
      setCounts(res.counts);
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isPlatformOwner) {
      fetchApplications();
    }
  }, [activeFilter, isPlatformOwner]);

  const handleApprove = async (appId: string) => {
    if (!window.confirm(t('ownerApplications.confirmApproveMsg'))) {
      return;
    }
    setIsProcessing(true);
    try {
      const res = await api.post<{ success: boolean; shop: any; adminUser: any }>(`/applications/${appId}/approve`, {});
      setActionSuccess(t('ownerApplications.approveSuccess'));
      setIsDetailOpen(false);
      fetchApplications();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp) return;
    setIsProcessing(true);
    try {
      await api.post(`/applications/${selectedApp.id}/reject`, {
        reason: rejectReason.trim() || undefined,
      });
      setActionSuccess(t('ownerApplications.rejectSuccess'));
      setIsRejectModalOpen(false);
      setIsDetailOpen(false);
      setRejectReason('');
      fetchApplications();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isPlatformOwner) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-chairly-border">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-chairly-dark">Ruxsat cheklangan</h2>
        <p className="text-xs text-chairly-muted mt-1">Ushbu sahifaga faqat platforma egasi kira oladi.</p>
      </div>
    );
  }

  const filtered = applications.filter((app) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      app.shopName.toLowerCase().includes(q) ||
      app.applicantName.toLowerCase().includes(q) ||
      app.city.toLowerCase().includes(q) ||
      app.applicantPhone.includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-chairly-dark">
            {t('ownerApplications.title')}
          </h2>
          <p className="text-sm text-chairly-muted mt-0.5">
            {t('ownerApplications.subtitle')}
          </p>
        </div>
        <button
          onClick={fetchApplications}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-chairly-border hover:bg-chairly-panel rounded-xl text-xs font-semibold text-chairly-dark shadow-2xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-chairly-muted" />
          {t('common.refresh')}
        </button>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          {actionSuccess}
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-chairly-border shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveFilter('PENDING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5 ${
              activeFilter === 'PENDING'
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-chairly-panel hover:bg-chairly-border text-chairly-muted'
            }`}
          >
            <span>{t('ownerApplications.filterPending')}</span>
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center">
              {counts.pending}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 ${
              activeFilter === 'ALL'
                ? 'bg-chairly-dark text-white'
                : 'bg-chairly-panel hover:bg-chairly-border text-chairly-muted'
            }`}
          >
            {t('ownerApplications.filterAll')} ({counts.total})
          </button>

          <button
            onClick={() => setActiveFilter('APPROVED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 ${
              activeFilter === 'APPROVED'
                ? 'bg-emerald-600 text-white'
                : 'bg-chairly-panel hover:bg-chairly-border text-chairly-muted'
            }`}
          >
            {t('ownerApplications.filterApproved')} ({counts.approved})
          </button>

          <button
            onClick={() => setActiveFilter('REJECTED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 ${
              activeFilter === 'REJECTED'
                ? 'bg-rose-600 text-white'
                : 'bg-chairly-panel hover:bg-chairly-border text-chairly-muted'
            }`}
          >
            {t('ownerApplications.filterRejected')} ({counts.rejected})
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('common.search')}
            className="w-full bg-chairly-bg/50 border border-chairly-border rounded-xl pl-9 pr-3.5 py-2 text-xs text-chairly-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-chairly-terracotta-500/20 focus:border-chairly-terracotta-500"
          />
          <Search className="w-3.5 h-3.5 text-chairly-muted absolute left-3 top-3" />
        </div>
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-chairly-border">
          <div className="w-8 h-8 border-3 border-chairly-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-chairly-muted">{t('common.loading')}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-chairly-border">
          <FileText className="w-12 h-12 text-chairly-subtle mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-bold text-chairly-dark mb-1">
            {t('ownerApplications.emptyState')}
          </h3>
          <p className="text-xs text-chairly-muted max-w-sm mx-auto">
            {t('ownerApplications.emptyStateDesc')}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-chairly-border shadow-2xs overflow-hidden">
          {/* Mobile Card View (< sm) */}
          <div className="sm:hidden divide-y divide-chairly-border">
            {filtered.map((app) => (
              <div
                key={app.id}
                onClick={() => {
                  setSelectedApp(app);
                  setIsDetailOpen(true);
                }}
                className="p-4 space-y-3 hover:bg-chairly-bg/30 cursor-pointer transition-colors active:bg-chairly-panel"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-chairly-dark text-sm">{app.shopName}</span>
                    <span className="text-xs text-chairly-muted">• {app.city}</span>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      app.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : app.status === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {app.status === 'APPROVED'
                      ? t('application.approvedStatus')
                      : app.status === 'REJECTED'
                      ? t('application.rejectedStatus')
                      : t('application.pendingStatus')}
                  </span>
                </div>

                <div className="text-xs text-chairly-muted">
                  <p className="font-medium text-chairly-dark">{app.applicantName}</p>
                  <p>{formatPhone(app.applicantPhone)}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-chairly-border/60 text-xs">
                  <span className="text-chairly-muted text-[11px]">
                    {new Date(app.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedApp(app);
                      setIsDetailOpen(true);
                    }}
                    className="px-3 py-1 bg-chairly-panel hover:bg-chairly-border text-chairly-dark font-semibold rounded-lg text-xs border border-chairly-border min-h-[36px] flex items-center"
                  >
                    {t('ownerApplications.inspect')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= sm) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-chairly-bg/50 border-b border-chairly-border text-[11px] uppercase tracking-wider text-chairly-muted font-semibold">
                <tr>
                  <th className="px-6 py-3.5">{t('ownerApplications.business')}</th>
                  <th className="px-6 py-3.5">{t('ownerApplications.applicant')}</th>
                  <th className="px-6 py-3.5">{t('ownerApplications.location')}</th>
                  <th className="px-6 py-3.5">{t('ownerApplications.date')}</th>
                  <th className="px-6 py-3.5">{t('common.status')}</th>
                  <th className="px-6 py-3.5 text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-chairly-border">
                {filtered.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => {
                      setSelectedApp(app);
                      setIsDetailOpen(true);
                    }}
                    className="hover:bg-chairly-bg/40 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-chairly-panel border border-chairly-border flex items-center justify-center font-bold text-xs text-chairly-dark shrink-0">
                          {app.logoUrl ? (
                            <img src={app.logoUrl} alt={app.shopName} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <Building2 className="w-5 h-5 text-chairly-muted" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-chairly-dark">{app.shopName}</p>
                          <p className="text-xs text-chairly-muted">{app.shopPhone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-chairly-dark">{app.applicantName}</p>
                      <p className="text-xs text-chairly-muted">{formatPhone(app.applicantPhone)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-chairly-dark">{app.city}</p>
                      <p className="text-xs text-chairly-muted truncate max-w-xs">{app.address}</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-chairly-muted whitespace-nowrap">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          app.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : app.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {app.status === 'APPROVED'
                          ? t('application.approvedStatus')
                          : app.status === 'REJECTED'
                          ? t('application.rejectedStatus')
                          : t('application.pendingStatus')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedApp(app);
                          setIsDetailOpen(true);
                        }}
                        className="px-3 py-1 bg-chairly-panel hover:bg-chairly-border text-chairly-dark text-xs font-semibold rounded-lg transition-colors border border-chairly-border"
                      >
                        {t('ownerApplications.inspect')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Application Detail Modal */}
      {selectedApp && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`${t('ownerApplications.modalTitle')}: ${selectedApp.shopName}`}
        >
          <div className="space-y-6">
            {/* Status Header */}
            <div className="flex items-center justify-between p-4 bg-chairly-panel rounded-2xl border border-chairly-border">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-chairly-muted">
                  {t('common.status')}
                </span>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      selectedApp.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedApp.status === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selectedApp.status === 'APPROVED'
                      ? t('application.approvedStatus')
                      : selectedApp.status === 'REJECTED'
                      ? t('application.rejectedStatus')
                      : t('application.pendingStatus')}
                  </span>
                </div>
              </div>

              <div className="text-right text-xs text-chairly-muted">
                <span>{t('ownerApplications.date')}</span>
                <p className="font-semibold text-chairly-dark mt-0.5">
                  {new Date(selectedApp.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Application Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-4 bg-chairly-bg/50 rounded-2xl border border-chairly-border space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-chairly-muted block">
                  {t('ownerApplications.business')}
                </span>
                <p className="font-bold text-chairly-dark text-base">{selectedApp.shopName}</p>
                <p className="text-xs text-chairly-muted flex items-center gap-1.5 mt-1">
                  <Phone className="w-3.5 h-3.5" />
                  {selectedApp.shopPhone}
                </p>
                <p className="text-xs text-chairly-muted flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  {selectedApp.city}, {selectedApp.address}
                </p>
              </div>

              <div className="p-4 bg-chairly-bg/50 rounded-2xl border border-chairly-border space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-chairly-muted block">
                  {t('ownerApplications.applicant')}
                </span>
                <p className="font-bold text-chairly-dark text-base">{selectedApp.applicantName}</p>
                <p className="text-xs text-chairly-muted flex items-center gap-1.5 mt-1">
                  <Phone className="w-3.5 h-3.5" />
                  {formatPhone(selectedApp.applicantPhone)}
                </p>
              </div>

              {/* Description */}
              <div className="sm:col-span-2 p-4 bg-chairly-bg/50 rounded-2xl border border-chairly-border">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-chairly-muted block mb-1">
                  {t('application.descriptionLabel')}
                </span>
                <p className="text-xs text-chairly-dark leading-relaxed whitespace-pre-line">
                  {selectedApp.description}
                </p>
              </div>

              {/* Photos if provided */}
              {(selectedApp.logoUrl || selectedApp.coverImageUrl) && (
                <div className="sm:col-span-2 p-4 bg-chairly-bg/50 rounded-2xl border border-chairly-border space-y-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-chairly-muted block">
                    Fotosuratlar
                  </span>
                  <div className="flex items-center gap-4">
                    {selectedApp.logoUrl && (
                      <div className="space-y-1">
                        <span className="text-[10px] text-chairly-muted block">Logotip</span>
                        <img
                          src={selectedApp.logoUrl}
                          alt="Logo"
                          className="w-16 h-16 rounded-xl object-cover border border-chairly-border"
                        />
                      </div>
                    )}
                    {selectedApp.coverImageUrl && (
                      <div className="space-y-1">
                        <span className="text-[10px] text-chairly-muted block">Muqova rasmi</span>
                        <img
                          src={selectedApp.coverImageUrl}
                          alt="Cover"
                          className="w-32 h-16 rounded-xl object-cover border border-chairly-border"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Rejection reason if already rejected */}
              {selectedApp.rejectionReason && (
                <div className="sm:col-span-2 p-4 bg-rose-50 rounded-2xl border border-rose-200 text-rose-800 text-xs">
                  <span className="font-bold block mb-0.5">{t('application.rejectionReason')}:</span>
                  {selectedApp.rejectionReason}
                </div>
              )}
            </div>

            {/* Action Buttons (Only for PENDING applications) */}
            {selectedApp.status === 'PENDING' && (
              <div className="pt-4 border-t border-chairly-border flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleApprove(selectedApp.id)}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 min-h-[44px]"
                >
                  <Check className="w-4 h-4" />
                  {isProcessing ? t('ownerApplications.approving') : t('ownerApplications.approveAction')}
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setIsRejectModalOpen(true)}
                  className="flex-1 py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 min-h-[44px]"
                >
                  <X className="w-4 h-4" />
                  {t('ownerApplications.rejectAction')}
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Reject Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title={t('ownerApplications.rejectAction')}
      >
        <div className="space-y-4">
          <p className="text-xs text-chairly-muted">
            {t('ownerApplications.rejectReasonPrompt')}
          </p>
          <textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={t('ownerApplications.rejectReasonPlaceholder')}
            className="w-full bg-chairly-bg/50 border border-chairly-border rounded-xl p-3 text-xs text-chairly-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          />
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsRejectModalOpen(false)}
              className="px-4 py-2 border border-chairly-border rounded-xl text-xs font-semibold hover:bg-chairly-panel transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleReject}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {isProcessing ? t('ownerApplications.rejecting') : t('ownerApplications.rejectAction')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
