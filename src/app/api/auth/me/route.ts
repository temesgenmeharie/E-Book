import { NextResponse } from "next/server";
import { authService } from "@/modules/identity/application/auth-service";
import { getSessionCookie } from "@/modules/identity/infrastructure/session-cookie";
import { AppError, toProblemResponse } from "@/lib/errors/api-error";

export async function GET() {
  try {
    const token = getSessionCookie();
    if (!token) {
      throw AppError.unauthorized("No active session");
    }

    const user = await authService.validateSession(token);
    if (!user) {
      throw AppError.unauthorized("Session expired or invalid");
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    return toProblemResponse(error, "/api/auth/me");
  }
}
