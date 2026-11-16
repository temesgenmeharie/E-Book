import { prisma } from "@/infrastructure/database/prisma";
import { BookFormat, BookStatus, Prisma } from "@prisma/client";

export interface SearchFilters {
  query?: string;
  categorySlug?: string;
  language?: string;
  format?: BookFormat;
  currency?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "newest" | "price_asc" | "price_desc" | "rating" | "popular";
  page?: number;
  pageSize?: number;
}

export class DiscoveryService {
  /**
   * Searches and filters published books for the public storefront.
   */
  async searchBooks(filters: SearchFilters) {
    const page = Math.max(1, filters.page || 1);
    const pageSize = Math.min(50, Math.max(1, filters.pageSize || 12));
    const skip = (page - 1) * pageSize;
    const currency = (filters.currency || "ETB").toUpperCase();

    // Base WHERE: strictly PUBLISHED books only
    const where: Prisma.BookWhereInput = {
      status: BookStatus.PUBLISHED,
    };

    if (filters.query && filters.query.trim()) {
      const q = filters.query.trim();
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { subtitle: { contains: q, mode: "insensitive" } },
        { authorName: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    if (filters.categorySlug) {
      where.categories = {
        some: {
          category: {
            slug: filters.categorySlug,
          },
        },
      };
    }

    if (filters.language) {
      where.language = filters.language;
    }

    if (filters.format) {
      where.files = {
        some: {
          format: filters.format,
          isSample: false,
        },
      };
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.prices = {
        some: {
          currency,
          ...(filters.minPrice !== undefined ? { amount: { gte: filters.minPrice } } : {}),
          ...(filters.maxPrice !== undefined ? { amount: { lte: filters.maxPrice } } : {}),
        },
      };
    }

    // Determine Sort Order
    let orderBy: Prisma.BookOrderByWithRelationInput = { createdAt: "desc" };
    switch (filters.sortBy) {
      case "rating":
        orderBy = { averageRating: "desc" };
        break;
      case "popular":
        orderBy = { reviewCount: "desc" };
        break;
      case "newest":
      default:
        orderBy = { createdAt: "desc" };
        break;
    }

    const [totalCount, books] = await Promise.all([
      prisma.book.count({ where }),
      prisma.book.findMany({
        where,
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
          files: {
            select: {
              format: true,
              sizeBytes: true,
              isSample: true,
            },
          },
        },
        orderBy,
        skip,
        take: pageSize,
      }),
    ]);

    const formattedBooks = books.map((b) => ({
      ...b,
      files: b.files.map((f) => ({
        ...f,
        sizeBytes: f.sizeBytes.toString(),
      })),
    }));

    return {
      books: formattedBooks,
      pagination: {
        total: totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    };
  }

  /**
   * Fetches published book detail by slug.
   */
  async getBookBySlug(slug: string) {
    const book = await prisma.book.findUnique({
      where: { slug },
      include: {
        seller: {
          select: {
            id: true,
            businessName: true,
            bio: true,
            websiteUrl: true,
            sellerType: true,
          },
        },
        categories: { include: { category: true } },
        prices: true,
        files: {
          select: {
            format: true,
            sizeBytes: true,
            isSample: true,
          },
        },
        reviews: {
          include: {
            user: { select: { fullName: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!book || book.status !== BookStatus.PUBLISHED) {
      return null;
    }

    return {
      ...book,
      files: book.files.map((f) => ({
        ...f,
        sizeBytes: f.sizeBytes.toString(),
      })),
    };
  }
}

export const discoveryService = new DiscoveryService();
