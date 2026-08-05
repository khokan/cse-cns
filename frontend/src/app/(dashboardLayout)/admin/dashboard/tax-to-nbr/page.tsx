"use client";

import React, { useState, useCallback, useRef } from "react";
import { TaxToNBRDataTable } from "@/components/modules/taxToNBR/TaxToNBRDataTable";
import { TaxToNBRForm } from "@/components/modules/taxToNBR/TaxToNBRForm";
import { CrudDialog } from "@/components/modules/shared/CrudDialog";
import { useTaxToNBRs, useCreateTaxToNBR, useUpdateTaxToNBR, useDeleteTaxToNBR, useBulkDeleteTaxToNBRs } from "@/hooks/useTaxToNBR";
import { ProtectedPage } from "@/components/ProtectedPage";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { TaxToNBRItem, CreateTaxToNBRPayload, UpdateTaxToNBRPayload } from "@/types/taxToNBR.types";
import { useUser } from "@/hooks/useUser";

export default function AdminTaxToNBRPage() {
  const { user } = useUser();
  const userRole = user?.role || null;
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | "view">("create");
  const [selectedRecord, setSelectedRecord] = useState<TaxToNBRItem | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Fetch tax to NBR records
  const { data: taxToNBRData, isLoading, error, isError } = useTaxToNBRs({
    page: pageIndex + 1,
    limit: pageSize,
  });

  // Mutations
  const { mutate: createTaxToNBR, isPending: isCreating } = useCreateTaxToNBR();
  const { mutate: updateTaxToNBR, isPending: isUpdating } = useUpdateTaxToNBR(selectedRecord?.id || "");
  const { mutate: deleteTaxToNBR } = useDeleteTaxToNBR();
  const { mutate: bulkDeleteTaxToNBRs } = useBulkDeleteTaxToNBRs();

  // Dialog handlers
  const handleOpenDialog = useCallback((mode: "create" | "edit" | "view", record?: TaxToNBRItem) => {
    setDialogMode(mode);
    setSelectedRecord(record || null);
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setSelectedRecord(null);
  }, []);

  const handleCreateSubmit = useCallback(async (payload: CreateTaxToNBRPayload) => {
    return new Promise<void>((resolve, reject) => {
      createTaxToNBR(payload, {
        onSuccess: () => {
          handleCloseDialog();
          resolve();
        },
        onError: (error) => {
          reject(error);
        },
      });
    });
  }, [createTaxToNBR, handleCloseDialog]);

  const handleEditSubmit = useCallback(async (payload: UpdateTaxToNBRPayload) => {
    return new Promise<void>((resolve, reject) => {
      if (selectedRecord) {
        updateTaxToNBR(payload, {
          onSuccess: () => {
            handleCloseDialog();
            resolve();
          },
          onError: (error) => {
            reject(error);
          },
        });
      }
    });
  }, [selectedRecord, updateTaxToNBR, handleCloseDialog]);

  const handleDelete = useCallback(
    (ids: string[]): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!ids.length) {
          resolve();
          return;
        }
        if (ids.length === 1) {
          deleteTaxToNBR(ids[0], {
            onSuccess: () => resolve(),
            onError: (error) => reject(error),
          });
        } else {
          bulkDeleteTaxToNBRs(ids, {
            onSuccess: () => resolve(),
            onError: (error) => reject(error),
          });
        }
      });
    },
    [deleteTaxToNBR, bulkDeleteTaxToNBRs]
  );

  const handleSubmit = async () => {
    if (formRef.current) {
      const event = new Event("submit", { bubbles: true, cancelable: true });
      formRef.current.dispatchEvent(event);
    }
  };

  if (!userRole) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <ProtectedPage
      userRole={userRole}
      allowedRoles={["ADMIN", "TRECHOLDER"]}
      fallbackMessage="Only Admin and TrecHolders can access tax to NBR records"
    >
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Tax to NBR Management</h1>
            <p className="text-sm text-muted-foreground">
              View, create, and manage all tax to NBR records.
            </p>
          </div>
          {["ADMIN", "ACCOUNTING", "TRECHOLDER"].includes(userRole) && (
            <Button onClick={() => handleOpenDialog("create")} className="gap-2" disabled={isLoading}>
              <Plus className="h-4 w-4" />
              Create Record
            </Button>
          )}
        </div>

        {isError && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">
              Error loading tax to NBR records: {error.message}
            </p>
          </div>
        )}

        <TaxToNBRDataTable
          data={taxToNBRData?.data || []}
          isLoading={isLoading}
          userRole={userRole}
          onEdit={["ADMIN", "ACCOUNTING", "TRECHOLDER"].includes(userRole) ? (record) => handleOpenDialog("edit", record) : undefined}
          onDelete={["ADMIN", "ACCOUNTING"].includes(userRole) ? handleDelete : undefined}
          pageIndex={pageIndex}
          pageSize={pageSize}
          totalRecords={taxToNBRData?.meta?.total || 0}
          onPageChange={setPageIndex}
          onPageSizeChange={setPageSize}
        />


      </div>

      {/* CRUD Dialog */}
      <CrudDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        title={
          dialogMode === "create"
            ? "Create New Tax to NBR Record"
            : dialogMode === "edit"
            ? "Edit Tax to NBR Record"
            : "View Tax to NBR Record"
        }
        description={
          dialogMode === "create"
            ? "Add a new tax to NBR record"
            : dialogMode === "edit"
            ? "Update tax to NBR record details"
            : "View tax to NBR record details"
        }
        isLoading={isCreating || isUpdating}
        onSubmit={handleSubmit}
        submitButtonLabel={dialogMode === "create" ? "Create" : "Update"}
      >
        <TaxToNBRFormWrapper
          ref={formRef}
          data={selectedRecord || undefined}
          isLoading={isCreating || isUpdating}
          memberId={user?.id || ""}
          onSubmit={async (payload: CreateTaxToNBRPayload | UpdateTaxToNBRPayload) => {
            if (dialogMode === "create") {
              return handleCreateSubmit(payload as CreateTaxToNBRPayload);
            } else {
              return handleEditSubmit(payload as UpdateTaxToNBRPayload);
            }
          }}
        />
      </CrudDialog>
    </ProtectedPage>
  );
}

// Wrapper to expose form ref
const TaxToNBRFormWrapper = React.forwardRef<
  HTMLFormElement,
  {
    data?: TaxToNBRItem;
    isLoading?: boolean;
    memberId: string;
    onSubmit: (data: CreateTaxToNBRPayload | UpdateTaxToNBRPayload) => Promise<void>;
  }
>(({ data, isLoading, memberId, onSubmit }, ref) => {
  const localFormRef = useRef<HTMLDivElement>(null);

  // Create a wrapper form and expose it via ref
  React.useImperativeHandle(ref, () => {
    const form = localFormRef.current?.querySelector('form') as HTMLFormElement;
    return form || ({} as HTMLFormElement);
  }, []);

  return (
    <div ref={localFormRef}>
      <TaxToNBRForm
        data={data}
        isLoading={isLoading}
        memberId={memberId}
        onSubmit={onSubmit}
      />
    </div>
  );
});

TaxToNBRFormWrapper.displayName = "TaxToNBRFormWrapper";
