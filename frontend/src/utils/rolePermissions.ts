import type { UserRole } from "./authUtils";

/**
 * Check if user has permission to access a resource
 */
export const hasPermission = (userRole: UserRole, requiredRoles: UserRole[]): boolean => {
  return requiredRoles.includes(userRole);
};

/**
 * Check if user can perform CRUD operations
 * Only ADMIN and TRECHOLDER can perform CRUD operations
 */
export const canPerformCRUD = (userRole: UserRole): boolean => {
  return ["ADMIN", "TRECHOLDER"].includes(userRole);
};

/**
 * Check if user can access Challan CRUD
 * Only ADMIN and TRECHOLDER can access
 */
export const canAccessChallanCRUD = (userRole: UserRole): boolean => {
  return ["ADMIN", "TRECHOLDER"].includes(userRole);
};

/**
 * Check if user can access TaxToNBR CRUD
 * Only ADMIN and TRECHOLDER can access
 */
export const canAccessTaxToNBRCRUD = (userRole: UserRole): boolean => {
  return ["ADMIN", "TRECHOLDER"].includes(userRole);
};

/**
 * Check if user can create Challan
 */
export const canCreateChallan = (userRole: UserRole): boolean => {
  return ["ADMIN"].includes(userRole);
};

/**
 * Check if user can update Challan
 */
export const canUpdateChallan = (userRole: UserRole): boolean => {
  return ["ADMIN"].includes(userRole);
};

/**
 * Check if user can delete Challan
 */
export const canDeleteChallan = (userRole: UserRole): boolean => {
  return ["ADMIN"].includes(userRole);
};

/**
 * Check if user can create TaxToNBR record
 */
export const canCreateTaxToNBR = (userRole: UserRole): boolean => {
  return ["ADMIN"].includes(userRole);
};

/**
 * Check if user can update TaxToNBR record
 */
export const canUpdateTaxToNBR = (userRole: UserRole): boolean => {
  return ["ADMIN"].includes(userRole);
};

/**
 * Check if user can delete TaxToNBR record
 */
export const canDeleteTaxToNBR = (userRole: UserRole): boolean => {
  return ["ADMIN"].includes(userRole);
};

/**
 * Get allowed roles for a specific operation
 */
export const getAllowedRolesForChallan = (): UserRole[] => {
  return ["ADMIN", "TRECHOLDER"];
};

export const getAllowedRolesForTaxToNBR = (): UserRole[] => {
  return ["ADMIN", "TRECHOLDER"];
};

/**
 * Check if user can view all records or only their own
 */
export const canViewAllRecords = (userRole: UserRole): boolean => {
  return userRole === "ADMIN";
};

/**
 * Get query filter based on user role
 * TRECHOLDER can only see their own records (filtered by memberId)
 * ADMIN can see all records
 */
export const getRecordFilter = (userRole: UserRole, userId?: string) => {
  if (userRole === "ADMIN") {
    return {};
  }
  // TRECHOLDER can only see their own records
  return {
    memberId: userId,
  };
};
