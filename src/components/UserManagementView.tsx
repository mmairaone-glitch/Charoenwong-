import React, { useState, useEffect } from 'react';
import { User, Role, MasterDepartment } from '../types/index.js';
import { api, getStoredUser } from '../services/api.js';
import {
  Users,
  PlusCircle,
  Edit2,
  Trash2,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  X,
  Sparkles,
  CheckCircle,
  AlertCircle,
  UserX,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';
import { ConfirmModal } from './ConfirmModal.js';

interface UserManagementViewProps {
  currentUser?: User | null;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({ currentUser: propCurrentUser }) => {
  const { t, lang } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<MasterDepartment[]>([]);
  const [loading, setLoading] = useState(true);

  // Active logged-in user to check Admin permissions and prevent deleting self
  const [activeUser, setActiveUser] = useState<User | null>(() => propCurrentUser || getStoredUser());

  useEffect(() => {
    if (propCurrentUser) {
      setActiveUser(propCurrentUser);
    } else {
      const stored = getStoredUser();
      setActiveUser(stored);
    }
  }, [propCurrentUser]);

  const isAdmin = activeUser?.role === 'Admin';

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetPinUser, setResetPinUser] = useState<User | null>(null);

  // User deletion state
  const [deleteTargetUser, setDeleteTargetUser] = useState<User | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Form states
  const [empId, setEmpId] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [department, setDepartment] = useState('QA/QC');
  const [position, setPosition] = useState('Quality Engineer');
  const [role, setRole] = useState<Role>('QA/QC');

  const [newPin, setNewPin] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [statusToggleTarget, setStatusToggleTarget] = useState<User | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const [userRes, deptRes] = await Promise.all([
        api.getUsers(),
        api.getDepartments(),
      ]);
      setUsers(userRes.users);
      setDepartments(deptRes.departments || []);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenAddModal = () => {
    setEmpId('');
    setName('');
    setUsername('');
    setPin('');
    setDepartment(departments[0]?.name || 'QA/QC');
    setPosition('QA Inspector');
    setRole('QA/QC');
    setModalError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (u: User) => {
    setEditingUser(u);
    setName(u.name);
    setDepartment(u.department);
    setPosition(u.position);
    setRole(u.role);
    setModalError(null);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!/^\d{4}$/.test(pin)) {
      setModalError('Password PIN must be exactly 4 numeric digits (e.g. 1234).');
      return;
    }

    setModalLoading(true);
    try {
      await api.createUser({
        employee_id: empId.trim().toUpperCase(),
        name: name.trim(),
        username: username.trim(),
        pin: pin.trim(),
        department: department.trim(),
        position: position.trim(),
        role,
      });
      setIsAddModalOpen(false);
      loadUsers();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create user.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setModalError(null);

    setModalLoading(true);
    try {
      await api.updateUser(editingUser.id, {
        name: name.trim(),
        department: department.trim(),
        position: position.trim(),
        role,
      });
      setEditingUser(null);
      loadUsers();
    } catch (err: any) {
      setModalError(err.message || 'Failed to update user.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPinUser) return;
    setModalError(null);

    if (!/^\d{4}$/.test(newPin)) {
      setModalError('PIN must be exactly 4 numeric digits.');
      return;
    }

    setModalLoading(true);
    try {
      await api.resetUserPin(resetPinUser.id, newPin.trim());
      const userName = resetPinUser.name;
      setResetPinUser(null);
      setFeedback({
        type: 'success',
        message: lang === 'th' ? `เปลี่ยนรหัส PIN ของ ${userName} เรียบร้อยแล้ว` : `PIN for ${userName} has been updated.`,
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setModalError(err.message || 'Failed to reset PIN.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = (u: User) => {
    setStatusToggleTarget(u);
  };

  const handleConfirmToggleStatus = async () => {
    if (!statusToggleTarget) return;
    setIsTogglingStatus(true);
    try {
      await api.toggleUserStatus(statusToggleTarget.id);
      setFeedback({
        type: 'success',
        message: lang === 'th'
          ? `อัปเดตสถานะของ ${statusToggleTarget.name} เรียบร้อยแล้ว`
          : `Status for ${statusToggleTarget.name} updated.`,
      });
      setTimeout(() => setFeedback(null), 4000);
      setStatusToggleTarget(null);
      loadUsers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to change user status.' });
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleInitiateDeleteUser = (u: User) => {
    if (!isAdmin) {
      setFeedback({
        type: 'error',
        message: lang === 'th' ? 'สิทธิ์ไม่เพียงพอ: ให้สิทธิ์ ADMIN คนเดียวเท่านั้นในการลบผู้ใช้งาน' : 'Permission denied: Only ADMIN can delete users.',
      });
      setTimeout(() => setFeedback(null), 4000);
      return;
    }
    if (u.id === activeUser?.id) {
      setFeedback({
        type: 'error',
        message: lang === 'th' ? 'ไม่สามารถลบบัญชีผู้ใช้งานของตนเองที่กำลังเข้าสู่ระบบอยู่ได้' : 'You cannot delete your own active administrator account.',
      });
      setTimeout(() => setFeedback(null), 4000);
      return;
    }
    setDeleteTargetUser(u);
  };

  const handleConfirmDeleteUser = async () => {
    if (!deleteTargetUser) return;
    if (!isAdmin) {
      setFeedback({
        type: 'error',
        message: lang === 'th' ? 'สิทธิ์ไม่เพียงพอ: ให้สิทธิ์ ADMIN คนเดียวเท่านั้นในการลบผู้ใช้งาน' : 'Permission denied: Only ADMIN can delete users.',
      });
      setDeleteTargetUser(null);
      return;
    }
    if (deleteTargetUser.id === activeUser?.id) {
      setFeedback({
        type: 'error',
        message: lang === 'th' ? 'ไม่สามารถลบบัญชีของตนเองได้' : 'Cannot delete your own account.',
      });
      setDeleteTargetUser(null);
      return;
    }

    setIsDeletingUser(true);
    try {
      await api.deleteUser(deleteTargetUser.id);
      const deletedName = deleteTargetUser.name;
      const deletedEmpId = deleteTargetUser.employee_id;
      setFeedback({
        type: 'success',
        message: lang === 'th'
          ? `ลบผู้ใช้งาน ${deletedName} (${deletedEmpId}) ออกจากระบบเรียบร้อยแล้ว`
          : `User ${deletedName} (${deletedEmpId}) has been deleted successfully.`,
      });
      setTimeout(() => setFeedback(null), 4000);
      setDeleteTargetUser(null);
      loadUsers();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || (lang === 'th' ? 'เกิดข้อผิดพลาดในการลบผู้ใช้งาน' : 'Failed to delete user.'),
      });
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setIsDeletingUser(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>{t('navUsers')}</span>
            <Sparkles className="w-4 h-4 text-teal-400 hidden sm:inline" />
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {lang === 'th'
              ? 'จัดการบัญชีผู้ใช้งาน สิทธิ์การเข้าถึง (Admin, QA/QC, Viewer) และรหัสผ่าน PIN 4 หลัก'
              : 'Administer employee credentials, 4-digit PIN passwords, roles (Admin, QA/QC, Viewer), and access statuses'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadUsers}
            title={t('refresh')}
            className="p-2 liquid-glass-button rounded-xl text-slate-300 hover:text-white transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-400' : ''}`} />
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 liquid-glass-primary text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-teal-950"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{lang === 'th' ? 'เพิ่มผู้ใช้งานใหม่' : 'Add User'}</span>
          </button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in shadow-md ${
            feedback.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200 shadow-emerald-500/10'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-200 shadow-rose-500/10'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}
      <div className="liquid-glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] border-b border-white/10">
              <tr>
                <th className="py-3 px-3.5">Employee ID</th>
                <th className="py-3 px-3.5">Employee Name</th>
                <th className="py-3 px-3.5">Username</th>
                <th className="py-3 px-3.5">{t('department')}</th>
                <th className="py-3 px-3.5">Position</th>
                <th className="py-3 px-3.5">Role</th>
                <th className="py-3 px-3.5">{t('status')}</th>
                <th className="py-3 px-3.5">Last Login</th>
                <th className="py-3 px-3.5 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    {t('loading')}
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.03] transition">
                    <td className="py-3 px-3.5 font-mono font-bold text-teal-400">{u.employee_id}</td>
                    <td className="py-3 px-3.5 font-semibold text-white">{u.name}</td>
                    <td className="py-3 px-3.5 font-mono text-slate-300">{u.username}</td>
                    <td className="py-3 px-3.5">{u.department}</td>
                    <td className="py-3 px-3.5 text-slate-400">{u.position}</td>
                    <td className="py-3 px-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                          u.role === 'Admin'
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-[0_0_8px_rgba(99,102,241,0.2)]'
                            : u.role === 'QA/QC'
                            ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-[0_0_8px_rgba(20,184,166,0.2)]'
                            : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3.5">
                      {u.is_active ? (
                        <span className="flex items-center gap-1 text-emerald-400 font-medium text-[11px] drop-shadow-[0_0_6px_rgba(52,211,153,0.3)]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {lang === 'th' ? 'เปิดใช้งาน' : 'Active'}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-400 font-medium text-[11px]">
                          <XCircle className="w-3.5 h-3.5" /> {lang === 'th' ? 'ระงับการใช้งาน' : 'Disabled'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-[11px] text-slate-400">
                      {u.last_login ? new Date(u.last_login).toLocaleDateString() : (lang === 'th' ? 'ยังไม่เคยเข้าสู่ระบบ' : 'Never')}
                    </td>
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(u)}
                          title={t('edit')}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg liquid-glass-button transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setResetPinUser(u);
                            setNewPin('');
                            setModalError(null);
                          }}
                          title={lang === 'th' ? 'รีเซ็ตรหัสผ่าน PIN' : 'Reset 4-Digit Password PIN'}
                          className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg liquid-glass-button transition"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          title={u.is_active ? (lang === 'th' ? 'ระงับบัญชี' : 'Disable Account') : (lang === 'th' ? 'เปิดใช้บัญชี' : 'Enable Account')}
                          className={`p-1.5 rounded-lg liquid-glass-button transition ${
                            u.is_active
                              ? 'text-slate-400 hover:text-rose-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleInitiateDeleteUser(u)}
                            disabled={u.id === activeUser?.id}
                            title={
                              u.id === activeUser?.id
                                ? (lang === 'th' ? 'ไม่สามารถลบบัญชีผู้ใช้งานที่กำลังเข้าสู่ระบบอยู่ได้' : 'Cannot delete your own active administrator account')
                                : (lang === 'th' ? 'ลบผู้ใช้งานออกจากระบบ (สิทธิ์ ADMIN เท่านั้น)' : 'Delete User (Admin Only)')
                            }
                            className={`p-1.5 rounded-lg liquid-glass-button transition ${
                              u.id === activeUser?.id
                                ? 'text-slate-600 opacity-30 cursor-not-allowed'
                                : 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/20'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="liquid-glass-panel border border-white/20 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] max-w-md w-full overflow-hidden">
            <div className="p-4 bg-slate-950/60 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">
                {lang === 'th' ? 'เพิ่มผู้ใช้งานระบบใหม่' : 'Create New Employee User'}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-3.5 text-xs">
              {modalError && (
                <div className="p-2.5 bg-rose-950/70 border border-rose-500/40 text-rose-200 rounded-xl">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-medium mb-1">Employee ID *</label>
                <input
                  type="text"
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value.toUpperCase())}
                  placeholder="e.g. QA005"
                  className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  {lang === 'th' ? 'ชื่อ-นามสกุลพนักงาน *' : 'Employee Full Name *'}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kanchana P."
                  className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  {lang === 'th' ? 'ชื่อผู้ใช้ (Username / Login) *' : 'Username / Login Handle *'}
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. kanchana"
                  className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  {lang === 'th' ? 'รหัสผ่าน PIN 4 หลักแรกเริ่ม *' : 'Initial 4-Digit Password PIN *'}
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="****"
                  className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white text-center font-mono text-base tracking-widest"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {lang === 'th' ? 'ต้องเป็นตัวเลข 4 หลักเท่านั้น (เช่น 2097, 1234)' : 'Must be exactly 4 numeric digits.'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">{t('department')}</label>
                  {departments.length > 0 ? (
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.code} - {d.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Role Permission *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white font-semibold"
                  >
                    <option value="QA/QC">QA/QC</option>
                    <option value="Admin">Admin</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 liquid-glass-button text-slate-300 rounded-xl"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-1.5 liquid-glass-primary text-white rounded-xl font-semibold shadow-lg shadow-teal-950"
                >
                  {modalLoading ? t('saving') : (lang === 'th' ? 'สร้างบัญชีผู้ใช้' : 'Create Account')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="liquid-glass-panel border border-white/20 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] max-w-md w-full overflow-hidden">
            <div className="p-4 bg-slate-950/60 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">
                {lang === 'th' ? `แก้ไขข้อมูลผู้ใช้: ${editingUser.employee_id}` : `Edit User: ${editingUser.employee_id}`}
              </h2>
              <button onClick={() => setEditingUser(null)} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6 space-y-3.5 text-xs">
              {modalError && (
                <div className="p-2.5 bg-rose-950/70 border border-rose-500/40 text-rose-200 rounded-xl">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  {lang === 'th' ? 'ชื่อ-นามสกุลพนักงาน' : 'Employee Full Name'}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">{t('department')}</label>
                {departments.length > 0 ? (
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white"
                  />
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Position</label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Role Permission</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white font-semibold"
                >
                  <option value="Admin">Admin</option>
                  <option value="QA/QC">QA/QC</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3.5 py-1.5 liquid-glass-button text-slate-300 rounded-xl"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-1.5 liquid-glass-primary text-white rounded-xl font-semibold shadow-lg shadow-teal-950"
                >
                  {modalLoading ? t('saving') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset PIN Modal */}
      {resetPinUser && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="liquid-glass-panel border border-white/20 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] max-w-sm w-full overflow-hidden">
            <div className="p-4 bg-slate-950/60 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Reset PIN: {resetPinUser.name}</span>
              </h2>
              <button onClick={() => setResetPinUser(null)} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPin} className="p-6 space-y-4 text-xs">
              {modalError && (
                <div className="p-2.5 bg-rose-950/70 border border-rose-500/40 text-rose-200 rounded-xl">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  {lang === 'th' ? 'กรอกรหัสผ่าน PIN 4 หลักใหม่' : 'Enter New 4-Digit Password PIN'}
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="****"
                  className="w-full px-3 py-2 liquid-glass-input rounded-xl text-white text-center font-mono text-xl tracking-widest"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {lang === 'th' ? 'ตัวเลข 4 หลักเท่านั้น (จะปลดล็อคการจำกัดสิทธิ์หากถูกล็อคอยู่)' : 'Numeric digits only. Will reset failed attempt lockout.'}
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setResetPinUser(null)}
                  className="px-3.5 py-1.5 liquid-glass-button text-slate-300 rounded-xl"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-1.5 bg-amber-500/80 hover:bg-amber-500 text-white rounded-xl font-semibold shadow-lg shadow-amber-950 transition"
                >
                  {modalLoading ? t('saving') : (lang === 'th' ? 'ตั้งค่ารหัสใหม่' : 'Set New PIN')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm User Status Toggle Modal */}
      {statusToggleTarget && (
        <ConfirmModal
          isOpen={Boolean(statusToggleTarget)}
          variant={statusToggleTarget.is_active ? 'warning' : 'info'}
          isSubmitting={isTogglingStatus}
          title={
            lang === 'th'
              ? `${statusToggleTarget.is_active ? 'ระงับการใช้งานผู้ใช้' : 'เปิดใช้งานผู้ใช้'}: ${statusToggleTarget.name}`
              : `${statusToggleTarget.is_active ? 'Disable User' : 'Enable User'}: ${statusToggleTarget.name}`
          }
          message={
            lang === 'th'
              ? `คุณต้องการ${statusToggleTarget.is_active ? 'ระงับการเข้าสู่ระบบ' : 'เปิดสิทธิ์การใช้งาน'}ของ ${statusToggleTarget.name} (${statusToggleTarget.employee_id}) หรือไม่?`
              : `Are you sure you want to ${statusToggleTarget.is_active ? 'disable' : 'enable'} account access for ${statusToggleTarget.name} (${statusToggleTarget.employee_id})?`
          }
          confirmText={
            statusToggleTarget.is_active
              ? (lang === 'th' ? 'ระงับการใช้งาน' : 'Disable')
              : (lang === 'th' ? 'เปิดใช้งาน' : 'Enable')
          }
          cancelText={lang === 'th' ? 'ยกเลิก' : 'Cancel'}
          onConfirm={handleConfirmToggleStatus}
          onCancel={() => {
            if (!isTogglingStatus) setStatusToggleTarget(null);
          }}
        />
      )}

      {/* Confirm Permanent Delete User Modal (ADMIN Only) */}
      {deleteTargetUser && (
        <ConfirmModal
          isOpen={Boolean(deleteTargetUser)}
          variant="danger"
          isSubmitting={isDeletingUser}
          title={
            lang === 'th'
              ? `ยืนยันการลบผู้ใช้งาน: ${deleteTargetUser.name}`
              : `Confirm Permanent User Deletion: ${deleteTargetUser.name}`
          }
          message={
            lang === 'th'
              ? `คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีผู้ใช้งาน ${deleteTargetUser.name} (รหัสพนักงาน: ${deleteTargetUser.employee_id}, ตำแหน่ง: ${deleteTargetUser.position}, แผนก: ${deleteTargetUser.department}, สิทธิ์: ${deleteTargetUser.role}) ออกจากระบบอย่างถาวร? การกระทำนี้ไม่สามารถย้อนกลับได้ และให้สิทธิ์ ADMIN คนเดียวเท่านั้น`
              : `Are you sure you want to permanently delete user account ${deleteTargetUser.name} (ID: ${deleteTargetUser.employee_id}, Role: ${deleteTargetUser.role})? This action cannot be undone and is restricted to Administrators only.`
          }
          confirmText={lang === 'th' ? 'ลบผู้ใช้งานทันที' : 'Delete Permanently'}
          cancelText={lang === 'th' ? 'ยกเลิก' : 'Cancel'}
          onConfirm={handleConfirmDeleteUser}
          onCancel={() => {
            if (!isDeletingUser) setDeleteTargetUser(null);
          }}
        />
      )}
    </div>
  );
};
