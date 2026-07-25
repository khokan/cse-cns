import { z } from "zod";

export const iQuizGeneratorSchema = z.object({
    topic: z.string()
        .min(3, "Topic must be at least 3 characters long.")
        .max(100, "Topic must not exceed 100 characters."),
    difficulty: z.enum(["easy", "medium", "hard"])
        .refine((val) => ["easy", "medium", "hard"].includes(val), {
            message: "Please select a valid difficulty level.",
        }),
    gradeLevel: z.string()
        .min(2, "Grade level is required.")
        .max(50, "Grade level must not exceed 50 characters."),
    numberOfQuestions: z.coerce.number()
        .min(1, "At least 1 question is required.")
        .max(10, "Maximum 10 questions allowed."),
});

export type IQuizGeneratorPayload = z.infer<typeof iQuizGeneratorSchema>;