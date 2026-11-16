import { z } from "zod";
import { BookFormat } from "@prisma/client";

export const priceItemSchema = z.object({
  currency: z.string().length(3).toUpperCase(), // e.g. "ETB", "USD"
  amount: z.coerce.number().positive("Price must be greater than 0"),
});

export const createBookDraftSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(255).trim(),
  subtitle: z.string().max(255).optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  authorName: z.string().min(2, "Author name must be at least 2 characters").max(128).trim(),
  isbn: z.string().max(32).optional(),
  language: z.string().min(2).max(10).default("en"),
  publicationDate: z.string().optional(), // ISO date string
  coverImageKey: z.string().min(1, "Cover image is required"),
  categoryIds: z.array(z.string().uuid("Invalid category ID")).min(1, "Select at least one category"),
  prices: z.array(priceItemSchema).min(1, "At least one currency price is required"),
});

export type CreateBookDraftInput = z.infer<typeof createBookDraftSchema>;

export const attachBookFileSchema = z.object({
  format: z.nativeEnum(BookFormat),
  storageKey: z.string().min(1, "Storage key is required"),
  originalName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(128),
  sizeBytes: z.coerce.number().positive("File size must be positive"),
  checksumSha256: z.string().length(64, "Checksum must be 64-character SHA-256 hash"),
  isSample: z.boolean().default(false),
});

export type AttachBookFileInput = z.infer<typeof attachBookFileSchema>;
