import React, { useState } from 'react';
import { 
  Search, Filter, Shield, MoreVertical, Edit2, Ban, CheckCircle, Key, Eye, EyeOff, Check, X, ShieldAlert,
  ArrowRightLeft, BadgeAlert, Sparkles, UserCheck, ShieldClose, RefreshCw, Trash2, ArrowUpRight
} from 'lucide-react';
import { AdminUser } from '../types';
import { formatDate, getInitials } from '../utils';
import { useAuth } from '../../../../shared/context/AuthContext';

interface UserTableProps {
  users: AdminUser[];
  onOpenEdit: (user: AdminUser) => void;
  onOpenResetPassword: (user: AdminUser) => void;
  onToggleStatus: (user: AdminUser) => void;
  onSoftDelete: (user: AdminUser) => void;
  onPermanentDelete?: (user: AdminUser) => void;
  onOpenDetails: (user: AdminUser) => void;
}

export default function UserTable({
  users,
  onOpenEdit,
  onOpenResetPassword,
  onToggleStatus,
  onSoftDelete,
  onPermanentDelete,
  onOpenDetails
}: UserTableProps) {
  const { user: currentUser } = useAuth();
  const [activeActionsMenu, setActiveActionsMenu] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(users.length / itemsPerPage) || 1;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setActiveActionsMenu(null);
  };

  const paginatedUsers = users.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-150 shadow-xs overflow-hidden font-sans">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-450 text-slate-400 uppercase tracking-widest">
              <th className="px-6 py-4.5">Identity</th>
              <th className="px-6 py-4.5">Account Role</th>
              <th className="px-6 py-4.5">Compliance status</th>
              <th className="px-6 py-4.5">Authorized Logs</th>
              <th className="px-6 py-4.5 text-right">Ledger actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-600 font-medium">
            {paginatedUsers.map((user) => {
              const isSelf = currentUser?.id === user.id;
              const isSuspended = !!user.deletedAt;

              return (
                <tr key={user.id} className="hover:bg-slate-50/50 transition">
                  {/* Identity detail cell */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        {user.avatarUrl ? (
                          <img 
                            src={user.avatarUrl} 
                            className={`h-9 w-9 rounded-full object-cover border border-slate-200 ${isSuspended ? 'grayscale opacity-75' : ''}`}
                            alt={user.name}
                          />
                        ) : (
                          <span className={`h-9 w-9 rounded-full font-extrabold text-[11px] flex items-center justify-center text-white ${
                            isSuspended ? 'bg-slate-400' : 'bg-indigo-600'
                          }`}>
                            {getInitials(user.name)}
                          </span>
                        )}
                        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                          isSuspended ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className={`font-bold text-slate-900 truncate leading-none ${isSuspended ? 'text-slate-400 line-through' : ''}`}>
                            {user.name}
                          </p>
                          {isSelf && (
                            <span className="text-[7.5px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-1 shrink-0">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-[10.5px] text-slate-400 truncate mt-1 leading-none">{user.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Access Role */}
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold tracking-wide uppercase px-2.5 py-0.8 bg-slate-100 text-slate-650 rounded-md">
                      {user.role}
                    </span>
                  </td>

                  {/* Compliance Verification status */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <span className={`inline-flex items-center gap-1.5 text-[10.5px] font-bold ${
                        user.isVerified ? 'text-indigo-600' : 'text-amber-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.isVerified ? 'bg-indigo-600' : 'bg-amber-600'}`} />
                        {user.isVerified ? 'Verified Account' : 'Awaiting Verify'}
                      </span>
                      {isSuspended && (
                        <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-rose-500 uppercase tracking-wider">
                          Suspended / Inactive
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Last Active login logs */}
                  <td className="px-6 py-4 text-slate-400 text-[10.5px]">
                    <p className="font-semibold text-slate-600">{formatDate(user.lastLoginAt)}</p>
                    <p className="text-[9.5px] text-slate-400 mt-1">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                  </td>

                  {/* Action block */}
                  <td className="px-6 py-4 text-right relative">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onOpenDetails(user)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="Query detailed activity records"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <button
                        disabled={isSelf}
                        onClick={() => onOpenEdit(user)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition disabled:opacity-30"
                        title="Update account credentials"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>

                      <button
                        disabled={isSelf}
                        onClick={() => onToggleStatus(user)}
                        className={`p-1.5 rounded-lg transition disabled:opacity-30 ${
                          isSuspended 
                            ? 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50' 
                            : 'text-amber-500 hover:text-amber-750 hover:bg-amber-50'
                        }`}
                        title={isSuspended ? 'Resume access privileges' : 'Suspend access privileges'}
                      >
                        {isSuspended ? <UserCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                      </button>

                      <button
                        disabled={isSelf}
                        onClick={() => onOpenResetPassword(user)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition disabled:opacity-30"
                        title="Override access keys"
                      >
                        <Key className="h-4 w-4" />
                      </button>

                      <button
                        disabled={isSelf}
                        onClick={() => onSoftDelete(user)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition disabled:opacity-30"
                        title="Soft-delete user context"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      {onPermanentDelete && (
                        <button
                          disabled={isSelf}
                          onClick={() => onPermanentDelete(user)}
                          className="p-1.5 text-rose-400 hover:text-rose-700 hover:bg-rose-100/50 rounded-lg transition disabled:opacity-30"
                          title="Permanently Expunge User Account"
                        >
                          <ShieldAlert className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Pagination row */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <p className="font-semibold">Showing page {currentPage} of {totalPages} ({users.length} entities on file)</p>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-xs font-bold bg-white text-slate-600 hover:text-slate-850 hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          {[...Array(totalPages)].map((_, idx) => (
            <button
              key={idx}
              onClick={() => handlePageChange(idx + 1)}
              className={`w-7 h-7 flex items-center justify-center font-bold text-xs rounded-lg cursor-pointer transition ${
                currentPage === idx + 1 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'bg-white text-slate-600 border border-slate-205 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {idx + 1}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 text-xs font-bold bg-white text-slate-600 hover:text-slate-850 hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
