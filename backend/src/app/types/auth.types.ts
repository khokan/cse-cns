// src/types/auth.types.ts

// Role types
export const UserRole = {
  ADMIN: "ADMIN",
  IT: "IT",
  ACCOUNTING: "ACCOUNTING",
  TRECHOLDER: "TRECHOLDER",
  MARKETING: "MARKETING",
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

// Status types
export const UserStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  SUSPENDED: "SUSPENDED",
  BLOCKED: "BLOCKED",
  DELETED: "DELETED",
  PENDING_VERIFICATION: "PENDING_VERIFICATION",
} as const;

export type UserStatusType = typeof UserStatus[keyof typeof UserStatus];

// Valid values for validation
export const VALID_ROLES = Object.values(UserRole);
export const VALID_STATUSES = Object.values(UserStatus);

// Helper function to check if a string is a valid role
export function isValidRole(role: string): role is UserRoleType {
  return VALID_ROLES.includes(role as UserRoleType);
}

// Helper function to check if a string is a valid status
export function isValidStatus(status: string): status is UserStatusType {
  return VALID_STATUSES.includes(status as UserStatusType);
}
