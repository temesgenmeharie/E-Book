import { prisma } from "@database/client";
import { AppError } from "@/lib/errors/api-error";
import { BookFormat } from "@prisma/client";
import Decimal from "decimal.js";

export class LibraryService {
  /**
   * Retrieves all books the user is entitled to read or download.
   */
  async getUserLibrary(userId: string) {
    const entitlements = await prisma.entitlement.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        book: {
          include: {
            files: {
              select: {
                id: true,
                format: true,
                sizeBytes: true,
                isSample: true,
              },
            },
            seller: {
              select: { businessName: true },
            },
          },
        },
        readingProgress: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return entitlements.map((ent) => ({
      entitlementId: ent.id,
      bookId: ent.book.id,
      title: ent.book.title,
      authorName: ent.book.authorName,
      coverImageKey: ent.book.coverImageKey,
      sellerName: ent.book.seller.businessName,
      purchasedAt: ent.createdAt,
      formats: ent.book.files
        .filter((f) => !f.isSample)
        .map((f) => ({
          format: f.format,
          sizeBytes: f.sizeBytes.toString(),
        })),
      readingProgress: ent.readingProgress.map((rp) => ({
        format: rp.format,
        locator: rp.locator,
        percentage: rp.percentage.toFixed(2),
        updatedAt: rp.updatedAt,
      })),
    }));
  }

  /**
   * Strictly verifies if a customer has an active purchase entitlement for a book.
   */
  async verifyEntitlement(userId: string, bookId: string) {
    const entitlement = await prisma.entitlement.findUnique({
      where: {
        userId_bookId: {
          userId,
          bookId,
        },
      },
      include: {
        book: {
          include: {
            files: true,
          },
        },
      },
    });

    if (!entitlement || !entitlement.isActive) {
      throw AppError.forbidden("You do not own an active license for this digital book.");
    }

    return entitlement;
  }

  /**
   * Updates or inserts current reading progress.
   */
  async saveProgress(params: {
    userId: string;
    bookId: string;
    format: BookFormat;
    locator: string;
    percentage: number;
  }) {
    const entitlement = await this.verifyEntitlement(params.userId, params.bookId);

    return prisma.readingProgress.upsert({
      where: {
        entitlementId_format: {
          entitlementId: entitlement.id,
          format: params.format,
        },
      },
      update: {
        locator: params.locator,
        percentage: new Decimal(params.percentage).toDecimalPlaces(2),
      },
      create: {
        entitlementId: entitlement.id,
        format: params.format,
        locator: params.locator,
        percentage: new Decimal(params.percentage).toDecimalPlaces(2),
      },
    });
  }

  /**
   * Creates a bookmark for a book format.
   */
  async addBookmark(params: {
    userId: string;
    bookId: string;
    format: BookFormat;
    locator: string;
    label: string;
  }) {
    const entitlement = await this.verifyEntitlement(params.userId, params.bookId);

    return prisma.bookmark.create({
      data: {
        entitlementId: entitlement.id,
        format: params.format,
        locator: params.locator,
        label: params.label,
      },
    });
  }
}

export const libraryService = new LibraryService();

