import { NextResponse } from "next/server";
import { authService } from "@backend/modules/identity/application/auth-service";
import { getSessionCookie } from "@backend/modules/identity/infrastructure/session-cookie";
import { isSeller } from "@backend/modules/identity/domain/rbac";
import { catalogService } from "@backend/modules/catalog/application/catalog-service";
import { AppError, toProblemResponse } from "@/lib/errors/api-error";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = getSessionCookie();
    if (!token) throw AppError.unauthorized("Authentication required");

    const user = await authService.validateSession(token);
    if (!user) throw AppError.unauthorized("Session expired or invalid");
    if (!isSeller(user) || !user.sellerProfileId) {
      throw AppError.forbidden("Access denied");
    }

    const updatedBook = await catalogService.submitForModeration(
      user.sellerProfileId,
      params.id
    );

    return NextResponse.json(
      {
        book: updatedBook,
        message: "Book submitted for moderation successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    return toProblemResponse(error, `/api/catalog/books/${params.id}/submit`);
  }
}

