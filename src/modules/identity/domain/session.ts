import crypto from "crypto";

export const SESSION_DURATION_DAYS = 7;
export const SESSION_DURATION_SECONDS = SESSION_DURATION_DAYS * 24 * 60 * 60;

/**
 * Generates a high-entropy 256-bit cryptographically secure session token.
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Calculates the UTC expiration timestamp for a session.
 */
export function calculateSessionExpiresAt(durationDays = SESSION_DURATION_DAYS): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + durationDays);
  return expiresAt;
}

/**
 * Checks if a session has expired.
 */
export function isSessionExpired(expiresAt: Date): boolean {
  return new Date() > new Date(expiresAt);
}
