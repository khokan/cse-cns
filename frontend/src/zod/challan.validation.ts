import { z } from "zod";

export const createChallanZodSchema = z.object({
  challanNumber: z
    .string()
    .min(1, "Challan number is required")
    .min(3, "Challan number must be at least 3 characters"),
  challanDate: z
    .union([z.string(), z.date()])
    .optional()
    .nullable(),
  challanPeriodStartDate: z
    .union([z.string(), z.date()])
    .optional()
    .nullable(),
  challanPeriodEndDate: z
    .union([z.string(), z.date()])
    .optional()
    .nullable(),
  totalTaxAmount: z
    .number()
    .optional()
    .nullable(),
});

export const updateChallanZodSchema = z.object({
  challanNumber: z
    .string()
    .min(3, "Challan number must be at least 3 characters")
    .optional(),
  challanDate: z
    .union([z.string(), z.date()])
    .optional()
    .nullable(),
  challanPeriodStartDate: z
    .union([z.string(), z.date()])
    .optional()
    .nullable(),
  challanPeriodEndDate: z
    .union([z.string(), z.date()])
    .optional()
    .nullable(),
  totalTaxAmount: z
    .number()
    .optional()
    .nullable(),
});

export type CreateChallanFormData = z.infer<typeof createChallanZodSchema>;
export type UpdateChallanFormData = z.infer<typeof updateChallanZodSchema>;
