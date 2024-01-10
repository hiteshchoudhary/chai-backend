import { z } from "zod";

export const PublishAVideoBodySchema = z.object({
  title: z
    .string()
    .trim()
    .min(10, "The title should be at least 10 characters long!!")
    .max(100, "The title can be at most 100 characters long!!"),
  description: z
    .string()
    .trim()
    .min(50, "The description should be at last 50 characters long!!")
    .max(1000, "THe description can be at most 1000 characters long!!"),
});
