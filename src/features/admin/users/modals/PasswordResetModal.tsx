import React, { useState } from 'react';
import { X, Key, ShieldAlert, Copy, Check, Eye, EyeOff, Loader2 } from 'lucide-react';
import { AdminUser } from '../types';
import { generateRandomPassword } from '../utils';

interface PasswordResetModalProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onReset: (userId: string, pass: string) => Promise<void>;
}

export default function PasswordResetModal({
  user,
  isOpen,
  onClose,
  onReset
}: PasswordResetModalProps) {
  const [password, setPassword] = useState('');
  const [isGenerated, setIsGenerated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen || !user) return null;

  const handleGenerate = () => {
    const pw = generateRandomPassword();
    setPassword(pw);
    setIsGenerated(true);
    setShowPassword(true);
    setCopied(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters in length');
      return;
    }

    setSubmitting(true);
    try {
      await onReset(user.id, password);
      setSuccessMsg('User credential updated successfully.');
      setPassword('');
      setIsGenerated(false);
    } catch (e: any) {
      setErrorMsg(e.message || 'Verification failed. Password reset returned an error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 transform transition-all animate-in fade-in-50 zoom-in-95 duration-150 relative">
        <button 
          type="button" 
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition cursor-pointer"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
          <span className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <Key className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-extrabold text-slate-950 tracking-tight">Credentials Override</h3>
            <p className="text-xs text-slate-500 mt-0.5">Override account password for {user.email}</p>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-700 mb-4 flex items-start gap-2 animate-shake">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg ? (
          <div className="space-y-4 py-2">
            <div className="bg-emerald-50 border border-emerald-150 rounded-xl p-3.5 text-xs text-emerald-800 flex items-start gap-2">
              <Check className="h-4.5 w-4.5 shrink-0 mt-0.5 text-emerald-600" />
              <div>
                <p className="font-extrabold">Credential Rewrite Complete</p>
                <p className="mt-1 leading-normal font-medium">The user account password has been overridden safely on the bcrypt secure block.</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-black tracking-wide transition cursor-pointer shadow-md"
            >
              Done & Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Password Selector</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setIsGenerated(false);
                  }}
                  placeholder="Enter custom secure password"
                  className="w-full text-xs font-semibold px-4 py-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl outline-hidden select-all transition duration-150 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGenerate}
                className="flex-1 py-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-100 rounded-xl transition cursor-pointer"
              >
                Generate strong Code
              </button>
              {password && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-950 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0"
                  title="Copy password to clipboard"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>

            {isGenerated && (
              <p className="text-[10.5px] italic text-slate-400 leading-snug">
                Remember to copy and share the generated token securely with the user, as StayEase does not store credentials in plaintext.
              </p>
            )}

            <div className="pt-2 border-t border-slate-150 flex items-center justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !password}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black tracking-wide shadow-lg cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
                Override password
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
