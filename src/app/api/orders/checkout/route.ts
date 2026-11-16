import { NextRequest, NextResponse } from "next/server";
import { authService } from "@backend/modules/identity/application/auth-service";
import { getSessionCookie } from "@backend/modules/identity/infrastructure/session-cookie";
import { orderService } from "@backend/modules/orders/application/order-service";
import { AppError, toProblemResponse } from "@/lib/errors/api-error";

export async function POST(req: NextRequest) {
  try {
    const token = getSessionCookie();
    if (!token) throw AppError.unauthorized("Authentication required");

    const user = await authService.validateSession(token);
    if (!user) throw AppError.unauthorized("Session expired or invalid");

    const body = await req.json().catch(() => ({}));
    const currency = body.currency || "ETB";

    const order = await orderService.createOrderFromCart(user.id, currency);

    return NextResponse.json(
      {
        order,
        message: "Order placed successfully. Proceed to payment.",
      },
      { status: 201 }
    );
  } catch (error) {
    return toProblemResponse(error, "/api/orders/checkout");
  }
}

