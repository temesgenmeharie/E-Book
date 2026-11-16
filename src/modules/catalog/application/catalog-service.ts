import { prisma } from "@/infrastructure/database/prisma";
import { CreateBookDraftInput, AttachBookFileInput } from "./dto";
import { AppError } from "@/lib/errors/api-error";
import { BookStatus } from "@prisma/client";

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 200);
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${base}-${randomSuffix}`;
}

export class CatalogService {
  /**
   * Creates a new book listing in DRAFT status.
   */
  async createBookDraft(sellerId: string, input: CreateBookDraftInput) {
    const slug = generateSlug(input.title);

    return prisma.$transaction(async (tx) => {
      const book = await tx.book.create({
        data: {
          sellerId,
          title: input.title,
          slug,
          subtitle: input.subtitle,
          description: input.description,
          authorName: input.authorName,
          isbn: input.isbn,
          language: input.language,
          publicationDate: input.publicationDate ? new Date(input.publicationDate) : null,
          coverImageKey: input.coverImageKey,
          status: BookStatus.DRAFT,
          categories: {
            create: input.categoryIds.map((categoryId) => ({ categoryId })),
          },
          prices: {
            create: input.prices.map((p) => ({
              currency: p.currency,
              amount: p.amount,
            })),
          },
        },
        include: {
          categories: { include: { category: true } },
          prices: true,
          files: true,
        },
      });

      return book;
    });
  }

  /**
   * Attaches a PDF or EPUB binary file metadata to a draft book.
   */
  async attachBookFile(sellerId: string, bookId: string, fileInput: AttachBookFileInput) {
    const book = await prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) throw AppError.notFound("Book not found");
    if (book.sellerId !== sellerId) throw AppError.forbidden("You do not own this book");

    if (book.status !== BookStatus.DRAFT && book.status !== BookStatus.CHANGES_REQUESTED) {
      throw AppError.badRequest(
        `Cannot modify files when book status is ${book.status}. Changes require a new draft revision.`
      );
    }

    return prisma.bookFile.upsert({
      where: {
        bookId_format_isSample: {
          bookId,
          format: fileInput.format,
          isSample: fileInput.isSample,
        },
      },
      update: {
        storageKey: fileInput.storageKey,
        originalName: fileInput.originalName,
        mimeType: fileInput.mimeType,
        sizeBytes: BigInt(fileInput.sizeBytes),
        checksumSha256: fileInput.checksumSha256,
      },
      create: {
        bookId,
        format: fileInput.format,
        storageKey: fileInput.storageKey,
        originalName: fileInput.originalName,
        mimeType: fileInput.mimeType,
        sizeBytes: BigInt(fileInput.sizeBytes),
        checksumSha256: fileInput.checksumSha256,
        isSample: fileInput.isSample,
      },
    });
  }

  /**
   * Submits a completed draft book to the moderation queue.
   */
  async submitForModeration(sellerId: string, bookId: string) {
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: {
        files: true,
        prices: true,
      },
    });

    if (!book) throw AppError.notFound("Book not found");
    if (book.sellerId !== sellerId) throw AppError.forbidden("You do not own this book");

    if (book.status !== BookStatus.DRAFT && book.status !== BookStatus.CHANGES_REQUESTED) {
      throw AppError.badRequest(`Book cannot be submitted while in status ${book.status}`);
    }

    // Must have at least one full file (PDF or EPUB)
    const hasFullFile = book.files.some((f) => !f.isSample);
    if (!hasFullFile) {
      throw AppError.badRequest("You must upload at least one full PDF or EPUB book file before submitting.");
    }

    // Must have pricing
    if (book.prices.length === 0) {
      throw AppError.badRequest("You must specify at least one currency price before submitting.");
    }

    return prisma.book.update({
      where: { id: bookId },
      data: {
        status: BookStatus.SUBMITTED_FOR_REVIEW,
      },
    });
  }

  /**
   * Retrieves all books published or managed by a seller.
   */
  async getSellerBooks(sellerId: string) {
    return prisma.book.findMany({
      where: { sellerId },
      include: {
        categories: { include: { category: true } },
        prices: true,
        files: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Retrieves a single book by ID with security checks.
   */
  async getBookById(bookId: string) {
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: {
        seller: {
          select: {
            id: true,
            businessName: true,
            sellerType: true,
          },
        },
        categories: { include: { category: true } },
        prices: true,
        files: true,
      },
    });

    if (!book) throw AppError.notFound("Book not found");
    return book;
  }

  /**
   * Lists all available book categories.
   */
  async getAllCategories() {
    return prisma.category.findMany({
      orderBy: { name: "asc" },
    });
  }
}

export const catalogService = new CatalogService();
