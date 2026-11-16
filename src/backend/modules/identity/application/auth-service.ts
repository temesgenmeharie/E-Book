import { prisma } from "@database/client";
import { hashPassword, verifyPassword } from "../domain/password";
import {
  generateSessionToken,
  calculateSessionExpiresAt,
  isSessionExpired,
} from "../domain/session";
import { AuthenticatedUserContext } from "../domain/rbac";
import { RegisterInput, LoginInput, AuthSessionResponse } from "./dto";
import { AppError } from "@/lib/errors/api-error";
import { RoleType } from "@prisma/client";

export class AuthService {
  /**
   * Registers a new customer user and initializes their shopping cart.
   */
  async register(
    input: RegisterInput,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<AuthSessionResponse> {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw AppError.conflict("An account with this email address already exists.");
    }

    const passwordHash = await hashPassword(input.password);

    // Retrieve default CUSTOMER role
    const customerRole = await prisma.role.findUnique({
      where: { name: RoleType.CUSTOMER },
    });

    if (!customerRole) {
      throw AppError.internal("Default customer role not initialized in database.");
    }

    const sessionToken = generateSessionToken();
    const expiresAt = calculateSessionExpiresAt();

    // Atomic transaction: create user, assign role, create session, and create user cart
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          fullName: input.fullName,
          userRoles: {
            create: {
              roleId: customerRole.id,
            },
          },
          carts: {
            create: {},
          },
          sessions: {
            create: {
              sessionToken,
              expiresAt,
              ipAddress: metadata?.ipAddress,
              userAgent: metadata?.userAgent,
            },
          },
        },
        include: {
          userRoles: {
            include: { role: true },
          },
        },
      });

      return newUser;
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roles: user.userRoles.map((ur) => ur.role.name),
        sellerProfileId: null,
      },
      sessionToken,
      expiresAt,
    };
  }

  /**
   * Authenticates user credentials and provisions a new session.
   */
  async login(
    input: LoginInput,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<AuthSessionResponse> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: {
        userRoles: {
          include: { role: true },
        },
        sellerProfile: {
          select: { id: true },
        },
      },
    });

    if (!user || !user.isActive) {
      // Use generic error message to prevent account enumeration
      throw AppError.unauthorized("Invalid email or password.");
    }

    const isValidPassword = await verifyPassword(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw AppError.unauthorized("Invalid email or password.");
    }

    const sessionToken = generateSessionToken();
    const expiresAt = calculateSessionExpiresAt();

    await prisma.session.create({
      data: {
        userId: user.id,
        sessionToken,
        expiresAt,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roles: user.userRoles.map((ur) => ur.role.name),
        sellerProfileId: user.sellerProfile?.id || null,
      },
      sessionToken,
      expiresAt,
    };
  }

  /**
   * Validates a session token and returns the current user context.
   */
  async validateSession(sessionToken: string): Promise<AuthenticatedUserContext | null> {
    if (!sessionToken) return null;

    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: {
        user: {
          include: {
            userRoles: {
              include: { role: true },
            },
            sellerProfile: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!session) return null;

    if (isSessionExpired(session.expiresAt)) {
      // Clean up expired session asynchronously
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }

    if (!session.user.isActive) return null;

    return {
      id: session.user.id,
      email: session.user.email,
      fullName: session.user.fullName,
      roles: session.user.userRoles.map((ur) => ur.role.name),
      sellerProfileId: session.user.sellerProfile?.id || null,
      isActive: session.user.isActive,
    };
  }

  /**
   * Revokes an active session token (Logout).
   */
  async revokeSession(sessionToken: string): Promise<void> {
    if (!sessionToken) return;
    await prisma.session.deleteMany({
      where: { sessionToken },
    });
  }
}

export const authService = new AuthService();

