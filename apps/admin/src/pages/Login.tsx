import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('owner@chopchop.uz');
  const [password, setPassword] = useState('chairly123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword('chairly123');
  };

  return (
    <div className="min-h-screen bg-chairly-bg flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-chairly-terracotta-500 text-white flex items-center justify-center font-bold text-2xl mx-auto mb-3 shadow-md">
            C
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-chairly-dark">
            Chairly Business
          </h1>
          <p className="text-sm text-chairly-muted mt-1">
            Sign in to manage appointments, staff, and services
          </p>
        </div>

        {/* Card */}
        <div className="bg-white p-8 rounded-2xl border border-chairly-border shadow-sm">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-chairly-muted mb-1.5">
                Staff Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@barbershop.uz"
                  className="w-full bg-chairly-bg/40 border border-chairly-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-chairly-dark placeholder:text-chairly-subtle focus:bg-white focus:outline-none focus:ring-2 focus:ring-chairly-terracotta-500/20 focus:border-chairly-terracotta-500 transition-all"
                />
                <Mail className="w-4 h-4 text-chairly-muted absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-chairly-muted mb-1.5">
                Password
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
              className="w-full mt-2 py-3 px-4 bg-chairly-terracotta-500 hover:bg-chairly-terracotta-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign In to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-8 pt-6 border-t border-chairly-border">
            <p className="text-xs font-semibold text-chairly-muted uppercase tracking-wider mb-2 text-center">
              Choose a Demo Account to Sign In
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('customer@chairly.app')}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  email === 'customer@chairly.app'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold ring-2 ring-emerald-500/20'
                    : 'border-chairly-border bg-white text-chairly-dark hover:bg-chairly-panel'
                }`}
              >
                <div className="text-base mb-0.5">👤</div>
                <div className="text-xs font-bold">Customer</div>
                <div className="text-[10px] text-chairly-muted">Browse & Book</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('owner@chopchop.uz')}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  email === 'owner@chopchop.uz'
                    ? 'border-chairly-terracotta-500 bg-chairly-terracotta-50 text-chairly-terracotta-800 font-semibold ring-2 ring-chairly-terracotta-500/20'
                    : 'border-chairly-border bg-white text-chairly-dark hover:bg-chairly-panel'
                }`}
              >
                <div className="text-base mb-0.5">💈</div>
                <div className="text-xs font-bold">Shop Admin</div>
                <div className="text-[10px] text-chairly-muted">Chop-Chop Tashkent</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin@chairly.app')}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  email === 'admin@chairly.app'
                    ? 'border-amber-500 bg-amber-50 text-amber-800 font-semibold ring-2 ring-amber-500/20'
                    : 'border-chairly-border bg-white text-chairly-dark hover:bg-chairly-panel'
                }`}
              >
                <div className="text-base mb-0.5">👑</div>
                <div className="text-xs font-bold">Website Owner</div>
                <div className="text-[10px] text-chairly-muted">Every Access</div>
              </button>
            </div>
            <p className="text-[11px] text-chairly-muted mt-3 text-center">
              Password for all accounts: <code className="font-mono font-bold text-chairly-dark">chairly123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
