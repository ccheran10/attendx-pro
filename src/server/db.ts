import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import {
  Staff,
  AttendanceRecord,
  LeaveRecord,
  HolidayRecord,
  WorkspaceSettings,
  UserProfile,
  AttendanceStatus,
} from '../types/attendance';

interface UserEntity {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
}

interface SessionEntity {
  token: string;
  userId: string;
  expiresAt: number;
}

interface DatabaseSchema {
  users: UserEntity[];
  sessions: SessionEntity[];
  settings: WorkspaceSettings[];
  staff: Staff[];
  attendance: AttendanceRecord[];
  leaves: LeaveRecord[];
  holidays: HolidayRecord[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

class Database {
  private data: DatabaseSchema = {
    users: [],
    sessions: [],
    settings: [],
    staff: [],
    attendance: [],
    leaves: [],
    holidays: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.persist();
      }
    } catch (e) {
      console.error('Failed to initialize database:', e);
    }
  }

  private persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpPath = `${DB_PATH}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpPath, DB_PATH);
    } catch (e) {
      console.error('Database persist error:', e);
    }
  }

  // --- Auth & Users ---
  public async createUser(username: string, plainPass: string): Promise<UserProfile> {
    const cleanUser = username.trim().toLowerCase();
    if (this.data.users.some((u) => u.username.toLowerCase() === cleanUser)) {
      throw new Error('Username already taken. Please choose another username.');
    }
    const id = crypto.randomUUID();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(plainPass, salt);
    const createdAt = new Date().toISOString();

    const user: UserEntity = {
      id,
      username: username.trim(),
      passwordHash,
      createdAt,
    };
    this.data.users.push(user);

    // Initialize default workspace settings for this new user
    this.data.settings.push({
      userId: id,
      businessName: `${username.trim()}'s Business`,
      financialYear: '2026-2027',
      standardHours: 8,
      weeklyOffDay: 0, // Sunday
      salaryBase: 'CALENDAR_DAYS',
      overtimeMultiplier: 1.5,
      currencySymbol: '$',
    });

    // Initialize default paid public holidays for the year
    const defaultHolidays = [
      { name: "New Year's Day", date: '2026-01-01', isPaid: true },
      { name: 'Memorial / Spring Day', date: '2026-05-25', isPaid: true },
      { name: 'Independence Day', date: '2026-07-04', isPaid: true },
      { name: 'Labor Day', date: '2026-09-07', isPaid: true },
      { name: 'Autumn Holiday', date: '2026-10-12', isPaid: true },
      { name: 'Thanksgiving', date: '2026-11-26', isPaid: true },
      { name: 'Christmas Day', date: '2026-12-25', isPaid: true },
    ];
    defaultHolidays.forEach((h) => {
      this.data.holidays.push({
        id: crypto.randomUUID(),
        userId: id,
        date: h.date,
        name: h.name,
        isPaid: h.isPaid,
      });
    });

    this.persist();
    return { id, username: user.username, createdAt };
  }

  public async authenticate(username: string, plainPass: string): Promise<{ user: UserProfile; token: string }> {
    const cleanUser = username.trim().toLowerCase();
    const user = this.data.users.find((u) => u.username.toLowerCase() === cleanUser);
    if (!user) {
      throw new Error('Invalid username or password.');
    }
    const match = await bcrypt.compare(plainPass, user.passwordHash);
    if (!match) {
      throw new Error('Invalid username or password.');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
    this.data.sessions.push({ token, userId: user.id, expiresAt });
    this.persist();

    return {
      user: { id: user.id, username: user.username, createdAt: user.createdAt },
      token,
    };
  }

  public getUserByToken(token: string): UserProfile | null {
    const session = this.data.sessions.find((s) => s.token === token && s.expiresAt > Date.now());
    if (!session) return null;
    const user = this.data.users.find((u) => u.id === session.userId);
    if (!user) return null;
    return { id: user.id, username: user.username, createdAt: user.createdAt };
  }

  public logout(token: string): void {
    this.data.sessions = this.data.sessions.filter((s) => s.token !== token);
    this.persist();
  }

  public async changePassword(userId: string, oldPass: string, newPass: string): Promise<void> {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found.');
    const match = await bcrypt.compare(oldPass, user.passwordHash);
    if (!match) throw new Error('Current password does not match.');

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPass, salt);
    this.persist();
  }

  public deleteAccount(userId: string): void {
    this.data.users = this.data.users.filter((u) => u.id !== userId);
    this.data.sessions = this.data.sessions.filter((s) => s.userId !== userId);
    this.data.settings = this.data.settings.filter((s) => s.userId !== userId);
    this.data.staff = this.data.staff.filter((s) => s.userId !== userId);
    this.data.attendance = this.data.attendance.filter((s) => s.userId !== userId);
    this.data.leaves = this.data.leaves.filter((l) => l.userId !== userId);
    this.data.holidays = this.data.holidays.filter((h) => h.userId !== userId);
    this.persist();
  }

  // --- Settings ---
  public getSettings(userId: string): WorkspaceSettings {
    let settings = this.data.settings.find((s) => s.userId === userId);
    if (!settings) {
      settings = {
        userId,
        businessName: 'My Enterprise',
        financialYear: '2026-2027',
        standardHours: 8,
        weeklyOffDay: 0,
        salaryBase: 'CALENDAR_DAYS',
        overtimeMultiplier: 1.5,
        currencySymbol: '$',
      };
      this.data.settings.push(settings);
      this.persist();
    }
    return settings;
  }

  public updateSettings(userId: string, partial: Partial<WorkspaceSettings>): WorkspaceSettings {
    const current = this.getSettings(userId);
    Object.assign(current, partial, { userId });
    this.persist();
    return current;
  }

  // --- Staff Management ---
  public getStaff(userId: string): Staff[] {
    return this.data.staff.filter((s) => s.userId === userId);
  }

  public addStaff(userId: string, payload: Omit<Staff, 'id' | 'userId' | 'createdAt'>): Staff {
    // Prevent duplicate Employee ID within same user workspace
    const existing = this.data.staff.find(
      (s) => s.userId === userId && s.employeeId.toLowerCase() === payload.employeeId.trim().toLowerCase()
    );
    if (existing) {
      throw new Error(`Employee ID "${payload.employeeId}" is already used in your workspace.`);
    }

    const newStaff: Staff = {
      ...payload,
      id: crypto.randomUUID(),
      userId,
      createdAt: new Date().toISOString(),
    };
    this.data.staff.push(newStaff);
    this.persist();
    return newStaff;
  }

  public updateStaff(userId: string, staffId: string, partial: Partial<Staff>): Staff {
    const staff = this.data.staff.find((s) => s.id === staffId && s.userId === userId);
    if (!staff) throw new Error('Staff member not found.');

    if (partial.employeeId && partial.employeeId !== staff.employeeId) {
      const existing = this.data.staff.find(
        (s) => s.userId === userId && s.id !== staffId && s.employeeId.toLowerCase() === partial.employeeId?.trim().toLowerCase()
      );
      if (existing) throw new Error(`Employee ID "${partial.employeeId}" already exists.`);
    }

    Object.assign(staff, partial, { id: staffId, userId });
    this.persist();
    return staff;
  }

  public deleteStaff(userId: string, staffId: string): void {
    this.data.staff = this.data.staff.filter((s) => !(s.id === staffId && s.userId === userId));
    // Cascade delete attendance and leaves
    this.data.attendance = this.data.attendance.filter((a) => !(a.staffId === staffId && a.userId === userId));
    this.data.leaves = this.data.leaves.filter((l) => !(l.staffId === staffId && l.userId === userId));
    this.persist();
  }

  // --- Attendance ---
  public getAttendance(userId: string, monthPrefix?: string, date?: string): AttendanceRecord[] {
    return this.data.attendance.filter((a) => {
      if (a.userId !== userId) return false;
      if (date && a.date !== date) return false;
      if (monthPrefix && !a.date.startsWith(monthPrefix)) return false;
      return true;
    });
  }

  public upsertAttendance(userId: string, record: Omit<AttendanceRecord, 'id' | 'userId' | 'updatedAt'>): AttendanceRecord {
    const existingIdx = this.data.attendance.findIndex(
      (a) => a.userId === userId && a.staffId === record.staffId && a.date === record.date
    );

    const fullRecord: AttendanceRecord = {
      ...record,
      id: existingIdx >= 0 ? this.data.attendance[existingIdx].id : crypto.randomUUID(),
      userId,
      updatedAt: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      this.data.attendance[existingIdx] = fullRecord;
    } else {
      this.data.attendance.push(fullRecord);
    }

    this.persist();
    return fullRecord;
  }

  public batchUpsertAttendance(userId: string, records: Omit<AttendanceRecord, 'id' | 'userId' | 'updatedAt'>[]): AttendanceRecord[] {
    const results: AttendanceRecord[] = [];
    for (const rec of records) {
      const saved = this.upsertAttendance(userId, rec);
      results.push(saved);
    }
    return results;
  }

  public deleteAttendance(userId: string, attendanceId: string): void {
    this.data.attendance = this.data.attendance.filter((a) => !(a.id === attendanceId && a.userId === userId));
    this.persist();
  }

  // --- Leaves ---
  public getLeaves(userId: string): LeaveRecord[] {
    return this.data.leaves.filter((l) => l.userId === userId);
  }

  public addLeave(userId: string, payload: Omit<LeaveRecord, 'id' | 'userId' | 'createdAt'>): LeaveRecord {
    const newLeave: LeaveRecord = {
      ...payload,
      id: crypto.randomUUID(),
      userId,
      createdAt: new Date().toISOString(),
    };
    this.data.leaves.push(newLeave);
    this.persist();
    return newLeave;
  }

  public updateLeave(userId: string, leaveId: string, partial: Partial<LeaveRecord>): LeaveRecord {
    const leave = this.data.leaves.find((l) => l.id === leaveId && l.userId === userId);
    if (!leave) throw new Error('Leave record not found.');
    Object.assign(leave, partial, { id: leaveId, userId });
    this.persist();
    return leave;
  }

  public deleteLeave(userId: string, leaveId: string): void {
    this.data.leaves = this.data.leaves.filter((l) => !(l.id === leaveId && l.userId === userId));
    this.persist();
  }

  // --- Holidays ---
  public getHolidays(userId: string): HolidayRecord[] {
    return this.data.holidays.filter((h) => h.userId === userId);
  }

  public addHoliday(userId: string, payload: Omit<HolidayRecord, 'id' | 'userId'>): HolidayRecord {
    const newH: HolidayRecord = {
      ...payload,
      id: crypto.randomUUID(),
      userId,
    };
    this.data.holidays.push(newH);
    this.persist();
    return newH;
  }

  public deleteHoliday(userId: string, holidayId: string): void {
    this.data.holidays = this.data.holidays.filter((h) => !(h.id === holidayId && h.userId === userId));
    this.persist();
  }

  // --- Seeder for Quick Demo / Sample Testing ---
  public seedDemoData(userId: string): { staffCount: number; attendanceCount: number } {
    // Remove current user's staff/attendance first
    this.data.staff = this.data.staff.filter((s) => s.userId !== userId);
    this.data.attendance = this.data.attendance.filter((a) => a.userId !== userId);

    const demoStaffList = [
      { employeeId: 'EMP-101', name: 'Marcus Sterling', department: 'Executive', designation: 'Operations Manager', phone: '+1 555-0191', baseSalary: 6200, standardHours: 8 },
      { employeeId: 'EMP-102', name: 'Alicia Gutierrez', department: 'Engineering', designation: 'Lead Systems Architect', phone: '+1 555-0192', baseSalary: 5800, standardHours: 8 },
      { employeeId: 'EMP-103', name: 'Devon Patel', department: 'Engineering', designation: 'Full Stack Engineer', phone: '+1 555-0193', baseSalary: 4500, standardHours: 8 },
      { employeeId: 'EMP-104', name: 'Sarah Jenkins', department: 'Design', designation: 'Product Designer', phone: '+1 555-0194', baseSalary: 4200, standardHours: 8 },
      { employeeId: 'EMP-105', name: 'Liam O’Connor', department: 'Logistics', designation: 'Supply Coordinator', phone: '+1 555-0195', baseSalary: 3600, standardHours: 8 },
      { employeeId: 'EMP-106', name: 'Zoe Nakamura', department: 'Human Resources', designation: 'Talent Specialist', phone: '+1 555-0196', baseSalary: 3900, standardHours: 8 },
    ];

    const createdStaff: Staff[] = [];
    demoStaffList.forEach((item) => {
      const staffRecord: Staff = {
        ...item,
        id: crypto.randomUUID(),
        userId,
        status: 'ACTIVE',
        joinDate: '2024-03-01',
        overtimeRate: 0,
        createdAt: new Date().toISOString(),
      };
      this.data.staff.push(staffRecord);
      createdStaff.push(staffRecord);
    });

    // Seed October 2026 month attendance for testing
    let count = 0;
    const year = 2026;
    const month = 10;
    const daysInMonth = 31;

    for (const staff of createdStaff) {
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `2026-10-${String(day).padStart(2, '0')}`;
        const dateObj = new Date(year, month - 1, day);
        const dayOfWeek = dateObj.getDay();

        let status: AttendanceStatus = 'PRESENT';
        let checkIn = '09:00';
        let checkOut = '17:30';
        let breakMin = 60;
        let netHours = 7.5;
        let otHours = 0;

        if (dayOfWeek === 0) {
          status = 'WEEKLY_OFF';
          checkIn = '';
          checkOut = '';
          breakMin = 0;
          netHours = 0;
        } else if (day === 12) {
          status = 'HOLIDAY';
          checkIn = '';
          checkOut = '';
          breakMin = 0;
          netHours = 0;
        } else if (staff.employeeId === 'EMP-103' && day === 15) {
          status = 'HALF_DAY';
          checkIn = '09:00';
          checkOut = '13:00';
          breakMin = 0;
          netHours = 4.0;
        } else if (staff.employeeId === 'EMP-105' && (day === 20 || day === 21)) {
          status = 'ABSENT';
          checkIn = '';
          checkOut = '';
          breakMin = 0;
          netHours = 0;
        } else if (staff.employeeId === 'EMP-102' && day % 4 === 0) {
          checkOut = '19:30';
          netHours = 9.5;
          otHours = 1.5;
        }

        this.data.attendance.push({
          id: crypto.randomUUID(),
          userId,
          staffId: staff.id,
          date: dateStr,
          checkIn: checkIn || undefined,
          checkOut: checkOut || undefined,
          breakMinutes: breakMin,
          grossHours: netHours + (breakMin / 60),
          netHours,
          status,
          overtimeHours: otHours,
          remarks: otHours > 0 ? 'Approved OT sprint' : undefined,
          updatedAt: new Date().toISOString(),
        });
        count++;
      }
    }

    this.persist();
    return { staffCount: createdStaff.length, attendanceCount: count };
  }
}

export const db = new Database();
