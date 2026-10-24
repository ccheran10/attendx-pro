import React, { useState } from 'react';
import {
  Staff,
  AttendanceRecord,
  HolidayRecord,
  LeaveRecord,
  WorkspaceSettings,
} from '../types/attendance';
import { api } from '../services/api';
import {
  parseExcelWorkbook,
  ImportPreviewResult,
  downloadAttendanceTemplate,
  exportMonthlyRegisterExcel,
} from '../utils/excelEngine';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

interface ExcelImportExportViewProps {
  staffList: Staff[];
  attendanceList: AttendanceRecord[];
  holidays: HolidayRecord[];
  leaves: LeaveRecord[];
  settings: WorkspaceSettings;
  currentMonth: string;
  onRefresh: () => void;
}

export const ExcelImportExportView: React.FC<ExcelImportExportViewProps> = ({
  staffList,
  attendanceList,
  holidays,
  leaves,
  settings,
  currentMonth,
  onRefresh,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setImportSuccess(null);
    setImportError(null);
    setParsing(true);

    try {
      const buffer = await selected.arrayBuffer();
      const result = parseExcelWorkbook(buffer, currentMonth);
      setPreview(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setPreview({
        sheetName: 'Error',
        detectedType: 'unknown',
        totalRows: 0,
        validStaff: [],
        validAttendance: [],
        errors: [`Could not parse file: ${msg}`],
        warnings: [],
      });
    } finally {
      setParsing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!preview) return;
    try {
      setImporting(true);
      setImportError(null);
      const res = await api.confirmExcelImport({
        staff: preview.validStaff,
        attendance: preview.validAttendance,
      });
      setImportSuccess(
        `Successfully imported ${res.staffImported} staff profile(s) and ${res.attendanceImported} attendance record(s) into your workspace!`
      );
      setPreview(null);
      setFile(null);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setImportError(`Import failed: ${msg}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-2xs">
        <h1 className="text-base font-bold text-slate-900 dark:text-white">
          Excel Workbook Synchronization & Migration
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Seamlessly import your existing staff attendance spreadsheet or export your live cloud registers back to Excel (.xlsx) at any time.
        </p>
      </div>

      {importSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2.5 shadow-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="font-semibold">{importSuccess}</span>
        </div>
      )}

      {importError && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs flex items-center gap-2.5 shadow-xs">
          <XCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span className="font-semibold">{importError}</span>
        </div>
      )}

      {/* 2-Column: Upload Card vs Export Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Import Excel Workbook */}
        <div className="p-6 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Import Existing Excel Workbook
              </h2>
              <p className="text-xs text-slate-500">
                Supports .xlsx, .xls, and .csv formats
              </p>
            </div>
          </div>

          <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-400 rounded-xl p-6 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-800/30 relative">
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <FileSpreadsheet className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {file ? file.name : 'Choose an Excel file or drag & drop'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Monthly Register, Daily Shift Logs, or Staff Master sheets'}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400">
              Need a standard template?
            </span>
            <button
              onClick={downloadAttendanceTemplate}
              className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Starter Template</span>
            </button>
          </div>
        </div>

        {/* Card 2: Export Live Registers */}
        <div className="p-6 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Export Formatted Excel Workbooks
              </h2>
              <p className="text-xs text-slate-500">
                Full 31-day register, payroll summary & master sheets
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Monthly 31-Day Attendance Matrix
                </div>
                <div className="text-[11px] text-slate-400">
                  Includes Day 1..31 cell codes, totals, and formulas
                </div>
              </div>
              <button
                onClick={() =>
                  exportMonthlyRegisterExcel(
                    currentMonth,
                    staffList.filter((s) => s.status === 'ACTIVE'),
                    attendanceList,
                    holidays,
                    leaves,
                    settings
                  )
                }
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
              >
                Export .xlsx
              </button>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Monthly Payroll & Salary Slips
                </div>
                <div className="text-[11px] text-slate-400">
                  Itemized basic, daily rate, absences, overtime & net pay
                </div>
              </div>
              <button
                onClick={() =>
                  exportMonthlyRegisterExcel(
                    currentMonth,
                    staffList.filter((s) => s.status === 'ACTIVE'),
                    attendanceList,
                    holidays,
                    leaves,
                    settings
                  )
                }
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
              >
                Export .xlsx
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 pt-1">
            Data is strictly isolated to your registered account and exported directly in memory.
          </p>
        </div>
      </div>

      {/* Validation & Preview Drawer */}
      {parsing && (
        <div className="p-8 text-center bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Analyzing worksheet columns and attendance records...
          </p>
        </div>
      )}

      {preview && !parsing && (
        <div className="p-6 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-indigo-600" />
                <span>Workbook Preview: Sheet "{preview.sheetName}"</span>
              </h2>
              <p className="text-xs text-slate-500">
                Structure Type: <strong className="uppercase text-indigo-600">{preview.detectedType.replace('_', ' ')}</strong> · {preview.totalRows} row(s) found
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreview(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={importing || (preview.validStaff.length === 0 && preview.validAttendance.length === 0)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {importing ? (
                  <span>Importing...</span>
                ) : (
                  <>
                    <span>Confirm & Import ({preview.validStaff.length} Staff, {preview.validAttendance.length} Logs)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Warnings or Errors */}
          {preview.errors.length > 0 && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 space-y-1">
              {preview.errors.map((e, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{e}</span>
                </div>
              ))}
            </div>
          )}

          {preview.warnings.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
              {preview.warnings.map((w, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          {/* Sample rows preview */}
          {preview.validStaff.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Sample Detected Staff Members ({preview.validStaff.length} total):
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {preview.validStaff.slice(0, 6).map((s, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700">
                    <div className="font-bold text-slate-900 dark:text-white truncate">{s.name}</div>
                    <div className="text-[11px] font-mono text-slate-500">{s.employeeId} · {s.department || 'Operations'}</div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400">Basic: {settings.currencySymbol}{s.baseSalary}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
