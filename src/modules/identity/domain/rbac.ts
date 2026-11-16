import { RoleType } from "@prisma/client";

export interface AuthenticatedUserContext {
  id: string;
  email: string;
  fullName: string;
  roles: RoleType[];
  sellerProfileId?: string | null;
  isActive: boolean;
}

/**
 * Checks if a user has a specific role.
 */
export function hasRole(user: AuthenticatedUserContext, role: RoleType): boolean {
  if (!user.isActive) return false;
  // Administrator has superuser access to all operational checks
  if (user.roles.includes(RoleType.ADMINISTRATOR)) return true;
  return user.roles.includes(role);
}

/**
 * Checks if user is authorized as an author or publisher.
 */
export function isSeller(user: AuthenticatedUserContext): boolean {
  if (!user.isActive) return false;
  return (
    user.roles.includes(RoleType.AUTHOR) ||
    user.roles.includes(RoleType.PUBLISHER) ||
    user.roles.includes(RoleType.ADMINISTRATOR)
  );
}

/**
 * Checks if user can review and moderate book catalog submissions.
 */
export function canModerateContent(user: AuthenticatedUserContext): boolean {
  if (!user.isActive) return false;
  return (
    user.roles.includes(RoleType.CONTENT_MODERATOR) ||
    user.roles.includes(RoleType.ADMINISTRATOR)
  );
}

/**
 * Checks if user can approve payouts, manage commission rates, and execute refunds.
 */
export function canManageFinance(user: AuthenticatedUserContext): boolean {
  if (!user.isActive) return false;
  return (
    user.roles.includes(RoleType.FINANCE_MANAGER) ||
    user.roles.includes(RoleType.ADMINISTRATOR)
  );
}

/**
 * Checks if user has system administrator privileges.
 */
export function isAdministrator(user: AuthenticatedUserContext): boolean {
  if (!user.isActive) return false;
  return user.roles.includes(RoleType.ADMINISTRATOR);
}
