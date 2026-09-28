import {
  User,
  Equipment,
  EquipmentType,
  CalibrationRecord,
  NotificationItem,
  AuditLog,
  DashboardStats,
  MasterDepartment,
  MasterLocation,
} from '../types/index.js';

const TOKEN_KEY = 'icms_session_token';
const USER_KEY = 'icms_user_cache';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user: User | null) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    setStoredToken(null);
    setStoredUser(null);
    window.dispatchEvent(new CustomEvent('icms-unauthorized'));
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data;
}

export const api = {
  // Auth
  async login(username: string, pin: string): Promise<{ token: string; user: User }> {
    const data = await request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, pin }),
    });
    setStoredToken(data.token);
    setStoredUser(data.user);
    return data;
  },

  async logout(): Promise<void> {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn('Logout API failed, clearing local state', err);
    } finally {
      setStoredToken(null);
      setStoredUser(null);
    }
  },

  async getMe(): Promise<{ user: User }> {
    return request<{ user: User }>('/api/auth/me');
  },

  async changePin(current_pin: string, new_pin: string): Promise<{ success: boolean; message: string }> {
    return request('/api/auth/change-pin', {
      method: 'POST',
      body: JSON.stringify({ current_pin, new_pin }),
    });
  },

  // Equipment
  async getEquipment(params: Record<string, string> = {}): Promise<{ equipment: Equipment[]; total: number }> {
    const query = new URLSearchParams(params).toString();
    return request(`/api/equipment${query ? `?${query}` : ''}`);
  },

  async getEquipmentById(id: string): Promise<{ equipment: Equipment; history: CalibrationRecord[]; auditLogs: AuditLog[] }> {
    return request(`/api/equipment/${encodeURIComponent(id)}`);
  },

  async createEquipment(data: Partial<Equipment>): Promise<{ equipment: Equipment }> {
    return request('/api/equipment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateEquipment(id: string, data: Partial<Equipment>): Promise<{ equipment: Equipment }> {
    return request(`/api/equipment/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteEquipment(id: string): Promise<{ success: boolean; message: string }> {
    return request(`/api/equipment/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // Calibration Records
  async getCalibrations(params: Record<string, string> = {}): Promise<{ records: CalibrationRecord[]; total: number }> {
    const query = new URLSearchParams(params).toString();
    return request(`/api/calibrations${query ? `?${query}` : ''}`);
  },

  async getCalibrationById(id: string): Promise<{ record: CalibrationRecord }> {
    return request(`/api/calibrations/${encodeURIComponent(id)}`);
  },

  async createCalibration(data: Partial<CalibrationRecord>): Promise<{ record: CalibrationRecord; updatedEquipment: Equipment }> {
    return request('/api/calibrations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateCalibration(id: string, data: Partial<CalibrationRecord>): Promise<{ record: CalibrationRecord }> {
    return request(`/api/calibrations/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteCalibration(id: string): Promise<{ success: boolean; message: string }> {
    return request(`/api/calibrations/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    return request<DashboardStats>('/api/dashboard/stats');
  },

  // Notifications
  async getNotifications(filter: string = 'all'): Promise<{
    notifications: NotificationItem[];
    unreadCount: number;
    countsByType: Record<string, number>;
  }> {
    return request(`/api/notifications?filter=${encodeURIComponent(filter)}`);
  },

  async markNotificationAsRead(id: string): Promise<{ success: boolean }> {
    return request(`/api/notifications/${encodeURIComponent(id)}/read`, { method: 'PUT' });
  },

  async markAllNotificationsAsRead(): Promise<{ success: boolean }> {
    return request('/api/notifications/read-all', { method: 'POST' });
  },

  async deleteNotification(id: string): Promise<{ success: boolean }> {
    return request(`/api/notifications/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  // Users
  async getUsers(): Promise<{ users: User[] }> {
    return request('/api/users');
  },

  async createUser(data: {
    employee_id: string;
    name: string;
    username: string;
    pin: string;
    department: string;
    position: string;
    role: string;
  }): Promise<{ user: User }> {
    return request('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateUser(id: string, data: Partial<User>): Promise<{ user: User }> {
    return request(`/api/users/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async resetUserPin(id: string, new_pin: string): Promise<{ success: boolean; message: string }> {
    return request(`/api/users/${encodeURIComponent(id)}/reset-pin`, {
      method: 'POST',
      body: JSON.stringify({ new_pin }),
    });
  },

  async toggleUserStatus(id: string): Promise<{ success: boolean; user: User }> {
    return request(`/api/users/${encodeURIComponent(id)}/toggle-status`, {
      method: 'POST',
    });
  },

  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    return request(`/api/users/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // Equipment Types & Masters
  async getEquipmentTypes(): Promise<{ types: EquipmentType[] }> {
    return request('/api/equipment-types');
  },

  async createEquipmentType(data: Partial<EquipmentType>): Promise<{ type: EquipmentType }> {
    return request('/api/equipment-types', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateEquipmentType(id: string, data: Partial<EquipmentType>): Promise<{ type: EquipmentType }> {
    return request(`/api/equipment-types/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteEquipmentType(id: string, options?: { deleteEquipment?: boolean }): Promise<{ success: boolean; message?: string }> {
    const query = options?.deleteEquipment ? '?deleteEquipment=true' : '';
    return request(`/api/equipment-types/${encodeURIComponent(id)}${query}`, {
      method: 'DELETE',
    });
  },

  async getDepartments(): Promise<{ departments: MasterDepartment[] }> {
    return request('/api/equipment-types/departments');
  },

  async createDepartment(data: { code: string; name: string }): Promise<{ department: MasterDepartment }> {
    return request('/api/equipment-types/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateDepartment(id: string, data: { code?: string; name?: string }): Promise<{ department: MasterDepartment }> {
    return request(`/api/equipment-types/departments/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteDepartment(id: string): Promise<{ success: boolean; message: string }> {
    return request(`/api/equipment-types/departments/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  async getLocations(): Promise<{ locations: MasterLocation[] }> {
    return request('/api/equipment-types/locations');
  },

  async createLocation(data: { code: string; name: string }): Promise<{ location: MasterLocation }> {
    return request('/api/equipment-types/locations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateLocation(id: string, data: { code?: string; name?: string }): Promise<{ location: MasterLocation }> {
    return request(`/api/equipment-types/locations/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteLocation(id: string): Promise<{ success: boolean; message: string }> {
    return request(`/api/equipment-types/locations/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // Audit Logs
  async getAuditLogs(params: Record<string, string> = {}): Promise<{ logs: AuditLog[]; total: number }> {
    const query = new URLSearchParams(params).toString();
    return request(`/api/audit-logs${query ? `?${query}` : ''}`);
  },

  // Reports
  async getReport(type: 'status' | 'overdue' | 'due-soon' | 'history'): Promise<{ report: any[]; total: number }> {
    return request(`/api/reports/${type}`);
  },

  // Scheduler
  async runScheduler(simulatedDate?: string): Promise<{
    success: boolean;
    message: string;
    newNotificationsCount: number;
    checkedCount: number;
    date: string;
  }> {
    return request('/api/scheduler/run', {
      method: 'POST',
      body: JSON.stringify({ simulatedDate }),
    });
  },

  // File Upload
  async uploadCertificate(fileName: string, fileData: string, fileType: string): Promise<{
    success: boolean;
    attachment_url: string;
    attachment_name: string;
  }> {
    return request('/api/upload', {
      method: 'POST',
      body: JSON.stringify({ fileName, fileData, fileType }),
    });
  },
};
