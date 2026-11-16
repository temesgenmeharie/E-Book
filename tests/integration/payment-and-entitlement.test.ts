import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { paymentService } from "@backend/modules/payments/application/payment-service";
import { orderService } from "@backend/modules/orders/application/order-service";
import { cartService } from "@backend/modules/cart/application/cart-service";
import { catalogService } from "@backend/modules/catalog/application/catalog-service";
import { sellerService } from "@backend/modules/sellers/application/seller-service";
import { authService } from "@backend/modules/identity/application/auth-service";
import { moderationService } from "@backend/modules/moderation/application/moderation-service";
import { prisma } from "@database/client";
import {
  BookFormat,
  ModerationAction,
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  RoleType,
  SellerType,
} from "@prisma/client";
import Decimal from "decimal.js";

describe("Payment and Entitlement Integration Test", () => {
  const customerEmail = `pay_cust_${Date.now()}@example.com`;
  const sellerEmail = `pay_seller_${Date.now()}@example.com`;
  const modEmail = `pay_mod_${Date.now()}@example.com`;

  let customerId: string;
  let sellerUserId: string;
  let modUserId: string;
  let sellerId: string;
  let bookId: string;
  let categoryId: string;
  let orderId: string;

  beforeAll(async () => {
    // 1. Customer
    const custRes = await authService.register({
      email: customerEmail,
      password: "Password123!",
      fullName: "Paying Customer",
    });
    customerId = custRes.user.id;

    // 2. Seller
    const sellerRes = await authService.register({
      email: sellerEmail,
      password: "Password123!",
      fullName: "Paid Author",
    });
    sellerUserId = sellerRes.user.id;
    const seller = await sellerService.onboardSeller(sellerUserId, {
      sellerType: SellerType.INDIVIDUAL_AUTHOR,
      businessName: "Paid Author Press",
    });
    sellerId = seller.id;

    // 3. Moderator
    const modRes = await authService.register({
      email: modEmail,
      password: "Password123!",
      fullName: "Mod Staff",
    });
    modUserId = modRes.user.id;
    const modRole = await prisma.role.findUnique({ where: { name: RoleType.CONTENT_MODERATOR } });
    if (modRole) {
      await prisma.userRole.create({ data: { userId: modUserId, roleId: modRole.id } });
    }

    const cat = await prisma.category.findFirst();
    if (!cat) throw new Error("Category missing");
    categoryId = cat.id;

    // 4. Create and Approve Book
    const book = await catalogService.createBookDraft(sellerId, {
      title: "Commercial Masterpiece",
      description: "Testing end-to-end payment webhook idempotency and library entitlements.",
      authorName: "Master Author",
      coverImageKey: "covers/masterpiece.jpg",
      categoryIds: [categoryId],
      prices: [{ currency: "ETB", amount: 500.0 }],
    });
    bookId = book.id;

    await catalogService.attachBookFile(sellerId, bookId, {
      format: BookFormat.PDF,
      storageKey: `books/pay/masterpiece_${Date.now()}.pdf`,
      originalName: "masterpiece.pdf",
      mimeType: "application/pdf",
      sizeBytes: 2500000,
      checksumSha256: "0000000000000000000000000000000000000000000000000000000000000000",
      isSample: false,
    });

    await catalogService.submitForModeration(sellerId, bookId);
    await moderationService.reviewBook(modUserId, {
      bookId,
      action: ModerationAction.APPROVE,
    });

    // 5. Customer adds book to cart and creates pending order
    await cartService.addItem(customerId, bookId);
    const order = await orderService.createOrderFromCart(customerId, "ETB");
    orderId = order.id;
  });

  afterAll(async () => {
    if (orderId) {
      await prisma.entitlement.deleteMany({ where: { orderId } });
      await prisma.saleLedger.deleteMany({ where: { orderId } });
      await prisma.paymentWebhookEvent.deleteMany({});
      await prisma.payment.deleteMany({ where: { orderId } });
      await prisma.orderItem.deleteMany({ where: { orderId } });
      await prisma.order.deleteMany({ where: { id: orderId } });
    }
    if (bookId) {
      await prisma.moderationReview.deleteMany({ where: { bookId } });
      await prisma.bookFile.deleteMany({ where: { bookId } });
      await prisma.bookPrice.deleteMany({ where: { bookId } });
      await prisma.bookCategory.deleteMany({ where: { bookId } });
      await prisma.book.deleteMany({ where: { id: bookId } });
    }
    if (sellerId) {
      await prisma.sellerProfile.deleteMany({ where: { id: sellerId } });
    }
    await prisma.user.deleteMany({
      where: { email: { in: [customerEmail, sellerEmail, modEmail] } },
    });
  });

  it("initializes checkout and generates payment record", async () => {
    const init = await paymentService.initializeCheckout({
      orderId,
      userId: customerId,
      provider: PaymentProvider.MANUAL_TEST,
    });

    expect(init.paymentId).toBeDefined();
    expect(init.providerReference).toBeDefined();

    const payment = await prisma.payment.findUnique({
      where: { id: init.paymentId },
    });
    expect(payment?.status).toBe(PaymentStatus.INITIATED);
  });

  it("processes verified payment webhook and grants active digital entitlement", async () => {
    const eventId = `evt_test_${Date.now()}`;

    const result = await paymentService.processWebhook(
      PaymentProvider.MANUAL_TEST,
      {},
      {
        eventId,
        orderId,
        amount: 500.0,
        currency: "ETB",
        providerReference: "MANUAL_TEST_REF",
      }
    );

    expect(result.status).toBe("settled");

    // 1. Order status is now COMPLETED
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    expect(order?.status).toBe(OrderStatus.COMPLETED);

    // 2. Ledger entries recorded: Commission (-75.00) and Seller Net (+425.00)
    const ledgerRows = await prisma.saleLedger.findMany({ where: { orderId } });
    expect(ledgerRows.length).toBe(2);

    const netRow = ledgerRows.find((r) => r.entryType === "SELLER_NET_EARNING");
    expect(netRow?.amount.toFixed(2)).toBe("425.00");

    const commRow = ledgerRows.find((r) => r.entryType === "PLATFORM_COMMISSION");
    expect(commRow?.amount.toFixed(2)).toBe("-75.00");

    // 3. Customer entitlement is ACTIVE
    const entitlement = await prisma.entitlement.findUnique({
      where: {
        userId_bookId: {
          userId: customerId,
          bookId,
        },
      },
    });
    expect(entitlement).not.toBeNull();
    expect(entitlement?.isActive).toBe(true);

    // 4. Test Idempotency: replay the exact same webhook
    const replayResult = await paymentService.processWebhook(
      PaymentProvider.MANUAL_TEST,
      {},
      {
        eventId,
        orderId,
        amount: 500.0,
        currency: "ETB",
      }
    );

    expect(replayResult.status).toBe("duplicate");

    // Verify ledger was NOT duplicated (still exactly 2 rows)
    const ledgerAfter = await prisma.saleLedger.findMany({ where: { orderId } });
    expect(ledgerAfter.length).toBe(2);
  });
});

