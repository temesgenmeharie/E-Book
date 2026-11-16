import { z } from "zod";
import { SellerType } from "@prisma/client";

export const onboardSellerSchema = z.object({
  sellerType: z.nativeEnum(SellerType),
  businessName: z.string().min(2, "Business or Author name must be at least 2 characters").max(255).trim(),
  bio: z.string().max(2000).optional(),
  websiteUrl: z.string().url("Invalid URL").max(512).optional().or(z.literal("")),
  taxId: z.string().max(64).optional(),
});

export type OnboardSellerInput = z.infer<typeof onboardSellerSchema>;

export const payoutAccountSchema = z.object({
  provider: z.string().min(2, "Provider is required").max(64), // e.g. "TELEBIRR", "CBE_BIRR", "CHAPA_BANK"
  accountHolder: z.string().min(2, "Account holder name is required").max(255).trim(),
  accountNumber: z.string().min(4, "Account number is required").max(128).trim(),
  bankName: z.string().max(128).optional(),
  isDefault: z.boolean().default(true),
});

export type PayoutAccountInput = z.infer<typeof payoutAccountSchema>;

