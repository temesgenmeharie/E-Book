import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { discoveryService } from "../../src/modules/catalog/application/discovery-service";
import { catalogService } from "../../src/modules/catalog/application/catalog-service";
import { sellerService } from "../../src/modules/sellers/application/seller-service";
import { authService } from "../../src/modules/identity/application/auth-service";
import { moderationService } from "../../src/modules/moderation/application/moderation-service";
import { prisma } from "../../src/infrastructure/database/prisma";
import { BookFormat, ModerationAction, RoleType, SellerType } from "@prisma/client";

describe("DiscoveryService Integration Test", () => {
  const sellerEmail = `discovery_seller_${Date.now()}@example.com`;
  const modEmail = `discovery_mod_${Date.now()}@example.com`;

  let sellerUserId: string;
  let modUserId: string;
  let sellerId: string;
  let categoryId: string;
  let categorySlug: string;
  let publishedBookId: string;
  let publishedBookSlug: string;
  let draftBookId: string;

  beforeAll(async () => {
    // 1. Create seller
    const sellerRes = await authService.register({
      email: sellerEmail,
      password: "Password123!",
      fullName: "Discovery Author",
    });
    sellerUserId = sellerRes.user.id;

    const seller = await sellerService.onboardSeller(sellerUserId, {
      sellerType: SellerType.INDIVIDUAL_AUTHOR,
      businessName: "Discovery Press",
    });
    sellerId = seller.id;

    // 2. Create moderator
    const modRes = await authService.register({
      email: modEmail,
      password: "Password123!",
      fullName: "Discovery Mod",
    });
    modUserId = modRes.user.id;
    const modRole = await prisma.role.findUnique({ where: { name: RoleType.CONTENT_MODERATOR } });
    if (modRole) {
      await prisma.userRole.create({ data: { userId: modUserId, roleId: modRole.id } });
    }

    // 3. Category
    const cat = await prisma.category.findFirst();
    if (!cat) throw new Error("Category missing");
    categoryId = cat.id;
    categorySlug = cat.slug;

    // 4. Create Draft Book (should NOT appear in search)
    const draft = await catalogService.createBookDraft(sellerId, {
      title: "Secret Unpublished Manuscript",
      description: "Should not be publicly searchable while in DRAFT status.",
      authorName: "Hidden Author",
      coverImageKey: "covers/hidden.jpg",
      categoryIds: [categoryId],
      prices: [{ currency: "ETB", amount: 100 }],
    });
    draftBookId = draft.id;

    // 5. Create Published Book
    const book = await catalogService.createBookDraft(sellerId, {
      title: "Discoverable Ethiopian Horizons",
      subtitle: "The complete guide",
      description: "Publicly visible masterpiece with rich history.",
      authorName: "Discovery Author",
      language: "en",
      coverImageKey: "covers/horizons.jpg",
      categoryIds: [categoryId],
      prices: [
        { currency: "ETB", amount: 250.0 },
        { currency: "USD", amount: 8.0 },
      ],
    });
    publishedBookId = book.id;
    publishedBookSlug = book.slug;

    await catalogService.attachBookFile(sellerId, publishedBookId, {
      format: BookFormat.PDF,
      storageKey: `books/discovery/horizons_${Date.now()}.pdf`,
      originalName: "horizons.pdf",
      mimeType: "application/pdf",
      sizeBytes: 5000000,
      checksumSha256: "0000000000000000000000000000000000000000000000000000000000000000",
      isSample: false,
    });

    await catalogService.submitForModeration(sellerId, publishedBookId);

    // Moderate and Approve
    await moderationService.reviewBook(modUserId, {
      bookId: publishedBookId,
      action: ModerationAction.APPROVE,
      notes: "Approved for discovery tests",
    });
  });

  afterAll(async () => {
    const bookIds = [publishedBookId, draftBookId].filter(Boolean);
    for (const bId of bookIds) {
      await prisma.moderationReview.deleteMany({ where: { bookId: bId } });
      await prisma.bookFile.deleteMany({ where: { bookId: bId } });
      await prisma.bookPrice.deleteMany({ where: { bookId: bId } });
      await prisma.bookCategory.deleteMany({ where: { bookId: bId } });
      await prisma.book.deleteMany({ where: { id: bId } });
    }
    if (sellerId) {
      await prisma.sellerProfile.deleteMany({ where: { id: sellerId } });
    }
    await prisma.user.deleteMany({
      where: { email: { in: [sellerEmail, modEmail] } },
    });
  });

  it("excludes unpublished draft books from search results", async () => {
    const res = await discoveryService.searchBooks({ query: "Secret Unpublished" });
    expect(res.books.some((b) => b.id === draftBookId)).toBe(false);
  });

  it("finds published books by keyword query", async () => {
    const res = await discoveryService.searchBooks({ query: "Ethiopian Horizons" });
    expect(res.books.some((b) => b.id === publishedBookId)).toBe(true);
  });

  it("filters published books by category", async () => {
    const res = await discoveryService.searchBooks({ categorySlug });
    expect(res.books.some((b) => b.id === publishedBookId)).toBe(true);
  });

  it("retrieves published book detail by slug", async () => {
    const book = await discoveryService.getBookBySlug(publishedBookSlug);
    expect(book).not.toBeNull();
    expect(book?.title).toBe("Discoverable Ethiopian Horizons");
    expect(book?.seller.businessName).toBe("Discovery Press");
  });
});
