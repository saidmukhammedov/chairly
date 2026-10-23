import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Phone, User, ArrowRight, Scissors } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation, LanguageSelector } from '../i18n';
import { isValidPhone, normalizePhone } from '@chairly/shared';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { t } = useTranslation();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = fullName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setError(t('auth.fullNameLabel') + ' kamida 2 ta belgidan iborat bo‘lishi lozim');
      return;
    }

    const normPhone = normalizePhone(phone);
    if (!isValidPhone(normPhone)) {
      setError(t('auth.phoneLabel') + " formati noto'g'ri (masalan: +998 90 123 45 67)");
      return;
    }

    if (password.length < 6) {
      setError(t('auth.passwordLabel') + " kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }

    setIsLoading(true);

    try {
      await register(trimmedName, normPhone, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || t('auth.registerError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center items-center p-4 py-12">
      {/* Top Language Switcher Bar */}
      <div className="w-full max-w-md flex justify-end mb-6">
        <LanguageSelector />
      </div>

      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block group focus:outline-hidden" title="CHAIRLY - Asosiy sahifa">
            <div className="w-10 h-10 rounded-md bg-zinc-950 group-hover:bg-zinc-800 text-white flex items-center justify-center font-bold text-base mx-auto mb-3 tracking-tighter transition-colors">
              CH
            </div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-400 group-hover:text-zinc-700 font-bold mb-1 transition-colors">
              CHAIRLY
            </div>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 mt-1">
            {t('auth.createAccount')}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {t('auth.registerSubtitle')}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white p-6 sm:p-8 rounded-lg border border-zinc-200/80 shadow-xs">
          {error && (
            <div className="mb-5 p-3 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-700 animate-in fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                {t('auth.fullNameLabel')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder={t('auth.fullNamePlaceholder')}
                  className="w-full bg-zinc-50/50 border border-zinc-200 rounded-md pl-10 pr-4 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 transition-all"
                />
                <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                {t('auth.phoneLabel')}
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder={t('auth.phonePlaceholder')}
                  className="w-full bg-zinc-50/50 border border-zinc-200 rounded-md pl-10 pr-4 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 transition-all"
                />
                <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                {t('auth.passwordLabel')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-zinc-50/50 border border-zinc-200 rounded-md pl-10 pr-10 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 transition-all"
                />
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-zinc-400 hover:text-zinc-900 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-zinc-950 hover:bg-black text-white rounded-md text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-2 transition-colors disabled:opacity-50 min-h-[42px]"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {t('auth.registerButton')}
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Already have an account */}
          <div className="mt-6 text-center text-xs text-zinc-500">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link to="/login" className="font-semibold text-zinc-950 hover:underline">
              {t('auth.signInPrompt')}
            </Link>
          </div>
        </div>

        {/* Secondary Section: "Add your barbershop to Chairly" */}
        <div className="mt-6 bg-zinc-950 text-white p-5 rounded-lg border border-zinc-800 text-center relative overflow-hidden">
          <div className="w-8 h-8 rounded-md bg-zinc-900 text-zinc-300 flex items-center justify-center mx-auto mb-2 border border-zinc-800">
            <Scissors className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-white text-xs tracking-wide">
            {t('auth.haveBarbershop')}
          </h3>
          <p className="text-[11px] text-zinc-400 mt-1 mb-3 max-w-xs mx-auto">
            {t('auth.joinPlatformPromo')}
          </p>
          <Link
            to="/apply"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-zinc-100 text-zinc-950 rounded-md text-[11px] font-semibold transition-colors"
          >
            {t('auth.applyButton')}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
