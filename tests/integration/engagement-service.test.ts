import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { engagementService } from "../../src/modules/engagement/application/engagement-service";
import { sellerService } from "../../src/modules/sellers/application/seller-service";
import { authService } from "../../src/modules/identity/application/auth-service";
import { prisma } from "../../src/infrastructure/database/prisma";
import { OrderStatus, SellerType } from "@prisma/client";

describe("EngagementService Integration Test", () => {
  const buyerEmail = `eng_buyer_${Date.now()}@example.com`;
  const nonBuyerEmail = `eng_nonbuyer_${Date.now()}@example.com`;
  const authorEmail = `eng_author_${Date.now()}@example.com`;

  let buyerId: string;
  let nonBuyerId: string;
  let sellerUserId: string;
  let sellerId: string;
  let bookId: string;
  let orderId: string;

  beforeAll(async () => {
    // 1. Users
    const bRes = await authService.register({
      email: buyerEmail,
      password: "Password123!",
      fullName: "Verified Reviewer",
    });
    buyerId = bRes.user.id;

    const nbRes = await authService.register({
      email: nonBuyerEmail,
      password: "Password123!",
      fullName: "Non Buyer",
    });
    nonBuyerId = nbRes.user.id;

    const aRes = await authService.register({
      email: authorEmail,
      password: "Password123!",
      fullName: "Reviewed Author",
    });
    sellerUserId = aRes.user.id;
    const seller = await sellerService.onboardSeller(sellerUserId, {
      sellerType: SellerType.INDIVIDUAL_AUTHOR,
      businessName: "Reviewed Press",
    });
    sellerId = seller.id;

    // 2. Book
    const book = await prisma.book.create({
      data: {
        sellerId,
        title: "Reviewable Masterpiece",
        slug: `reviewable-masterpiece-${Date.now()}`,
        description: "Testing reviews and wishlists.",
        authorName: "Reviewed Author",
        coverImageKey: "covers/reviewed.jpg",
        status: "PUBLISHED",
      },
    });
    bookId = book.id;

    // 3. Purchase entitlement for buyerId
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-ENG-${Date.now()}`,
        userId: buyerId,
        currency: "ETB",
        totalAmount: 100,
        status: OrderStatus.COMPLETED,
        items: {
          create: {
            bookId,
            sellerId,
            bookTitleSnapshot: "Reviewable Masterpiece",
            authorNameSnapshot: "Reviewed Author",
            priceSnapshot: 100,
            commissionRate: 0.15,
            commissionAmount: 15,
            sellerNetAmount: 85,
          },
        },
      },
    });
    orderId = order.id;

    await prisma.entitlement.create({
      data: {
        userId: buyerId,
        bookId,
        orderId,
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    if (orderId) {
      await prisma.review.deleteMany({ where: { bookId } });
      await prisma.wishlistItem.deleteMany({ where: { bookId } });
      await prisma.entitlement.deleteMany({ where: { orderId } });
      await prisma.orderItem.deleteMany({ where: { orderId } });
      await prisma.order.deleteMany({ where: { id: orderId } });
    }
    if (bookId) {
      await prisma.book.deleteMany({ where: { id: bookId } });
    }
    if (sellerId) {
      await prisma.sellerProfile.deleteMany({ where: { id: sellerId } });
    }
    await prisma.user.deleteMany({
      where: { email: { in: [buyerEmail, nonBuyerEmail, authorEmail] } },
    });
  });

  it("blocks non-purchasers from leaving reviews with 403 Forbidden", async () => {
    await expect(
      engagementService.addReview(nonBuyerId, bookId, 5, "I didn't buy it but it looks great!")
    ).rejects.toThrow("Only verified purchasers of this book can submit reviews.");
  });

  it("records review for verified purchaser and updates average rating", async () => {
    const review = await engagementService.addReview(
      buyerId,
      bookId,
      5,
      "Outstanding literary depth and authentic storytelling."
    );

    expect(review.rating).toBe(5);
    expect(review.comment).toContain("Outstanding literary depth");

    const book = await prisma.book.findUnique({ where: { id: bookId } });
    expect(book?.reviewCount).toBe(1);
    expect(book?.averageRating.toFixed(2)).toBe("5.00");
  });

  it("toggles book in customer wishlist", async () => {
    const addResult = await engagementService.toggleWishlist(nonBuyerId, bookId);
    expect(addResult.inWishlist).toBe(true);

    const wishlist = await engagementService.getUserWishlist(nonBuyerId);
    expect(wishlist.some((b) => b.id === bookId)).toBe(true);

    const removeResult = await engagementService.toggleWishlist(nonBuyerId, bookId);
    expect(removeResult.inWishlist).toBe(false);
  });
});
