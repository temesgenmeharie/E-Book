import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { adminService } from "@backend/modules/admin/application/admin-service";
import { authService } from "@backend/modules/identity/application/auth-service";
import { prisma } from "@database/client";
import { RoleType, SellerType } from "@prisma/client";

describe("AdminService Integration Test", () => {
  const adminEmail = `admin_${Date.now()}@example.com`;
  const targetEmail = `target_user_${Date.now()}@example.com`;

  let adminId: string;
  let targetUserId: string;
  let targetSessionToken: string;

  beforeAll(async () => {
    // 1. Create Admin
    const adminRes = await authService.register({
      email: adminEmail,
      password: "Password123!",
      fullName: "Super Admin",
    });
    adminId = adminRes.user.id;
    const adminRole = await prisma.role.findUnique({ where: { name: RoleType.ADMINISTRATOR } });
    if (adminRole) {
      await prisma.userRole.create({ data: { userId: adminId, roleId: adminRole.id } });
    }

    // 2. Create Target User
    const targetRes = await authService.register({
      email: targetEmail,
      password: "Password123!",
      fullName: "Test Citizen",
    });
    targetUserId = targetRes.user.id;

    // Login target user to produce a session
    const loginRes = await authService.login({
      email: targetEmail,
      password: "Password123!",
    });
    targetSessionToken = loginRes.token;
  });

  afterAll(async () => {
    await prisma.session.deleteMany({
      where: { userId: { in: [adminId, targetUserId] } },
    });
    await prisma.auditLog.deleteMany({
      where: { userId: { in: [adminId, targetUserId] } },
    });
    await prisma.commissionRule.deleteMany({
      where: { sellerType: SellerType.INDIVIDUAL_AUTHOR, rate: 0.12 },
    });
    await prisma.userRole.deleteMany({
      where: { userId: { in: [adminId, targetUserId] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [adminId, targetUserId] } },
    });
  });

  it("should list users with pagination and search query", async () => {
    const res = await adminService.listUsers({ search: "Test Citizen", page: 1, pageSize: 10 });
    expect(res.users.length).toBeGreaterThanOrEqual(1);
    expect(res.users.some((u) => u.email === targetEmail)).toBe(true);
    expect(res.pagination.total).toBeGreaterThanOrEqual(1);
  });

  it("should assign roles to target user and log audit trail", async () => {
    const assigned = await adminService.assignRole(adminId, targetUserId, RoleType.CONTENT_MODERATOR);
    expect(assigned).toBeDefined();

    const userWithRoles = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { userRoles: { include: { role: true } } },
    });

    const hasModRole = userWithRoles?.userRoles.some((ur) => ur.role.name === RoleType.CONTENT_MODERATOR);
    expect(hasModRole).toBe(true);

    const logs = await adminService.listAuditLogs({ resource: "User" });
    const modAudit = logs.find((l) => l.action === "ROLE_ASSIGNED_CONTENT_MODERATOR" && l.resourceId === targetUserId);
    expect(modAudit).toBeDefined();
    expect(modAudit?.userId).toBe(adminId);
  });

  it("should prevent administrator from deactivating themselves", async () => {
    await expect(
      adminService.updateUserStatus(adminId, adminId, false)
    ).rejects.toThrow("Administrators cannot deactivate their own account");
  });

  it("should deactivate user and immediately revoke all active sessions", async () => {
    // Verify target session is currently valid
    const sessionBefore = await authService.validateSession(targetSessionToken);
    expect(sessionBefore).toBeDefined();

    // Admin deactivates target user
    const updatedUser = await adminService.updateUserStatus(adminId, targetUserId, false);
    expect(updatedUser.isActive).toBe(false);

    // Session must now be gone
    const sessionAfter = await authService.validateSession(targetSessionToken);
    expect(sessionAfter).toBeNull();

    // Reactivate user for future tests
    await adminService.updateUserStatus(adminId, targetUserId, true);
    const reactivatedUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    expect(reactivatedUser?.isActive).toBe(true);
  });

  it("should create a new commission rule and enforce rate boundaries", async () => {
    await expect(
      adminService.createCommissionRule({
        rate: 1.5, // > 1.0 invalid
        effectiveStartDate: new Date(),
      })
    ).rejects.toThrow("Commission rate must be between 0.0000 and 1.0000");

    const rule = await adminService.createCommissionRule({
      sellerType: SellerType.INDIVIDUAL_AUTHOR,
      rate: 0.12,
      effectiveStartDate: new Date(),
      isDefault: false,
    });

    expect(rule.id).toBeDefined();
    expect(rule.rate.toFixed(2)).toBe("0.12");
    expect(rule.sellerType).toBe(SellerType.INDIVIDUAL_AUTHOR);
  });
});
