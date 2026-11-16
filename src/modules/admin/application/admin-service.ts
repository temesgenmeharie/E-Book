import { prisma } from "@/infrastructure/database/prisma";
import { AppError } from "@/lib/errors/api-error";
import { RoleType, SellerType } from "@prisma/client";
import Decimal from "decimal.js";

export class AdminService {
  /**
   * Lists system users with filtering, roles, and seller profile status.
   */
  async listUsers(params?: { search?: string; page?: number; pageSize?: number }) {
    const page = Math.max(1, params?.page || 1);
    const pageSize = Math.min(50, Math.max(1, params?.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (params?.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { email: { contains: q, mode: "insensitive" } },
        { fullName: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          fullName: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          userRoles: {
            include: { role: true },
          },
          sellerProfile: {
            select: {
              id: true,
              sellerType: true,
              businessName: true,
              verificationStatus: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
    ]);

    return {
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        isActive: u.isActive,
        emailVerified: u.emailVerified,
        createdAt: u.createdAt,
        roles: u.userRoles.map((ur) => ur.role.name),
        sellerProfile: u.sellerProfile,
      })),
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Toggles active account status for a user.
   */
  async updateUserStatus(adminId: string, targetUserId: string, isActive: boolean) {
    if (adminId === targetUserId) {
      throw AppError.badRequest("Administrators cannot deactivate their own account.");
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: targetUserId },
        data: { isActive },
      });

      // If deactivating, revoke all sessions immediately
      if (!isActive) {
        await tx.session.deleteMany({
          where: { userId: targetUserId },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
          resource: "User",
          resourceId: targetUserId,
        },
      });

      return updated;
    });
  }

  /**
   * Assigns an additional system role to a user.
   */
  async assignRole(adminId: string, targetUserId: string, roleName: RoleType) {
    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) throw AppError.notFound(`Role ${roleName} not found.`);

    return prisma.$transaction(async (tx) => {
      const userRole = await tx.userRole.upsert({
        where: {
          userId_roleId: {
            userId: targetUserId,
            roleId: role.id,
          },
        },
        update: {},
        create: {
          userId: targetUserId,
          roleId: role.id,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: `ROLE_ASSIGNED_${roleName}`,
          resource: "User",
          resourceId: targetUserId,
        },
      });

      return userRole;
    });
  }

  /**
   * Creates or updates a platform commission rule.
   */
  async createCommissionRule(params: {
    sellerType?: SellerType;
    rate: number;
    effectiveStartDate: Date;
    isDefault?: boolean;
  }) {
    if (params.rate < 0 || params.rate > 1) {
      throw AppError.badRequest("Commission rate must be between 0.0000 and 1.0000");
    }

    return prisma.$transaction(async (tx) => {
      if (params.isDefault) {
        await tx.commissionRule.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.commissionRule.create({
        data: {
          sellerType: params.sellerType,
          rate: new Decimal(params.rate).toDecimalPlaces(4),
          effectiveStartDate: params.effectiveStartDate,
          isDefault: params.isDefault || false,
        },
      });
    });
  }

  /**
   * Queries system audit logs.
   */
  async listAuditLogs(params?: { resource?: string; take?: number }) {
    return prisma.auditLog.findMany({
      where: params?.resource ? { resource: params.resource } : undefined,
      include: {
        user: { select: { email: true, fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(100, params?.take || 50),
    });
  }
}

export const adminService = new AdminService();
