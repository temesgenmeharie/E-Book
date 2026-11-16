import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { moderationService } from "../../src/modules/moderation/application/moderation-service";
import { catalogService } from "../../src/modules/catalog/application/catalog-service";
import { sellerService } from "../../src/modules/sellers/application/seller-service";
import { authService } from "../../src/modules/identity/application/auth-service";
import { prisma } from "../../src/infrastructure/database/prisma";
import { BookFormat, BookStatus, ModerationAction, RoleType, SellerType } from "@prisma/client";

describe("ModerationService Integration Test", () => {
  const modEmail = `mod_${Date.now()}@example.com`;
  const authorEmail = `mod_author_${Date.now()}@example.com`;

  let modUserId: string;
  let authorUserId: string;
  let sellerId: string;
  let bookId: string;
  let categoryId: string;

  beforeAll(async () => {
    // 1. Create moderator user and assign CONTENT_MODERATOR role
    const modRes = await authService.register({
      email: modEmail,
      password: "ModeratorPassword123!",
      fullName: "Staff Moderator",
    });
    modUserId = modRes.user.id;

    const modRole = await prisma.role.findUnique({
      where: { name: RoleType.CONTENT_MODERATOR },
    });
    if (modRole) {
      await prisma.userRole.create({
        data: { userId: modUserId, roleId: modRole.id },
      });
    }

    // 2. Create author user and book draft
    const authorRes = await authService.register({
      email: authorEmail,
      password: "AuthorPassword123!",
      fullName: "Submitted Author",
    });
    authorUserId = authorRes.user.id;

    const seller = await sellerService.onboardSeller(authorUserId, {
      sellerType: SellerType.INDIVIDUAL_AUTHOR,
      businessName: "Submitted Author Books",
    });
    sellerId = seller.id;

    const cat = await prisma.category.findFirst();
    if (!cat) throw new Error("Category not found");
    categoryId = cat.id;

    // Create draft book
    const book = await catalogService.createBookDraft(sellerId, {
      title: "Moderation Test Book",
      description: "Testing moderation state machine transitions and audit records.",
      authorName: "Author One",
      coverImageKey: "covers/mod_test.jpg",
      categoryIds: [categoryId],
      prices: [{ currency: "ETB", amount: 200.0 }],
    });
    bookId = book.id;

    // Attach full book file and submit
    await catalogService.attachBookFile(sellerId, bookId, {
      format: BookFormat.PDF,
      storageKey: `books/mod_test/manuscript_${Date.now()}.pdf`,
      originalName: "manuscript.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1200000,
      checksumSha256: "0000000000000000000000000000000000000000000000000000000000000000",
      isSample: false,
    });

    await catalogService.submitForModeration(sellerId, bookId);
  });

  afterAll(async () => {
    // Clean up
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
      where: { email: { in: [modEmail, authorEmail] } },
    });
  });

  it("lists submitted book in the moderation queue", async () => {
    const queue = await moderationService.getQueue();
    expect(queue.some((b) => b.id === bookId)).toBe(true);
  });

  it("claims review transitioning book status to IN_REVIEW", async () => {
    const claimed = await moderationService.claimReview(modUserId, bookId);
    expect(claimed.status).toBe(BookStatus.IN_REVIEW);
  });

  it("approves book publishing it live and creating audit logs", async () => {
    const result = await moderationService.reviewBook(modUserId, {
      bookId,
      action: ModerationAction.APPROVE,
      notes: "Content formatting and copyright verified. Approved for public catalog.",
    });

    expect(result.book.status).toBe(BookStatus.PUBLISHED);
    expect(result.review.action).toBe(ModerationAction.APPROVE);
    expect(result.review.notes).toContain("copyright verified");

    // Verify audit log was created
    const audit = await prisma.auditLog.findFirst({
      where: {
        resourceId: bookId,
        action: "BOOK_MODERATION_APPROVE",
      },
    });
    expect(audit).not.toBeNull();
    expect(audit?.userId).toBe(modUserId);
  });

  it("fetches moderation history audit trail", async () => {
    const history = await moderationService.getModerationHistory(bookId);
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[0].moderator.email).toBe(modEmail);
  });
});
