import React from 'react';
import { ShieldAlert, AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'info',
  isLoading = false
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  const bgClasses = {
    danger: 'bg-rose-50 text-rose-600',
    warning: 'bg-amber-50 text-amber-600',
    info: 'bg-indigo-50 text-indigo-600'
  }[variant];

  const btnClasses = {
    danger: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500',
    warning: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
    info: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
  }[variant];

  const Icon = variant === 'danger' ? ShieldAlert : variant === 'warning' ? AlertTriangle : AlertTriangle;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 transform transition-all animate-in fade-in-50 zoom-in-95 duration-150">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl shrink-0 ${bgClasses}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-950 font-sans tracking-tight">{title}</h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed font-sans">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 font-sans">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-xs font-black text-white rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50 ${btnClasses}`}
          >
            {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
