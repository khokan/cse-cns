import { z } from "zod";

export const createTaxToNBRZodSchema = z.object({
  fromDate: z
    .union([z.string(), z.date()])
    .optional()
    .nullable(),
  toDate: z
    .union([z.string(), z.date()])
    .optional()
    .nullable(),
  contractNumber: z
    .string()
    .optional()
    .nullable(),
  paymentDate: z
    .union([z.string(), z.date()])
    .optional()
    .nullable(),
  deducteeTIN: z
    .string()
    .optional()
    .nullable(),
  trecHolderName: z
    .string()
    .optional()
    .nullable(),
  mobileNumber: z
    .string()
    .optional()
    .nullable(),
  emailAddress: z
    .string()
    .email("Invalid email address")
    .optional()
    .nullable(),
  sectionNumber: z
    .string()
    .optional()
    .nullable(),
  tradeVolume: z
    .number()
    .optional()
    .nullable(),
  cseCommission: z
    .number()
    .optional()
    .nullable(),
  paymentAmount: z
    .number()
    .optional()
    .nullable(),
  memberId: z
    .string()
    .min(1, "Member ID is required"),
});

export const updateTaxToNBRZodSchema = z.object({
  fromDate: z
    .union([z.string(), z.date()])
    .optional()
    .nullable(),
  toDate: z
    .union([z.string(), z.date()])
    .optional()
    .nullable(),
  contractNumber: z
    .string()
    .optional()
    .nullable(),
  paymentDate: z
    .union([z.string(), z.date()])
    .optional()
    .nullable(),
  deducteeTIN: z
    .string()
    .optional()
    .nullable(),
  trecHolderName: z
    .string()
    .optional()
    .nullable(),
  mobileNumber: z
    .string()
    .optional()
    .nullable(),
  emailAddress: z
    .string()
    .email("Invalid email address")
    .optional()
    .nullable(),
  sectionNumber: z
    .string()
    .optional()
    .nullable(),
  tradeVolume: z
    .number()
    .optional()
    .nullable(),
  cseCommission: z
    .number()
    .optional()
    .nullable(),
  paymentAmount: z
    .number()
    .optional()
    .nullable(),
  memberId: z
    .string()
    .optional(),
});

export type CreateTaxToNBRFormData = z.infer<typeof createTaxToNBRZodSchema>;
export type UpdateTaxToNBRFormData = z.infer<typeof updateTaxToNBRZodSchema>;
