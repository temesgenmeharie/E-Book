import { NextRequest, NextResponse } from "next/server";
import { authService } from "@backend/modules/identity/application/auth-service";
import { getSessionCookie } from "@backend/modules/identity/infrastructure/session-cookie";
import { isSeller } from "@backend/modules/identity/domain/rbac";
import { catalogService } from "@backend/modules/catalog/application/catalog-service";
import { createBookDraftSchema } from "@backend/modules/catalog/application/dto";
import { AppError, toProblemResponse } from "@/lib/errors/api-error";

export async function POST(req: NextRequest) {
  try {
    const token = getSessionCookie();
    if (!token) throw AppError.unauthorized("Authentication required");

    const user = await authService.validateSession(token);
    if (!user) throw AppError.unauthorized("Session expired or invalid");
    if (!isSeller(user) || !user.sellerProfileId) {
      throw AppError.forbidden("Only authors or publishers can create book listings.");
    }

    const body = await req.json();
    const parseResult = createBookDraftSchema.safeParse(body);

    if (!parseResult.success) {
      throw AppError.badRequest("Validation failed", parseResult.error.flatten().fieldErrors);
    }

    const book = await catalogService.createBookDraft(user.sellerProfileId, parseResult.data);

    return NextResponse.json(
      {
        book,
        message: "Book draft created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    return toProblemResponse(error, "/api/catalog/books");
  }
}

export async function GET() {
  try {
    const token = getSessionCookie();
    if (!token) throw AppError.unauthorized("Authentication required");

    const user = await authService.validateSession(token);
    if (!user) throw AppError.unauthorized("Session expired or invalid");
    if (!isSeller(user) || !user.sellerProfileId) {
      throw AppError.forbidden("Access denied");
    }

    const books = await catalogService.getSellerBooks(user.sellerProfileId);
    return NextResponse.json({ books }, { status: 200 });
  } catch (error) {
    return toProblemResponse(error, "/api/catalog/books");
  }
}

