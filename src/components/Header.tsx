import React, { useState, useEffect, useRef } from 'react';
import { User, NotificationItem } from '../types/index.js';
import { api } from '../services/api.js';
import {
  Bell,
  LogOut,
  Play,
  FileSpreadsheet,
  CheckCircle2,
  Menu,
  Shield,
  Activity,
} from 'lucide-react';
import { initAuth, googleSignIn, googleLogout } from '../services/auth.js';
import { useLanguage } from '../context/LanguageContext.js';
import { LanguageToggle } from './LanguageToggle.js';
import { ThemeToggle } from './ThemeToggle.js';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  onNavigateToNotifications: () => void;
  onToggleSidebar?: () => void;
  onRefreshData?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  onNavigateToNotifications,
  onToggleSidebar,
  onRefreshData,
}) => {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [schedulerLoading, setSchedulerLoading] = useState<boolean>(false);
  const [schedulerMessage, setSchedulerMessage] = useState<string | null>(null);
  const [googleUser, setGoogleUser] = useState<any>(null);

  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotifs = async () => {
    try {
      const data = await api.getNotifications('all');
      setNotifications(data.notifications.slice(0, 6));
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  // Listen for Google Auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (gUser) => setGoogleUser(gUser),
      () => setGoogleUser(null)
    );
    return () => unsubscribe();
  }, []);

  // Close notifications popover on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRunScheduler = async () => {
    setSchedulerLoading(true);
    setSchedulerMessage(null);
    try {
      const res = await api.runScheduler();
      setSchedulerMessage(`Checked ${res.checkedCount} items (${res.newNotificationsCount} new alerts)`);
      fetchNotifs();
      if (onRefreshData) onRefreshData();
      setTimeout(() => setSchedulerMessage(null), 4000);
    } catch (err: any) {
      setSchedulerMessage(err.message || 'Scheduler failed');
      setTimeout(() => setSchedulerMessage(null), 4000);
    } finally {
      setSchedulerLoading(false);
    }
  };

  const handleGoogleConnect = async () => {
    if (googleUser) {
      await googleLogout();
      setGoogleUser(null);
    } else {
      try {
        await googleSignIn();
      } catch (err: any) {
        console.error('Google sign in error', err);
      }
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40 shadow-[0_0_12px_rgba(99,102,241,0.25)]';
      case 'QA/QC':
        return 'bg-teal-500/20 text-teal-300 border-teal-400/40 shadow-[0_0_12px_rgba(20,184,166,0.25)]';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-400/30';
    }
  };

  return (
    <header className="h-16 liquid-glass-header px-4 md:px-6 flex items-center justify-between z-20 shrink-0 sticky top-0">
      {/* Left: Mobile hamburger & System Title */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 text-slate-300 hover:text-white rounded-xl liquid-glass-button transition"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500/30 to-cyan-500/10 border border-teal-400/40 flex items-center justify-center text-teal-300 font-bold shadow-[0_0_18px_rgba(20,184,166,0.3)]">
            <Activity className="w-5 h-5 text-teal-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-wide text-sm md:text-base drop-shadow-sm">
                {t('appShortTitle', 'PCS-NISSIN METROLOGY')}
              </span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-400/40 hidden sm:inline-block shadow-[0_0_8px_rgba(20,184,166,0.2)]">
                PCS-NISSIN
              </span>
            </div>
            <div className="text-[11px] text-slate-400 hidden md:block">
              {t('appSubTitle')}
            </div>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Dark Mode / Light Mode Switcher */}
        <ThemeToggle variant="compact" />

        {/* Language Switcher (Thai / English) */}
        <LanguageToggle variant="compact" />

        {/* Scheduler Trigger Button */}
        {user.role !== 'Viewer' && (
          <div className="relative hidden sm:block">
            <button
              onClick={handleRunScheduler}
              disabled={schedulerLoading}
              title={t('runDailyCheck')}
              className="flex items-center gap-1.5 px-3 py-1.5 liquid-glass-button rounded-xl text-xs font-medium text-slate-200 transition disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 text-teal-400 ${schedulerLoading ? 'animate-spin' : ''}`} />
              <span className="hidden lg:inline">{t('runDailyCheck')}</span>
            </button>
            {schedulerMessage && (
              <div className="absolute right-0 top-full mt-2 px-3 py-1.5 liquid-glass-panel text-teal-200 border border-teal-500/40 rounded-xl text-xs whitespace-nowrap shadow-2xl z-30 animate-in fade-in">
                {schedulerMessage}
              </div>
            )}
          </div>
        )}

        {/* Google Sheets Connection Pill */}
        <button
          onClick={handleGoogleConnect}
          title={googleUser ? `Connected as ${googleUser.email}` : t('connectSheets')}
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition backdrop-blur-md ${
            googleUser
              ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:bg-emerald-500/25'
              : 'liquid-glass-button text-slate-300'
          }`}
        >
          <FileSpreadsheet className={`w-3.5 h-3.5 ${googleUser ? 'text-emerald-400' : 'text-slate-400'}`} />
          <span className="hidden md:inline">
            {googleUser ? t('sheetsConnected') : t('connectSheets')}
          </span>
          {googleUser && <CheckCircle2 className="w-3 h-3 text-emerald-400 hidden sm:inline" />}
        </button>

        {/* Notification Bell Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-xl liquid-glass-button text-slate-300 hover:text-white transition"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[18px] h-[18px] text-[10px] font-bold bg-rose-500 text-white rounded-full flex items-center justify-center border-2 border-slate-950 shadow-[0_0_10px_rgba(244,63,94,0.6)] animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2.5 w-80 sm:w-96 liquid-glass-panel border border-white/15 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden z-50">
              <div className="p-3.5 bg-slate-950/60 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">{t('alerts')}</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.3)]">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setIsNotifOpen(false);
                    onNavigateToNotifications();
                  }}
                  className="text-xs text-teal-400 hover:text-teal-300 transition"
                >
                  {t('viewAllAndManage')}
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    {t('noAlerts')}
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        setIsNotifOpen(false);
                        onNavigateToNotifications();
                      }}
                      className={`p-3 text-xs hover:bg-white/[0.06] transition cursor-pointer flex items-start gap-2.5 ${
                        !n.is_read ? 'bg-teal-500/[0.06]' : ''
                      }`}
                    >
                      <div className="mt-1">
                        {n.notification_type === 'OVERDUE' ? (
                          <span className="w-2 h-2 rounded-full bg-rose-500 block shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                        ) : n.notification_type === 'DUE_TODAY' ? (
                          <span className="w-2 h-2 rounded-full bg-rose-400 block shadow-[0_0_8px_rgba(251,113,133,0.8)]" />
                        ) : n.notification_type === 'DUE_5_DAYS' ? (
                          <span className="w-2 h-2 rounded-full bg-orange-400 block shadow-[0_0_8px_rgba(251,146,60,0.8)]" />
                        ) : n.notification_type === 'DUE_7_DAYS' ? (
                          <span className="w-2 h-2 rounded-full bg-amber-400 block shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-yellow-400 block shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <span className="font-semibold text-slate-200 truncate">{n.equipment_id}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {n.remaining_days < 0
                              ? `${Math.abs(n.remaining_days)}d overdue`
                              : n.remaining_days === 0
                              ? 'Due Today'
                              : `${n.remaining_days}d left`}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px] line-clamp-2">{n.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 bg-slate-950/60 border-t border-white/10 text-center">
                <button
                  onClick={() => {
                    setIsNotifOpen(false);
                    onNavigateToNotifications();
                  }}
                  className="w-full py-1.5 text-xs text-slate-200 hover:text-white font-medium liquid-glass-button rounded-xl transition"
                >
                  {t('viewAllAndManage')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Role Info */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-white/10">
          <div className="hidden sm:block text-right">
            <div className="text-xs font-semibold text-white leading-tight">{user.name}</div>
            <div className="text-[10px] text-slate-400">{user.employee_id} • {user.department}</div>
          </div>
          <span
            className={`px-2 py-0.5 text-[10px] font-semibold rounded-lg border uppercase tracking-wider backdrop-blur-md ${getRoleBadgeStyle(
              user.role
            )}`}
          >
            {user.role}
          </span>
          <button
            onClick={onLogout}
            title={t('signOut')}
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-xl liquid-glass-button transition"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
