import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { catalogService } from "@backend/modules/catalog/application/catalog-service";
import { sellerService } from "@backend/modules/sellers/application/seller-service";
import { authService } from "@backend/modules/identity/application/auth-service";
import { prisma } from "@database/client";
import { BookFormat, BookStatus, SellerType } from "@prisma/client";

describe("CatalogService Integration Test", () => {
  const authorEmail = `catalog_author_${Date.now()}@example.com`;
  let userId: string;
  let sellerId: string;
  let categoryId: string;
  let bookId: string;

  beforeAll(async () => {
    // 1. Create author user & seller profile
    const userRes = await authService.register({
      email: authorEmail,
      password: "AuthorPassword123!",
      fullName: "Catalog Test Author",
    });
    userId = userRes.user.id;

    const seller = await sellerService.onboardSeller(userId, {
      sellerType: SellerType.INDIVIDUAL_AUTHOR,
      businessName: "Author Catalog Press",
    });
    sellerId = seller.id;

    // 2. Fetch an existing seeded category
    const cat = await prisma.category.findFirst();
    if (!cat) throw new Error("Categories not seeded");
    categoryId = cat.id;
  });

  afterAll(async () => {
    // Correct relational cleanup order: files -> books -> seller -> user
    if (bookId) {
      await prisma.bookFile.deleteMany({ where: { bookId } });
      await prisma.bookPrice.deleteMany({ where: { bookId } });
      await prisma.bookCategory.deleteMany({ where: { bookId } });
      await prisma.book.deleteMany({ where: { id: bookId } });
    }
    if (sellerId) {
      await prisma.sellerProfile.deleteMany({ where: { id: sellerId } });
    }
    await prisma.user.deleteMany({
      where: { email: authorEmail },
    });
  });

  it("creates a draft book with pricing in ETB and USD", async () => {
    const book = await catalogService.createBookDraft(sellerId, {
      title: "The Heart of the Rift Valley",
      subtitle: "A Journey Through Ethiopian Landscapes",
      description: "An epic non-fiction journey detailing cultural history and geography.",
      authorName: "Abebe Bikila",
      language: "en",
      coverImageKey: "covers/test_cover.jpg",
      categoryIds: [categoryId],
      prices: [
        { currency: "ETB", amount: 450.0 },
        { currency: "USD", amount: 15.0 },
      ],
    });

    expect(book.id).toBeDefined();
    expect(book.title).toBe("The Heart of the Rift Valley");
    expect(book.status).toBe(BookStatus.DRAFT);
    expect(book.slug).toContain("the-heart-of-the-rift-valley");
    expect(book.prices.length).toBe(2);
    expect(book.categories.length).toBe(1);

    bookId = book.id;
  });

  it("prevents submitting for review when no binary book file is attached", async () => {
    await expect(
      catalogService.submitForModeration(sellerId, bookId)
    ).rejects.toThrow(
      "You must upload at least one full PDF or EPUB book file before submitting."
    );
  });

  it("attaches a PDF binary file to the draft book", async () => {
    const file = await catalogService.attachBookFile(sellerId, bookId, {
      format: BookFormat.PDF,
      storageKey: `books/test_author/rift_valley_${Date.now()}.pdf`,
      originalName: "rift_valley.pdf",
      mimeType: "application/pdf",
      sizeBytes: 15420100,
      checksumSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      isSample: false,
    });

    expect(file.id).toBeDefined();
    expect(file.format).toBe(BookFormat.PDF);
    expect(file.isSample).toBe(false);
  });

  it("submits the completed draft for moderation successfully", async () => {
    const submitted = await catalogService.submitForModeration(sellerId, bookId);

    expect(submitted.status).toBe(BookStatus.SUBMITTED_FOR_REVIEW);
  });

  it("lists all books owned by the seller", async () => {
    const books = await catalogService.getSellerBooks(sellerId);

    expect(books.length).toBeGreaterThanOrEqual(1);
    expect(books.some((b) => b.id === bookId)).toBe(true);
  });
});
