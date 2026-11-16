import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sellerService } from "@backend/modules/sellers/application/seller-service";
import { authService } from "@backend/modules/identity/application/auth-service";
import { prisma } from "@database/client";
import { SellerType, SellerVerificationStatus, RoleType } from "@prisma/client";

describe("SellerService Integration Test", () => {
  const sellerEmail = `seller_${Date.now()}@example.com`;
  let userId: string;

  beforeAll(async () => {
    // Create a registered user first
    const res = await authService.register({
      email: sellerEmail,
      password: "SellerPassword123!",
      fullName: "Test Author",
    });
    userId = res.user.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: sellerEmail },
    });
  });

  it("onboards an individual author and assigns the AUTHOR role", async () => {
    const profile = await sellerService.onboardSeller(userId, {
      sellerType: SellerType.INDIVIDUAL_AUTHOR,
      businessName: "Abebe Books",
      bio: "Independent author of Ethiopian folklore and historical novels.",
      websiteUrl: "https://author-abebe.example.com",
    });

    expect(profile.id).toBeDefined();
    expect(profile.businessName).toBe("Abebe Books");
    expect(profile.sellerType).toBe(SellerType.INDIVIDUAL_AUTHOR);
    expect(profile.verificationStatus).toBe(SellerVerificationStatus.UNVERIFIED);

    // Verify user now has the AUTHOR role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: { include: { role: true } } },
    });

    const roleNames = user?.userRoles.map((ur) => ur.role.name);
    expect(roleNames).toContain(RoleType.AUTHOR);
    expect(roleNames).toContain(RoleType.CUSTOMER);
  });

  it("adds payout account and marks as default", async () => {
    const account = await sellerService.addPayoutAccount(userId, {
      provider: "TELEBIRR",
      accountHolder: "Abebe Bikila",
      accountNumber: "0911234567",
      isDefault: true,
    });

    expect(account.id).toBeDefined();
    expect(account.provider).toBe("TELEBIRR");
    expect(account.isDefault).toBe(true);

    const profile = await sellerService.getProfileByUserId(userId);
    expect(profile.payoutAccounts.length).toBe(1);
    expect(profile.payoutAccounts[0].accountNumber).toBe("0911234567");
  });

  it("submits verification documents transitioning status to PENDING_REVIEW", async () => {
    const updated = await sellerService.submitVerification(
      userId,
      "kyc/documents/author_passport_key.pdf",
      "Submitted national passport for verification"
    );

    expect(updated.verificationStatus).toBe(SellerVerificationStatus.PENDING_REVIEW);
    expect(updated.verificationIdKey).toBe("kyc/documents/author_passport_key.pdf");
  });

  it("fetches dashboard metrics accurately", async () => {
    const metrics = await sellerService.getDashboardMetrics(userId);

    expect(metrics.businessName).toBe("Abebe Books");
    expect(metrics.verificationStatus).toBe(SellerVerificationStatus.PENDING_REVIEW);
    expect(metrics.financials.availableBalance).toBe("0.00");
    expect(metrics.catalog.totalBooks).toBe(0);
  });
});

