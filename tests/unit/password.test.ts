import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../../src/modules/identity/domain/password";

describe("Password Hashing & Verification", () => {
  it("hashes password and verifies candidate correctly", async () => {
    const raw = "SecurePass123!";
    const hash = await hashPassword(raw);

    expect(hash).not.toBe(raw);
    expect(hash.startsWith("$2a$") || hash.startsWith("$2b$")).toBe(true);

    const isMatch = await verifyPassword(raw, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await verifyPassword("WrongPassword!", hash);
    expect(isWrongMatch).toBe(false);
  });

  it("rejects passwords shorter than 8 characters", async () => {
    await expect(hashPassword("short")).rejects.toThrow(
      "Password must be at least 8 characters long"
    );
  });
});
