import React, { useState, useEffect } from 'react';
import { Building2, Clock, Shield, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { DAYS_OF_WEEK } from '@chairly/shared';

interface ShopSettingsData {
  id: string;
  name: string;
  slug: string;
  description: string;
  phone: string;
  address: string;
  city: string;
  logoUrl?: string;
  coverImageUrl?: string;
  timezone: string;
  currency: string;
  leadTimeMinutes: number;
  horizonDays: number;
  cancelDeadlineHours: number;
  isActive: boolean;
  workingHours: Array<{
    id: string;
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }>;
}

export const Settings: React.FC = () => {
  const { currentShopId, currentMembership } = useAuth();
  const isOwner = currentMembership?.role === 'OWNER';

  const [settings, setSettings] = useState<ShopSettingsData | null>(null);
  const [workingHours, setWorkingHours] = useState<
    Array<{ dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean }>
  >([]);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [leadTimeMinutes, setLeadTimeMinutes] = useState(30);
  const [horizonDays, setHorizonDays] = useState(30);
  const [cancelDeadlineHours, setCancelDeadlineHours] = useState(2);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchSettings = async () => {
    if (!currentShopId) return;
    setIsLoading(true);
    try {
      const res = await api.get<ShopSettingsData>(`/settings/shop/${currentShopId}`);
      setSettings(res);
      setName(res.name);
      setDescription(res.description);
      setPhone(res.phone);
      setAddress(res.address);
      setCity(res.city);
      setLogoUrl(res.logoUrl || '');
      setCoverImageUrl(res.coverImageUrl || '');
      setLeadTimeMinutes(res.leadTimeMinutes);
      setHorizonDays(res.horizonDays);
      setCancelDeadlineHours(res.cancelDeadlineHours);

      // Build working hours array for all 7 days
      const hoursMap = new Map(res.workingHours?.map((h) => [h.dayOfWeek, h]));
      const fullHours = DAYS_OF_WEEK.map((d: any) => {
        const existing = hoursMap.get(d.day);
        return {
          dayOfWeek: d.day,
          openTime: existing?.openTime || '09:00',
          closeTime: existing?.closeTime || '21:00',
          isClosed: existing ? existing.isClosed : false,
        };
      });
      setWorkingHours(fullHours);
    } catch (err) {
      console.error('Failed to load shop settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [currentShopId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShopId) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // 1. Save Shop Profile & Policies
      await api.put(`/settings/shop/${currentShopId}`, {
        name,
        description,
        phone,
        address,
        city,
        logoUrl: logoUrl || null,
        coverImageUrl: coverImageUrl || null,
        timezone: settings?.timezone || 'Asia/Tashkent',
        currency: settings?.currency || 'UZS',
        leadTimeMinutes: Number(leadTimeMinutes),
        horizonDays: Number(horizonDays),
        cancelDeadlineHours: Number(cancelDeadlineHours),
        isActive: settings?.isActive ?? true,
      });

      // 2. Save Working Hours
      await api.put(`/settings/shop/${currentShopId}/hours`, {
        workingHours,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="p-16 text-center bg-white rounded-2xl border border-chairly-border">
        <div className="w-8 h-8 border-3 border-chairly-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium text-chairly-muted">Loading shop configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-chairly-dark">
            Shop Settings & Policies
          </h2>
          <p className="text-sm text-chairly-muted mt-0.5">
            Configure contact details, booking lead time, cancellation deadlines, and operating hours
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm font-medium flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          Settings and working hours saved successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Shop Info */}
        <div className="bg-white p-6 rounded-2xl border border-chairly-border shadow-2xs space-y-4">
          <h3 className="font-bold text-chairly-dark text-base flex items-center gap-2">
            <Building2 className="w-4 h-4 text-chairly-terracotta-500" />
            Barbershop Profile
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-chairly-muted block mb-1">
                Shop Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={!isOwner}
                className="w-full bg-chairly-bg/50 border border-chairly-border rounded-xl px-3.5 py-2 text-sm text-chairly-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-chairly-terracotta-500/20 disabled:opacity-60"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-chairly-muted block mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={!isOwner}
                className="w-full bg-chairly-bg/50 border border-chairly-border rounded-xl px-3.5 py-2 text-sm text-chairly-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-chairly-terracotta-500/20 disabled:opacity-60"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-chairly-muted block mb-1">
                Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                disabled={!isOwner}
                className="w-full bg-chairly-bg/50 border border-chairly-border rounded-xl px-3.5 py-2 text-sm text-chairly-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-chairly-terracotta-500/20 disabled:opacity-60"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-chairly-muted block mb-1">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                disabled={!isOwner}
                className="w-full bg-chairly-bg/50 border border-chairly-border rounded-xl px-3.5 py-2 text-sm text-chairly-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-chairly-terracotta-500/20 disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-chairly-muted block mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!isOwner}
              className="w-full bg-chairly-bg/50 border border-chairly-border rounded-xl px-3.5 py-2 text-sm text-chairly-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-chairly-terracotta-500/20 disabled:opacity-60"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-chairly-muted block mb-1">
                Logo Image URL
              </label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                disabled={!isOwner}
                placeholder="https://example.com/logo.jpg"
                className="w-full bg-chairly-bg/50 border border-chairly-border rounded-xl px-3.5 py-2 text-sm text-chairly-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-chairly-terracotta-500/20 disabled:opacity-60"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-chairly-muted block mb-1">
                Cover Photo URL
              </label>
              <input
                type="url"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                disabled={!isOwner}
                placeholder="https://example.com/cover.jpg"
                className="w-full bg-chairly-bg/50 border border-chairly-border rounded-xl px-3.5 py-2 text-sm text-chairly-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-chairly-terracotta-500/20 disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Booking Policies */}
        <div className="bg-white p-6 rounded-2xl border border-chairly-border shadow-2xs space-y-4">
          <h3 className="font-bold text-chairly-dark text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-chairly-terracotta-500" />
            Booking & Cancellation Policies
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-chairly-muted block mb-1">
                Lead Time (Minutes)
              </label>
              <input
                type="number"
                min="0"
                step="5"
                value={leadTimeMinutes}
                onChange={(e) => setLeadTimeMinutes(Number(e.target.value))}
                required
                disabled={!isOwner}
                className="w-full bg-chairly-bg/50 border border-chairly-border rounded-xl px-3.5 py-2 text-sm text-chairly-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-chairly-terracotta-500/20 disabled:opacity-60"
              />
              <span className="text-[11px] text-chairly-muted block mt-1">
                Minimum advance notice required before a booking starts.
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-chairly-muted block mb-1">
                Booking Horizon (Days)
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={horizonDays}
                onChange={(e) => setHorizonDays(Number(e.target.value))}
                required
                disabled={!isOwner}
                className="w-full bg-chairly-bg/50 border border-chairly-border rounded-xl px-3.5 py-2 text-sm text-chairly-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-chairly-terracotta-500/20 disabled:opacity-60"
              />
              <span className="text-[11px] text-chairly-muted block mt-1">
                How far in advance customers can view and reserve time slots.
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-chairly-muted block mb-1">
                Cancel Deadline (Hours)
              </label>
              <input
                type="number"
                min="0"
                max="48"
                value={cancelDeadlineHours}
                onChange={(e) => setCancelDeadlineHours(Number(e.target.value))}
                required
                disabled={!isOwner}
                className="w-full bg-chairly-bg/50 border border-chairly-border rounded-xl px-3.5 py-2 text-sm text-chairly-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-chairly-terracotta-500/20 disabled:opacity-60"
              />
              <span className="text-[11px] text-chairly-muted block mt-1">
                Appointments cannot be cancelled by customer within this timeframe.
              </span>
            </div>
          </div>

          <div className="pt-2 text-xs text-chairly-muted flex items-center gap-4">
            <div>
              Timezone: <span className="font-semibold text-chairly-dark">{settings.timezone}</span>
            </div>
            <div>
              Currency: <span className="font-semibold text-chairly-dark">{settings.currency}</span>
            </div>
          </div>
        </div>

        {/* Regular Opening Hours */}
        <div className="bg-white p-6 rounded-2xl border border-chairly-border shadow-2xs space-y-4">
          <h3 className="font-bold text-chairly-dark text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-chairly-terracotta-500" />
            General Shop Opening Hours
          </h3>

          <div className="divide-y divide-chairly-border border border-chairly-border rounded-2xl overflow-hidden">
            {workingHours.map((wh, index) => {
              const dayName = DAYS_OF_WEEK.find((d: any) => d.day === wh.dayOfWeek)?.name || 'Day';
              return (
                <div
                  key={wh.dayOfWeek}
                  className={`p-3.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 transition-colors ${
                    !wh.isClosed ? 'bg-white' : 'bg-chairly-bg/40 opacity-70'
                  }`}
                >
                  <div className="w-28 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`wh-day-${wh.dayOfWeek}`}
                      checked={!wh.isClosed}
                      disabled={!isOwner}
                      onChange={(e) => {
                        const updated = [...workingHours];
                        updated[index].isClosed = !e.target.checked;
                        setWorkingHours(updated);
                      }}
                      className="rounded text-chairly-terracotta-500 focus:ring-chairly-terracotta-500/20 disabled:opacity-60"
                    />
                    <label
                      htmlFor={`wh-day-${wh.dayOfWeek}`}
                      className="text-xs font-semibold text-chairly-dark cursor-pointer"
                    >
                      {dayName}
                    </label>
                  </div>

                  {!wh.isClosed ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={wh.openTime}
                        disabled={!isOwner}
                        onChange={(e) => {
                          const updated = [...workingHours];
                          updated[index].openTime = e.target.value;
                          setWorkingHours(updated);
                        }}
                        className="bg-chairly-bg/50 border border-chairly-border rounded-lg px-2.5 py-1 text-xs font-medium text-chairly-dark focus:bg-white disabled:opacity-60"
                      />
                      <span className="text-xs text-chairly-muted">to</span>
                      <input
                        type="time"
                        value={wh.closeTime}
                        disabled={!isOwner}
                        onChange={(e) => {
                          const updated = [...workingHours];
                          updated[index].closeTime = e.target.value;
                          setWorkingHours(updated);
                        }}
                        className="bg-chairly-bg/50 border border-chairly-border rounded-lg px-2.5 py-1 text-xs font-medium text-chairly-dark focus:bg-white disabled:opacity-60"
                      />
                    </div>
                  ) : (
                    <span className="text-xs font-medium text-chairly-muted italic">Closed</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        {isOwner && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-chairly-terracotta-500 hover:bg-chairly-terracotta-600 text-white rounded-xl text-sm font-semibold shadow-2xs transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Configuration
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
