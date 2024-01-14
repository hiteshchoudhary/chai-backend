import { z } from "zod";

export const addCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(10, "The comment should be at least of 10 characters")
    .max(800, "The comment should be at most of 800 characters"),
});
