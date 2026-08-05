"use client";

import React, { useState, useCallback, useRef } from "react";
import { ChallanDataTable } from "@/components/modules/challan/ChallanDataTable";
import { ChallanForm } from "@/components/modules/challan/ChallanForm";
import { CrudDialog } from "@/components/modules/shared/CrudDialog";
import { useChallans, useCreateChallan, useUpdateChallan, useDeleteChallan, useBulkDeleteChallans } from "@/hooks/useChallan";
import { ProtectedPage } from "@/components/ProtectedPage";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { ChallanItem, CreateChallanPayload, UpdateChallanPayload } from "@/types/challan.types";
import { useUser } from "@/hooks/useUser";

import { useMyPermissions } from "@/hooks/useMyPermissions";

export default function TrecholderChallansPage() {
  const { user } = useUser();
  const userRole = user?.role || null;
  const { canCreate, canUpdate, canDelete } = useMyPermissions();
  const canCreateChallan = canCreate("challan");
  const canUpdateChallan = canUpdate("challan");
  const canDeleteChallan = canDelete("challan");

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | "view">("create");
  const [selectedChallan, setSelectedChallan] = useState<ChallanItem | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Fetch challans
  const { data: challansData, isLoading, error, isError } = useChallans({
    page: pageIndex + 1,
    limit: pageSize,
  });

  // Mutations
  const { mutate: createChallan, isPending: isCreating } = useCreateChallan();
  const { mutate: updateChallan, isPending: isUpdating } = useUpdateChallan(selectedChallan?.ID || 0);
  const { mutate: deleteChallan } = useDeleteChallan();
  const { mutate: bulkDeleteChallans } = useBulkDeleteChallans();

  // Dialog handlers
  const handleOpenDialog = useCallback((mode: "create" | "edit" | "view", challan?: ChallanItem) => {
    setDialogMode(mode);
    setSelectedChallan(challan || null);
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setSelectedChallan(null);
  }, []);

  const handleCreateSubmit = useCallback(async (payload: CreateChallanPayload) => {
    return new Promise<void>((resolve, reject) => {
      createChallan(payload, {
        onSuccess: () => {
          handleCloseDialog();
          resolve();
        },
        onError: (error) => {
          reject(error);
        },
      });
    });
  }, [createChallan, handleCloseDialog]);

  const handleEditSubmit = useCallback(async (payload: UpdateChallanPayload) => {
    return new Promise<void>((resolve, reject) => {
      if (selectedChallan) {
        updateChallan(payload, {
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
  }, [selectedChallan, updateChallan, handleCloseDialog]);

  const handleDelete = useCallback(
    (ids: string[]): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!ids.length) {
          resolve();
          return;
        }
        if (ids.length === 1) {
          deleteChallan(Number(ids[0]), {
            onSuccess: () => resolve(),
            onError: (error) => reject(error),
          });
        } else {
          bulkDeleteChallans(ids, {
            onSuccess: () => resolve(),
            onError: (error) => reject(error),
          });
        }
      });
    },
    [deleteChallan, bulkDeleteChallans]
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
      allowedRoles={["TRECHOLDER", "ADMIN", "ACCOUNTING", "IT", "MARKETING"]}
      fallbackMessage="You don't have access to this page"
    >
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">My Challans</h1>
            <p className="text-sm text-muted-foreground">
              View, create, and manage your challans.
            </p>
          </div>
          {canCreateChallan && (
            <Button onClick={() => handleOpenDialog("create")} className="gap-2" disabled={isLoading}>
              <Plus className="h-4 w-4" />
              Create Challan
            </Button>
          )}
        </div>

        {isError && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">
              Error loading challans: {error.message}
            </p>
          </div>
        )}

        <ChallanDataTable
          data={challansData?.data || []}
          isLoading={isLoading}
          userRole={userRole}
          onEdit={canUpdateChallan ? (challan) => handleOpenDialog("edit", challan) : undefined}
          onDelete={canDeleteChallan ? handleDelete : undefined}
          pageIndex={pageIndex}
          pageSize={pageSize}
          totalRecords={challansData?.meta?.total || 0}
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
            ? "Create New Challan"
            : dialogMode === "edit"
            ? "Edit Challan"
            : "View Challan"
        }
        description={
          dialogMode === "create"
            ? "Add a new challan record"
            : dialogMode === "edit"
            ? "Update challan details"
            : "View challan details"
        }
        isLoading={isCreating || isUpdating}
        onSubmit={handleSubmit}
        submitButtonLabel={dialogMode === "create" ? "Create" : "Update"}
      >
        <ChallanFormWrapper
          ref={formRef}
          data={selectedChallan || undefined}
          isLoading={isCreating || isUpdating}
          onSubmit={async (payload: CreateChallanPayload | UpdateChallanPayload) => {
            if (dialogMode === "create") {
              return handleCreateSubmit(payload as CreateChallanPayload);
            } else {
              return handleEditSubmit(payload as UpdateChallanPayload);
            }
          }}
        />
      </CrudDialog>
    </ProtectedPage>
  );
}

// Wrapper to expose form ref
const ChallanFormWrapper = React.forwardRef<
  HTMLFormElement,
  {
    data?: ChallanItem;
    isLoading?: boolean;
    onSubmit: (data: CreateChallanPayload | UpdateChallanPayload) => Promise<void>;
  }
>(({ data, isLoading, onSubmit }, ref) => {
  const localFormRef = useRef<HTMLDivElement>(null);

  React.useImperativeHandle(ref, () => {
    const form = localFormRef.current?.querySelector('form') as HTMLFormElement;
    return form || ({} as HTMLFormElement);
  }, []);

  return (
    <div ref={localFormRef}>
      <ChallanForm
        data={data}
        isLoading={isLoading}
        onSubmit={onSubmit}
      />
    </div>
  );
});

ChallanFormWrapper.displayName = "ChallanFormWrapper";
