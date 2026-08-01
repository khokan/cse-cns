export interface AdminUserQuery {
  page?: string;
  limit?: string;
  role?: string;
  status?: string;
  search?: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  role?: string;
  status?: string;
  trecHolderId?: string;
}

export interface AuditLogQuery {
  page?: string;
  limit?: string;
  action?: string;
  entity?: string;
  userId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}
