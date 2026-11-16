import { prisma } from "@/infrastructure/database/prisma";
import { OnboardSellerInput, PayoutAccountInput } from "./dto";
import { AppError } from "@/lib/errors/api-error";
import { RoleType, SellerType, SellerVerificationStatus, BookStatus } from "@prisma/client";

export class SellerService {
  /**
   * Onboards a user as an Author or Publisher seller.
   */
  async onboardSeller(userId: string, input: OnboardSellerInput) {
    const existing = await prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      throw AppError.conflict("User already has an active seller profile.");
    }

    const targetRoleName =
      input.sellerType === SellerType.PUBLISHER
        ? RoleType.PUBLISHER
        : RoleType.AUTHOR;

    const role = await prisma.role.findUnique({
      where: { name: targetRoleName },
    });

    if (!role) {
      throw AppError.internal(`Role ${targetRoleName} not initialized.`);
    }

    return prisma.$transaction(async (tx) => {
      // 1. Create seller profile
      const profile = await tx.sellerProfile.create({
        data: {
          userId,
          sellerType: input.sellerType,
          businessName: input.businessName,
          bio: input.bio,
          websiteUrl: input.websiteUrl || null,
          taxId: input.taxId || null,
          verificationStatus: SellerVerificationStatus.UNVERIFIED,
        },
      });

      // 2. Assign seller role if not already assigned
      await tx.userRole.upsert({
        where: {
          userId_roleId: {
            userId,
            roleId: role.id,
          },
        },
        update: {},
        create: {
          userId,
          roleId: role.id,
        },
      });

      return profile;
    });
  }

  /**
   * Fetches seller profile for the authenticated user.
   */
  async getProfileByUserId(userId: string) {
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId },
      include: {
        payoutAccounts: {
          orderBy: { isDefault: "desc" },
        },
        _count: {
          select: { books: true },
        },
      },
    });

    if (!profile) {
      throw AppError.notFound("Seller profile not found for this user.");
    }

    return profile;
  }

  /**
   * Updates profile information.
   */
  async updateProfile(userId: string, data: Partial<OnboardSellerInput>) {
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw AppError.notFound("Seller profile not found.");
    }

    return prisma.sellerProfile.update({
      where: { id: profile.id },
      data: {
        businessName: data.businessName,
        bio: data.bio,
        websiteUrl: data.websiteUrl || null,
        taxId: data.taxId,
      },
    });
  }

  /**
   * Submits verification document storage key and sets status to PENDING_REVIEW.
   */
  async submitVerification(userId: string, verificationIdKey: string, notes?: string) {
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw AppError.notFound("Seller profile not found.");
    }

    return prisma.sellerProfile.update({
      where: { id: profile.id },
      data: {
        verificationIdKey,
        verificationNotes: notes,
        verificationStatus: SellerVerificationStatus.PENDING_REVIEW,
      },
    });
  }

  /**
   * Adds a new payout account for seller withdrawals.
   */
  async addPayoutAccount(userId: string, input: PayoutAccountInput) {
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw AppError.notFound("Seller profile not found.");
    }

    return prisma.$transaction(async (tx) => {
      // If setting this account as default, clear existing defaults
      if (input.isDefault) {
        await tx.sellerPayoutAccount.updateMany({
          where: { sellerId: profile.id, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.sellerPayoutAccount.create({
        data: {
          sellerId: profile.id,
          provider: input.provider,
          accountHolder: input.accountHolder,
          accountNumber: input.accountNumber,
          bankName: input.bankName,
          isDefault: input.isDefault,
        },
      });
    });
  }

  /**
   * Aggregates dashboard metrics for the seller.
   */
  async getDashboardMetrics(userId: string) {
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId },
      include: {
        books: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!profile) {
      throw AppError.notFound("Seller profile not found.");
    }

    const totalBooks = profile.books.length;
    const publishedBooks = profile.books.filter((b) => b.status === BookStatus.PUBLISHED).length;
    const inReviewBooks = profile.books.filter(
      (b) => b.status === BookStatus.SUBMITTED_FOR_REVIEW || b.status === BookStatus.IN_REVIEW
    ).length;
    const draftBooks = profile.books.filter((b) => b.status === BookStatus.DRAFT).length;

    return {
      sellerId: profile.id,
      sellerType: profile.sellerType,
      businessName: profile.businessName,
      verificationStatus: profile.verificationStatus,
      financials: {
        availableBalance: profile.availableBalance.toFixed(2),
        pendingBalance: profile.pendingBalance.toFixed(2),
        lifetimeEarnings: profile.lifetimeEarnings.toFixed(2),
      },
      catalog: {
        totalBooks,
        publishedBooks,
        inReviewBooks,
        draftBooks,
      },
    };
  }
}

export const sellerService = new SellerService();
