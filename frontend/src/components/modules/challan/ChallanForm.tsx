"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ChallanItem, CreateChallanPayload, UpdateChallanPayload } from "@/types/challan.types";

interface ChallanFormProps {
  data?: ChallanItem;
  isLoading?: boolean;
  onSubmit: (data: CreateChallanPayload | UpdateChallanPayload) => Promise<void>;
}

/**
 * Reusable Challan Form Component
 * Used in CrudDialog for both create and edit operations
 */
export function ChallanForm({ data, isLoading = false, onSubmit }: ChallanFormProps) {
  const [formData, setFormData] = useState({
    ChallanNumber: "",
    ChallanDate: "",
    ChallanPeriodStartDate: "",
    ChallanPeriodEndDate: "",
    TotalTaxAmount: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form with data when editing
  useEffect(() => {
    if (data) {
      const timeout = setTimeout(() => {
        setFormData({
          ChallanNumber: data.ChallanNumber || "",
          ChallanDate: data.ChallanDate || "",
          ChallanPeriodStartDate: data.ChallanPeriodStartDate || "",
          ChallanPeriodEndDate: data.ChallanPeriodEndDate || "",
          TotalTaxAmount: data.TotalTaxAmount?.toString() || "",
        });
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [data]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.ChallanNumber.trim()) {
      newErrors.ChallanNumber = "Challan number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const payload = {
        challanNumber: formData.ChallanNumber,
        challanDate: formData.ChallanDate || undefined,
        challanPeriodStartDate: formData.ChallanPeriodStartDate || undefined,
        challanPeriodEndDate: formData.ChallanPeriodEndDate || undefined,
        totalTaxAmount: formData.TotalTaxAmount ? parseFloat(formData.TotalTaxAmount) : undefined,
      };
      await onSubmit(payload);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ChallanNumber">Challan Number *</Label>
        <Input
          id="ChallanNumber"
          name="ChallanNumber"
          placeholder="e.g., CNT-2024-001"
          value={formData.ChallanNumber}
          onChange={handleChange}
          disabled={isLoading}
        />
        {errors.ChallanNumber && (
          <p className="text-sm text-red-500">{errors.ChallanNumber}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="ChallanDate">Challan Date</Label>
        <Input
          id="ChallanDate"
          name="ChallanDate"
          type="date"
          value={formData.ChallanDate}
          onChange={handleChange}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ChallanPeriodStartDate">Period Start Date</Label>
        <Input
          id="ChallanPeriodStartDate"
          name="ChallanPeriodStartDate"
          type="date"
          value={formData.ChallanPeriodStartDate}
          onChange={handleChange}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ChallanPeriodEndDate">Period End Date</Label>
        <Input
          id="ChallanPeriodEndDate"
          name="ChallanPeriodEndDate"
          type="date"
          value={formData.ChallanPeriodEndDate}
          onChange={handleChange}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="TotalTaxAmount">Total Tax Amount</Label>
        <Input
          id="TotalTaxAmount"
          name="TotalTaxAmount"
          type="number"
          placeholder="0.00"
          step="0.01"
          value={formData.TotalTaxAmount}
          onChange={handleChange}
          disabled={isLoading}
        />
      </div>
    </form>
  );
}

export default ChallanForm;
