import { NextRequest, NextResponse } from "next/server";
import { authService } from "@backend/modules/identity/application/auth-service";
import { getSessionCookie } from "@backend/modules/identity/infrastructure/session-cookie";
import { canManageFinance } from "@backend/modules/identity/domain/rbac";
import { financeService } from "@backend/modules/finance/application/finance-service";
import { processRefundSchema } from "@backend/modules/finance/application/dto";
import { AppError, toProblemResponse } from "@/lib/errors/api-error";

export async function POST(req: NextRequest) {
  try {
    const token = getSessionCookie();
    if (!token) throw AppError.unauthorized("Authentication required");

    const user = await authService.validateSession(token);
    if (!user) throw AppError.unauthorized("Session expired or invalid");
    if (!canManageFinance(user)) {
      throw AppError.forbidden("Access denied: Finance role required");
    }

    const body = await req.json();
    const parseResult = processRefundSchema.safeParse(body);

    if (!parseResult.success) {
      throw AppError.badRequest("Validation failed", parseResult.error.flatten().fieldErrors);
    }

    const refund = await financeService.processRefund(user.id, parseResult.data);

    return NextResponse.json(
      { refund, message: "Order successfully refunded and access revoked" },
      { status: 200 }
    );
  } catch (error) {
    return toProblemResponse(error, "/api/finance/refunds");
  }
}

