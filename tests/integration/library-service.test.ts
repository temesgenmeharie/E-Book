import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { libraryService } from "../../src/modules/library/application/library-service";
import { catalogService } from "../../src/modules/catalog/application/catalog-service";
import { sellerService } from "../../src/modules/sellers/application/seller-service";
import { authService } from "../../src/modules/identity/application/auth-service";
import { moderationService } from "../../src/modules/moderation/application/moderation-service";
import { prisma } from "../../src/infrastructure/database/prisma";
import {
  BookFormat,
  ModerationAction,
  OrderStatus,
  RoleType,
  SellerType,
} from "@prisma/client";

describe("LibraryService Integration Test", () => {
  const customerEmail = `lib_cust_${Date.now()}@example.com`;
  const intruderEmail = `lib_intruder_${Date.now()}@example.com`;
  const sellerEmail = `lib_seller_${Date.now()}@example.com`;
  const modEmail = `lib_mod_${Date.now()}@example.com`;

  let customerId: string;
  let intruderId: string;
  let sellerUserId: string;
  let modUserId: string;
  let sellerId: string;
  let bookId: string;
  let orderId: string;

  beforeAll(async () => {
    // 1. Users
    const custRes = await authService.register({
      email: customerEmail,
      password: "Password123!",
      fullName: "Entitled Customer",
    });
    customerId = custRes.user.id;

    const intruderRes = await authService.register({
      email: intruderEmail,
      password: "Password123!",
      fullName: "Unentitled Intruder",
    });
    intruderId = intruderRes.user.id;

    const sellerRes = await authService.register({
      email: sellerEmail,
      password: "Password123!",
      fullName: "Library Author",
    });
    sellerUserId = sellerRes.user.id;
    const seller = await sellerService.onboardSeller(sellerUserId, {
      sellerType: SellerType.INDIVIDUAL_AUTHOR,
      businessName: "Library Author Press",
    });
    sellerId = seller.id;

    const modRes = await authService.register({
      email: modEmail,
      password: "Password123!",
      fullName: "Mod Staff",
    });
    modUserId = modRes.user.id;
    const modRole = await prisma.role.findUnique({ where: { name: RoleType.CONTENT_MODERATOR } });
    if (modRole) {
      await prisma.userRole.create({ data: { userId: modUserId, roleId: modRole.id } });
    }

    const cat = await prisma.category.findFirst();
    if (!cat) throw new Error("Category missing");

    // 2. Book
    const book = await catalogService.createBookDraft(sellerId, {
      title: "Library Entitlement Novel",
      description: "Testing digital reading library and progress tracking.",
      authorName: "Library Novelist",
      coverImageKey: "covers/library.jpg",
      categoryIds: [cat.id],
      prices: [{ currency: "ETB", amount: 150.0 }],
    });
    bookId = book.id;

    await catalogService.attachBookFile(sellerId, bookId, {
      format: BookFormat.PDF,
      storageKey: `books/lib/novel_${Date.now()}.pdf`,
      originalName: "novel.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1500000,
      checksumSha256: "0000000000000000000000000000000000000000000000000000000000000000",
      isSample: false,
    });

    await catalogService.submitForModeration(sellerId, bookId);
    await moderationService.reviewBook(modUserId, {
      bookId,
      action: ModerationAction.APPROVE,
    });

    // 3. Create simulated completed order & entitlement for customerId
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-LIB-${Date.now()}`,
        userId: customerId,
        currency: "ETB",
        totalAmount: 150.0,
        status: OrderStatus.COMPLETED,
        items: {
          create: {
            bookId,
            sellerId,
            bookTitleSnapshot: "Library Entitlement Novel",
            authorNameSnapshot: "Library Novelist",
            priceSnapshot: 150.0,
            commissionRate: 0.15,
            commissionAmount: 22.5,
            sellerNetAmount: 127.5,
          },
        },
      },
    });
    orderId = order.id;

    await prisma.entitlement.create({
      data: {
        userId: customerId,
        bookId,
        orderId,
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    if (orderId) {
      await prisma.bookmark.deleteMany({});
      await prisma.readingProgress.deleteMany({});
      await prisma.entitlement.deleteMany({ where: { orderId } });
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
      where: { email: { in: [customerEmail, intruderEmail, sellerEmail, modEmail] } },
    });
  });

  it("denies access to an unentitled customer with 403 Forbidden", async () => {
    await expect(
      libraryService.verifyEntitlement(intruderId, bookId)
    ).rejects.toThrow("You do not own an active license for this digital book.");
  });

  it("verifies entitlement for the authorized purchasing customer", async () => {
    const entitlement = await libraryService.verifyEntitlement(customerId, bookId);
    expect(entitlement).not.toBeNull();
    expect(entitlement.bookId).toBe(bookId);
    expect(entitlement.userId).toBe(customerId);
  });

  it("lists purchased book in customer library with format details", async () => {
    const library = await libraryService.getUserLibrary(customerId);
    expect(library.length).toBe(1);
    expect(library[0].bookId).toBe(bookId);
    expect(library[0].title).toBe("Library Entitlement Novel");
    expect(library[0].formats.some((f) => f.format === "PDF")).toBe(true);
  });

  it("saves reading progress and persists percentage", async () => {
    const progress = await libraryService.saveProgress({
      userId: customerId,
      bookId,
      format: BookFormat.PDF,
      locator: "page_42",
      percentage: 35.5,
    });

    expect(progress.locator).toBe("page_42");
    expect(progress.percentage.toFixed(2)).toBe("35.50");

    const library = await libraryService.getUserLibrary(customerId);
    expect(library[0].readingProgress[0].percentage).toBe("35.50");
  });

  it("adds and records a customer bookmark", async () => {
    const bm = await libraryService.addBookmark({
      userId: customerId,
      bookId,
      format: BookFormat.PDF,
      locator: "page_42",
      label: "Favorite passage on philosophy",
    });

    expect(bm.id).toBeDefined();
    expect(bm.label).toBe("Favorite passage on philosophy");
  });
});
