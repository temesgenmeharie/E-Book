import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { cartService } from "../../src/modules/cart/application/cart-service";
import { orderService } from "../../src/modules/orders/application/order-service";
import { catalogService } from "../../src/modules/catalog/application/catalog-service";
import { sellerService } from "../../src/modules/sellers/application/seller-service";
import { authService } from "../../src/modules/identity/application/auth-service";
import { moderationService } from "../../src/modules/moderation/application/moderation-service";
import { prisma } from "../../src/infrastructure/database/prisma";
import { BookFormat, ModerationAction, OrderStatus, RoleType, SellerType } from "@prisma/client";

describe("Cart and Orders Integration Test", () => {
  const customerEmail = `order_cust_${Date.now()}@example.com`;
  const sellerEmail = `order_seller_${Date.now()}@example.com`;
  const modEmail = `order_mod_${Date.now()}@example.com`;

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
      fullName: "Order Customer",
    });
    customerId = custRes.user.id;

    // 2. Seller & Book
    const sellerRes = await authService.register({
      email: sellerEmail,
      password: "Password123!",
      fullName: "Order Seller",
    });
    sellerUserId = sellerRes.user.id;
    const seller = await sellerService.onboardSeller(sellerUserId, {
      sellerType: SellerType.INDIVIDUAL_AUTHOR,
      businessName: "Order Author Press",
    });
    sellerId = seller.id;

    // 3. Moderator
    const modRes = await authService.register({
      email: modEmail,
      password: "Password123!",
      fullName: "Order Mod",
    });
    modUserId = modRes.user.id;
    const modRole = await prisma.role.findUnique({ where: { name: RoleType.CONTENT_MODERATOR } });
    if (modRole) {
      await prisma.userRole.create({ data: { userId: modUserId, roleId: modRole.id } });
    }

    const cat = await prisma.category.findFirst();
    if (!cat) throw new Error("Category missing");
    categoryId = cat.id;

    // Create & Publish Book
    const book = await catalogService.createBookDraft(sellerId, {
      title: "Commercial Order Test Book",
      description: "Testing checkout order creation and financial item snapshots.",
      authorName: "Commercial Author",
      coverImageKey: "covers/order_test.jpg",
      categoryIds: [categoryId],
      prices: [{ currency: "ETB", amount: 400.0 }],
    });
    bookId = book.id;

    await catalogService.attachBookFile(sellerId, bookId, {
      format: BookFormat.PDF,
      storageKey: `books/order/test_${Date.now()}.pdf`,
      originalName: "test.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1000000,
      checksumSha256: "0000000000000000000000000000000000000000000000000000000000000000",
      isSample: false,
    });

    await catalogService.submitForModeration(sellerId, bookId);
    await moderationService.reviewBook(modUserId, {
      bookId,
      action: ModerationAction.APPROVE,
    });
  });

  afterAll(async () => {
    if (orderId) {
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

  it("adds a published book to the shopping cart", async () => {
    await cartService.addItem(customerId, bookId);

    const cart = await cartService.getCart(customerId, "ETB");
    expect(cart.items.length).toBe(1);
    expect(cart.items[0].bookId).toBe(bookId);
    expect(cart.totalAmount).toBe("400.00");
  });

  it("creates a pending order from cart with exact financial snapshots", async () => {
    const order = await orderService.createOrderFromCart(customerId, "ETB");
    orderId = order.id;

    expect(order.orderNumber).toMatch(/^ORD-\d{6}-[A-Z0-9]{6}$/);
    expect(order.status).toBe(OrderStatus.PENDING);
    expect(order.currency).toBe("ETB");
    expect(order.totalAmount.toFixed(2)).toBe("400.00");
    expect(order.items.length).toBe(1);

    const item = order.items[0];
    expect(item.bookId).toBe(bookId);
    expect(item.sellerId).toBe(sellerId);
    expect(item.priceSnapshot.toFixed(2)).toBe("400.00");
    expect(item.commissionRate.toFixed(4)).toBe("0.1500");
    expect(item.commissionAmount.toFixed(2)).toBe("60.00"); // 15% of 400 = 60
    expect(item.sellerNetAmount.toFixed(2)).toBe("340.00"); // 400 - 60 = 340

    // Verify cart was automatically cleared
    const cart = await cartService.getCart(customerId, "ETB");
    expect(cart.items.length).toBe(0);
  });
});
