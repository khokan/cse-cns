export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  trecHolderId?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalReportJobs: number;
  completedReportJobs: number;
  totalSettlements: number;
}

export interface AuditLogItem {
  id: string;
  userId?: string;
  userEmail?: string;
  action: string;
  entity: string;
  entityId?: string;
  payload?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface PaginatedAuditLogs {
  data: AuditLogItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
