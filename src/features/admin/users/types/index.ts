import { UserRole } from '../../../../types';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  avatarUrl: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  deletedAt: string | null;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  details: string;
  timestamp: string;
}
