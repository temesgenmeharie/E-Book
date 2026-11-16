import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { authService } from "@backend/modules/identity/application/auth-service";
import { prisma } from "@database/client";

describe("AuthService Integration Test", () => {
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = "Password123!";
  const testName = "Integration Test User";

  afterAll(async () => {
    // Cleanup test user
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });
  });

  it("registers a new user successfully and assigns CUSTOMER role", async () => {
    const res = await authService.register({
      email: testEmail,
      password: testPassword,
      fullName: testName,
    });

    expect(res.user.email).toBe(testEmail);
    expect(res.user.fullName).toBe(testName);
    expect(res.user.roles).toContain("CUSTOMER");
    expect(res.sessionToken).toBeDefined();

    // Verify user cart was automatically created
    const cart = await prisma.cart.findUnique({
      where: { userId: res.user.id },
    });
    expect(cart).not.toBeNull();
  });

  it("rejects duplicate email registration", async () => {
    await expect(
      authService.register({
        email: testEmail,
        password: testPassword,
        fullName: testName,
      })
    ).rejects.toThrow("An account with this email address already exists.");
  });

  it("authenticates valid credentials and provisions a valid session", async () => {
    const loginRes = await authService.login({
      email: testEmail,
      password: testPassword,
    });

    expect(loginRes.sessionToken).toBeDefined();
    expect(loginRes.user.email).toBe(testEmail);

    // Validate the session token
    const userContext = await authService.validateSession(loginRes.sessionToken);
    expect(userContext).not.toBeNull();
    expect(userContext?.id).toBe(loginRes.user.id);
    expect(userContext?.roles).toContain("CUSTOMER");
  });

  it("rejects invalid password", async () => {
    await expect(
      authService.login({
        email: testEmail,
        password: "WrongPassword999!",
      })
    ).rejects.toThrow("Invalid email or password.");
  });

  it("revokes session on logout", async () => {
    const loginRes = await authService.login({
      email: testEmail,
      password: testPassword,
    });

    await authService.revokeSession(loginRes.sessionToken);

    const userContext = await authService.validateSession(loginRes.sessionToken);
    expect(userContext).toBeNull();
  });
});

