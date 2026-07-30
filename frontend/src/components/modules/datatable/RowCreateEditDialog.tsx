"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export type FieldSchema = {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "datetime-local";
  readOnly?: boolean;
};

type RowCreateEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: string;
  fields: FieldSchema[];
  initialData?: Record<string, unknown>;
  primaryKey?: string;
  onSubmit: (payload: Record<string, unknown>) => void;
  isSubmitting?: boolean;
};

function inferInputType(value: unknown): RowCreateEditDialogProps["fields"][number]["type"] {
  if (typeof value === "number") return "number";
  if (value instanceof Date) return "datetime-local";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) return "datetime-local";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return "date";
  return "text";
}

export function RowCreateEditDialog({
  open,
  onOpenChange,
  table,
  fields,
  initialData,
  primaryKey,
  onSubmit,
  isSubmitting,
}: RowCreateEditDialogProps) {
  const isEdit = Boolean(initialData && primaryKey && initialData[primaryKey]);

  const initialValues = (() => {
    const base = initialData ?? {};
    const next: Record<string, string> = {};
    fields.forEach(({ key }) => {
      const raw = base[key];
      next[key] = raw == null ? "" : String(raw);
    });
    return next;
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <RowForm
          key={`${isEdit ? "edit" : "create"}-${primaryKey ?? "new"}`}
          table={table}
          fields={fields}
          initialValues={initialValues}
          isEdit={isEdit}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

type RowFormProps = Omit<RowCreateEditDialogProps, "open" | "onOpenChange" | "initialData"> & {
  initialValues: Record<string, string>;
  isEdit: boolean;
  onCancel: () => void;
};

function RowForm({
  table,
  fields,
  initialValues,
  isEdit,
  onSubmit,
  isSubmitting,
  onCancel,
}: RowFormProps) {
  const [values, setValues] = useState<Record<string, string>>(initialValues);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {};
    fields.forEach(({ key, type }) => {
      const raw = values[key];
      if (raw === "" && !isEdit) return; // skip empty optional fields on create
      if (type === "number") {
        payload[key] = raw === "" ? undefined : Number(raw);
      } else if (type === "date" || type === "datetime-local") {
        payload[key] = raw ? new Date(raw).toISOString() : undefined;
      } else {
        payload[key] = raw;
      }
    });
    onSubmit(payload);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit Row" : "Create Row"}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? `Update a row in ${table}.`
            : `Add a new row to ${table}.`}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        {fields.map(({ key, label, type = "text", readOnly }) => {
          const inferredType = type === "text" ? inferInputType(initialValues[key]) : type;
          return (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                type={inferredType}
                value={values[key] ?? ""}
                readOnly={readOnly}
                onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                className={readOnly ? "bg-muted" : ""}
              />
            </div>
          );
        })}

        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Save Changes" : "Create"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
