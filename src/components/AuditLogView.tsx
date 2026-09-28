import React, { useState, useEffect } from 'react';
import { AuditLog } from '../types/index.js';
import { api } from '../services/api.js';
import { ShieldCheck, Search, RefreshCw, Eye, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';

export const AuditLogView: React.FC = () => {
  const { t, lang } = useLanguage();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs({
        search,
        module: selectedModule,
      });
      setLogs(data.logs);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [search, selectedModule]);

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>{t('navAuditLog')}</span>
            <Sparkles className="w-4 h-4 text-teal-400 hidden sm:inline" />
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {lang === 'th'
              ? 'บันทึกประวัติการกระทำทั้งหมดในระบบ (Audit Trail) ตามมาตรฐานความปลอดภัย ไม่สามารถแก้ไขหรือลบได้'
              : 'Immutable log of all user activities, calibration updates, equipment modifications, and logins'}
          </p>
        </div>

        <button
          onClick={loadLogs}
          title={t('refresh')}
          className="p-2 liquid-glass-button rounded-xl text-slate-300 hover:text-white transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-400' : ''}`} />
        </button>
      </div>

      {/* Filter and Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 liquid-glass-panel rounded-2xl">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === 'th' ? 'ค้นหาการกระทำ, ชื่อพนักงาน, ID, โมดูล...' : 'Search action, employee name, ID, record key...'}
            className="w-full pl-9 pr-3 py-1.5 liquid-glass-input rounded-xl text-white text-xs placeholder-slate-400"
          />
        </div>

        <div>
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="w-full px-2.5 py-1.5 liquid-glass-input rounded-xl text-slate-200 text-xs font-mono"
          >
            <option value="all">{lang === 'th' ? 'ทุกโมดูล (All Modules)' : 'All Modules'}</option>
            <option value="EQUIPMENT">EQUIPMENT</option>
            <option value="CALIBRATION">CALIBRATION</option>
            <option value="USER_MANAGEMENT">USER_MANAGEMENT</option>
            <option value="AUTH">AUTH</option>
            <option value="SCHEDULER">SCHEDULER</option>
            <option value="MASTER_DATA">MASTER_DATA</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="liquid-glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] border-b border-white/10">
              <tr>
                <th className="py-3 px-3.5">Timestamp</th>
                <th className="py-3 px-3.5">User</th>
                <th className="py-3 px-3.5">Module</th>
                <th className="py-3 px-3.5">Action</th>
                <th className="py-3 px-3.5">Record ID</th>
                <th className="py-3 px-3.5">IP Address</th>
                <th className="py-3 px-3.5 text-right">{t('details')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    {t('loading')}
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    {lang === 'th' ? 'ไม่พบบันทึกประวัติในระบบ' : 'No audit records match the query.'}
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-white/[0.03] transition">
                        <td className="py-3 px-3.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-3.5">
                          <div className="font-semibold text-white">{log.user_name}</div>
                          <div className="text-[10px] font-mono text-slate-400">{log.employee_id}</div>
                        </td>
                        <td className="py-3 px-3.5 font-mono text-[11px]">
                          <span className="px-2 py-0.5 rounded-lg liquid-glass-switcher text-slate-300">
                            {log.module}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 font-mono font-bold text-teal-400 text-[11px]">
                          {log.action}
                        </td>
                        <td className="py-3 px-3.5 font-mono text-slate-300">{log.record_id}</td>
                        <td className="py-3 px-3.5 font-mono text-[11px] text-slate-400">{log.ip_address || '-'}</td>
                        <td className="py-3 px-3.5 text-right">
                          <button
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg liquid-glass-button transition"
                            title="Inspect details payload"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="p-4 bg-slate-950/80 border-y border-teal-500/30">
                            <div className="font-mono text-[11px] space-y-1.5">
                              <div className="text-teal-400 font-bold mb-1">
                                {lang === 'th' ? 'ข้อมูลการเปลี่ยนแปลง (Details Payload):' : 'Audit Event Payload & State Changes:'}
                              </div>
                              <pre className="p-3 bg-black/60 rounded-xl border border-white/10 text-slate-300 overflow-x-auto text-[11px]">
                                {JSON.stringify(log.details || { old_value: log.old_value, new_value: log.new_value }, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
