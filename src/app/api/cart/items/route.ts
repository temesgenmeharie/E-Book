import { NextRequest, NextResponse } from "next/server";
import { authService } from "@backend/modules/identity/application/auth-service";
import { getSessionCookie } from "@backend/modules/identity/infrastructure/session-cookie";
import { cartService } from "@backend/modules/cart/application/cart-service";
import { AppError, toProblemResponse } from "@/lib/errors/api-error";

export async function POST(req: NextRequest) {
  try {
    const token = getSessionCookie();
    if (!token) throw AppError.unauthorized("Authentication required");

    const user = await authService.validateSession(token);
    if (!user) throw AppError.unauthorized("Session expired or invalid");

    const { bookId } = await req.json();
    if (!bookId) throw AppError.badRequest("bookId is required");

    const item = await cartService.addItem(user.id, bookId);
    return NextResponse.json({ item, message: "Added to cart" }, { status: 201 });
  } catch (error) {
    return toProblemResponse(error, "/api/cart/items");
  }
}

