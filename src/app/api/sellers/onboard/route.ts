import { NextRequest, NextResponse } from "next/server";
import { authService } from "@backend/modules/identity/application/auth-service";
import { getSessionCookie } from "@backend/modules/identity/infrastructure/session-cookie";
import { sellerService } from "@backend/modules/sellers/application/seller-service";
import { onboardSellerSchema } from "@backend/modules/sellers/application/dto";
import { AppError, toProblemResponse } from "@/lib/errors/api-error";

export async function POST(req: NextRequest) {
  try {
    const token = getSessionCookie();
    if (!token) throw AppError.unauthorized("Authentication required");

    const user = await authService.validateSession(token);
    if (!user) throw AppError.unauthorized("Session expired or invalid");

    const body = await req.json();
    const parseResult = onboardSellerSchema.safeParse(body);

    if (!parseResult.success) {
      throw AppError.badRequest("Validation failed", parseResult.error.flatten().fieldErrors);
    }

    const profile = await sellerService.onboardSeller(user.id, parseResult.data);

    return NextResponse.json(
      {
        profile,
        message: "Seller onboarding completed successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    return toProblemResponse(error, "/api/sellers/onboard");
  }
}

