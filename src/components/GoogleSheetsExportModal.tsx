import React, { useState, useEffect } from 'react';
import { exportToGoogleSheets } from '../services/sheets.js';
import { initAuth, googleSignIn } from '../services/auth.js';
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';

interface GoogleSheetsExportModalProps {
  data: {
    title: string;
    headers: string[];
    rows: (string | number)[][];
  } | null;
  onClose: () => void;
}

export const GoogleSheetsExportModal: React.FC<GoogleSheetsExportModalProps> = ({
  data,
  onClose,
}) => {
  const { t, lang } = useLanguage();
  const [hasToken, setHasToken] = useState(false);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setHasToken(Boolean(token));
      },
      () => {
        setGoogleUser(null);
        setHasToken(false);
      }
    );
    return () => unsubscribe();
  }, []);

  if (!data) return null;

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setHasToken(true);
      }
    } catch (err: any) {
      setError(err.message || 'Google Authentication failed. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleConfirmExport = async () => {
    setIsExporting(true);
    setError(null);
    try {
      const res = await exportToGoogleSheets({
        title: data.title,
        sheetName: 'PCS-NISSIN Calibration',
        headers: data.headers,
        rows: data.rows,
      });
      setResultUrl(res.spreadsheetUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to export to Google Sheets.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="liquid-glass-panel border border-white/20 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-950/60 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400">
            <FileSpreadsheet className="w-5 h-5" />
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Export to Google Sheets</span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl liquid-glass-button transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {resultUrl ? (
            <div className="p-5 bg-emerald-500/10 border border-emerald-400/40 rounded-2xl text-center space-y-3 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {lang === 'th' ? 'สร้าง Google Spreadsheet สำเร็จแล้ว!' : 'Spreadsheet Created Successfully!'}
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  {lang === 'th'
                    ? `ส่งออกข้อมูลสำเร็จจำนวน ${data.rows.length} แถว ไปยัง Google Drive พร้อมจัดแต่งคอลัมน์อัตโนมัติ`
                    : `Exported ${data.rows.length} records to your Google Drive with formatted headers and auto-column widths.`}
                </p>
              </div>
              <div className="pt-2">
                <a
                  href={resultUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950 transition hover:brightness-110"
                >
                  <span>{lang === 'th' ? 'เปิดดูใน Google Sheets' : 'Open in Google Sheets'}</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ) : !hasToken ? (
            /* Google Sign-in Prompt */
            <div className="space-y-4 text-center py-2">
              <div className="p-4 liquid-glass-card rounded-2xl text-xs text-slate-300 space-y-2">
                <div className="font-semibold text-white">
                  {lang === 'th' ? 'ต้องทำการยืนยันตัวตน Google Workspace ก่อน' : 'Google Workspace Authorization Required'}
                </div>
                <p className="text-slate-400">
                  {lang === 'th'
                    ? 'เพื่อสร้างสเปรดชีตใหม่ใน Google Drive ของคุณ กรุณาเข้าสู่ระบบ Google เพื่ออนุญาตสิทธิ์'
                    : 'To create and populate a new spreadsheet in your Google account, please sign in with Google to grant permission.'}
                </p>
              </div>

              {/* Official Google button style */}
              <button
                type="button"
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="w-full inline-flex items-center justify-center gap-3 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs rounded-xl shadow-lg transition disabled:opacity-50 cursor-pointer"
              >
                {isSigningIn ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                )}
                <span>Sign in with Google</span>
              </button>
            </div>
          ) : (
            /* Explicit confirmation dialog */
            <div className="space-y-4">
              <div className="p-3 bg-emerald-500/15 border border-emerald-400/40 rounded-xl text-xs flex items-center justify-between text-emerald-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Connected as: {googleUser?.email || 'Google User'}
                </span>
              </div>

              <div className="p-4 liquid-glass-card rounded-2xl space-y-2 text-xs">
                <div className="font-bold text-white text-sm">
                  {lang === 'th' ? 'ยืนยันการส่งออกข้อมูล' : 'Confirm Export Operation'}
                </div>
                <p className="text-slate-300">
                  {lang === 'th' ? 'การดำเนินการนี้จะสร้าง Google Spreadsheet ใหม่ชื่อ:' : 'This action will create a new Google Spreadsheet titled:'}
                </p>
                <div className="p-2 liquid-glass-switcher rounded-xl font-mono text-teal-300 text-[11px]">
                  PCS-NISSIN - {data.title} ({new Date().toISOString().slice(0, 10)})
                </div>
                <div className="text-slate-400 text-[11px] pt-1">
                  • {lang === 'th' ? 'จำนวนข้อมูลที่จะส่งออก:' : 'Total items to export:'} <strong>{data.rows.length} rows</strong>
                  <br />
                  • {lang === 'th' ? 'แท็บข้อมูล:' : 'Target sheet tab:'} <strong>PCS-NISSIN Calibration</strong>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 liquid-glass-button text-slate-300 rounded-xl text-xs font-medium transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmExport}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950 transition disabled:opacity-50"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{lang === 'th' ? 'กำลังสร้าง Spreadsheet...' : 'Creating Spreadsheet...'}</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>{lang === 'th' ? 'ยืนยันและสร้าง Spreadsheet' : 'Confirm & Create Spreadsheet'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {resultUrl && (
          <div className="p-3 bg-slate-950/60 border-t border-white/10 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-1.5 liquid-glass-button text-slate-300 rounded-xl text-xs"
            >
              {t('close')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
