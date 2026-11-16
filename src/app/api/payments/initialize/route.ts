import { NextRequest, NextResponse } from "next/server";
import { authService } from "@backend/modules/identity/application/auth-service";
import { getSessionCookie } from "@backend/modules/identity/infrastructure/session-cookie";
import { paymentService } from "@backend/modules/payments/application/payment-service";
import { PaymentProvider } from "@prisma/client";
import { AppError, toProblemResponse } from "@/lib/errors/api-error";

export async function POST(req: NextRequest) {
  try {
    const token = getSessionCookie();
    if (!token) throw AppError.unauthorized("Authentication required");

    const user = await authService.validateSession(token);
    if (!user) throw AppError.unauthorized("Session expired or invalid");

    const { orderId, provider } = await req.json();
    if (!orderId || !provider) {
      throw AppError.badRequest("orderId and provider are required");
    }

    const result = await paymentService.initializeCheckout({
      orderId,
      userId: user.id,
      provider: provider as PaymentProvider,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return toProblemResponse(error, "/api/payments/initialize");
  }
}

