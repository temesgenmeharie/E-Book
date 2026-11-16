import { NextRequest, NextResponse } from "next/server";
import { authService } from "@backend/modules/identity/application/auth-service";
import { getSessionCookie } from "@backend/modules/identity/infrastructure/session-cookie";
import { isSeller } from "@backend/modules/identity/domain/rbac";
import { catalogService } from "@backend/modules/catalog/application/catalog-service";
import { attachBookFileSchema } from "@backend/modules/catalog/application/dto";
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
    if (!isSeller(user) || !user.sellerProfileId) {
      throw AppError.forbidden("Access denied");
    }

    const body = await req.json();
    const parseResult = attachBookFileSchema.safeParse(body);

    if (!parseResult.success) {
      throw AppError.badRequest("Validation failed", parseResult.error.flatten().fieldErrors);
    }

    const file = await catalogService.attachBookFile(
      user.sellerProfileId,
      params.id,
      parseResult.data
    );

    return NextResponse.json(
      {
        file: {
          ...file,
          sizeBytes: file.sizeBytes.toString(),
        },
        message: "File attached successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    return toProblemResponse(error, `/api/catalog/books/${params.id}/files`);
  }
}

