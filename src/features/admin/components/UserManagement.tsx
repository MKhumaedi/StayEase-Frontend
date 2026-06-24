import React, { useState } from 'react';
import { Search, Filter, UserCheck, UserPlus, Sparkles, AlertCircle } from 'lucide-react';
import { AdminUser } from '../users/types';
import { useUserManagement } from '../users/hooks/useUserManagement';

// Feature-based sub-components
import UserTable from '../users/components/UserTable';
import UserCreateModal from '../users/modals/UserCreateModal';
import UserEditModal from '../users/modals/UserEditModal';
import PasswordResetModal from '../users/modals/PasswordResetModal';
import UserDetailsDrawer from '../users/modals/UserDetailsDrawer';
import ConfirmationDialog from '../users/modals/ConfirmationDialog';
import TenantManagement from './TenantManagement';

interface UserManagementProps {
  users: any[];
  onUpdateUser: (userId: string, data: any) => Promise<void>;
  onResetPassword: (userId: string, newPassword: string) => Promise<void>;
  onCreateUser: (data: any) => Promise<void>;
  onPermanentDelete?: (userId: string) => Promise<void>;
  auditLogs: any[];
  tenants?: any[];
  onUpdateTenantStatus?: (tenantId: string, isVerified: boolean) => Promise<void>;
  onSuspendTenant?: (tenantId: string, suspend: boolean) => Promise<void>;
}

