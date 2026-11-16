import { z } from "zod";
import { ModerationAction } from "@prisma/client";

export const reviewActionSchema = z.object({
  bookId: z.string().uuid("Invalid book ID"),
  action: z.nativeEnum(ModerationAction),
  notes: z.string().max(2000).optional(),
});

export type ReviewActionInput = z.infer<typeof reviewActionSchema>;

