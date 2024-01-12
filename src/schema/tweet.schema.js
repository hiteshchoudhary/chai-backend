import { z } from "zod";

export const CreateTweetSchema = z.object({
  content: z
    .string()
    .trim()
    .min(30, "A tweet should have minimum 30 characters")
    .max(400, "A tweet can have maximum 400 characters"),
});
