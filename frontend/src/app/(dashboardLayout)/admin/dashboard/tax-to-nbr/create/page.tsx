"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { ProtectedPage } from "@/components/ProtectedPage";
import { useUser } from "@/hooks/useUser";
import { useCreateTaxToNBR } from "@/hooks/useTaxToNBR";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { CreateTaxToNBRPayload } from "@/types/taxToNBR.types";

export default function CreateTaxToNBRPage() {
  const router = useRouter();
  const { user } = useUser();
  const { mutate: createTaxToNBR, isPending } = useCreateTaxToNBR();

  const handleSubmit = useCallback((payload: CreateTaxToNBRPayload) => {
    createTaxToNBR(payload, {
      onSuccess: () => {
        router.push("/admin/dashboard/tax-to-nbr");
      },
    });
  }, [createTaxToNBR, router]);

  if (!user?.role) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading user information...</p>
      </div>
    );
  }

  return (
    <ProtectedPage
      userRole={user.role}
      allowedRoles={["ADMIN"]}
      fallbackMessage="Only Admins can create Tax to NBR records"
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
          <h1 className="text-2xl font-semibold">Create Tax to NBR Record</h1>
          <p className="text-sm text-muted-foreground">
            Add a new tax to NBR record to the system
          </p>
        </div>

        <div className="rounded-lg border border-dashed border-muted-foreground/25 p-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Form component placeholder - implement TaxToNBRForm component here
          </p>
          <p className="text-xs text-muted-foreground/60 mb-6">
            Required fields: contractNumber, trecHolderName, memberId
          </p>
          <Button 
            onClick={() => handleSubmit({
              contractNumber: "TEST-001",
              trecHolderName: "Test Holder",
              memberId: user.id || "",
            })}
            disabled={isPending}
            className="gap-2"
          >
            {isPending ? "Creating..." : "Create Record"}
          </Button>
        </div>
      </div>
    </ProtectedPage>
  );
}
