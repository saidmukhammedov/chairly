import React, { useState } from 'react';
import {
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Building2,
  Sparkles,
  Camera,
  Eye,
  EyeOff,
  Save,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n';
import api from '../services/api';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
];

export const Profile: React.FC = () => {
  const { user, memberships, updateProfile } = useAuth();
  const { t } = useTranslation();

  // Profile Form State
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setProfileError('Ism va familiya kiritilishi shart');
      return;
    }

    setIsSavingProfile(true);
    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      });
      setProfileSuccess(t('profile.profileSaved'));
    } catch (err: any) {
      setProfileError(err.message || 'Xatolik yuz berdi. Qayta urinib ko‘ring.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError(t('profile.currentPassword') + ' kiritilishi shart');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError(t('profile.newPassword') + ' kamida 6 ta belgidan iborat bo‘lishi kerak');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Parollar bir-biriga mos kelmadi');
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      setPasswordSuccess(t('profile.passwordChanged'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Joriy parol noto‘g‘ri yoki xatolik yuz berdi');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getRoleBadge = (role?: string) => {
    if (role === 'OWNER') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[11px] font-semibold uppercase tracking-wider bg-zinc-950 text-white">
          <Shield className="w-3 h-3 text-amber-400" /> Platform Owner
        </span>
      );
    }
    if (role === 'MANAGER' || role === 'BARBER') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[11px] font-semibold uppercase tracking-wider bg-zinc-900 text-zinc-100 border border-zinc-700">
          <Building2 className="w-3 h-3 text-zinc-400" /> Shop Admin
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[11px] font-semibold uppercase tracking-wider bg-zinc-100 text-zinc-800 border border-zinc-200">
        <UserIcon className="w-3 h-3 text-zinc-500" /> Mijoz
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950">
            {t('profile.title')}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {t('profile.subtitle')}
          </p>
        </div>
        <div>{getRoleBadge(user?.role)}</div>
      </div>

      {/* Grid of Profile and Password */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Overview */}
        <div className="bg-white p-6 rounded-lg border border-zinc-200/80 shadow-xs flex flex-col items-center text-center space-y-4">
          <div className="relative group">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile Avatar"
                className="w-24 h-24 rounded-lg object-cover border border-zinc-200 shadow-xs"
              />
            ) : (
              <div className="w-24 h-24 rounded-lg bg-zinc-950 text-white font-bold text-2xl flex items-center justify-center shadow-xs">
                {firstName?.[0] || 'C'}
                {lastName?.[0] || 'U'}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-base font-bold text-zinc-950">
              {firstName} {lastName}
            </h2>
            {user?.email && (
              <p className="text-xs text-zinc-500 flex items-center justify-center gap-1 mt-0.5">
                <Mail className="w-3.5 h-3.5" />
                {user.email}
              </p>
            )}
            {phone && (
              <p className="text-xs text-zinc-500 flex items-center justify-center gap-1 mt-0.5">
                <Phone className="w-3.5 h-3.5" />
                {phone}
              </p>
            )}
          </div>

          {/* Quick Presets for Avatars */}
          <div className="w-full pt-4 border-t border-zinc-100">
            <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest block mb-2">
              {t('profile.choosePreset')}
            </label>
            <div className="flex justify-center gap-2 flex-wrap">
              {AVATAR_PRESETS.map((preset, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setAvatarUrl(preset)}
                  className={`w-9 h-9 rounded-md overflow-hidden border transition-all ${
                    avatarUrl === preset
                      ? 'border-zinc-950 ring-1 ring-zinc-950'
                      : 'border-zinc-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={preset} alt={`Preset ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="px-2 py-1 rounded text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors"
                >
                  Tozalash
                </button>
              )}
            </div>
          </div>

          {/* Memberships if staff/admin */}
          {memberships && memberships.length > 0 && (
            <div className="w-full pt-4 border-t border-zinc-100 text-left">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-zinc-600" />
                Biriktirilgan sartaroshxonalar
              </label>
              <div className="space-y-1.5">
                {memberships.map((m) => (
                  <div
                    key={m.shopId}
                    className="p-2 rounded-md bg-zinc-50 border border-zinc-200 text-xs flex items-center justify-between"
                  >
                    <span className="font-medium text-zinc-900 truncate max-w-[150px]">
                      {m.shopName}
                    </span>
                    <span className="text-[10px] font-semibold text-zinc-600 bg-zinc-200 px-1.5 py-0.5 rounded-xs">
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Edit Details & Password */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit Profile Form Card */}
          <div className="bg-white p-6 sm:p-8 rounded-lg border border-zinc-200/80 shadow-xs">
            <h3 className="text-sm font-bold text-zinc-950 mb-0.5 flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-zinc-600" />
              {t('profile.personalInfo')}
            </h3>
            <p className="text-xs text-zinc-500 mb-5">
              {t('profile.subtitle')}
            </p>

            {profileSuccess && (
              <div className="mb-5 p-3 rounded-md bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="mb-5 p-3 rounded-md bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                    {t('auth.fullNameLabel')} (Ism) *
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-md border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 text-xs text-zinc-900 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                    Familiya *
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-md border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 text-xs text-zinc-900 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3.5 py-2 rounded-md border border-zinc-200 bg-zinc-100 text-zinc-400 text-xs cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                    {t('auth.phoneLabel')}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+998 90 123 45 67"
                    className="w-full px-3.5 py-2 rounded-md border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 text-xs text-zinc-900 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                  {t('profile.customUrl')}
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2 rounded-md border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 text-xs text-zinc-900 transition-all"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="w-full sm:w-auto px-5 py-2 bg-zinc-950 hover:bg-black disabled:opacity-50 text-white rounded-md text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all min-h-[38px]"
                >
                  {isSavingProfile ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Card */}
          <div className="bg-white p-6 sm:p-8 rounded-lg border border-zinc-200/80 shadow-xs">
            <h3 className="text-sm font-bold text-zinc-950 mb-0.5 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-zinc-600" />
              {t('profile.changePassword')}
            </h3>
            <p className="text-xs text-zinc-500 mb-5">
              Xavfsizlik maqsadida parolingizni muntazam yangilab turing.
            </p>

            {passwordSuccess && (
              <div className="mb-5 p-3 rounded-md bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="mb-5 p-3 rounded-md bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                  {t('profile.currentPassword')} *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 pr-10 rounded-md border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 text-xs text-zinc-900 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 p-1"
                  >
                    {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                    {t('profile.newPassword')} *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2 pr-10 rounded-md border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 text-xs text-zinc-900 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 p-1"
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                    {t('profile.confirmNewPassword')} *
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 rounded-md border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 text-xs text-zinc-900 transition-all"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full sm:w-auto px-5 py-2 bg-zinc-950 hover:bg-black disabled:opacity-50 text-white rounded-md text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all min-h-[38px]"
                >
                  {isChangingPassword ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <KeyRound className="w-3.5 h-3.5" />
                  )}
                  {t('profile.changePassword')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
