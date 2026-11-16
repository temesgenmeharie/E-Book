import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { financeService } from "../../src/modules/finance/application/finance-service";
import { sellerService } from "../../src/modules/sellers/application/seller-service";
import { authService } from "../../src/modules/identity/application/auth-service";
import { prisma } from "../../src/infrastructure/database/prisma";
import {
  LedgerEntryType,
  OrderStatus,
  PayoutStatus,
  RoleType,
  SellerType,
  SellerVerificationStatus,
} from "@prisma/client";
import Decimal from "decimal.js";

describe("FinanceService Integration Test", () => {
  const sellerEmail = `fin_seller_${Date.now()}@example.com`;
  const customerEmail = `fin_cust_${Date.now()}@example.com`;
  const financeEmail = `fin_staff_${Date.now()}@example.com`;

  let sellerUserId: string;
  let customerId: string;
  let financeStaffId: string;
  let sellerId: string;
  let payoutAccountId: string;
  let bookId: string;
  let orderId: string;
  let payoutId: string;

  beforeAll(async () => {
    // 1. Finance Staff
    const staffRes = await authService.register({
      email: financeEmail,
      password: "Password123!",
      fullName: "Finance Manager",
    });
    financeStaffId = staffRes.user.id;
    const finRole = await prisma.role.findUnique({ where: { name: RoleType.FINANCE_MANAGER } });
    if (finRole) {
      await prisma.userRole.create({ data: { userId: financeStaffId, roleId: finRole.id } });
    }

    // 2. Customer
    const custRes = await authService.register({
      email: customerEmail,
      password: "Password123!",
      fullName: "Refunding Customer",
    });
    customerId = custRes.user.id;

    // 3. Seller
    const sellerRes = await authService.register({
      email: sellerEmail,
      password: "Password123!",
      fullName: "Royalty Author",
    });
    sellerUserId = sellerRes.user.id;
    const seller = await sellerService.onboardSeller(sellerUserId, {
      sellerType: SellerType.INDIVIDUAL_AUTHOR,
      businessName: "Royalty Author Press",
    });
    sellerId = seller.id;

    const account = await sellerService.addPayoutAccount(sellerUserId, {
      provider: "TELEBIRR",
      accountHolder: "Royalty Author",
      accountNumber: "0922334455",
      isDefault: true,
    });
    payoutAccountId = account.id;

    const cat = await prisma.category.findFirst();
    if (!cat) throw new Error("Category missing");

    // 4. Create sample Book and completed order for refund test
    const book = await prisma.book.create({
      data: {
        sellerId,
        title: "Refundable Novel",
        slug: `refundable-novel-${Date.now()}`,
        description: "Testing refund and compensating ledger rows.",
        authorName: "Royalty Author",
        coverImageKey: "covers/test.jpg",
        status: "PUBLISHED",
        prices: { create: { currency: "ETB", amount: 300.0 } },
      },
    });
    bookId = book.id;

    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-REF-${Date.now()}`,
        userId: customerId,
        currency: "ETB",
        totalAmount: 300.0,
        status: OrderStatus.COMPLETED,
        items: {
          create: {
            bookId,
            sellerId,
            bookTitleSnapshot: "Refundable Novel",
            authorNameSnapshot: "Royalty Author",
            priceSnapshot: 300.0,
            commissionRate: 0.15,
            commissionAmount: 45.0,
            sellerNetAmount: 255.0,
          },
        },
      },
      include: { items: true },
    });
    orderId = order.id;

    // Initial positive sale ledger row & entitlement
    await prisma.saleLedger.create({
      data: {
        orderId,
        orderItemId: order.items[0].id,
        sellerId,
        entryType: LedgerEntryType.SELLER_NET_EARNING,
        amount: 255.0,
        currency: "ETB",
        description: "Net earnings from sale",
      },
    });

    await prisma.sellerProfile.update({
      where: { id: sellerId },
      data: {
        pendingBalance: 255.0,
        lifetimeEarnings: 255.0,
      },
    });

    await prisma.entitlement.create({
      data: {
        userId: customerId,
        bookId,
        orderId,
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    if (payoutId) {
      await prisma.payout.deleteMany({ where: { id: payoutId } });
    }
    if (orderId) {
      await prisma.entitlement.deleteMany({ where: { orderId } });
      await prisma.refund.deleteMany({ where: { orderId } });
      await prisma.saleLedger.deleteMany({ where: { orderId } });
      await prisma.orderItem.deleteMany({ where: { orderId } });
      await prisma.order.deleteMany({ where: { id: orderId } });
    }
    if (bookId) {
      await prisma.bookPrice.deleteMany({ where: { bookId } });
      await prisma.book.deleteMany({ where: { id: bookId } });
    }
    if (sellerId) {
      await prisma.sellerPayoutAccount.deleteMany({ where: { sellerId } });
      await prisma.sellerProfile.deleteMany({ where: { id: sellerId } });
    }
    await prisma.user.deleteMany({
      where: { email: { in: [sellerEmail, customerEmail, financeEmail] } },
    });
  });

  it("blocks payout request if seller is UNVERIFIED", async () => {
    await expect(
      financeService.requestPayout(sellerId, {
        payoutAccountId,
        amount: 100.0,
      })
    ).rejects.toThrow("Your seller account must be fully verified");
  });

  it("processes payout request for VERIFIED seller with sufficient balance", async () => {
    // 1. Mark seller as VERIFIED and grant 1000 ETB cleared available balance
    await prisma.sellerProfile.update({
      where: { id: sellerId },
      data: {
        verificationStatus: SellerVerificationStatus.VERIFIED,
        availableBalance: 1000.0,
      },
    });

    const payout = await financeService.requestPayout(sellerId, {
      payoutAccountId,
      amount: 600.0,
      currency: "ETB",
    });

    expect(payout.id).toBeDefined();
    expect(payout.amount.toFixed(2)).toBe("600.00");
    expect(payout.status).toBe(PayoutStatus.REQUESTED);
    payoutId = payout.id;

    // Available balance should be decremented from 1000 to 400
    const profile = await prisma.sellerProfile.findUnique({ where: { id: sellerId } });
    expect(profile?.availableBalance.toFixed(2)).toBe("400.00");
  });

  it("approves payout withdrawal with bank disbursement reference", async () => {
    const approved = await financeService.approvePayout(financeStaffId, {
      payoutId,
      transactionProof: "CBE-TX-9988776655",
    });

    expect(approved.status).toBe(PayoutStatus.COMPLETED);
    expect(approved.transactionProof).toBe("CBE-TX-9988776655");
    expect(approved.processedAt).not.toBeNull();
  });

  it("processes order refund, compensating ledger rows, and revoking customer entitlement", async () => {
    const refund = await financeService.processRefund(financeStaffId, {
      orderId,
      reason: "Customer accidental duplicate purchase",
    });

    expect(refund.id).toBeDefined();
    expect(refund.amount.toFixed(2)).toBe("300.00");

    // 1. Order status is REFUNDED
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    expect(order?.status).toBe(OrderStatus.REFUNDED);

    // 2. Compensating ledger row recorded
    const reversal = await prisma.saleLedger.findFirst({
      where: { orderId, entryType: LedgerEntryType.REFUND_REVERSAL },
    });
    expect(reversal).not.toBeNull();
    expect(reversal?.amount.toFixed(2)).toBe("-255.00");

    // 3. Customer entitlement is REVOKED
    const entitlement = await prisma.entitlement.findUnique({
      where: { userId_bookId: { userId: customerId, bookId } },
    });
    expect(entitlement?.isActive).toBe(false);
  });
});
