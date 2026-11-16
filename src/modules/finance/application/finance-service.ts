import { prisma } from "@/infrastructure/database/prisma";
import { RequestPayoutInput, ApprovePayoutInput, ProcessRefundInput } from "./dto";
import { AppError } from "@/lib/errors/api-error";
import {
  LedgerEntryType,
  OrderStatus,
  PayoutStatus,
  SellerVerificationStatus,
} from "@prisma/client";
import Decimal from "decimal.js";
import crypto from "crypto";

function generatePayoutNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 7).replace("-", "");
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `PAY-${dateStr}-${rand}`;
}

export class FinanceService {
  /**
   * Seller submits a withdrawal request against their cleared available balance.
   */
  async requestPayout(sellerId: string, input: RequestPayoutInput) {
    const payoutAmount = new Decimal(input.amount).toDecimalPlaces(2);

    return prisma.$transaction(async (tx) => {
      // 1. Fetch seller profile with row lock
      const profile = await tx.sellerProfile.findUnique({
        where: { id: sellerId },
        include: {
          payoutAccounts: true,
        },
      });

      if (!profile) throw AppError.notFound("Seller profile not found");

      if (profile.verificationStatus !== SellerVerificationStatus.VERIFIED) {
        throw AppError.forbidden(
          "Your seller account must be fully verified by administrators before requesting payouts."
        );
      }

      const account = profile.payoutAccounts.find((a) => a.id === input.payoutAccountId);
      if (!account) {
        throw AppError.badRequest("Selected payout account does not belong to this seller.");
      }

      if (new Decimal(profile.availableBalance).lessThan(payoutAmount)) {
        throw AppError.badRequest(
          `Insufficient available balance. Requested: ${payoutAmount.toFixed(2)}, Available: ${new Decimal(profile.availableBalance).toFixed(2)}`
        );
      }

      // 2. Deduct from available balance immediately
      await tx.sellerProfile.update({
        where: { id: sellerId },
        data: {
          availableBalance: {
            decrement: payoutAmount,
          },
        },
      });

      // 3. Create Payout record
      const payoutNumber = generatePayoutNumber();
      const payout = await tx.payout.create({
        data: {
          payoutNumber,
          sellerId,
          payoutAccountId: input.payoutAccountId,
          amount: payoutAmount,
          currency: input.currency.toUpperCase(),
          status: PayoutStatus.REQUESTED,
        },
      });

      return payout;
    });
  }

  /**
   * Finance Manager approves and confirms fund disbursement.
   */
  async approvePayout(financeStaffId: string, input: ApprovePayoutInput) {
    return prisma.$transaction(async (tx) => {
      const payout = await tx.payout.findUnique({
        where: { id: input.payoutId },
        include: { seller: true },
      });

      if (!payout) throw AppError.notFound("Payout record not found");
      if (payout.status !== PayoutStatus.REQUESTED) {
        throw AppError.badRequest(`Payout cannot be approved from status ${payout.status}`);
      }

      // Update payout status
      const updated = await tx.payout.update({
        where: { id: input.payoutId },
        data: {
          status: PayoutStatus.COMPLETED,
          processedAt: new Date(),
          transactionProof: input.transactionProof,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: financeStaffId,
          action: "PAYOUT_COMPLETED",
          resource: "Payout",
          resourceId: input.payoutId,
          metadata: {
            sellerId: payout.sellerId,
            amount: payout.amount.toString(),
            proof: input.transactionProof,
          },
        },
      });

      return updated;
    });
  }

  /**
   * Processes an order refund, compensating ledger rows, and revoking entitlements.
   */
  async processRefund(financeStaffId: string, input: ProcessRefundInput) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: input.orderId },
        include: {
          items: true,
        },
      });

      if (!order) throw AppError.notFound("Order not found");
      if (order.status !== OrderStatus.COMPLETED) {
        throw AppError.badRequest(`Cannot refund order in status ${order.status}`);
      }

      // 1. Create Refund record
      const refund = await tx.refund.create({
        data: {
          orderId: order.id,
          amount: order.totalAmount,
          currency: order.currency,
          reason: input.reason,
          processedBy: financeStaffId,
        },
      });

      // 2. Mark order as REFUNDED
      await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.REFUNDED },
      });

      // 3. Revoke all digital entitlements for this order
      await tx.entitlement.updateMany({
        where: { orderId: order.id },
        data: { isActive: false },
      });

      // 4. Reverse seller earnings via compensating ledger entries
      for (const item of order.items) {
        // Compensating ledger entry (negative net earning)
        await tx.saleLedger.create({
          data: {
            orderId: order.id,
            orderItemId: item.id,
            sellerId: item.sellerId,
            entryType: LedgerEntryType.REFUND_REVERSAL,
            amount: new Decimal(item.sellerNetAmount).negated(),
            currency: order.currency,
            description: `Refund reversal for "${item.bookTitleSnapshot}" - ${input.reason}`,
          },
        });

        // Deduct from seller balance
        await tx.sellerProfile.update({
          where: { id: item.sellerId },
          data: {
            pendingBalance: { decrement: item.sellerNetAmount },
            lifetimeEarnings: { decrement: item.sellerNetAmount },
          },
        });
      }

      // 5. System audit
      await tx.auditLog.create({
        data: {
          userId: financeStaffId,
          action: "ORDER_REFUNDED",
          resource: "Order",
          resourceId: order.id,
          metadata: {
            refundId: refund.id,
            amount: order.totalAmount.toString(),
            reason: input.reason,
          },
        },
      });

      return refund;
    });
  }

  /**
   * Retrieves immutable financial ledger statement for a seller.
   */
  async getSellerLedger(sellerId: string) {
    return prisma.saleLedger.findMany({
      where: { sellerId },
      include: {
        order: {
          select: { orderNumber: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Lists all pending payout withdrawal requests for finance review.
   */
  async getPendingPayouts() {
    return prisma.payout.findMany({
      where: { status: PayoutStatus.REQUESTED },
      include: {
        seller: {
          select: {
            businessName: true,
            sellerType: true,
            user: { select: { email: true } },
          },
        },
        payoutAccount: true,
      },
      orderBy: { createdAt: "asc" },
    });
  }
}

export const financeService = new FinanceService();
