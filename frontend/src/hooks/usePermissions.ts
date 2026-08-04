"use client";

import { useCallback } from "react";
import type { UserRole } from "@/utils/authUtils";
import {
  canAccessChallanCRUD,
  canAccessTaxToNBRCRUD,
  canCreateChallan,
  canUpdateChallan,
  canDeleteChallan,
  canCreateTaxToNBR,
  canUpdateTaxToNBR,
  canDeleteTaxToNBR,
  canViewAllRecords,
  getRecordFilter,
} from "@/utils/rolePermissions";

/**
 * Hook to check CRUD permissions for current user
 */
export function usePermissions(userRole: UserRole, userId?: string) {
  // Challan permissions
  const challan = useCallback(
    () => ({
      canAccess: canAccessChallanCRUD(userRole),
      canCreate: canCreateChallan(userRole),
      canUpdate: canUpdateChallan(userRole),
      canDelete: canDeleteChallan(userRole),
      canViewAll: canViewAllRecords(userRole),
    }),
    [userRole]
  );

  // TaxToNBR permissions
  const taxToNBR = useCallback(
    () => ({
      canAccess: canAccessTaxToNBRCRUD(userRole),
      canCreate: canCreateTaxToNBR(userRole),
      canUpdate: canUpdateTaxToNBR(userRole),
      canDelete: canDeleteTaxToNBR(userRole),
      canViewAll: canViewAllRecords(userRole),
    }),
    [userRole]
  );

  // Get filter based on user role
  const getFilter = useCallback(
    () => getRecordFilter(userRole, userId),
    [userRole, userId]
  );

  return {
    userRole,
    challan: challan(),
    taxToNBR: taxToNBR(),
    getFilter,
  };
}
