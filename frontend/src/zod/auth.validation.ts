import { z } from "zod";

export const loginZodSchema = z.object({
    email : z.email("Invalid email address"),
    password : z.string()
        .min(1, "Password is required")
        .min(8, "Password must be at least 8 characters long")
        // .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        // .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        // .regex(/[0-9]/, "Password must contain at least one number")
        // .regex(/[@$!%*?&]/, "Password must contain at least one special character (@, $, !, %, *, ?, &)")
})

export const registerZodSchema = z.object({
    name: z.string()
        .min(1, "Full name is required")
        .min(2, "Name must be at least 2 characters"),
    email: z.email("Invalid email address"),
    password: z.string()
        .min(1, "Password is required")
        .min(8, "Password must be at least 8 characters long"),
    trecHolderId: z.string()
        .min(1, "Member ID / TREC ID is required")
        .min(3, "Member ID must be at least 3 characters"),
});

export type ILoginPayload = z.infer<typeof loginZodSchema>;
export type IRegisterPayload = z.infer<typeof registerZodSchema>;