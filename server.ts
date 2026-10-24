import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { db } from './src/server/db.ts';
import { calculateEmployeePayroll } from './src/utils/payrollCalculator.ts';
import { Staff } from './src/types/attendance.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Auth Middleware: Extracts token from Authorization header 'Bearer <token>'
export interface AuthenticatedRequest extends Request {
  userId?: string;
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  const token = authHeader.substring(7);
  const user = db.getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }
  req.userId = user.id;
  next();
}

// ----------------- Auth Routes -----------------
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    const user = await db.createUser(username, password);
    const authResult = await db.authenticate(username, password);
    return res.status(201).json(authResult);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: message });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }
    const result = await db.authenticate(username, password);
    return res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(401).json({ error: message });
  }
});

app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const token = req.headers.authorization?.substring(7) || '';
  const user = db.getUserByToken(token);
  if (!user) return res.status(401).json({ error: 'Invalid session' });
  const settings = db.getSettings(req.userId!);
  return res.json({ user, settings });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    db.logout(authHeader.substring(7));
  }
  return res.json({ message: 'Logged out successfully' });
});

app.post('/api/auth/change-password', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }
    await db.changePassword(req.userId!, oldPassword, newPassword);
    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: message });
  }
});

app.delete('/api/auth/account', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  db.deleteAccount(req.userId!);
  return res.json({ success: true, message: 'Account and all workspace data deleted.' });
});

// ----------------- Settings Routes -----------------
app.get('/api/settings', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const settings = db.getSettings(req.userId!);
  return res.json(settings);
});

app.put('/api/settings', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = db.updateSettings(req.userId!, req.body);
    return res.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: message });
  }
});

// ----------------- Staff Routes -----------------
app.get('/api/staff', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const staff = db.getStaff(req.userId!);
  return res.json(staff);
});

app.post('/api/staff', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { employeeId, name, designation, department, baseSalary, standardHours, phone, email, joinDate, overtimeRate } = req.body;
    if (!employeeId || !name) {
      return res.status(400).json({ error: 'Employee ID and Full Name are required.' });
    }
    const newStaff = db.addStaff(req.userId!, {
      employeeId: employeeId.trim(),
      name: name.trim(),
      designation: designation?.trim() || 'Staff',
      department: department?.trim() || 'General',
      baseSalary: Number(baseSalary) || 0,
      standardHours: Number(standardHours) || 8,
      phone: phone?.trim(),
      email: email?.trim(),
      joinDate: joinDate || new Date().toISOString().split('T')[0],
      overtimeRate: Number(overtimeRate) || 0,
      status: 'ACTIVE',
    });
    return res.status(201).json(newStaff);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: message });
  }
});

app.put('/api/staff/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = db.updateStaff(req.userId!, req.params.id, req.body);
    return res.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: message });
  }
});

app.delete('/api/staff/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    db.deleteStaff(req.userId!, req.params.id);
    return res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: message });
  }
});

// ----------------- Attendance Routes -----------------
app.get('/api/attendance', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const month = req.query.month as string | undefined;
  const date = req.query.date as string | undefined;
  const list = db.getAttendance(req.userId!, month, date);
  return res.json(list);
});

app.post('/api/attendance', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { staffId, date, checkIn, checkOut, breakMinutes, status, remarks } = req.body;
    if (!staffId || !date || !status) {
      return res.status(400).json({ error: 'staffId, date, and status are required.' });
    }

    let netHours = status === 'PRESENT' ? 8 : status === 'HALF_DAY' ? 4 : 0;
    let grossHours = netHours;
    let otHours = 0;
    const breakMin = Number(breakMinutes) || 0;

    if (checkIn && checkOut) {
      const [inH, inM] = checkIn.split(':').map(Number);
      const [outH, outM] = checkOut.split(':').map(Number);
      if (!isNaN(inH) && !isNaN(outH)) {
        let diffMins = (outH * 60 + (outM || 0)) - (inH * 60 + (inM || 0)) - breakMin;
        if (diffMins < 0) diffMins += 24 * 60; // overnight support
        netHours = Math.max(0, Math.round((diffMins / 60) * 10) / 10);
        grossHours = Math.max(0, Math.round(((diffMins + breakMin) / 60) * 10) / 10);
        otHours = Math.max(0, Math.round((netHours - 8) * 10) / 10);
      }
    }

    const saved = db.upsertAttendance(req.userId!, {
      staffId,
      date,
      checkIn: checkIn || undefined,
      checkOut: checkOut || undefined,
      breakMinutes: breakMin,
      grossHours,
      netHours,
      status,
      overtimeHours: otHours,
      remarks: remarks?.trim() || undefined,
    });
    return res.json(saved);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: message });
  }
});

app.post('/api/attendance/batch', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { records } = req.body;
    if (!Array.isArray(records)) {
      return res.status(400).json({ error: 'records array is required.' });
    }
    const saved = db.batchUpsertAttendance(req.userId!, records);
    return res.json({ count: saved.length, records: saved });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: message });
  }
});

// ----------------- Leaves Routes -----------------
app.get('/api/leaves', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  return res.json(db.getLeaves(req.userId!));
});

