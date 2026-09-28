import React, { useState } from 'react';
import { api } from '../services/api.js';
import { User } from '../types/index.js';
import { ShieldCheck, Lock, User as UserIcon, AlertTriangle, CheckCircle2, Sparkles, Activity } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';
import { LanguageToggle } from './LanguageToggle.js';
import { ThemeToggle } from './ThemeToggle.js';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { t } = useLanguage();
  const [username, setUsername] = useState('ADMIN001');
  const [pin, setPin] = useState('2097');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Please enter your Employee ID or Name.');
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      setError('Password PIN must be exactly 4 numeric digits (e.g. 2097).');
      return;
    }

    setLoading(true);
    try {
      const data = await api.login(username.trim(), pin.trim());
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoUser: string, demoPin: string) => {
    setUsername(demoUser);
    setPin(demoPin);
    setError(null);
  };

  return (
    <div className="min-h-screen liquid-canvas flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Liquid Ambient Light Orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-teal-500/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-cyan-500/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Floating Theme and Language Switcher in Top Right */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
        <ThemeToggle variant="full" />
        <LanguageToggle variant="full" />
      </div>

      <div className="relative w-full max-w-md liquid-glass-panel border border-white/15 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden z-10 transition-all duration-300">
        {/* Glass Header Bar */}
        <div className="p-6 bg-slate-950/40 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400/30 to-cyan-500/10 border border-teal-400/40 flex items-center justify-center text-teal-300 shadow-[0_0_20px_rgba(20,184,166,0.35)]">
              <Activity className="w-6 h-6 text-teal-300" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-teal-300 flex items-center gap-1.5 drop-shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>PCS-NISSIN</span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                PCS-NISSIN METROLOGY
              </h1>
              <p className="text-[11px] text-slate-400">
                {t('loginDesc')}
              </p>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-950/70 border border-rose-500/40 rounded-xl text-rose-200 text-xs flex items-start gap-2.5 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              {t('usernameLabel')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <UserIcon className="w-4 h-4 text-teal-400/80" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. ADMIN001 or Somsak"
                className="w-full pl-10 pr-3.5 py-2.5 liquid-glass-input rounded-xl text-white placeholder-slate-500 text-xs font-medium"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {t('pinLabel')}
              </label>
              <span className="text-[11px] text-slate-400 font-mono">Masked (****)</span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4 text-teal-400/80" />
              </div>
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full pl-10 pr-3.5 py-2.5 liquid-glass-input rounded-xl text-white text-base tracking-widest text-center font-mono placeholder-slate-600"
                required
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {t('pinHelp')}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 liquid-glass-primary rounded-xl text-xs font-bold tracking-wide uppercase flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{t('authenticating')}</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>{t('loginButton')}</span>
              </>
            )}
          </button>

          {/* Quick Demo Credentials */}
          <div className="pt-3.5 border-t border-white/10">
            <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              <span>{t('demoAccountsTitle')}</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('ADMIN001', '2097')}
                className="p-2.5 text-left liquid-glass-card rounded-xl text-xs transition flex justify-between items-center group cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-indigo-300">ADMIN001</span>
                    <span className="text-slate-400 text-[11px]">(System Admin)</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Full Permissions • PIN: 2097</div>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 shadow-[0_0_8px_rgba(99,102,241,0.2)]">
                  Admin
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('QA001', '1234')}
                className="p-2.5 text-left liquid-glass-card rounded-xl text-xs transition flex justify-between items-center group cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-teal-300">QA001</span>
                    <span className="text-slate-400 text-[11px]">(Somsak QA)</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Edit Equipment & Calibrate • PIN: 1234</div>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-lg bg-teal-500/20 text-teal-300 border border-teal-400/40 shadow-[0_0_8px_rgba(20,184,166,0.2)]">
                  QA/QC
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('VIEW001', '2099')}
                className="p-2.5 text-left liquid-glass-card rounded-xl text-xs transition flex justify-between items-center group cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-300">VIEW001</span>
                    <span className="text-slate-400 text-[11px]">(Wichai Production)</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Read-Only View & Reports • PIN: 2099</div>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-lg bg-slate-500/20 text-slate-300 border border-slate-400/30">
                  Viewer
                </span>
              </button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-3 bg-slate-950/50 border-t border-white/10 text-center text-[10px] text-slate-400">
          {t('lockoutWarning')}
        </div>
      </div>
    </div>
  );
};
