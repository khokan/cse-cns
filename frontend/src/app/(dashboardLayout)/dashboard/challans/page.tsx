"use client";

import { useState } from "react";
import { ChallanDataTable } from "@/components/modules/challan/ChallanDataTable";
import { useChallans } from "@/hooks/useChallan";
import { ProtectedPage } from "@/components/ProtectedPage";
import { useUser } from "@/hooks/useUser";

export default function TrecholderChallansPage() {
  const { user } = useUser();
  const userRole = user?.role || null;
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Fetch challans
  const { data: challansData, isLoading } = useChallans({
    page: pageIndex + 1,
    limit: pageSize,
  });

  if (!userRole) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <ProtectedPage
      userRole={userRole}
      allowedRoles={["TRECHOLDER"]}
      fallbackMessage="Only TrecHolders can access this page"
    >
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-semibold">My Challans</h1>
          <p className="text-sm text-muted-foreground">
            View your challans and related information.
          </p>
        </div>

        <ChallanDataTable
          data={challansData?.data || []}
          isLoading={isLoading}
          userRole={userRole}
          pageIndex={pageIndex}
          pageSize={pageSize}
          totalRecords={challansData?.meta?.total || 0}
          onPageChange={setPageIndex}
          onPageSizeChange={setPageSize}
        />
      </div>
    </ProtectedPage>
  );
}
