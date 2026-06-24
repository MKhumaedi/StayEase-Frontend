import { useState } from 'react';
import { AdminUser } from '../types';

export function useUserManagement(users: any[]) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [verifyFilter, setVerifyFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  const [confirmToggleOpen, setConfirmToggleOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [targetUser, setTargetUser] = useState<AdminUser | null>(null);
  const [successToast, setSuccessToast] = useState('');

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  const typedUsers: AdminUser[] = users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isVerified: u.isVerified,
    avatarUrl: u.avatarUrl || null,
    createdAt: u.createdAt || new Date().toISOString(),
    lastLoginAt: u.lastLoginAt || null,
    deletedAt: u.deletedAt || null
  }));

  const filteredUsers = typedUsers.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                          u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesVerify = verifyFilter === 'ALL' || 
                          (verifyFilter === 'VERIFIED' && u.isVerified) || 
                          (verifyFilter === 'UNVERIFIED' && !u.isVerified);
    
    const isSuspended = !!u.deletedAt;
    const matchesStatus = statusFilter === 'ALL' ||
                          (statusFilter === 'ACTIVE' && !isSuspended) ||
                          (statusFilter === 'SUSPENDED' && isSuspended);

    return matchesSearch && matchesRole && matchesVerify && matchesStatus;
  });

  return {
    search, setSearch,
    roleFilter, setRoleFilter,
    verifyFilter, setVerifyFilter,
    statusFilter, setStatusFilter,
    createOpen, setCreateOpen,
    editOpen, setEditOpen,
    resetOpen, setResetOpen,
    detailsOpen, setDetailsOpen,
    confirmToggleOpen, setConfirmToggleOpen,
    confirmDeleteOpen, setConfirmDeleteOpen,
    actionLoading, setActionLoading,
    targetUser, setTargetUser,
    successToast, setSuccessToast,
    triggerToast,
    filteredUsers
  };
}
