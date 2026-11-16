import { NextResponse } from "next/server";
import { authService } from "@backend/modules/identity/application/auth-service";
import { getSessionCookie } from "@backend/modules/identity/infrastructure/session-cookie";
import { isSeller } from "@backend/modules/identity/domain/rbac";
import { financeService } from "@backend/modules/finance/application/finance-service";
import { AppError, toProblemResponse } from "@/lib/errors/api-error";

export async function GET() {
  try {
    const token = getSessionCookie();
    if (!token) throw AppError.unauthorized("Authentication required");

    const user = await authService.validateSession(token);
    if (!user) throw AppError.unauthorized("Session expired or invalid");
    if (!isSeller(user) || !user.sellerProfileId) {
      throw AppError.forbidden("Access denied");
    }

    const ledger = await financeService.getSellerLedger(user.sellerProfileId);
    return NextResponse.json({ ledger }, { status: 200 });
  } catch (error) {
    return toProblemResponse(error, "/api/finance/ledger");
  }
}

