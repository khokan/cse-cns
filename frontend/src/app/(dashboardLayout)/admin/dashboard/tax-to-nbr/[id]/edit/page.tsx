"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback } from "react";
import { ProtectedPage } from "@/components/ProtectedPage";
import { useUser } from "@/hooks/useUser";
import { useTaxToNBR, useUpdateTaxToNBR } from "@/hooks/useTaxToNBR";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { UpdateTaxToNBRPayload } from "@/types/taxToNBR.types";

export default function EditTaxToNBRPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const recordId = params.id as string;

  const { data: record, isLoading: isLoadingRecord, error } = useTaxToNBR(recordId);
  const { mutate: updateTaxToNBR, isPending } = useUpdateTaxToNBR(recordId);

  const handleSubmit = useCallback((payload: UpdateTaxToNBRPayload) => {
    updateTaxToNBR(payload, {
      onSuccess: () => {
        router.push("/admin/dashboard/tax-to-nbr");
      },
    });
  }, [updateTaxToNBR, router]);

  if (!user?.role) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading user information...</p>
      </div>
    );
  }

  if (isLoadingRecord) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading record...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">
            Error loading record: {error.message}
          </p>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            Record not found
          </p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedPage
      userRole={user.role}
      allowedRoles={["ADMIN"]}
      fallbackMessage="Only Admins can edit Tax to NBR records"
    >
      <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div>
          <h1 className="text-2xl font-semibold">Edit Tax to NBR Record</h1>
          <p className="text-sm text-muted-foreground">
            Update tax to NBR record details
          </p>
        </div>

        <div className="rounded-lg border border-dashed border-muted-foreground/25 p-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Form component placeholder - implement TaxToNBRForm component here
          </p>
          <p className="text-xs text-muted-foreground/60 mb-6">
            Current Record ID: {record.id}
          </p>
          <Button 
            onClick={() => handleSubmit({
              contractNumber: record.contractNumber || undefined,
            })}
            disabled={isPending}
            className="gap-2"
          >
            {isPending ? "Updating..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </ProtectedPage>
  );
}
