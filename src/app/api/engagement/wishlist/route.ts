import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/modules/identity/application/auth-service";
import { getSessionCookie } from "@/modules/identity/infrastructure/session-cookie";
import { engagementService } from "@/modules/engagement/application/engagement-service";
import { AppError, toProblemResponse } from "@/lib/errors/api-error";

export async function POST(req: NextRequest) {
  try {
    const token = getSessionCookie();
    if (!token) throw AppError.unauthorized("Authentication required");

    const user = await authService.validateSession(token);
    if (!user) throw AppError.unauthorized("Session expired or invalid");

    const { bookId } = await req.json();
    if (!bookId) throw AppError.badRequest("bookId is required");

    const result = await engagementService.toggleWishlist(user.id, bookId);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return toProblemResponse(error, "/api/engagement/wishlist");
  }
}

export async function GET() {
  try {
    const token = getSessionCookie();
    if (!token) throw AppError.unauthorized("Authentication required");

    const user = await authService.validateSession(token);
    if (!user) throw AppError.unauthorized("Session expired or invalid");

    const wishlist = await engagementService.getUserWishlist(user.id);
    return NextResponse.json({ wishlist }, { status: 200 });
  } catch (error) {
    return toProblemResponse(error, "/api/engagement/wishlist");
  }
}
