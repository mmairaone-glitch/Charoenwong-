import React from 'react';
import { AlertTriangle, Trash2, X, AlertCircle, Info, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  detailMessage?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isSubmitting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  // Optional checkbox or option
  checkboxLabel?: string;
  checkboxChecked?: boolean;
  onCheckboxChange?: (checked: boolean) => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  detailMessage,
  confirmText,
  cancelText,
  variant = 'danger',
  isSubmitting = false,
  onConfirm,
  onCancel,
  checkboxLabel,
  checkboxChecked = false,
  onCheckboxChange,
}) => {
  const { lang } = useLanguage();

  if (!isOpen) return null;

  const defaultConfirmText =
    confirmText ||
    (variant === 'danger'
      ? (lang === 'th' ? 'ยืนยันการลบ' : 'Confirm Delete')
      : (lang === 'th' ? 'ยืนยัน' : 'Confirm'));

  const defaultCancelText = cancelText || (lang === 'th' ? 'ยกเลิก' : 'Cancel');

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-[9999] overflow-y-auto animate-in fade-in duration-200">
      <div className="liquid-glass-panel border border-white/20 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-950/40 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-md ${
                variant === 'danger'
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-rose-500/20'
                  : variant === 'warning'
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-amber-500/20'
                  : 'bg-teal-500/20 border-teal-400/40 text-teal-300 shadow-teal-500/20'
              }`}
            >
              {variant === 'danger' ? (
                <Trash2 className="w-4 h-4" />
              ) : variant === 'warning' ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <Info className="w-4 h-4" />
              )}
            </div>
            <h3 className="font-bold text-white text-sm">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl liquid-glass-button transition disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-3">
          <p className="text-sm text-slate-200 leading-relaxed">{message}</p>
          {detailMessage && (
            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 text-xs text-slate-300 space-y-1">
              {detailMessage}
            </div>
          )}

          {checkboxLabel && onCheckboxChange && (
            <label className="flex items-center gap-2.5 pt-2 cursor-pointer select-none text-xs text-slate-300">
              <input
                type="checkbox"
                checked={checkboxChecked}
                onChange={(e) => onCheckboxChange(e.target.checked)}
                className="w-4 h-4 rounded text-teal-500 focus:ring-teal-400 bg-slate-800 border-white/20 cursor-pointer"
              />
              <span>{checkboxLabel}</span>
            </label>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-950/40 border-t border-white/10 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold liquid-glass-button text-slate-300 hover:text-white transition disabled:opacity-50"
          >
            {defaultCancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-lg disabled:opacity-50 ${
              variant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                : variant === 'warning'
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                : 'liquid-glass-primary'
            }`}
          >
            {isSubmitting && (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>{defaultConfirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
