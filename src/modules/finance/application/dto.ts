import { z } from "zod";

export const requestPayoutSchema = z.object({
  payoutAccountId: z.string().uuid("Invalid payout account ID"),
  amount: z.coerce.number().positive("Payout amount must be positive"),
  currency: z.string().length(3).default("ETB"),
});

export type RequestPayoutInput = z.infer<typeof requestPayoutSchema>;

export const approvePayoutSchema = z.object({
  payoutId: z.string().uuid("Invalid payout ID"),
  transactionProof: z.string().min(2, "Transaction proof or bank reference code is required"),
});

export type ApprovePayoutInput = z.infer<typeof approvePayoutSchema>;

export const processRefundSchema = z.object({
  orderId: z.string().uuid("Invalid order ID"),
  reason: z.string().min(5, "Refund reason must be specified").max(1000),
});

export type ProcessRefundInput = z.infer<typeof processRefundSchema>;
