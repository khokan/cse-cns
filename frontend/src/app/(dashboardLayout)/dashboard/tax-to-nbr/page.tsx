"use client";

import { useState } from "react";
import { TaxToNBRDataTable } from "@/components/modules/taxToNBR/TaxToNBRDataTable";
import { useTaxToNBRs } from "@/hooks/useTaxToNBR";
import { ProtectedPage } from "@/components/ProtectedPage";
import { useUser } from "@/hooks/useUser";

export default function TrecholderTaxToNBRPage() {
  const { user } = useUser();
  const userRole = user?.role || null;
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Fetch tax to NBR records
  const { data: taxToNBRData, isLoading } = useTaxToNBRs({
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
          <h1 className="text-2xl font-semibold">My Tax to NBR Records</h1>
          <p className="text-sm text-muted-foreground">
            View your tax to NBR records and related information.
          </p>
        </div>

        <TaxToNBRDataTable
          data={taxToNBRData?.data || []}
          isLoading={isLoading}
          userRole={userRole}
          pageIndex={pageIndex}
          pageSize={pageSize}
          totalRecords={taxToNBRData?.meta?.total || 0}
          onPageChange={setPageIndex}
          onPageSizeChange={setPageSize}
        />
      </div>
    </ProtectedPage>
  );
}
