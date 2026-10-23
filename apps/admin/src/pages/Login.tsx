import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Phone, ArrowRight, Scissors } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation, LanguageSelector } from '../i18n';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()) {
      setError(t('auth.phoneLabel') + ' kiritilishi shart');
      return;
    }

    setIsLoading(true);

    try {
      await login(identifier.trim(), password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || t('auth.loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-chairly-bg flex flex-col justify-center items-center p-4 py-8">
      {/* Top Language Switcher Bar */}
      <div className="w-full max-w-md flex justify-end mb-4">
        <LanguageSelector />
      </div>

      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-chairly-terracotta-500 text-white flex items-center justify-center font-bold text-2xl mx-auto mb-3 shadow-md">
            C
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-chairly-dark">
            {t('auth.welcomeBack')}
          </h1>
          <p className="text-sm text-chairly-muted mt-1">
            {t('auth.loginSubtitle')}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-chairly-border shadow-sm">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700 animate-in fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-chairly-muted mb-1.5">
                {t('auth.phoneLabel')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  placeholder={t('auth.phonePlaceholder')}
                  className="w-full bg-chairly-bg/40 border border-chairly-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-chairly-dark placeholder:text-chairly-subtle focus:bg-white focus:outline-none focus:ring-2 focus:ring-chairly-terracotta-500/20 focus:border-chairly-terracotta-500 transition-all"
                />
                <Phone className="w-4 h-4 text-chairly-muted absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-chairly-muted mb-1.5">
                {t('auth.passwordLabel')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-chairly-bg/40 border border-chairly-border rounded-xl pl-10 pr-10 py-2.5 text-sm text-chairly-dark placeholder:text-chairly-subtle focus:bg-white focus:outline-none focus:ring-2 focus:ring-chairly-terracotta-500/20 focus:border-chairly-terracotta-500 transition-all"
                />
                <Lock className="w-4 h-4 text-chairly-muted absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-chairly-muted hover:text-chairly-dark transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-chairly-terracotta-500 hover:bg-chairly-terracotta-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm min-h-[44px]"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {t('auth.loginButton')}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Don't have an account */}
          <div className="mt-6 text-center text-xs text-chairly-muted">
            {t('auth.dontHaveAccount')}{' '}
            <Link to="/register" className="font-semibold text-chairly-terracotta-600 hover:underline">
              {t('auth.signUpPrompt')}
            </Link>
          </div>
        </div>

        {/* Secondary Section: "Add your barbershop to Chairly" */}
        <div className="mt-6 bg-white p-5 rounded-2xl border border-chairly-border/80 shadow-2xs text-center relative overflow-hidden">
          <div className="w-10 h-10 rounded-full bg-chairly-terracotta-50 text-chairly-terracotta-600 flex items-center justify-center mx-auto mb-2">
            <Scissors className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-chairly-dark text-sm">
            {t('auth.haveBarbershop')}
          </h3>
          <p className="text-xs text-chairly-muted mt-1 mb-3 max-w-xs mx-auto">
            {t('auth.joinPlatformPromo')}
          </p>
          <Link
            to="/apply"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-chairly-dark hover:bg-black text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs"
          >
            {t('auth.applyButton')}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
