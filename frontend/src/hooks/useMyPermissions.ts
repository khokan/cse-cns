"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyPermissions } from "@/services/security.service";

export const MY_PERMISSIONS_KEY = ["my-permissions"];

export function useMyPermissions() {
  const { data, isLoading } = useQuery({
    queryKey: MY_PERMISSIONS_KEY,
    queryFn: async () => {
      const res = await getMyPermissions();
      if (res.error) return {};
      return res.data?.data ?? {};
    },
    staleTime: 0,           // Always re-fetch when component mounts
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const permissions = data ?? {};

  const hasPermission = (module: string, action: "create" | "read" | "update" | "delete") => {
    const key = `${module}:${action}`;
    return permissions[key] === "ALLOW";
  };

  return {
    permissions,
    isLoading,
    hasPermission,
    canCreate: (module: string) => hasPermission(module, "create"),
    canRead: (module: string) => hasPermission(module, "read"),
    canUpdate: (module: string) => hasPermission(module, "update"),
    canDelete: (module: string) => hasPermission(module, "delete"),
  };
}

