import React, { useState, useEffect } from 'react';
import { X, Edit3, ShieldAlert, Loader2, Info } from 'lucide-react';
import { UserRole } from '../../../../types';
import { AdminUser } from '../types';
import { validateUserEdit, UserFormErrors } from '../validation';
import { useAuth } from '../../../../shared/context/AuthContext';

interface UserEditModalProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (userId: string, data: any) => Promise<void>;
}

export default function UserEditModal({
  user,
  isOpen,
  onClose,
  onEdit
}: UserEditModalProps) {
  const { user: currentUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.USER);
  const [isVerified, setIsVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<UserFormErrors>({});
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
      setIsVerified(user.isVerified);
      setErrors({});
      setGeneralError('');
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const isSelf = currentUser?.id === user.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');

    const formErrors = validateUserEdit({ name, email, role });
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setSubmitting(true);
    try {
      await onEdit(user.id, { name, email, role, isVerified });
      onClose();
    } catch (err: any) {
      setGeneralError(err.message || 'Failure updating user details. Check fields.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1900] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 transform transition-all animate-in fade-in-50 zoom-in-95 duration-150 relative">
        <button 
          type="button" 
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition cursor-pointer"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
          <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Edit3 className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-extrabold text-slate-950 tracking-tight">Edit Identity Records</h3>
            <p className="text-xs text-slate-500 mt-0.5">Modify profile variables for {user.email}</p>
          </div>
        </div>

        {isSelf && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800 mb-4 flex items-start gap-2">
            <Info className="h-4.5 w-4.5 shrink-0 mt-0.5 text-amber-600" />
            <span>
              <strong>You are editing your own card:</strong> Anti-lockout guards have locked your role to <strong>ADMIN</strong> to protect directory access.
            </span>
          </div>
        )}

        {generalError && (
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-700 mb-4 flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{generalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              className={`w-full text-xs font-semibold px-4 py-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border focus:border-indigo-500 rounded-xl outline-hidden transition ${
                errors.name ? 'border-rose-300 bg-rose-50/10' : 'border-slate-200'
              }`}
            />
            {errors.name && <p className="text-[10px] font-bold text-rose-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className={`w-full text-xs font-semibold px-4 py-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border focus:border-indigo-500 rounded-xl outline-hidden transition ${
                errors.email ? 'border-rose-300 bg-rose-50/10' : 'border-slate-200'
              }`}
            />
            {errors.email && <p className="text-[10px] font-bold text-rose-500 mt-1">{errors.email}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Access Role</label>
              <select
                value={role}
                disabled={isSelf}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full text-xs font-semibold px-3 py-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl outline-hidden cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value={UserRole.USER}>Standard User (USER)</option>
                <option value={UserRole.TENANT}>Business Host (TENANT)</option>
                <option value={UserRole.ADMIN}>Administrator (ADMIN)</option>
              </select>
            </div>

            <div className="flex flex-col justify-end pb-1.5">
              <label className="flex items-center gap-2 px-3 py-3 bg-slate-50/50 border border-slate-150 rounded-xl cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isVerified}
                  onChange={(e) => setIsVerified(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-slate-300 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-600">Verified Account</span>
              </label>
            </div>
          </div>

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
              disabled={submitting}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black tracking-wide shadow-lg cursor-pointer transition disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
              Save Updates
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
