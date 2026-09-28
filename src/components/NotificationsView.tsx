import React, { useState, useEffect } from 'react';
import { NotificationItem } from '../types/index.js';
import { api } from '../services/api.js';
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  Play,
  Trash2,
  Check,
  Wrench,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';

interface NotificationsViewProps {
  onRecordCalibrationForEquipment: (equipmentId: string) => void;
  canEdit: boolean;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  onRecordCalibrationForEquipment,
  canEdit,
}) => {
  const { t, lang } = useLanguage();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [countsByType, setCountsByType] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [schedulerLoading, setSchedulerLoading] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await api.getNotifications(filter);
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setCountsByType(data.countsByType);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await api.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  const handleRunDailyScheduler = async () => {
    setSchedulerLoading(true);
    setFeedbackMessage(null);
    try {
      const res = await api.runScheduler();
      setFeedbackMessage(
        lang === 'th'
          ? `ระบบตรวจสอบเสร็จสมบูรณ์: ตรวจสอบ ${res.checkedCount} รายการ พบการแจ้งเตือนใหม่ ${res.newNotificationsCount} รายการ`
          : `Scheduler verified: Checked ${res.checkedCount} active units. ${res.newNotificationsCount} new notification(s) added.`
      );
      loadNotifications();
      setTimeout(() => setFeedbackMessage(null), 5000);
    } catch (err: any) {
      setFeedbackMessage(err.message || 'Scheduler failed.');
      setTimeout(() => setFeedbackMessage(null), 5000);
    } finally {
      setSchedulerLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>{t('navNotifications')}</span>
            <Sparkles className="w-4 h-4 text-teal-400 hidden sm:inline" />
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {lang === 'th'
              ? 'ระบบแจ้งเตือนอัตโนมัติล่วงหน้า: 10 วัน, 7 วัน, 5 วัน, ครบกำหนดวันนี้ และรายการเกินกำหนด'
              : 'Automated alerts for 10-day, 7-day, 5-day, Due Today, and Overdue calibration events'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1.5 px-3 py-2 liquid-glass-button text-slate-200 text-xs font-medium rounded-xl transition"
            >
              <Check className="w-3.5 h-3.5 text-teal-400" />
              <span>{lang === 'th' ? 'อ่านทั้งหมดแล้ว' : 'Mark All Read'}</span>
            </button>
          )}

          {canEdit && (
            <button
              onClick={handleRunDailyScheduler}
              disabled={schedulerLoading}
              className="flex items-center gap-1.5 px-3.5 py-2 liquid-glass-primary text-white text-xs font-semibold rounded-xl transition disabled:opacity-50 shadow-lg shadow-teal-950"
            >
              <Play className={`w-3.5 h-3.5 ${schedulerLoading ? 'animate-spin' : ''}`} />
              <span>{schedulerLoading ? t('loading') : t('runDailyCheck')}</span>
            </button>
          )}

          <button
            onClick={loadNotifications}
            title={t('refresh')}
            className="p-2 liquid-glass-button rounded-xl text-slate-300 hover:text-white transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-400' : ''}`} />
          </button>
        </div>
      </div>

      {feedbackMessage && (
        <div className="p-3 liquid-glass-panel border-teal-500/40 text-teal-200 text-xs rounded-xl flex items-center gap-2 shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 pb-1 text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-xl font-medium transition ${
            filter === 'all'
              ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-[0_0_12px_rgba(20,184,166,0.4)] border border-teal-300/40'
              : 'liquid-glass-button text-slate-400 hover:text-white'
          }`}
        >
          {lang === 'th' ? 'การแจ้งเตือนทั้งหมด' : 'All Notifications'} ({countsByType.all || 0})
        </button>

        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 rounded-xl font-medium transition ${
            filter === 'unread'
              ? 'bg-rose-500/80 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)] border border-rose-300/40'
              : 'liquid-glass-button text-slate-400 hover:text-white'
          }`}
        >
          {lang === 'th' ? 'ยังไม่ได้อ่าน' : 'Unread'} ({countsByType.unread || 0})
        </button>

        <button
          onClick={() => setFilter('OVERDUE')}
          className={`px-3 py-1.5 rounded-xl font-medium transition ${
            filter === 'OVERDUE'
              ? 'bg-red-500/80 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)] border border-red-300/40'
              : 'liquid-glass-button text-red-400 hover:text-red-300'
          }`}
        >
          🔴 {t('overdue')} ({countsByType.OVERDUE || 0})
        </button>

        <button
          onClick={() => setFilter('DUE_TODAY')}
          className={`px-3 py-1.5 rounded-xl font-medium transition ${
            filter === 'DUE_TODAY'
              ? 'bg-rose-500/80 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)] border border-rose-300/40'
              : 'liquid-glass-button text-rose-400 hover:text-rose-300'
          }`}
        >
          {t('dueToday')} ({countsByType.DUE_TODAY || 0})
        </button>

        <button
          onClick={() => setFilter('DUE_5_DAYS')}
          className={`px-3 py-1.5 rounded-xl font-medium transition ${
            filter === 'DUE_5_DAYS'
              ? 'bg-orange-500/80 text-white shadow-[0_0_12px_rgba(251,146,60,0.4)] border border-orange-300/40'
              : 'liquid-glass-button text-orange-400 hover:text-orange-300'
          }`}
        >
          {t('dueIn5Days')} ({countsByType.DUE_5_DAYS || 0})
        </button>

        <button
          onClick={() => setFilter('DUE_7_DAYS')}
          className={`px-3 py-1.5 rounded-xl font-medium transition ${
            filter === 'DUE_7_DAYS'
              ? 'bg-amber-500/80 text-white shadow-[0_0_12px_rgba(251,191,36,0.4)] border border-amber-300/40'
              : 'liquid-glass-button text-amber-400 hover:text-amber-300'
          }`}
        >
          {t('dueIn7Days')} ({countsByType.DUE_7_DAYS || 0})
        </button>

        <button
          onClick={() => setFilter('DUE_10_DAYS')}
          className={`px-3 py-1.5 rounded-xl font-medium transition ${
            filter === 'DUE_10_DAYS'
              ? 'bg-yellow-500/80 text-white shadow-[0_0_12px_rgba(250,204,21,0.4)] border border-yellow-300/40'
              : 'liquid-glass-button text-yellow-400 hover:text-yellow-300'
          }`}
        >
          {t('dueIn10Days')} ({countsByType.DUE_10_DAYS || 0})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs liquid-glass-panel rounded-2xl">
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            {t('loading')}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs liquid-glass-panel rounded-2xl">
            {t('noAlerts')}
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-2xl transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                !n.is_read
                  ? 'liquid-glass-card border-teal-400/40 shadow-[0_0_20px_rgba(20,184,166,0.15)] bg-slate-900/60'
                  : 'liquid-glass-panel opacity-85'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="mt-1">
                  {n.notification_type === 'OVERDUE' ? (
                    <AlertCircle className="w-5 h-5 text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                  ) : n.notification_type === 'DUE_TODAY' ? (
                    <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                  ) : n.notification_type === 'DUE_5_DAYS' ? (
                    <Clock className="w-5 h-5 text-orange-400" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-400" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-white text-xs">{n.equipment_id}</span>
                    <span className="text-slate-400 text-xs">• {n.equipment_name}</span>
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                        n.notification_type === 'OVERDUE'
                          ? 'bg-red-500/20 text-red-300 border-red-500/40 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                          : n.notification_type === 'DUE_TODAY'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                      }`}
                    >
                      {n.notification_type.replace(/_/g, ' ')}
                    </span>
                    {!n.is_read && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-teal-500/20 text-teal-300 border border-teal-400/40 shadow-[0_0_8px_rgba(20,184,166,0.3)]">
                        NEW
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-200">{n.message}</p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                    <span>{t('colNextDue')}: {n.due_date}</span>
                    <span>•</span>
                    <span className={n.remaining_days < 0 ? 'text-red-400 font-semibold' : ''}>
                      {n.remaining_days < 0
                        ? `${Math.abs(n.remaining_days)} ${lang === 'th' ? 'วัน เกินกำหนด' : 'days overdue'}`
                        : n.remaining_days === 0
                        ? (lang === 'th' ? 'ครบกำหนดวันนี้' : 'Due Today')
                        : `${n.remaining_days} ${lang === 'th' ? 'วันคงเหลือ' : 'days remaining'}`}
                    </span>
                    <span>•</span>
                    <span>{n.notification_date}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {canEdit && (
                  <button
                    onClick={() => onRecordCalibrationForEquipment(n.equipment_id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 liquid-glass-primary text-white rounded-xl text-xs font-semibold transition"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>{t('recordCalibration')}</span>
                  </button>
                )}

                {!n.is_read && (
                  <button
                    onClick={() => handleMarkAsRead(n.id)}
                    title={lang === 'th' ? 'ทำเครื่องหมายว่าอ่านแล้ว' : 'Mark as read'}
                    className="p-1.5 liquid-glass-button text-slate-300 hover:text-white rounded-xl text-xs transition"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={() => handleDeleteNotification(n.id)}
                  title={t('delete')}
                  className="p-1.5 liquid-glass-button text-slate-400 hover:text-rose-400 rounded-xl text-xs transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
