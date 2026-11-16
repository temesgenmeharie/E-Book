import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/modules/identity/application/auth-service";
import { getSessionCookie } from "@/modules/identity/infrastructure/session-cookie";
import { cartService } from "@/modules/cart/application/cart-service";
import { AppError, toProblemResponse } from "@/lib/errors/api-error";

export async function GET(req: NextRequest) {
  try {
    const token = getSessionCookie();
    if (!token) throw AppError.unauthorized("Authentication required");

    const user = await authService.validateSession(token);
    if (!user) throw AppError.unauthorized("Session expired or invalid");

    const currency = req.nextUrl.searchParams.get("currency") || "ETB";
    const cart = await cartService.getCart(user.id, currency);

    return NextResponse.json({ cart }, { status: 200 });
  } catch (error) {
    return toProblemResponse(error, "/api/cart");
  }
}
