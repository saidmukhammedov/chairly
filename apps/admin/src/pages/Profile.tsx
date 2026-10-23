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
      setProfileError('First name and last name are required.');
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
      setProfileSuccess('Your profile has been updated successfully.');
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      setPasswordSuccess('Your password has been changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password. Please verify current password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getRoleBadge = (role?: string) => {
    if (role === 'OWNER') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
          👑 Platform Owner
        </span>
      );
    }
    if (role === 'MANAGER' || role === 'BARBER') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-chairly-terracotta-50 text-chairly-terracotta-700 border border-chairly-terracotta-200">
          💈 Shop Administrator
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        👤 Customer Account
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-chairly-dark">
            Account Profile
          </h1>
          <p className="text-sm text-chairly-muted mt-1">
            Manage your personal details, contact information, and account security.
          </p>
        </div>
        <div>{getRoleBadge(user?.role)}</div>
      </div>

      {/* Grid of Profile and Password */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Overview */}
        <div className="bg-white p-6 rounded-3xl border border-chairly-border shadow-2xs flex flex-col items-center text-center space-y-4">
          <div className="relative group">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile Avatar"
                className="w-28 h-28 rounded-3xl object-cover border-2 border-chairly-border shadow-sm"
              />
            ) : (
              <div className="w-28 h-28 rounded-3xl bg-chairly-terracotta-100 text-chairly-terracotta-700 font-bold text-3xl flex items-center justify-center border-2 border-chairly-terracotta-200 shadow-sm">
                {firstName?.[0] || 'C'}
                {lastName?.[0] || 'U'}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-lg font-bold text-chairly-dark">
              {firstName} {lastName}
            </h2>
            <p className="text-xs text-chairly-muted flex items-center justify-center gap-1 mt-0.5">
              <Mail className="w-3.5 h-3.5" />
              {user?.email}
            </p>
            {phone && (
              <p className="text-xs text-chairly-muted flex items-center justify-center gap-1 mt-0.5">
                <Phone className="w-3.5 h-3.5" />
                {phone}
              </p>
            )}
          </div>

          {/* Quick Presets for Avatars */}
          <div className="w-full pt-4 border-t border-chairly-border">
            <label className="text-xs font-semibold text-chairly-muted uppercase tracking-wider block mb-2">
              Choose Avatar Preset
            </label>
            <div className="flex justify-center gap-2 flex-wrap">
              {AVATAR_PRESETS.map((preset, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setAvatarUrl(preset)}
                  className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all ${
                    avatarUrl === preset
                      ? 'border-chairly-terracotta-500 scale-105 shadow-xs'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={preset} alt={`Preset ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="px-2 py-1 rounded-lg text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors"
                >
                  Clear Photo
                </button>
              )}
            </div>
          </div>

          {/* Memberships if staff/admin */}
          {memberships && memberships.length > 0 && (
            <div className="w-full pt-4 border-t border-chairly-border text-left">
              <label className="text-xs font-semibold text-chairly-muted uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-chairly-terracotta-500" />
                Assigned Barbershops
              </label>
              <div className="space-y-1.5">
                {memberships.map((m) => (
                  <div
                    key={m.shopId}
                    className="p-2.5 rounded-xl bg-chairly-bg border border-chairly-border text-xs flex items-center justify-between"
                  >
                    <span className="font-semibold text-chairly-dark truncate max-w-[150px]">
                      {m.shopName}
                    </span>
                    <span className="text-[10px] font-bold text-chairly-terracotta-600 bg-chairly-terracotta-50 px-1.5 py-0.5 rounded">
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
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-chairly-border shadow-2xs">
            <h3 className="text-lg font-bold text-chairly-dark mb-1 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-chairly-terracotta-500" />
              Personal Details
            </h3>
            <p className="text-xs text-chairly-muted mb-6">
              Update your personal information displayed on bookings and appointments.
            </p>

            {profileSuccess && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-chairly-dark uppercase tracking-wider mb-1.5">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-chairly-border focus:outline-hidden focus:ring-2 focus:ring-chairly-terracotta-500/20 focus:border-chairly-terracotta-500 text-sm text-chairly-dark"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-chairly-dark uppercase tracking-wider mb-1.5">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-chairly-border focus:outline-hidden focus:ring-2 focus:ring-chairly-terracotta-500/20 focus:border-chairly-terracotta-500 text-sm text-chairly-dark"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-chairly-dark uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-4 py-2.5 rounded-xl border border-chairly-border bg-chairly-bg text-chairly-muted text-sm cursor-not-allowed"
                  />
                  <span className="text-[10px] text-chairly-muted mt-1 block">
                    Account email is managed by your sign-in provider.
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-chairly-dark uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+998 90 123 45 67"
                    className="w-full px-4 py-2.5 rounded-xl border border-chairly-border focus:outline-hidden focus:ring-2 focus:ring-chairly-terracotta-500/20 focus:border-chairly-terracotta-500 text-sm text-chairly-dark"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-chairly-dark uppercase tracking-wider mb-1.5">
                  Profile Photo URL (optional)
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-2.5 rounded-xl border border-chairly-border focus:outline-hidden focus:ring-2 focus:ring-chairly-terracotta-500/20 focus:border-chairly-terracotta-500 text-sm text-chairly-dark"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="w-full sm:w-auto px-6 py-2.5 bg-chairly-terracotta-500 hover:bg-chairly-terracotta-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-2xs transition-all min-h-[44px]"
                >
                  {isSavingProfile ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-chairly-border shadow-2xs">
            <h3 className="text-lg font-bold text-chairly-dark mb-1 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-chairly-terracotta-500" />
              Account Security & Password
            </h3>
            <p className="text-xs text-chairly-muted mb-6">
              Update your password to keep your Chairly account protected.
            </p>

            {passwordSuccess && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-chairly-dark uppercase tracking-wider mb-1.5">
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Enter existing password"
                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-chairly-border focus:outline-hidden focus:ring-2 focus:ring-chairly-terracotta-500/20 focus:border-chairly-terracotta-500 text-sm text-chairly-dark"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-chairly-muted hover:text-chairly-dark p-1"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-chairly-dark uppercase tracking-wider mb-1.5">
                    New Password (min. 6 chars) *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="At least 6 characters"
                      className="w-full px-4 py-2.5 pr-10 rounded-xl border border-chairly-border focus:outline-hidden focus:ring-2 focus:ring-chairly-terracotta-500/20 focus:border-chairly-terracotta-500 text-sm text-chairly-dark"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-chairly-muted hover:text-chairly-dark p-1"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-chairly-dark uppercase tracking-wider mb-1.5">
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-type new password"
                    className="w-full px-4 py-2.5 rounded-xl border border-chairly-border focus:outline-hidden focus:ring-2 focus:ring-chairly-terracotta-500/20 focus:border-chairly-terracotta-500 text-sm text-chairly-dark"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full sm:w-auto px-6 py-2.5 bg-chairly-dark hover:bg-neutral-800 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-2xs transition-all min-h-[44px]"
                >
                  {isChangingPassword ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <KeyRound className="w-4 h-4" />
                  )}
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
