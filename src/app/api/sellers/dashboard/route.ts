import { NextResponse } from "next/server";
import { authService } from "@backend/modules/identity/application/auth-service";
import { getSessionCookie } from "@backend/modules/identity/infrastructure/session-cookie";
import { sellerService } from "@backend/modules/sellers/application/seller-service";
import { AppError, toProblemResponse } from "@/lib/errors/api-error";

export async function GET() {
  try {
    const token = getSessionCookie();
    if (!token) throw AppError.unauthorized("Authentication required");

    const user = await authService.validateSession(token);
    if (!user) throw AppError.unauthorized("Session expired or invalid");

    const metrics = await sellerService.getDashboardMetrics(user.id);
    return NextResponse.json({ metrics }, { status: 200 });
  } catch (error) {
    return toProblemResponse(error, "/api/sellers/dashboard");
  }
}

