import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  User,
  Phone,
  MapPin,
  FileText,
  Image,
  ArrowRight,
  CheckCircle2,
  Search,
  Scissors,
  ArrowLeft,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useTranslation, LanguageSelector } from '../i18n';
import api from '../services/api';
import { formatPhone, isValidPhone, normalizePhone } from '@chairly/shared';

interface ApplicationStatusItem {
  id: string;
  shopName: string;
  city: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  approvedShopId?: string;
  createdAt: string;
  updatedAt: string;
}

export const ApplyBusiness: React.FC = () => {
  const { t } = useTranslation();

  // Form State
  const [shopName, setShopName] = useState('');
  const [applicantName, setApplicantName] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  // Status Tracking State
  const [trackPhone, setTrackPhone] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [trackedApplications, setTrackedApplications] = useState<ApplicationStatusItem[] | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normAppPhone = normalizePhone(applicantPhone);
    const normShPhone = normalizePhone(shopPhone);

    if (!isValidPhone(normAppPhone)) {
      setError(t('application.applicantPhoneLabel') + " formati noto'g'ri (masalan: +998 90 123 45 67)");
      return;
    }

    if (!isValidPhone(normShPhone)) {
      setError(t('application.shopPhoneLabel') + " formati noto'g'ri (masalan: +998 71 200 00 00)");
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.post('/applications', {
        shopName: shopName.trim(),
        applicantName: applicantName.trim(),
        applicantPhone: normAppPhone,
        city: city.trim(),
        address: address.trim(),
        shopPhone: normShPhone,
        description: description.trim(),
        logoUrl: logoUrl.trim() || undefined,
        coverImageUrl: coverImageUrl.trim() || undefined,
      });

      setSuccessData(res);
      // Pre-fill track phone
      setTrackPhone(normAppPhone);
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrackStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError(null);

    const norm = normalizePhone(trackPhone);
    if (!norm) {
      setTrackError(t('auth.phoneLabel') + ' kiritilishi shart');
      return;
    }

    setIsTracking(true);
    try {
      const res = await api.get<ApplicationStatusItem[]>(`/applications/status?phone=${encodeURIComponent(norm)}`);
      setTrackedApplications(res);
    } catch (err: any) {
      setTrackError(err.message || t('common.error'));
    } finally {
      setIsTracking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-950 py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Navbar */}
      <div className="max-w-4xl mx-auto flex items-center justify-between mb-8 pb-4 border-b border-zinc-200/80">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-950 transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t('common.back')}
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSelector />
          <Link
            to="/login"
            className="px-3 py-1.5 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-900 transition-colors"
          >
            {t('nav.login')}
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header Hero */}
        <div className="text-center max-w-xl mx-auto">
          <div className="w-10 h-10 rounded-md bg-zinc-950 text-white flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Scissors className="w-5 h-5" />
          </div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold mb-1">
            PARTNER NETWORK
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
            {t('application.pageTitle')}
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-zinc-500">
            {t('application.pageSubtitle')}
          </p>
        </div>

        {/* Success Banner if submitted */}
        {successData ? (
          <div className="bg-white p-8 rounded-lg border border-zinc-200 shadow-xs text-center max-w-2xl mx-auto space-y-4 animate-in fade-in">
            <div className="w-12 h-12 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-zinc-950">
              {t('application.successTitle')}
            </h2>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              {t('application.successMessage')}
            </p>
            <div className="pt-4 flex flex-col sm:flex-row gap-2.5 justify-center">
              <button
                type="button"
                onClick={() => {
                  setSuccessData(null);
                  setShopName('');
                  setCity('');
                  setAddress('');
                  setDescription('');
                }}
                className="px-4 py-2 rounded-md border border-zinc-200 text-xs font-semibold hover:bg-zinc-50 transition-colors"
              >
                Yana ariza yuborish
              </button>
              <Link
                to="/"
                className="px-4 py-2 rounded-md bg-zinc-950 hover:bg-black text-white text-xs font-semibold transition-colors"
              >
                Bosh sahifaga qaytish
              </Link>
            </div>
          </div>
        ) : (
          /* Application Form Card */
          <div className="bg-white rounded-lg border border-zinc-200/80 p-6 sm:p-8 shadow-xs">
            <div className="mb-6 pb-4 border-b border-zinc-100">
              <h2 className="text-base font-bold text-zinc-950">
                {t('application.formTitle')}
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                {t('application.noticeText')}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-700 animate-in fade-in flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Row 1: Shop Name & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    {t('application.shopNameLabel')} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      required
                      placeholder={t('application.shopNamePlaceholder')}
                      className="w-full bg-zinc-50/50 border border-zinc-200 rounded-md pl-10 pr-4 py-2 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 transition-all"
                    />
                    <Building2 className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    {t('application.cityLabel')} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      placeholder={t('application.cityPlaceholder')}
                      className="w-full bg-zinc-50/50 border border-zinc-200 rounded-md pl-10 pr-4 py-2 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 transition-all"
                    />
                    <MapPin className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  </div>
                </div>
              </div>

              {/* Row 2: Address */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                  {t('application.addressLabel')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    placeholder={t('application.addressPlaceholder')}
                    className="w-full bg-zinc-50/50 border border-zinc-200 rounded-md pl-10 pr-4 py-2 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 transition-all"
                  />
                  <MapPin className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                </div>
              </div>

              {/* Row 3: Applicant Full Name & Personal Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    {t('application.applicantNameLabel')} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      required
                      placeholder={t('application.applicantNamePlaceholder')}
                      className="w-full bg-zinc-50/50 border border-zinc-200 rounded-md pl-10 pr-4 py-2 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 transition-all"
                    />
                    <User className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    {t('application.applicantPhoneLabel')} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={applicantPhone}
                      onChange={(e) => setApplicantPhone(e.target.value)}
                      required
                      placeholder={t('application.applicantPhonePlaceholder')}
                      className="w-full bg-zinc-50/50 border border-zinc-200 rounded-md pl-10 pr-4 py-2 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 transition-all"
                    />
                    <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  </div>
                </div>
              </div>

              {/* Row 4: Barbershop Contact Phone */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                  {t('application.shopPhoneLabel')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={shopPhone}
                    onChange={(e) => setShopPhone(e.target.value)}
                    required
                    placeholder={t('application.shopPhonePlaceholder')}
                    className="w-full bg-zinc-50/50 border border-zinc-200 rounded-md pl-10 pr-4 py-2 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 transition-all"
                  />
                  <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                </div>
              </div>

              {/* Row 5: Description */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                  {t('application.descriptionLabel')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    placeholder={t('application.descriptionPlaceholder')}
                    className="w-full bg-zinc-50/50 border border-zinc-200 rounded-md pl-10 pr-4 py-2 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 transition-all"
                  />
                  <FileText className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Row 6: Optional Logo & Cover URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    {t('application.logoUrlLabel')} <span className="text-zinc-400">({t('common.optional')})</span>
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://example.com/logo.jpg"
                      className="w-full bg-zinc-50/50 border border-zinc-200 rounded-md pl-10 pr-4 py-2 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 transition-all"
                    />
                    <Image className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    {t('application.coverImageUrlLabel')} <span className="text-zinc-400">({t('common.optional')})</span>
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={coverImageUrl}
                      onChange={(e) => setCoverImageUrl(e.target.value)}
                      placeholder="https://example.com/cover.jpg"
                      className="w-full bg-zinc-50/50 border border-zinc-200 rounded-md pl-10 pr-4 py-2 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 transition-all"
                    />
                    <Image className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-zinc-950 hover:bg-black text-white rounded-md text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50 min-h-[42px]"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {t('application.submitButton')}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Section 2: Track Application Status by Phone */}
        <div className="bg-white rounded-lg border border-zinc-200/80 p-6 sm:p-8 shadow-xs">
          <div className="max-w-xl">
            <h3 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
              <Search className="w-4 h-4 text-zinc-500" />
              {t('application.trackTitle')}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {t('application.trackSubtitle')}
            </p>
          </div>

          <form onSubmit={handleTrackStatus} className="mt-4 flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <input
                type="tel"
                value={trackPhone}
                onChange={(e) => setTrackPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
                required
                className="w-full bg-zinc-50/50 border border-zinc-200 rounded-md pl-10 pr-4 py-2 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 transition-all"
              />
              <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            </div>
            <button
              type="submit"
              disabled={isTracking}
              className="px-5 py-2 bg-zinc-950 hover:bg-black text-white text-xs font-semibold rounded-md transition-colors shrink-0 disabled:opacity-50 uppercase tracking-wider"
            >
              {isTracking ? t('application.checkingStatus') : t('application.checkStatusButton')}
            </button>
          </form>

          {trackError && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-md">
              {trackError}
            </div>
          )}

          {/* Tracked Results List */}
          {trackedApplications !== null && (
            <div className="mt-6 pt-6 border-t border-zinc-100 space-y-3">
              {trackedApplications.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">
                  {t('application.noApplicationsFound')}
                </p>
              ) : (
                trackedApplications.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 rounded-md border border-zinc-200 bg-zinc-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-950 text-xs">{app.shopName}</span>
                        <span className="text-[11px] text-zinc-400">({app.city})</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                      {app.rejectionReason && (
                        <p className="text-xs text-rose-600 mt-1 font-medium">
                          {t('application.rejectionReason')}: {app.rejectionReason}
                        </p>
                      )}
                    </div>

                    <div>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-semibold uppercase tracking-wider ${
                          app.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : app.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {app.status === 'APPROVED'
                          ? t('application.approvedStatus')
                          : app.status === 'REJECTED'
                          ? t('application.rejectedStatus')
                          : t('application.pendingStatus')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
