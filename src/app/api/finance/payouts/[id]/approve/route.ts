import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/modules/identity/application/auth-service";
import { getSessionCookie } from "@/modules/identity/infrastructure/session-cookie";
import { canManageFinance } from "@/modules/identity/domain/rbac";
import { financeService } from "@/modules/finance/application/finance-service";
import { approvePayoutSchema } from "@/modules/finance/application/dto";
import { AppError, toProblemResponse } from "@/lib/errors/api-error";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getSessionCookie();
    if (!token) throw AppError.unauthorized("Authentication required");

    const user = await authService.validateSession(token);
    if (!user) throw AppError.unauthorized("Session expired or invalid");
    if (!canManageFinance(user)) {
      throw AppError.forbidden("Access denied: Finance role required");
    }

    const body = await req.json();
    const parseResult = approvePayoutSchema.safeParse({
      ...body,
      payoutId: params.id,
    });

    if (!parseResult.success) {
      throw AppError.badRequest("Validation failed", parseResult.error.flatten().fieldErrors);
    }

    const payout = await financeService.approvePayout(user.id, parseResult.data);

    return NextResponse.json(
      { payout, message: "Payout marked as completed and disbursed" },
      { status: 200 }
    );
  } catch (error) {
    return toProblemResponse(error, `/api/finance/payouts/${params.id}/approve`);
  }
}
