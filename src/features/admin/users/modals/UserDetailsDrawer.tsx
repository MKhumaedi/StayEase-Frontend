import React from 'react';
import { X, Calendar, Shield, Activity, User as UserIcon, Mail, ShieldCheck, Database, History, RefreshCw } from 'lucide-react';
import { AdminUser, AuditLog } from '../types';
import { formatDate, getInitials } from '../utils';

interface UserDetailsDrawerProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  auditLogs: AuditLog[];
}

export default function UserDetailsDrawer({
  user,
  isOpen,
  onClose,
  auditLogs
}: UserDetailsDrawerProps) {
  if (!isOpen || !user) return null;

  // Filter logs for this specific user
  const userLogs = auditLogs.filter(log => 
    log.userId === user.id || 
    log.details.includes(user.email) || 
    log.details.includes(user.id)
  );

  return (
    <div className="fixed inset-0 z-[1900] flex justify-end bg-slate-900/60 backdrop-blur-xs font-sans">
      {/* Overlay click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Body */}
      <div className="relative bg-white w-full max-w-lg h-full shadow-2xl flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Enterprise User Ledger</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Identity Header */}
          <div className="flex items-center gap-4 bg-slate-50/50 p-4 border border-slate-100 rounded-2xl">
            {user.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                className="h-14 w-14 rounded-full object-cover border-2 border-indigo-100 shadow-xs"
                alt={user.name}
              />
            ) : (
              <span className="h-14 w-14 rounded-full bg-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                {getInitials(user.name)}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="text-base font-extrabold text-slate-950 truncate leading-snug">{user.name}</h4>
              <p className="text-xs text-slate-500 truncate mt-0.5">{user.email}</p>
              
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-md">
                  {user.role}
                </span>
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                  user.deletedAt 
                    ? 'bg-rose-50 text-rose-600 border-rose-100' 
                    : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                }`}>
                  {user.deletedAt ? 'Suspended' : 'Active'}
                </span>
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                  user.isVerified 
                    ? 'bg-blue-50 text-blue-600 border-blue-105' 
                    : 'bg-amber-50 text-amber-600 border-amber-105'
                }`}>
                  {user.isVerified ? 'Verified' : 'Unverified'}
                </span>
              </div>
            </div>
          </div>

          {/* User Metadata Fields Grid */}
          <div className="space-y-3">
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Metadata Schema</h5>
            <div className="grid grid-cols-2 gap-3.5">
              <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/60">
                <span className="text-[9.5px] font-bold text-slate-400 block uppercase">User GUID</span>
                <span className="text-xs font-mono font-bold text-slate-600 block mt-1 select-all truncate">{user.id}</span>
              </div>
              <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/60">
                <span className="text-[9.5px] font-bold text-slate-400 block uppercase">Registration Date</span>
                <span className="text-xs font-semibold text-slate-700 block mt-1">{formatDate(user.createdAt)}</span>
              </div>
              <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/60">
                <span className="text-[9.5px] font-bold text-slate-400 block uppercase">Last Authorized active</span>
                <span className="text-xs font-semibold text-slate-700 block mt-1">{formatDate(user.lastLoginAt)}</span>
              </div>
              <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/60">
                <span className="text-[9.5px] font-bold text-slate-400 block uppercase">Suspension timestamp</span>
                <span className="text-xs font-semibold text-slate-700 block mt-1">{user.deletedAt ? formatDate(user.deletedAt) : 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Unified Timeline Activities */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Activity Audit Timeline</h5>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {userLogs.length} Activities
              </span>
            </div>

            {userLogs.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                <Activity className="h-6 w-6 text-slate-350 mx-auto text-slate-400 mb-2" />
                <p className="text-xs text-slate-500 font-medium">No audited actions on ledger for this user.</p>
              </div>
            ) : (
              <div className="relative pl-4 border-l border-slate-100 space-y-5">
                {userLogs.map((log) => (
                  <div key={log.id} className="relative group">
                    {/* Time anchor */}
                    <div className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-white shadow-xs group-hover:scale-110 transition duration-150" />
                    
                    <div>
                      <div className="flex items-center justify-between gap-2.5">
                        <span className="text-[10px] bg-slate-100 text-slate-750 font-black px-1.5 py-0.2 rounded font-sans uppercase">
                          {log.action}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-1.5 leading-relaxed">{log.details}</p>
                      <div className="flex items-center gap-1.5 mt-1 text-[9px] text-slate-450 text-slate-400 font-semibold font-mono">
                        <span>Agent ID: {log.userName}</span>
                        <span>•</span>
                        <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer info lock */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[9.5px] text-slate-400 font-medium select-none shrink-0 italic">
          Audit database entries matched sequentially in real-time.
        </div>
      </div>
    </div>
  );
}
