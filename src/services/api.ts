import {
  Staff,
  AttendanceRecord,
  LeaveRecord,
  HolidayRecord,
  WorkspaceSettings,
  UserProfile,
  EmployeePayroll,
} from '../types/attendance';

const TOKEN_KEY = 'attendx_token';

export const api = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMsg = 'An error occurred';
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorMsg;
      } catch {
        errorMsg = response.statusText || errorMsg;
      }
      throw new Error(errorMsg);
    }

    return response.json();
  },

  // Auth
  async register(username: string, password: string): Promise<{ user: UserProfile; token: string }> {
    const res = await this.request<{ user: UserProfile; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.setToken(res.token);
    return res;
  },

  async login(username: string, password: string): Promise<{ user: UserProfile; token: string }> {
    const res = await this.request<{ user: UserProfile; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.setToken(res.token);
    return res;
  },

  async getMe(): Promise<{ user: UserProfile; settings: WorkspaceSettings }> {
    return this.request<{ user: UserProfile; settings: WorkspaceSettings }>('/api/auth/me');
  },

  async logout(): Promise<void> {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } finally {
      this.clearToken();
    }
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await this.request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  },

  async deleteAccount(): Promise<void> {
    await this.request('/api/auth/account', { method: 'DELETE' });
    this.clearToken();
  },

  // Settings
  async getSettings(): Promise<WorkspaceSettings> {
    return this.request<WorkspaceSettings>('/api/settings');
  },

  async updateSettings(settings: Partial<WorkspaceSettings>): Promise<WorkspaceSettings> {
    return this.request<WorkspaceSettings>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  // Staff
  async getStaff(): Promise<Staff[]> {
    return this.request<Staff[]>('/api/staff');
  },

  async addStaff(staff: Omit<Staff, 'id' | 'userId' | 'createdAt'>): Promise<Staff> {
    return this.request<Staff>('/api/staff', {
      method: 'POST',
      body: JSON.stringify(staff),
    });
  },

  async updateStaff(id: string, partial: Partial<Staff>): Promise<Staff> {
    return this.request<Staff>(`/api/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(partial),
    });
  },

  async deleteStaff(id: string): Promise<void> {
    await this.request(`/api/staff/${id}`, { method: 'DELETE' });
  },

  // Attendance
  async getAttendance(month?: string, date?: string): Promise<AttendanceRecord[]> {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (date) params.append('date', date);
    return this.request<AttendanceRecord[]>(`/api/attendance?${params.toString()}`);
  },

  async upsertAttendance(
    record: Omit<AttendanceRecord, 'id' | 'userId' | 'updatedAt'>
  ): Promise<AttendanceRecord> {
    return this.request<AttendanceRecord>('/api/attendance', {
      method: 'POST',
      body: JSON.stringify(record),
    });
  },

  async batchUpsertAttendance(
    records: Omit<AttendanceRecord, 'id' | 'userId' | 'updatedAt'>[]
  ): Promise<{ count: number; records: AttendanceRecord[] }> {
    return this.request<{ count: number; records: AttendanceRecord[] }>('/api/attendance/batch', {
      method: 'POST',
      body: JSON.stringify({ records }),
    });
  },

  // Leaves
  async getLeaves(): Promise<LeaveRecord[]> {
    return this.request<LeaveRecord[]>('/api/leaves');
  },

  async addLeave(leave: Omit<LeaveRecord, 'id' | 'userId' | 'createdAt'>): Promise<LeaveRecord> {
    return this.request<LeaveRecord>('/api/leaves', {
      method: 'POST',
      body: JSON.stringify(leave),
    });
  },

  async updateLeave(id: string, partial: Partial<LeaveRecord>): Promise<LeaveRecord> {
    return this.request<LeaveRecord>(`/api/leaves/${id}`, {
      method: 'PUT',
      body: JSON.stringify(partial),
    });
  },

  async deleteLeave(id: string): Promise<void> {
    await this.request(`/api/leaves/${id}`, { method: 'DELETE' });
  },

  // Holidays
  async getHolidays(): Promise<HolidayRecord[]> {
    return this.request<HolidayRecord[]>('/api/holidays');
  },

  async addHoliday(holiday: Omit<HolidayRecord, 'id' | 'userId'>): Promise<HolidayRecord> {
    return this.request<HolidayRecord>('/api/holidays', {
      method: 'POST',
      body: JSON.stringify(holiday),
    });
  },

  async deleteHoliday(id: string): Promise<void> {
    await this.request(`/api/holidays/${id}`, { method: 'DELETE' });
  },

  // Payroll
  async getPayroll(month: string): Promise<EmployeePayroll[]> {
    return this.request<EmployeePayroll[]>(`/api/payroll?month=${month}`);
  },

  // Excel Import
  async confirmExcelImport(payload: {
    staff: Partial<Staff>[];
    attendance: Partial<AttendanceRecord>[];
  }): Promise<{ success: boolean; staffImported: number; attendanceImported: number }> {
    return this.request<{ success: boolean; staffImported: number; attendanceImported: number }>(
      '/api/excel/import-confirm',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  // Demo Seed
  async seedDemoData(): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/api/demo/seed', {
      method: 'POST',
    });
  },
};
