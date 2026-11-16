import { describe, it, expect } from "vitest";
import {
  hasRole,
  isSeller,
  canModerateContent,
  canManageFinance,
  isAdministrator,
  AuthenticatedUserContext,
} from "@backend/modules/identity/domain/rbac";
import { RoleType } from "@prisma/client";

describe("RBAC Authorization Rules", () => {
  const customerUser: AuthenticatedUserContext = {
    id: "user-1",
    email: "customer@example.com",
    fullName: "Customer User",
    roles: [RoleType.CUSTOMER],
    isActive: true,
  };

  const authorUser: AuthenticatedUserContext = {
    id: "user-2",
    email: "author@example.com",
    fullName: "Author User",
    roles: [RoleType.CUSTOMER, RoleType.AUTHOR],
    sellerProfileId: "seller-123",
    isActive: true,
  };

  const moderatorUser: AuthenticatedUserContext = {
    id: "user-3",
    email: "mod@example.com",
    fullName: "Moderator User",
    roles: [RoleType.CONTENT_MODERATOR],
    isActive: true,
  };

  const adminUser: AuthenticatedUserContext = {
    id: "user-4",
    email: "admin@example.com",
    fullName: "Admin Superuser",
    roles: [RoleType.ADMINISTRATOR],
    isActive: true,
  };

  const inactiveAdmin: AuthenticatedUserContext = {
    ...adminUser,
    isActive: false,
  };

  it("evaluates customer permissions correctly", () => {
    expect(hasRole(customerUser, RoleType.CUSTOMER)).toBe(true);
    expect(isSeller(customerUser)).toBe(false);
    expect(canModerateContent(customerUser)).toBe(false);
    expect(canManageFinance(customerUser)).toBe(false);
  });

  it("evaluates seller/author permissions correctly", () => {
    expect(isSeller(authorUser)).toBe(true);
    expect(hasRole(authorUser, RoleType.AUTHOR)).toBe(true);
    expect(canModerateContent(authorUser)).toBe(false);
  });

  it("evaluates moderator permissions correctly", () => {
    expect(canModerateContent(moderatorUser)).toBe(true);
    expect(isSeller(moderatorUser)).toBe(false);
    expect(canManageFinance(moderatorUser)).toBe(false);
  });

  it("grants superuser privileges to administrator", () => {
    expect(isAdministrator(adminUser)).toBe(true);
    expect(canModerateContent(adminUser)).toBe(true);
    expect(canManageFinance(adminUser)).toBe(true);
    expect(isSeller(adminUser)).toBe(true);
    expect(hasRole(adminUser, RoleType.CUSTOMER)).toBe(true);
  });

  it("revokes all permissions when account isActive is false", () => {
    expect(isAdministrator(inactiveAdmin)).toBe(false);
    expect(canModerateContent(inactiveAdmin)).toBe(false);
  });
});

