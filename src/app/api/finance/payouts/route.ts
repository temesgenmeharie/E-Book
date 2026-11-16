import { NextResponse } from "next/server";
import { authService } from "@backend/modules/identity/application/auth-service";
import { getSessionCookie } from "@backend/modules/identity/infrastructure/session-cookie";
import { canManageFinance } from "@backend/modules/identity/domain/rbac";
import { financeService } from "@backend/modules/finance/application/finance-service";
import { AppError, toProblemResponse } from "@/lib/errors/api-error";

export async function GET() {
  try {
    const token = getSessionCookie();
    if (!token) throw AppError.unauthorized("Authentication required");

    const user = await authService.validateSession(token);
    if (!user) throw AppError.unauthorized("Session expired or invalid");
    if (!canManageFinance(user)) {
      throw AppError.forbidden("Access denied: Finance role required");
    }

    const payouts = await financeService.getPendingPayouts();
    return NextResponse.json({ payouts }, { status: 200 });
  } catch (error) {
    return toProblemResponse(error, "/api/finance/payouts");
  }
}