export default function UserManagement({ 
  users = [], 
  onUpdateUser, 
  onResetPassword,
  onCreateUser,
  onPermanentDelete,
  auditLogs = [],
  tenants = [],
  onUpdateTenantStatus = async () => {},
  onSuspendTenant = async () => {}
 }: UserManagementProps) {
  const hook = useUserManagement(users);
  const [confirmPermanentDeleteOpen, setConfirmPermanentDeleteOpen] = useState(false);
  const [userToPermanentlyDelete, setUserToPermanentlyDelete] = useState<any | null>(null);
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'user' | 'tenant' | 'admin'>('all');

  const handleTabChange = (tab: 'all' | 'user' | 'tenant' | 'admin') => {
    setActiveFilterTab(tab);
    if (tab === 'all') {
      hook.setRoleFilter('ALL');
    } else if (tab === 'user') {
      hook.setRoleFilter('USER');
    } else if (tab === 'tenant') {
      hook.setRoleFilter('TENANT');
    } else if (tab === 'admin') {
      hook.setRoleFilter('ADMIN');
    }
  };

  const handlePermanentDeleteConfirm = async () => {
    if (!userToPermanentlyDelete || !onPermanentDelete) return;
    hook.setActionLoading(true);
    try {
      await onPermanentDelete(userToPermanentlyDelete.id);
      hook.triggerToast('User account and peripheral profiles has been permanently expunged.');
      setConfirmPermanentDeleteOpen(false);
      setUserToPermanentlyDelete(null);
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    } finally {
      hook.setActionLoading(false);
    }
  };

  const handleToggleStatusConfirm = async () => {
    if (!hook.targetUser) return;
    hook.setActionLoading(true);
    try {
      const currentlySuspended = !!hook.targetUser.deletedAt;
      await onUpdateUser(hook.targetUser.id, {
        status: currentlySuspended ? 'ACTIVE' : 'SUSPENDED'
      });
      hook.triggerToast(`Account access successfully ${currentlySuspended ? 'activated' : 'suspended'}.`);
      hook.setConfirmToggleOpen(false);
      hook.setTargetUser(null);
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    } finally {
      hook.setActionLoading(false);
    }
  };

  const handleSoftDeleteConfirm = async () => {
    if (!hook.targetUser) return;
    hook.setActionLoading(true);
    try {
      await onUpdateUser(hook.targetUser.id, { status: 'DELETED' });
      hook.triggerToast('User records soft-deleted successfully.');
      hook.setConfirmDeleteOpen(false);
      hook.setTargetUser(null);
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    } finally {
      hook.setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Module Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/50 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-indigo-600" />
            Platform Directory
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">Audit, register, and update active StayEase account profiles in real-time.</p>
        </div>

        <button 
          onClick={() => hook.setCreateOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-500/10 transition cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          Onboard User Account
        </button>
      </div>

      {/* Lockout protection Banner */}
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-indigo-800 leading-snug">
        <Sparkles className="h-4.5 w-4.5 shrink-0 text-indigo-600 mt-0.5" />
        <div>
          <strong>System Protection Standard:</strong> Safety guards actively protect core administrators. Lockouts, role stripping, and active session deletions are intercepted dynamically on the ledger container.
        </div>
      </div>

      {/* Navigation Filter Tabs Switcher */}
      <div className="flex border-b border-gray-200" id="user-management-tabs">
        <button
          onClick={() => handleTabChange('all')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 ${
            activeFilterTab === 'all'
              ? 'border-indigo-600 text-indigo-600 font-extrabold'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
          id="btn-tab-all-users"
        >
          All Users
        </button>
        <button
          onClick={() => handleTabChange('user')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 ${
            activeFilterTab === 'user'
              ? 'border-indigo-600 text-indigo-600 font-extrabold'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
          id="btn-tab-users"
        >
          Users
        </button>
        <button
          onClick={() => handleTabChange('tenant')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 ${
            activeFilterTab === 'tenant'
              ? 'border-indigo-600 text-indigo-600 font-extrabold'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
          id="btn-tab-tenants"
        >
          Tenants
        </button>
        <button
          onClick={() => handleTabChange('admin')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 ${
            activeFilterTab === 'admin'
              ? 'border-indigo-600 text-indigo-600 font-extrabold'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
          id="btn-tab-admins"
        >
          Admins
        </button>
      </div>

      {activeFilterTab === 'tenant' ? (
        <TenantManagement 
          tenants={tenants} 
          onUpdateTenantStatus={onUpdateTenantStatus} 
          onSuspendTenant={onSuspendTenant} 
        />
      ) : (
        <>
          {/* Filtering and controls bar */}
          <div className="flex flex-col md:flex-row gap-3.5 items-center justify-between">
            <div className="relative w-full md:w-80">
              <input
                type="text"
                value={hook.search}
                onChange={(e) => hook.setSearch(e.target.value)}
                placeholder="Search matching names or emails..."
                className="w-full text-xs font-semibold px-4 py-2.8 bg-white border border-slate-205 border-slate-200 focus:border-indigo-500 rounded-xl outline-hidden transition pl-9.5"
              />
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <select
                value={hook.statusFilter}
                onChange={(e) => hook.setStatusFilter(e.target.value)}
                className="text-xs font-bold px-3 py-2 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl outline-hidden cursor-pointer transition text-slate-650"
              >
                <option value="ALL">Compliance: All</option>
                <option value="ACTIVE">Status: Active</option>
                <option value="SUSPENDED">Status: Suspended</option>
              </select>

              <select
                value={hook.verifyFilter}
                onChange={(e) => hook.setVerifyFilter(e.target.value)}
                className="text-xs font-bold px-3 py-2 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl outline-hidden cursor-pointer transition text-slate-650"
              >
                <option value="ALL">Verification: All</option>
                <option value="VERIFIED">Status: VerifiedOnly</option>
                <option value="UNVERIFIED">Status: NonVerified</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          {hook.filteredUsers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center shadow-xs">
              <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h4 className="font-extrabold text-sm text-slate-800">No matching search query</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">No registered StayEase profiles with these selected filters on ledger.</p>
            </div>
          ) : (
            <UserTable 
              users={hook.filteredUsers}
              onOpenEdit={(user) => {
                hook.setTargetUser(user);
                hook.setEditOpen(true);
              }}
              onOpenResetPassword={(user) => {
                hook.setTargetUser(user);
                hook.setResetOpen(true);
              }}
              onToggleStatus={(user) => {
                hook.setTargetUser(user);
                hook.setConfirmToggleOpen(true);
              }}
              onSoftDelete={(user) => {
                hook.setTargetUser(user);
                hook.setConfirmDeleteOpen(true);
              }}
              onPermanentDelete={(user) => {
                setUserToPermanentlyDelete(user);
                setConfirmPermanentDeleteOpen(true);
              }}
              onOpenDetails={(user) => {
                hook.setTargetUser(user);
                hook.setDetailsOpen(true);
              }}
            />
          )}
        </>
      )}

      {/* Success Notifications Toast */}
      {hook.successToast && (
        <div className="fixed bottom-6 right-6 z-[3000] bg-slate-900 text-white rounded-xl py-3 px-4.5 text-xs font-bold shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom border border-slate-800">
          <Sparkles className="h-4 w-4 text-indigo-400 shrink-0" />
          <span>{hook.successToast}</span>
        </div>
      )}

      {/* Onboarding Dialog */}
      <UserCreateModal 
        isOpen={hook.createOpen}
        onClose={() => hook.setCreateOpen(false)}
        onCreate={async (data) => {
          await onCreateUser(data);
          hook.triggerToast('New user account has been successfully onboarded.');
        }}
      />

      {/* Editing Modals */}
      <UserEditModal 
        user={hook.targetUser}
        isOpen={hook.editOpen}
        onClose={() => {
          hook.setEditOpen(false);
          hook.setTargetUser(null);
        }}
        onEdit={async (userId, data) => {
          await onUpdateUser(userId, data);
          hook.triggerToast('Identity records updated successfully.');
        }}
      />

      {/* Credentials overrides modal */}
      <PasswordResetModal 
        user={hook.targetUser}
        isOpen={hook.resetOpen}
        onClose={() => {
          hook.setResetOpen(false);
          hook.setTargetUser(null);
        }}
        onReset={onResetPassword}
      />

      {/* Profile Ledger Details Drawer */}
      <UserDetailsDrawer 
        user={hook.targetUser}
        isOpen={hook.detailsOpen}
        onClose={() => {
          hook.setDetailsOpen(false);
          hook.setTargetUser(null);
        }}
        auditLogs={auditLogs}
      />

      {/* Confirmation Dialogs */}
      <ConfirmationDialog 
        isOpen={hook.confirmToggleOpen}
        onClose={() => {
          hook.setConfirmToggleOpen(false);
          hook.setTargetUser(null);
        }}
        onConfirm={handleToggleStatusConfirm}
        title={hook.targetUser?.deletedAt ? 'Active Status Restoration' : 'System Access Suspension'}
        message={hook.targetUser?.deletedAt 
          ? `Are you sure you want to RESTORE the active access privileges of ${hook.targetUser?.email}?` 
          : `Are you sure you want to SUSPEND the account session of ${hook.targetUser?.email}? This blocks future login authorization until reactivated.`
        }
        confirmLabel={hook.targetUser?.deletedAt ? 'Restore privileges' : 'Suspend user'}
        cancelLabel="Discard"
        variant={hook.targetUser?.deletedAt ? 'info' : 'warning'}
        isLoading={hook.actionLoading}
      />

      <ConfirmationDialog 
        isOpen={hook.confirmDeleteOpen}
        onClose={() => {
          hook.setConfirmDeleteOpen(false);
          hook.setTargetUser(null);
        }}
        onConfirm={handleSoftDeleteConfirm}
        title="Enterprise Soft Delete Action"
        message={`Are you sure you want to SOFT-DELETE user card details of ${hook.targetUser?.email}? Their historic profile can still be located under suspended and filtered search directories, but accounts will be immediately inactivated on standard directories.`}
        confirmLabel="Inactivate details"
        cancelLabel="Discard"
        variant="danger"
        isLoading={hook.actionLoading}
      />

      <ConfirmationDialog 
        isOpen={confirmPermanentDeleteOpen}
        onClose={() => {
          setConfirmPermanentDeleteOpen(false);
          setUserToPermanentlyDelete(null);
        }}
        onConfirm={handlePermanentDeleteConfirm}
        title="⚠️ Critical Permanent Delete Action"
        message={`Are you sure you want to PERMANENTLY expunge user account ${userToPermanentlyDelete?.email}? This will Cascadingly remove all related tenant profiles and internal logs. THIS IS AN IRREVERSIBLE DESTRUCTION AND CANNOT BE UNDONE.`}
        confirmLabel="PERMANENTLY DELETE"
        cancelLabel="Abort"
        variant="danger"
        isLoading={hook.actionLoading}
      />
    </div>
  );
}
