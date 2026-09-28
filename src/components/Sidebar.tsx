import React from 'react';
import { User } from '../types/index.js';
import {
  LayoutDashboard,
  Gauge,
  ClipboardCheck,
  Bell,
  FileSpreadsheet,
  ShieldCheck,
  Users,
  Database,
  X,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';

export type TabType =
  | 'dashboard'
  | 'equipment'
  | 'calibrations'
  | 'notifications'
  | 'reports'
  | 'audit-log'
  | 'users'
  | 'master-data';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  user,
  isOpen,
  onClose,
}) => {
  const { t } = useLanguage();

  const navItems: { id: TabType; labelKey: string; icon: React.ReactNode; roles?: string[] }[] = [
    { id: 'dashboard', labelKey: 'navDashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'equipment', labelKey: 'navEquipment', icon: <Gauge className="w-4 h-4" /> },
    { id: 'calibrations', labelKey: 'navCalibrations', icon: <ClipboardCheck className="w-4 h-4" /> },
    { id: 'notifications', labelKey: 'navNotifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'reports', labelKey: 'navReports', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'audit-log', labelKey: 'navAuditLog', icon: <ShieldCheck className="w-4 h-4" />, roles: ['Admin'] },
    { id: 'users', labelKey: 'navUsers', icon: <Users className="w-4 h-4" />, roles: ['Admin'] },
    { id: 'master-data', labelKey: 'navMasterData', icon: <Database className="w-4 h-4" />, roles: ['Admin', 'QA/QC'] },
  ];

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(user.role);
  });

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/70 z-30 md:hidden backdrop-blur-md"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 liquid-glass-sidebar flex flex-col transition-transform duration-300 ease-in-out shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Branding with Glass Glow */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500/25 to-cyan-500/10 border border-teal-400/40 flex items-center justify-center text-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.3)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white text-sm tracking-wider flex items-center gap-1.5">
                <span>PCS-NISSIN</span>
              </div>
              <div className="text-[10px] text-teal-300/80 font-mono tracking-tight">
                {t('plantVersion')}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {t('navOperations')}
          </div>
          {filteredNavItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 relative group ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-500/20 to-cyan-500/10 text-teal-200 border border-teal-400/30 shadow-[0_0_20px_rgba(20,184,166,0.2)]'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.05] border border-transparent'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-gradient-to-b from-teal-400 to-cyan-400 rounded-r-full shadow-[0_0_8px_rgba(45,212,191,0.8)]" />
                )}
                <span className={isActive ? 'text-teal-300 drop-shadow-[0_0_6px_rgba(45,212,191,0.5)]' : 'text-slate-400 group-hover:text-slate-200'}>
                  {item.icon}
                </span>
                <span className="truncate">{t(item.labelKey)}</span>
              </button>
            );
          })}
        </div>

        {/* System Status Footer */}
        <div className="p-3.5 border-t border-white/10 bg-slate-950/40">
          <div className="p-2.5 rounded-xl liquid-glass-card text-[11px] text-slate-400 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Standard Compliance</span>
              <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[10px] drop-shadow-[0_0_6px_rgba(52,211,153,0.4)]">
                <CheckCircle className="w-3 h-3" /> ISO 17025
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Role: <strong className="text-slate-200 font-semibold">{user.role}</strong>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
