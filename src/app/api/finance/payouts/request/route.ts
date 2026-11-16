import { NextRequest, NextResponse } from "next/server";
import { authService } from "@backend/modules/identity/application/auth-service";
import { getSessionCookie } from "@backend/modules/identity/infrastructure/session-cookie";
import { isSeller } from "@backend/modules/identity/domain/rbac";
import { financeService } from "@backend/modules/finance/application/finance-service";
import { requestPayoutSchema } from "@backend/modules/finance/application/dto";
import { AppError, toProblemResponse } from "@/lib/errors/api-error";

export async function POST(req: NextRequest) {
  try {
    const token = getSessionCookie();
    if (!token) throw AppError.unauthorized("Authentication required");

    const user = await authService.validateSession(token);
    if (!user) throw AppError.unauthorized("Session expired or invalid");
    if (!isSeller(user) || !user.sellerProfileId) {
      throw AppError.forbidden("Only verified sellers can request payout withdrawals");
    }

    const body = await req.json();
    const parseResult = requestPayoutSchema.safeParse(body);

    if (!parseResult.success) {
      throw AppError.badRequest("Validation failed", parseResult.error.flatten().fieldErrors);
    }

    const payout = await financeService.requestPayout(user.sellerProfileId, parseResult.data);

    return NextResponse.json(
      {
        payout,
        message: "Payout withdrawal request submitted successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    return toProblemResponse(error, "/api/finance/payouts/request");
  }
}

