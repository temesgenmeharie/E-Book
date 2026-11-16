import { prisma } from "@/infrastructure/database/prisma";
import { ReviewActionInput } from "./dto";
import { AppError } from "@/lib/errors/api-error";
import { BookStatus, ModerationAction } from "@prisma/client";

export class ModerationService {
  /**
   * Fetches books in the moderation queue awaiting review.
   */
  async getQueue() {
    return prisma.book.findMany({
      where: {
        status: {
          in: [BookStatus.SUBMITTED_FOR_REVIEW, BookStatus.IN_REVIEW],
        },
      },
      include: {
        seller: {
          select: {
            id: true,
            businessName: true,
            sellerType: true,
            verificationStatus: true,
          },
        },
        categories: { include: { category: true } },
        files: true,
        prices: true,
        moderationReviews: {
          orderBy: { createdAt: "desc" },
          take: 3,
        },
      },
      orderBy: { updatedAt: "asc" }, // First In, First Out
    });
  }

  /**
   * Assigns a book to a moderator for active inspection.
   */
  async claimReview(moderatorId: string, bookId: string) {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) throw AppError.notFound("Book not found");

    return prisma.book.update({
      where: { id: bookId },
      data: { status: BookStatus.IN_REVIEW },
    });
  }

  /**
   * Executes a moderation decision: APPROVE, REJECT, REQUEST_CHANGES, or SUSPEND.
   */
  async reviewBook(moderatorId: string, input: ReviewActionInput) {
    const book = await prisma.book.findUnique({
      where: { id: input.bookId },
    });

    if (!book) throw AppError.notFound("Book not found");

    let nextStatus: BookStatus;
    switch (input.action) {
      case ModerationAction.APPROVE:
        nextStatus = BookStatus.PUBLISHED;
        break;
      case ModerationAction.REQUEST_CHANGES:
        nextStatus = BookStatus.CHANGES_REQUESTED;
        break;
      case ModerationAction.REJECT:
        nextStatus = BookStatus.REJECTED;
        break;
      case ModerationAction.SUSPEND:
        nextStatus = BookStatus.SUSPENDED;
        break;
      case ModerationAction.RESTORE:
        nextStatus = BookStatus.PUBLISHED;
        break;
      default:
        throw AppError.badRequest("Unsupported moderation action");
    }

    return prisma.$transaction(async (tx) => {
      // 1. Create audit review entry
      const review = await tx.moderationReview.create({
        data: {
          bookId: input.bookId,
          moderatorId,
          action: input.action,
          notes: input.notes,
        },
      });

      // 2. Update book status
      const updatedBook = await tx.book.update({
        where: { id: input.bookId },
        data: { status: nextStatus },
      });

      // 3. Log to system audit trail
      await tx.auditLog.create({
        data: {
          userId: moderatorId,
          action: `BOOK_MODERATION_${input.action}`,
          resource: "Book",
          resourceId: input.bookId,
          metadata: {
            previousStatus: book.status,
            newStatus: nextStatus,
            notes: input.notes,
          },
        },
      });

      return {
        book: updatedBook,
        review,
      };
    });
  }

  /**
   * Retrieves complete moderation audit trail for a book.
   */
  async getModerationHistory(bookId: string) {
    return prisma.moderationReview.findMany({
      where: { bookId },
      include: {
        moderator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}

export const moderationService = new ModerationService();