app.post('/api/leaves', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { staffId, startDate, endDate, leaveType, reason, isPaid, status } = req.body;
    if (!staffId || !startDate || !endDate) {
      return res.status(400).json({ error: 'staffId, startDate, and endDate are required.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const newLeave = db.addLeave(req.userId!, {
      staffId,
      startDate,
      endDate,
      daysCount,
      leaveType: leaveType || 'CASUAL',
      reason: reason || '',
      status: status || 'APPROVED',
      isPaid: isPaid ?? true,
    });

    return res.status(201).json(newLeave);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: message });
  }
});

app.put('/api/leaves/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = db.updateLeave(req.userId!, req.params.id, req.body);
    return res.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: message });
  }
});

app.delete('/api/leaves/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    db.deleteLeave(req.userId!, req.params.id);
    return res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: message });
  }
});

// ----------------- Holidays Routes -----------------
app.get('/api/holidays', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  return res.json(db.getHolidays(req.userId!));
});

app.post('/api/holidays', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { date, name, isPaid } = req.body;
    if (!date || !name) {
      return res.status(400).json({ error: 'Holiday date and name are required.' });
    }
    const hol = db.addHoliday(req.userId!, {
      date,
      name,
      isPaid: isPaid ?? true,
    });
    return res.status(201).json(hol);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: message });
  }
});

app.delete('/api/holidays/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    db.deleteHoliday(req.userId!, req.params.id);
    return res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: message });
  }
});

// ----------------- Payroll Calculation Route -----------------
app.get('/api/payroll', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const month = (req.query.month as string) || new Date().toISOString().substring(0, 7);
  const staffList = db.getStaff(req.userId!).filter((s) => s.status === 'ACTIVE');
  const attendanceList = db.getAttendance(req.userId!, month);
  const holidays = db.getHolidays(req.userId!);
  const leaves = db.getLeaves(req.userId!);
  const settings = db.getSettings(req.userId!);

  const payrolls = staffList.map((st) =>
    calculateEmployeePayroll(st, month, attendanceList, holidays, leaves, settings)
  );
  return res.json(payrolls);
});

// ----------------- Excel Import Confirmation -----------------
app.post('/api/excel/import-confirm', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { staff, attendance } = req.body;
    let staffImported = 0;
    let attendanceImported = 0;

    const existingStaff = db.getStaff(req.userId!);
    const staffMap = new Map<string, Staff>();
    existingStaff.forEach((s) => staffMap.set(s.employeeId.toLowerCase(), s));

    // Import or update staff
    if (Array.isArray(staff)) {
      for (const s of staff) {
        if (!s.employeeId || !s.name) continue;
        const key = s.employeeId.trim().toLowerCase();
        let targetStaff = staffMap.get(key);
        if (!targetStaff) {
          targetStaff = db.addStaff(req.userId!, {
            employeeId: s.employeeId.trim(),
            name: s.name.trim(),
            department: s.department || 'Operations',
            designation: s.designation || 'Staff',
            baseSalary: Number(s.baseSalary) || 3500,
            standardHours: Number(s.standardHours) || 8,
            phone: s.phone,
            email: s.email,
            joinDate: s.joinDate || '2025-01-01',
            overtimeRate: Number(s.overtimeRate) || 0,
            status: 'ACTIVE',
          });
          staffMap.set(key, targetStaff);
        }
        staffImported++;
      }
    }

    // Import attendance
    if (Array.isArray(attendance)) {
      for (const att of attendance) {
        let staffId = att.staffId;
        if (!staffId && att.employeeId) {
          const matched = staffMap.get(String(att.employeeId).trim().toLowerCase());
          if (matched) staffId = matched.id;
        }
        if (!staffId) {
          // If no staff matched, take first staff or skip
          const first = Array.from(staffMap.values())[0];
          if (first) staffId = first.id;
        }

        if (staffId && att.date) {
          db.upsertAttendance(req.userId!, {
            staffId,
            date: att.date,
            checkIn: att.checkIn,
            checkOut: att.checkOut,
            breakMinutes: Number(att.breakMinutes) || 0,
            grossHours: Number(att.grossHours) || (att.status === 'PRESENT' ? 8 : att.status === 'HALF_DAY' ? 4 : 0),
            netHours: Number(att.netHours) || (att.status === 'PRESENT' ? 8 : att.status === 'HALF_DAY' ? 4 : 0),
            overtimeHours: Number(att.overtimeHours) || 0,
            status: att.status || 'PRESENT',
            remarks: att.remarks,
          });
          attendanceImported++;
        }
      }
    }

    return res.json({
      success: true,
      staffImported,
      attendanceImported,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: message });
  }
});

// ----------------- Demo Data Seeder -----------------
app.post('/api/demo/seed', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const resSeed = db.seedDemoData(req.userId!);
    return res.json({
      success: true,
      message: `Successfully seeded ${resSeed.staffCount} staff members and ${resSeed.attendanceCount} attendance records for demonstration.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: message });
  }
});

// ----------------- Vite Integration & Startup -----------------
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AttendX Pro Server running on port ${PORT}`);
  });
}

startServer();
