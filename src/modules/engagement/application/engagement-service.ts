import { prisma } from "@/infrastructure/database/prisma";
import { AppError } from "@/lib/errors/api-error";
import Decimal from "decimal.js";

export class EngagementService {
  /**
   * Adds or updates a verified customer review.
   * Invariant: Only users who purchased and hold an active entitlement can review.
   */
  async addReview(userId: string, bookId: string, rating: number, comment?: string) {
    if (rating < 1 || rating > 5) {
      throw AppError.badRequest("Rating must be an integer between 1 and 5.");
    }

    // Verify active purchase entitlement
    const entitlement = await prisma.entitlement.findUnique({
      where: {
        userId_bookId: {
          userId,
          bookId,
        },
      },
    });

    if (!entitlement || !entitlement.isActive) {
      throw AppError.forbidden(
        "Only verified purchasers of this book can submit reviews."
      );
    }

    return prisma.$transaction(async (tx) => {
      // 1. Upsert review
      const review = await tx.review.upsert({
        where: {
          bookId_userId: {
            bookId,
            userId,
          },
        },
        update: {
          rating,
          comment: comment || null,
        },
        create: {
          bookId,
          userId,
          rating,
          comment: comment || null,
        },
      });

      // 2. Recalculate book average rating and review count
      const allReviews = await tx.review.findMany({
        where: { bookId },
        select: { rating: true },
      });

      const count = allReviews.length;
      const totalScore = allReviews.reduce((sum, r) => sum + r.rating, 0);
      const average = count > 0 ? (totalScore / count).toFixed(2) : "0.00";

      await tx.book.update({
        where: { id: bookId },
        data: {
          averageRating: new Decimal(average),
          reviewCount: count,
        },
      });

      return review;
    });
  }

  /**
   * Toggles an item in the user's wishlist.
   */
  async toggleWishlist(userId: string, bookId: string) {
    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_bookId: { userId, bookId },
      },
    });

    if (existing) {
      await prisma.wishlistItem.delete({
        where: { id: existing.id },
      });
      return { inWishlist: false };
    } else {
      await prisma.wishlistItem.create({
        data: { userId, bookId },
      });
      return { inWishlist: true };
    }
  }

  /**
   * Fetches user's saved wishlist books.
   */
  async getUserWishlist(userId: string) {
    const items = await prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        book: {
          include: {
            prices: true,
            seller: { select: { businessName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return items.map((i) => i.book);
  }
}

export const engagementService = new EngagementService();
