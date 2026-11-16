import { NextResponse } from "next/server";
import { authService } from "@backend/modules/identity/application/auth-service";
import { getSessionCookie } from "@backend/modules/identity/infrastructure/session-cookie";
import { cartService } from "@backend/modules/cart/application/cart-service";
import { AppError, toProblemResponse } from "@/lib/errors/api-error";

export async function DELETE(
  _req: Request,
  { params }: { params: { bookId: string } }
) {
  try {
    const token = getSessionCookie();
    if (!token) throw AppError.unauthorized("Authentication required");

    const user = await authService.validateSession(token);
    if (!user) throw AppError.unauthorized("Session expired or invalid");

    await cartService.removeItem(user.id, params.bookId);
    return NextResponse.json({ message: "Item removed from cart" }, { status: 200 });
  } catch (error) {
    return toProblemResponse(error, `/api/cart/items/${params.bookId}`);
  }
}

