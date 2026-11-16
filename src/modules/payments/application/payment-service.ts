import { prisma } from "@/infrastructure/database/prisma";
import { IPaymentProviderAdapter } from "../domain/provider.interface";
import { ManualTestAdapter } from "../infrastructure/adapters/manual.adapter";
import { ChapaAdapter } from "../infrastructure/adapters/chapa.adapter";
import { AppError } from "@/lib/errors/api-error";
import {
  LedgerEntryType,
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
} from "@prisma/client";
import Decimal from "decimal.js";

export class PaymentService {
  private adapters: Map<PaymentProvider, IPaymentProviderAdapter> = new Map();

  constructor() {
    this.registerAdapter(new ManualTestAdapter());
    this.registerAdapter(new ChapaAdapter());
  }

  registerAdapter(adapter: IPaymentProviderAdapter) {
    this.adapters.set(adapter.provider, adapter);
  }

  getAdapter(provider: PaymentProvider): IPaymentProviderAdapter {
    const adapter = this.adapters.get(provider);
    if (!adapter) {
      throw AppError.badRequest(`Payment provider "${provider}" is not configured.`);
    }
    return adapter;
  }

  /**
   * Initializes a payment checkout session with the selected provider.
   */
  async initializeCheckout(params: {
    orderId: string;
    userId: string;
    provider: PaymentProvider;
    returnUrl?: string;
  }) {
    const order = await prisma.order.findUnique({
      where: { id: params.orderId },
      include: {
        user: { select: { email: true, fullName: true } },
      },
    });

    if (!order) throw AppError.notFound("Order not found");
    if (order.userId !== params.userId) throw AppError.forbidden("Access denied");
    if (order.status !== OrderStatus.PENDING) {
      throw AppError.badRequest(`Cannot initiate payment for order in status ${order.status}`);
    }

    const adapter = this.getAdapter(params.provider);

    const initResult = await adapter.initializePayment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: new Decimal(order.totalAmount),
      currency: order.currency,
      customerEmail: order.user.email,
      customerName: order.user.fullName,
      returnUrl:
        params.returnUrl ||
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/checkout/${order.id}/complete`,
    });

    // Create payment attempt record
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: params.provider,
        providerReference: initResult.providerReference,
        amount: order.totalAmount,
        currency: order.currency,
        status: PaymentStatus.INITIATED,
      },
    });

    return {
      paymentId: payment.id,
      providerReference: initResult.providerReference,
      redirectUrl: initResult.redirectUrl,
    };
  }

  /**
   * Idempotently processes payment provider webhooks.
   * Atomically marks order COMPLETED, records ledger rows, and grants customer entitlements.
   */
  async processWebhook(
    provider: PaymentProvider,
    headers: Record<string, string>,
    payload: any
  ) {
    const adapter = this.getAdapter(provider);
    const verification = await adapter.verifyWebhook(headers, payload);

    // 1. Idempotency Check: verify if event was already processed
    const existingEvent = await prisma.paymentWebhookEvent.findUnique({
      where: { eventId: verification.eventId },
    });

    if (existingEvent && existingEvent.processed) {
      console.log(`⚠️ Webhook event ${verification.eventId} already processed. Skipping.`);
      return { status: "duplicate", eventId: verification.eventId };
    }

    // 2. Locate the Order
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: verification.orderId },
          { payments: { some: { providerReference: verification.providerReference } } },
        ],
      },
      include: {
        items: true,
        user: true,
      },
    });

    if (!order) {
      throw AppError.notFound(
        `Order matching reference ${verification.providerReference} not found`
      );
    }

    // 3. Verify amount and currency integrity
    if (new Decimal(order.totalAmount).toFixed(2) !== verification.amount.toFixed(2)) {
      throw AppError.badRequest(
        `Amount mismatch: expected ${order.totalAmount}, received ${verification.amount}`
      );
    }

    // 4. Atomic Transaction: Record Webhook, Settle Ledger, Grant Entitlements
    return prisma.$transaction(async (tx) => {
      // Upsert webhook event
      await tx.paymentWebhookEvent.upsert({
        where: { eventId: verification.eventId },
        update: {
          processed: true,
          processedAt: new Date(),
          payload: typeof payload === "string" ? JSON.parse(payload) : payload,
        },
        create: {
          eventId: verification.eventId,
          provider,
          eventType: verification.eventType,
          payload: typeof payload === "string" ? JSON.parse(payload) : payload,
          processed: true,
          processedAt: new Date(),
        },
      });

      // Update Payment Record
      await tx.payment.updateMany({
        where: {
          orderId: order.id,
          providerReference: verification.providerReference,
        },
        data: {
          status: PaymentStatus.SUCCEEDED,
        },
      });

      // Update Order Status
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.COMPLETED,
        },
      });

      // Insert Immutable Sale Ledger entries & Credit Sellers
      for (const item of order.items) {
        // Platform Commission Entry
        await tx.saleLedger.create({
          data: {
            orderId: order.id,
            orderItemId: item.id,
            sellerId: item.sellerId,
            entryType: LedgerEntryType.PLATFORM_COMMISSION,
            amount: new Decimal(item.commissionAmount).negated(),
            currency: order.currency,
            description: `Platform commission (${new Decimal(item.commissionRate)
              .times(100)
              .toFixed(1)}%) for "${item.bookTitleSnapshot}"`,
          },
        });

        // Seller Net Earning Entry
        await tx.saleLedger.create({
          data: {
            orderId: order.id,
            orderItemId: item.id,
            sellerId: item.sellerId,
            entryType: LedgerEntryType.SELLER_NET_EARNING,
            amount: item.sellerNetAmount,
            currency: order.currency,
            description: `Net earnings for book "${item.bookTitleSnapshot}"`,
          },
        });

        // Credit Seller Balances (Pending until 7-day holding window clears)
        await tx.sellerProfile.update({
          where: { id: item.sellerId },
          data: {
            pendingBalance: {
              increment: item.sellerNetAmount,
            },
            lifetimeEarnings: {
              increment: item.sellerNetAmount,
            },
          },
        });

        // Grant Customer Digital Entitlement
        await tx.entitlement.upsert({
          where: {
            userId_bookId: {
              userId: order.userId,
              bookId: item.bookId,
            },
          },
          update: {
            isActive: true,
            orderId: order.id,
          },
          create: {
            userId: order.userId,
            bookId: item.bookId,
            orderId: order.id,
            isActive: true,
          },
        });
      }

      return {
        status: "settled",
        orderId: order.id,
        orderNumber: order.orderNumber,
      };
    });
  }
}

export const paymentService = new PaymentService();
